#!/bin/bash
# Замена ключа Telegram-бота или ProxyAPI на сервере без показа ключа на экране и в переписке.
#   1. Скопируйте новый ключ (⌘C) — из @BotFather (/revoke, бот @psywebsite_bot) или из кабинета proxyapi.ru.
#   2. Запустите: tools/rotate-key.sh bot   или   tools/rotate-key.sh proxy
# Ключ берётся из буфера обмена (ничего не нужно вставлять в терминал), передаётся на сервер
# через ssh (stdin), после чего буфер обмена очищается. В файлах и истории команд ключа нет.
set -euo pipefail

kind="${1:-}"
case "$kind" in
  bot|proxy) ;;
  *) echo "Использование: сначала скопируйте ключ, затем $0 bot|proxy"; exit 2 ;;
esac

key="$(pbpaste | tr -d '[:space:]')"
if [ -z "$key" ]; then
  echo "Буфер обмена пуст — скопируйте новый ключ и запустите команду ещё раз."
  exit 1
fi

scp -q "$(dirname "$0")/rotate-key.php" sprinthost:domains/pozitiv-psychology.ru/rotate-key.php
printf '%s' "$key" | ssh sprinthost "php ~/domains/pozitiv-psychology.ru/rotate-key.php $kind 2>/dev/null"
unset key
pbcopy < /dev/null
echo "Буфер обмена очищен."
