"""Import Epoch-hosted SimpleQA Verified / FrontierMath and AndroidWorld official sheet.

This importer only consumes frozen raw files already retained under data/raw/:
- epoch-benchmarks-master-2026-09-21.csv
- androidworld-official-leaderboard-2026-09-21.csv

The imported rows preserve protocol-sensitive configuration in metric_protocol and extra_fields.
"""
import csv
import json
import math
import re
from datetime import datetime, timezone
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


def clean(value):
    return " ".join((value or "").strip().split())


def parse_float(value):
    if value is None:
        return None
    text = str(value).strip().replace("%", "")
    if not text:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    if math.isnan(number):
        return None
    return number


def ensure_model(models, name, organization=None, release_date=None, source_id=None, country=None, open_weights=None):
    if not name:
        return
    models.setdefault(name, {
        "canonical_name": name,
        "raw_names": [name],
        "organization": organization,
        "organization_slug": None,
        "organization_country": country,
        "model_release_date": release_date,
        "open_weights": open_weights,
        "reasoning_model": None,
        "source_model_id": source_id,
    })
    item = models[name]
    if organization and not item.get("organization"):
        item["organization"] = organization
    if release_date and not item.get("model_release_date"):
        item["model_release_date"] = release_date
    if country and not item.get("organization_country"):
        item["organization_country"] = country
    if open_weights is not None and item.get("open_weights") is None:
        item["open_weights"] = open_weights
    raw_names = item.setdefault("raw_names", [])
    if name not in raw_names:
        raw_names.append(name)


def add_snapshot(snapshots, item):
    snapshots[:] = [x for x in snapshots if x["snapshot_id"] != item["snapshot_id"]]
    snapshots.append(item)


def base_record(snapshot_id, benchmark_id, index, raw_name, rank, score, metric_name, protocol, source_url, **kwargs):
    name = clean(raw_name)
    return {
        "record_id": f"{snapshot_id}:{benchmark_id}:{index}",
        "snapshot_id": snapshot_id,
        "benchmark_id": benchmark_id,
        "model_raw_name": raw_name,
        "model_canonical_name": name,
        "model_family": kwargs.get("model_family") or name,
        "model_variant": raw_name,
        "organization": kwargs.get("organization"),
        "rank": rank,
        "score": score,
        "metric_name": metric_name,
        "metric_protocol": protocol,
        "run_date": kwargs.get("run_date"),
        "model_release_date": kwargs.get("release_date"),
        "agent_harness": kwargs.get("agent_harness"),
        "tool_access": kwargs.get("tool_access"),
        "max_steps": kwargs.get("max_steps"),
        "reasoning_effort": kwargs.get("reasoning_effort"),
        "context_length": None,
        "evidence_level": kwargs.get("evidence", "A"),
        "source_url": source_url,
        "source_field": metric_name,
        "is_estimated": False,
        "ingestion_note": kwargs.get("note", "Imported from a frozen public source retained in data/raw."),
        "extra_fields": kwargs.get("extra", {}),
    }


def import_epoch_benchmark(records, models, snapshots, *, task_name, benchmark_id, snapshot_id, version, source_url, metric_name, protocol, limitations, tool_access=None, agent_harness=None):
    source = RAW / "epoch-benchmarks-master-2026-09-21.csv"
    rows = []
    with source.open(newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("task") != task_name or row.get("Status") != "Success":
                continue
            score = parse_float(row.get("Best score (across scorers)"))
            if score is None:
                continue
            rows.append(row)
    rows.sort(key=lambda x: parse_float(x.get("Best score (across scorers)")) or -1, reverse=True)
    add_snapshot(snapshots, {
        "snapshot_id": snapshot_id,
        "benchmark_ids": [benchmark_id],
        "snapshot_at": "2026-09-21T00:00:00+08:00",
        "benchmark_version": version,
        "source_url": source_url,
        "source_type": "epoch_official_benchmark_hub_csv",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(rows), "metric": metric_name, "task": task_name, "raw_file": source.name},
        "limitations": limitations,
    })
    for rank, row in enumerate(rows, 1):
        raw_name = clean(row.get("Unique display name") or row.get("Display name") or row.get("Model") or row.get("model"))
        score = (parse_float(row.get("Best score (across scorers)")) or 0) * 100
        stderr = parse_float(row.get("stderr"))
        release_date = (row.get("Version release date") or row.get("Publication date") or "")[:10] or None
        run_date = (row.get("started_at") or "")[:10] or None
        reasoning_effort = None
        match = re.search(r"\(([^()]*)\)$", raw_name)
        if match:
            reasoning_effort = match.group(1)
        item = base_record(
            snapshot_id, benchmark_id, rank, raw_name, rank, score, metric_name, protocol, source_url,
            organization=row.get("Organization") or None,
            release_date=release_date,
            run_date=run_date,
            agent_harness=agent_harness,
            tool_access=tool_access,
            reasoning_effort=reasoning_effort,
            evidence="A",
            model_family=row.get("Model") or raw_name,
            extra={
                "epoch_run_id": row.get("id_runs"),
                "source_model_id": row.get("model"),
                "stderr_pct": stderr * 100 if stderr is not None else None,
                "log_viewer": row.get("log viewer"),
                "logs": row.get("logs"),
                "comments": row.get("comments"),
                "raw_task": task_name,
            },
            note="Official Epoch Benchmarking Hub row. Scores are imported as one frozen track; run configuration is preserved and not averaged with other tracks.",
        )
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=item["organization"], release_date=release_date, source_id=row.get("model"), country=row.get("Country (of organization)") or None)


def import_androidworld(records, models, snapshots):
    source = RAW / "androidworld-official-leaderboard-2026-09-21.csv"
    with source.open(newline="") as fh:
        raw_rows = list(csv.reader(fh))
    # Row 0 is an explicit warning banner. Row 1 is the actual header.
    header = [clean(x).replace("\n", " ") for x in raw_rows[1]]
    rows = []
    for values in raw_rows[2:]:
        row = dict(zip(header, values))
        score = parse_float(row.get("Success Rate (pass@1)"))
        if score is None or not clean(row.get("Model")):
            continue
        rows.append(row)
    rows.sort(key=lambda x: parse_float(x.get("Success Rate (pass@1)")) or -1, reverse=True)
    snapshot_id = "androidworld_official_sheet_2026-09-21"
    source_url = "https://docs.google.com/spreadsheets/d/1cchzP9dlTZ3WXQTfYNhh3avxoLipqHN75v1Tb86uhHo/edit?gid=0#gid=0"
    add_snapshot(snapshots, {
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["androidworld"],
        "snapshot_at": "2026-09-21T00:00:00+08:00",
        "benchmark_version": "AndroidWorld official community leaderboard; 116 tasks across 20 Android apps",
        "source_url": source_url,
        "source_type": "official_google_sheet_csv_export",
        "evidence_level": "C",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(rows), "metric": "Success Rate (pass@1)", "raw_file": source.name},
        "limitations": "AndroidWorld's official sheet explicitly warns that results are community-submitted and not independently verified. Imported as C-level Agent-system evidence; compare only with declared screen representation, trials, and submission notes.",
    })
    for rank, row in enumerate(rows, 1):
        raw_name = clean(row.get("Result Source") or row.get("Model"))
        model_detail = clean(row.get("Model"))
        release_date = None
        rd = clean(row.get("Release Date"))
        if re.fullmatch(r"\d{2}/\d{4}", rd):
            month, year = rd.split("/")
            release_date = f"{year}-{month}-01"
        elif re.fullmatch(r"\d{1,2}/\d{4}", rd):
            month, year = rd.split("/")
            release_date = f"{year}-{int(month):02d}-01"
        item = base_record(
            snapshot_id, "androidworld", rank, raw_name, rank, parse_float(row.get("Success Rate (pass@1)")),
            "Success Rate pass@1 (%)",
            "AndroidWorld official community leaderboard; 116 tasks; pass@1 success rate; higher is better; self-reported community submissions",
            source_url,
            organization=row.get("Result Source") or None,
            release_date=release_date,
            run_date=release_date,
            agent_harness=clean(row.get("Result Source")) or "community-submitted Android agent",
            tool_access="Android emulator; screen representation: " + (clean(row.get("Screen Representation")) or "not declared"),
            evidence="C",
            model_family=model_detail or raw_name,
            extra={
                "model_detail": model_detail,
                "model_type": row.get("Model Type"),
                "open_agent": row.get("Open?"),
                "model_size": row.get("Model Size"),
                "screen_representation": row.get("Screen Representation"),
                "number_of_trials": row.get("Number of trials"),
                "pass_at_k": row.get("Success Rate (pass@k)"),
                "trajectory_submissions": row.get("Trajectory submissions"),
                "note": row.get("Note"),
            },
            note="Official AndroidWorld leaderboard sheet row. It is community-submitted Agent-system evidence with no independent verification, so evidence level is C.",
        )
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=item["organization"], release_date=release_date, source_id=model_detail, open_weights=(row.get("Open?") == "✔" if row.get("Open?") else None))


def main():
    records = {x["record_id"]: x for x in read_json(RECORDS_PATH)}
    models = {x["canonical_name"]: x for x in read_json(MODELS_PATH)}
    snapshots = read_json(SNAPSHOTS_PATH)

    import_epoch_benchmark(
        records, models, snapshots,
        task_name="SimpleQA Verified",
        benchmark_id="simpleqa_verified",
        snapshot_id="simpleqa_verified_epoch_2026-09-21",
        version="SimpleQA Verified; 1,000 prompts; no-tools parametric factuality; Epoch Benchmarking Hub track",
        source_url="https://epoch.ai/benchmarks/simple-qa-verified",
        metric_name="Best score across scorers (%)",
        protocol="SimpleQA Verified; no tools/search; GPT-4.1-style autorater track in Epoch Benchmarking Hub; higher is better",
        limitations="Epoch and Kaggle/Google can expose different headline metrics and subsets. This column uses only the frozen Epoch Benchmarking Hub track and does not mix it with Kaggle F1 rows.",
        tool_access="No tools/search; parametric factuality only",
    )
    import_epoch_benchmark(
        records, models, snapshots,
        task_name="FrontierMath-Tiers-1-3-v2-Private",
        benchmark_id="frontiermath",
        snapshot_id="frontiermath_tiers_1_3_v2_epoch_2026-09-21",
        version="FrontierMath Tiers 1-3 v2 private set; 295 problems; June 12 2026 corrected release",
        source_url="https://epoch.ai/benchmarks/frontiermath-tiers-1-3-v2",
        metric_name="Accuracy (%)",
        protocol="FrontierMath Tiers 1-3 v2 private set; Epoch-administered; Python/tool-enabled mathematical solving as declared by Epoch; higher is better",
        limitations="Scores are not comparable to pre-v2 FrontierMath or Tier 4. The private set cannot be independently re-run; use only this frozen Epoch-administered track.",
        tool_access="Epoch-administered math environment; Python/tool use as allowed by benchmark protocol",
        agent_harness="Epoch administered evaluation",
    )
    import_androidworld(records, models, snapshots)

    ordered = sorted(records.values(), key=lambda x: (x["benchmark_id"], x.get("rank") or 10**9, x["model_canonical_name"]))
    scored_names = {x["model_canonical_name"] for x in ordered}
    write_json(RECORDS_PATH, ordered)
    write_json(MODELS_PATH, sorted((x for name, x in models.items() if name in scored_names), key=lambda x: x["canonical_name"].lower()))
    write_json(SNAPSHOTS_PATH, snapshots)
    print(json.dumps({
        "records": len(ordered),
        "models": len(scored_names),
        "simpleqa_verified": sum(x["benchmark_id"] == "simpleqa_verified" for x in ordered),
        "frontiermath": sum(x["benchmark_id"] == "frontiermath" for x in ordered),
        "androidworld": sum(x["benchmark_id"] == "androidworld" for x in ordered),
        "snapshots": len(snapshots),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
