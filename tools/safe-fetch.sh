#!/bin/bash
# Безопасные запросы к живому сайту pozitiv-psychology.ru.
#
# На хостинге Sprinthost стоит WAF (Naxsi): за пачку запросов к служебным
# путям (/.git/, /.env, ...) или «ботоподобные» запросы он банит IP на
# 15–30 минут — и сайт перестаёт открываться у всех, кто сидит за этим IP.
# Поэтому все проверки сайта идут только через этот скрипт:
#   - не чаще одного запроса в MIN_INTERVAL секунд (общий счётчик для всех
#     процессов, включая агентов);
#   - не больше MAX_PER_WINDOW запросов за WINDOW секунд;
#   - только GET/HEAD, с подписью обычного браузера;
#   - служебные и «сканерные» пути запрещены.
#
# Использование:
#   tools/safe-fetch.sh /contact.html              # код ответа
#   tools/safe-fetch.sh -I /css/index.css          # заголовки
#   tools/safe-fetch.sh -o page.html /articles/    # сохранить тело
#   tools/safe-fetch.sh -b /                       # тело в stdout

set -euo pipefail

BASE="https://pozitiv-psychology.ru"
MIN_INTERVAL=3
WINDOW=600
MAX_PER_WINDOW=40
STATE_DIR="${HOME}/.cache/pozitiv-safe-fetch"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
# Для проверки превью соцсетей можно подставить другое имя клиента (с теми же лимитами запросов):
#   SAFE_FETCH_UA="TelegramBot (like TwitterBot)" tools/safe-fetch.sh -I /index.html
UA="${SAFE_FETCH_UA:-$UA}"

mode="code"; out=""
while [ $# -gt 1 ]; do
  case "$1" in
    -I) mode="head"; shift ;;
    -b) mode="body"; shift ;;
    -o) mode="file"; out="$2"; shift 2 ;;
    *) break ;;
  esac
done
[ $# -eq 1 ] || { echo "usage: $0 [-I|-b|-o FILE] /path" >&2; exit 2; }

path="$1"
path="${path#$BASE}"
case "$path" in /*) ;; *) path="/$path" ;; esac

# Служебные пути, за которые WAF банит IP, и файлы с секретами.
# /api/*.php и /api/drafts.json разрешены (единичные проверки, что бот жив
# и что данные закрыты) — они не похожи на сканирование.
if printf '%s' "$path" | grep -qiE '(^|/)\.(git|env|svn|hg|htaccess|htpasswd|claude|ssh|DS_Store)|wp-|xmlrpc|phpmyadmin|\.(ps1|py|sh|sql|bak|zip|tar|gz|exe|log|ini|conf|yml|yaml)$|\.\./|%2e|%00|<|>|['"'"'"]|select|union'; then
  echo "safe-fetch: путь '$path' запрещён (служебный путь — WAF хостинга заблокирует IP). Проверяйте такие файлы по SSH: ls/stat на сервере." >&2
  exit 3
fi

mkdir -p "$STATE_DIR"
log="$STATE_DIR/requests.log"
lock="$STATE_DIR/lock"

# Общий замок: запросы из разных процессов идут строго по очереди.
exec 9>"$lock"
python3 -I -c 'import fcntl,sys; fcntl.flock(int(sys.argv[1]), fcntl.LOCK_EX)' 9 2>/dev/null || true

now=$(date +%s)
touch "$log"
recent=$(awk -v t=$((now - WINDOW)) '$1 > t' "$log" | wc -l | tr -d ' ')
if [ "$recent" -ge "$MAX_PER_WINDOW" ]; then
  echo "safe-fetch: лимит $MAX_PER_WINDOW запросов за $((WINDOW / 60)) мин исчерпан — подождите, чтобы не попасть под блокировку хостинга." >&2
  exit 4
fi
last=$(tail -n 1 "$log" | awk '{print $1}')
if [ -n "$last" ] && [ $((now - last)) -lt $MIN_INTERVAL ]; then
  sleep $((MIN_INTERVAL - (now - last)))
fi
date +%s >> "$log"
tail -n 500 "$log" > "$log.tmp" && mv "$log.tmp" "$log"

url="$BASE$path"
common=(-s --max-time 20 -A "$UA" -H "Accept-Language: ru-RU,ru;q=0.9")
case "$mode" in
  code) curl "${common[@]}" -o /dev/null -w '%{http_code} %{size_download}B %{time_total}s\n' "$url" ;;
  head) curl "${common[@]}" -I "$url" ;;
  body) curl "${common[@]}" "$url" ;;
  file) curl "${common[@]}" -o "$out" -w '%{http_code} %{size_download}B\n' "$url" ;;
esac
