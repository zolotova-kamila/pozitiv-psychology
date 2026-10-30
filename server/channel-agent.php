<?php
// Агент Telegram-канала @Psy_Zolotova_Kamila: пишет посты по статьям сайта, присылает черновики Камиле
// в @psywebsite_bot и публикует в канал только после её одобрения.
// Лежит вне папки сайта (~/domains/pozitiv-psychology.ru/channel-agent.php). Ключи бота и ProxyAPI берёт из api/article-bot.php.
//
//   php channel-agent.php draft            — подготовить черновик (cron: пн, ср, пт в 10:00)
//   php channel-agent.php tick             — опубликовать одобренные посты, перенести неодобренные (cron: каждые 10 минут)
//   php channel-agent.php cb <data>        — нажатие кнопки под черновиком (вызывает api/article-bot.php)
//   php channel-agent.php redo <id> <текст> — переписать черновик с поправками Камилы (вызывает api/article-bot.php)
//
// Правила (согласованы 2026-10-28): 3 поста в неделю, черновик в 10:00, публикация в 19:00 после одобрения;
// без одобрения пост не публикуется и переносится на следующий день; пост — текст до ~2000 знаков,
// обложка статьи крупно над текстом (превью ссылки), ссылка на статью и приглашение в @Psyholog_Zolotova_bot,
// примерно каждый третий пост вместо приглашения заканчивается вопросом к подписчикам.
$base = __DIR__;
date_default_timezone_set('Europe/Moscow');

const CHANNEL = '@Psy_Zolotova_Kamila';
const KAMILA_CHAT_ID = '1436904081';
const SITE = 'https://pozitiv-psychology.ru/';
const PUBLISH_HOUR = 19;
const MAX_POST_LEN = 3300; // с запасом до лимита Telegram 4096 с учётом ссылки и приглашения

$stateFile = $base . '/channel-posts.json';
$logFile = $base . '/channel-agent.log';

$botSrc = (string)@file_get_contents($base . '/public_html/api/article-bot.php');
preg_match('/\$BOT_TOKEN\s*=\s*[\'"]([^\'"]+)[\'"]/', $botSrc, $m1);
preg_match('/\$PROXY_API_KEY\s*=\s*[\'"]([^\'"]+)[\'"]/', $botSrc, $m2);
if (empty($m1[1]) || empty($m2[1])) exit(1);
$api = 'https://api.telegram.org/bot' . $m1[1] . '/';
$proxyKey = $m2[1];
unset($botSrc, $m1, $m2);

// ---------- общее ----------
function logLine($text) {
    global $logFile;
    file_put_contents($logFile, date('c') . ' ' . $text . "\n", FILE_APPEND);
}

// С хостинга до Telegram по IPv4 соединение часто зависает: до трёх попыток по IPv6, затем IPv4
function tg($method, $params, $timeout = 20) {
    global $api;
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
    logLine($method . ' failed: no connection to Telegram');
    return null;
}

function loadState() {
    global $stateFile;
    $s = json_decode((string)@file_get_contents($stateFile), true);
    return is_array($s) ? $s + ['posts' => [], 'next_id' => 1] : ['posts' => [], 'next_id' => 1];
}

function saveState($s) {
    global $stateFile;
    $old = umask(077);
    file_put_contents($stateFile, json_encode($s, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    umask($old);
}

function kb($rows) { return json_encode(['inline_keyboard' => $rows], JSON_UNESCAPED_UNICODE); }

// ---------- статьи ----------
function loadArticles() {
    global $base;
    $cat = (string)@file_get_contents($base . '/public_html/articles/index.html');
    preg_match_all('#<article class="article-card"[^>]*>(.*?)</article>#s', $cat, $cards);
    $list = [];
    foreach ($cards[1] as $c) {
        if (!preg_match('#<h3><a href="([^"/]+)\.html">(.*?)</a></h3>#s', $c, $mm)) continue;
        preg_match('#data-category="([^"]*)"#', $c, $mc);
        $list[] = [
            'slug'     => $mm[1],
            'title'    => html_entity_decode(strip_tags($mm[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'category' => $mc[1] ?? '',
        ];
    }
    return $list; // в каталоге — от новых к старым
}

function articleText($slug) {
    global $base;
    $html = (string)@file_get_contents($base . '/public_html/articles/' . $slug . '.html');
    if ($html === '') return '';
    if (preg_match('#<article[^>]*>(.*)</article>#s', $html, $m)) $html = $m[1];
    $html = preg_replace('#<(script|style|nav|footer)[^>]*>.*?</\1>#s', '', $html);
    $html = preg_replace('#<div class="article-end">.*$#s', '', $html);
    $text = html_entity_decode(strip_tags(preg_replace('#<(br|/p|/h2|/h3|/li)>#i', "\n", $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace("/[ \t]+/", ' ', $text);
    $text = preg_replace("/\n\s*\n+/", "\n\n", trim($text));
    return mb_substr($text, 0, 9000);
}

function pickArticle($s) {
    $used = array_column($s['posts'], 'slug');
    $recent = array_slice($s['posts'], -4);
    $lastCategory = end($s['posts'])['category'] ?? '';
    $guiltRecently = (bool)array_filter($recent, function ($p) { return mb_stripos($p['title'], 'вин') !== false; });
    $fallback = null;
    foreach (loadArticles() as $a) {
        if (in_array($a['slug'], $used, true)) continue;
        if ($fallback === null) $fallback = $a;
        if ($a['category'] !== '' && $a['category'] === $lastCategory) continue;      // не две подряд на одну тему
        if ($guiltRecently && mb_stripos($a['title'], 'вин') !== false) continue;     // статьи о вине — реже
        return $a;
    }
    return $fallback;
}

// ---------- текст поста ----------
function writePost($article, $mode, $comment = '') {
    global $proxyKey;
    $ending = $mode === 'question'
        ? 'Закончи пост одним тёплым открытым вопросом к подписчикам, на который хочется ответить в комментариях.'
        : 'Не добавляй призыв записаться и ссылки — их добавят отдельно. Закончи завершённой тёплой мыслью.';
    $system = <<<PROMPT
Ты — Камила Золотова, психолог (КПТ и ДПДГ/EMDR), ведёшь свой Telegram-канал. Напиши пост для канала по статье с твоего сайта.

СМЫСЛ: не пересказывай статью. Возьми из неё одну главную мысль и раскрой её коротко и по-человечески, добавь небольшую практику или вопрос для самопроверки. Человек должен захотеть дочитать статью целиком.

ЗАЧИН: начни с узнаваемой ситуации или мысли читателя в 1–2 предложениях (например: "Знакомое состояние: усталость есть, но тревожный голос внутри не даёт остановиться."). Без приветствий.

ГОЛОС: от первого лица, тёпло, бережно, на "вы". Без осуждения, без менторства, без пафоса.

СТРОГО:
- Только русский язык, кавычки прямые "такие", тире длинное —, буква ё где нужна.
- Без медицины: не используй слова лечение, диагноз, пациент, симптом, расстройство, терапевт, клинический; не пиши о лекарствах.
- Не придумывай клиентов, истории "из практики", цифры, проценты, исследования.
- Не обещай результат.
- Никаких сложных терминов: не используй научные и профессиональные названия (эвристика, негативное смещение, когнитивные искажения, катастрофизация, триггер и подобные). Объясняй простыми словами, как другу, а название опусти.
- 2–4 эмодзи по смыслу (🌿 ❓ ✏️ 📌 💛), не в каждой строке. Без хэштегов и без заголовков.
- Чтобы пост был живее, выделяй текст ТОЛЬКО тегами: <b>жирный</b> и <i>курсив</i>. Других тегов и markdown (звёздочек, решёток) не используй.
- ЖИРНЫМ выделяй только 2–4 главные ключевые фразы, связанные с темой поста, каждая — коротко, 2–6 слов (например: <b>почву под ногами</b>, <b>страшный сценарий</b>). НИКОГДА не выделяй жирным предложение целиком, особенно длинное. Текст в кавычках (мысли и фразы читательницы, вопросы, цитаты) жирным НЕ выделяй — для него можно курсив.
- КУРСИВОМ — мысли и фразы читательницы в кавычках, примеры, мягкие акценты. Выделенного текста в сумме не больше десятой части поста.
- АУДИТОРИЯ — ЖЕНЩИНЫ. Обращайся на "вы", но всё, что относится к читательнице, ставь в женском роде: "вы устали", "вы не одна", "вы тревожная", "вы уставшая", "вы сами", "вы готовы". Примеры о людях тоже бери про женщин (подруга, коллега, мама, дочь), где это уместно. Устойчивые выражения не переделывай: пиши "один на один" (не "одна на одну") или перефразируй ("наедине с этим").
- Короткие абзацы по 1–3 предложения, между абзацами пустая строка.
- Объём: 1200–2000 знаков.
- {$ending}

Выведи только текст поста.
PROMPT;
    $user = "Статья: {$article['title']}\n\n" . articleText($article['slug']);
    if ($comment !== '') $user .= "\n\nПОПРАВКИ КАМИЛЫ К ПРОШЛОМУ ВАРИАНТУ ПОСТА (обязательно учти): " . $comment;

    foreach (['deepseek/deepseek-v4-flash', 'deepseek/deepseek-v3.2', 'deepseek/deepseek-chat'] as $model) {
        $ch = curl_init('https://api.proxyapi.ru/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . trim($proxyKey)],
            CURLOPT_POSTFIELDS     => json_encode([
                'model'       => $model,
                'messages'    => [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $user]],
                'max_tokens'  => 2500,
                'temperature' => 0.8,
            ]),
            CURLOPT_CONNECTTIMEOUT => 20,
            CURLOPT_TIMEOUT        => 150,
        ]);
        $res = json_decode((string)curl_exec($ch), true);
        $text = trim((string)($res['choices'][0]['message']['content'] ?? ''));
        if ($text === '' || ($res['choices'][0]['finish_reason'] ?? '') === 'length') continue;
        $text = str_replace(['«', '»', '“', '”', '„'], '"', $text);
        $text = cleanMarkup($text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);
        if (mb_strlen(strip_tags($text)) > MAX_POST_LEN) continue;
        if (preg_match('/(лечени|лечит|диагноз|пациент|симптом|расстройств|терапевт|клиническ)/ui', $text)) continue;
        if (preg_match('/\bвы\s+(?:\S+\s+){0,2}(?:уставший|тревожный|одинокий|напуганный|виноватый|слабый|сильный|плохой|неправильный|должен|способен|обязан|готовый)\b/ui', $text)) continue; // обращение в мужском роде
        if (preg_match('/(эвристик|смещени|искажени|катастрофизац|триггер|когнитивн|дисфункциональн|ригидн|атрибуци|диссонанс|ресурсн)/ui', $text)) continue; // сложные термины
        return $text;
    }
    return '';
}

// Оставляет в тексте только <b> и <i> (жирный и курсив), лишние теги убирает, незакрытые закрывает
function cleanMarkup($text) {
    // Если нейросеть выделила markdown-знаками вместо тегов — переводим в теги
    $text = preg_replace('/\*\*(.+?)\*\*/us', '<b>$1</b>', $text);
    $text = preg_replace('/(?<![\p{L}\p{N}_])__(?!\s)(.+?)(?<!\s)__(?![\p{L}\p{N}_])/us', '<b>$1</b>', $text);
    $text = preg_replace('/(?<![\p{L}\p{N}_])_(?![\s_])(.+?)(?<![\s_])_(?![\p{L}\p{N}_])/us', '<i>$1</i>', $text);
    $text = preg_replace('/(?<![\p{L}\p{N}*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\p{L}\p{N}*])/us', '<i>$1</i>', $text);
    $text = preg_replace('/^#+\s*/mu', '', $text);
    $text = html_entity_decode(strip_tags($text, '<b><i><strong><em>'), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace(['#<(/?)strong>#i', '#<(/?)em>#i'], ['<$1b>', '<$1i>'], $text);
    $parts = preg_split('#(</?[bi]>)#i', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    $out = ''; $open = [];
    foreach ($parts as $part) {
        if (preg_match('#^<(/?)([bi])>$#i', $part, $m)) {
            $tag = strtolower($m[2]);
            if ($m[1] === '') { $open[] = $tag; $out .= "<$tag>"; }
            elseif ($open && end($open) === $tag) { array_pop($open); $out .= "</$tag>"; }
            // закрывающий тег без пары или в неправильном порядке — отбрасываем
        } else {
            $out .= $part;
        }
    }
    while ($open) $out .= '</' . array_pop($open) . '>';
    $out = preg_replace('#<(b|i)>\s*</\1>#', '', $out);
    return limitBold($out);
}

// Жирным остаются только короткие фразы вне кавычек: длинные выделения и цитаты в кавычках снимаем
function limitBold($html) {
    $res = '';
    $pos = 0;
    while (preg_match('#<b>(.*?)</b>#us', $html, $m, PREG_OFFSET_CAPTURE, $pos)) {
        $start = $m[0][1];
        $res .= substr($html, $pos, $start - $pos);
        $inner = $m[1][0];
        $plain = trim(strip_tags($inner));
        $before = strip_tags($res);
        $insideQuotes = (substr_count($before, '"') % 2) === 1;
        $hasQuotes = (bool)preg_match('/["«»]/u', $plain);
        // не больше 6 слов и не предложение целиком (с точкой, вопросом или восклицанием в конце)
        $tooLong = count(preg_split('/\s+/u', $plain, -1, PREG_SPLIT_NO_EMPTY)) > 6 || preg_match('/[.!?…]$/u', $plain) || preg_match('/[.!?…]\s+\p{L}/u', $plain);
        $res .= ($insideQuotes || $hasQuotes || $tooLong) ? $inner : $m[0][0];
        $pos = $start + strlen($m[0][0]);
    }
    return $res . substr($html, $pos);
}

// Готовый пост в HTML-разметке Telegram: текст с выделениями, ссылка на статью и приглашение (или вопрос)
function buildPostHtml($p) {
    $html = '';
    foreach (preg_split('#(</?[bi]>)#', cleanMarkup($p['text']), -1, PREG_SPLIT_DELIM_CAPTURE) as $part) {
        $html .= preg_match('#^</?[bi]>$#', $part) ? $part : htmlspecialchars($part, ENT_NOQUOTES, 'UTF-8');
    }
    $url = SITE . 'articles/' . $p['slug'] . '.html';
    $html .= "\n\n📖 <a href=\"{$url}\">Полностью — в статье на сайте →</a>";
    if ($p['mode'] !== 'question') {
        $html .= "\n\n🌿 Если узнали себя — запишитесь на бесплатную встречу-знакомство в @Psyholog_Zolotova_bot";
    }
    return $html;
}

// Картинка для превью над текстом поста. Telegram стабильно показывает обложку, если ссылка ведёт
// прямо на JPG (WebP обрезает, а по ссылке на страницу статьи превью не появилось), поэтому
// для каждой обложки статьи делаем JPG-копию в public_html/images/tg/ (кладёт и обновляет агент).
function coverJpgUrl($slug) {
    global $base;
    $html = (string)@file_get_contents($base . '/public_html/articles/' . $slug . '.html');
    if (!preg_match('#<meta property="og:image" content="https://pozitiv-psychology\.ru/(images/[^"?]+)"#', $html, $m)) return null;
    $rel = $m[1];
    if (preg_match('/\.(jpe?g)$/i', $rel)) return SITE . $rel;
    $name = preg_replace('/\.[a-z0-9]+$/i', '', basename($rel)) . '.jpg';
    $dst = $base . '/public_html/images/tg/' . $name;
    $srcPath = $base . '/public_html/' . $rel;
    if (!is_file($dst) || filemtime($dst) < @filemtime($srcPath)) {
        if (!is_dir(dirname($dst))) mkdir(dirname($dst), 0755, true);
        $img = null;
        if (preg_match('/\.webp$/i', $rel)) $img = @imagecreatefromwebp($srcPath);
        elseif (preg_match('/\.png$/i', $rel)) $img = @imagecreatefrompng($srcPath);
        if (!$img) return null;
        imagejpeg($img, $dst, 88);
        logLine('jpg cover created: ' . $name);
    }
    return SITE . 'images/tg/' . $name;
}

// Локальный путь к JPG-обложке статьи (создаёт копию при необходимости)
function coverJpgPath($slug) {
    global $base;
    $url = coverJpgUrl($slug);
    if (!$url || strpos($url, SITE) !== 0) return null;
    $path = $base . '/public_html/' . substr($url, strlen(SITE));
    return is_file($path) ? $path : null;
}

// Telegram с нашего хостинга скачивать картинки по ссылкам не может (проверено 30.10: любые файлы сайта дают
// "failed to get HTTP URL content"), поэтому картинку загружаем в Telegram файлом отдельным сообщением перед текстом.
function sendCoverPhoto($chatId, $slug, $silent = false) {
    $path = coverJpgPath($slug);
    if (!$path) { logLine("no cover file for $slug"); return null; }
    $r = tg('sendPhoto', [
        'chat_id'              => $chatId,
        'photo'                => new CURLFile($path, 'image/jpeg', 'cover.jpg'),
        'disable_notification' => $silent ? 'true' : 'false',
    ], 60);
    if (empty($r['ok'])) { logLine("sendPhoto to $chatId failed: " . ($r['description'] ?? 'no response')); return null; }
    return $r['result']['message_id'] ?? null;
}

function previewOptions($slug, $bust = '') {
    $url = coverJpgUrl($slug) ?: SITE . 'articles/' . $slug . '.html';
    // Метка в адресе картинки заставляет Telegram скачать её заново (при тех же настройках он карточку не пересобирает)
    if ($bust !== '') $url .= '?v=' . $bust;
    return json_encode(['url' => $url, 'prefer_large_media' => true, 'show_above_text' => true]);
}

function nextPublishTime($fromTs) {
    $t = mktime(PUBLISH_HOUR, 0, 0, (int)date('n', $fromTs), (int)date('j', $fromTs), (int)date('Y', $fromTs));
    return $t > $fromTs ? $t : $t + 86400;
}

function draftButtons($id) {
    return kb([
        [['text' => '✅ Опубликовать в ' . PUBLISH_HOUR . ':00', 'callback_data' => 'chp_ok_' . $id], ['text' => '⚡ Сейчас', 'callback_data' => 'chp_now_' . $id]],
        [['text' => '🔄 Переписать', 'callback_data' => 'chp_redo_' . $id], ['text' => '⏭ Пропустить статью', 'callback_data' => 'chp_skip_' . $id]],
    ]);
}

function sendDraft(&$p, $withPhoto = true) {
    $head = "📝 <b>Черновик поста №{$p['id']} для канала</b>\n"
          . "По статье: «" . htmlspecialchars($p['title'], ENT_NOQUOTES, 'UTF-8') . "»\n"
          . "Публикация: " . date('d.m в H:i', $p['publish_at']) . " — после вашего одобрения\n"
          . "━━━━━━━━━━━━━━━━\n\n";
    if ($withPhoto) sendCoverPhoto(KAMILA_CHAT_ID, $p['slug'], true);
    $r = tg('sendMessage', [
        'chat_id'              => KAMILA_CHAT_ID,
        'text'                 => $head . buildPostHtml($p),
        'parse_mode'           => 'HTML',
        'link_preview_options' => json_encode(['is_disabled' => true]),
        'reply_markup'         => draftButtons($p['id']),
    ]);
    $p['draft_msg_id'] = $r['result']['message_id'] ?? null;
    return !empty($r['ok']);
}

function publish(&$p) {
    // Сначала обложка (файлом), затем текст поста без карточки-превью
    $photoId = sendCoverPhoto(CHANNEL, $p['slug']);
    $r = tg('sendMessage', [
        'chat_id'              => CHANNEL,
        'text'                 => buildPostHtml($p),
        'parse_mode'           => 'HTML',
        'link_preview_options' => json_encode(['is_disabled' => true]),
        'disable_notification' => $photoId ? 'true' : 'false',
    ]);
    if (!empty($r['ok'])) {
        $p['status'] = 'published';
        $p['channel_msg_id'] = $r['result']['message_id'];
        if ($photoId) $p['photo_msg_id'] = $photoId;
        $p['published_at'] = time();
        $p['preview_ok'] = true; // картинка загружена файлом, проверять карточку-превью не нужно
        tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => ($photoId ? '✅' : '⚠️ (без картинки: не загрузилась)') . " Пост №{$p['id']} опубликован в канале: https://t.me/" . ltrim(CHANNEL, '@') . '/' . $p['channel_msg_id']]);
        logLine("published post {$p['id']} ({$p['slug']})");
        return true;
    }
    logLine("publish failed for post {$p['id']}: " . ($r['description'] ?? 'no response'));
    tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "❌ Не удалось опубликовать пост №{$p['id']}: " . ($r['description'] ?? 'нет связи с Telegram') . '. Попробую снова через 10 минут.']);
    return false;
}

// Есть ли у поста в канале карточка-превью (смотрим публичную ленту t.me/s). true / false / null — не удалось проверить
function channelPostHasPreview($msgId) {
    $html = null;
    foreach ([CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V6, CURL_IPRESOLVE_V4] as $ip) {
        $ch = curl_init('https://t.me/s/' . ltrim(CHANNEL, '@'));
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_IPRESOLVE => $ip, CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; preview-check)']);
        $raw = curl_exec($ch);
        if ($raw !== false && $raw !== '') { $html = $raw; break; }
    }
    if ($html === null) return null;
    $marker = 'data-post="' . ltrim(CHANNEL, '@') . '/' . (int)$msgId . '"';
    $start = strpos($html, $marker);
    if ($start === false) return null;
    $end = strpos($html, 'data-post="', $start + strlen($marker));
    $block = $end === false ? substr($html, $start) : substr($html, $start, $end - $start);
    return strpos($block, 'tgme_widget_message_link_preview') !== false;
}

// Пересобирает превью опубликованного поста. Telegram не обновляет карточку, если текст не менялся,
// поэтому при "message is not modified" на мгновение добавляем невидимый знак и возвращаем текст обратно
function refreshPostPreview($p) {
    $params = [
        'chat_id'              => CHANNEL,
        'message_id'           => $p['channel_msg_id'],
        'text'                 => buildPostHtml($p),
        'parse_mode'           => 'HTML',
        'link_preview_options' => previewOptions($p['slug'], (string)time()),
    ];
    $r = tg('editMessageText', $params);
    if (empty($r['ok']) && strpos((string)($r['description'] ?? ''), 'not modified') !== false) {
        $tmp = $params;
        $tmp['text'] = str_replace("\n\n📖", "\u{200B}\n\n📖", $params['text']);
        tg('editMessageText', $tmp);
        $r = tg('editMessageText', $params);
    }
    return $r;
}

function findPost(&$s, $id) {
    foreach ($s['posts'] as $k => $p) if ((int)$p['id'] === (int)$id) return $k;
    return null;
}

// ---------- команды ----------
$cmd = $argv[1] ?? '';
$lock = fopen($base . '/channel-agent.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) exit(1);
$s = loadState();

if ($cmd === 'draft') {
    // Не копим черновики: пока предыдущий не опубликован и не пропущен, новый не пишем
    foreach ($s['posts'] as $p) {
        if (in_array($p['status'], ['pending', 'approved'], true)) { logLine("draft skipped: post {$p['id']} still {$p['status']}"); exit; }
    }
    $article = pickArticle($s);
    if (!$article) { tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => '📭 Для канала закончились статьи, по которым ещё не было постов.']); exit; }
    $published = count(array_filter($s['posts'], function ($p) { return $p['status'] === 'published'; }));
    $mode = ($published % 3 === 2) ? 'question' : 'invite';
    $text = writePost($article, $mode);
    if ($text === '') { logLine('draft failed: no text'); tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => '⚠️ Не получилось написать черновик поста для канала. Попробую в следующий раз.']); exit; }
    $p = ['id' => $s['next_id']++, 'slug' => $article['slug'], 'title' => $article['title'], 'category' => $article['category'],
          'mode' => $mode, 'text' => $text, 'status' => 'pending', 'publish_at' => nextPublishTime(time()), 'created' => time()];
    sendDraft($p);
    $s['posts'][] = $p;
    saveState($s);
    logLine("draft {$p['id']} for {$p['slug']}");
    exit;
}

if ($cmd === 'tick') {
    $now = time();
    foreach ($s['posts'] as &$p) {
        if ($p['status'] === 'approved' && $p['publish_at'] <= $now) publish($p);
        if ($p['status'] === 'pending' && $p['publish_at'] <= $now) {
            $p['publish_at'] = nextPublishTime($now);
            tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "⏳ Пост №{$p['id']} не одобрен — переношу на " . date('d.m в H:i', $p['publish_at']) . '. Черновик с кнопками — выше в чате.']);
            logLine("post {$p['id']} postponed");
        }
        // Самолечение: если у вышедшего поста в канале не появилась картинка, пересобираем превью (до 4 попыток)
        if ($p['status'] === 'published' && empty($p['preview_ok']) && !empty($p['channel_msg_id'])
            && ($p['published_at'] ?? 0) < $now - 90 && ($p['published_at'] ?? 0) > $now - 86400) {
            $has = channelPostHasPreview($p['channel_msg_id']);
            if ($has === true) {
                $p['preview_ok'] = true;
                if (!empty($p['preview_tries'])) {
                    tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "🔧 У поста №{$p['id']} в канале не сразу показалась картинка — я пересобрал превью, теперь она на месте."]);
                }
                logLine("post {$p['id']}: preview ok" . (!empty($p['preview_tries']) ? " after {$p['preview_tries']} refresh(es)" : ''));
            } elseif ($has === false && ($p['preview_tries'] ?? 0) < 4) {
                $p['preview_tries'] = ($p['preview_tries'] ?? 0) + 1;
                $r = refreshPostPreview($p);
                logLine("post {$p['id']}: no preview, refresh #{$p['preview_tries']}: " . (!empty($r['ok']) ? 'ok' : ($r['description'] ?? 'failed')));
            }
        }
    }
    unset($p);
    saveState($s);
    exit;
}

if ($cmd === 'cb') {
    if (!preg_match('/^chp_(ok|now|redo|skip)_(\d+)$/', $argv[2] ?? '', $mm)) exit;
    $k = findPost($s, $mm[2]);
    if ($k === null) exit;
    $p = &$s['posts'][$k];
    if ($p['status'] === 'published' || $p['status'] === 'skipped') {
        tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "Пост №{$p['id']} уже " . ($p['status'] === 'published' ? 'опубликован' : 'пропущен') . '.']);
        exit;
    }
    switch ($mm[1]) {
        case 'ok':
            $p['status'] = 'approved';
            if ($p['publish_at'] <= time()) $p['publish_at'] = nextPublishTime(time());
            tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "👍 Пост №{$p['id']} одобрен, выйдет " . date('d.m в H:i', $p['publish_at']) . '.']);
            break;
        case 'now':
            $p['status'] = 'approved';
            publish($p);
            break;
        case 'redo':
            tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID,
                'text' => "✏️ Что поправить в посте №{$p['id']}? Напишите ответом на это сообщение (например: короче, теплее, без списка). Отправьте «-», чтобы просто написать другой вариант.",
                'reply_markup' => json_encode(['force_reply' => true, 'input_field_placeholder' => 'Например: короче и теплее'], JSON_UNESCAPED_UNICODE)]);
            break;
        case 'skip':
            $p['status'] = 'skipped';
            tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "⏭ Статья «{$p['title']}» пропущена. Следующий черновик придёт по расписанию."]);
            break;
    }
    unset($p);
    saveState($s);
    exit;
}

if ($cmd === 'checkpreview') {
    $k = findPost($s, $argv[2] ?? 0);
    if ($k === null || empty($s['posts'][$k]['channel_msg_id'])) { echo "no published post\n"; exit; }
    echo json_encode(channelPostHasPreview($s['posts'][$k]['channel_msg_id'])), "\n";
    exit;
}

if ($cmd === 'refresh') {
    $k = findPost($s, $argv[2] ?? 0);
    if ($k === null || empty($s['posts'][$k]['channel_msg_id'])) { echo "no published post\n"; exit; }
    $p = $s['posts'][$k];
    $r = refreshPostPreview($p);
    echo !empty($r['ok']) ? "refreshed\n" : ('FAIL ' . ($r['description'] ?? 'no response') . "\n");
    logLine("refresh post {$p['id']}: " . (!empty($r['ok']) ? 'ok' : ($r['description'] ?? 'failed')));
    exit;
}

if ($cmd === 'redo') {
    $k = findPost($s, $argv[2] ?? 0);
    if ($k === null) exit;
    $p = &$s['posts'][$k];
    if (!in_array($p['status'], ['pending', 'approved'], true)) exit;
    $comment = trim((string)($argv[3] ?? ''));
    if ($comment === '-') $comment = 'просто напиши другой вариант, с другим зачином';
    tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => "🔄 Переписываю пост №{$p['id']}…"]);
    $text = writePost(['slug' => $p['slug'], 'title' => $p['title']], $p['mode'], $comment);
    if ($text === '') { tg('sendMessage', ['chat_id' => KAMILA_CHAT_ID, 'text' => '⚠️ Не получилось переписать. Попробуйте ещё раз.']); exit; }
    $p['text'] = $text;
    $p['status'] = 'pending';
    if ($p['publish_at'] <= time()) $p['publish_at'] = nextPublishTime(time());
    sendDraft($p, false);
    unset($p);
    saveState($s);
    logLine("redo post {$s['posts'][$k]['id']}");
    exit;
}
