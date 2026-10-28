<?php
// Бот для клиентов @Psyholog_Zolotova_bot: приветствие, запись прямо в боте и переписка с Камилой.
// Лежит вне папки сайта (~/domains/pozitiv-psychology.ru/client-bot.php), снаружи недоступен.
// Cron запускает его раз в минуту; он ~55 секунд забирает сообщения у Telegram (getUpdates),
// второй экземпляр сразу выходит. Ключ бота — в client-bot.token (0600) рядом.
//
// Всё клиентское живёт в этом боте: сообщения и заявки клиентов приходят Камиле в её чат с ботом
// (туда же api/chat.php присылает заявки с сайта). Каждое уведомление о клиенте бота записывается
// в client-bot-map.json (id уведомления → чат клиента): когда Камила отвечает на уведомление
// (функция "Ответить"), ответ уходит клиенту от этого же бота. @psywebsite_bot — только для статей.
$base = __DIR__;
$lock = fopen($base . '/client-bot.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit;

const KAMILA_CHAT_ID = '1436904081';
const SITE = 'https://pozitiv-psychology.ru/';
const STATE_TTL = 86400; // незаконченная запись хранится не дольше суток

$token = trim((string)@file_get_contents($base . '/client-bot.token'));
if ($token === '') exit(1);
$api = 'https://api.telegram.org/bot' . $token . '/';

$offsetFile = $base . '/client-bot.offset';
$stateFile  = $base . '/client-bot-state.json';
$mapFile    = $base . '/client-bot-map.json';
$logFile    = $base . '/client-bot.log';
$offset = (int)@file_get_contents($offsetFile);

// С хостинга до Telegram по IPv4 соединение часто зависает, по IPv6 — почти всегда проходит:
// до трёх попыток по IPv6, затем одна по IPv4. Неудачная отправка пишется в журнал.
function tg($api, $method, $params, $timeout = 20) {
    foreach ([CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V4] as $ip) {
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
    if ($method !== 'getUpdates') logLine($method . ' failed: no connection to Telegram');
    return null;
}

function logLine($text) {
    global $logFile;
    file_put_contents($logFile, date('c') . ' ' . $text . "\n", FILE_APPEND);
}

function readJson($file) {
    $data = json_decode((string)@file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function writeJson($file, $data) {
    $old = umask(077);
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    umask($old);
}

// ---------- состояние записи (по чату клиента) ----------
function getState($chatId) {
    global $stateFile;
    $all = readJson($stateFile);
    $s = $all[$chatId] ?? null;
    return ($s && time() - ($s['t'] ?? 0) < STATE_TTL) ? $s : null;
}

function setState($chatId, $s) {
    global $stateFile;
    $all = readJson($stateFile);
    foreach ($all as $k => $v) if (time() - ($v['t'] ?? 0) >= STATE_TTL) unset($all[$k]);
    if ($s === null) unset($all[$chatId]); else { $s['t'] = time(); $all[$chatId] = $s; }
    writeJson($stateFile, $all);
}

// ---------- уведомление Камиле с привязкой к чату клиента ----------
function notifyKamila($text, $clientChatId) {
    global $api, $mapFile;
    $sent = tg($api, 'sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => $text]);
    if (empty($sent['ok'])) return false;
    $map = readJson($mapFile);
    $map[(string)$sent['result']['message_id']] = (string)$clientChatId;
    if (count($map) > 1000) $map = array_slice($map, -1000, null, true);
    writeJson($mapFile, $map);
    return true;
}

function whoLine($from) {
    $name = trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? ''));
    return ($name !== '' ? $name : 'Без имени')
         . (!empty($from['username']) ? ' (@' . $from['username'] . ')' : ' (без @username)');
}

// ---------- клавиатуры ----------
function kb($rows) { return json_encode(['inline_keyboard' => $rows], JSON_UNESCAPED_UNICODE); }

function welcomeKeyboard() {
    return kb([
        [['text' => '📝 Записаться на бесплатную встречу', 'callback_data' => 'book']],
        [['text' => '💰 Цены и условия', 'url' => SITE . 'ceny.html'], ['text' => '🌿 О психологе', 'url' => SITE . 'about.html']],
        [['text' => '📚 Статьи', 'url' => SITE . 'articles/'], ['text' => '🌐 Сайт', 'url' => SITE]],
    ]);
}

function send($chatId, $text, $markup = null, $html = false) {
    global $api;
    $p = ['chat_id' => $chatId, 'text' => $text, 'disable_web_page_preview' => 'true'];
    if ($markup !== null) $p['reply_markup'] = $markup;
    if ($html) $p['parse_mode'] = 'HTML';
    return tg($api, 'sendMessage', $p);
}

// ---------- шаги записи ----------
function askConsent($chatId) {
    send($chatId, "📝 <b>Запись на бесплатную встречу-знакомство</b> (20 минут, по видеосвязи)\n\n"
        . "Я задам четыре коротких вопроса и передам ответы Камиле — она напишет вам и предложит время.\n\n"
        . "Для этого нужно ваше согласие на обработку персональных данных: имя, контакт и пара слов о запросе передаются Камиле Золотовой только для связи по записи. "
        . "<a href=\"" . SITE . "soglasie.html\">Текст согласия</a> · <a href=\"" . SITE . "privacy.html\">Политика конфиденциальности</a>",
        kb([[['text' => '✅ Даю согласие, продолжить', 'callback_data' => 'b_ok']], [['text' => 'Не сейчас', 'callback_data' => 'b_cancel']]]), true);
}

function askName($chatId, $from) {
    $rows = [[['text' => '✍️ Написать имя', 'callback_data' => 'b_name_write']]];
    $tgName = trim((string)($from['first_name'] ?? ''));
    if ($tgName !== '') $rows[] = [['text' => 'Можно просто: ' . mb_substr($tgName, 0, 40), 'callback_data' => 'b_name_tg']];
    send($chatId, "1/4. Как к вам обращаться?\n\nНажмите «Написать имя» или просто напишите его в поле сообщения внизу.", kb($rows));
}

function askContact($chatId, $from) {
    $rows = [];
    $rows[] = [['text' => '💬 Здесь, в Telegram', 'callback_data' => 'b_c_tg']];
    $rows[] = [['text' => '📱 WhatsApp', 'callback_data' => 'b_c_wa'], ['text' => '📞 Звонок', 'callback_data' => 'b_c_call']];
    send($chatId, "2/4. Как с Вами удобнее связаться?", kb($rows));
}

function askPhone($chatId) {
    global $api;
    tg($api, 'sendMessage', [
        'chat_id' => $chatId,
        'text' => "Напишите номер телефона — или нажмите кнопку внизу, чтобы отправить номер из Telegram.",
        'reply_markup' => json_encode(['keyboard' => [[['text' => '📱 Отправить мой номер', 'request_contact' => true]]],
            'resize_keyboard' => true, 'one_time_keyboard' => true], JSON_UNESCAPED_UNICODE),
    ]);
}

function askTopic($chatId) {
    send($chatId, "3/4. С каким вопросом хотите прийти? Пара слов, без подробностей о здоровье — всё остальное обсудите на встрече.\n\nНажмите «Написать» или просто напишите ответ в поле сообщения внизу.",
        kb([[['text' => '✍️ Написать', 'callback_data' => 'b_topic_write'], ['text' => 'Пропустить', 'callback_data' => 'b_topic_skip']]]));
}

// Открывает поле ввода с подсказкой (ответ на это сообщение приходит обычным текстом)
function askText($chatId, $prompt, $placeholder) {
    global $api;
    tg($api, 'sendMessage', ['chat_id' => $chatId, 'text' => $prompt,
        'reply_markup' => json_encode(['force_reply' => true, 'input_field_placeholder' => $placeholder], JSON_UNESCAPED_UNICODE)]);
}

function askTime($chatId) {
    send($chatId, "4/4. Когда вам удобнее встречаться? Время московское.", kb([
        [['text' => 'Будни, 10–13', 'callback_data' => 'b_t_1'], ['text' => 'Будни, 13–17', 'callback_data' => 'b_t_2']],
        [['text' => 'Будни, 17–20', 'callback_data' => 'b_t_3'], ['text' => 'Выходные', 'callback_data' => 'b_t_4']],
        [['text' => 'Не важно', 'callback_data' => 'b_t_5']],
    ]));
}

const TIMES = ['b_t_1' => 'будни, 10–13', 'b_t_2' => 'будни, 13–17', 'b_t_3' => 'будни, 17–20', 'b_t_4' => 'выходные (по договорённости)', 'b_t_5' => 'не важно'];

function contactLine($s) {
    if (($s['contact'] ?? '') === 'tg') return 'в Telegram (ответить через бота)';
    return (($s['contact'] ?? '') === 'wa' ? 'WhatsApp' : 'звонок') . ', ' . ($s['phone'] ?? '—');
}

function askConfirm($chatId, $s) {
    send($chatId, "Проверьте, всё ли верно:\n\n"
        . "Имя: " . $s['name'] . "\n"
        . "Связь: " . contactLine($s) . "\n"
        . "Вопрос: " . (($s['topic'] ?? '') !== '' ? $s['topic'] : '—') . "\n"
        . "Удобное время: " . $s['time'],
        kb([[['text' => '✅ Отправить заявку', 'callback_data' => 'b_send']],
            [['text' => '↩️ Заполнить заново', 'callback_data' => 'b_ok'], ['text' => '✖️ Отменить', 'callback_data' => 'b_cancel']]]));
}

function submitBooking($chatId, $s, $from) {
    $text = "🗓 Заявка из бота\n\n"
          . "Имя: " . $s['name'] . "\n"
          . "Связь: " . contactLine($s) . "\n"
          . "Вопрос: " . (($s['topic'] ?? '') !== '' ? $s['topic'] : '—') . "\n"
          . "Удобное время: " . $s['time'] . "\n"
          . "Telegram: " . whoLine($from) . "\n"
          . (!empty($s['src']) ? "Откуда: " . $s['src'] . "\n" : '')
          . "\nЧтобы написать клиенту, ответьте на это сообщение (Ответить).";
    $ok = notifyKamila($text, $chatId);
    logLine('booking from chat ' . $chatId . ': ' . ($ok ? 'ok' : 'FAILED'));
    setState($chatId, null);
    if ($ok) {
        send($chatId, "✅ Заявка отправлена! Камила напишет вам в течение суток и предложит время для бесплатной встречи. 🌿", welcomeKeyboard());
    } else {
        send($chatId, "Не получилось отправить заявку. Пожалуйста, напишите Камиле напрямую: @Kamila_Zolotova или в WhatsApp +7 (909) 903-00-00.", welcomeKeyboard());
    }
}

// Повторить вопрос текущего шага (например, после нажатия на кнопку из прошлого сообщения)
function reask($chatId, $s, $from) {
    switch ($s['step'] ?? '') {
        case 'consent': askConsent($chatId); break;
        case 'name':    askName($chatId, $from); break;
        case 'contact': askContact($chatId, $from); break;
        case 'phone':   askPhone($chatId); break;
        case 'topic':   askTopic($chatId); break;
        case 'time':    askTime($chatId); break;
        case 'confirm': askConfirm($chatId, $s); break;
        default:        send($chatId, "Давайте начнём сначала 🌿", welcomeKeyboard());
    }
}

// ---------- обработка ----------
function handleCallback($cb) {
    global $api;
    $chatId = $cb['message']['chat']['id'] ?? null;
    $data = (string)($cb['data'] ?? '');
    $from = $cb['from'] ?? [];
    tg($api, 'answerCallbackQuery', ['callback_query_id' => $cb['id']]);
    if ($chatId === null) return;
    $s = getState($chatId);

    if ($data === 'book') { setState($chatId, ['step' => 'consent', 'src' => $s['src'] ?? '']); askConsent($chatId); return; }
    if ($data === 'b_cancel') { setState($chatId, null); send($chatId, "Запись отменена. Если захотите вернуться — нажмите кнопку ниже или просто напишите сюда.", welcomeKeyboard()); return; }
    if ($s === null) { send($chatId, "Давайте начнём сначала 🌿", welcomeKeyboard()); return; }

    if ($data === 'b_ok') { $s = ['step' => 'name', 'src' => $s['src'] ?? '', 'consent' => date('c')]; setState($chatId, $s); askName($chatId, $from); return; }
    if ($data === 'b_name_write' && $s['step'] === 'name') { askText($chatId, "Напишите, как к вам обращаться 👇", 'Ваше имя'); return; }
    if ($data === 'b_name_tg' && $s['step'] === 'name') { $s['name'] = mb_substr(trim((string)($from['first_name'] ?? '')), 0, 60); $s['step'] = 'contact'; setState($chatId, $s); askContact($chatId, $from); return; }
    if (strpos($data, 'b_c_') === 0 && in_array($s['step'], ['contact', 'phone', 'topic', 'time', 'confirm'], true)) {
        $s['contact'] = substr($data, 4);
        if ($s['contact'] === 'tg') { $s['step'] = 'topic'; setState($chatId, $s); askTopic($chatId); }
        else { $s['step'] = 'phone'; setState($chatId, $s); askPhone($chatId); }
        return;
    }
    if ($data === 'b_topic_write' && $s['step'] === 'topic') { askText($chatId, "Напишите в паре слов, с каким вопросом хотите прийти 👇", 'Например: тревога перед сном'); return; }
    if ($data === 'b_topic_skip' && $s['step'] === 'topic') { $s['topic'] = ''; $s['step'] = 'time'; setState($chatId, $s); askTime($chatId); return; }
    if (isset(TIMES[$data]) && $s['step'] === 'time') { $s['time'] = TIMES[$data]; $s['step'] = 'confirm'; setState($chatId, $s); askConfirm($chatId, $s); return; }
    if ($data === 'b_send' && $s['step'] === 'confirm') { submitBooking($chatId, $s, $from); return; }
    // Кнопка из прошлого шага — напоминаем, на каком вопросе остановились
    reask($chatId, $s, $from);
}

// Камила отвечает (Ответить) на уведомление о клиенте — отправляем ответ клиенту
function handleKamilaReply($msg) {
    global $mapFile;
    $text = trim((string)($msg['text'] ?? ''));
    $map = readJson($mapFile);
    $clientChat = $map[(string)$msg['reply_to_message']['message_id']] ?? null;
    if ($clientChat === null) {
        send(KAMILA_CHAT_ID, "Ответить через бота можно только на сообщения и заявки из этого бота. Человеку с сайта напишите по контакту из заявки.");
        return;
    }
    if ($text === '') { send(KAMILA_CHAT_ID, "Пока через бота можно отправлять клиенту только текст."); return; }
    $res = send($clientChat, $text);
    tg($GLOBALS['api'], 'sendMessage', [
        'chat_id' => KAMILA_CHAT_ID,
        'reply_to_message_id' => $msg['message_id'],
        'text' => !empty($res['ok']) ? '✅ Отправлено клиенту' : '❌ Не удалось отправить: ' . ($res['description'] ?? 'нет связи с Telegram') . '. Возможно, клиент остановил бота.',
    ]);
    logLine('reply to chat ' . $clientChat . ': ' . (!empty($res['ok']) ? 'ok' : 'FAILED'));
}

function handleMessage($msg) {
    global $api;
    $chatId = $msg['chat']['id'] ?? null;
    if ($chatId === null || ($msg['chat']['type'] ?? '') !== 'private') return;
    $text = trim((string)($msg['text'] ?? ''));
    $from = $msg['from'] ?? [];

    // Ответ Камилы на уведомление. Остальные её сообщения обрабатываются как у клиента — так удобно проверять бота.
    if ((string)($from['id'] ?? '') === KAMILA_CHAT_ID && !empty($msg['reply_to_message']['message_id'])
        && ($msg['reply_to_message']['from']['is_bot'] ?? false)) {
        $replied = (string)($msg['reply_to_message']['text'] ?? '');
        // уведомления: 📩 сообщение клиента, 🗓 заявка из бота, 🔥 заявка с сайта
        if (strpos($replied, '📩') === 0 || strpos($replied, '🗓') === 0 || strpos($replied, '🔥') === 0) {
            handleKamilaReply($msg);
            return;
        }
    }

    // /start, в том числе с меткой источника: t.me/Psyholog_Zolotova_bot?start=direct
    if (preg_match('#^/start(?:\s+([A-Za-z0-9_-]{1,64}))?#', $text, $m)) {
        setState($chatId, !empty($m[1]) ? ['step' => 'idle', 'src' => $m[1]] : null);
        $name = trim((string)($from['first_name'] ?? ''));
        send($chatId, "Здравствуйте" . ($name !== '' ? ', ' . htmlspecialchars($name) : '') . "! 🌿\n\n"
            . "Я помощник психолога <b>Камилы Золотовой</b>. Камила работает онлайн в подходах КПТ и ДПДГ (EMDR): тревога, панические атаки, выгорание, отношения, финансовая тревога.\n\n"
            . "• Первая встреча — 20 минут, <b>бесплатно</b>\n"
            . "• Консультация — 5 000 ₽ за 50 минут\n\n"
            . "Нажмите «Записаться» — это займёт минуту. Или просто напишите сюда свой вопрос: его получит Камила и ответит лично.",
            welcomeKeyboard(), true);
        return;
    }

    $s = getState($chatId);
    $step = $s['step'] ?? 'idle';

    if ($step === 'name' && $text !== '') {
        $s['name'] = mb_substr($text, 0, 60); $s['step'] = 'contact'; setState($chatId, $s); askContact($chatId, $from); return;
    }
    if ($step === 'phone') {
        $phone = isset($msg['contact']['phone_number']) ? (string)$msg['contact']['phone_number'] : $text;
        $digits = preg_replace('/\D/', '', $phone);
        if (strlen($digits) < 10 || strlen($digits) > 15) {
            send($chatId, "Похоже, в номере ошибка. Напишите номер с кодом страны, например +7 900 000-00-00.");
            return;
        }
        $s['phone'] = mb_substr($phone, 0, 30); $s['step'] = 'topic'; setState($chatId, $s);
        tg($api, 'sendMessage', ['chat_id' => $chatId, 'text' => 'Спасибо, номер записан.', 'reply_markup' => json_encode(['remove_keyboard' => true])]);
        askTopic($chatId);
        return;
    }
    if ($step === 'topic' && $text !== '') {
        $s['topic'] = mb_substr($text, 0, 300); $s['step'] = 'time'; setState($chatId, $s); askTime($chatId); return;
    }
    if (in_array($step, ['consent', 'contact', 'time', 'confirm'], true)) {
        send($chatId, "Пожалуйста, выберите вариант кнопкой в сообщении выше 👆");
        return;
    }

    // Обычное сообщение — переписка с Камилой
    if ($text === '') {
        send($chatId, "Пока я умею передавать только текстовые сообщения. Напишите, пожалуйста, словами 🌿");
        return;
    }
    $ok = notifyKamila("📩 Сообщение от клиента\nОт: " . whoLine($from) . "\n\n" . mb_substr($text, 0, 3500)
        . "\n\nЧтобы ответить, нажмите на это сообщение → Ответить.", $chatId);
    logLine('message from chat ' . $chatId . ': ' . ($ok ? 'ok' : 'FAILED'));
    send($chatId, $ok
        ? "Спасибо! Сообщение передано Камиле — она ответит здесь же, в этом чате, в течение суток. 🌿"
        : "Не получилось передать сообщение. Пожалуйста, напишите Камиле напрямую: @Kamila_Zolotova.",
        welcomeKeyboard());
}

// Вебхук мешает getUpdates — снимаем, если кто-то его поставил
$info = tg($api, 'getWebhookInfo', [], 15);
if (!empty($info['result']['url'])) {
    tg($api, 'deleteWebhook', ['drop_pending_updates' => 'false'], 15);
    logLine('webhook removed');
}

$deadline = time() + 55;
while (time() < $deadline - 2) {
    $wait = min(25, $deadline - time() - 2);
    $r = tg($api, 'getUpdates', [
        'offset'          => $offset,
        'timeout'         => $wait,
        'allowed_updates' => json_encode(['message', 'callback_query']),
    ], $wait + 15);
    if (empty($r['ok'])) {
        logLine('getUpdates failed: ' . ($r['description'] ?? 'no response'));
        sleep(3);
        continue;
    }
    foreach ($r['result'] as $u) {
        // offset сохраняем до обработки: одно обновление не обрабатывается дважды
        $offset = (int)$u['update_id'] + 1;
        file_put_contents($offsetFile, $offset);
        if (isset($u['message'])) handleMessage($u['message']);
        elseif (isset($u['callback_query'])) handleCallback($u['callback_query']);
    }
}
