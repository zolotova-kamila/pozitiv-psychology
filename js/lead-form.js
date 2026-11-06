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

  function isPhone(value) {
    var v = value.trim();
    var digits = v.replace(/\D/g, '');
    return /^[\d\s()+\-.]+$/.test(v) && digits.length >= 10 && digits.length <= 15;
  }

  var PHONE_ERROR = 'Укажите номер телефона с кодом страны, например +7 900 000-00-00.';
  // Как человек хочет получить ответ. Звонок, WhatsApp и MAX работают по номеру, в Telegram можно ещё и @username.
  var CHANNELS = [
    { value: 'Звонок', label: 'Позвонить', placeholder: 'Телефон, например +7 900 000-00-00', error: PHONE_ERROR, accepts: isPhone },
    { value: 'Telegram', label: 'Telegram', placeholder: '@username или телефон', error: 'Укажите @username в Telegram или номер телефона с кодом страны.',
      accepts: function (v) { return /^@[a-zA-Z0-9_]{4,32}$/.test(v.trim()) || isPhone(v); } },
    { value: 'WhatsApp', label: 'WhatsApp', placeholder: 'Телефон, например +7 900 000-00-00', error: PHONE_ERROR, accepts: isPhone },
    { value: 'MAX', label: 'MAX', placeholder: 'Телефон, например +7 900 000-00-00', error: PHONE_ERROR, accepts: isPhone }
  ];

  function channelOf(form) {
    var checked = form.querySelector('input[name="messenger"]:checked');
    if (!checked) return null;
    for (var i = 0; i < CHANNELS.length; i++) if (CHANNELS[i].value === checked.value) return CHANNELS[i];
    return null;
  }

  function injectChannelStyles() {
    if (document.getElementById('lead-channel-styles')) return;
    var st = document.createElement('style');
    st.id = 'lead-channel-styles';
    st.textContent =
      '.lead-channel{margin:0 0 14px}' +
      '.lead-channel-title{display:block;margin-bottom:8px;font-weight:600}' +
      '.lead-channel-options{display:flex;flex-wrap:wrap;gap:8px}' +
      '.lead-channel-option{position:relative;cursor:pointer}' +
      '.lead-channel-option input{position:absolute;opacity:0;width:1px;height:1px}' +
      '.lead-channel-option span{display:inline-block;padding:10px 16px;border:1px solid #cfc8bd;border-radius:10px;background:#fff;line-height:1.2}' +
      '.lead-channel-option input:checked+span{background:#2D5A4A;border-color:#2D5A4A;color:#fff}' +
      '.lead-channel-option input:focus-visible+span{outline:2px solid #2D5A4A;outline-offset:2px}';
    document.head.appendChild(st);
  }

  function showError(form, text) {
    var box = form.querySelector('.lead-error');
    box.textContent = text;
    box.hidden = false;
  }

  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var contactInput = form.querySelector('[name="contact"]');
    var messageInput = form.querySelector('[name="message"]');
    if (messageInput) {
      // Вопрос обязателен: заявки «без описания» чаще всего случайные
      messageInput.required = true;
      var optional = messageInput.parentNode.querySelector('small');
      if (optional) optional.remove();
      // Пример под тему страницы задан в HTML; общий вариант — только если его нет
      if (!messageInput.getAttribute('placeholder') || /без подробностей/.test(messageInput.placeholder)) {
        messageInput.placeholder = 'Например: хочу разобраться, что со мной происходит';
      }
    }
    // Способ связи: человек сам выбирает, как ему ответить (звонок или мессенджер).
    // Выбор добавляется ко всем формам, где такого поля ещё нет.
    var channelBox = null;
    if (!form.querySelector('[name="messenger"]')) {
      injectChannelStyles();
      channelBox = document.createElement('div');
      channelBox.className = 'lead-channel';
      channelBox.innerHTML = '<span class="lead-channel-title">Как вам удобнее получить ответ</span>' +
        '<div class="lead-channel-options" role="radiogroup">' +
        CHANNELS.map(function (c) {
          return '<label class="lead-channel-option"><input type="radio" name="messenger" value="' + c.value + '"><span>' + c.label + '</span></label>';
        }).join('') + '</div>';
      var anchor = contactInput.closest('label, .form-group') || contactInput;
      anchor.parentNode.insertBefore(channelBox, anchor);
      channelBox.addEventListener('change', function () {
        var c = channelOf(form);
        if (c) contactInput.placeholder = c.placeholder;
        contactInput.classList.remove('lead-invalid');
        form.querySelector('.lead-error').hidden = true;
      });
    }

    contactInput.addEventListener('input', function () {
      contactInput.classList.remove('lead-invalid');
      form.querySelector('.lead-error').hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('[type="submit"]');
      var field = function (name) {
        var els = form.querySelectorAll('[name="' + name + '"]');
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.type === 'radio' || el.type === 'checkbox') {
            if (el.checked) return el.value.trim();
          } else {
            return el.value.trim();
          }
        }
        return '';
      };

      var channel = channelOf(form);
      if (channelBox && !channel) {
        showError(form, 'Выберите, как вам удобнее получить ответ: звонок или мессенджер.');
        channelBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      if (!isValidContact(field('contact'))) {
        contactInput.classList.add('lead-invalid');
        contactInput.focus();
        showError(form, channel ? channel.error : 'Укажите телефон с кодом страны, @username в Telegram или e-mail — так я смогу ответить.');
        return;
      }

      if (channel && !channel.accepts(field('contact'))) {
        contactInput.classList.add('lead-invalid');
        contactInput.focus();
        showError(form, channel.error);
        return;
      }

      if (messageInput && field('message').length < 5) {
        messageInput.focus();
        showError(form, 'Напишите хотя бы пару слов, с чем хотите прийти — так я пойму, как вам лучше ответить.');
        return;
      }

      var source = form.getAttribute('data-lead-form');
      if (field('source')) source += ' · узнали: ' + field('source');
      var utm = window.pozitivUtm ? window.pozitivUtm() : '';
      if (utm) source += ' · реклама: ' + utm;
      var comment = field('message') || 'Без описания';
      if (field('messenger')) comment = 'Ответить: ' + field('messenger') + ' · ' + comment;

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
