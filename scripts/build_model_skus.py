"""Build homepage product-SKU view from immutable raw evaluation records.

Raw benchmark rows remain untouched. This derived file groups only technical duplicates:
configuration suffixes, dated snapshots and source-channel spellings. Different purchasable
products (mini/nano, parameter sizes, model tiers and modalities) remain separate SKUs.
"""

import json
import re
from calendar import monthrange
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORDS_PATH = ROOT / "data" / "evaluation_records.json"
MODELS_PATH = ROOT / "data" / "models.json"
OUTPUT_PATH = ROOT / "data" / "model_skus.json"
# Homepage admission is evaluated against this site snapshot, not against a model's score date.
SITE_SNAPSHOT_DATE = date(2026, 9, 21)
HOME_MAX_AGE_MONTHS = 18

CONFIG_WORDS = re.compile(
    r"\b(?:non[- ]?reasoning|reasoning|thinking|adaptive|effort|fallback|high|low|medium|max|xhigh|auto)\b",
    re.I,
)
DATE_PARENS = re.compile(r"\s*\((?:19|20)\d{2}(?:[-/]?\d{2}){1,2}\)\s*", re.I)
CONFIG_PARENS = re.compile(r"\s*\(([^()]*)\)\s*")


def title_from_slug(value):
    value = value.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", value).strip()


def normalize_claude(value):
    """Normalize published Claude spelling variants without merging Haiku/Sonnet/Opus."""
    text = value.strip()
    # Claude Opus 4.5 -> Claude 4.5 Opus; use only a model tier plus numeric generation.
    match = re.fullmatch(r"Claude\s+(Haiku|Sonnet|Opus)\s+(\d+(?:\.\d+)?)", text, re.I)
    if match:
        return f"Claude {match.group(2)} {match.group(1).title()}"
    return text


def parse_release_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def released_within_18_months(release_date):
    if release_date is None:
        return False
    # Calendar-month comparison avoids approximating 18 months as a fixed number of days.
    total_month = SITE_SNAPSHOT_DATE.year * 12 + SITE_SNAPSHOT_DATE.month - HOME_MAX_AGE_MONTHS
    cutoff_year = (total_month - 1) // 12
    cutoff_month = (total_month - 1) % 12 + 1
    cutoff_day = min(SITE_SNAPSHOT_DATE.day, monthrange(cutoff_year, cutoff_month)[1])
    cutoff = date(cutoff_year, cutoff_month, cutoff_day)
    return cutoff <= release_date <= SITE_SNAPSHOT_DATE


def extract_sku(raw_name):
    """Return (stable key, display name, configuration label, confidence)."""
    raw = (raw_name or "").strip()
    text = raw
    configuration = []

    # Sources sometimes publish a slug instead of a display name.
    if re.fullmatch(r"[a-z0-9_.-]+", text, re.I) and "-" in text:
        text = title_from_slug(text)

    # Date snapshots do not make a new purchasable SKU.
    if DATE_PARENS.search(text):
        text = DATE_PARENS.sub(" ", text)
        configuration.append("日期快照")

    # Parenthetical material is a config only when it describes run mode, not a product name.
    def parenthetical(match):
        inside = match.group(1).strip()
        if CONFIG_WORDS.search(inside):
            configuration.append(inside)
            return " "
        return match.group(0)

    text = CONFIG_PARENS.sub(parenthetical, text)
    trailing = re.search(r"\s+(?:w/|with)\s+(.+)$", text, re.I)
    if trailing and CONFIG_WORDS.search(trailing.group(1)):
        configuration.append(trailing.group(1).strip())
        text = text[:trailing.start()]

    # Named reasoning / effort suffixes outside parentheses.
    suffix = re.search(
        r"\s+(?:thinking|adaptive reasoning|non[- ]?reasoning|reasoning)(?:\s+.*)?$",
        text,
        re.I,
    )
    if suffix:
        configuration.append(suffix.group(0).strip())
        text = text[:suffix.start()]

    text = re.sub(r"\s+", " ", text).strip(" -")
    text = normalize_claude(text)

    # This first version only auto-merges high-confidence model-name variants. Composite
    # agent submissions are deliberately not guessed into a model SKU.
    confident = not bool(re.search(r"\s\+\s|agent|tools|rag|coder|openhands|swekit|developer", text, re.I))
    display = text or raw
    key = re.sub(r"[^a-z0-9]+", "-", display.lower()).strip("-")
    config_label = "；".join(dict.fromkeys(configuration)) or "标准/未注明"
    return key, display, config_label, confident


def main():
    records = json.loads(RECORDS_PATH.read_text())
    raw_models = {item["canonical_name"]: item for item in json.loads(MODELS_PATH.read_text())}
    grouped = defaultdict(lambda: {"record_ids": [], "raw_names": set(), "configurations": Counter(), "records": [], "confidence": True})

    for record in records:
        sku_id, display_name, config, confident = extract_sku(record.get("model_canonical_name"))
        bucket = grouped[sku_id]
        bucket["display_name"] = display_name
        bucket["record_ids"].append(record["record_id"])
        bucket.setdefault("record_configurations", {})[record["record_id"]] = config
        bucket["raw_names"].add(record.get("model_canonical_name") or record.get("model_raw_name"))
        bucket["configurations"][config] += 1
        bucket["records"].append(record)
        bucket["confidence"] = bucket["confidence"] and confident

    result = []
    for sku_id, bucket in grouped.items():
        source_models = [raw_models.get(name, {}) for name in bucket["raw_names"]]
        organizations = Counter(m.get("organization") for m in source_models if m.get("organization"))
        countries = Counter(m.get("organization_country") for m in source_models if m.get("organization_country"))
        open_weights = [m.get("open_weights") for m in source_models if m.get("open_weights") is not None]
        release_dates = [
            parsed for value in [
                *(m.get("model_release_date") for m in source_models),
                *(r.get("model_release_date") for r in bucket["records"]),
            ] if (parsed := parse_release_date(value))
        ]
        # A product may have dated source aliases; retain the newest verified release date.
        release_date = max(release_dates).isoformat() if release_dates else None
        benchmark_ids = sorted({r["benchmark_id"] for r in bucket["records"]})
        meets_coverage = len(benchmark_ids) >= 2
        meets_recency = released_within_18_months(parse_release_date(release_date))
        result.append({
            "sku_id": sku_id,
            "display_name": bucket["display_name"],
            "organization": organizations.most_common(1)[0][0] if organizations else None,
            "organization_country": countries.most_common(1)[0][0] if countries else None,
            "open_weights": Counter(open_weights).most_common(1)[0][0] if open_weights else None,
            "model_release_date": release_date,
            "benchmark_ids": benchmark_ids,
            "benchmark_coverage": len(benchmark_ids),
            "homepage_eligible": meets_coverage and meets_recency,
            "homepage_admission": {
                "minimum_benchmark_coverage": 2,
                "meets_benchmark_coverage": meets_coverage,
                "maximum_model_age_months": HOME_MAX_AGE_MONTHS,
                "site_snapshot_date": SITE_SNAPSHOT_DATE.isoformat(),
                "meets_recency": meets_recency,
                "exclusion_reason": None if meets_coverage and meets_recency else (
                    "缺少可靠发布日期" if release_date is None else (
                        "仅覆盖 1 个已导入 benchmark" if not meets_coverage else "发布日期早于 18 个月窗口"
                    )
                ),
            },
            "record_ids": sorted(bucket["record_ids"]),
            "record_configurations": bucket["record_configurations"],
            "raw_model_names": sorted(bucket["raw_names"]),
            "configuration_summary": [
                {"label": label, "record_count": count}
                for label, count in bucket["configurations"].most_common()
            ],
            "normalization_confidence": "high" if bucket["confidence"] else "review_required",
            "normalization_note": "Derived homepage SKU. Raw model names and all evaluation configurations remain in evaluation_records.json.",
        })

    result.sort(key=lambda item: item["display_name"].lower())
    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({
        "raw_model_versions": len(raw_models),
        "product_skus": len(result),
        "high_confidence_skus": sum(item["normalization_confidence"] == "high" for item in result),
        "review_required_skus": sum(item["normalization_confidence"] == "review_required" for item in result),
        "homepage_eligible_skus": sum(item["homepage_eligible"] for item in result),
        "excluded_for_insufficient_coverage": sum(not item["homepage_admission"]["meets_benchmark_coverage"] for item in result),
        "excluded_for_missing_or_old_release_date": sum(not item["homepage_admission"]["meets_recency"] for item in result),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
