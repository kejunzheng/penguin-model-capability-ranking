# 大模型能力榜｜24 个 Benchmark 更新时间核查

> 核查日：2026-09-20。以下“榜单更新时间”优先记录公开页面明确给出的**官方快照/版本时间**；当官方没有统一动态榜单时，明确标为“无统一更新时间”，不以第三方镜像更新时间替代。第三方平台的时间只可作为补充采集证据。

## 结论先行

1. **24 个榜单绝不可能同日同步。**最早可追溯到 2026-04-12（BFCL v4 官方榜），最新可到 2026-09-18/19（部分第三方聚合快照）。首页不能展示成“截至某天的统一总榜”。
2. **可稳定维护的动态列**：LMArena、Artificial Analysis Intelligence Index、LiveBench（按 release）、BFCL、WebArena/Verified（第三方公开索引）、AA-LCR。
3. **应以“版本”而非网页更新时间为核心的列**：LiveBench、LiveCodeBench、Terminal-Bench、OSWorld 2.0、ARC-AGI-2、FrontierMath、LongBench v2、RULER。
4. **没有统一官方动态 leaderboard 的列**：SWE-bench Verified、MMLU-Pro、GPQA Diamond、SimpleQA Verified、HLE、MathVista、VideoMMMU、BrowseComp、OSWorld、WorkArena++、Aider Polyglot、RULER、LongBench v2。对它们只能按“来源行 + 具体运行日期”建库。
5. **电脑应用第三列建议由 WorkArena++ 改为 WebArena-Verified。**原因不是 WorkArena++ 不重要，而是前者缺少持续公开、可汇总的跨模型榜单；WebArena/Verified 至少有更可维护的公开结果索引，适合首页排名列。

---

## 一、逐项核查表

| 分类 | Benchmark | 可用于网站的最新时间口径 | 更新机制 / 当前状态 | 数据源性质 | 展示时必须附带的条件 |
|---|---|---:|---|---|---|
| 综合 | **LMArena Text Overall** | **2026-09-13**（官方公开榜搜索快照） | 高频/持续变化；票数、Elo 与区间随投票更新 | 官方众包盲测榜 | `snapshot_at` 精确到时分；arena 类型、Elo、vote_count、95% CI |
| 综合 | **Artificial Analysis Intelligence Index** | 官方指数为持续维护；本轮可核实的第三方读取快照 **2026-09-13** | 持续维护的综合指数；不要把镜像刷新日写成官方更新时间 | 第三方独立评测/聚合指数 | `index_version`、各子项权重、模型模式、采集时点 |
| 综合 | **LiveBench Overall** | **2026-06-25 release** | 约半年级题集 release；网页抓取日期不是题集版本 | 官方 benchmark release | `release_date`、23 tasks/7 categories、是否同一 release、metric |
| Coding | **SWE-bench Verified** | 官方没有统一全表刷新日；第三方索引见 **2026-09-18** | 静态 Verified 任务集，结果由不同 agent 持续产生 | 官方任务集 + 厂商/独立运行混合 | `dataset=Verified`、agent harness、patch/apply policy、run_date、resolved rate |
| Coding | **LiveCodeBench** | 官方为滚动题窗；第三方官方索引结果 **2026-08-26** | 持续收集新题；必须按 v5/v6 或题目时间窗分列 | 官方 benchmark；大量结果为论文/厂商自报 | `version/window`、pass@k、sampling、temperature、execution policy |
| Coding | **Aider Polyglot** | 无官方统一刷新日；第三方公开汇总最新可见 **2026-08**（新 SOTA 论文） | 静态 225 题；结果按模型/论文新增 | 官方开源题集 + 自报/论文运行 | `aider_version`、edit format、attempts、feedback policy、run_date |
| 知识 | **MMLU-Pro** | 无官方统一刷新日；第三方索引 **2026-08-11** | 静态题集，模型行持续新增 | 官方题集 + 自报/镜像 | `prompting`、CoT、tools、few-shot、run_date；不要和原 MMLU 混用 |
| 知识 | **GPQA Diamond** | 无官方统一刷新日；第三方索引 **2026-08-28** | 静态高难科学问答集，结果行持续新增 | 官方题集 + 厂商/论文运行 | Diamond 子集、closed-book / tools、CoT、run_date |
| 知识 | **SimpleQA Verified** | 聚合数据快照 **2026-09-07** | 需明确区分 SimpleQA 与“Verified”口径；并非统一官方动态榜 | 第三方验证/结果聚合 | benchmark 版本、verification rule、accuracy / F1、run_date |
| 推理 | **Humanity's Last Exam (HLE)** | 公开转述/官方更新信号 **2026-08-18**；第三方索引 **2026-09-18** | 题集与成绩表并非同一更新节奏 | 官方 benchmark + 厂商/独立提交混合 | closed-book / tools、文本或多模态、题集版本、run_date |
| 推理 | **FrontierMath** | **v2 发布：2026-06-12**；第三方索引 **2026-09-19** | 核心应按 v1/v2 与题目层级维护，不按聚合页日期维护 | Epoch 研究组织 benchmark + 厂商结果 | v1/v2、Tier 1-3 / Tier 4、private subset、tools、run_date |
| 推理 | **ARC-AGI-2** | 无统一官方动态榜；第三方索引 **2026-09-03** | 静态挑战集与提交结果并行；不可混入 ARC-AGI-3 | 官方 benchmark + 提交/自报 | ARC-AGI-2、cost / time budget、program/harness、run_date |
| 视觉理解 | **MMMU-Pro** | 无统一官方动态榜；第三方索引 **2026-09-02** | 静态题集，结果行持续新增 | 官方 benchmark + 自报/聚合 | MMMU-Pro、图文输入、Python/tools、prompt 与 metric |
| 视觉理解 | **MathVista** | 公开结果索引 **2026-07-13** | 官方统一活跃 leaderboard 信号较弱；低频聚合型 | 官方题集 + 论文/厂商结果 | testmini/test、CoT、OCR/tool、run_date |
| 视觉理解 | **VideoMMMU** | 无统一官方动态榜；第三方索引 **2026-08-27** | 静态视频多模态题集，模型数较少 | 官方题集 + 多为自报结果 | 视频采样帧率、字幕/音频可用性、prompt、run_date |
| Agent | **Terminal-Bench** | 必须按版本：本轮第三方快照为 **Terminal-Bench 4.0 / 2026-09-15** | v2.x、v3、v4 的任务与资源限制不同；不跨版本排名 | 官方 benchmark + agent system 运行 | `terminal_bench_version`、agent system、max steps、shell/tools、timeout、run_date |
| Agent | **BFCL v4** | **官方 Last Updated：2026-04-12** | 官方榜有明确更新日；第三方 9 月刷新不是官方更新 | Berkeley 官方 leaderboard | v4、category、AST / execution match、tool definitions、model mode |
| Agent | **BrowseComp** | 无统一官方 leaderboard；第三方快照 **2026-09-07** | 公开结果主要是厂商或系统自报 | benchmark + 自报/独立评测混合 | browser/agent harness、search access、max steps、run_date |
| 电脑应用 | **OSWorld / OSWorld-Verified** | **无统一全表更新时间**；官方每个模型行带日期（本轮见至 **2026-08-01**） | 逐 submission 更新；应以行级日期管理 | 官方任务集/榜单 + 提交结果 | OSWorld/Verified、OS、agent、step budget、success metric、run_date |
| 电脑应用 | **OSWorld 2.0** | **发布：2026-06-28**；第三方索引 **2026-09-18** | 新版本，公开结果仍在累积 | 官方 benchmark + 第三方汇总 | 2.0、strict/binary vs partial、500-step 等预算、run_date |
| 电脑应用 | **WebArena-Verified（建议替代 WorkArena++）** | 公开索引：WebArena **2026-08-11**；Verified **2026-08-18** | 静态环境，持续新增模型行；较易形成可维护的公开列 | benchmark + 第三方结果索引 | WebArena/Verified、site state、agent/harness、tool access、run_date |
| 长上下文 | **RULER** | 无官方统一动态榜；第三方索引 **2026-06-04** | 合成任务可变 context length；结果强依赖长度和任务组合 | NVIDIA 官方题集 + 模型/论文结果 | RULER version、4K/32K/128K/256K/1M、13 tasks、precision、run_date |
| 长上下文 | **LongBench v2** | 无官方统一动态榜；公开结果索引 **2026-08-12** | 静态 v2 题集，结果多为自报；部分平台季度整理 | 官方题集 + 自报/镜像 | v2、context length、CoT、short/medium/long slice、run_date |
| 长上下文 | **AA-LCR** | Artificial Analysis **v1.1** 公布值的第三方读取快照 **2026-09-14** | 独立评测持续增列；建议以 AA 版本+抓取时点双标 | Artificial Analysis 评测 + 结果镜像 | AA-LCR version、no-tools、thinking level、context policy、run_date |

---

## 二、时间字段：网站不应该只放一个“更新时间”

每个 benchmark 建议至少保存以下字段：

```json
{
  "benchmark_id": "livebench",
  "benchmark_version": "2026-06-25",
  "benchmark_snapshot_at": "2026-06-25",
  "source_published_at": "2026-06-25",
  "site_collected_at": "2026-09-20T16:44:00+08:00",
  "source_type": "official_release",
  "row_run_date": null,
  "update_mode": "release_based"
}
```

### 前端显示规则

- **表头主标签**：`版本 2026-06-25` 或 `官方快照 2026-04-12`。
- **hover/详情抽屉**：显示 `本站采集：2026-09-20`、来源、版本、更新机制。
- **单个模型结果**：若可得，显示 `评测：YYYY-MM-DD`；不可得则写 `评测日期未披露`，不能用模型发布日期冒充。
- **不显示一个覆盖全站的“榜单更新于”日期**；那会误导用户以为 24 列数据同时发生。

### 建议的表头文案

> 24 个 benchmark 独立更新。表头显示题集版本或官方榜单快照；模型结果按原始来源的评测条件与日期入库。不同列仅用于观察能力版图，不构成同日横评或简单总分。

---

## 三、产品落地建议

1. **将 WorkArena++ 从首屏排名列移出**，保留在“扩展评测库”；以 **WebArena-Verified** 补位。
2. 对首页 24 列建立三类时间徽标：
   - `实时/高频`：LMArena、AA Index；
   - `版本制`：LiveBench、LiveCodeBench、Terminal-Bench、OSWorld 2.0、FrontierMath、ARC-AGI-2；
   - `结果汇总`：MMLU-Pro、GPQA、Aider、MathVista、BrowseComp、RULER、LongBench v2 等。
3. 不把“第三方平台最近抓到新数据”写成“官方榜单更新时间”。例如 **BFCL v4 官方更新时间是 2026-04-12**，第三方 9 月页面仅代表其自身数据库刷新。
4. Agent 和电脑应用类入库时，**排名主键不应是模型名**，而应至少为：

```text
benchmark_version + model_variant + agent_harness + tool_access + max_steps + metric_protocol + run_date
```

5. 主页排名更适合展示为 `#排名` + 信息图标；点击后展示“来源 / 版本 / 评测日 / 配置 / 证据等级”，避免单一数字制造虚假的确定性。

---

## 四、核查边界与后续动作

- 本表已区分“官方明确时间”和“第三方结果索引时间”。其中多项老牌公开数据集没有官方统一动态 leaderboard，不能编造一个“官方最后更新时间”。
- 下一步应将每一列的原始 URL、证据截图/抓取记录、模型行级条件写入独立 `benchmarks.json` 与 `leaderboard_snapshots.json`，再驱动网站；不要继续把日期与模型数硬编码在 HTML 演示数据内。
- 所有排名在上线前需逐行回链原始证据，特别是 SWE-bench、HLE、FrontierMath、Terminal-Bench、BrowseComp、OSWorld 等 agent/工具依赖型评测。
