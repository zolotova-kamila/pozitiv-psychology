(function(){var menuToggle=document.getElementById('menuToggle');var navLinks=document.querySelector('.nav-links');if(!menuToggle||!navLinks)return;menuToggle.addEventListener('click',function(){menuToggle.classList.toggle('active');navLinks.classList.toggle('mobile-open');});document.querySelectorAll('.nav-links a').forEach(function(link){link.addEventListener('click',function(){menuToggle.classList.remove('active');navLinks.classList.remove('mobile-open');});});})();

// Глобальная функция открытия бота (срабатывает мгновенно из любого места сайта)
window.psyOpenChat = function() {
  var box = document.getElementById('psy-chat-box');
  if (box) {
    box.style.display = 'flex';
    var badge = document.getElementById('psy-chat-badge');
    if (badge) badge.style.display = 'none';
  } else {
    // Если виджет еще в процессе сетевой подгрузки, дожидаемся появления
    var timer = setInterval(function() {
      var b = document.getElementById('psy-chat-box');
      if (b) {
        b.style.display = 'flex';
        var bg = document.getElementById('psy-chat-badge');
        if (bg) bg.style.display = 'none';
        clearInterval(timer);
      }
    }, 50);
  }
};

// Загрузка виджета чат-бота на всех страницах
(function() {
  if (document.getElementById('psy-chat-widget') || document.getElementById('psy-chat-container')) return;

  fetch('/api/chat.php')
    .then(function(res) { return res.text(); })
    .then(function(html) {
      var container = document.createElement('div');
      container.id = 'psy-chat-container';
      container.innerHTML = html;
      document.body.appendChild(container);

      var scripts = container.querySelectorAll('script');
      scripts.forEach(function(oldScript) {
        var newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        oldScript.remove();
      });
    })
    .catch(function(err) {
      console.error('Ошибка загрузки виджета чата:', err);
    });
})();