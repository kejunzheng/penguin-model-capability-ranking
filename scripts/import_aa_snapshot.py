import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "data/raw/artificial-analysis-llms-2026-07-10.json"
SNAPSHOTS_PATH = ROOT / "data/leaderboard_snapshots.json"
RECORDS_PATH = ROOT / "data/evaluation_records.json"
MODELS_PATH = ROOT / "data/models.json"

FIELD_MAP = {
    "artificial_analysis_intelligence_index": {
        "benchmark_id": "aa_intelligence_index",
        "metric_name": "Artificial Analysis Intelligence Index",
        "metric_protocol": "AA public-web snapshot; higher is better",
    },
    "aa_lcr": {
        "benchmark_id": "aa_lcr",
        "metric_name": "AA-LCR score",
        "metric_protocol": "AA public-web snapshot; higher is better",
    },
    "hle": {
        "benchmark_id": "humanitys_last_exam",
        "metric_name": "HLE score",
        "metric_protocol": "AA aggregated evaluation; protocol must be checked per source",
    },
    "gpqa": {
        "benchmark_id": "gpqa_diamond",
        "metric_name": "GPQA score",
        "metric_protocol": "AA aggregated evaluation; Diamond/no-tools configuration not assumed",
    },
    "mmmu_pro": {
        "benchmark_id": "mmmu_pro",
        "metric_name": "MMMU-Pro score",
        "metric_protocol": "AA aggregated evaluation; tool configuration not assumed",
    },
    "terminal_bench_hard": {
        "benchmark_id": "terminal_bench",
        "metric_name": "Terminal-Bench Hard score",
        "metric_protocol": "AA aggregated evaluation; agent harness and budget not provided",
    },
}


def value_to_float(value):
    if isinstance(value, (int, float)):
        return float(value)
    return None


def main():
    source = json.loads(SOURCE_PATH.read_text())
    meta = source["meta"]
    fetched_at = meta["fetched_at"]
    snapshot_id = f"aa_public_web_{fetched_at[:10]}"

    snapshot = {
        "snapshot_id": snapshot_id,
        "benchmark_ids": sorted({config["benchmark_id"] for config in FIELD_MAP.values()}),
        "snapshot_at": fetched_at,
        "benchmark_version": "public-web snapshot",
        "source_url": meta["source_url"],
        "source_type": "third_party_public_snapshot",
        "evidence_level": "C",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": meta,
        "limitations": "This snapshot is a public-web collection of Artificial Analysis data. Scores from different benchmark fields retain their own protocol caveats; missing agent configuration prevents direct default comparison for agent tasks.",
    }

    records = []
    models = {}
    for model in source["models"]:
        canonical = model["name"].strip()
        creator = model.get("creator") or {}
        evaluations = model.get("evaluations") or {}
        model_records = []
        for field, config in FIELD_MAP.items():
            score = value_to_float(evaluations.get(field))
            if score is None:
                continue
            model_records.append({
                "record_id": f"{snapshot_id}:{config['benchmark_id']}:{model.get('id')}",
                "snapshot_id": snapshot_id,
                "benchmark_id": config["benchmark_id"],
                "model_raw_name": canonical,
                "model_canonical_name": canonical,
                "model_family": None,
                "model_variant": canonical,
                "organization": creator.get("name"),
                "rank": None,
                "score": score,
                "metric_name": config["metric_name"],
                "metric_protocol": config["metric_protocol"],
                "run_date": None,
                "model_release_date": model.get("release_date"),
                "agent_harness": None,
                "tool_access": None,
                "max_steps": None,
                "reasoning_effort": None,
                "context_length": None,
                "evidence_level": "C",
                "source_url": meta["source_url"],
                "source_field": field,
                "is_estimated": evaluations.get("artificial_analysis_intelligence_index_is_estimated") if field == "artificial_analysis_intelligence_index" else None,
                "ingestion_note": "Imported from raw snapshot without inferring missing evaluation protocol fields.",
            })
        if not model_records:
            continue
        models[canonical] = {
            "canonical_name": canonical,
            "raw_names": [canonical],
            "organization": creator.get("name"),
            "organization_slug": creator.get("slug"),
            "organization_country": creator.get("country"),
            "model_release_date": model.get("release_date"),
            "open_weights": (model.get("open_weights") or {}).get("is_open_weights"),
            "reasoning_model": model.get("reasoning_model"),
            "source_model_id": model.get("id"),
        }
        records.extend(model_records)

    for benchmark_id in {record["benchmark_id"] for record in records}:
        ranked = sorted(
            [record for record in records if record["benchmark_id"] == benchmark_id],
            key=lambda record: record["score"],
            reverse=True,
        )
        for rank, record in enumerate(ranked, start=1):
            record["rank"] = rank

    SNAPSHOTS_PATH.write_text(json.dumps([snapshot], ensure_ascii=False, indent=2) + "\n")
    RECORDS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    MODELS_PATH.write_text(json.dumps(sorted(models.values(), key=lambda item: item["canonical_name"].lower()), ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({
        "snapshot_id": snapshot_id,
        "source_models": len(source["models"]),
        "canonical_model_variants": len(models),
        "evaluation_records": len(records),
        "records_by_benchmark": {
            benchmark_id: sum(record["benchmark_id"] == benchmark_id for record in records)
            for benchmark_id in sorted({record["benchmark_id"] for record in records})
        },
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
