// Цели для Яндекс.Метрики и VK Ads (Top.Mail.Ru) и сохранение рекламных меток.
// Счётчики появляются только после согласия на cookie (js/analytics.js);
// без согласия цели никуда не отправляются.
//
// Цели (их нужно один раз создать в Метрике как «JavaScript-событие»):
//   lead_sent      — заявка отправлена через форму (главная цель для рекламы)
//   zapis_click    — нажатие кнопки «Записаться» и похожих
//   telegram_click, whatsapp_click, max_click, phone_click, email_click — переход к связи
//   contact_click  — любой из переходов к связи (для одной составной цели)
//   download_click — скачивание файла
(function () {
  var YM_ID = 95862074;
  var TMR_ID = '3748347';
  var UTM_KEY = 'pozitiv_utm';
  var UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function goal(name) {
    try { if (typeof window.ym === 'function') window.ym(YM_ID, 'reachGoal', name); } catch (e) {}
    try { if (window._tmr && typeof window._tmr.push === 'function') window._tmr.push({ id: TMR_ID, type: 'reachGoal', goal: name }); } catch (e) {}
  }
  window.pozitivGoal = goal;

  // Рекламные метки: запоминаем при входе на сайт (на время вкладки),
  // чтобы потом добавить их в заявку и в сообщение в мессенджер.
  (function saveUtm() {
    try {
      var params = new URLSearchParams(location.search);
      var parts = [];
      UTM_FIELDS.forEach(function (k) {
        var v = params.get(k);
        if (v) parts.push(k.replace('utm_', '') + '=' + v.slice(0, 80));
      });
      if (params.get('yclid')) parts.push('yclid');
      if (params.get('rb_clickid') || params.get('vk_clickid')) parts.push('vk');
      if (parts.length) sessionStorage.setItem(UTM_KEY, parts.join(', '));
    } catch (e) {}
  })();

  window.pozitivUtm = function () {
    try { return sessionStorage.getItem(UTM_KEY) || ''; } catch (e) { return ''; }
  };

  // Если человек пришёл с рекламы, в WhatsApp и Telegram подставляем
  // приветствие с меткой — так видно, какое объявление сработало.
  function withUtmText(link) {
    var utm = window.pozitivUtm();
    if (!utm || link.dataset.utmDone) return;
    link.dataset.utmDone = '1';
    try {
      var url = new URL(link.href);
      if (url.searchParams.get('text')) return;
      var host = url.hostname;
      if (host !== 'wa.me' && host !== 't.me') return;
      if (/bot$/i.test(url.pathname)) return;
      // encodeURIComponent, а не searchParams: WhatsApp показывает «+» вместо пробелов
      var text = 'Здравствуйте! Пишу с сайта, хочу записаться на бесплатную встречу. [' + utm + ']';
      link.href = url.origin + url.pathname + (url.search ? url.search + '&' : '?') + 'text=' + encodeURIComponent(text);
    } catch (e) {}
  }

  var CTA = '.nav-cta, .btn-service, .btn-primary, .btn-white, .hero-cta, a[href$="#zapis"], a[href*="contact.html"].btn';

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a, button') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var contact = '';
    if (/(^|\/\/)(t\.me|telegram\.me)\//.test(href)) contact = 'telegram_click';
    else if (/wa\.me\/|whatsapp\.com/.test(href)) contact = 'whatsapp_click';
    else if (/max\.ru\//.test(href)) contact = 'max_click';
    else if (/^tel:/.test(href)) contact = 'phone_click';
    else if (/^mailto:/.test(href)) contact = 'email_click';

    if (contact) {
      withUtmText(el);
      goal(contact);
      goal('contact_click');
    } else if (el.matches(CTA)) {
      goal('zapis_click');
    }
    if (el.hasAttribute('download')) goal('download_click');
  }, true);
})();
