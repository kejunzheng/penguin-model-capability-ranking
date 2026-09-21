# 大模型能力榜数据契约（v0.1）

## 入库原则

- 任一模型版本只要出现在 24 项入选 benchmark 的**可核实公开结果**中，即可入库。
- 不把“模型家族”当作唯一主键：不同版本、推理档位、Agent harness、工具权限和评测协议先保留为独立记录。
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
- 模型池取符合条件的 `model_canonical_name + model_variant` 并集；保留原始名称以便追溯。

## 首期交付边界

首期不承诺一次性把 24 榜所有历史记录全部爬完。先建立可重复的采集管道，并优先导入存在官方公开、可批量获取 leaderboard 的来源；其余榜单保留来源状态和人工核验队列，不用演示数据冒充真实结果。
