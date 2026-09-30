# 纸境 · Tarot Atelier

近黑星空、闪烁星点、偶尔划过的流星与通透玻璃导航的塔罗网页，保留复古牌面和衬线字体。Python / FastAPI 提供数据和抽牌接口，React / TypeScript 提供交互。
支持手机与电脑浏览器、78 张完整牌组、粉金线描对称沙漏牌背、扑克牌式洗牌、手动选牌与快速抽取。

GitHub 公开仓库：[sakura-chh/Tarot](https://github.com/sakura-chh/Tarot)。

## 获取项目

原始 `assets/` 素材约 1 GB，使用 Git LFS 保存；`media/` 网站资源直接包含在仓库中。
安装 [Git LFS](https://git-lfs.com/) 后克隆完整项目：

```bash
git lfs install
git clone https://github.com/sakura-chh/Tarot.git
cd Tarot
git lfs pull
```

只需要启动现有网站时，可用 `GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/sakura-chh/Tarot.git` 跳过原图下载；重新生成素材前执行 `git lfs pull`。

## 直接打开

在 Mac 上双击根目录的 **start.command**。它会构建前端、启动本地服务并打开浏览器。
保持终端窗口打开，网址为 **http://127.0.0.1:8000**；按 Control+C 停止。
如果服务已启动，会复用现有服务。修改后端后需重新启动现有服务。
不要直接双击 `frontend/index.html`；页面的数据和资源由 Python 服务提供。

## 首次安装

需要 Python 3.12+、Node.js 22.12+ 和 npm。在项目根目录执行：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e './backend[dev]'
npm --prefix frontend ci
```

需要复现本次验证环境时，pip 安装增加 `-c backend/requirements.lock.txt` 约束。

生成后的网页资源已包含在 `media/`。只有更改牌义或素材时才需要重新生成：

```bash
.venv/bin/python backend/scripts/prepare_assets.py
```

只修改牌义时，可复用现有图片和音频，更新在线数据及离线包：

```bash
.venv/bin/python backend/scripts/prepare_assets.py --content-only
```

手动构建与启动：

```bash
npm --prefix frontend run build
.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

前端开发可在另一个终端执行 `npm --prefix frontend run dev`，Vite 会代理 `/api` 和 `/media`。
离线功能使用正式构建地址验证，Vite 开发模式不注册 Service Worker。

## 第一版功能

- 首页三张牌可独立点击翻转、随机换牌；手机首屏同时展示牌面、宣传语与探索按钮。

- 每日一牌、过去／现在／未来、现状／阻碍／建议、自由抽取 1–10 张；首页紧凑入口，抽牌页四种模式按钮直接可见、选中高亮，选牌中和结果页均可返回模式选择。
- 分堆、交错、收拢洗牌动画，收好的牌堆平滑移到摊牌起点；整副 78 张牌从一叠缓慢摊成圆弧，同页完整展示；选中牌向圆弧外侧升起并显示顺序。
- 确认后回到结果顶部；手机多牌紧凑并排，牌组上方可全部翻开，点牌查看完整牌义；逆位可关闭，概率可设为 0–100%。
- 多张牌全部翻开后，独立展示牌阵综合解读：整体脉络、牌与牌的联系、可尝试的行动；支持历史和离线查看。
- 当天每日结果在当前设备固定；刷新、改概率和删除历史不重抽。
- 全站中文、英文、别名、关键词查询，分类筛选与正逆位牌义。
- 抽牌结果、历史、图鉴与查询详情都可切换精简 / 完整释义；每次打开默认精简。旧记录的卡牌详情使用当前完整释义，结果摘要和笔记保留原样。
- 全站卡牌使用长边 1200 px 高清图，列表按视口懒加载，分享导出使用同等清晰来源。
- 本地历史、问题和笔记；PNG 分享默认不包含个人内容。
- 顶部悬浮导航与手机底部玻璃浮岛、毛玻璃牌义弹层，菜单高光平滑切换；按钮按压缩放至 0.96、内阴影与阻尼回弹。
- 用户提供的 `assets/sounds.mp4` 已接入为循环背景音乐，可分别关闭音乐和洗牌／翻牌音效。
- 设置页下载并校验完整离线资源后，可断网重新打开和使用。

个人数据保存在当前浏览器，不上传后端，无账号和跨设备同步。
78 张中文牌义参考神婆网逐张重新整理，含精简摘要与分主题完整释义，并附对应原文链接；内容仍可继续逐张审核，第一版不接入 AI。整理范围与来源见 [牌义说明](docs/09-meaning-sources.md)。
网站还没有部署到公网。本机地址无法由手机直接访问；正式手机使用需要同域 HTTPS 部署。

## 关键文件

| 路径 | 职责 |
|---|---|
| `agent.md` | 持续维护的开发约定 |
| `docs/` | 产品、架构、API、交互、验收与 GitHub 借鉴分析 |
| `backend/app/` | FastAPI 路由、SQLite、校验、随机和查询规则 |
| `backend/content/meanings.py`、`meanings_*.json` | 78 张牌的中文名称、内容校验、摘要、关键词与完整释义源文件 |
| `backend/scripts/prepare_assets.py` | 生成压缩图片、音频、版本数据和 SHA-256 清单 |
| `frontend/src/features/` | 首页、抽牌、洗牌、图鉴、历史和设置 |
| `frontend/src/adapters/` | API 和 IndexedDB 存储 |
| `frontend/src/pwa/`、`frontend/public/sw.js` | 离线资源管理和 Service Worker |
| `design/hourglass-card-back.png` | 深紫底粉金线描对称沙漏牌背；提示词与版本记录见 `design/README.md` |
| `assets/` | 原始素材，保留图案与水印；原牌背存档，不参与网站展示 |
| `media/` | 网站使用的压缩资源，当前完整下载包约 29 MB |

## 验证

```bash
.venv/bin/python -m pytest backend/tests -q
.venv/bin/python -m ruff check backend
.venv/bin/python -m ruff format --check backend
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend test
```

浏览器测试需要先启动上述 Python 服务，并安装 Chromium：

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

浏览器验证覆盖桌面和手机、完整选牌、查询后恢复、每日固定、历史删除、离线重开与图片导出。
锁定的前端依赖见 `frontend/package-lock.json`，后端声明见 `backend/pyproject.toml`，验证环境约束见 `backend/requirements.lock.txt`。
