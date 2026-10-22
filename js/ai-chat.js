/**
 * AI Chat Widget for pozitiv-psychology.ru
 * Фирменная хвойно-зеленая палитра Камилы Золотовой
 */
(function () {
  // 1. Фирменные стили под цветовую гамму сайта (глубокий хвойный зеленый)
  const styles = `
    .ai-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 62px;
      height: 62px;
      background: linear-gradient(135deg, #2d5242 0%, #1c362b 100%);
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(28, 54, 43, 0.45);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .ai-chat-btn:hover { transform: scale(1.08); }
    .ai-chat-btn svg { width: 30px; height: 30px; fill: #ffffff; }
    
    .ai-chat-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #4ade80;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    .ai-chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: aiChatFadeIn 0.3s ease;
      border: 1px solid #e2e8f0;
    }
    @keyframes aiChatFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .ai-chat-header {
      background: linear-gradient(135deg, #2d5242 0%, #1c362b 100%);
      color: #ffffff;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ai-chat-header-info { display: flex; align-items: center; gap: 12px; }
    .ai-chat-avatar { width: 44px; height: 44px; border-radius: 50%; background: #ffffff; padding: 2px; }
    .ai-chat-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .ai-chat-title { font-size: 15px; font-weight: 600; line-height: 1.2; letter-spacing: 0.2px; }
    .ai-chat-subtitle { font-size: 12px; opacity: 0.85; margin-top: 3px; color: #dcfce7; }
    .ai-chat-close { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 4px; line-height: 1; opacity: 0.8; }
    .ai-chat-close:hover { opacity: 1; }

    .ai-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8faf9;
    }

    .ai-msg {
      max-width: 82%;
      padding: 12px 14px;
      font-size: 14px;
      line-height: 1.45;
      border-radius: 14px;
      word-break: break-word;
    }
    .ai-msg-bot {
      background: #ffffff;
      color: #1f2937;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
    }
    .ai-msg-user {
      background: #2d5242;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(45, 82, 66, 0.2);
    }

    .ai-chat-chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 10px 16px;
      background: #f0f4f1;
      scrollbar-width: none;
      border-top: 1px solid #e2e8f0;
    }
    .ai-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      color: #2d5242;
      font-weight: 500;
      transition: all 0.2s;
    }
    .ai-chip:hover { background: #2d5242; color: #fff; border-color: #2d5242; }

    .ai-chat-input-area {
      padding: 12px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .ai-chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .ai-chat-input:focus { border-color: #2d5242; }
    .ai-chat-send {
      background: #2d5242;
      border: none;
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    .ai-chat-send:hover { background: #1c362b; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // 2. HTML разметка виджета
  const widgetHtml = `
    <div class="ai-chat-btn" id="aiChatOpenBtn" title="Задать вопрос психологу">
      <span class="ai-chat-badge"></span>
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>

    <div class="ai-chat-window" id="aiChatWindow">
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="ai-chat-avatar">
            <img src="/images/kamila-18.webp" onerror="this.src='/images/kamila.jpg'" alt="Камила">
          </div>
          <div>
            <div class="ai-chat-title">Камила Золотова</div>
            <div class="ai-chat-subtitle">ИИ-ассистент / онлайн</div>
          </div>
        </div>
        <button class="ai-chat-close" id="aiChatCloseBtn">&times;</button>
      </div>

      <div class="ai-chat-messages" id="aiChatMessages">
        <div class="ai-msg ai-msg-bot">
          Здравствуйте! Я виртуальный ассистент психолога Камилы Золотовой. Помогу сориентироваться в методах (КПТ, EMDR) или записаться на первичную 20-минутную встречу. Чем могу помочь?
        </div>
      </div>

      <div class="ai-chat-chips">
        <button class="ai-chip" data-text="Как проходит первичная 20-минутная встреча?">Первичная встреча</button>
        <button class="ai-chip" data-text="Как вы работаете с тревогой и паническими атаками?">Тревога и стресс</button>
        <button class="ai-chip" data-text="Расскажите про метод EMDR (ДПДГ)">Метод EMDR</button>
        <button class="ai-chip" data-text="Хочу записаться на консультацию">Записаться</button>
      </div>

      <form class="ai-chat-input-area" id="aiChatForm">
        <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Напишите вопрос или телефон..." required autocomplete="off">
        <button type="submit" class="ai-chat-send" id="aiChatSendBtn">
          <svg style="width:16px;height:16px;fill:#fff;" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = widgetHtml;
  document.body.appendChild(container);

  // 3. Логика работы диалога
  const openBtn = document.getElementById('aiChatOpenBtn');
  const closeBtn = document.getElementById('aiChatCloseBtn');
  const windowEl = document.getElementById('aiChatWindow');
  const formEl = document.getElementById('aiChatForm');
  const inputEl = document.getElementById('aiChatInput');
  const msgContainer = document.getElementById('aiChatMessages');
  const chips = document.querySelectorAll('.ai-chip');

  let history = [];

  openBtn.addEventListener('click', () => { windowEl.style.display = 'flex'; inputEl.focus(); });
  closeBtn.addEventListener('click', () => { windowEl.style.display = 'none'; });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      inputEl.value = chip.getAttribute('data-text');
      formEl.dispatchEvent(new Event('submit'));
    });
  });

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    inputEl.value = '';

    const typingIndicator = appendMessage('Печатает...', 'bot');

    try {
      const isLead = /(\+7|8)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/.test(text) || text.includes('@');

      let payload = {
        message: text,
        history: history
      };

      if (isLead) {
        payload = {
          type: 'lead',
          name: 'Посетитель сайта',
          phone: text,
          comment: 'Заявка оставлена в чате'
        };
      }

      const res = await fetch('/api/chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      typingIndicator.remove();

      let reply = data.reply || (data.success ? 'Спасибо! Ваши контакты переданы Камиле. Она свяжется с вами в ближайшее время!' : 'Ответ получен');
      appendMessage(reply, 'bot');

      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });

    } catch (err) {
      typingIndicator.remove();
      appendMessage('Не удалось соединиться с сервером. Вы всегда можете написать Камиле напрямую в Telegram: @Kamila_Zolotova', 'bot');
    }
  });

  function appendMessage(text, sender) {
    const el = document.createElement('div');
    el.className = `ai-msg ai-msg-${sender}`;
    el.textContent = text;
    msgContainer.appendChild(el);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return el;
  }
})();