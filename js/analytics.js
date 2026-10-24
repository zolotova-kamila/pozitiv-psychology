// Счётчики посещаемости. Загружаются только после согласия посетителя на cookie
// (их подключает js/cookie-consent.js). Вебвизор выключен: записи визитов
// и того, что люди вводят в формы, не ведутся.
(function () {
  if (window.__pozitivAnalyticsLoaded) return;
  window.__pozitivAnalyticsLoaded = true;

  // Яндекс.Метрика
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  ym(95862074, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false
  });

  // Top.Mail.Ru
  var _tmr = window._tmr || (window._tmr = []);
  _tmr.push({ id: '3748347', type: 'pageView', start: (new Date()).getTime() });
  (function (d, id) {
    if (d.getElementById(id)) return;
    var ts = d.createElement('script'); ts.async = true; ts.id = id;
    ts.src = 'https://top-fwz1.mail.ru/js/code.js';
    var s = d.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ts, s);
  })(document, 'tmr-code');
})();
