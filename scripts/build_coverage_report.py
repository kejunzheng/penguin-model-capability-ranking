import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENCHMARKS = json.loads((ROOT / "data/benchmarks.json").read_text())["benchmarks"]
RECORDS = json.loads((ROOT / "data/evaluation_records.json").read_text())
SNAPSHOTS = json.loads((ROOT / "data/leaderboard_snapshots.json").read_text())

counts = Counter(record["benchmark_id"] for record in RECORDS)
report = {
    "generated_from": "evaluation_records.json",
    "snapshot_count": len(SNAPSHOTS),
    "distinct_model_variants": len({record["model_canonical_name"] for record in RECORDS}),
    "evaluation_record_count": len(RECORDS),
    "benchmarks": [
        {
            "benchmark_id": benchmark["id"],
            "display_name": benchmark["display_name"],
            "canonical_name": benchmark["canonical_name"],
            "category": benchmark["category"],
            "record_count": counts[benchmark["id"]],
            "ingestion_status": (
                "imported" if counts[benchmark["id"]] else benchmark["ingestion_status"]
            ),
            "official_url": benchmark["official_url"],
        }
        for benchmark in BENCHMARKS
    ],
}
(ROOT / "data/coverage_report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n"
)
print(json.dumps(report, ensure_ascii=False, indent=2))
