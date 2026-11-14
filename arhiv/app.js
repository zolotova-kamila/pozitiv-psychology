(() => {
  'use strict';

  // ---------- Настройки ----------
  const STORAGE_KEY = 'arhiv-nesbyvshegosya:v1';
  const UNLOCK_AFTER = 5; // сколько проверенных прогнозов нужно, чтобы открыть «Итоги»
  const LINKS = {
    booking: 'https://pozitiv-psychology.ru/#zapis',
    group: 'https://pozitiv-psychology.ru/group-therapy-landing.html',
    telegram: 'https://t.me/Kamila_Zolotova',
    whatsapp: 'https://wa.me/79099030000',
    site: 'https://pozitiv-psychology.ru/',
    contacts: 'https://pozitiv-psychology.ru/contact.html',
  };
  const SHARE_SITE = 'pozitiv-psychology.ru';

  // Цели Яндекс.Метрики. Функцию pozitivGoal даёт сайт (js/metrika-goals.js): она шлёт цель только после согласия на cookie.
  // Каждую цель нужно один раз создать в Метрике как «JavaScript-событие»:
  //   app_guide_ok, app_card_pick, app_card_saved, app_write_telegram, app_write_whatsapp,
  //   app_book_click, app_site_click, app_contacts_click, app_share_card, app_forecast_added, app_forecast_checked,
  //   app_deck_open, app_deck_request, app_deck_unlocked,
  //   app_daily_start, app_reminder_set, app_reminder_off, app_reminder_calendar
  // Адрес с ?test (проверка владельцем) цели не отправляет, чтобы тесты не искажали статистику.
  function goal(name) {
    if (new URLSearchParams(location.search).has('test')) return;
    try { if (typeof window.pozitivGoal === 'function') window.pozitivGoal(name); } catch (e) { /* статистика недоступна */ }
  }

  // Переходы по ссылкам (сайт, контакты, запись, сообщения в мессенджеры) считаем в одном месте
  document.addEventListener('click', (e) => {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.dataset.goal) { goal(a.dataset.goal); return; }
    const href = a.href;
    if (href === LINKS.site) goal('app_site_click');
    else if (href === LINKS.contacts) goal('app_contacts_click');
    else if (href === LINKS.booking) goal('app_book_click');
    else if (href.startsWith(LINKS.telegram)) goal('app_write_telegram');
    else if (href.startsWith(LINKS.whatsapp)) goal('app_write_whatsapp');
  }, true);

  const OUTCOMES = {
    no: { label: 'Не сбылось', toast: 'Отправлено в архив несбывшегося' },
    coped: { label: 'Сбылось, но справились', toast: 'Записано: сбылось, но вы справились' },
    yes: { label: 'Сбылось', toast: 'Записано. Так тоже бывает' },
  };

  const CFG = window.ARHIV_CONFIG || {};
  const API = (CFG.remindersApi || '').replace(/\/$/, '');
  const REMIND_KEY = 'arhiv-nesbyvshegosya:remind:v1';
  const CONSENT_URL = 'https://pozitiv-psychology.ru/soglasie.html';
  const WAIT_LIMIT_MS = 10 * 60 * 1000; // сколько ждём, пока человек нажмёт Start в боте

  // ---------- Состояние ----------
  let state = load();
  let view = 'today';
  let archiveFilter = 'all';
  let askingHow = null; // id прогноза, по которому уточняем «как справились»

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.items)) return saved;
    } catch (e) { /* хранилище недоступно — работаем без него */ }
    return { items: [], demo: false };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* см. выше */ }
    scheduleSync();
  }

  // Любое изменение: сохранить, перерисовать, показать уведомление с отменой
  function change(message, mutate) {
    const before = JSON.stringify(state);
    mutate();
    save();
    render();
    if (message) {
      toast(message, () => {
        state = JSON.parse(before);
        save();
        render();
      });
    }
  }

  // ---------- Даты и слова ----------
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayKey = () => toKey(new Date());
  const addDays = (n, base = new Date()) => toKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n));
  const daysUntil = (k) => Math.round((fromKey(k) - fromKey(todayKey())) / 86400000);

  function formatDate(k) {
    const d = fromKey(k);
    const opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('ru-RU', opts);
  }

  function plural(n, forms) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b === 1) return forms[0];
    if (b >= 2 && b <= 4) return forms[1];
    return forms[2];
  }

  function relative(k) {
    const n = daysUntil(k);
    if (n === 0) return 'сегодня';
    if (n === 1) return 'завтра';
    if (n === -1) return 'вчера';
    const words = `${Math.abs(n)} ${plural(n, ['день', 'дня', 'дней'])}`;
    return n > 0 ? `через ${words}` : `${words} назад`;
  }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  // ---------- Подсчёты ----------
  function stats() {
    const today = todayKey();
    const resolved = state.items.filter((i) => i.outcome);
    const open = state.items.filter((i) => !i.outcome);
    const count = (o) => resolved.filter((i) => i.outcome === o).length;
    const n = resolved.length;
    const no = count('no');
    const coped = count('coped');
    const yes = count('yes');
    const missPct = n ? Math.round((no / n) * 100) : 0;
    return {
      n, no, coped, yes,
      came: coped + yes,
      missPct,
      hitPct: n ? 100 - missPct : 0,
      avgConf: n ? Math.round(resolved.reduce((s, i) => s + i.confidence, 0) / n) : 0,
      resolved,
      due: open.filter((i) => i.due <= today).sort((a, b) => a.due.localeCompare(b.due)),
      waiting: open.filter((i) => i.due > today).sort((a, b) => a.due.localeCompare(b.due)),
    };
  }

  // ---------- Построение разметки ----------
  const $ = (sel) => document.querySelector(sel);

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const button = (cls, label, onclick) => h('button', { type: 'button', class: cls, onclick }, label);
  const section = (title, ...kids) => h('section', { class: 'section' }, h('h2', { class: 'section-title' }, title), ...kids);

  // ---------- Экран «Сегодня» ----------
  function renderToday(s) {
    const out = [];

    if (state.demo) {
      out.push(h('div', { class: 'banner' },
        h('span', null, 'Это пример с выдуманными записями.'),
        button('link', 'Начать свой архив', () => change(null, () => { state = { items: [], demo: false }; }))));
    }

    if (!state.items.length) {
      out.push(renderIntro());
      return out;
    }

    out.push(renderHero(s));
    out.push(h('div', { class: 'section' }, button('btn primary wide', 'Записать тревожный прогноз', openAdd)));

    if (s.due.length) {
      out.push(section('Пора проверить', h('div', { class: 'stack' }, s.due.map(renderDue))));
    }
    if (s.waiting.length) {
      out.push(section('Ждут своей даты', h('div', { class: 'stack' }, s.waiting.map(renderWaiting))));
    }
    if (!s.due.length && !s.waiting.length) {
      out.push(h('p', { class: 'muted section' }, 'Все прогнозы проверены. Когда тревога снова что-то пообещает — запишите.'));
    }
    const reminders = renderReminders();
    if (reminders) out.push(section('Напоминания', reminders));
    return out;
  }

  // ---------- Напоминания в Telegram ----------
  // На сервер уходят только случайный ключ устройства и даты проверки. Текст прогнозов остаётся в браузере.
  let remote = loadRemote(); // { key, status: 'off' | 'waiting' | 'on', since }
  let botName = null;
  let botTried = false;
  let remoteError = false;
  let pollTimer;
  let syncTimer;

  function loadRemote() {
    try {
      const r = JSON.parse(localStorage.getItem(REMIND_KEY));
      if (r && typeof r.key === 'string' && (r.status === 'waiting' || r.status === 'on')) return r;
    } catch (e) { /* нет сохранённого состояния */ }
    return { key: null, status: 'off' };
  }

  function saveRemote() {
    try {
      if (remote.status === 'off') localStorage.removeItem(REMIND_KEY);
      else localStorage.setItem(REMIND_KEY, JSON.stringify(remote));
    } catch (e) { /* хранилище недоступно */ }
  }

  function newKey() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Адрес сервиса может быть PHP-файлом (…/arhiv-reminders.php): тогда путь передаётся параметром ?a=
  function endpoint(path) {
    if (!/\.php$/.test(API)) return API + path;
    const [p, q] = path.split('?');
    return `${API}?a=${p.replace('/api/', '')}${q ? `&${q}` : ''}`;
  }

  async function api(path, body) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    try {
      const res = await fetch(endpoint(path), body
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }
        : { signal: ctl.signal });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(timer);
    }
  }

  // перерисовываем только если что-то реально поменялось
  function remoteSnapshot() { return `${remote.status}|${remoteError}|${botName}`; }

  async function loadBot() {
    const before = remoteSnapshot();
    try {
      const r = await api('/api/info');
      if (r.ok && r.data.bot) botName = r.data.bot; else remoteError = true;
    } catch (e) { remoteError = true; }
    if (before !== remoteSnapshot()) render();
  }

  async function checkLinked() {
    const before = remoteSnapshot();
    try {
      const r = await api(`/api/status?key=${encodeURIComponent(remote.key)}`);
      remoteError = !r.ok;
      if (r.ok && r.data.linked) { remote.status = 'on'; saveRemote(); syncNow(); }
    } catch (e) { remoteError = true; }
    if (before !== remoteSnapshot()) render();
  }

  function pollStatus() {
    clearTimeout(pollTimer);
    if (remote.status !== 'waiting') return;
    if (Date.now() - (remote.since || 0) > WAIT_LIMIT_MS) {
      remote = { key: null, status: 'off' };
      saveRemote();
      render();
      return;
    }
    checkLinked().finally(() => {
      if (remote.status === 'waiting') pollTimer = setTimeout(pollStatus, 3000);
    });
  }

  function scheduleSync() {
    if (!API || remote.status !== 'on') return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 600);
  }

  async function syncNow() {
    if (!API || remote.status !== 'on') return;
    const before = remoteSnapshot();
    const items = state.demo ? [] : state.items.filter((i) => !i.outcome).map((i) => ({ id: i.id, due: i.due }));
    // карта дня: час напоминания и дата последней вытянутой карты (чтобы не напоминать о том, что уже сделано)
    const daily = { hour: cards.dailyHour ?? null, drawn: cards.draws.length ? cards.draws[0].date : null };
    try {
      const r = await api('/api/sync', { key: remote.key, tz: -new Date().getTimezoneOffset(), items, daily });
      if (r.status === 409) { remote = { key: null, status: 'off' }; saveRemote(); } // в боте нажали /stop
      remoteError = !r.ok && r.status !== 409;
    } catch (e) { remoteError = true; }
    if (before !== remoteSnapshot()) render();
  }

  function startLinking() {
    // ссылка открывается самим нажатием; состояние меняем чуть позже, чтобы не сорвать переход
    setTimeout(() => {
      remote.status = 'waiting';
      remote.since = Date.now();
      saveRemote();
      pollStatus();
      render();
    }, 50);
  }

  async function disconnect() {
    const key = remote.key;
    try {
      const r = await api('/api/unlink', { key });
      if (!r.ok) throw new Error('unlink failed');
    } catch (e) {
      toast('Не удалось отключить. Отправьте боту команду /stop');
      return;
    }
    remote = { key: null, status: 'off' };
    remoteError = false;
    saveRemote();
    render();
    toast('Напоминания отключены, данные на сервере удалены');
  }

  function cancelLinking() {
    clearTimeout(pollTimer);
    remote = { key: null, status: 'off' };
    saveRemote();
    render();
  }

  function renderReminders() {
    if (!API || state.demo) return null;
    if (!botName && !botTried) { botTried = true; loadBot(); }
    if (!remote.key) remote.key = newKey();
    const botLink = (cls, label) => h('a', {
      class: cls, href: `https://t.me/${botName}?start=r_${remote.key}`, target: '_blank', rel: 'noopener', onclick: startLinking,
    }, label);
    const error = remoteError && h('p', { class: 'status-err' }, 'Нет связи с сервисом напоминаний. Попробуйте чуть позже.');

    if (remote.status === 'on') {
      return h('div', { class: 'card' },
        h('p', { class: 'status-ok' }, '✓ Напоминания в Telegram включены'),
        h('p', { class: 'muted', style: 'margin-top:6px' }, `Бот напишет в 9:00 в день проверки прогноза${cards.dailyHour != null ? ` и в ${cards.dailyHour}:00 напомнит о карте дня (если вы её ещё не вытянули)` : ''}. Текст прогнозов и ваши ответы боту не передаются.`),
        error,
        h('div', { class: 'item-links' }, button('link danger', 'Отключить и удалить данные', disconnect)));
    }

    if (remote.status === 'waiting') {
      return h('div', { class: 'card' },
        h('p', { class: 'ask', style: 'margin-top:0' }, 'Осталось нажать «Запустить» в Telegram'),
        h('p', { class: 'muted', style: 'margin-top:6px' }, 'Откройте бота и нажмите Start (или «Запустить»). Эта страница сама заметит подключение.'),
        error,
        h('div', { class: 'item-links' },
          botName && botLink('link', 'Открыть бота ещё раз'),
          button('link danger', 'Отмена', cancelLinking)));
    }

    return h('div', { class: 'card' },
      h('p', { class: 'ask', style: 'margin-top:0' }, 'Напомнить в Telegram'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Бот напишет вам, когда придёт срок проверить прогноз, и в выбранное время напомнит о карте дня.'),
      error,
      h('div', { class: 'item-actions' },
        botName
          ? botLink('btn primary wide', 'Подключить Telegram')
          : h('span', { class: 'muted' }, remoteError ? '' : 'Загружаем…')),
      h('p', { class: 'fine' },
        'Боту передаётся только ваш Telegram-идентификатор, даты проверки прогнозов, выбранное время напоминания и дата последней вытянутой карты, без текстов и ответов. Нажимая кнопку, вы соглашаетесь на их обработку для напоминаний: ',
        h('a', { href: CONSENT_URL, target: '_blank', rel: 'noopener' }, 'условия'),
        '. Отключить можно в любой момент.'));
  }

  function renderIntro() {
    return h('div', { class: 'card' },
      h('h2', null, 'Как это работает'),
      h('ol', { class: 'steps' },
        h('li', null, h('strong', null, 'Запишите прогноз'), 'Что именно, по мнению тревоги, случится — и насколько вы в этом уверены.'),
        h('li', null, h('strong', null, 'Назначьте дату'), 'День, когда станет ясно, сбылось или нет.'),
        h('li', null, h('strong', null, 'Проверьте'), 'В назначенный день отметьте, что произошло на самом деле.'),
        h('li', null, h('strong', null, 'Посмотрите на цифры'), 'Со временем станет видно, как часто тревога ошибается.')),
      h('div', { class: 'btn-row tall' },
        button('btn primary', 'Записать первый прогноз', openAdd),
        button('btn ghost', 'Посмотреть на примере', loadDemo)));
  }

  function renderHero(s) {
    if (!s.n) {
      return h('div', { class: 'card hero' },
        h('p', { class: 'hero-caption' }, 'Прогноз записан'),
        h('p', { class: 'muted hero-meta' }, 'Цифра появится здесь после первой проверки. Чем больше прогнозов, тем она точнее.'));
    }
    const legend = [['', 'не сбылось']];
    if (s.coped) legend.push(['coped', 'сбылось, но справились']);
    if (s.yes) legend.push(['yes', 'сбылось']);

    return h('div', { class: 'card hero' },
      h('div', { class: 'hero-num' }, `${s.missPct}%`),
      h('p', { class: 'hero-caption' }, 'прогнозов тревоги не сбылось'),
      h('p', { class: 'muted hero-meta' }, `Проверено: ${s.n} · ждут своей даты: ${s.due.length + s.waiting.length}`),
      h('div', { class: 'dots', 'aria-hidden': 'true' },
        s.resolved.map((i) => h('span', { class: `dot ${i.outcome === 'no' ? '' : i.outcome}` }))),
      h('div', { class: 'legend' }, legend.map(([cls, text]) => h('span', null, h('i', { class: `dot ${cls}` }), text))));
  }

  function renderDue(item) {
    const meta = `Срок — ${formatDate(item.due)} (${relative(item.due)}) · уверенность была ${item.confidence}%`;
    const asking = askingHow === item.id;

    return h('article', { class: 'card due' },
      h('p', { class: 'item-text' }, item.text),
      h('p', { class: 'item-meta' }, meta),
      asking
        ? [
          h('p', { class: 'ask' }, 'Как вы с этим справились?'),
          h('div', { class: 'btn-row tall item-actions' },
            button('btn soft', 'Легче, чем казалось заранее', () => resolve(item.id, 'coped')),
            button('btn soft', 'Так же тяжело, как и казалось', () => resolve(item.id, 'yes'))),
          h('div', { class: 'item-links' }, button('link', 'Назад', () => { askingHow = null; render(); })),
        ]
        : [
          h('p', { class: 'ask' }, 'Это случилось?'),
          h('div', { class: 'btn-row item-actions' },
            button('btn primary', 'Не сбылось', () => resolve(item.id, 'no')),
            button('btn ghost', 'Сбылось', () => { askingHow = item.id; render(); })),
          h('div', { class: 'item-links' },
            button('link', 'Ещё не ясно — перенести на неделю', () => postpone(item.id)),
            button('link danger', 'Удалить', () => remove(item.id))),
        ]);
  }

  function renderWaiting(item) {
    return h('article', { class: 'card' },
      h('p', { class: 'item-text' }, item.text),
      h('p', { class: 'item-meta' }, `Проверим ${formatDate(item.due)} (${relative(item.due)}) · уверенность ${item.confidence}%`),
      h('div', { class: 'item-links' },
        button('link', 'Напомнить в календаре', () => downloadReminder(item)),
        button('link', 'Уже известно, чем кончилось', () => change(null, () => { find(item.id).due = todayKey(); })),
        button('link danger', 'Удалить', () => remove(item.id))));
  }

  // ---------- Экран «Архив» ----------
  function renderArchive(s) {
    if (!s.n) {
      return [h('div', { class: 'card' },
        h('h2', null, 'Архив пока пуст'),
        h('p', { class: 'muted' }, 'Сюда попадают проверенные прогнозы. Первый появится, когда наступит его дата.'))];
    }

    const filters = [['all', `Все · ${s.n}`], ['no', `Не сбылось · ${s.no}`]];
    if (s.coped) filters.push(['coped', `Справились · ${s.coped}`]);
    if (s.yes) filters.push(['yes', `Сбылось · ${s.yes}`]);
    if (!filters.some(([key]) => key === archiveFilter)) archiveFilter = 'all';

    const list = s.resolved
      .filter((i) => archiveFilter === 'all' || i.outcome === archiveFilter)
      .sort((a, b) => (b.resolvedAt || '').localeCompare(a.resolvedAt || ''));

    return [
      h('div', { class: 'chips' }, filters.map(([key, label]) =>
        h('button', {
          type: 'button', class: 'chip', 'aria-pressed': String(archiveFilter === key),
          onclick: () => { archiveFilter = key; render(); },
        }, label))),
      h('div', { class: 'stack section' }, list.map((item) =>
        h('article', { class: `card archived ${item.outcome}` },
          h('span', { class: `stamp ${item.outcome}` }, OUTCOMES[item.outcome].label),
          h('p', { class: 'item-text' }, item.text),
          h('p', { class: 'item-meta' }, `Уверенность была ${item.confidence}% · срок — ${formatDate(item.due)}`),
          h('div', { class: 'item-links' }, button('link danger', 'Удалить', () => remove(item.id)))))),
    ];
  }

  // ---------- Экран «Итоги» ----------
  function renderInsights(s) {
    const out = [];

    if (s.n < UNLOCK_AFTER) {
      const left = UNLOCK_AFTER - s.n;
      out.push(h('div', { class: 'card' },
        h('h2', null, 'Итоги откроются чуть позже'),
        h('p', { class: 'muted' }, `Чтобы цифрам можно было верить, нужно хотя бы ${UNLOCK_AFTER} проверенных прогнозов.`),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(UNLOCK_AFTER), 'aria-valuenow': String(s.n) },
          h('i', { style: `width:${(s.n / UNLOCK_AFTER) * 100}%` })),
        h('p', { class: 'muted' }, `Проверено ${s.n} из ${UNLOCK_AFTER}. Осталось: ${left}.`),
        !state.items.length && h('div', { class: 'item-actions' }, button('btn ghost', 'Посмотреть на примере', loadDemo))));
    } else {
      out.push(h('div', { class: 'card' },
        h('h2', null, 'Что обещала тревога и что вышло'),
        bar('promised', 'Тревога была уверена', s.avgConf),
        bar('real', 'Сбылось на деле', s.hitPct),
        h('p', { class: 'muted', style: 'margin-top:14px' },
          `В среднем вы были уверены на ${s.avgConf}%, что плохое случится. Сбылось ${s.came} из ${s.n} ${plural(s.n, ['проверенного прогноза', 'проверенных прогнозов', 'проверенных прогнозов'])}.`)));

      if (s.came) {
        out.push(h('div', { class: 'card' },
          h('h2', null, 'Когда всё-таки сбывалось'),
          h('p', { class: 'big' }, `${s.coped} из ${s.came}`),
          h('p', { class: 'muted' }, 'Столько раз справиться оказалось легче, чем казалось заранее.')));
      }

      const misses = s.resolved.filter((i) => i.outcome === 'no').sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      if (misses.length) {
        out.push(h('div', { class: 'card' },
          h('h2', null, 'Самые уверенные промахи тревоги'),
          h('ul', { class: 'misses' }, misses.map((i) =>
            h('li', null,
              h('p', { class: 'item-text' }, i.text),
              h('p', { class: 'item-meta' }, `Уверенность была ${i.confidence}% — не сбылось`))))));
      }

      out.push(h('div', { class: 'card' },
        h('h2', null, 'Сохранить результат'),
        h('p', { class: 'muted' }, 'Картинка с вашей цифрой — без текста прогнозов. Можно оставить себе или отправить тому, кто тоже много тревожится.'),
        h('div', { class: 'item-actions' }, button('btn ghost', 'Сохранить картинку', () => shareImage(s)))));
    }

    out.push(h('div', { class: 'card cta' },
      h('h2', null, 'Если тревога не отпускает'),
      h('p', null, 'Цифры помогают увидеть, что тревога часто ошибается. Но если она всё равно мешает спать, работать и отдыхать — с этим можно работать. Я, Камила Золотова, психолог: КПТ и EMDR при тревоге и панике, онлайн.'),
      h('div', { class: 'item-actions' },
        h('a', { class: 'btn primary wide', href: LINKS.booking, target: '_blank', rel: 'noopener' }, 'Записаться на знакомство — 20 минут')),
      h('div', { class: 'item-links' },
        h('a', { class: 'link', href: LINKS.group, target: '_blank', rel: 'noopener' }, 'Или онлайн-группа при тревоге'))));

    return out.map((card, i) => (i ? h('div', { class: 'section', style: 'margin-top:12px' }, card) : card));
  }

  function bar(kind, label, pct) {
    return h('div', { class: 'bar-row' },
      h('div', { class: 'bar-label' }, h('span', null, label), h('span', null, `${pct}%`)),
      h('div', { class: `bar ${kind}` }, h('i', { style: `width:${pct}%` })));
  }

  // ---------- Действия ----------
  const find = (id) => state.items.find((i) => i.id === id);

  function resolve(id, outcome) {
    goal('app_forecast_checked');
    change(OUTCOMES[outcome].toast, () => {
      const item = find(id);
      item.outcome = outcome;
      item.resolvedAt = todayKey();
      askingHow = null;
    });
  }

  function postpone(id) {
    change('Перенесено на неделю', () => { find(id).due = addDays(7); });
  }

  function remove(id) {
    change('Запись удалена', () => { state.items = state.items.filter((i) => i.id !== id); });
  }

  function loadDemo() {
    const make = (text, createdAgo, dueIn, confidence, outcome) => ({
      id: uid(), text, confidence,
      created: addDays(-createdAgo),
      due: addDays(dueIn),
      outcome: outcome || null,
      resolvedAt: outcome ? addDays(dueIn) : null,
    });
    change(null, () => {
      state = {
        demo: true,
        items: [
          make('Начальник раскритикует мой отчёт на планёрке', 30, -27, 80, 'no'),
          make('Врач найдёт что-то серьёзное в анализах', 28, -21, 70, 'no'),
          make('Не успею сдать проект к сроку, и будет скандал', 26, -19, 85, 'coped'),
          make('Подруга обиделась и больше не напишет', 24, -20, 60, 'no'),
          make('На собеседовании растеряюсь и не смогу ответить', 22, -16, 90, 'no'),
          make('В самолёте случится паническая атака', 18, -12, 95, 'no'),
          make('Денег не хватит до зарплаты', 20, -10, 75, 'no'),
          make('Ребёнок не справится с контрольной', 14, -9, 55, 'no'),
          make('Арендодатель поднимет плату после разговора', 15, -8, 65, 'yes'),
          make('Клиент откажется от сделки после моего письма', 12, -6, 80, 'no'),
          make('Не усну перед важным днём и всё провалю', 9, -5, 85, 'no'),
          make('Меня не позовут на встречу выпускников', 7, -3, 50, 'no'),
          make('После отпуска на работе всё развалится', 6, -1, 70),
          make('В автосервисе скажут, что ремонт будет стоить огромных денег', 4, 0, 75),
          make('На выступлении в пятницу голос задрожит, и все заметят', 2, 3, 90),
          make('До конца месяца меня сократят', 1, 19, 60),
        ],
      };
    });
  }

  // ---------- Окно «Новый прогноз» ----------
  const dialog = $('#add');
  const form = $('#add-form');
  const fText = $('#f-text');
  const fDate = $('#f-date');
  const fConf = $('#f-conf');

  function openAdd() {
    form.reset();
    fDate.hidden = true;
    fDate.min = addDays(1);
    fDate.value = addDays(14);
    $('#f-conf-out').textContent = `${fConf.value}%`;
    $('#f-text-error').hidden = true;
    $('#f-date-error').hidden = true;
    dialog.showModal();
    fText.focus();
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'when') fDate.hidden = e.target.value !== 'custom';
  });
  fConf.addEventListener('input', () => { $('#f-conf-out').textContent = `${fConf.value}%`; });
  $('#add-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = fText.value.trim().replace(/\s+/g, ' ');
    const when = form.elements.when.value;
    const due = when === 'custom' ? fDate.value : addDays(Number(when));

    const badText = !text;
    const badDate = !due || due <= todayKey();
    $('#f-text-error').hidden = !badText;
    $('#f-date-error').hidden = !badDate;
    if (badText) { fText.focus(); return; }
    if (badDate) { fDate.focus(); return; }

    dialog.close();
    view = 'today';
    goal('app_forecast_added');
    change(`Записано. Проверим ${formatDate(due)}`, () => {
      state.items.push({
        id: uid(), text, due,
        confidence: Number(fConf.value),
        created: todayKey(),
        outcome: null,
        resolvedAt: null,
      });
    });
  });

  // ---------- Напоминание в календарь (.ics) ----------
  // Текст прогноза в календарь не попадает: календари часто синхронизируются и бывают общими.
  function downloadReminder(item) {
    const day = item.due.replaceAll('-', '');
    const nextDay = addDays(1, fromKey(item.due)).replaceAll('-', '');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pozitiv-psychology.ru//Arhiv nesbyvshegosya//RU',
      'BEGIN:VEVENT',
      `UID:${item.id}@arhiv-nesbyvshegosya`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      'SUMMARY:Архив несбывшегося: пора проверить прогноз',
      `DESCRIPTION:${location.href.split('#')[0]}`,
      'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:Пора проверить прогноз', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    download(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'proverit-prognoz.ics');
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Картинка с результатом ----------
  function shareImage(s) {
    const W = 1080, H = 1350;
    const canvas = h('canvas', { width: W, height: H });
    const c = canvas.getContext('2d');
    const head = 'Montserrat, "Helvetica Neue", Arial, sans-serif';

    c.fillStyle = '#F5F1EB';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#FAF8F5';
    if (c.roundRect) { c.beginPath(); c.roundRect(60, 60, W - 120, H - 120, 48); c.fill(); } else c.fillRect(60, 60, W - 120, H - 120);

    c.textAlign = 'center';
    c.fillStyle = '#8B9194';
    c.font = `700 34px ${head}`;
    c.fillText('АРХИВ НЕСБЫВШЕГОСЯ', W / 2, 200);

    c.fillStyle = '#2D5A4A';
    c.font = `800 300px ${head}`;
    c.fillText(`${s.missPct}%`, W / 2, 640);

    c.fillStyle = '#2D3436';
    c.font = `600 58px ${head}`;
    c.fillText('прогнозов моей тревоги', W / 2, 780);
    c.fillText('не сбылось', W / 2, 856);

    c.fillStyle = '#5A6266';
    c.font = '400 40px Georgia, serif';
    c.fillText(`Проверено: ${s.n}`, W / 2, 960);

    c.fillStyle = '#B87D5E';
    c.font = `600 34px ${head}`;
    c.fillText(`Проверьте свою тревогу · ${SHARE_SITE}`, W / 2, 1190);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const name = 'arhiv-nesbyvshegosya.png';
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Архив несбывшегося' }); return; } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      download(blob, name);
    }, 'image/png');
  }

  // ---------- Уведомление ----------
  let toastTimer;
  function toast(message, undo) {
    const el = $('#toast');
    el.replaceChildren(h('span', null, message));
    if (undo) el.append(button('link', 'Отменить', () => { undo(); hideToast(); }));
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { $('#toast').hidden = true; }

  // ---------- Удаление всех записей (в два нажатия) ----------
  const wipe = $('#wipe');
  let wipeArmed;
  wipe.addEventListener('click', () => {
    if (!wipeArmed) {
      wipe.textContent = 'Точно удалить всё? Нажмите ещё раз';
      wipeArmed = setTimeout(() => { wipeArmed = null; wipe.textContent = 'Удалить все записи'; }, 4000);
      return;
    }
    clearTimeout(wipeArmed);
    wipeArmed = null;
    wipe.textContent = 'Удалить все записи';
    if (remote.status !== 'off') disconnect();
    change('Все записи удалены', () => { state = { items: [], demo: false }; });
  });

  // ---------- Карта тревоги ----------
  const ART = window.ArhivArt;
  // Колод несколько: базовая (бесплатная) и тематические (файлы deck-*.js)
  const DECKS = [window.ARHIV_DECK, ...(window.ARHIV_EXTRA_DECKS || [])];
  DECKS.forEach((d) => d.cards.forEach((c) => { c.deckId = d.id; }));
  window.ARHIV_DECK_INDEX = Object.fromEntries(DECKS.map((d) => [d.id, d]));
  const deckById = (id) => window.ARHIV_DECK_INDEX[id] || DECKS[0];

  // Цвета и символ колоды: рамка карты, рубашка, акценты блока и картинка для отправки
  const SYMBOLS = {
    horizon: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="9" r="4" fill="currentColor"/><path d="M2 17h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    coin: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>',
  };
  const themeOf = (deck) => deck.theme || {};
  const deckVars = (deck) => {
    const t = themeOf(deck);
    return t.accent ? `--deck-accent:${t.accent};--deck-dark:${t.accentDark};--deck-soft:${t.soft};--back-top:${t.backTop};--back-bottom:${t.backBottom};` : '';
  };

  // Карта в рамке колоды: картинка, символ, название колоды и номер «03/28»
  function cardFrame(card) {
    const deck = deckById(card.deckId);
    const sym = h('span', { class: 'sym', 'aria-hidden': 'true' });
    sym.innerHTML = SYMBOLS[themeOf(deck).symbol] || '';
    return h('div', { class: 'cardframe' },
      ART.art(card),
      h('div', { class: 'cardfoot' }, sym, h('span', { class: 'cf-name' }, deck.name), h('span', null, `${String(card.id).padStart(2, '0')}/${deck.cards.length}`)));
  }
  const CARDS_KEY = 'arhiv-nesbyvshegosya:cards:v1';
  const DAILY_DRAWS = 1; // сколько карт в день бесплатно; адрес с ?test отключает ограничение
  const TEST_MODE = new URLSearchParams(location.search).has('test');
  const DAILY_QUESTION = 'Что мне важно заметить сегодня?';
  const REMIND_HOURS = [8, 9, 12, 18, 21];
  const PRESET_QUESTIONS = ['Что сейчас с моей тревогой?', 'О чём она пытается меня предупредить?', 'Что мне сейчас нужно?'];
  const AFTER_NOTE = 'Если тревога по-прежнему очень сильная, это не значит, что вы что-то делаете не так. Можно сделать паузу, поговорить с близким человеком или со специалистом. Если вам кажется, что вы в опасности, позвоните 112.';
  const HARD_NOTE = 'Если сейчас очень тяжело, сначала вернитесь к дыханию: вдох на 4, выдох на 6. Если вам кажется, что вы в опасности, позвоните 112 или обратитесь к близкому человеку.';

  let cards = loadCards();
  let cardUI = freshCardUI();

  function freshCardUI(deckId = 'base') {
    return { step: 'intro', deckId, question: (deckById(deckId).questions || PRESET_QUESTIONS)[0], custom: '', before: 5, daily: false, options: [], cardId: null, answers: ['', '', '', ''], after: 5, saved: null };
  }

  function loadCards() {
    try {
      const c = JSON.parse(localStorage.getItem(CARDS_KEY));
      if (c && Array.isArray(c.draws)) return c;
    } catch (e) { /* нет сохранённого */ }
    return { draws: [] };
  }

  function saveCards() {
    try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch (e) { /* хранилище недоступно */ }
    scheduleSync(); // час напоминания и дата последней карты уходят в сервис напоминаний (если подключён)
  }

  const cardById = (id, deckId) => deckById(deckId || 'base').cards.find((c) => c.id === id);
  const currentDeck = () => deckById(cardUI.deckId);
  const isLocked = (deck) => deck.access === 'paid' && !TEST_MODE && !(cards.unlocked || []).includes(deck.id);
  const currentQuestion = () => cardUI.custom.trim() || cardUI.question;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const num = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

  // Строки-хокку к карте: описание образа не показываем, чтобы не мешать собственным ассоциациям
  function verseEl(card) {
    return h('p', { class: 'verse' }, (card.verse || []).join('\n'));
  }

  function promptsFor(card) {
    return [
      'Что вы видите на карте? Что привлекает внимание в первую очередь?',
      'Какое чувство или ощущение в теле откликается?',
      card.q,
      'Что эта карта могла бы сказать вам о вашей тревоге?',
    ];
  }

  function pickOptions() {
    const deck = currentDeck();
    const recent = new Set(cards.draws.filter((d) => (d.deckId || 'base') === deck.id).slice(0, 6).map((d) => d.cardId));
    const all = deck.cards.map((c) => c.id);
    const need = Math.min(6, all.length);
    let pool = all.filter((id) => !recent.has(id));
    if (pool.length < need) pool = all;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, need);
  }

  function slider(value, onInput) {
    const out = h('output', null, String(value));
    const input = h('input', { type: 'range', min: 0, max: 10, step: 1, value });
    input.addEventListener('input', () => { out.textContent = input.value; onInput(Number(input.value)); });
    return { out, input };
  }

  // ---------- Картинка карты для отправки ----------
  // На картинке только карта, её название, строки к ней и адрес сайта: вопрос и ответы человека не попадают.
  const SHARE_URL = 'https://pozitiv-psychology.ru/arhiv/';

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image'));
      img.src = src;
    });
  }

  function roundedRect(c, x, y, w, h2, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h2, r);
    c.arcTo(x + w, y + h2, x, y + h2, r);
    c.arcTo(x, y + h2, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // Подбирает размер шрифта, чтобы строка помещалась по ширине
  function fitFont(c, text, maxW, size, make) {
    let s = size;
    c.font = make(s);
    while (c.measureText(text).width > maxW && s > 20) { s -= 2; c.font = make(s); }
  }

  async function renderShareImage(card) {
    const W = 1080, H = 1920;
    const head = 'Montserrat, "Helvetica Neue", Arial, sans-serif';
    const serif = '"Source Serif Pro", Georgia, serif';
    try {
      await Promise.all([document.fonts.load(`700 64px ${head}`), document.fonts.load(`600 30px ${head}`), document.fonts.load(`italic 400 42px ${serif}`)]);
    } catch (e) { /* шрифты не загрузились: используем запасные */ }
    const deck = deckById(card.deckId);
    const v = deck.imageVersion ? `?v=${deck.imageVersion}` : '';
    const img = await loadImage(`${deck.imageDir}${ART.pad(card.id)}.${deck.imageExt}${v}`);

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d');

    const bg = c.createLinearGradient(0, 0, 0, H);
    const th = themeOf(deck);
    bg.addColorStop(0, th.bgTop || '#F5F1EB'); bg.addColorStop(1, th.bgBottom || '#EAE3D8');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    c.textAlign = 'center';
    c.fillStyle = '#4A7C6F';
    c.font = `600 30px ${head}`;
    c.fillStyle = th.accent || '#4A7C6F';
    const topLine = (deck.title || 'Ассоциативная карта тревоги').toUpperCase();
    fitFont(c, topLine, 940, 30, (sz) => `600 ${sz}px ${head}`);
    c.fillText(topLine, W / 2, 112);

    // карта (формат 2:3), рамка и мягкая тень
    const cw = 800, ch = 1200, cx = (W - cw) / 2, cy = 150;
    c.save();
    c.shadowColor = 'rgba(45, 52, 54, 0.28)'; c.shadowBlur = 50; c.shadowOffsetY = 18;
    roundedRect(c, cx - 12, cy - 12, cw + 24, ch + 24, 44);
    c.fillStyle = '#FAF8F5'; c.fill();
    c.shadowColor = 'transparent'; c.lineWidth = 5; c.strokeStyle = th.accent || '#B87D5E'; c.stroke();
    c.restore();
    c.save();
    roundedRect(c, cx, cy, cw, ch, 34);
    c.clip();
    c.drawImage(img, cx, cy, cw, ch);
    c.restore();

    // название и строки
    c.fillStyle = '#2D3436';
    fitFont(c, card.title, 900, 68, (s) => `700 ${s}px ${head}`);
    c.fillText(card.title, W / 2, 1452);

    c.fillStyle = '#5A6266';
    const lines = card.verse || [];
    let y = 1528;
    for (const line of lines) {
      fitFont(c, line, 900, 42, (s) => `italic 400 ${s}px ${serif}`);
      c.fillText(line, W / 2, y);
      y += 60;
    }

    // подпись
    c.fillStyle = th.accentDark || '#2D5A4A';
    c.font = `600 34px ${head}`;
    c.fillText('Камила Золотова · психолог', W / 2, 1800);
    c.fillStyle = '#B87D5E';
    c.font = `600 32px ${head}`;
    c.fillText('pozitiv-psychology.ru/arhiv', W / 2, 1852);

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png'));
  }

  async function shareCard(card) {
    goal('app_share_card');
    try {
      const blob = await renderShareImage(card);
      const name = `karta-${ART.pad(card.id)}.png`;
      const file = new File([blob], name, { type: 'image/png' });
      const text = `Моя ассоциативная карта тревоги: «${card.title}». Попробуйте и вы: ${SHARE_URL}?utm_source=share&utm_medium=card`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: card.title, text }); return; } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      download(blob, name);
      toast('Картинка сохранена: отправьте её друзьям');
    } catch (e) {
      toast('Не получилось подготовить картинку');
    }
  }

  // Готовое сообщение для Камилы: только название карты, ответы человека никуда не передаются
  // Если человек пришёл с рекламы, сайт запомнил метку (pozitivUtm): она добавляется к сообщению, чтобы было видно источник
  function cardMessage(card, withUtm) {
    const text = `Здравствуйте! В приложении «Ассоциативная карта тревоги» мне выпала карта «${card.title}»${card.deckId && card.deckId !== 'base' ? ` из колоды «${deckById(card.deckId).name}»` : ''}. Хочу разобрать её с вами.`;
    const utm = withUtm && typeof window.pozitivUtm === 'function' ? window.pozitivUtm() : '';
    return utm ? `${text} [${utm}]` : text;
  }

  const hasUtm = () => typeof window.pozitivUtm === 'function' && !!window.pozitivUtm();

  function messageLinks(card) {
    const text = encodeURIComponent(cardMessage(card, true));
    return { tg: `${LINKS.telegram}?text=${text}`, wa: `${LINKS.whatsapp}?text=${text}` };
  }

  // Инструкция перед использованием: показывается один раз, потом открывается по ссылке «Как работают МАК карты»
  function renderGuide(first) {
    const close = () => { if (first) goal('app_guide_ok'); cards.guideSeen = true; saveCards(); cardUI.step = 'intro'; render(); window.scrollTo(0, 0); };
    const block = (title, ...kids) => h('div', { class: 'guide-block' }, h('h3', { class: 'guide-h' }, title), ...kids);

    return [h('div', { class: 'card' },
      h('h2', null, 'Как работают МАК карты'),
      h('p', { class: 'mak-note' }, h('b', null, 'МАК — метафорическая ассоциативная карта.')),
      block('Что это',
        h('p', null, 'Карта с образом, у которого нет готового значения. Вы смотрите на картинку и замечаете, что она вызывает в вас: чувство, воспоминание, мысль. Смысл рождается у вас, а не в карте.')),
      block('Чем это не является',
        h('p', null, 'Это не гадание и не прогноз. Карта ничего не предсказывает и не говорит, что с вами будет.')),
      block('Зачем это нужно',
        h('p', null, 'Это способ лучше понять себя и учиться обращаться со своими эмоциями: заметить чувство, назвать его, разглядеть, что за ним стоит, и выбрать маленький шаг.')),
      block('Как пользоваться',
        h('ol', { class: 'steps' },
          h('li', null, h('strong', null, 'Вопрос'), 'Выберите вопрос и отметьте, насколько тревожно сейчас.'),
          h('li', null, h('strong', null, 'Карта'), 'Выберите карту, не думая долго: к какой потянуло.'),
          h('li', null, h('strong', null, 'Образ'), 'Посмотрите на картинку и ответьте на вопросы. Правильных ответов нет, любой вопрос можно пропустить.'),
          h('li', null, h('strong', null, 'Строки и шаг'), 'По желанию прочитайте строки к карте (это одна из возможных историй, не обязательно ваша), сделайте маленький шаг и снова отметьте уровень тревоги.'))),
      block('Важно помнить',
        h('p', null, 'Любой вопрос и любой шаг можно пропустить. Если шаг про дыхание или тело вызывает неприятные ощущения, остановитесь. Если вам тяжело, сделайте паузу. Приложение не заменяет консультацию психолога. Если вам плохо или вы в опасности, позвоните 112.')),
      h('div', { class: 'item-actions' }, button('btn primary wide', first ? 'Понятно, начать' : 'Вернуться к картам', close)),
      h('div', { class: 'site-links' },
        h('a', { class: 'btn ghost', href: LINKS.site, target: '_blank', rel: 'noopener' }, 'Перейти на сайт'),
        h('a', { class: 'btn ghost', href: LINKS.contacts, target: '_blank', rel: 'noopener' }, 'Контакты')))];
  }

  function renderCards() {
    if (cardUI.step === 'intro' && !cards.guideSeen) return renderGuide(true);
    if (cardUI.step === 'guide') return renderGuide(!cards.guideSeen);
    if (cardUI.step === 'pick') return renderPick();
    if (cardUI.step === 'reflect') return renderReflect();
    if (cardUI.step === 'done') return renderDone();
    return renderCardsIntro();
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Код доступа к платной колоде. В файле колоды лежат только хеши кодов (их создаёт tools/make_codes.py).
  async function tryUnlock(deck, raw) {
    const code = raw.trim().toUpperCase().replace(/[\s-]+/g, '');
    if (!code) return;
    let ok = false;
    try { ok = (deck.codes || []).includes(await sha256(`${deck.id}:${code}`)); } catch (e) { /* нет crypto */ }
    if (ok) {
      cards.unlocked = [...new Set([...(cards.unlocked || []), deck.id])];
      saveCards();
      goal('app_deck_unlocked');
      render();
      toast(`Колода «${deck.name}» открыта`);
    } else {
      toast('Код не подходит. Проверьте, нет ли опечатки');
    }
  }

  function selectDeck(id) {
    if (id !== 'base') goal('app_deck_open');
    cardUI.deckId = id;
    cardUI.question = (deckById(id).questions || PRESET_QUESTIONS)[0];
    cardUI.custom = '';
    render();
  }

  function deckMessageLinks(deck) {
    const text = encodeURIComponent(`Здравствуйте! Хочу получить колоду «${deck.name}» в приложении «Ассоциативная карта тревоги».`);
    return { tg: `${LINKS.telegram}?text=${text}`, wa: `${LINKS.whatsapp}?text=${text}` };
  }

  function renderLockedDeck(deck) {
    const links = deckMessageLinks(deck);
    const codeInput = h('input', { type: 'text', class: 'code-input', placeholder: 'Код доступа', 'aria-label': 'Код доступа', autocomplete: 'off', autocapitalize: 'characters' });
    codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(deck, codeInput.value); });
    return [
      h('p', { class: 'ask' }, `Колода «${deck.name}» платная`),
      deck.price ? h('p', { class: 'muted' }, `Стоимость: ${deck.price} ₽`) : null,
      deck.preview ? h('div', { class: 'fan preview' }, deck.preview.map((id) => ART.art(cardById(id, deck.id)))) : null,
      h('div', { class: 'btn-row tall item-actions' },
        h('a', { class: 'btn primary', href: links.tg, 'data-goal': 'app_deck_request', target: '_blank', rel: 'noopener' }, 'Получить колоду: написать в Telegram'),
        h('a', { class: 'btn ghost', href: links.wa, 'data-goal': 'app_deck_request', target: '_blank', rel: 'noopener' }, 'Написать в WhatsApp')),
      h('p', { class: 'fine' }, 'Напишите Камиле, оплатите, и она пришлёт код доступа.'),
      h('div', { class: 'code-row' }, codeInput, button('btn soft', 'Открыть', () => tryUnlock(deck, codeInput.value))),
    ];
  }

  function startDaily() {
    const deck = currentDeck();
    goal('app_daily_start');
    cardUI.daily = true;
    cardUI.question = deck.dailyQuestion || DAILY_QUESTION;
    cardUI.custom = '';
    cardUI.before = null;
    cardUI.after = null;
    cardUI.options = pickOptions();
    cardUI.step = 'pick';
    render();
    window.scrollTo(0, 0);
  }

  function setDailyHour(hour) {
    cards.dailyHour = hour;
    saveCards();
    goal(hour == null ? 'app_reminder_off' : 'app_reminder_set');
    render();
  }

  // Ежедневное напоминание в календаре: работает без бота и без передачи данных
  function addDailyToCalendar(hour) {
    goal('app_reminder_calendar');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0);
    if (start <= now) start.setDate(start.getDate() + 1);
    const end = new Date(start.getTime() + 15 * 60000);
    const f = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pozitiv-psychology.ru//Karta dnya//RU',
      'BEGIN:VEVENT', 'UID:karta-dnya@arhiv-nesbyvshegosya', `DTSTAMP:${stamp}`,
      `DTSTART:${f(start)}`, `DTEND:${f(end)}`, 'RRULE:FREQ=DAILY',
      'SUMMARY:Карта дня',
      `DESCRIPTION:Откройте приложение и вытяните карту: ${SHARE_URL}?utm_source=reminder&utm_medium=calendar`,
      'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Карта дня', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    download(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'karta-dnya.ics');
    toast('Файл скачан: откройте его, и календарь добавит ежедневное напоминание');
  }

  function renderDailyReminder() {
    const cur = cards.dailyHour ?? null;
    const chip = (label, hour) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(cur === hour), onclick: () => setDailyHour(hour) }, label);
    const box = h('div', { class: 'card' },
      h('p', { class: 'ask', style: 'margin-top:0' }, 'Во сколько напоминать о карте дня?'),
      h('div', { class: 'chips', style: 'margin-top:10px' }, [chip('Не нужно', null), ...REMIND_HOURS.map((hh) => chip(`${hh}:00`, hh))]),
      h('p', { class: 'fine' }, 'Время по вашему устройству.'),
      h('div', { class: 'btn-row tall item-actions' }, button('btn soft', 'Добавить в календарь на каждый день', () => addDailyToCalendar(cur ?? 9))),
      h('p', { class: 'fine' }, 'Календарь работает без Telegram и без передачи данных. Если время не выбрано, напоминание будет в 9:00.'));
    const tg = API ? renderReminders() : null;
    const block = section('Напоминание', box, tg ? h('div', { style: 'margin-top:12px' }, tg) : null);
    block.id = 'reminder-block';
    return block;
  }

  function renderCardsIntro() {
    cardUI.daily = false;
    if (cardUI.before == null) { cardUI.before = 5; cardUI.after = 5; }
    const deck = currentDeck();
    const todays = cards.draws.filter((d) => d.date === todayKey() && (d.deckId || 'base') === deck.id);
    const dayDone = !TEST_MODE && todays.length >= DAILY_DRAWS;
    const questions = deck.questions || PRESET_QUESTIONS;
    const box = h('div', { class: 'card deck-card', style: deckVars(deck) },
      h('h2', null, deck.title || 'Ассоциативная карта тревоги'),
      h('p', { class: 'mak-note' }, h('b', null, 'МАК — метафорическая ассоциативная карта. '),
        'У образа нет «правильного» смысла: важно, что он вызывает именно у вас.'),
      h('p', { class: 'muted' }, `Колода «${deck.name}». ${deck.tagline ? `${deck.tagline} ` : ''}Это не гадание и не предсказание: карта помогает заметить то, что вы и так чувствуете.`),
      deck.note ? h('p', { class: 'fine' }, deck.note) : null,
      h('p', { style: 'margin-top:8px' }, button('link', 'Как работают МАК карты', () => { cardUI.step = 'guide'; render(); window.scrollTo(0, 0); })));

    if (DECKS.length > 1) {
      box.firstChild.after(
        h('p', { class: 'ask', style: 'margin-top:4px' }, 'Выберите колоду'),
        h('div', { class: 'chips', style: 'margin:10px 0 16px' }, DECKS.map((d) => h('button', {
          type: 'button', class: 'chip deck-chip', style: deckVars(d), 'aria-pressed': String(d.id === deck.id), onclick: () => selectDeck(d.id),
        }, h('i', { class: 'dot' }), isLocked(d) ? `${d.name} · платная` : d.name))));
    }

    if (isLocked(deck)) {
      box.append(...renderLockedDeck(deck).filter(Boolean));
    } else if (dayDone) {
      const card = cardById(todays[0].cardId, deck.id);
      box.append(
        h('p', { class: 'ask' }, `Карта на сегодня уже выбрана: «${card.title}».`),
        h('p', { class: 'muted' }, 'Новую можно будет выбрать завтра. Ответы по сегодняшней карте — в дневнике ниже.'));
    } else {
      const chipEls = questions.map((q) => h('button', {
        type: 'button', class: 'chip', 'data-q': q,
        'aria-pressed': String(!cardUI.custom.trim() && cardUI.question === q),
        onclick: () => { cardUI.question = q; cardUI.custom = ''; render(); },
      }, q));
      const syncChips = () => chipEls.forEach((el) => el.setAttribute('aria-pressed', String(!cardUI.custom.trim() && cardUI.question === el.dataset.q)));
      const custom = h('textarea', { rows: 2, maxlength: 160, placeholder: 'Или напишите свой вопрос', 'aria-label': 'Свой вопрос' }, cardUI.custom);
      custom.addEventListener('input', () => { cardUI.custom = custom.value; syncChips(); });

      const note = h('p', { class: 'status-err', hidden: cardUI.before < 9 }, HARD_NOTE);
      const sl = slider(cardUI.before, (v) => { cardUI.before = v; cardUI.after = v; note.hidden = v < 9; });

      box.append(
        h('div', { class: 'daily-box' },
          h('p', { class: 'ask', style: 'margin-top:0' }, 'Карта дня за минуту'),
          h('p', { class: 'muted' }, 'Без вопроса и оценок: просто вытяните карту и заметьте, что откликается.'),
          h('div', { class: 'item-actions', style: 'margin-top:10px' }, button('btn primary wide', 'Вытянуть карту дня', startDaily)),
          h('p', { style: 'margin-top:10px' }, button('link', 'Напоминать о карте дня (календарь или Telegram) ↓', () => {
            const el = document.getElementById('reminder-block');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }))),
        h('p', { class: 'ask' }, 'Или спросим карту о чём-то своём'),
        h('div', { class: 'chips qchips', style: 'margin-top:10px' }, chipEls),
        h('div', { style: 'margin-top:10px' }, custom),
        h('div', { class: 'slider-row' },
          h('span', { class: 'field-label' }, 'Насколько тревожно сейчас, от 0 до 10? ', sl.out),
          sl.input,
          h('span', { class: 'range-ends' }, h('span', null, 'спокойно'), h('span', null, 'очень тревожно'))),
        note,
        h('div', { class: 'item-actions' }, button('btn primary wide', 'Выбрать карту', () => {
          cardUI.daily = false;
          cardUI.after = cardUI.before;
          cardUI.options = pickOptions();
          cardUI.step = 'pick';
          render();
        })));
    }

    const out = [box, renderDailyReminder()];
    const history = renderHistory();
    if (history) out.push(history);
    return out;
  }

  function renderPick() {
    return [h('div', { class: 'card deck-card', style: deckVars(currentDeck()) },
      h('h2', null, 'Выберите карту'),
      h('p', { class: 'mak-note' }, h('b', null, 'МАК — метафорическая ассоциативная карта.')),
      h('p', { class: 'muted' }, `Ваш вопрос: «${currentQuestion()}». Не думайте долго: выберите ту карту, к которой тянет.`),
      h('div', { class: 'fan' }, cardUI.options.map((id, i) => h('button', {
        type: 'button', class: 'cardback', 'aria-label': `Закрытая карта ${i + 1}`,
        onclick: () => { goal('app_card_pick'); cardUI.cardId = id; cardUI.after = cardUI.before; cardUI.step = 'reflect'; render(); window.scrollTo(0, 0); },
      }))),
      h('div', { class: 'item-links' }, button('link', 'Назад', () => { cardUI.step = 'intro'; render(); })))];
  }

  function renderReflect() {
    const card = cardById(cardUI.cardId, cardUI.deckId);
    const prompts = promptsFor(card);
    const afterNote = h('p', { class: 'status-err', hidden: cardUI.after < 8 }, AFTER_NOTE);
    const after = slider(cardUI.after ?? 5, (v) => { cardUI.after = v; afterNote.hidden = v < 8; });

    return [
      h('div', { class: 'bigcard reveal', style: deckVars(deckById(card.deckId)) },
        cardFrame(card),
        h('div', { class: 'bigcard-title' }, h('span', { class: 'cat' }, deckById(card.deckId).groups[card.group]), h('h2', null, card.title))),
      h('div', { class: 'card', style: 'margin-top:14px' },
        h('div', { class: 'stack' }, prompts.map((p, i) => {
          const area = h('textarea', { rows: 2, maxlength: 400, placeholder: 'Коротко или пропустите' }, cardUI.answers[i]);
          area.addEventListener('input', () => { cardUI.answers[i] = area.value; });
          return h('label', { class: 'field', style: 'margin:0' }, h('span', { class: 'field-label' }, p), area);
        }))),
      // Строки к карте показываем по желанию и после собственных ответов, чтобы они не подсказывали готовый смысл
      h('details', { class: 'card verse-box', style: 'margin-top:12px' },
        h('summary', null, 'Показать строки к карте'),
        h('p', { class: 'fine' }, 'Это одна из возможных историй. Она не обязательно ваша.'),
        verseEl(card)),
      h('div', { class: 'card step-card', style: 'margin-top:12px' },
        h('p', { class: 'ask', style: 'margin-top:0' }, 'Маленький шаг, если захочется'),
        h('p', null, card.step),
        h('p', { class: 'fine' }, 'Шаг можно пропустить: если сейчас тяжело или не хочется, это нормально.'),
        deckById(card.deckId).note ? h('p', { class: 'fine' }, deckById(card.deckId).note) : null),
      cardUI.daily
        ? h('div', { class: 'card', style: 'margin-top:12px' },
          h('div', { class: 'item-actions', style: 'margin-top:0' }, button('btn primary wide', 'Сохранить в дневник', saveDraw)),
          h('div', { class: 'item-links' }, button('link', 'Выбрать другую карту', () => { cardUI.step = 'pick'; render(); window.scrollTo(0, 0); })))
        : h('div', { class: 'card', style: 'margin-top:12px' },
          h('span', { class: 'field-label' }, 'Насколько тревожно сейчас, от 0 до 10? ', after.out),
          after.input,
          h('span', { class: 'range-ends' }, h('span', null, 'спокойно'), h('span', null, 'очень тревожно')),
          afterNote,
          h('div', { class: 'item-actions' }, button('btn primary wide', 'Сохранить в дневник', saveDraw)),
          h('div', { class: 'item-links' }, button('link', 'Выбрать другую карту', () => { cardUI.step = 'pick'; render(); window.scrollTo(0, 0); }))),
    ];
  }

  function saveDraw() {
    const draw = {
      id: uid(), date: todayKey(), ts: Date.now(),
      deckId: cardUI.deckId, cardId: cardUI.cardId, question: currentQuestion(),
      before: cardUI.daily ? null : cardUI.before, after: cardUI.daily ? null : cardUI.after, daily: cardUI.daily,
      answers: cardUI.answers.map((a) => a.trim()),
    };
    goal('app_card_saved');
    cards.draws.unshift(draw);
    saveCards();
    cardUI.saved = draw;
    cardUI.step = 'done';
    render();
    window.scrollTo(0, 0);
  }

  function renderDone() {
    const dr = cardUI.saved;
    const card = cardById(dr.cardId, dr.deckId);
    let line;
    if (dr.before == null) {
      line = 'Карта дня сохранена. Остановиться и заметить, что откликается, уже маленькая практика.';
    } else {
      line = `Было ${dr.before}, стало ${dr.after}.`;
      if (dr.after < dr.before) line += ' Вы заметили свою тревогу и уделили ей внимание, и это уже работа.';
      else if (dr.after === dr.before) line += ' Это тоже нормально: карта не обязана снижать тревогу сразу.';
      else line += ' Иногда, когда мы начинаем замечать тревогу, она становится заметнее. Это не ошибка.';
    }

    return [
      h('div', { class: 'bigcard', style: `max-width:240px;${deckVars(deckById(card.deckId))}` }, cardFrame(card),
        h('div', { class: 'bigcard-title' }, h('h2', { style: 'font-size:22px' }, card.title)),
        verseEl(card)),
      h('div', { class: 'card', style: 'margin-top:16px' },
        h('h2', null, 'Записано в дневник'),
        h('p', { class: 'muted' }, line),
        dr.after >= 8 ? h('p', { class: 'status-err' }, AFTER_NOTE) : null,
        h('div', { class: 'item-actions' },
          button('btn soft wide', 'Поделиться картой', () => shareCard(card)),
          h('p', { class: 'fine', style: 'margin:8px 0 12px' }, 'На картинке только карта и строки к ней: без вашего вопроса и ответов.'),
          button('btn ghost wide', 'Готово', () => { cardUI = freshCardUI(cardUI.deckId); render(); window.scrollTo(0, 0); }))),
      h('div', { class: 'card cta', style: 'margin-top:12px' },
        h('h2', null, 'Разобрать эту карту со мной'),
        h('p', null, 'Иногда одна карта открывает то, о чём важно поговорить подробнее. Я, Камила Золотова, помогу в этом разобраться: КПТ и EMDR при тревоге и панике, онлайн.'),
        h('div', { class: 'btn-row tall item-actions' },
          h('a', { class: 'btn primary', href: messageLinks(card).tg, target: '_blank', rel: 'noopener' }, 'Написать про эту карту в Telegram'),
          h('a', { class: 'btn ghost', href: messageLinks(card).wa, target: '_blank', rel: 'noopener' }, 'Написать в WhatsApp')),
        h('p', { class: 'fine' }, `В сообщение попадёт только название карты, ваши ответы остаются у вас. Текст: «${cardMessage(card)}»${hasUtm() ? ' К нему добавится короткая служебная метка источника.' : ''}`),
        h('div', { class: 'item-links' },
          h('a', { class: 'link', href: LINKS.booking, target: '_blank', rel: 'noopener' }, 'Или записаться на знакомство — 20 минут'))),
    ];
  }

  function renderHistory() {
    const draws = cards.draws;
    if (!draws.length) return null;
    const parts = [];

    const rated = draws.filter((d) => d.before != null);
    if (rated.length >= 3) {
      const first = cardById(draws[draws.length - 1].cardId, draws[draws.length - 1].deckId);
      const last = cardById(draws[0].cardId, draws[0].deckId);
      parts.push(h('div', { class: 'card', style: 'margin-bottom:12px' },
        h('h2', null, 'Ваша динамика'),
        h('p', null, `По вашим оценкам: до карты тревога в среднем ${num(avg(rated.map((d) => d.before)))}, после — ${num(avg(rated.map((d) => d.after)))} (карт: ${rated.length}).`),
        h('p', { class: 'muted', style: 'margin-top:8px' }, `Первая карта — «${first.title}», последняя — «${last.title}».`)));
    }

    parts.push(h('div', { class: 'stack' }, draws.map((dr) => {
      const card = cardById(dr.cardId, dr.deckId);
      const prompts = promptsFor(card);
      const filled = dr.answers.map((a, i) => (a ? h('p', null, h('b', null, prompts[i]), a) : null));
      return h('details', { class: 'card entry' },
        h('summary', null,
          h('span', { class: 'mini' }, ART.art(card)),
          h('span', { class: 'entry-head' }, h('strong', null, card.title), h('span', { class: 'muted' }, `${dr.deckId && dr.deckId !== 'base' ? `${deckById(dr.deckId).name} · ` : ''}${formatDate(dr.date)} · ${dr.before == null ? 'карта дня' : `тревога ${dr.before} → ${dr.after}`}`))),
        h('div', { class: 'entry-body' },
          verseEl(card),
          h('p', null, h('b', null, 'Вопрос'), `«${dr.question}»`),
          filled,
          h('p', null, h('b', null, 'Шаг на сегодня'), card.step),
          h('div', { class: 'item-links' },
            button('link', 'Поделиться картой', () => shareCard(card)),
            h('a', { class: 'link', href: messageLinks(card).tg, target: '_blank', rel: 'noopener' }, 'Написать про карту в Telegram'),
            h('a', { class: 'link', href: messageLinks(card).wa, target: '_blank', rel: 'noopener' }, 'в WhatsApp'),
            button('link danger', 'Удалить запись', () => {
            const snapshot = JSON.stringify(cards);
            cards.draws = cards.draws.filter((x) => x.id !== dr.id);
            saveCards();
            render();
            toast('Запись удалена', () => { cards = JSON.parse(snapshot); saveCards(); render(); });
          }))));
    })));

    return section('Дневник карт', ...parts);
  }

  // ---------- Отрисовка ----------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => { view = tab.dataset.view; askingHow = null; render(); window.scrollTo(0, 0); });
  });

  function render() {
    const s = stats();
    const screens = { today: renderToday, cards: renderCards, archive: renderArchive, insights: renderInsights };
    $('#app').replaceChildren(...screens[view](s));

    document.querySelectorAll('.tab').forEach((tab) => {
      if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    const badge = $('#due-badge');
    badge.hidden = !s.due.length;
    badge.textContent = s.due.length || '';
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && remote.status === 'waiting') pollStatus();
  });

  render();
  if (API && remote.status === 'on') syncNow();
  if (API && remote.status === 'waiting') pollStatus();
})();
