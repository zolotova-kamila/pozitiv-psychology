<?php
// Замена ключа Telegram-бота или ProxyAPI в api/article-bot.php и api/chat.php на сервере.
// Запускается из tools/rotate-key.sh: новый ключ приходит через stdin и нигде не печатается.
// Сначала проверяет новый ключ, потом сохраняет копию файлов, потом заменяет.
$kind = $argv[1] ?? '';
$base = __DIR__;
$files = [$base . '/public_html/api/article-bot.php', $base . '/public_html/api/chat.php'];
$new = trim((string)stream_get_contents(STDIN));

if ($kind === 'bot') {
    $var = 'BOT_TOKEN';
    $valid = preg_match('/^\d{6,12}:[A-Za-z0-9_-]{30,}$/', $new);
    $what = 'ключ (токен) бота вида 1234567890:AA…';
} elseif ($kind === 'proxy') {
    $var = 'PROXY_API_KEY';
    $valid = preg_match('/^sk-[A-Za-z0-9_-]{16,}$/', $new);
    $what = 'ключ ProxyAPI вида sk-…';
} else {
    echo "Использование: rotate-key.php bot|proxy\n";
    exit(2);
}
if (!$valid) { echo "❌ Это не похоже на $what. Ничего не изменено.\n"; exit(1); }

preg_match('/\$' . $var . '\s*=\s*[\'"]([^\'"]+)[\'"]/', (string)file_get_contents($files[0]), $m);
$old = $m[1] ?? '';
if ($old === '') { echo "❌ Не нашёл текущий ключ в article-bot.php. Ничего не изменено.\n"; exit(1); }
if ($old === $new) { echo "❌ Это тот же ключ, что стоит сейчас. Ничего не изменено.\n"; exit(1); }

function post($url, $fields, $headers = []) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $fields,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_CONNECTTIMEOUT => 15, CURLOPT_TIMEOUT => 40]);
    $raw = curl_exec($ch);
    return [curl_getinfo($ch, CURLINFO_HTTP_CODE), json_decode((string)$raw, true)];
}

// 1. Проверяем новый ключ до записи
if ($kind === 'bot') {
    [$code, $r] = post('https://api.telegram.org/bot' . $new . '/getMe', []);
    if (empty($r['ok'])) { echo "❌ Telegram не принял новый ключ (HTTP $code). Ничего не изменено.\n"; exit(1); }
    echo "✅ Новый ключ работает: бот @" . ($r['result']['username'] ?? '?') . "\n";
} else {
    [$code] = post('https://api.proxyapi.ru/v1/chat/completions', json_encode([
        'model' => 'openai/gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => 'ping']], 'max_tokens' => 3,
    ]), ['Content-Type: application/json', 'Authorization: Bearer ' . $new]);
    if ($code !== 200) { echo "❌ ProxyAPI не принял новый ключ (HTTP $code). Ничего не изменено.\n"; exit(1); }
    echo "✅ Новый ключ ProxyAPI работает\n";
}

// 2. Копия файлов (вне папки сайта, только для владельца)
$bdir = $base . '/backup-' . date('Y-m-d') . '-keys/api';
if (!is_dir($bdir)) mkdir($bdir, 0700, true);
foreach ($files as $f) {
    $copy = $bdir . '/' . basename($f) . '.before-' . $kind . '-' . date('His');
    copy($f, $copy);
    chmod($copy, 0600);
}

// 3. Замена с проверкой синтаксиса
foreach ($files as $f) {
    $c = (string)file_get_contents($f);
    $n = substr_count($c, $old);
    if ($n === 0) { echo "   " . basename($f) . ": старого ключа нет, пропускаю\n"; continue; }
    $tmp = $f . '.rotate-tmp';
    file_put_contents($tmp, str_replace($old, $new, $c));
    exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($tmp) . ' 2>/dev/null', $out, $rc);
    if ($rc !== 0) { unlink($tmp); echo "❌ " . basename($f) . ": ошибка синтаксиса после замены, файл не тронут\n"; exit(1); }
    file_put_contents($f, file_get_contents($tmp));
    unlink($tmp);
    echo "✅ " . basename($f) . ": ключ заменён ($n)\n";
}
echo "Готово. Копии прежних файлов: " . basename(dirname($bdir)) . "\n";
