#!/usr/bin/env bash
set -euo pipefail

PORT=3001

pids=""
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -t -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true)"
elif command -v fuser >/dev/null 2>&1; then
  pids="$(fuser ${PORT}/tcp 2>/dev/null || true)"
elif command -v ss >/dev/null 2>&1; then
  pids="$(ss -ltnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p {
    if (match($0, /pid=[0-9]+/)) {
      print substr($0, RSTART + 4, RLENGTH - 4)
    }
  }' || true)"
fi

if [ -z "${pids// /}" ]; then
  echo "No process listening on port $PORT."
  exit 0
fi

echo "Stopping process(es) on port $PORT: $pids"
# shellcheck disable=SC2086
kill $pids 2>/dev/null || true
sleep 1

still=""
if command -v lsof >/dev/null 2>&1; then
  still="$(lsof -t -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true)"
fi
if [ -n "${still// /}" ]; then
  # shellcheck disable=SC2086
  kill -9 $still 2>/dev/null || true
fi

echo "Done."
