"""Import official structured leaderboard assets without altering existing raw evidence."""

import csv
import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
RECORDS_PATH = ROOT / "data" / "evaluation_records.json"
MODELS_PATH = ROOT / "data" / "models.json"
SNAPSHOTS_PATH = ROOT / "data" / "leaderboard_snapshots.json"
LCB_SOURCE = RAW / "livecodebench-performances-generation-2026-09-21.json"
BFCL_SOURCE = RAW / "bfcl-v4-overall-2025-12-16.csv"
LONGBENCH_SOURCE = RAW / "longbench-v2-leaderboard-2026-09-21.html"


def load_json(path):
    return json.loads(path.read_text())


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def number(value):
    if value is None:
        return None
    normalized = str(value).replace("%", "").strip()
    if normalized in ("", "N/A", "-"):
        return None
    return float(normalized)


def iso_from_ms(value):
    return datetime.fromtimestamp(int(value) / 1000, timezone.utc).date().isoformat()


def canonical_name(value):
    value = (value or "").strip()
    # Normalize only high-confidence public naming variants. Do not collapse product tiers.
    value = re.sub(r"(?i)^claude[- ](opus|sonnet|haiku)[- ](\d+(?:[-.]\d+)?)(.*)$", lambda m: f"Claude {m.group(2).replace('-', '.')} {m.group(1).title()}{m.group(3)}", value)
    value = re.sub(r"(?i)^claude[- ](\d+(?:[-.]\d+)?)[- ](opus|sonnet|haiku)(.*)$", lambda m: f"Claude {m.group(1).replace('-', '.')} {m.group(2).title()}{m.group(3)}", value)
    value = re.sub(r"(?i)^gpt[- ]", "GPT-", value)
    return value


def ensure_model(models, name, organization=None, release_date=None, source_id=None):
    models.setdefault(name, {
        "canonical_name": name,
        "raw_names": [name],
        "organization": organization,
        "organization_slug": None,
        "organization_country": None,
        "model_release_date": release_date,
        "open_weights": None,
        "reasoning_model": None,
        "source_model_id": source_id,
    })
    model = models[name]
    if organization and not model.get("organization"):
        model["organization"] = organization
    if release_date and not model.get("model_release_date"):
        model["model_release_date"] = release_date
    if source_id and not model.get("source_model_id"):
        model["source_model_id"] = source_id
    return model


def import_livecodebench(records, models, snapshots):
    source = load_json(LCB_SOURCE)
    snapshot_id = "livecodebench_generation_official_2025-04-07"
    snapshots[:] = [s for s in snapshots if s["snapshot_id"] != snapshot_id]
    snapshots.append({
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["livecodebench"],
        "snapshot_at": "2025-04-07T00:00:00+00:00",
        "benchmark_version": "LiveCodeBench official generation leaderboard data through 2025-04-07",
        "source_url": "https://raw.githubusercontent.com/LiveCodeBench/livecodebench.github.io/main/src/mocks/performances_generation.json",
        "source_type": "official_pages_json",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"models": len(source["models"]), "question_model_rows": len(source["performances"]), "metric": "mean pass@1 across official data asset"},
        "limitations": "LiveCodeBench scores depend on its rolling question window; this import freezes the official asset and aggregates its published pass@1 rows per model."
    })
    meta = {item["model_name"]: item for item in source["models"]}
    grouped = {}
    for row in source["performances"]:
        grouped.setdefault(row["model"], []).append(number(row.get("pass@1")))
    scored = []
    for model_id, values in grouped.items():
        vals = [v for v in values if v is not None]
        if vals:
            scored.append((model_id, sum(vals) / len(vals), len(vals)))
    scored.sort(key=lambda item: item[1], reverse=True)
    for rank, (model_id, score, question_count) in enumerate(scored, 1):
        item = meta.get(model_id, {})
        raw_name = item.get("model_repr") or model_id
        name = canonical_name(raw_name)
        release_date = iso_from_ms(item["release_date"]) if item.get("release_date") else None
        ensure_model(models, name, release_date=release_date, source_id=model_id)
        record = {
            "record_id": f"{snapshot_id}:livecodebench:{model_id}", "snapshot_id": snapshot_id, "benchmark_id": "livecodebench",
            "model_raw_name": raw_name, "model_canonical_name": name, "model_family": name, "model_variant": raw_name,
            "organization": None, "rank": rank, "score": round(score, 4), "metric_name": "mean pass@1",
            "metric_protocol": "LiveCodeBench official generation asset; mean pass@1 across all published question rows through 2025-04-07; higher is better",
            "run_date": "2025-04-07", "model_release_date": release_date, "agent_harness": None, "tool_access": None,
            "max_steps": None, "reasoning_effort": "Encoded in official model display name where applicable", "context_length": None,
            "evidence_level": "A", "source_url": "https://raw.githubusercontent.com/LiveCodeBench/livecodebench.github.io/main/src/mocks/performances_generation.json",
            "source_field": "performances[].pass@1", "is_estimated": False,
            "ingestion_note": "Aggregated from the official LiveCodeBench Pages source; raw per-question rows retained under data/raw.",
            "extra_fields": {"model_id": model_id, "question_count": question_count, "model_style": item.get("model_style"), "source_release_date": release_date},
        }
        records[record["record_id"]] = record


def strip_tags(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def import_longbench_v2(records, models, snapshots):
    snapshot_id = "longbench_v2_official_2025-05-06"
    snapshots[:] = [s for s in snapshots if s["snapshot_id"] != snapshot_id]
    html = LONGBENCH_SOURCE.read_text()
    table = re.search(r'<table[^>]+id="results"[^>]*>(.*?)</table>', html, re.S)
    if not table:
        raise RuntimeError("LongBench v2 official leaderboard table not found")
    parsed = []
    for row_html in re.findall(r"<tr>(.*?)</tr>", table.group(1), re.S):
        cells = [strip_tags(cell) for cell in re.findall(r"<td[^>]*>(.*?)</td>", row_html, re.S)]
        if len(cells) < 17:
            continue
        raw_name, org, source_url = None, None, None
        model_cell = re.findall(r"<td[^>]*>(.*?)</td>", row_html, re.S)[1]
        link = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>', model_cell, re.S)
        if link:
            source_url, raw_name = unescape(link.group(1)), strip_tags(link.group(2)).replace("🧠", "").strip()
        else:
            raw_name = cells[1].replace("🧠", "").strip()
        org_match = re.search(r'<p[^>]*>(.*?)</p>', model_cell, re.S)
        org = strip_tags(org_match.group(1)) if org_match else None
        if org and raw_name.endswith(" " + org):
            raw_name = raw_name[:-(len(org) + 1)].strip()
        # Column 6 is Overall w/ CoT; w/o CoT can be absent for native reasoning models.
        score = number(cells[6])
        if raw_name and score is not None:
            parsed.append((raw_name, org, cells[4], cells[3], score, source_url, cells[5]))
    parsed.sort(key=lambda item: item[4], reverse=True)
    snapshots.append({
        "snapshot_id": snapshot_id, "benchmark_ids": ["longbench_v2"], "snapshot_at": "2025-05-06T00:00:00+00:00",
        "benchmark_version": "LongBench v2 official leaderboard, w/ CoT", "source_url": "https://longbench2.github.io/",
        "source_type": "official_leaderboard_html", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(parsed), "metric": "Overall accuracy w/ CoT", "captured_from": "official website"},
        "limitations": "LongBench v2 has distinct w/o CoT and w/ CoT tracks. This import uses w/ CoT as the official default view and retains that protocol; entries must not be averaged with w/o CoT."
    })
    for rank, (raw_name, org, release_date, context_length, score, source_url, wocot_score) in enumerate(parsed, 1):
        name = canonical_name(raw_name)
        ensure_model(models, name, organization=org, release_date=release_date if re.fullmatch(r"\d{4}-\d{2}-\d{2}", release_date or "") else None, source_id=raw_name)
        record = {
            "record_id": f"{snapshot_id}:longbench_v2:{rank}", "snapshot_id": snapshot_id, "benchmark_id": "longbench_v2",
            "model_raw_name": raw_name, "model_canonical_name": name, "model_family": name, "model_variant": raw_name,
            "organization": org, "rank": rank, "score": score, "metric_name": "Overall accuracy w/ CoT",
            "metric_protocol": "LongBench v2 official leaderboard w/ CoT track; higher is better", "run_date": "2025-05-06",
            "model_release_date": release_date if re.fullmatch(r"\d{4}-\d{2}-\d{2}", release_date or "") else None,
            "agent_harness": None, "tool_access": None, "max_steps": None, "reasoning_effort": "w/ CoT", "context_length": context_length,
            "evidence_level": "A", "source_url": "https://longbench2.github.io/", "source_field": "Leaderboard Overall (%) w/ CoT",
            "is_estimated": False, "ingestion_note": "Parsed from the official LongBench v2 leaderboard HTML; w/o CoT is retained only as a supplemental field.",
            "extra_fields": {"w_o_cot_overall": number(wocot_score), "model_url": source_url},
        }
        records[record["record_id"]] = record


def import_bfcl(records, models, snapshots):
    snapshot_id = "bfcl_v4_official_2025-12-16"
    snapshots[:] = [s for s in snapshots if s["snapshot_id"] != snapshot_id]
    rows = list(csv.DictReader(BFCL_SOURCE.open()))
    snapshots.append({
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["bfcl_v4"], "snapshot_at": "2025-12-16T00:00:00+00:00",
        "benchmark_version": "BFCL V4 official result archive 2025-12-16", "source_url": "https://raw.githubusercontent.com/HuanzhiMao/BFCL-Result/main/2025-12-16/score/data_overall.csv",
        "source_type": "official_result_archive_csv", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(rows), "metric": "Overall Acc", "archive": "HuanzhiMao/BFCL-Result"},
        "limitations": "Rows may differ by FC/Prompt calling protocol and reasoning mode. These are retained as configuration metadata and must not be averaged across protocols."
    })
    for row in rows:
        raw_name = row["Model"].strip()
        name = canonical_name(raw_name)
        org = row.get("Organization") or None
        ensure_model(models, name, organization=org, source_id=raw_name)
        record = {
            "record_id": f"{snapshot_id}:bfcl_v4:{row['Rank']}", "snapshot_id": snapshot_id, "benchmark_id": "bfcl_v4",
            "model_raw_name": raw_name, "model_canonical_name": name, "model_family": name, "model_variant": raw_name,
            "organization": org, "rank": int(row["Rank"]), "score": number(row["Overall Acc"]), "metric_name": "Overall Acc",
            "metric_protocol": "BFCL V4 official Overall Acc; archive row protocol (e.g. FC/Prompt) retained in model variant; higher is better",
            "run_date": "2025-12-16", "model_release_date": None, "agent_harness": "BFCL V4", "tool_access": "Function calling protocol encoded in model name",
            "max_steps": None, "reasoning_effort": None, "context_length": None, "evidence_level": "A",
            "source_url": "https://raw.githubusercontent.com/HuanzhiMao/BFCL-Result/main/2025-12-16/score/data_overall.csv",
            "source_field": "Overall Acc", "is_estimated": False,
            "ingestion_note": "Imported from the BFCL official result archive; FC/Prompt and other protocol variants remain traceable in raw name.",
            "extra_fields": {"model_link": row.get("Model Link"), "license": row.get("License"), "total_cost_usd": number(row.get("Total Cost ($)")), "live_acc": number(row.get("Live Acc")), "multi_turn_acc": number(row.get("Multi Turn Acc"))},
        }
        records[record["record_id"]] = record


def main():
    records = {record["record_id"]: record for record in load_json(RECORDS_PATH)}
    models = {model["canonical_name"]: model for model in load_json(MODELS_PATH)}
    snapshots = load_json(SNAPSHOTS_PATH)
    import_livecodebench(records, models, snapshots)
    import_bfcl(records, models, snapshots)
    import_longbench_v2(records, models, snapshots)
    ordered_records = sorted(records.values(), key=lambda r: (r["benchmark_id"], r.get("rank") or 10**9, r["model_canonical_name"]))
    # Models metadata is a derived union of scored records; never retain stale aliases after re-normalization.
    scored_names = {record["model_canonical_name"] for record in ordered_records}
    write_json(RECORDS_PATH, ordered_records)
    write_json(MODELS_PATH, sorted((model for name, model in models.items() if name in scored_names), key=lambda item: item["canonical_name"].lower()))
    write_json(SNAPSHOTS_PATH, snapshots)
    print(json.dumps({"records": len(records), "models": len(models), "snapshots": len(snapshots), "livecodebench_records": sum(r["benchmark_id"] == "livecodebench" for r in records.values()), "bfcl_records": sum(r["benchmark_id"] == "bfcl_v4" for r in records.values())}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
