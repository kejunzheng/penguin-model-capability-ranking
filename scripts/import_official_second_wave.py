"""Import additional official/maintainer leaderboard snapshots with raw evidence retained."""
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


def read_json(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def number(value):
    if value is None:
        return None
    value = str(value).replace("%", "").replace("\\|", "|").strip()
    if value in ("", "-", "--", "N/A"):
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value)
    return float(match.group(0)) if match else None


def canonical_name(value):
    value = re.sub(r"\s+", " ", (value or "").strip())
    value = re.sub(r"[🥇🥈🥉🖼️🤖]", "", value).strip()
    value = re.sub(r"(?i)^claude[- ](opus|sonnet|haiku)[- ](\d+(?:[-.]\d+)?)(.*)$", lambda m: f"Claude {m.group(2).replace('-', '.')} {m.group(1).title()}{m.group(3)}", value)
    value = re.sub(r"(?i)^claude[- ](\d+(?:[-.]\d+)?)[- ](opus|sonnet|haiku)(.*)$", lambda m: f"Claude {m.group(1).replace('-', '.')} {m.group(2).title()}{m.group(3)}", value)
    return value


def ensure_model(models, name, organization=None, release_date=None, source_id=None):
    models.setdefault(name, {
        "canonical_name": name, "raw_names": [name], "organization": organization,
        "organization_slug": None, "organization_country": None, "model_release_date": release_date,
        "open_weights": None, "reasoning_model": None, "source_model_id": source_id,
    })
    item = models[name]
    if organization and not item.get("organization"):
        item["organization"] = organization
    if release_date and not item.get("model_release_date"):
        item["model_release_date"] = release_date
    return item


def add_snapshot(snapshots, item):
    snapshots[:] = [x for x in snapshots if x["snapshot_id"] != item["snapshot_id"]]
    snapshots.append(item)


def record(snapshot_id, benchmark_id, index, raw_name, rank, score, metric_name, protocol, source_url, *, org=None, release_date=None, run_date=None, evidence="A", extra=None, note=None, reasoning_effort=None, agent_harness=None):
    name = canonical_name(raw_name)
    return {
        "record_id": f"{snapshot_id}:{benchmark_id}:{index}", "snapshot_id": snapshot_id, "benchmark_id": benchmark_id,
        "model_raw_name": raw_name, "model_canonical_name": name, "model_family": name, "model_variant": raw_name,
        "organization": org, "rank": rank, "score": score, "metric_name": metric_name, "metric_protocol": protocol,
        "run_date": run_date, "model_release_date": release_date, "agent_harness": agent_harness, "tool_access": None,
        "max_steps": None, "reasoning_effort": reasoning_effort, "context_length": None, "evidence_level": evidence,
        "source_url": source_url, "source_field": metric_name, "is_estimated": False,
        "ingestion_note": note or "Imported from a frozen official or benchmark-maintainer source file retained in data/raw.",
        "extra_fields": extra or {},
    }


def parse_simple_yaml_blocks(path):
    blocks, current = [], None
    for line in path.read_text().splitlines():
        if line.startswith("- "):
            if current:
                blocks.append(current)
            current = {}
            line = line[2:]
        if current is not None and ":" in line:
            key, value = line.strip().split(":", 1)
            current[key] = value.strip().strip('"')
    if current:
        blocks.append(current)
    return blocks


def import_aider(records, models, snapshots):
    source = RAW / "aider-polyglot-leaderboard-2026-09-21.yml"
    rows = parse_simple_yaml_blocks(source)
    snapshot_id = "aider_polyglot_official_2026-09-21"
    url = "https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml"
    valid = [x for x in rows if number(x.get("pass_rate_2")) is not None and "+" not in x.get("model", "")]
    valid.sort(key=lambda x: number(x["pass_rate_2"]), reverse=True)
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["aider_polyglot"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "Aider Polyglot maintainer leaderboard YAML", "source_url": url, "source_type": "official_repository_yaml", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(valid), "metric": "pass_rate_2"}, "limitations": "Scores depend on Aider version, edit format, test date and model reasoning settings. Multi-model editor combinations are excluded from the default single-model import."})
    for rank, row in enumerate(valid, 1):
        raw = row["model"]
        item = record(snapshot_id, "aider_polyglot", rank, raw, rank, number(row["pass_rate_2"]), "pass_rate_2", "Aider Polyglot; 225 cases; two edit attempts; higher is better", url, run_date=row.get("date"), agent_harness=f"Aider {row.get('versions') or 'unspecified'}", reasoning_effort="encoded in model name", extra={"edit_format": row.get("edit_format"), "test_cases": number(row.get("test_cases")), "pass_rate_1": number(row.get("pass_rate_1")), "commit_hash": row.get("commit_hash"), "seconds_per_case": number(row.get("seconds_per_case")), "total_cost_usd": number(row.get("total_cost"))})
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], source_id=raw)


def import_mmlu(records, models, snapshots):
    source = RAW / "mmlu-pro-results-2026-09-21.csv"
    rows = [x for x in csv.DictReader(source.open()) if number(x.get("Overall")) is not None]
    rows.sort(key=lambda x: number(x["Overall"]), reverse=True)
    snapshot_id = "mmlu_pro_official_submission_2026-09-21"
    url = "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["mmlu_pro"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "MMLU-Pro official leaderboard submission dataset", "source_url": url, "source_type": "official_dataset_csv", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(rows), "metric": "Overall"}, "limitations": "The maintainer dataset contains both TIGER-Lab runs and self-reported submissions. Self-reported rows are retained with B evidence and must not be treated as identical to maintainer-run results."})
    for rank, row in enumerate(rows, 1):
        raw = row["Models"]
        source_kind = row.get("Data Source") or "Unknown"
        evidence = "A" if source_kind == "TIGER-Lab" else "B"
        item = record(snapshot_id, "mmlu_pro", rank, raw, rank, number(row["Overall"]), "Overall accuracy", "MMLU-Pro official submission table; higher is better", url, evidence=evidence, extra={"data_source": source_kind, "model_size_b": row.get("Model Size(B)"), "subjects": {key: number(value) for key, value in row.items() if key not in {"Models", "Data Source", "Model Size(B)", "Overall"}}}, note="Official MMLU-Pro submission table. Evidence level distinguishes maintainer-run from self-reported rows.")
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], source_id=raw)


def markdown_cells(line):
    return [x.strip() for x in line.strip().strip("|").split("|")]


def clean_markdown(text):
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[*_`]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def import_mathvista(records, models, snapshots):
    lines = (RAW / "mathvista-readme-2026-09-21.md").read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("| **#**") and "**ALL**" in line)
    parsed = []
    for line in lines[start + 2:]:
        if not line.startswith("|"):
            break
        cells = markdown_cells(line)
        if len(cells) < 6 or cells[0] in {"-", ""}:
            continue
        rank = int(cells[0]) if cells[0].isdigit() else None
        score = number(clean_markdown(cells[5]))
        if rank and score is not None:
            parsed.append((rank, clean_markdown(cells[1]), clean_markdown(cells[4]), score, clean_markdown(cells[2])))
    snapshot_id = "mathvista_official_testmini_2026-09-21"
    url = "https://raw.githubusercontent.com/lupantech/MathVista/main/README.md"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["mathvista"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "MathVista official README leaderboard, testmini", "source_url": url, "source_type": "official_repository_markdown", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(parsed), "metric": "ALL"}, "limitations": "This is the official testmini leaderboard. Methods and submissions vary; detailed cells are not averaged or inferred."})
    for rank, raw, released, score, method in parsed:
        release = released if re.fullmatch(r"\d{4}-\d{2}-\d{2}", released) else None
        item = record(snapshot_id, "mathvista", rank, raw, rank, score, "ALL", "MathVista official testmini leaderboard; ALL; higher is better", url, release_date=release, run_date="2026-09-21", extra={"method": method})
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], release_date=release, source_id=raw)


def import_videommmu(records, models, snapshots):
    lines = (RAW / "videommmu-readme-2026-09-21.md").read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("| Model | Overall"))
    parsed = []
    for line in lines[start + 2:]:
        if not line.startswith("|"):
            break
        cells = markdown_cells(line)
        if len(cells) < 5:
            continue
        raw = clean_markdown(cells[0])
        score = number(clean_markdown(cells[1]).split("|")[0])
        if score is not None:
            parsed.append((raw, score, [number(clean_markdown(x)) for x in cells[2:5]]))
    parsed.sort(key=lambda x: x[1], reverse=True)
    snapshot_id = "videommmu_official_2026-09-21"
    url = "https://raw.githubusercontent.com/EvolvingLMMs-Lab/VideoMMMU/main/README.md"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["videommmu"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "VideoMMMU maintainer README leaderboard", "source_url": url, "source_type": "official_repository_markdown", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(parsed), "metric": "Overall"}, "limitations": "The official table has incomplete sub-scores for some rows and mixed submission provenance. Overall is retained without filling absent sub-scores."})
    for rank, (raw, score, sub) in enumerate(parsed, 1):
        item = record(snapshot_id, "videommmu", rank, raw, rank, score, "Overall", "VideoMMMU official leaderboard; Overall; higher is better", url, run_date="2026-09-21", extra={"perception": sub[0], "comprehension": sub[1], "adaptation": sub[2]})
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], source_id=raw)


def import_osworld_v2(records, models, snapshots):
    source = RAW / "osworld-v2-official-results-2026-09-21.json"
    payload = read_json(source)
    # Freeze the current declared full-set v2.1 / 500-step view; no averaging across effort, tool or release variants.
    rows = [x for x in payload["results"] if x.get("stepBudget") == 500 and x.get("releaseVersion") == "v2.1" and x.get("datasetScope") == "full" and number(x.get("binaryAccuracy")) is not None]
    rows.sort(key=lambda x: number(x["binaryAccuracy"]), reverse=True)
    snapshot_id = "osworld_v2_official_v21_2026-09-21"
    url = "https://osworld-v2.xlang.ai/static/data/leaderboard/official-results.json"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["osworld_2"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "OSWorld 2.0 v2.1 official results", "source_url": url, "source_type": "official_leaderboard_json", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(rows), "metric": "binaryAccuracy", "filter": "v2.1; full set; 500 steps"}, "limitations": "OSWorld 2.0 values change by release version, dataset scope, step budget, reasoning setting and tool mode. Only the stated current v2.1/full/500-step protocol is imported; no variants are averaged."})
    for rank, row in enumerate(rows, 1):
        raw = row["model"]
        item = record(snapshot_id, "osworld_2", rank, raw, rank, number(row["binaryAccuracy"]), "Binary accuracy", "OSWorld 2.0; v2.1; full set; 500 steps; higher is better", url, org=row.get("modelFamily"), run_date=payload.get("updatedAt"), agent_harness="OSWorld 2.0", reasoning_effort=row.get("reasoning"), extra={"partial_score": number(row.get("partialScore")), "tool_setting": row.get("toolSetting"), "release_version": row.get("releaseVersion"), "dataset_scope": row.get("datasetScope"), "estimated_cost_usd": number(row.get("estimatedCostUsd")), "official": row.get("official")})
        item["max_steps"] = 500
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=row.get("modelFamily"), source_id=raw)


def import_osworld(records, models, snapshots):
    from openpyxl import load_workbook
    source = RAW / "osworld-verified-results-2026-09-21.xlsx"
    ws = load_workbook(source, read_only=True, data_only=True).active
    rows = list(ws.values)
    header = rows[0]
    data = [dict(zip(header, values)) for values in rows[1:] if values[0]]
    # Exact no-extra-tools, single-rollout, 100-step slice is the largest complete standard-protocol cohort.
    data = [x for x in data if x["Max steps"] == 100 and x["Additional a11y tree used"] == "No" and x["Additional coding-based action"] == "No" and x["Multiple rollout"] == "No" and number(x["Success rate"]) is not None]
    data.sort(key=lambda x: number(x["Success rate"]), reverse=True)
    snapshot_id = "osworld_verified_official_2026-09-21"
    url = "https://os-world.github.io/static/data/osworld_verified_results.xlsx"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["osworld"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "OSWorld-Verified official result table", "source_url": url, "source_type": "official_leaderboard_xlsx", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(data), "metric": "Success rate", "filter": "100 steps; no accessibility tree; no coding action; single rollout"}, "limitations": "OSWorld results vary materially with step budget, extra tool access and rollout count. This import uses only the declared no-extra-tools, single-rollout, 100-step cohort; other official configurations are deliberately excluded from default ranking."})
    for rank, row in enumerate(data, 1):
        raw = str(row["Model"]).strip()
        run_date = row["Date"].date().isoformat() if hasattr(row.get("Date"), "date") else str(row.get("Date") or "")
        item = record(snapshot_id, "osworld", rank, raw, rank, number(row["Success rate"]), "Success rate", "OSWorld-Verified; 100 steps; no extra accessibility tree; no coding action; single rollout; higher is better", url, org=row.get("Institution"), run_date=run_date, agent_harness="OSWorld-Verified", extra={"success_total": row.get("Success/Total"), "approach_type": row.get("Approach type"), "max_steps": row.get("Max steps"), "accessibility_tree": row.get("Additional a11y tree used"), "coding_action": row.get("Additional coding-based action"), "multiple_rollout": row.get("Multiple rollout"), "paper_link": row.get("PaperLink")})
        item["max_steps"] = 100
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=row.get("Institution"), source_id=raw)


def import_arc_agi_2(records, models, snapshots):
    evaluations = read_json(RAW / "arc-agi-evaluations-2026-09-21.json")
    model_meta = {x["id"]: x for x in read_json(RAW / "arc-agi-models-2026-09-21.json")}
    # Public leaderboard's ARC-AGI-2 semi-private evaluation slice; remove the human reference row.
    rows = [x for x in evaluations if x.get("datasetId") == "v2_Semi_Private" and x.get("display") and x.get("score") is not None and x.get("modelId") != "2025_human_panel"]
    rows.sort(key=lambda x: number(x["score"]), reverse=True)
    snapshot_id = "arc_agi_2_official_v2_semi_private_2026-09-21"
    url = "https://arcprize.org/media/data/evaluations.json"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["arc_agi_2"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "ARC-AGI-2 v2_Semi_Private official leaderboard data", "source_url": url, "source_type": "official_leaderboard_json", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(rows), "metric": "score", "dataset_id": "v2_Semi_Private"}, "limitations": "ARC-AGI-2 result rows represent distinct effort, tool and provider-adapter configurations. This source is imported as official evidence; SKU derivation must treat those controls as configuration, not separate products."})
    for rank, row in enumerate(rows, 1):
        meta = model_meta.get(row["modelId"], {})
        raw = meta.get("displayName") or row["modelId"]
        item = record(snapshot_id, "arc_agi_2", rank, raw, rank, number(row["score"]) * 100, "Accuracy (%)", "ARC-AGI-2 v2 semi-private; official displayed results; higher is better", url, org=meta.get("providerId"), release_date=(meta.get("modelReleaseDate") or "")[:10] or None, run_date="2026-09-21", reasoning_effort=re.search(r"\(([^)]+)\)", raw).group(1) if re.search(r"\(([^)]+)\)", raw) else None, extra={"model_id": row["modelId"], "cost_per_task_usd": number(row.get("costPerTask")), "result_url": row.get("resultsUrl"), "model_group": meta.get("modelGroup"), "model_type": meta.get("modelType")}, note="Imported from ARC Prize's official evaluations.json plus models.json. The result is a v2 semi-private evaluation row; effort/configuration remains explicit.")
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=meta.get("providerId"), release_date=item["model_release_date"], source_id=row["modelId"])


def import_ruler(records, models, snapshots):
    """Import the frozen maintainer README result table without inferring missing protocol fields."""
    text = (RAW / "ruler-readme-2026-09-21.md").read_text()
    # The README's initial Llama2 line is malformed, while each subsequent data row starts with a model link.
    # Parse only complete model rows and retain the declared decreasing-length weighted average.
    rows = []
    for line in text.splitlines():
        if not line.startswith("["):
            continue
        cells = markdown_cells(line)
        if len(cells) < 11:
            continue
        raw = clean_markdown(cells[0])
        score = number(clean_markdown(cells[-1]))
        if raw and score is not None:
            rows.append((raw, score, clean_markdown(cells[1]), clean_markdown(cells[2]), number(clean_markdown(cells[-2]))))
    rows.sort(key=lambda item: item[1], reverse=True)
    snapshot_id = "ruler_maintainer_readme_2026-09-21"
    url = "https://raw.githubusercontent.com/Infini-AI-Lab/RULER/main/README.md"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["ruler"], "snapshot_at": "2026-09-21T00:00:00+08:00", "benchmark_version": "RULER maintainer README main-results table", "source_url": url, "source_type": "official_repository_markdown", "evidence_level": "B", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(rows), "metric": "wAvg. (dec)"}, "limitations": "This is the frozen maintainer README table, not a continuously maintained public submission leaderboard. Scores span 13 synthetic tasks and vary by context length, model template and inference configuration; the declared wAvg. (dec) column is retained without recomputation."})
    for rank, (raw, score, claimed, effective, weighted_inc) in enumerate(rows, 1):
        item = record(snapshot_id, "ruler", rank, raw, rank, score, "wAvg. (dec)", "RULER main results; 13 synthetic tasks; weighted average decreasing context length; higher is better", url, evidence="B", extra={"claimed_context_length": claimed, "effective_context_length": effective, "weighted_avg_increasing": weighted_inc}, note="Imported from the RULER maintainer README main-results table. This is historical benchmark evidence and should not be read as a current live leaderboard.")
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], source_id=raw)


def import_lmarena(records, models, snapshots):
    import pyarrow.parquet as pq
    source = RAW / "lmarena-text-latest-2026-09-21.parquet"
    rows = pq.read_table(source).to_pylist()
    rows = [x for x in rows if x.get("category") == "overall" and number(x.get("rank")) is not None]
    rows.sort(key=lambda x: number(x["rank"]))
    snapshot_id = "lmarena_text_official_2026-09-13"
    url = "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"
    add_snapshot(snapshots, {"snapshot_id": snapshot_id, "benchmark_ids": ["lmarena_text_overall"], "snapshot_at": "2026-09-13T00:00:00+00:00", "benchmark_version": "LMArena text/latest, category=overall", "source_url": url, "source_type": "official_dataset_parquet", "evidence_level": "A", "collected_at": datetime.now(timezone.utc).isoformat(), "source_meta": {"rows": len(rows), "metric": "Elo rating"}, "limitations": "LMArena is a dynamic crowdsourced blind-comparison leaderboard. This import freezes the text/latest overall slice; rating, vote count and confidence interval must be read together."})
    for index, row in enumerate(rows, 1):
        raw = row["model_name"]
        rank = int(number(row["rank"]))
        item = record(snapshot_id, "lmarena_text_overall", index, raw, rank, number(row.get("rating")), "Elo rating", "LMArena text/latest; category=overall; higher is better", url, org=row.get("organization"), run_date=row.get("leaderboard_publish_date"), extra={"vote_count": number(row.get("vote_count")), "rating_lower": number(row.get("rating_lower")), "rating_upper": number(row.get("rating_upper")), "variance": number(row.get("variance")), "license": row.get("license")})
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=row.get("organization"), source_id=raw)


def main():
    records = {x["record_id"]: x for x in read_json(RECORDS_PATH)}
    models = {x["canonical_name"]: x for x in read_json(MODELS_PATH)}
    snapshots = read_json(SNAPSHOTS_PATH)
    import_aider(records, models, snapshots)
    import_mmlu(records, models, snapshots)
    import_mathvista(records, models, snapshots)
    import_videommmu(records, models, snapshots)
    import_osworld(records, models, snapshots)
    import_osworld_v2(records, models, snapshots)
    import_arc_agi_2(records, models, snapshots)
    import_ruler(records, models, snapshots)
    import_lmarena(records, models, snapshots)
    ordered = sorted(records.values(), key=lambda x: (x["benchmark_id"], x.get("rank") or 10**9, x["model_canonical_name"]))
    scored_names = {x["model_canonical_name"] for x in ordered}
    write_json(RECORDS_PATH, ordered)
    write_json(MODELS_PATH, sorted((x for name, x in models.items() if name in scored_names), key=lambda x: x["canonical_name"].lower()))
    write_json(SNAPSHOTS_PATH, snapshots)
    print(json.dumps({"records": len(ordered), "models": len(scored_names), "snapshots": len(snapshots), "new": {b: sum(x["benchmark_id"] == b for x in ordered) for b in ["lmarena_text_overall", "aider_polyglot", "mmlu_pro", "mathvista", "videommmu", "osworld", "osworld_2", "arc_agi_2", "ruler"]}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
