# GitHub 相关项目与借鉴分析

调研日期：2026-09-30｜使用 GitHub 连接读取仓库、README、代码、数据和许可证

## 1. 调研方法与结论

检索 `tarot`、`塔罗`、`tarot language:Python`、`tarot FastAPI`、`tarot PWA`。结合本项目的 React、Python 后端、完整 78 张指定素材、固定中文牌义、离线、每日一牌及本地历史，选择下列六个仓库进行文件核查。

结论：参考已有项目的模型与交互思路，在自己的架构中实现。当前核查范围内没有一个仓库直接满足全部已确认需求。没有运行这些仓库或验证其线上 Demo；以下功能判断基于读取的源码，不把 README 宣称当作已通过测试。

星数为查询时的快照，只用于辅助判断关注度。`pushed_at` 是仓库级最近推送，不能据此认定默认分支近期更新；具体分析绑定下列默认分支 commit。

| 仓库 | 关注快照 | 核查默认分支提交日期（UTC） | 许可证核查 | 对本项目价值 |
|---|---:|---|---|---|
| MinatoAquaCrews/nonebot_plugin_tarot | 102 stars | 2023-03-28 | 独立 MIT LICENSE | Python、中文数据、配置牌阵 |
| dreamhunter2333/chatgpt-tarot-divination | 921 stars | 2026-08-26 | 独立 MIT LICENSE | React、本地记录、Python、AI 扩展 |
| uxiaohan/Tarot-Web | 113 stars | 2025-02-13 | 未发现独立 LICENSE，GitHub 未识别 | 手动选牌、洗牌、方向展示 |
| ekelen/tarot-api | 408 stars | 2023-12-21 | 未发现独立 LICENSE，GitHub 未识别 | 牌义字段、REST 查询与过滤 |
| realdennis/tarot | 22 stars | 2019-03-22 | 未发现独立 LICENSE，GitHub 未识别 | 每日结果、PWA 注册、分享入口 |
| refenir/tarotcards_fastapi | 0 stars | 2024-02-16 | 未发现独立 LICENSE，GitHub 未识别 | FastAPI 接口教学示例 |

## 2. Python 配置化模型：nonebot_plugin_tarot

[仓库](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot)｜[核查提交](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot/commit/5b8638f0e9421bc6b04ecc501d8d999e90e1cd79)

`tarot.json` 把 78 张卡牌与牌阵配置分开，卡牌包含中英文名称、类别、正逆位含义及图片映射；牌阵配置含数量、切牌和位置含义。适合借鉴其配置思路，定义本项目的稳定 card ID 与两种三张牌阵。[数据文件](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot/blob/5b8638f0e9421bc6b04ecc501d8d999e90e1cd79/nonebot_plugin_tarot/tarot.json)

`data_source.py` 使用 Python 抽样和图片处理，但整体依赖 NoneBot，不能作为网页后端直接套用。其 `_random_cards` 先随机选 key，再按字典遍历生成结果，输出顺序没有保留随机列表的顺序；本项目应按用户 selected slot 的顺序映射牌阵。[代码](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot/blob/5b8638f0e9421bc6b04ecc501d8d999e90e1cd79/nonebot_plugin_tarot/data_source.py)

代码许可证为 MIT；README 另列牌义和主题图片来源，因此不能将代码许可推断为所有第三方图文都已得到同一许可。本项目继续使用用户素材，自己整理牌义。[LICENSE](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot/blob/5b8638f0e9421bc6b04ecc501d8d999e90e1cd79/LICENSE)｜[资源说明](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot/blob/5b8638f0e9421bc6b04ecc501d8d999e90e1cd79/README.md)

## 3. React、本地记录与 AI：chatgpt-tarot-divination

[仓库](https://github.com/dreamhunter2333/chatgpt-tarot-divination)｜[核查提交](https://github.com/dreamhunter2333/chatgpt-tarot-divination/commit/2b73870e5400811f6f5172259d15aa767e06d194)

前端使用 React、TypeScript、Vite，后台有 Python FastAPI 相关模块。`divinationHistory.ts` 按类型保存 localStorage 历史，支持合并排序和删除，每种类型限制 10 条。可以借鉴记录字段与独立存储模块，但本项目用 IndexedDB、完整卡牌快照和每日唯一索引，不默认删除旧记录。[前端配置](https://github.com/dreamhunter2333/chatgpt-tarot-divination/blob/2b73870e5400811f6f5172259d15aa767e06d194/frontend/package.json)｜[历史模块](https://github.com/dreamhunter2333/chatgpt-tarot-divination/blob/2b73870e5400811f6f5172259d15aa767e06d194/frontend/src/utils/divinationHistory.ts)

塔罗后端提示词让模型自行抽三张牌。可以参考其解读服务的模块分层，但本项目必须先由抽牌引擎确定 card ID、方向及位置，再让未来的 AI 解释结果。第一版不接入模型、不增加其他占卜类型。[塔罗模块](https://github.com/dreamhunter2333/chatgpt-tarot-divination/blob/2b73870e5400811f6f5172259d15aa767e06d194/src/divination/tarot.py)

具有 MIT 许可证。以后实际复用代码应保留相关版权和许可文本，本次没有复制代码。[LICENSE](https://github.com/dreamhunter2333/chatgpt-tarot-divination/blob/2b73870e5400811f6f5172259d15aa767e06d194/LICENSE)

## 4. 手动选牌交互：Tarot-Web

[仓库](https://github.com/uxiaohan/Tarot-Web)｜[核查提交](https://github.com/uxiaohan/Tarot-Web/commit/dcf51b1cbac2430ef07088505ed2523d03e1d21d)

`Home.vue` 有 Fisher–Yates 洗牌、背面选择、最多三张和方向旋转展示。可参考“选牌→结果”的简短流程与选择反馈，但本项目需要完整 78 张、多种模式、逐张翻面、刷新恢复及离线。[页面代码](https://github.com/uxiaohan/Tarot-Web/blob/dcf51b1cbac2430ef07088505ed2523d03e1d21d/src/views/Home/Home.vue)

项目使用 Vue，牌组数组为 22 张，方向概率固定约 50%。不直接移植其页面，不将选牌数组在 number 和对象之间混用；React 使用明确的 slot ID、选择顺序和会话类型。本项目逆位概率可调整。[技术配置](https://github.com/uxiaohan/Tarot-Web/blob/dcf51b1cbac2430ef07088505ed2523d03e1d21d/package.json)

未在核查树中发现独立许可证文件，GitHub 元数据未识别许可证。当前只借鉴交互思路，不复制代码或图片。

## 5. 卡牌资料与查询：tarot-api

[仓库](https://github.com/ekelen/tarot-api)｜[核查提交](https://github.com/ekelen/tarot-api/commit/1a3cf8e17f036aeeb5d32fd6050deef5cced1662)

数据含英文名、短 ID、正位 / 逆位含义、描述；API 有全牌、单牌、搜索、随机及分类查询。可参考稳定标识和分离牌义字段，本项目补充中文、别名、关键词、素材映射与版本。[数据](https://github.com/ekelen/tarot-api/blob/1a3cf8e17f036aeeb5d32fd6050deef5cced1662/static/card_data.json)｜[接口](https://github.com/ekelen/tarot-api/blob/1a3cf8e17f036aeeb5d32fd6050deef5cced1662/app.js)

源码搜索在循环内重复覆盖过滤结果，不是本项目需要的条件相交；实现自己的明确搜索契约。项目使用 Node / Express，不符合主要后端语言要求；不依赖其公开服务可用性。本项目发布本地完整中文数据包以支持离线。

未发现独立 LICENSE，元数据未识别许可。只参考结构和接口思路；不直接搬运牌义文本。

## 6. 每日一牌与 PWA：realdennis/tarot

[仓库](https://github.com/realdennis/tarot)｜[核查提交](https://github.com/realdennis/tarot/commit/97b1c935a1070ee240d8f1bee4f66b0f16a0a4ea)

`Daily.vue` 保存当天结果并按剩余时间设置本地过期，重新打开读缓存；可借鉴复用当天结果的体验。项目还包括多语言和分享入口。本项目采用明确当地日期键、IndexedDB 唯一事务及翻牌前保存，避免只用过期毫秒数处理午夜。[每日页面](https://github.com/realdennis/tarot/blob/97b1c935a1070ee240d8f1bee4f66b0f16a0a4ea/src/views/Daily.vue)

有 Service Worker 注册及 cached、updated、offline 回调，说明考虑了 PWA 状态。它不能证明本项目所需完整 78 张资源、音频、版本包和哈希校验已覆盖；本项目另做显式离线下载清单与验收。[注册文件](https://github.com/realdennis/tarot/blob/97b1c935a1070ee240d8f1bee4f66b0f16a0a4ea/src/registerServiceWorker.js)

技术为旧版 Vue 项目，抽样使用重复重试；参考交互概念，算法使用完整 Fisher–Yates。未发现独立 LICENSE，元数据未识别许可，不复制代码。

## 7. Python 接口示例：tarotcards_fastapi

[仓库](https://github.com/refenir/tarotcards_fastapi)｜[核查提交](https://github.com/refenir/tarotcards_fastapi/commit/ed18853559ada07a624910133a431c5f09d33ea9)

教学示例包含卡牌分类 GET、创建阅读 POST、历史 GET 和 DELETE，可参考 FastAPI 路由及请求模型的基本拆分。源码是单文件，历史维护在进程内列表，阅读返回 base64 图像。本项目采用 SQLite 临时会话、客户端个人历史和同域媒体 URL，避免进程重启丢状态和大图塞进 JSON。[主代码](https://github.com/refenir/tarotcards_fastapi/blob/ed18853559ada07a624910133a431c5f09d33ea9/app/main.py)

它属于实验作业，不能当成成熟的部署或离线方案。其正则“可疑内容”筛查也不作为本项目输入安全设计；使用类型校验、参数化查询和纯文本显示。未发现独立 LICENSE，元数据未识别许可，只参考接口概念。

## 8. 借鉴到本项目的落点

| 借鉴点 | 本项目落点 | 实施方式 |
|---|---|---|
| Python 卡牌 / 牌阵配置 | content 源数据、SQLite、离线 JSON | 自定义稳定 ID 与审核流程 |
| 背面选择反馈 | React 选牌组件 | 78 slot 分组展示、保留选择顺序 |
| 正逆位独立字段 | Card 模型与方向快照 | 概率可调；翻牌不重新生成方向 |
| 每日结果复用 | daily_results | 当地日期唯一索引与事务 |
| 本地记录分层 | IndexedDB 适配器 | 保存问题、笔记、牌义与缩略快照 |
| REST 卡牌查询 | FastAPI cards 路由 | 多条件相交、中文检索、在线离线同规则 |
| PWA 状态反馈 | 资源管理器 | manifest 下载、哈希校验、失败重试 |
| AI 服务分层 | 后续 Python 解读模块 | 使用已确定结果，不让模型重新抽牌 |

## 9. 代码复用与许可记录

优先复用本项目已有组件、数据和职责分层。外部代码复用前核查精确文件来源、版本、许可文本和素材许可，并保留需要的声明；资料未明时参考概念，自行实现。

GitHub 官方说明，公开仓库可查看并不等于具有允许复制修改分发的开源许可。GitHub 的许可证识别也可能不完整，实际复用仍应核对仓库文件与作者说明。[GitHub 许可证文档](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

第一版应用采用本项目自主实现，没有复制六个参考仓库的代码、图片或牌义，也没有创建其派生应用。

## 10. agent.md 工作原则参考

用户指定参考 `andrej-karpathy-skills`；GitHub 搜索定位到 [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)，读取 README、CLAUDE.md 和实际技能文件。它总结了实现前明确假设、保持简单、只修改必要范围、用可验证条件完成任务四项原则。本项目将其改写成适合自身需求的中文工作约定，没有安装该技能或照搬整份文件。[核查技能文件](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/skills/karpathy-guidelines/SKILL.md)

这些原则用于根目录 [agent.md](../agent.md)，与用户明确提出的复用、单一职责、重点注释、下划线命名和持续更新要求结合。
