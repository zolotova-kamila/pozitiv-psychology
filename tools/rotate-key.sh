#!/bin/bash
# Замена ключа Telegram-бота или ProxyAPI на сервере без показа ключа на экране и в переписке.
#   tools/rotate-key.sh bot     — новый токен из @BotFather (/revoke)
#   tools/rotate-key.sh proxy   — новый ключ из личного кабинета proxyapi.ru
# Ключ вводится скрыто и передаётся на сервер через ssh (stdin), в файлах и истории не остаётся.
set -euo pipefail

kind="${1:-}"
case "$kind" in
  bot)   prompt='Вставьте новый ключ (токен) бота из @BotFather и нажмите Enter (ввод не виден): ' ;;
  proxy) prompt='Вставьте новый ключ ProxyAPI и нажмите Enter (ввод не виден): ' ;;
  *) echo "Использование: $0 bot|proxy"; exit 2 ;;
esac

scp -q "$(dirname "$0")/rotate-key.php" sprinthost:domains/pozitiv-psychology.ru/rotate-key.php
read -r -s -p "$prompt" key
echo
[ -n "$key" ] || { echo "Пусто — ничего не изменено."; exit 1; }
printf '%s' "$key" | ssh sprinthost "php ~/domains/pozitiv-psychology.ru/rotate-key.php $kind 2>/dev/null"
unset key
