#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

URL="http://localhost:3001"
PORT=3001
LOG_FILE="$ROOT/.accountz.log"

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -qE ":${PORT}\\b"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
  else
    curl -sf -o /dev/null --connect-timeout 1 "$URL"
  fi
}

open_app_window() {
  if command -v brave-browser >/dev/null 2>&1; then
    brave-browser --app="$URL" >/dev/null 2>&1 || true
  elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome --app="$URL" >/dev/null 2>&1 || true
  elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --app="$URL" >/dev/null 2>&1 || true
  elif command -v chromium >/dev/null 2>&1; then
    chromium --app="$URL" >/dev/null 2>&1 || true
  else
    xdg-open "$URL" >/dev/null 2>&1 || true
  fi
}

wait_for_server() {
  local elapsed=0
  local timeout=60
  while [ "$elapsed" -lt "$timeout" ]; do
    if curl -sf -o /dev/null --connect-timeout 1 "$URL"; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  echo "Timed out waiting for $URL after ${timeout}s."
  echo "Check the log: $LOG_FILE"
  return 1
}

if [ ! -d "$ROOT/node_modules" ]; then
  echo "node_modules missing — running npm install..."
  npm install
fi

if [ ! -f "$ROOT/.env.local" ]; then
  echo "Missing .env.local"
  echo "Create $ROOT/.env.local with:"
  echo "  DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
  exit 1
fi

if port_in_use; then
  echo "Port $PORT is already in use — opening the app."
  open_app_window
  exit 0
fi

echo "Starting Accountz (npm run dev) on port $PORT..."
nohup npm run dev >>"$LOG_FILE" 2>&1 &

wait_for_server

# Open as an app window. Blocking browsers keep this script until the window
# closes; the Node/Next server keeps running either way (same as account.vbs).
open_app_window
