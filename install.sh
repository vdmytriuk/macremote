#!/bin/bash
# Встановлює MacRemote без попереджень Gatekeeper: curl не ставить атрибут карантину,
# тому macOS не блокує ні образ, ні додаток. Запуск:
#   curl -fsSL https://vdmytriuk.github.io/macremote/install.sh | bash
set -euo pipefail

# Повідомлення українською, якщо система українська, інакше англійською.
UK=0
case "${LC_ALL:-}${LANG:-}" in uk*) UK=1 ;; esac
say() { if [ "$UK" = 1 ]; then echo "→ $1"; else echo "→ $2"; fi; }

URL="https://github.com/vdmytriuk/macremote/releases/latest/download/MacRemote.dmg"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/macremote.XXXXXX")"
DMG="$WORK/MacRemote.dmg"
MNT="$WORK/mnt"

cleanup() {
  hdiutil detach "$MNT" -quiet 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

say "Завантажую MacRemote…" "Downloading MacRemote…"
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

say "Встановлено: $DEST/MacRemote.app" "Installed: $DEST/MacRemote.app"
if [ -z "${MACREMOTE_NO_OPEN:-}" ]; then
  say "Відкриваю. Дозвольте Accessibility, коли macOS запитає, потім: меню → «Показати QR-код…»." "Opening. Grant Accessibility when macOS asks, then: menu → “Show QR code…”."
  open "$DEST/MacRemote.app"
fi
