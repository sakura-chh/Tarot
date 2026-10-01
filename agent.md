# Tarot 项目 Agent 工作指南

最后更新：2026-10-01｜版本：2.23｜保持约 200 行，随项目实际状态更新。
当前阶段：第一版本地应用已实现；公开仓库 sakura-chh/Tarot；牌义待审核，尚未部署公网。
用户最新明确要求优先于本文件；不要把计划中的路径或命令当作已实现事实。

## 1. 项目概述

- 面向自己和朋友的塔罗网页，适配手机和电脑浏览器。
- 使用 `assets/` 中的 78 张牌面；牌背使用 `design/hourglass-card-back.png`。
- 全站采用近黑星空背景、260 个逐渐闪烁、淡出消失后随机换位的星点、间歇流星与玻璃面板，保留复古衬线字体和原始牌面；原图与水印不修改。
- 首页三张牌自然叠放，不显示额外牌名与操作提示，可独立翻转换成不与当前牌重复的新牌，翻转播放现有翻牌音效并遵循音效开关；手机先展示牌，再展示缩小的宣传语与按钮，小屏首屏完整可见；桌面布局紧凑。「开始今日探索」采用深色半透明玻璃、浅金文字和细描边，悬停轻微提亮，并适配减少透明度和高对比度偏好。首页换牌不创建抽牌记录。
- 顶部悬浮导航、手机底部浮岛使用通透玻璃与滑动高光；按钮按压 0.96、内阴影与连续阻尼回弹，兼容键盘、快速连点与减少动态效果。
- 模式：每日一牌、两种三张牌阵、自由抽取 1–10 张；首页入口采用紧凑卡片，抽牌页直接展示四个模式按钮和选中状态。选牌中更换模式需确认，结果页可返回模式选择，历史和固定每日结果保留。
- 两种牌阵：过去 / 现在 / 未来；现状 / 阻碍 / 建议。
- 手动流程：扑克牌式分堆 / 交错 / 收拢 → 牌堆以 620 ms 移到实测摊牌起点 → 缓慢摊成 78 张圆弧 → 点击牌面升起 → 确认 → 翻牌。
- 同时提供快速抽取，取本轮洗好牌组的前 N 张；确认保存成功后平滑回到结果顶部并聚焦标题，减少动态效果时即时回顶。
- 圆弧下方直接展示放大的已选牌背、顺序与牌位，无外层方框；牌背采用与牌组中选中牌一致的金色描边、升起与编号，点击牌背即可放回；三张牌手机同排，自由多张自动换行，进度与确认操作放在独立底栏。
- 选牌顶部提供更换模式和重新抽牌；已选牌时重新抽牌需确认，再按本轮模式、数量和设置洗牌。标题区紧凑，牌组圆弧按窗口剩余高度缩放，洗牌后首屏完整显示并避开手机底部导航。
- 每日一牌按当前设备当地日期固定；刷新和改设置不重抽。
- 逆位可关闭；开启时默认 50%，提供按钮调整 0–100% 整数概率。
- 本轮设置和方向创建后固定，修改全局设置只影响下一轮。
- 78 张中文牌义参考神婆网重新整理；摘要、关键词、完整分主题释义及原文链接保存在 `backend/content/meanings_*.json`，待用户审核。
- 全站支持名称 / 别名 / 关键词查询、分类筛选、卡牌图鉴和详情；搜索与牌义弹窗共用半透明毛玻璃、边缘高光、固定标题和圆形关闭按钮，搜索框与筛选控件匹配玻璃风格。
- 查询弹层关闭后恢复抽牌状态，不丢所选牌与顺序。
- 类别、花色、历史模式和抽取数量统一使用玻璃下拉菜单，菜单与选择框等宽、边缘对齐，浮于浏览器顶层避免被容器裁剪；支持方向键、首尾键、文字定位、确认、Esc 收起和 Tab 切换，手机选项触控高度至少 44 px。
- 手机多牌以紧凑网格展示（三张同排，四至六张三列，七至十张五列），翻牌进度与“全部翻开”放在牌组上方；列表只展示名称和方向，摘要与完整释义通过点牌查看。
- 确认选牌后采用紧凑首屏翻牌区：1–10 张牌按窗口剩余高度缩放，手机 7–10 张以五列两行展示；名称、方向和详情入口保留，牌义通过点击牌面查看，综合解读与笔记放在下方。
- 牌义弹层采用半透明毛玻璃、细边缘高光与牌面玻璃相框；桌面左侧牌面与标题固定，右侧释义独立滚动，手机保持上下布局与整层滚动；标题背景贴合外框圆角，关闭按钮保留安全内边距；减少透明度与高对比度偏好提供实色回退。
- 翻开后提供逐张解读：按正逆位展示核心牌义、牌位作用、行动建议与思考问题，支持展开传统象征、感情和工作释义；仅展示已翻开的牌，单张也可用。多张全部翻开后再提供分段的整体脉络、牌间联系和行动建议；历史与离线同样可用。
- 本地保存历史、问题、笔记；浏览器生成 1200 px 分享 PNG。分享图采用中世纪油画背景与古金边饰，可勾选并排序卡牌画廊、核心牌义、牌位解读、综合解读、行动建议、问题和笔记；支持自定义标题、落款、色调及画廊/长卷排布，日期、牌位、金线边框可开关，问题与笔记每次默认关闭。背景随离线应用壳缓存，长文本按实际字体测量排版。
- 背景音乐使用用户提供的 assets/sounds.mp4 音轨，循环播放；洗牌和翻牌音效仍由脚本生成，音乐与音效分别开关、独立调节 0–100% 音量并保存偏好，拖动即时生效；旧设置默认补齐音乐 28%、音效 55%。
- 资源完整下载后支持离线；各设备独立保存，无账号和自动同步。
- 接口默认只允许本机 Host 与同源请求，JSON 请求体最多 4 KiB、5 秒接收超时，每 IP 每分钟写 30 / 读 240 次，活跃会话最多 10000 个；CSP、禁止嵌入与 nosniff 生效。API 文档需 TAROT_ENABLE_API_DOCS=1 显式启用，部署域名/额外来源通过 TAROT_ALLOWED_HOSTS / TAROT_ALLOWED_ORIGINS 配置。
- 卡牌数据与离线清单验证资源路径、类型、大小、哈希和版本；媒体缓存不参与 JS/CSS 查找，旧应用壳在更新激活后清理。安全审查范围、复现及限制见 docs/10-security-review.md。
- 原牌背保留存档，不参与新版展示；78 张牌在同页圆弧完整展开，不需要横向滚动；手机随容器缩放，减少动态效果时直接展开。
- 全站统一高清展示图；图鉴与历史保留懒加载，新记录保存高清图片快照。
- 所有详情入口按语义 ID 使用当前图鉴的完整牌义；旧结果摘要与笔记保留原快照。每次打开默认精简，完整模式与正逆位独立切换，不记忆阅读模式。

## 2. 技术栈

| 部分 | 技术 | 职责 |
|---|---|---|
| 后端语言 | Python | 主要在线业务与素材处理 |
| 后端框架 | FastAPI + Pydantic | API、校验、OpenAPI |
| 后端运行 | Uvicorn / ASGI | Python 服务进程 |
| 服务端数据库 | SQLite | 公共卡牌、牌阵、短期匿名会话 |
| 前端 | React + TypeScript + Vite | 界面、状态、动画、交互 |
| 客户端数据库 | IndexedDB | 个人记录、每日结果、设置 |
| 离线 | Service Worker + Cache Storage | 应用壳、媒体与数据包 |
| 素材工具 | Python + Pillow | 展示图、缩略图、哈希清单 |
| 分享与声音 | Canvas + 浏览器音频 | 本地 PNG、音乐及音效 |
| 验证工具 | pytest、Ruff、Vitest、Playwright | 算法、存储与浏览器流程 |

- 依赖遵循 backend/pyproject.toml 和 frontend/package-lock.json；Python 3.12+。
- 优先使用已有依赖和平台能力，不预先增加 Redis、队列或复杂状态框架。
- 前后端同域；生产使用 HTTPS，第一版无需用户认证服务。

## 3. 项目架构和关键文件

### 3.1 当前真实存在

- `README.md`、`start.command`：运行说明和 Mac 双击启动入口。
- `agent.md`：本工作指南，随实现同步更新。
- `docs/README.md`：需求与架构总入口。
- `docs/01-product-requirements.md`：功能范围与 F01–F12 需求。
- `docs/02-architecture.md`：Python / React 分工、会话、离线、部署。
- `docs/03-data-and-api.md`：数据结构、搜索规则、接口契约。
- `docs/04-design-and-interaction.md`：页面、复古视觉、动画、音频。
- `docs/05-delivery-and-acceptance.md`：阶段任务与 A01–A29 验收。
- `docs/06-github-references.md`：相关仓库、代码依据、许可与借鉴点。
- `docs/07-asset-inventory.md`：79 个素材的 ID 映射与 SHA-256。
- `docs/09-meaning-sources.md`：牌义结构、参考来源与内容整理范围。
- `docs/10-security-review.md`：接口、前端与依赖安全审查、攻击回归及部署边界。
- `assets/`：原始图片，78 张 JPG 和一张 PNG，使用 Git LFS；重建前执行 git lfs pull。

### 3.2 已实现目录与文件

```text
docs/images/                 # README 实际网页截图；独立牌面复用 media 高清图
backend/app/settings.py       # 服务路径与数据库配置
backend/app/main.py           # cards、spreads、sessions、resources 路由
backend/app/schemas.py        # 请求模型和输入校验
backend/app/rules.py          # 抽牌、搜索规则
backend/app/repository.py     # SQLite 持久化与幂等
backend/content/             # 可审核卡牌与牌义源数据
backend/scripts/              # 素材处理、内容导入、版本发布
backend/migrations/           # 数据迁移
backend/tests/                # 后端与算法测试
backend/pyproject.toml        # Python 依赖、开发工具
frontend/src/App.tsx          # 路由和全局控制器
frontend/src/features/        # draw、search、library、history、settings
frontend/src/domain/          # 类型、抽牌与搜索规则、牌阵综合解读
frontend/src/adapters/        # API、离线算法、IndexedDB
frontend/src/components/      # 弹层、星空、玻璃导航与按钮反馈
frontend/src/audio/           # 背景与音效控制
frontend/src/export/          # 分享图渲染
frontend/src/pwa/             # 下载、缓存、更新
frontend/package.json        # 前端依赖与脚本
shared-contracts/             # 两端共享随机测试向量
design/                       # 深紫底粉金线描对称沙漏牌背、提示词记录
media/                       # 生成后的不可变资源，原图不覆盖
```

### 3.3 关键约束

- Python 生成在线完整 78 张洗牌会话，浏览器保存后按 slot 选牌。
- 离线适配器遵循相同规则；网络恢复不替换当前结果。
- 同轮不重复；selected_slot_ids 顺序对应牌阵位置。
- 每日索引、结果与历史在 IndexedDB 事务中保存后才允许翻牌。
- 个人问题与笔记不上送；后端只短期保存匿名会话用于幂等重试。
- card_id 使用名称语义，不用文件前缀；特别检查 `41a`、正义 8、力量 11。
- 离线资源必须完整校验后才 ready，缺资源时撤销该状态。

## 4. 常用命令

所有命令默认在项目根目录执行。Mac 可以直接双击 start.command。
先检查实际文件和脚本再运行，禁止报告不存在的命令已经通过。

### 4.1 当前可用检查

```bash
pwd
rg --files docs
wc -l agent.md
rg -n '每日|逆位|离线|Python' docs agent.md
```

### 4.2 后端安装和启动

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e './backend[dev]'
python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000 --no-proxy-headers --no-server-header
```

`dev` 已声明；素材更改后运行 `.venv/bin/python backend/scripts/prepare_assets.py`。
仅修改牌义或音乐时可加 `--content-only` 复用图片和音效。脚本优先从 sounds.mp4 无损提取 AAC 并复用已生成的 M4A；无 afconvert 时直接发布 MP4 音轨。更新数据后需重启后端加载版本。

### 4.3 前端安装和启动

```bash
npm --prefix frontend install
npm --prefix frontend ci
npm --prefix frontend run dev -- --host 127.0.0.1
npm --prefix frontend run build
```

首次建立锁文件用 install；已提交有效锁文件后用 ci，二者不是每次都执行。
dev / build / lint / typecheck / test / test:e2e 均已实现；正式访问端口 8000。

### 4.4 检查与测试

```bash
python -m pytest backend/tests
python -m ruff check backend
python -m ruff format --check backend
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run test:e2e
```

浏览器测试需先启动服务并 `cd frontend && npx playwright install chromium`。

## 5. 测试和验证

- 修改前明确成功条件，依据改动范围选择必要检查。
- 修 bug 先复现问题；核心业务增加能发现错误的回归测试。
- 不为文案或可逆低影响调整编写镜像实现的测试。
- 后端重点：参数边界、无重复、概率 0 / 50 / 100、幂等、版本、搜索。
- 前端重点：选择顺序、方向固定、查询恢复、IndexedDB 事务、音频开关。
- 每日重点：当地日期、多标签页、刷新、删历史、改概率、网络切换。
- 离线重点：完整下载后断网重开、失败重试、哈希错误、缓存被清理。
- 两端运行共享随机输入和搜索样例，不要求真实随机流完全相同。
- 实机检查 375 px 手机、1440 px 桌面、键盘与减少动态效果。
- 分享图检查 1 / 3 / 10 张，默认不包含个人问题和笔记。
- 文档检查路径、链接、JSON 示例、需求与验收编号、素材数量和唯一 ID。
- 最终说明实际运行的检查、结果、未运行项及原因，不把计划当成验证。

## 6. 代码规范

- 优先复用现有组件、服务、数据模型和工具，先搜索再新增。
- 每个文件职责单一：路由不承载随机算法，组件不直接操作数据库。
- 抽牌、搜索、存储、音频、导出各自分层，不为一次性逻辑泛化框架。
- Python 函数和变量优先 snake_case；TypeScript 普通业务函数和变量可用 snake_case。
- 遵循实际模块现有风格；React 组件 / 类型用 PascalCase，Hooks 用 useXxx。
- 公共 API 字段采用 snake_case，前后端命名保持契约一致。
- Python 添加必要类型标注，TypeScript 使用明确类型，避免随意 any。
- 概率、数量和时间单位明确；关键配置集中定义，不散布魔法数字。
- 在每日事务、方向固定、幂等重试、日期边界、缓存更新处解释原因和约束。
- 关键逻辑优先使用中文注释说明原因和边界，不逐行复述代码；字段名和接口名保留原文，已有有意义注释翻译时保持原意。
- 遵循已有格式化和 lint 配置，不为个人偏好重排无关文件。
- 数据与规则变化同步更新 schema、测试、文档和版本。
- 仅清理本次修改产生的无用内容，不删除未要求处理的旧代码或素材。
- 外部代码复用先核对许可；不复制不明图文，记录来源和必要声明。

## 7. 工作原则和持续更新

- 先阅读相关文档、目标代码、调用方、数据结构和测试，再开始修改。
- 模糊、不确定或存在多个合理解释的问题，先向用户说明并确认。
- 确认前暂停依赖该答案的实现，可继续不受影响的检查和整理。
- 已确认的选择不反复询问；用户新指示及时纳入当前任务。
- 明确目标和验收条件，复杂任务给出简短步骤及每步验证方式。
- 优先最小改动：每个改动都应能追溯到用户需求或必要修复。
- 优先简单实现，不增加未要求功能、推测性扩展和无必要依赖。
- 保持现有风格，不顺手重构、移动文件或修改无关注释。
- 发现无关问题先说明，不擅自扩大范围；不覆盖用户尚未提交的修改。
- 及时验证，失败时修复或说明真实限制，完成后报告可审阅的文件。
- 需求、目录、依赖、命令或验证流程变化时，同一任务同步更新本文件。
- 更新最后日期与版本，计划项落实后改成真实路径和命令。
- 本文件保持约 200 行；详细内容归入 docs/，不积累冗长工作日志。
- 本文件是持续维护指南，不代表已设置后台自动更新任务。
- 原则参考：[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)。
- 核查来源：[karpathy-guidelines/SKILL.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/skills/karpathy-guidelines/SKILL.md)。
