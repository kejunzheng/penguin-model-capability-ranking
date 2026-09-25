import csv
import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
SNAPSHOTS_PATH = ROOT / "data" / "leaderboard_snapshots.json"
RECORDS_PATH = ROOT / "data" / "evaluation_records.json"
MODELS_PATH = ROOT / "data" / "models.json"

SWE_SOURCE = RAW / "swebench-leaderboards-2026-09-21.json"
LIVEBENCH_TABLE = RAW / "livebench-table-2026-06-25.csv"
LIVEBENCH_CATEGORIES = RAW / "livebench-categories-2026-06-25.json"
LIVEBENCH_JS = RAW / "livebench-main-2026-09-21.js"


def load_json(path):
    return json.loads(path.read_text())


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def record_key(record):
    return record["record_id"]


def model_key(name):
    return (name or "").strip()


def as_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_livebench_model_meta():
    js = LIVEBENCH_JS.read_text()
    meta = {}
    # Minified object entries look like: "slug":{url:"...",organization:"...",displayName:"...",openweight:!0,...}
    pattern = re.compile(r'"([^"{}]+)":\{([^{}]*?displayName:"[^"]+"[^{}]*?)\}')
    for slug, body in pattern.findall(js):
        display = re.search(r'displayName:"([^"]+)"', body)
        org = re.search(r'organization:"([^"]+)"', body)
        url = re.search(r'url:"([^"]+)"', body)
        version = re.search(r'version:"([^"]+)"', body)
        meta[slug] = {
            "display_name": unescape(display.group(1)) if display else slug,
            "organization": unescape(org.group(1)) if org else None,
            "source_url": unescape(url.group(1)) if url else "https://livebench.ai/",
            "model_release_date": version.group(1) if version else None,
            "open_weights": "openweight:!0" in body,
            "reasoning_model": "reasoner:!0" in body,
        }
    return meta


def average(values):
    nums = [v for v in values if v is not None]
    if not nums:
        return None
    return sum(nums) / len(nums)


def import_swebench(records, models, snapshots):
    source = load_json(SWE_SOURCE)
    meta = source["meta"]
    fetched_at = meta["fetched_at"]
    snapshot_id = "swebench_verified_official_2026-09-21"
    snapshots.append({
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["swe_bench_verified"],
        "snapshot_at": fetched_at,
        "benchmark_version": "SWE-bench Verified, official leaderboard",
        "source_url": meta["source_url"],
        "source_type": "official_leaderboard_embedded_json",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {
            "leaderboard": "Verified",
            "default_view_note": "Official page states Verified is a 500-instance human-filtered subset; bash-only/default mini-SWE-agent rows are retained with agent metadata.",
        },
        "limitations": "Rows mix different agents and harnesses. The main table should compare only within compatible agent_harness / release fields when needed.",
    })
    verified = next(lb for lb in source["leaderboards"] if lb["name"] == "Verified")
    ranked_rows = sorted(
        verified["results"],
        key=lambda row: (-(as_float(row.get("resolved")) or -1), row.get("date") or ""),
    )
    for rank, row in enumerate(ranked_rows, start=1):
        name = model_key(row.get("name") or row.get("model_display"))
        if not name:
            continue
        canonical = name
        org = row.get("model_org") or row.get("agent_org")
        models.setdefault(canonical, {
            "canonical_name": canonical,
            "raw_names": [canonical],
            "organization": org,
            "organization_slug": None,
            "organization_country": None,
            "model_release_date": str(row.get("model_release_date")) if row.get("model_release_date") else None,
            "open_weights": bool(row.get("os_model")) if row.get("os_model") is not None else None,
            "reasoning_model": bool(row.get("reasoning_effort")) if row.get("reasoning_effort") else None,
            "source_model_id": row.get("folder"),
        })
        if canonical not in models[canonical]["raw_names"]:
            models[canonical]["raw_names"].append(canonical)
        record = {
            "record_id": f"{snapshot_id}:swe_bench_verified:{row.get('folder') or rank}",
            "snapshot_id": snapshot_id,
            "benchmark_id": "swe_bench_verified",
            "model_raw_name": row.get("name"),
            "model_canonical_name": canonical,
            "model_family": row.get("model_display"),
            "model_variant": canonical,
            "organization": org,
            "rank": rank,
            "score": as_float(row.get("resolved")),
            "metric_name": "% Resolved",
            "metric_protocol": "SWE-bench Verified official leaderboard; 500 human-filtered instances; higher is better",
            "run_date": row.get("date"),
            "model_release_date": str(row.get("model_release_date")) if row.get("model_release_date") else None,
            "agent_harness": row.get("agent"),
            "tool_access": "bash-only" if row.get("agent") == "mini-SWE-agent" else None,
            "max_steps": None,
            "reasoning_effort": row.get("reasoning_effort"),
            "context_length": None,
            "evidence_level": "A",
            "source_url": meta["source_url"],
            "source_field": "Verified.results.resolved",
            "is_estimated": False,
            "ingestion_note": "Imported from SWE-bench official page embedded leaderboard JSON; agent/harness retained to avoid mixing incompatible rows.",
        }
        records[record_key(record)] = record


def import_livebench(records, models, snapshots):
    categories = load_json(LIVEBENCH_CATEGORIES)
    meta_by_slug = parse_livebench_model_meta()
    rows = list(csv.DictReader(LIVEBENCH_TABLE.open()))
    snapshot_id = "livebench_overall_official_2026-06-25"
    task_to_category = {task: category for category, tasks in categories.items() for task in tasks}
    snapshots.append({
        "snapshot_id": snapshot_id,
        "benchmark_ids": ["livebench_overall"],
        "snapshot_at": "2026-06-25T00:00:00+00:00",
        "benchmark_version": "LiveBench-2026-06-25",
        "source_url": "https://livebench.ai/table_2026_06_25.csv",
        "source_type": "official_release_csv",
        "evidence_level": "A",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "source_meta": {
            "score_asset": "https://livebench.ai/table_2026_06_25.csv",
            "category_asset": "https://livebench.ai/categories_2026_06_25.json",
            "release": "2026-06-25",
            "rows": len(rows),
            "categories": categories,
        },
        "limitations": "Overall score is computed as the mean of category means from the official release CSV; missing task values are skipped rather than imputed.",
    })
    scored = []
    for row in rows:
        slug = row["model"]
        category_scores = {}
        for category, tasks in categories.items():
            category_scores[category] = average([as_float(row.get(task)) for task in tasks])
        overall = average(list(category_scores.values()))
        if overall is None:
            continue
        scored.append((slug, overall, category_scores, row))
    scored.sort(key=lambda item: item[1], reverse=True)
    for rank, (slug, overall, category_scores, row) in enumerate(scored, start=1):
        meta = meta_by_slug.get(slug, {})
        canonical = model_key(meta.get("display_name") or slug)
        org = meta.get("organization")
        models.setdefault(canonical, {
            "canonical_name": canonical,
            "raw_names": [slug, canonical] if slug != canonical else [canonical],
            "organization": org,
            "organization_slug": None,
            "organization_country": None,
            "model_release_date": meta.get("model_release_date"),
            "open_weights": meta.get("open_weights"),
            "reasoning_model": meta.get("reasoning_model"),
            "source_model_id": slug,
        })
        for raw in [slug, canonical]:
            if raw and raw not in models[canonical]["raw_names"]:
                models[canonical]["raw_names"].append(raw)
        if not models[canonical].get("organization") and org:
            models[canonical]["organization"] = org
        record = {
            "record_id": f"{snapshot_id}:livebench_overall:{slug}",
            "snapshot_id": snapshot_id,
            "benchmark_id": "livebench_overall",
            "model_raw_name": slug,
            "model_canonical_name": canonical,
            "model_family": canonical,
            "model_variant": canonical,
            "organization": org,
            "rank": rank,
            "score": round(overall, 4),
            "metric_name": "LiveBench overall score",
            "metric_protocol": "Mean of category means from LiveBench-2026-06-25 official CSV; higher is better",
            "run_date": "2026-06-25",
            "model_release_date": meta.get("model_release_date"),
            "agent_harness": None,
            "tool_access": "no-tools unless model/release note states otherwise",
            "max_steps": None,
            "reasoning_effort": "reasoning/effort may be encoded in model variant name",
            "context_length": None,
            "evidence_level": "A",
            "source_url": "https://livebench.ai/table_2026_06_25.csv",
            "source_field": "category mean aggregation",
            "is_estimated": False,
            "ingestion_note": "Imported from LiveBench official release CSV; category scores kept in extra_fields.",
            "extra_fields": {
                "category_scores": {k: round(v, 4) if v is not None else None for k, v in category_scores.items()},
                "task_to_category": task_to_category,
            },
        }
        records[record_key(record)] = record


def main():
    existing_records = {record_key(record): record for record in load_json(RECORDS_PATH)}
    models = {model["canonical_name"]: model for model in load_json(MODELS_PATH)}
    snapshots = load_json(SNAPSHOTS_PATH)
    existing_snapshot_ids = {snapshot["snapshot_id"] for snapshot in snapshots}
    snapshots = [s for s in snapshots if s["snapshot_id"] not in {"swebench_verified_official_2026-09-21", "livebench_overall_official_2026-06-25"}]
    import_swebench(existing_records, models, snapshots)
    import_livebench(existing_records, models, snapshots)
    write_json(RECORDS_PATH, sorted(existing_records.values(), key=lambda r: (r["benchmark_id"], r["rank"] or 10**9, r["model_canonical_name"])))
    write_json(MODELS_PATH, sorted(models.values(), key=lambda item: item["canonical_name"].lower()))
    write_json(SNAPSHOTS_PATH, snapshots)
    print(json.dumps({
        "models": len(models),
        "records": len(existing_records),
        "snapshots": len(snapshots),
        "added_snapshots": [s["snapshot_id"] for s in snapshots if s["snapshot_id"] not in existing_snapshot_ids],
        "records_by_new_benchmark": {
            "swe_bench_verified": sum(r["benchmark_id"] == "swe_bench_verified" for r in existing_records.values()),
            "livebench_overall": sum(r["benchmark_id"] == "livebench_overall" for r in existing_records.values()),
        },
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
