# 安全审查与修复

日期：2026-10-01。范围：当前工作区的 Python API、SQLite、React/TypeScript 页面与领域逻辑、IndexedDB、Service Worker、资源下载、Canvas 分享、音频、启动及构建脚本和依赖锁文件。测试目标限于本机项目。攻击回归使用临时 SQLite 数据库与独立浏览器上下文；没有删除用户记录，没有测试第三方站点。

## 发现与处置

风险等级基于当前「本地优先、无账号、尚未公网部署」的实际用途。

| 项目 | 修复前证据与影响 | 处理与验证 |
|---|---|---|
| 中：匿名 API 资源滥用 | 70 KB 请求和短时间 35 次新抽牌均得到 201；无大小或频率边界，可持续占用 SQLite 和服务资源 | JSON 实际请求体最多 4096 字节，包括未声明长度及伪造长度的分块请求；接收超时 5 秒；每 IP 每分钟写 30 次、读 API 240 次，超出返回 429 和 Retry-After；限流状态最多 4096 个客户端；同时保留会话最多 10000 个，满时拒绝新增但允许幂等重试，过期项可回收 |
| 中：跨站调用与 DNS 重绑定防护缺失 | Origin 为外站的抽牌请求得到 201，任意 Host 得到 200；可被外站滥用本机服务 | 默认仅允许 127.0.0.1、localhost、::1；API 拒绝外站 Origin、null Origin 与 cross-site Fetch Metadata；额外站点须显式配置，不开启宽泛 CORS；启动不信任客户端转发头 |
| 中：资源与离线缓存边界不完整 | 清单 URL 缺少运行时约束，且旧 Worker 在所有缓存中查找任何路径；恶意清单或被污染的缓存可能替换应用资源 | 验证同源标准媒体路径、大小/数量/总量、SHA-256、唯一 URL、必需数据项；联网数据也校验哈希与版本；拒绝媒体重定向；Worker 只在媒体缓存读取 /media，JS/CSS 只读当前应用壳缓存；浏览器注入伪造 JS 的验证得到 404 |
| 中：缺少浏览器安全响应头 | 原页面没有 CSP、nosniff、frame protection | 加入严格同源 CSP、禁止内联脚本和 eval、禁止嵌入、nosniff、no-referrer、CORP、关闭不需要的设备权限；API no-store。真实浏览器确认内联脚本、事件属性与外部 fetch 被阻止 |
| 低：输入约束遗漏 | 空 dataset_version 得到 201；字符串缺少长度边界 | 限制标识符字符、长度与非空；拒绝重复 JSON 键、NaN/Infinity、畸形/过深 JSON、错误内容类型及压缩请求；保留严格整数、布尔、模式和数量校验 |
| 低：未知静态资源返回网页 | /assets/nonexistent.js 返回 200 HTML；可能掩盖资源加载故障 | 只有已有静态文件或已知 SPA 路由返回页面，其余为 404；路径穿越、.env、.git 和源代码路径测试不能读取文件 |
| 低：错误与损坏数据导致服务异常 | SQLite 连接依赖回收，坏片段 decodeURIComponent 会抛错，旧设置可能包含非法类型 | 显式关闭连接，SQLite 操作错误转换为不泄漏细节的 503；非法 URL 片段安全忽略；设置布尔与概率校验/规范化；会话校验数量、模式、牌组、方向及本轮请求是否匹配 |
| 开发工具依赖漏洞 | OSV 报告本项目虚拟环境 pip 24.3.1 的已知漏洞 | 从官方 PyPI 通过系统可信 TLS 获取 wheel，核对发布 SHA-256，更新为 26.2.1 并记录版本；再查 OSV 未返回已知漏洞 |

CSP 的样式允许 inline，因为当前布局使用 React style 和动态 CSS 变量；脚本不允许 unsafe-inline 或 unsafe-eval。图像与音频仅允许本站及本地产生的 Blob。默认关闭 /docs、/redoc 与 OpenAPI 下载；开发者显式启用 /docs 时，该页面单独允许 FastAPI 文档所需的 CDN 与初始化脚本，不放宽应用页面策略。

## 未复现的漏洞与已确认的安全属性

- SQL 注入：所有会话 SQL 使用占位符；搜索走纯数据匹配。注入样例只作为文字查询，没有改变数据库。
- 存储型 XSS：问题、笔记和标题通过 React 文本输出或 Canvas 绘制；没有 HTML 注入入口、eval 或动态执行用户字符串。含 img onerror / script 的问题与笔记，经过保存、刷新、历史展示均未执行。
- 隐私越权：没有云端历史/笔记接口、没有用户账号或身份边界。浏览器网络测试确认个人文字不包含在抽牌 POST 中。随机 UUID 用于幂等，重复参数重放保持同一结果；不能将已知请求 ID 改参数来覆盖会话。
- SSRF/远程代码执行：后端没有接收远程 URL 下载、上传、模板执行或命令执行的 API。素材工具的 subprocess 使用固定工具与参数数组，且不由网络接口调用。
- 路径穿越：前端文件路径经过 resolve 并检查目录边界；媒体由 StaticFiles 提供；编码穿越与敏感文件探测未泄漏文件。
- 离线资源每个文件在下载/修复时按长度和 SHA-256 校验，资源缺失撤销 ready；保存的个人记录没有因本次修复被上传或清除。

## 配置和运行

默认只监听本机，使用 start.command 或：

```bash
.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --no-proxy-headers --no-server-header
```

| 环境变量 | 默认 | 用途 |
|---|---|---|
| TAROT_ALLOWED_HOSTS | 127.0.0.1,localhost,::1 | 逗号分隔精确域名/IP，不带协议/端口，不支持 * |
| TAROT_ALLOWED_ORIGINS | 空 | 额外允许的完整来源，如开发代理变更 Host 后的 http://localhost:5173；不要添加不受信任站点 |
| TAROT_ENABLE_API_DOCS | 关闭 | 仅值 1 开启开发文档和 OpenAPI |
| TAROT_DB_PATH | var/tarot.sqlite3 | 服务器匿名会话数据库，勿放入公开静态目录 |

未来 HTTPS 代理部署应配置精确域名与外部 HTTPS 来源；若启用代理头解析，只信任实际反向代理 IP，并由代理覆盖清洗转发头。多人/多进程部署需在代理或网关统一限流，应用内计数仅对单进程生效。HSTS、TLS、流量/连接总量限制、备份、日志及依赖更新由部署层负责；当前没有部署或公网测试结果。

## 验证命令与结果

攻击用例保存在 backend/tests/test_security.py、frontend/src/domain/validation.test.ts、frontend/src/adapters/api.test.ts 与 frontend/tests/security.spec.ts，可重复执行。

```bash
.venv/bin/python -m pytest backend/tests -q
.venv/bin/python -m ruff check backend
.venv/bin/python -m ruff format --check backend
.venv/bin/python -m pip check
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run lint
cd frontend
npx playwright install chromium
npm run test:e2e
```

- 后端 68 项测试通过，其中新增攻击/安全回归 48 项；Ruff lint 与格式检查通过，pip check 无依赖冲突。
- 前端 41 项单元测试通过；TypeScript/Vite 构建、ESLint、git diff --check 通过。
- 电脑与手机 Chromium 全量浏览器运行：39 项通过、2 项因旧测试把牌面和逐张解读的同名方向文字当成唯一元素而失败、1 项手机场景主动跳过；定位范围修正后，仅重跑这 2 项均通过。合计 41 项通过、1 项预期跳过。8 项安全浏览器用例全部通过。
- WebKit 补测 4 项通过：CSP、媒体缓存隔离与 Range、非法片段、1/3/10 张分享及离线背景导出。
- 对已重启的 127.0.0.1:8000 直接复核：外站 Origin 403、伪造 Host 400、超大请求体 413、重复 JSON 键 422、表单 POST 415、敏感路径/缺失脚本/默认文档 404；页面响应包含 CSP/nosniff/DENY，Server 标识关闭。客户端关闭环境代理，确保请求直接到本机。
- 核心场景包括手动/快速抽取、78 张唯一牌组、逆位边界、并发幂等、选牌顺序与刷新恢复、每日结果/跨日、图鉴与搜索、历史与笔记、音频开关及音量、完整离线包、断网重开/抽牌/分享、1/3/10 张分享组件与默认隐私选项。

依赖查询：npm audit（包含开发依赖）未报告漏洞；25 个已安装第三方 Python 包查 OSV，仅旧 pip 有报告，更新后的 pip 单独复查没有报告。初次 Python urllib/pip 网络请求因本机证书链失败，随后改用系统 curl 的正常证书校验完成查询与 wheel 下载，没有关闭 TLS 验证。漏洞库可能有未收录问题，结果仅代表查询时的已知记录。

## 使用边界

个人记录保存在当前浏览器 IndexedDB，不是密码加密的保险库；具有本机用户权限或同源脚本执行权限的人仍可能读取本地数据。哈希用于完整性校验，不是独立签名，不能抵御服务器与其清单同时被控制。无账号的公共抽牌 API 仍可由非浏览器客户端正常调用，同源策略不是 API 身份验证。抽牌结果和未翻牌的牌组在客户端可查看，适合个人探索，不适合有奖励或需要防作弊的场景。

本次是源码审查和有边界的本机动态测试，未进行公网流量压测、主机/代理配置审计、第三方服务攻击或正式渗透认证。

参考：[OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)、[OWASP HTTP Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)、[OSV 官方接口](https://google.github.io/osv.dev/api/)、[npm audit](https://docs.npmjs.com/cli/commands/npm-audit)。
