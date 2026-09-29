#!/bin/bash
# Встановлює MacRemote без попереджень Gatekeeper: curl не ставить атрибут карантину,
# тому macOS не блокує ні образ, ні додаток. Запуск:
#   curl -fsSL https://vdmytriuk.github.io/macremote/install.sh | bash
set -euo pipefail

URL="https://github.com/vdmytriuk/macremote/releases/latest/download/MacRemote.dmg"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/macremote.XXXXXX")"
DMG="$WORK/MacRemote.dmg"
MNT="$WORK/mnt"

cleanup() {
  hdiutil detach "$MNT" -quiet 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "→ Завантажую MacRemote…"
curl -fsSL "$URL" -o "$DMG"

mkdir -p "$MNT"
hdiutil attach -nobrowse -quiet -mountpoint "$MNT" "$DMG"

# MACREMOTE_DEST і MACREMOTE_NO_OPEN потрібні лише для перевірки скрипта без встановлення.
if [ -n "${MACREMOTE_DEST:-}" ]; then
  DEST="$MACREMOTE_DEST"
  mkdir -p "$DEST"
elif [ -w /Applications ]; then
  DEST="/Applications"
else
  DEST="$HOME/Applications"
  mkdir -p "$DEST"
fi

if [ -z "${MACREMOTE_NO_OPEN:-}" ]; then
  osascript -e 'tell application id "com.valentyn.macremote" to quit' 2>/dev/null || true
  sleep 0.5
fi
if [ -d "$DEST/MacRemote.app" ]; then
  rm -rf "$DEST/MacRemote.app"
fi
ditto "$MNT/MacRemote.app" "$DEST/MacRemote.app"
xattr -dr com.apple.quarantine "$DEST/MacRemote.app" 2>/dev/null || true

echo "→ Встановлено: $DEST/MacRemote.app"
if [ -z "${MACREMOTE_NO_OPEN:-}" ]; then
  echo "→ Відкриваю. Дозвольте Accessibility, коли macOS запитає, потім: меню → «Показати QR-код…»."
  open "$DEST/MacRemote.app"
fi
