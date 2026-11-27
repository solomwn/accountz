#!/usr/bin/env bash
# Build an installable .deb of Accountz.
#   Usage: ./packaging/build-deb.sh
#   Output: dist/accountz_<version>_amd64.deb
# Needs: node/npm, dpkg-deb, python3 (+ pillow, optional, for the icon).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./package.json').version")"
ARCH="$(dpkg --print-architecture)"
PKG="accountz_${VERSION}_${ARCH}"
STAGE="$ROOT/dist/$PKG"
DEB_SRC="$ROOT/packaging/deb"

echo "==> Building Accountz $VERSION ($ARCH)"
rm -rf "$STAGE"
mkdir -p "$STAGE"

[ -d node_modules ] || npm ci
# A DATABASE_URL is not needed at build time: every page is rendered on request.
NEXT_TELEMETRY_DISABLED=1 npx next build

echo "==> Staging files"
APP="$STAGE/opt/accountz"
mkdir -p "$APP/sql"
cp -a .next/standalone/. "$APP/"
mkdir -p "$APP/.next"
cp -a .next/static "$APP/.next/static"
[ -d public ] && cp -a public "$APP/public"
rm -f "$APP/.env" "$APP"/.env.* 2>/dev/null || true
# Next.js writes a small cache at runtime; /opt is read-only for the service,
# so point it at /var/lib/accountz (created by postinst).
rm -rf "$APP/.next/cache"
ln -s /var/lib/accountz/cache "$APP/.next/cache"

# SQL schema, in the order it must be applied
for f in init accounts-init budget-init categories-init category-groups-init \
         transfers-init scheduled-bills-init scheduled-bills-account-init account-types-init \
         loan-details-init; do
  cp "$f.sql" "$APP/sql/$f.sql"
done
printf '%s\n' init accounts-init budget-init categories-init category-groups-init \
  transfers-init scheduled-bills-init scheduled-bills-account-init account-types-init \
  loan-details-init > "$APP/sql/ORDER"

install -Dm755 "$DEB_SRC/accountz" "$STAGE/usr/bin/accountz"
install -Dm644 "$DEB_SRC/accountz.service" "$STAGE/lib/systemd/system/accountz.service"
install -Dm644 "$DEB_SRC/accountz.desktop" "$STAGE/usr/share/applications/accountz.desktop"

# Icon: convert favicon.ico to PNG if pillow is available, else ship the .ico
mkdir -p "$STAGE/usr/share/pixmaps"
if python3 -c "import PIL" 2>/dev/null; then
  python3 - "src/app/favicon.ico" "$STAGE/usr/share/pixmaps/accountz.png" <<'PY'
import sys
from PIL import Image
img = Image.open(sys.argv[1])
sizes = getattr(img, "ico", None) and img.ico.sizes()
if sizes:
    img.size = max(sizes)
img.convert("RGBA").save(sys.argv[2], "PNG")
PY
else
  cp src/app/favicon.ico "$STAGE/usr/share/pixmaps/accountz.png"
fi

echo "==> Writing package metadata"
mkdir -p "$STAGE/DEBIAN"
SIZE_KB="$(du -sk "$STAGE" | cut -f1)"
sed -e "s/@VERSION@/$VERSION/" -e "s/@ARCH@/$ARCH/" -e "s/@SIZE@/$SIZE_KB/" \
  "$DEB_SRC/control" > "$STAGE/DEBIAN/control"
for s in postinst prerm postrm; do
  install -m755 "$DEB_SRC/$s" "$STAGE/DEBIAN/$s"
done

echo "==> Building .deb"
dpkg-deb --root-owner-group --build "$STAGE" "$ROOT/dist/$PKG.deb" >/dev/null
rm -rf "$STAGE"
echo "Done: dist/$PKG.deb"
