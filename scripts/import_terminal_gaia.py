"""Import frozen official Terminal-Bench 4.0 and GAIA leaderboard evidence."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
RECORDS_PATH = ROOT / "data" / "evaluation_records.json"
MODELS_PATH = ROOT / "data" / "models.json"
SNAPSHOTS_PATH = ROOT / "data" / "leaderboard_snapshots.json"


def read_json(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def canonical_name(value):
    return " ".join((value or "").strip().split())


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
    item = models[name]
    if organization and not item.get("organization"):
        item["organization"] = organization
    if release_date and not item.get("model_release_date"):
        item["model_release_date"] = release_date


def add_snapshot(snapshots, item):
    snapshots[:] = [x for x in snapshots if x["snapshot_id"] != item["snapshot_id"]]
    snapshots.append(item)


def base_record(snapshot_id, benchmark_id, index, raw_name, rank, score, metric_name, protocol, source_url, **kwargs):
    name = canonical_name(raw_name)
    return {
        "record_id": f"{snapshot_id}:{benchmark_id}:{index}",
        "snapshot_id": snapshot_id,
        "benchmark_id": benchmark_id,
        "model_raw_name": raw_name,
        "model_canonical_name": name,
        "model_family": name,
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
        "ingestion_note": kwargs.get("note", "Imported from a frozen official source retained in data/raw."),
        "extra_fields": kwargs.get("extra", {}),
    }


def import_terminal_bench_4(records, models, snapshots):
    files = sorted(RAW.glob("2026-*-*-*-*.json"))
    rows = []
    for path in files:
        if not any(token in path.name for token in ("claude", "gpt-5-6", "grok")):
            continue
        payload = read_json(path)
        if not {"metadata", "metrics", "source_filter", "trials"}.issubset(payload):
            continue
        metadata, metrics, source_filter = payload["metadata"], payload["metrics"], payload["source_filter"]
        if not metadata.get("model_display", {}).get("label") or metrics.get("accuracy") is None:
            continue
        rows.append((path.name, metadata, metrics, source_filter))
    rows.sort(key=lambda x: x[2]["accuracy"], reverse=True)
    snapshot_id = "terminal_bench_4_official_2026-09-21"
    source_url = "https://github.com/harbor-framework/terminal-bench/tree/main/leaderboard/submissions"
    add_snapshot(snapshots, {
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["terminal_bench_4"],
        "snapshot_at": "2026-09-21T00:00:00+08:00",
        "benchmark_version": "Terminal-Bench 4.0.0; 66 tasks",
        "source_url": source_url,
        "source_type": "official_repository_submission_json",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(rows), "metric": "accuracy / resolution rate", "task_count": 66, "timeout": "8 hours", "trials": "5 per task"},
        "limitations": "Terminal-Bench 4.0 rows are agent-system results. Harness, agent version, reasoning effort, tokens, cost and trial count are mandatory evidence fields; no cross-harness normalization is performed. Scores are not comparable to Terminal-Bench 2.x/3.x.",
    })
    for rank, (filename, metadata, metrics, source_filter) in enumerate(rows, 1):
        raw_name = metadata["model_display"]["label"]
        item = base_record(
            snapshot_id, "terminal_bench_4", rank, raw_name, rank, metrics["accuracy"], "Resolution rate (%)",
            "Terminal-Bench 4.0.0; 66 tasks; 5 trials per task; 8-hour timeout; higher is better", source_url,
            organization=metadata.get("model_org", {}).get("label"), release_date=metadata.get("release_date"),
            run_date=metadata.get("date"), agent_harness=metadata.get("agent_display", {}).get("label"),
            tool_access="terminal sandbox; Harbor-defined agent tools", max_steps=None, reasoning_effort=metadata.get("reasoning_effort"),
            extra={"raw_submission_file": filename, "agent_version": source_filter.get("agent_version"), "source_model_name": source_filter.get("model_name"), "n_trials": metrics.get("n_trials"), "accuracy_ci95_half_width": metrics.get("accuracy_ci95_half_width"), "successes": metrics.get("successes"), "total_tokens": metrics.get("total_tokens"), "total_cost_usd": metrics.get("total_cost_usd"), "avg_trial_duration_sec": metrics.get("avg_trial_duration_sec"), "pass_at_5": metrics.get("pass_at_5")},
            note="Official Terminal-Bench 4.0 submission JSON. This is an Agent system result; its harness and configuration are retained rather than collapsed into a bare-model claim.",
        )
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=item["organization"], release_date=item["model_release_date"], source_id=source_filter.get("model_name"))


def import_gaia(records, models, snapshots):
    source = RAW / "gaia-results-public-2026-09-21.parquet"
    rows = [x for x in pq.read_table(source).to_pylist() if x.get("score") is not None and x.get("model")]
    rows.sort(key=lambda x: x["score"], reverse=True)
    snapshot_id = "gaia_official_public_results_2026-09-21"
    source_url = "https://huggingface.co/datasets/gaia-benchmark/results_public"
    add_snapshot(snapshots, {
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["gaia"],
        "snapshot_at": "2026-09-21T00:00:00+08:00",
        "benchmark_version": "GAIA 2023 test public-results table",
        "source_url": source_url,
        "source_type": "official_dataset_parquet",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {"rows": len(rows), "metric": "overall exact-match accuracy", "levels": [1, 2, 3]},
        "limitations": "GAIA submits complete agents, not bare models. System prompt, tool stack and external URL are preserved when declared. Compare only within comparable systems; no attribution of an agent score solely to its underlying model.",
    })
    for rank, row in enumerate(rows, 1):
        raw_name = row["model"]
        item = base_record(
            snapshot_id, "gaia", rank, raw_name, rank, row["score"] * 100, "Overall accuracy (%)",
            "GAIA 2023 test; official public submission results; exact-match overall accuracy; higher is better", source_url,
            organization=row.get("organisation") or None, run_date=row.get("date"), agent_harness="submitter-declared agent system",
            tool_access="submitter-declared; inspect system_prompt and URL", evidence="A",
            extra={"model_family": row.get("model_family"), "system_prompt": row.get("system_prompt"), "project_url": row.get("url"), "score_level1": (row.get("score_level1") or 0) * 100, "score_level2": (row.get("score_level2") or 0) * 100, "score_level3": (row.get("score_level3") or 0) * 100},
            note="Official GAIA public-results dataset row. It is explicitly displayed as an Agent system score, not as a bare-model score.",
        )
        records[item["record_id"]] = item
        ensure_model(models, item["model_canonical_name"], organization=item["organization"], source_id=raw_name)


def main():
    records = {x["record_id"]: x for x in read_json(RECORDS_PATH)}
    models = {x["canonical_name"]: x for x in read_json(MODELS_PATH)}
    snapshots = read_json(SNAPSHOTS_PATH)
    import_terminal_bench_4(records, models, snapshots)
    import_gaia(records, models, snapshots)
    ordered = sorted(records.values(), key=lambda x: (x["benchmark_id"], x.get("rank") or 10**9, x["model_canonical_name"]))
    scored_names = {x["model_canonical_name"] for x in ordered}
    write_json(RECORDS_PATH, ordered)
    write_json(MODELS_PATH, sorted((x for name, x in models.items() if name in scored_names), key=lambda x: x["canonical_name"].lower()))
    write_json(SNAPSHOTS_PATH, snapshots)
    print(json.dumps({"records": len(ordered), "models": len(scored_names), "snapshots": len(snapshots), "terminal_bench_4": sum(x["benchmark_id"] == "terminal_bench_4" for x in ordered), "gaia": sum(x["benchmark_id"] == "gaia" for x in ordered)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
