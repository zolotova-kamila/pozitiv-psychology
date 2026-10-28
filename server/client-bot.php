<?php
// Бот для клиентов @Psyholog_Zolotova_bot: приветствие с кнопками записи и пересылка сообщений Камиле.
// Лежит вне папки сайта (~/domains/pozitiv-psychology.ru/client-bot.php), снаружи недоступен.
// Cron запускает его раз в минуту; он ~55 секунд забирает сообщения у Telegram (getUpdates),
// второй экземпляр сразу выходит. Ключ бота — в client-bot.token (0600) рядом.
// Сообщения клиентов приходят Камиле через рабочий бот @psywebsite_bot (его ключ — в api/article-bot.php).
$base = __DIR__;
$lock = fopen($base . '/client-bot.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit;

const KAMILA_CHAT_ID = '1436904081';
const SITE = 'https://pozitiv-psychology.ru/';

$token = trim((string)@file_get_contents($base . '/client-bot.token'));
if ($token === '') exit(1);
$api = 'https://api.telegram.org/bot' . $token . '/';

// Ключ рабочего бота для уведомлений Камиле
preg_match('/\$BOT_TOKEN\s*=\s*[\'"]([^\'"]+)[\'"]/', (string)@file_get_contents($base . '/public_html/api/article-bot.php'), $m);
$notifyApi = isset($m[1]) ? 'https://api.telegram.org/bot' . $m[1] . '/' : '';
unset($m);

$offsetFile = $base . '/client-bot.offset';
$offset = (int)@file_get_contents($offsetFile);
$logFile = $base . '/client-bot.log';

function tg($api, $method, $params, $timeout = 20) {
    $ch = curl_init($api . $method);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $params,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => $timeout,
    ]);
    return json_decode((string)curl_exec($ch), true);
}

function logLine($file, $text) {
    file_put_contents($file, date('c') . ' ' . $text . "\n", FILE_APPEND);
}

function welcomeKeyboard() {
    return json_encode(['inline_keyboard' => [
        [['text' => '📝 Записаться на бесплатную встречу', 'url' => SITE . '#zapis']],
        [['text' => '💬 Написать Камиле в Telegram', 'url' => 'https://t.me/Kamila_Zolotova']],
        [['text' => '📱 WhatsApp', 'url' => 'https://wa.me/79099030000'], ['text' => '💰 Цены и условия', 'url' => SITE . 'ceny.html']],
        [['text' => '📚 Статьи', 'url' => SITE . 'articles/'], ['text' => '🌿 О психологе', 'url' => SITE . 'about.html']],
    ]], JSON_UNESCAPED_UNICODE);
}

function handleMessage($api, $notifyApi, $logFile, $msg) {
    $chatId = $msg['chat']['id'] ?? null;
    if ($chatId === null || ($msg['chat']['type'] ?? '') !== 'private') return;
    $text = trim((string)($msg['text'] ?? ''));
    $from = $msg['from'] ?? [];
    $name = trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? ''));

    if ($text === '' || preg_match('#^/start\b#', $text)) {
        tg($api, 'sendMessage', [
            'chat_id'      => $chatId,
            'parse_mode'   => 'HTML',
            'text'         => "Здравствуйте" . ($name !== '' ? ', ' . htmlspecialchars($name) : '') . "! 🌿\n\n"
                            . "Я помощник психолога <b>Камилы Золотовой</b>. Камила работает онлайн в подходах КПТ и ДПДГ (EMDR): тревога, панические атаки, выгорание, отношения, финансовая тревога.\n\n"
                            . "• Первая встреча — 20 минут, <b>бесплатно</b>\n"
                            . "• Консультация — 5 000 ₽ за 50 минут\n\n"
                            . "Выберите, как удобнее связаться, или просто напишите сюда, с каким вопросом хотите прийти, — сообщение получит Камила и ответит лично.",
            'reply_markup' => welcomeKeyboard(),
            'disable_web_page_preview' => 'true',
        ]);
        return;
    }

    // Любое другое сообщение — пересылаем Камиле через рабочий бот
    $who = ($name !== '' ? $name : 'Без имени')
         . (!empty($from['username']) ? ' (@' . $from['username'] . ')' : ' (без @username)')
         . ', id ' . ($from['id'] ?? '?');
    $sent = $notifyApi !== '' ? tg($notifyApi, 'sendMessage', [
        'chat_id' => KAMILA_CHAT_ID,
        'text'    => "📩 Сообщение в @Psyholog_Zolotova_bot\nОт: {$who}\n\n" . mb_substr($text, 0, 3500),
    ]) : null;
    logLine($logFile, 'forwarded message from id ' . ($from['id'] ?? '?') . ': ' . (!empty($sent['ok']) ? 'ok' : 'FAILED'));

    $reply = "Спасибо! Ваше сообщение передано Камиле — она ответит лично в течение суток. 🌿";
    if (empty($from['username'])) {
        $reply .= "\n\nУ вашего аккаунта нет имени пользователя (@username), поэтому Камила не сможет написать вам первой. Пожалуйста, оставьте здесь телефон для связи или напишите ей напрямую: @Kamila_Zolotova.";
    }
    tg($api, 'sendMessage', ['chat_id' => $chatId, 'text' => $reply, 'reply_markup' => welcomeKeyboard()]);
}

// Вебхук мешает getUpdates — снимаем, если кто-то его поставил
$info = tg($api, 'getWebhookInfo', [], 15);
if (!empty($info['result']['url'])) {
    tg($api, 'deleteWebhook', ['drop_pending_updates' => 'false'], 15);
    logLine($logFile, 'webhook removed');
}

$deadline = time() + 55;
while (time() < $deadline - 2) {
    $wait = min(25, $deadline - time() - 2);
    $r = tg($api, 'getUpdates', [
        'offset'          => $offset,
        'timeout'         => $wait,
        'allowed_updates' => json_encode(['message']),
    ], $wait + 15);
    if (empty($r['ok'])) {
        logLine($logFile, 'getUpdates failed: ' . ($r['description'] ?? 'no response'));
        sleep(3);
        continue;
    }
    foreach ($r['result'] as $u) {
        // offset сохраняем до обработки: одно сообщение не обрабатывается дважды
        $offset = (int)$u['update_id'] + 1;
        file_put_contents($offsetFile, $offset);
        if (isset($u['message'])) handleMessage($api, $notifyApi, $logFile, $u['message']);
    }
}
