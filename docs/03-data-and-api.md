# 数据模型与 API 契约

版本：1.4｜日期：2026-10-01｜以当前代码和生成数据为准

第一版实现：SQLite 使用 `schema_migrations`、`cards(id, payload)` 和匿名 `draw_sessions`，公开数据由 `backend/content/cards.json` 导入。IndexedDB 使用 `meta`（设置、数据集、当前会话、离线状态）、`readings`、`daily_results` 三个 store；卡牌快照和高清牌面 `display_blob` 直接随新记录保存。下文描述当前实际结构；尚未实现的扩展仅在最后一节说明。

当前媒体路径为 `/media/v1/<card_id>-display-<hash>.webp`，数据版本 `2026.10.01.1`。API 文档默认关闭；设置 `TAROT_ENABLE_API_DOCS=1` 后重启可访问 `/docs` 和 `/openapi.json`；历史没有后端接口。前端查询当前已加载的完整数据集，采用与 Python API 相同的搜索契约。请求大小、同源、限流与安全配置见 [安全审查](10-security-review.md)。

## 1. 标识与版本约定

- `deck_id`：第一套提供的牌组定义为 `provided-deck-v1`，不把它命名为未经核实的具体版权牌组或传统体系。
- `card_id`：语义稳定，如 `major_fool`、`major_justice`、`wands_08`。不使用素材前缀数字或数组下标。
- `dataset_version`：一次完整卡牌、牌义和牌阵发布版本，当前为 `2026.10.01.1`。
- `app_version`：前端和后端应用发布号；`schema_version`：数据结构版本；媒体目前通过路径中的 v1 与内容哈希标识版本，不单独发布 asset_version 字段。
- UTC 时间使用 ISO 8601；当地日期为 `YYYY-MM-DD`，另存 IANA 时区名称。
- 所有 JSON 使用 UTF-8；概率使用百分比整数，绝不混用 `50` 与 `0.5`。
- API 统一前缀 `/api/v1`。资源采用带内容哈希的不可变 URL，如 `/media/v1/major_fool-display-c40d588cc711.webp`；当前 manifest 没有单独的 asset_version 字段。

完整的建议 card ID 与原文件映射见 [素材清单](07-asset-inventory.md)。

## 2. 卡牌模型

| 字段 | 类型 | 规则 |
|---|---|---|
| id | string | 同一牌组内稳定唯一 |
| deck_id | string | 属于当前提供的牌组 |
| name_zh | string | 简体中文名称 |
| name_en | string | 英文名称 |
| aliases | string[] | 如女教皇 / 女祭司等约定别名，内容审核时确定 |
| arcana | major / minor | 两种类别 |
| suit | swords / wands / pentacles / cups / null | 大阿尔卡那为 null |
| rank | ace / 02…10 / page / knight / queen / king / null | 大阿尔卡那为 null |
| display_number | integer / null | 素材中的大牌编号，正义 8、力量 11 |
| sort_order | integer | 完整牌组稳定排序，0–77 |
| keywords_upright | string[] | 中文正位关键词 |
| keywords_reversed | string[] | 中文逆位关键词 |
| meaning_upright | string | 正位精简摘要，抽牌、导出与速读使用 |
| meaning_reversed | string | 逆位精简摘要，抽牌、导出与速读使用 |
| meaning_details | object，可缺省 | 完整释义：overview、symbolism、upright、reversed；两个方向各含 general、love、career、advice |
| meaning_source | object，可缺省 | 参考资料名称 name 与单牌文章 url |
| meaning_version | string | 内容审核与记录快照使用 |
| content_status | draft / reviewed | 当前均为 draft，待内容审核 |
| images | object | 缩略图与展示图，不包含外部不稳定热链 |

下方为简化的结构示例，省略完整释义与来源；实际数据含完整 78 张卡牌。

当前 78 张发布卡牌都含 `meaning_details` 与 `meaning_source`，`meaning_version` 为字符串 `"2"`；旧记录的摘要保持原快照，点击详情则按语义 ID 从当前图鉴读取完整释义，找不到对应卡牌时才回退到快照。完整结构与参考资料见 [牌义来源](09-meaning-sources.md)。上述新增字段保持 schema_version 1 的兼容性。

```json
{
  "id": "major_fool",
  "deck_id": "provided-deck-v1",
  "name_zh": "愚者",
  "name_en": "Fool",
  "aliases": [],
  "arcana": "major",
  "suit": null,
  "rank": null,
  "display_number": 0,
  "sort_order": 0,
  "keywords_upright": ["开始", "探索"],
  "keywords_reversed": ["冲动", "准备不足"],
  "meaning_upright": "新阶段与探索的机会，也适合检查行动前的准备。",
  "meaning_reversed": "可以留意冲动或犹豫，重新评估风险与下一步。",
  "meaning_version": "2",
  "content_status": "draft",
  "images": {
    "thumbnail_url": "/media/v1/major_fool-thumb-3238a2dd4610.webp",
    "display_url": "/media/v1/major_fool-display-c40d588cc711.webp"
  }
}
```

images 当前只存两种资源地址。高清展示图长边为 1200 px，浏览器按图像自然比例显示；manifest 记录字节数和哈希，不记录图片宽高。

## 3. 牌阵模型

| id | 名称 | min_count | max_count | positions |
|---|---|---:|---:|---|
| daily | 每日一牌 | 1 | 1 | 今日提示 |
| past_present_future | 时间之流 | 3 | 3 | 过去、现在、未来 |
| situation_obstacle_advice | 内在指引 | 3 | 3 | 现状、阻碍、建议 |
| free | 自由探索 | 1 | 10 | 按数量生成第 N 张 |

positions 是按选择顺序排列的字符串数组，没有独立 position_id。自由探索配置为空数组，确认时生成“第 N 张”作为位置文字。

## 4. SQLite 运行时表

数据库默认位于 `var/tarot.sqlite3`，可用 `TAROT_DB_PATH` 覆盖。建表脚本为 `backend/migrations/001_init.sql`。

| 表 | 实际列 | 约束与用途 |
|---|---|---|
| schema_migrations | version INTEGER PRIMARY KEY | 当前仅记录版本 1，没有 applied_at 或自动回滚机制 |
| cards | id TEXT PRIMARY KEY, payload TEXT NOT NULL | 每张牌的完整 JSON；启动时由 cards.json 导入 |
| draw_sessions | request_id TEXT PRIMARY KEY, parameter_hash TEXT, response_json TEXT, expires_at REAL | 参数摘要和完整响应；expires_at 为 Unix 秒，有过期索引 |

牌组、牌阵和版本信息来自 `backend/content/cards.json`，没有独立 decks、spreads 或 dataset_releases 表。SQL 使用参数绑定；`BEGIN IMMEDIATE` 保证会话检查与创建处于同一写事务。同 request_id、同参数复用已有响应；参数变化返回 409。

会话保留 24 小时，每次创建请求先清理过期条目；最多保存 10000 个活跃会话。数据库忙或不可用返回统一 503，不暴露 SQLite 内部错误。匿名会话不包含问题、笔记、账号或设备指纹，也不提供个人历史服务。

## 5. IndexedDB 存储

数据库名 `paper-tarot`，版本 1。当前只有三个 object store，均通过显式 key 读写，没有额外索引。

| object store | 实际 key | 内容 |
|---|---|---|
| meta | settings / work / dataset / bundle | 设置、当前会话、完整校验后的数据集、离线包状态 |
| readings | 本地记录 UUID | 完整记录、卡牌文本快照及可选高清 Blob |
| daily_results | `deck_id:YYYY-MM-DD` 字符串 | 当天固定的完整记录，独立于历史存在 |

`work` 扩展 Session，增加 selected（有序 slot ID 数组）、phase（selecting / revealing）、question、可选 reading_id 和 group。group 为兼容已有记录保留的字段，当前圆弧不分组翻页。

`commit_reading` 在 readings、daily_results、meta 的同一个写事务内提交结果。多标签页竞争时复用先成功保存的每日记录；事务成功后才进入翻牌。清空历史只清理 readings，仍能恢复今日结果；清空个人数据清理历史、每日结果和 work / settings，保留 dataset / bundle 与媒体缓存。清理离线资源则不删除个人记录。

### 5.1 抽牌记录字段

以下名称与 `frontend/src/domain/types.ts` 的 Reading / PickedCard 一致。

| 字段 | 说明 |
|---|---|
| id / session_id | 本地记录 UUID 与原会话 ID |
| mode / deck_id | 模式与牌组；数量由 cards.length 推导，不单独保存 count |
| dataset_version / source | 产生结果时的数据版本及 server / offline 来源 |
| question / notes | 仅本地个人内容；界面分别限制 500 / 5000 字符 |
| created_at / local_date / timezone | UTC 时间、设备当地日期和时区 |
| settings_snapshot | 本轮逆位开关与百分比整数 |
| cards | 按选择顺序排列的 PickedCard 数组 |
| cards[].card | 当时完整 Card 文本与资源地址快照 |
| cards[].slot_id / is_reversed / position | 原 slot、固定方向与牌位文字 |
| cards[].display_blob | 可选高清牌面 Blob，在线素材不可用时回退 |
| revealed | 已翻开的 slot ID 数组，支持刷新恢复 |

Reading 不单独保存 schema_version、updated_at 或缩略图引用。结果摘要与笔记保留原快照；详情和逐张完整解读优先按语义 ID 使用当前图鉴，缺失时回退到快照。更新每日笔记和翻牌状态时同步更新 daily_results。

PNG 只临时生成供下载，不存入历史。分享问题与笔记每次默认关闭；勾选笔记时最多导出 700 个 Unicode 字符。

## 6. 搜索契约

1. Unicode NFKC 归一化，去掉首尾空白；英文统一小写，多空白压成一个。
2. q 按空白拆成多个词；每个词至少命中一个名称、别名、关键词或牌义字段；多个词之间使用 AND。
3. 名称、别名、关键词、牌义使用子串匹配，中文不强制分词。
4. q、arcana、suit 的条件同时成立才返回卡牌。无 q 即全牌；major 与特定 suit 同时筛选得到空列表，不擅自忽略条件。
5. 排序优先级：完整主名称命中、完整别名命中、名称前缀、关键词、牌义；同级按 sort_order，再按 id。
6. 空字符串搜索返回稳定的全牌列表；0 条结果是 200，不是 404。
7. 在线和离线使用相同归一化、匹配与排序测试样例，避免各自决定排序。

## 7. HTTP 接口

| 方法与路径 | 功能 | 核心参数 |
|---|---|---|
| GET /health | 服务是否存活 | 无；不回传服务器敏感路径 |
| GET /api/v1/meta | 当前版本与能力 | 返回 app_version、schema_version、dataset_version、card_count、deck_id |
| GET /api/v1/cards | 卡牌列表与组合查询 | q, arcana, suit, dataset_version |
| GET /api/v1/cards/{card_id} | 单张卡牌完整资料 | dataset_version 可选 |
| GET /api/v1/spreads | 四种模式和位置配置 | dataset_version 可选 |
| POST /api/v1/draw-sessions | 创建完整洗牌会话 | request_id、deck、mode、count、逆位设置、版本 |
| GET /api/v1/datasets/{version} | 完整不可变 JSON 数据 | 必须与 manifest 中哈希一致 |
| GET /api/v1/resources/manifest | 当前核心 / 音频资源包 | 无版本参数，返回当前清单 |
| GET /media/{version}/... | 图片、字体、音频 | 不可变路径 |

第一版没有账户、个人历史或笔记 CRUD API。个人记录通过客户端存储操作。浏览器分享图不需要上传接口。

### 7.1 查询请求与响应

例：`GET /api/v1/cards?q=开始&arcana=major`。

响应字段为 `dataset_version`、`total`、`items`；返回完整当前卡牌结构，最多 78 张，第一版无需服务端分页。详情不存在返回 404；非法分类枚举、超长 q 返回 422；q 长度上限为 100 字符。

未指定版本时返回当前版本；请求非当前版本返回统一 409；可通过 meta 获取当前版本。前端必须识别版本，不将不同版本的查询结果混入当前抽牌会话。

### 7.2 创建洗牌会话请求示例

```json
{
  "request_id": "e6d12936-779f-4ee1-8d3a-9d4dd4ea21bd",
  "deck_id": "provided-deck-v1",
  "dataset_version": "2026.10.01.1",
  "mode": "situation_obstacle_advice",
  "count": 3,
  "reversed_enabled": true,
  "reversed_probability": 50
}
```

请求不携带 question、notes、用户选择结果或已知 card ID。用户个人问题属于本地记录。

### 7.3 会话响应结构

| 字段 | 类型 | 规则 |
|---|---|---|
| session_id | string | 本次会话唯一 |
| request_id | UUID | 原请求 ID |
| source | server | 离线适配器返回 offline |
| schema_version / rules_version | string | 数据形状和抽牌规则兼容性 |
| dataset_version / deck_id | string | 会话绑定版本 |
| mode / count | enum / integer | 与请求一致 |
| created_at / expires_at | UTC time | 过期只影响服务器重试，不使已保存结果改变 |
| settings_snapshot | object | 逆位开关、概率 |
| slots | array[78] | 完整洗牌后的牌组，不是仅抽出的 N 张 |
| slots[].slot_id | string | slot-00 至 slot-77，列表与 ID 一致 |
| slots[].card_id | string | 78 张唯一 card ID 的排列 |
| slots[].is_reversed | boolean | 已固定方向 |

原 slot 的 card ID 和方向始终绑定。用户点击第 7 个背面选择的是 slot-06，不是在点击时再随机选牌。

首次生成返回 201，幂等复用返回 200，内容相同。API 调用方重试同一在线请求应沿用 request_id；重新洗牌使用新 request_id。当前网页遇网络失败或 5xx 会直接创建独立离线会话，不自动重放在线请求。客户端收到不合法响应（缺牌、重复牌、版本不符）时不进入选牌界面。

### 7.4 请求校验

- mode 必须为四种之一；count 使用严格整数类型，字符串与布尔值不能代替整数。
- daily 数量只能 1，两种牌阵只能 3，free 为 1–10。
- reversed_enabled 为布尔；概率为 0–100 整数，禁用时忽略其抽样作用，但保留快照。
- deck_id、dataset_version 长度 1–64，仅允许字母、数字、下划线、点和连字符，并检查牌组与当前版本。
- request_id 需为合法 UUID；同 ID 不同请求参数返回 409。
- 禁止额外未知字段、重复 JSON 键、NaN / Infinity 与过深结构。
- 写入仅接受未压缩 application/json，请求体最多 4096 字节，接收最多 5 秒；同时校验声明长度与实际字节。
- 校验 Host、Origin 与 Sec-Fetch-Site；每 IP 每分钟读 240 次、写 30 次，超限返回 429 与 Retry-After。

### 7.5 错误模型

```json
{
  "error": {
    "code": "DATASET_VERSION_UNAVAILABLE",
    "message": "数据版本已更新，请更新资源。"
  }
}
```

业务及安全拒绝响应统一包含 code 和 message，不附原请求内容、数据库信息或内部堆栈。框架的 405、静态文件 404 等响应可能使用 detail 字段。

| 状态 | 错误码 | 客户端处理 |
|---|---|---|
| 400 | INVALID_HOST / INVALID_CONTENT_LENGTH | 修正站点配置或请求格式 |
| 403 | CROSS_ORIGIN_DENIED | 从本站发起请求 |
| 404 | CARD_NOT_FOUND / DECK_NOT_FOUND / NOT_FOUND | 显示不存在 |
| 408 | REQUEST_TIMEOUT | 重新发起请求 |
| 409 | IDEMPOTENCY_CONFLICT / DATASET_VERSION_UNAVAILABLE | 不盲目重试，检查参数或更新数据 |
| 413 / 414 / 415 | PAYLOAD_TOO_LARGE / URI_TOO_LONG / UNSUPPORTED_MEDIA_TYPE | 缩小内容或修正媒体类型 |
| 422 | VALIDATION_ERROR | 修正 JSON、数量、概率或模式 |
| 429 | RATE_LIMITED | 按 Retry-After 等待；当前网页不会自动转离线 |
| 503 | SESSION_CAPACITY / STORAGE_UNAVAILABLE | 当前网页创建本地离线会话 |

当前前端仅在传输失败、超时或 HTTP 5xx 时自动回退离线。其他 HTTP 错误及非法会话响应会显示错误，不作为成功结果保存。

## 8. 资源 manifest

当前 manifest 包含 bundle_version、schema_version、dataset_version、dataset_url、total_bytes、items。每项含 url、group（core / audio）、bytes、sha256、mime_type、required；完整数据包也作为必需 core 条目携带 SHA-256。没有单独 asset_version 或顶层哈希。

total_bytes 等于全部条目的 bytes 之和，客户端进度采用校验成功的字节数，最终完成还必须核对必需项数量。清单最多 256 项、单项 32 MiB、总量 256 MiB，URL 必须位于规范的 `/media/vN/` 路径且不重复；下载拒绝重定向。资源哈希由 Python 生成，更新图片或音频产生新 URL，不原地覆盖已缓存 URL。

## 9. 将来 AI 接口

后续可增加 `POST /api/v1/interpretations`：接收用户主动同意提交的问题和已抽出的明确 card ID、方向、位置；服务端重读权威牌义并调用模型。AI 不改变抽牌结果。不在浏览器保存服务端模型密钥。

这个接口未纳入第一版实现或验收。第一版没有 AI 密钥、调用费用或模型服务依赖。
