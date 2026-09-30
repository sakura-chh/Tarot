# 数据模型与 API 契约

版本：1.1｜日期：2026-09-30｜包含设计规格和第一版实际实现说明

第一版实现：SQLite 使用 `schema_migrations`、`cards(id, payload)` 和匿名 `draw_sessions`，公开数据由 `backend/content/cards.json` 导入。IndexedDB 使用 `meta`（设置、数据集、当前会话、离线状态）、`readings`、`daily_results` 三个 store；卡牌快照和高清牌面 `display_blob` 直接随新记录保存。下文更细的表拆分属于后续扩展设计。

当前媒体路径为 `/media/v1/<card_id>-display-<hash>.webp`，数据版本 `2026.09.30.4`。实际接口可访问 `/docs` 的 OpenAPI；历史没有后端接口。前端查询当前已加载的完整数据集，采用与 Python API 相同的搜索契约。

## 1. 标识与版本约定

- `deck_id`：第一套提供的牌组定义为 `provided-deck-v1`，不把它命名为未经核实的具体版权牌组或传统体系。
- `card_id`：语义稳定，如 `major_fool`、`major_justice`、`wands_08`。不使用素材前缀数字或数组下标。
- `dataset_version`：一次完整卡牌、牌义和牌阵发布版本，例如 `2026.09.30.1`，这里只是样例。
- `app_version`：前端和后端应用发布号；`schema_version`：数据结构版本；`asset_version`：素材转换发布版本。
- UTC 时间使用 ISO 8601；当地日期为 `YYYY-MM-DD`，另存 IANA 时区名称。
- 所有 JSON 使用 UTF-8；概率使用百分比整数，绝不混用 `50` 与 `0.5`。
- API 统一前缀 `/api/v1`。资源采用不可变 URL，格式如 `/media/<asset_version>/cards/<card_id>/display-<hash>.webp`。

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
| meaning_upright | string | 纯文本基础牌义 |
| meaning_reversed | string | 纯文本基础牌义 |
| meaning_version | string | 内容审核与记录快照使用 |
| content_status | draft / reviewed | 第一版正式发布要求全部 reviewed |
| images | object | 缩略图与展示图，不包含外部不稳定热链 |

卡牌样例中的牌义为结构示例，尚非完整的 78 张内容交付：

```json
{
  "id": "major_fool",
  "deck_id": "provided-deck-v1",
  "name_zh": "愚者",
  "name_en": "The Fool",
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
  "meaning_version": "1",
  "content_status": "draft",
  "images": {
    "thumbnail_url": "/media/v1/cards/major_fool/thumb-example.webp",
    "display_url": "/media/v1/cards/major_fool/display-example.webp",
    "width": 603,
    "height": 1000
  }
}
```

媒体路径和尺寸为示例；真实宽高由素材处理输出并写入 manifest，不通过拉伸强行匹配示例。

## 3. 牌阵模型

| id | 名称 | min_count | max_count | positions |
|---|---|---:|---:|---|
| daily | 每日一牌 | 1 | 1 | 今日提示 |
| past_present_future | 时间牌阵 | 3 | 3 | 过去、现在、未来 |
| situation_obstacle_advice | 建议牌阵 | 3 | 3 | 现状、阻碍、建议 |
| free | 自由抽取 | 1 | 10 | 按数量生成第 N 张 |

牌阵的每个位置具有独立稳定 `position_id`，如 `past`、`present`、`future`。位置文字是可审核的配置，不依赖组件内部硬编码。

## 4. SQLite 运行时表

| 表 | 关键列 | 约束与用途 |
|---|---|---|
| schema_migrations | version, applied_at | 按顺序记录迁移 |
| dataset_releases | version, schema_version, status, manifest_url, published_at | 只对外暴露完整发布版本 |
| decks | dataset_version, id, name, card_count, card_back_url | 组合唯一；card_count 为 78 |
| cards | dataset_version, deck_id, id, names, arcana, suit, rank, display_number, sort_order, meanings, keywords, image_urls | 组合主键；JSON 数组列校验格式 |
| spreads | dataset_version, id, name, min_count, max_count, positions_json | 位置及张数一致 |
| draw_sessions | request_id, parameter_hash, session_id, dataset_version, response_json, created_at, expires_at | request_id 唯一；24 小时后清理 |

SQL 查询使用参数绑定。导入时检查 78 个唯一 ID、22 张大牌、四个花色各 14 张、全部素材存在、正逆位内容完整。数据发布事务失败则保持之前版本。

`draw_sessions` 不包含个人问题、笔记、账号或设备指纹。临时匿名响应是重试机制，不作为历史记录服务。

## 5. IndexedDB 存储

| object store | 主键 / 索引 | 内容 |
|---|---|---|
| settings | 固定 key | 音频开关、音量、逆位开关、概率 |
| active_sessions | session_id | 模式、完整 slot 列表、selected_slot_ids、revealed_slot_ids、规则快照、阶段 |
| readings | UUID；created_at、mode、local_date 索引 | 完整抽牌记录、问题、笔记、牌义快照 |
| daily_results | [deck_id, local_date] 唯一 | 当天固定结果快照与 reading_id，可独立于历史存在 |
| datasets | dataset_version | 完整已校验卡牌 / 牌阵数据 |
| resource_downloads | [bundle_version, url] | 下载状态、大小、哈希校验结果 |
| bundle_state | 固定 key | 当前 active bundle、核心及音频 ready 状态 |
| asset_snapshots | 资源哈希 | 历史用缩略图 Blob，按引用清理 |

采用数据库 schema 升级迁移，避免升级应用时删除历史。Cache Storage 中的媒体由离线管理器单独维护。

### 5.1 抽牌记录字段

| 字段 | 说明 |
|---|---|
| id / session_id | 本地记录 ID 与原会话 ID |
| mode / count / deck_id | 模式、数量、牌组 |
| source | server 或 offline，仅说明产生位置 |
| question / notes | 仅本地个人内容 |
| created_at / local_date / timezone | UTC 时间与当地日期、时区 |
| dataset_version / schema_version | 产生结果时版本 |
| settings_snapshot | 逆位开关、概率整数 |
| selected_cards | 按选择顺序排列；每项含 position、slot、card ID、方向、名称、关键词、对应牌义快照、缩略图引用 |
| revealed_slot_ids | 已翻开的位置，支持刷新恢复 |
| updated_at | 笔记最后修改时间 |

保存牌义和名称快照，历史重现不改用最新文字。缩略图快照供素材更新后的历史展示；新版本高清图可作为增强显示，不能未经说明替换历史所用的不同牌图。

默认不保存导出的完整 PNG，以免占用过多空间。删除记录时，只清理已无引用的缩略快照；当前每日结果引用的快照仍保留。

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
| GET /api/v1/meta | 当前版本与能力 | 返回 app / schema / dataset / asset 版本、78 张牌、支持模式 |
| GET /api/v1/cards | 卡牌列表与组合查询 | q, arcana, suit, dataset_version |
| GET /api/v1/cards/{card_id} | 单张卡牌完整资料 | dataset_version 可选 |
| GET /api/v1/spreads | 四种模式和位置配置 | dataset_version 可选 |
| POST /api/v1/draw-sessions | 创建完整洗牌会话 | request_id、deck、mode、count、逆位设置、版本 |
| GET /api/v1/datasets/{version} | 完整不可变 JSON 数据 | 必须与 manifest 中哈希一致 |
| GET /api/v1/resources/manifest | 当前核心 / 音频资源包 | 可指定 dataset_version |
| GET /media/{version}/... | 图片、字体、音频 | 不可变路径 |

第一版没有账户、个人历史或笔记 CRUD API。个人记录通过客户端存储操作。浏览器分享图不需要上传接口。

### 7.1 查询请求与响应

例：`GET /api/v1/cards?q=开始&arcana=major`。

响应字段为 `dataset_version`、`total`、`items`；返回完整当前卡牌结构，最多 78 张，第一版无需服务端分页。详情不存在返回 404；非法分类枚举、超长 q 返回 422；q 长度上限设计为 100 字。

未指定版本时返回当前版本；请求已撤下版本返回 409，并附可用版本。前端必须识别版本，不将不同版本的查询结果混入当前抽牌会话。

### 7.2 创建洗牌会话请求示例

```json
{
  "request_id": "e6d12936-779f-4ee1-8d3a-9d4dd4ea21bd",
  "deck_id": "provided-deck-v1",
  "dataset_version": "2026.09.30.1",
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

首次生成返回 201，幂等复用返回 200，内容相同。第一次失败后重试必须沿用原 request_id；重新洗牌必须使用新的 request_id。客户端收到不合法响应（缺牌、重复牌、版本不符）时不进入选牌界面。

### 7.4 请求校验

- mode 必须为四种之一；count 为整数。
- daily 数量只能 1，两种牌阵只能 3，free 为 1–10。
- reversed_enabled 为布尔；概率为 0–100 整数，禁用时忽略其抽样作用，但保留快照。
- deck_id、dataset_version 必须存在且可用。
- request_id 需为合法 UUID；同 ID 不同请求参数返回 409。
- 禁止额外未知请求字段，避免开发时静默丢弃错误参数。

### 7.5 错误模型

```json
{
  "error": {
    "code": "DATASET_VERSION_UNAVAILABLE",
    "message": "请求的数据版本已不可用，请更新资源后重试。",
    "request_id": "e6d12936-779f-4ee1-8d3a-9d4dd4ea21bd",
    "details": {
    "available_version": "2026.09.30.4"
    }
  }
}
```

| 状态 | 错误码 | 客户端处理 |
|---|---|---|
| 404 | CARD_NOT_FOUND / DECK_NOT_FOUND | 显示不存在，允许返回查询 |
| 409 | IDEMPOTENCY_CONFLICT | 不盲目重试；开发错误或创建新一轮 |
| 409 | DATASET_VERSION_UNAVAILABLE | 提示更新；有完整本地包可按其旧版本离线继续 |
| 422 | VALIDATION_ERROR | 提示数量、概率或模式格式问题 |
| 429 | RATE_LIMITED | 等待 Retry-After；可用本地包时使用离线模式 |
| 500 / 503 | SERVICE_UNAVAILABLE | 有本地包时切换离线，否则提示稍后重试 |

上述 404、409、422 的业务错误不伪装成网络失败。只有传输失败、超时和明确服务不可用触发自动离线回退；版本冲突的离线继续应展示当前版本说明。

## 8. 资源 manifest

manifest 包含 bundle_version、schema_version、dataset_version、asset_version、完整数据包 URL 与 SHA-256；资源列表每项含 URL、group（core / audio）、bytes、sha256、mime_type、required。

total_bytes 等于全部条目的 bytes 之和，客户端进度采用校验成功的字节数，最终完成还必须核对必需项数量。资源哈希由 Python 生成，更新图片或音频产生新 URL，不原地覆盖已缓存 URL。

## 9. 将来 AI 接口

后续可增加 `POST /api/v1/interpretations`：接收用户主动同意提交的问题和已抽出的明确 card ID、方向、位置；服务端重读权威牌义并调用模型。AI 不改变抽牌结果。不在浏览器保存服务端模型密钥。

这个接口未纳入第一版实现或验收。第一版没有 AI 密钥、调用费用或模型服务依赖。
