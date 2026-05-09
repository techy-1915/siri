#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
MODE="${MODE:-dev}"
if [[ -n "${RENDER:-}" ]]; then
  MODE="render"
fi

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

if [[ "$MODE" == "render" ]]; then
  BACKEND_PORT="${PORT:-$BACKEND_PORT}"
fi

install_backend_deps() {
  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    python3 -m venv "$BACKEND_DIR/.venv"
  fi
  if ! "$BACKEND_DIR/.venv/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"; then
    grep -v emergentintegrations "$BACKEND_DIR/requirements.txt" | \
      "$BACKEND_DIR/.venv/bin/python" -m pip install -r /dev/stdin
  fi
}

install_frontend_deps() {
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    npm --prefix "$FRONTEND_DIR" install --legacy-peer-deps
  fi
  npm --prefix "$FRONTEND_DIR" install ajv@8 ajv-keywords@5 --legacy-peer-deps
}

run_backend() {
  cd "$BACKEND_DIR"
  export PORT="$BACKEND_PORT"
  "$BACKEND_DIR/.venv/bin/uvicorn" server:app --host 0.0.0.0 --port "$BACKEND_PORT"
}

run_frontend_dev() {
  cd "$FRONTEND_DIR"
  export PORT="$FRONTEND_PORT"
  export REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:$BACKEND_PORT}"
  npm start
}

build_frontend() {
  cd "$FRONTEND_DIR"
  export REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:$BACKEND_PORT}"
  npm run build
}

install_backend_deps

if [[ "$MODE" == "render-build" ]]; then
  install_frontend_deps
  export REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-}"
  build_frontend
  exit 0
fi

if [[ "$MODE" == "render" ]]; then
  install_frontend_deps
  export REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-}"
  if [[ ! -d "$FRONTEND_DIR/build" ]]; then
    build_frontend
  fi
  export SERVE_FRONTEND=true
  run_backend
else
  install_frontend_deps
  run_backend &
  BACKEND_PID=$!
  trap 'kill "$BACKEND_PID"' EXIT
  run_frontend_dev
fi
