# 大模型能力榜数据契约（v0.1）

## 入库原则

- 任一模型或评测配置只要出现在 24 项入选 benchmark 的**可核实公开结果**中，即可作为原始证据入库。
- 原始证据记录不得硬删：推理开关、推理强度、fallback、Agent harness、工具权限和评测协议必须保留，以便复核公平性。
- 首页模型池按“**可独立选择的产品 SKU**”展示，不按宽泛模型家族合并。旗舰、mini/nano、不同参数规模、不同模态、通用版与独立对外销售的推理版均为不同 SKU，必须分别展示。
- 同一 SKU 的渠道别名、日期快照、重复提交及运行配置可归并为一条首页产品行；原始配置保留为该产品行的证据明细。`reasoning`、`effort`、`fallback`、`agent_harness`、`tool_access`、`max_steps` 不构成新的首页模型 SKU。
- 默认成绩优先取同一 SKU 在该 benchmark 最新 A/B 级、标准可比协议下的结果；若无标准配置，展示覆盖最完整的有效配置，并明确标注“含推理/特殊配置”。严禁将不同配置取均值或将最优值伪装成通用成绩。
- **首页主榜双重准入标准**：产品 SKU 必须同时满足：① 在至少 **2 个已入选且已导入的 benchmark** 中具有可核实公开成绩；② 以 `model_release_date` 为准，发布时间在本站生成快照日前 **18 个月内**。不满足任一条件的原始记录仍保留在完整模型库与证据链中，但不进入首页主表。
- 若来源没有可靠 `model_release_date`，默认不进入首页主榜，待人工补齐或核验；不得用评测运行日期替代模型发布日期。若未来确需保留历史标杆，须单独标注“历史参照”，不能混入默认主榜。
- `—` 仅代表该 benchmark 暂无可核实公开记录，不能推断为能力弱。

## 证据等级

| 等级 | 定义 | 可直接用于首页排名 |
|---|---|---|
| A | Benchmark 官方 leaderboard 或官方 API / 发布结果 | 是 |
| B | 官方论文、技术报告、系统卡中明确列出的可复现结果 | 是，但标注“官方报告” |
| C | 独立第三方实跑，有完整协议和原始来源 | 是，但标注“第三方实跑” |
| D | 厂商自报或缺少完整协议的聚合页 | 可收录为线索，不参与默认排序 |

## 三张核心表

### 1. `benchmarks.json`
每项 benchmark 的正式名称、显示名、分类、官方 URL、更新机制、最新版本与采集策略。

### 2. `leaderboard_snapshots.json`
一次来源快照：`benchmark_id`、`snapshot_at`、`benchmark_version`、`source_url`、`source_type`、`collected_at`、`notes`。

### 3. `evaluation_records.json`
每条模型成绩：

```text
benchmark_id
snapshot_id
model_raw_name
model_canonical_name
model_family
model_variant
organization
rank
score
metric_name
metric_protocol
run_date
model_release_date
agent_harness
tool_access
max_steps
reasoning_effort
context_length
evidence_level
source_url
```

## 归一化与排序规则

- 排名只在同一 `benchmark_id + benchmark_version + metric_protocol` 内比较。
- 对 Agent / 电脑应用类，`agent_harness`、`tool_access`、`max_steps`、`metric_protocol` 缺一不可；缺失时不能与标准行混排。
- 默认首页展示当前每榜最新的 A/B 级快照；C 级结果可在筛选中开启；D 级不进入默认榜。
- 原始模型库取符合条件的 `model_canonical_name + model_variant + 评测配置` 并集；首页模型池取归一化后的 `product_sku` 并集。归并必须可追溯到全部 `record_id` 与 `model_raw_name`。
- `product_sku` 推荐由“厂商 + 产品线 + 代际 + 型号层级 + 参数规模/模态”构成；渠道名、日期尾缀与运行配置不进入 SKU。无法高置信归一化的名称保留独立 SKU，并标记待人工核验。

## 首期交付边界

当前主榜已补齐 8 类 × 3 项 = 24 项入选 benchmark 的公开快照；但“不缺列”不等于“所有历史记录全部穷尽”。后续继续按可重复采集管道增量更新，并保留来源状态、证据等级与人工核验队列；任何新增列或替换项不得用演示数据、厂商零散分数或不可比协议冒充真实结果。
