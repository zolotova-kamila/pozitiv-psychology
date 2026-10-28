<?php
// Приём сообщений бота опросом Telegram (getUpdates) вместо вебхука.
// Telegram не всегда может подключиться к хостингу, а сервер к Telegram — может.
// Снаружи в бота при этом входа нет: подделать запрос невозможно.
// Запускается cron'ом раз в минуту и работает ~55 секунд; второй экземпляр сразу выходит.
$base = __DIR__;
$lock = fopen($base . '/bot-poll.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit;

$bot = $base . '/public_html/api/article-bot.php';
$src = file_get_contents($bot);
if (!preg_match('/\$BOT_TOKEN\s*=\s*[\'"]([^\'"]+)[\'"]/', $src, $m)) exit(1);
$api = 'https://api.telegram.org/bot' . $m[1] . '/';
unset($src, $m);

$queueDir = $base . '/bot-poll-queue';
if (!is_dir($queueDir)) mkdir($queueDir, 0700);
$offsetFile = $base . '/bot-poll.offset';
$offset = (int)@file_get_contents($offsetFile);

// С хостинга до Telegram по IPv4 соединение часто зависает, по IPv6 — стабильно:
// сначала IPv6, при сбое соединения — повтор по IPv4.
function tg($api, $method, $params, $timeout) {
    foreach ([CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V4] as $ip) {
        $ch = curl_init($api . $method);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $params,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_IPRESOLVE      => $ip,
        ]);
        $raw = curl_exec($ch);
        if ($raw !== false) return json_decode((string)$raw, true);
    }
    return null;
}

// getUpdates не работает, пока включён вебхук
$info = tg($api, 'getWebhookInfo', [], 15);
if (!empty($info['result']['url'])) tg($api, 'deleteWebhook', ['drop_pending_updates' => 'false'], 15);

$deadline = time() + 55;
while (time() < $deadline - 2) {
    $wait = min(25, $deadline - time() - 2);
    $r = tg($api, 'getUpdates', [
        'offset'          => $offset,
        'timeout'         => $wait,
        'allowed_updates' => json_encode(['message', 'callback_query']),
    ], $wait + 15);
    if (empty($r['ok'])) {
        file_put_contents($base . '/bot-poll.log', date('c') . ' getUpdates failed: ' . ($r['description'] ?? 'no response') . "\n", FILE_APPEND);
        sleep(3); continue;
    }
    if ($r['result']) file_put_contents($base . '/bot-poll.log', date('c') . ' got updates: ' . implode(',', array_column($r['result'], 'update_id')) . "\n", FILE_APPEND);

    foreach ($r['result'] as $u) {
        $offset = (int)$u['update_id'] + 1;
        file_put_contents($offsetFile, $offset);
        // Каждое сообщение обрабатывает отдельный процесс, чтобы долгая генерация статьи
        // не задерживала ответы на другие кнопки
        $file = $queueDir . '/u_' . (int)$u['update_id'] . '.json';
        file_put_contents($file, json_encode($u));
        exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($bot) . ' ' . escapeshellarg($file)
            . ' > /dev/null 2>> ' . escapeshellarg($base . '/bot-poll.err') . ' &');
    }
}
