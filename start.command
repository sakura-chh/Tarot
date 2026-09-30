#!/bin/zsh
set -eu
cd "${0:A:h}"

if [[ ! -x .venv/bin/python || ! -d frontend/node_modules ]]; then
  print '请先按照 README.md 安装依赖，再双击启动。'
  read -r '?按回车关闭…'
  exit 1
fi

print '正在构建纸境塔罗网站…'
npm --prefix frontend run build
print '网站地址：http://127.0.0.1:8000'
if curl --silent --fail --max-time 2 http://127.0.0.1:8000/health >/dev/null; then
  print '本地服务已在运行，正在打开浏览器。'
  open http://127.0.0.1:8000
  exit 0
fi

# Browser opening waits for the server rather than racing startup.
(
  for attempt in {1..30}; do
    if curl --silent --fail --max-time 1 http://127.0.0.1:8000/health >/dev/null; then
      open http://127.0.0.1:8000
      exit 0
    fi
    sleep 0.3
  done
) &
print '保持这个窗口打开；按 Control+C 停止网站。'
exec .venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload --no-access-log
