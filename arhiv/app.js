(() => {
  'use strict';

  // ---------- Настройки ----------
  const STORAGE_KEY = 'arhiv-nesbyvshegosya:v1';
  const UNLOCK_AFTER = 5; // сколько проверенных прогнозов нужно, чтобы открыть «Итоги»
  const LINKS = {
    booking: 'https://pozitiv-psychology.ru/#zapis',
    group: 'https://pozitiv-psychology.ru/group-therapy-landing.html',
  };
  const SHARE_SITE = 'pozitiv-psychology.ru';

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

  async function api(path, body) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    try {
      const res = await fetch(API + path, body
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
    if (!API || remote.status !== 'on' || state.demo) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 600);
  }

  async function syncNow() {
    if (!API || remote.status !== 'on' || state.demo) return;
    const before = remoteSnapshot();
    const items = state.items.filter((i) => !i.outcome).map((i) => ({ id: i.id, due: i.due }));
    try {
      const r = await api('/api/sync', { key: remote.key, tz: -new Date().getTimezoneOffset(), items });
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
        h('p', { class: 'muted', style: 'margin-top:6px' }, 'Бот напишет в 9:00 по вашему времени в день проверки. Текст прогнозов боту не передаётся.'),
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
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'В день проверки бот напишет вам: «Пора проверить прогноз». Так архив не забудется.'),
      error,
      h('div', { class: 'item-actions' },
        botName
          ? botLink('btn primary wide', 'Подключить Telegram')
          : h('span', { class: 'muted' }, remoteError ? '' : 'Загружаем…')),
      h('p', { class: 'fine' },
        'Боту передаётся только ваш Telegram-идентификатор и даты проверки, без текста прогнозов. Нажимая кнопку, вы соглашаетесь на их обработку для напоминаний: ',
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
  const DECK = window.ARHIV_DECK;
  const ART = window.ArhivArt;
  const CARDS_KEY = 'arhiv-nesbyvshegosya:cards:v1';
  const DAILY_DRAWS = 1; // сколько карт в день бесплатно; адрес с ?test отключает ограничение
  const TEST_MODE = new URLSearchParams(location.search).has('test');
  const PRESET_QUESTIONS = ['Что сейчас с моей тревогой?', 'О чём она пытается меня предупредить?', 'Что мне сейчас нужно?'];
  const HARD_NOTE = 'Если сейчас очень тяжело, сначала вернитесь к дыханию: вдох на 4, выдох на 6. Если вам кажется, что вы в опасности, позвоните 112 или обратитесь к близкому человеку.';

  let cards = loadCards();
  let cardUI = freshCardUI();

  function freshCardUI() {
    return { step: 'intro', question: PRESET_QUESTIONS[0], custom: '', before: 5, options: [], cardId: null, answers: ['', '', '', ''], after: 5, saved: null };
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
  }

  const cardById = (id) => DECK.cards.find((c) => c.id === id);
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
    const recent = new Set(cards.draws.slice(0, 6).map((d) => d.cardId));
    let pool = DECK.cards.map((c) => c.id).filter((id) => !recent.has(id));
    if (pool.length < 6) pool = DECK.cards.map((c) => c.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }

  function slider(value, onInput) {
    const out = h('output', null, String(value));
    const input = h('input', { type: 'range', min: 0, max: 10, step: 1, value });
    input.addEventListener('input', () => { out.textContent = input.value; onInput(Number(input.value)); });
    return { out, input };
  }

  function renderCards() {
    if (cardUI.step === 'pick') return renderPick();
    if (cardUI.step === 'reflect') return renderReflect();
    if (cardUI.step === 'done') return renderDone();
    return renderCardsIntro();
  }

  function renderCardsIntro() {
    const todays = cards.draws.filter((d) => d.date === todayKey());
    const locked = !TEST_MODE && todays.length >= DAILY_DRAWS;
    const box = h('div', { class: 'card' },
      h('h2', null, 'Ассоциативная карта тревоги'),
      h('p', { class: 'mak-note' }, h('b', null, 'МАК — метафорическая ассоциативная карта. '),
        'У образа нет «правильного» смысла: важно, что он вызывает именно у вас.'),
      h('p', { class: 'muted' }, `Колода «${DECK.name}». Это не гадание и не предсказание: карта помогает заметить то, что вы и так чувствуете.`));

    if (locked) {
      const card = cardById(todays[0].cardId);
      box.append(
        h('p', { class: 'ask' }, `Карта на сегодня уже выбрана: «${card.title}».`),
        h('p', { class: 'muted' }, 'Новую можно будет выбрать завтра. Ответы по сегодняшней карте — в дневнике ниже.'));
    } else {
      const chipEls = PRESET_QUESTIONS.map((q) => h('button', {
        type: 'button', class: 'chip', 'data-q': q,
        'aria-pressed': String(!cardUI.custom.trim() && cardUI.question === q),
        onclick: () => { cardUI.question = q; cardUI.custom = ''; render(); },
      }, q));
      const syncChips = () => chipEls.forEach((el) => el.setAttribute('aria-pressed', String(!cardUI.custom.trim() && cardUI.question === el.dataset.q)));
      const custom = h('textarea', { rows: 2, maxlength: 160, placeholder: 'Или напишите свой вопрос', 'aria-label': 'Свой вопрос' }, cardUI.custom);
      custom.addEventListener('input', () => { cardUI.custom = custom.value; syncChips(); });

      const note = h('p', { class: 'status-err', hidden: cardUI.before < 9 }, HARD_NOTE);
      const s = slider(cardUI.before, (v) => { cardUI.before = v; cardUI.after = v; note.hidden = v < 9; });

      box.append(
        h('p', { class: 'ask' }, 'О чём спросим карту?'),
        h('div', { class: 'chips qchips', style: 'margin-top:10px' }, chipEls),
        h('div', { style: 'margin-top:10px' }, custom),
        h('div', { class: 'slider-row' },
          h('span', { class: 'field-label' }, 'Насколько тревожно сейчас, от 0 до 10? ', s.out),
          s.input,
          h('span', { class: 'range-ends' }, h('span', null, 'спокойно'), h('span', null, 'очень тревожно'))),
        note,
        h('div', { class: 'item-actions' }, button('btn primary wide', 'Выбрать карту', () => {
          cardUI.options = pickOptions();
          cardUI.step = 'pick';
          render();
        })));
    }

    const out = [box];
    const history = renderHistory();
    if (history) out.push(history);
    return out;
  }

  function renderPick() {
    return [h('div', { class: 'card' },
      h('h2', null, 'Выберите карту'),
      h('p', { class: 'mak-note' }, h('b', null, 'МАК — метафорическая ассоциативная карта.')),
      h('p', { class: 'muted' }, `Ваш вопрос: «${currentQuestion()}». Не думайте долго: выберите ту карту, к которой тянет.`),
      h('div', { class: 'fan' }, cardUI.options.map((id, i) => h('button', {
        type: 'button', class: 'cardback', 'aria-label': `Закрытая карта ${i + 1}`,
        onclick: () => { cardUI.cardId = id; cardUI.after = cardUI.before; cardUI.step = 'reflect'; render(); window.scrollTo(0, 0); },
      }))),
      h('div', { class: 'item-links' }, button('link', 'Назад', () => { cardUI.step = 'intro'; render(); })))];
  }

  function renderReflect() {
    const card = cardById(cardUI.cardId);
    const prompts = promptsFor(card);
    const after = slider(cardUI.after, (v) => { cardUI.after = v; });

    return [
      h('div', { class: 'bigcard reveal' },
        ART.art(card),
        h('div', { class: 'bigcard-title' }, h('span', { class: 'cat' }, DECK.groups[card.group]), h('h2', null, card.title))),
      verseEl(card),
      h('div', { class: 'card' },
        h('div', { class: 'stack' }, prompts.map((p, i) => {
          const area = h('textarea', { rows: 2, maxlength: 400, placeholder: 'Коротко или пропустите' }, cardUI.answers[i]);
          area.addEventListener('input', () => { cardUI.answers[i] = area.value; });
          return h('label', { class: 'field', style: 'margin:0' }, h('span', { class: 'field-label' }, p), area);
        }))),
      h('div', { class: 'card step-card', style: 'margin-top:12px' },
        h('p', { class: 'ask', style: 'margin-top:0' }, 'Маленький шаг на сегодня'),
        h('p', null, card.step)),
      h('div', { class: 'card', style: 'margin-top:12px' },
        h('span', { class: 'field-label' }, 'Насколько тревожно сейчас, от 0 до 10? ', after.out),
        after.input,
        h('span', { class: 'range-ends' }, h('span', null, 'спокойно'), h('span', null, 'очень тревожно')),
        h('div', { class: 'item-actions' }, button('btn primary wide', 'Сохранить в дневник', saveDraw)),
        h('div', { class: 'item-links' }, button('link', 'Выбрать другую карту', () => { cardUI.step = 'pick'; render(); window.scrollTo(0, 0); }))),
    ];
  }

  function saveDraw() {
    const draw = {
      id: uid(), date: todayKey(), ts: Date.now(),
      cardId: cardUI.cardId, question: currentQuestion(),
      before: cardUI.before, after: cardUI.after,
      answers: cardUI.answers.map((a) => a.trim()),
    };
    cards.draws.unshift(draw);
    saveCards();
    cardUI.saved = draw;
    cardUI.step = 'done';
    render();
    window.scrollTo(0, 0);
  }

  function renderDone() {
    const dr = cardUI.saved;
    const card = cardById(dr.cardId);
    let line = `Было ${dr.before}, стало ${dr.after}.`;
    if (dr.after < dr.before) line += ' Вы заметили свою тревогу и уделили ей внимание, и это уже работа.';
    else if (dr.after === dr.before) line += ' Это тоже нормально: карта не обязана снижать тревогу сразу.';
    else line += ' Иногда, когда мы начинаем замечать тревогу, она становится заметнее. Это не ошибка.';

    return [
      h('div', { class: 'bigcard', style: 'max-width:240px' }, ART.art(card),
        h('div', { class: 'bigcard-title' }, h('h2', { style: 'font-size:22px' }, card.title)),
        verseEl(card)),
      h('div', { class: 'card', style: 'margin-top:16px' },
        h('h2', null, 'Записано в дневник'),
        h('p', { class: 'muted' }, line),
        h('div', { class: 'item-actions' }, button('btn ghost wide', 'Готово', () => { cardUI = freshCardUI(); render(); window.scrollTo(0, 0); }))),
      h('div', { class: 'card cta', style: 'margin-top:12px' },
        h('h2', null, 'Разобрать эту карту со мной'),
        h('p', null, 'Иногда одна карта открывает то, о чём важно поговорить подробнее. Я, Камила Золотова, помогу в этом разобраться: КПТ и EMDR при тревоге и панике, онлайн.'),
        h('div', { class: 'item-actions' },
          h('a', { class: 'btn primary wide', href: LINKS.booking, target: '_blank', rel: 'noopener' }, 'Записаться на знакомство — 20 минут'))),
    ];
  }

  function renderHistory() {
    const draws = cards.draws;
    if (!draws.length) return null;
    const parts = [];

    if (draws.length >= 3) {
      const first = cardById(draws[draws.length - 1].cardId);
      const last = cardById(draws[0].cardId);
      parts.push(h('div', { class: 'card', style: 'margin-bottom:12px' },
        h('h2', null, 'Ваша динамика'),
        h('p', null, `По вашим оценкам: до карты тревога в среднем ${num(avg(draws.map((d) => d.before)))}, после — ${num(avg(draws.map((d) => d.after)))} (карт: ${draws.length}).`),
        h('p', { class: 'muted', style: 'margin-top:8px' }, `Первая карта — «${first.title}», последняя — «${last.title}».`)));
    }

    parts.push(h('div', { class: 'stack' }, draws.map((dr) => {
      const card = cardById(dr.cardId);
      const prompts = promptsFor(card);
      const filled = dr.answers.map((a, i) => (a ? h('p', null, h('b', null, prompts[i]), a) : null));
      return h('details', { class: 'card entry' },
        h('summary', null,
          h('span', { class: 'mini' }, ART.art(card)),
          h('span', { class: 'entry-head' }, h('strong', null, card.title), h('span', { class: 'muted' }, `${formatDate(dr.date)} · тревога ${dr.before} → ${dr.after}`))),
        h('div', { class: 'entry-body' },
          verseEl(card),
          h('p', null, h('b', null, 'Вопрос'), `«${dr.question}»`),
          filled,
          h('p', null, h('b', null, 'Шаг на сегодня'), card.step),
          h('div', { class: 'item-links' }, button('link danger', 'Удалить запись', () => {
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
