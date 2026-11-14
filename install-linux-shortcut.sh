#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

START_SCRIPT="$ROOT/start-linux.sh"
STOP_SCRIPT="$ROOT/stop-linux.sh"
DESKTOP_TEMPLATE="$ROOT/accountz.desktop"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"
ICON_DEST="$ICONS_DIR/accountz.png"
DESKTOP_DEST="$APPS_DIR/accountz.desktop"
FAVICON="$ROOT/src/app/favicon.ico"

chmod +x "$START_SCRIPT" "$STOP_SCRIPT" "$ROOT/install-linux-shortcut.sh" 2>/dev/null || true

mkdir -p "$APPS_DIR" "$ICONS_DIR"

if [ ! -f "$FAVICON" ]; then
  echo "Warning: favicon not found at $FAVICON — desktop entry will have no custom icon."
  ICON_DEST=""
else
  converted=0
  if command -v convert >/dev/null 2>&1; then
    convert "$FAVICON" -thumbnail 256x256 "$ICON_DEST" && converted=1
  elif command -v magick >/dev/null 2>&1; then
    magick "$FAVICON" -thumbnail 256x256 "$ICON_DEST" && converted=1
  elif command -v python3 >/dev/null 2>&1; then
    if python3 - "$FAVICON" "$ICON_DEST" <<'PY'
import sys

src, dest = sys.argv[1], sys.argv[2]
try:
    from PIL import Image

    img = Image.open(src)
    img = img.convert("RGBA")
    img.thumbnail((256, 256))
    img.save(dest, format="PNG")
except Exception as exc:
    sys.stderr.write(f"PNG conversion failed: {exc}\n")
    sys.exit(1)
PY
    then
      converted=1
    fi
  fi

  if [ "$converted" -ne 1 ]; then
    ICON_DEST="$FAVICON"
    echo "Note: could not convert favicon to PNG (install ImageMagick or pillow for a better icon)."
    echo "Using $FAVICON as the icon path."
  fi
fi

if [ ! -f "$DESKTOP_TEMPLATE" ]; then
  echo "Missing template: $DESKTOP_TEMPLATE"
  exit 1
fi

sed \
  -e "s|__ACCOUNTZ_START__|\"$START_SCRIPT\"|g" \
  -e "s|__ACCOUNTZ_ICON__|$ICON_DEST|g" \
  "$DESKTOP_TEMPLATE" >"$DESKTOP_DEST"

chmod +x "$DESKTOP_DEST" 2>/dev/null || true

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
fi

echo "Installed desktop shortcut:"
echo "  $DESKTOP_DEST"
echo "Launch from the Zorin app menu as \"Accountz\", or run:"
echo "  $START_SCRIPT"
