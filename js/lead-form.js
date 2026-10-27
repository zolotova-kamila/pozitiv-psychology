// Форма заявки: отправляет заявку Камиле в Telegram через сервер сайта.
// Посетителю не нужен Telegram — достаточно оставить телефон, @username или e-mail.
(function () {
  var ENDPOINT = 'https://pozitiv-psychology.ru/api/chat.php';
  // Корень сайта — по адресу этого скрипта (работает и на основном домене, и на GitHub Pages)
  var me = document.currentScript && document.currentScript.src;
  var ROOT = me ? me.replace(/js\/lead-form\.js.*$/, '') : '';

  function isValidContact(value) {
    var v = value.trim();
    if (/^@[a-zA-Z0-9_]{4,32}$/.test(v)) return true;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true;
    var digits = v.replace(/\D/g, '');
    return /^[\d\s()+\-.]+$/.test(v) && digits.length >= 10 && digits.length <= 15;
  }

  function showError(form, text) {
    var box = form.querySelector('.lead-error');
    box.textContent = text;
    box.hidden = false;
  }

  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var contactInput = form.querySelector('[name="contact"]');
    contactInput.addEventListener('input', function () {
      contactInput.classList.remove('lead-invalid');
      form.querySelector('.lead-error').hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('[type="submit"]');
      var field = function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : '';
      };

      if (!isValidContact(field('contact'))) {
        contactInput.classList.add('lead-invalid');
        contactInput.focus();
        showError(form, 'Укажите телефон с кодом страны, @username в Telegram или e-mail — так я смогу ответить.');
        return;
      }

      var source = form.getAttribute('data-lead-form');
      if (field('source')) source += ' · узнали: ' + field('source');
      var utm = window.pozitivUtm ? window.pozitivUtm() : '';
      if (utm) source += ' · реклама: ' + utm;
      var comment = field('message') || 'Без описания';
      if (field('messenger')) comment += ' · удобный способ связи: ' + field('messenger');

      var label = button.textContent;
      button.disabled = true;
      button.textContent = 'Отправляю…';

      fetch(ENDPOINT, {
        method: 'POST',
        // text/plain — "простой" запрос без CORS-предзапроса; сервер всё равно читает тело как JSON
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          type: 'lead',
          name: field('name'),
          phone: field('contact'),
          comment: comment,
          source: source,
          website: field('website')
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok || !data.success) throw new Error(data.error || 'Ошибка отправки');
          });
        })
        .then(function () {
          // Цель lead_sent засчитывает страница «Спасибо» — её же удобно указать целью в рекламе
          try { sessionStorage.setItem('pozitiv_lead', source); } catch (e) {}
          if (ROOT) { location.href = ROOT + 'spasibo.html'; return; }
          if (window.pozitivGoal) window.pozitivGoal('lead_sent');
          form.hidden = true;
          form.parentNode.querySelector('.lead-success').hidden = false;
        })
        .catch(function (err) {
          button.disabled = false;
          button.textContent = label;
          // Технический текст ошибки посетителю не показываем
          showError(form, 'Не получилось отправить заявку. Пожалуйста, напишите мне в WhatsApp или Telegram или позвоните: +7 (909) 903-00-00.');
        });
    });
  });
})();
