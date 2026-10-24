#!/bin/bash
# PreToolUse-хук: не даёт обращаться к живому сайту в обход tools/safe-fetch.sh.
# 24.10.2026 WAF хостинга (Naxsi) забанил наш IP за пачку запросов curl к
# /.git/config и др. — сайт был недоступен ~30 минут.

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // ""')

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

SITE='pozitiv-psychology\.ru|141\.8\.192\.186|mila2026\.xsph\.ru'
SENSITIVE='/\.(git|env|svn|htaccess|htpasswd|claude)|/api/drafts|/api/offset|wp-admin|xmlrpc|phpmyadmin'

if [ "$tool" = "WebFetch" ]; then
  url=$(printf '%s' "$input" | jq -r '.tool_input.url // ""')
  if printf '%s' "$url" | grep -qiE "$SITE"; then
    deny "Запросы к pozitiv-psychology.ru — только через tools/safe-fetch.sh (лимит частоты, защита от бана WAF хостинга)."
  fi
  exit 0
fi

cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
# Пути к папкам на сервере (~/domains/pozitiv-psychology.ru/...) — не запросы к сайту.
cmd=$(printf '%s' "$cmd" | sed -E 's#domains/(pozitiv-psychology\.ru|mila2026\.xsph\.ru)#domains/SITEDIR#g')

# Запросы к служебным путям сайта запрещены всегда — именно за них WAF банит IP.
if printf '%s' "$cmd" | grep -qiE "($SITE)[^ ]*($SENSITIVE)"; then
  deny "Запрос к служебному пути сайта (/.git, /.env, /api/drafts…) запрещён: WAF хостинга банит за это IP. Проверяйте такие файлы по SSH (ls/stat), не по HTTP."
fi

# HTTP-клиенты к сайту — только через tools/safe-fetch.sh.
if printf '%s' "$cmd" | grep -qE '(^|[^a-zA-Z_-])(curl|wget|http|httpie|xh|ab|siege|lynx)([[:space:]]|$)' \
   && printf '%s' "$cmd" | grep -qiE "$SITE"; then
  # Разрешаем, только если все упоминания сайта не связаны с прямым curl/wget:
  # убираем вызовы safe-fetch и смотрим, остался ли HTTP-клиент рядом с сайтом.
  stripped=$(printf '%s' "$cmd" | sed -E 's#tools/safe-fetch\.sh[^;&|]*##g')
  if printf '%s' "$stripped" | grep -qE '(^|[^a-zA-Z_-])(curl|wget|http|httpie|xh|ab|siege|lynx)([[:space:]]|$)' \
     && printf '%s' "$stripped" | grep -qiE "$SITE"; then
    deny "Прямые curl/wget к pozitiv-psychology.ru запрещены (в т.ч. через ssh). Используйте tools/safe-fetch.sh /путь — он соблюдает паузы и лимит, чтобы WAF хостинга не заблокировал IP."
  fi
fi
exit 0
