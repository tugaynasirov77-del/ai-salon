(function () {
  'use strict';

  // Определяем salonId и API origin из тега <script>
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var src = currentScript ? currentScript.src : '';
  var url = new URL(src, window.location.href);
  var salonId = url.searchParams.get('salon');
  var apiBase = url.origin;
  if (!salonId) {
    console.error('[ailiva-widget] параметр ?salon=ID обязателен в src');
    return;
  }

  var STORAGE_KEY = 'ailiva_session_' + salonId;
  var sessionId = localStorage.getItem(STORAGE_KEY) || '';
  var config = { name: 'AI-администратор', greeting: 'Здравствуйте!', color: '#7C3AED' };

  // ───── Стили ─────
  var css = '' +
    '.ailiva-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:var(--ailiva-color);box-shadow:0 4px 16px rgba(0,0,0,.2);cursor:pointer;z-index:99999;display:flex;align-items:center;justify-content:center;color:#fff;border:none;transition:transform .2s}' +
    '.ailiva-btn:hover{transform:scale(1.08)}' +
    '.ailiva-btn svg{width:28px;height:28px}' +
    '.ailiva-panel{position:fixed;bottom:90px;right:20px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.18);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.ailiva-panel.open{display:flex}' +
    '.ailiva-header{background:var(--ailiva-color);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}' +
    '.ailiva-header h3{margin:0;font-size:15px;font-weight:600}' +
    '.ailiva-header small{display:block;font-size:11px;opacity:.85;margin-top:2px}' +
    '.ailiva-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0;line-height:1;opacity:.8}' +
    '.ailiva-close:hover{opacity:1}' +
    '.ailiva-msgs{flex:1;overflow-y:auto;padding:14px;background:#f7f7f9;display:flex;flex-direction:column;gap:8px}' +
    '.ailiva-msg{max-width:80%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.4;word-wrap:break-word;white-space:pre-wrap}' +
    '.ailiva-msg.in{background:#fff;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.05)}' +
    '.ailiva-msg.out{background:var(--ailiva-color);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.ailiva-typing{align-self:flex-start;padding:9px 13px;font-size:13px;color:#888}' +
    '.ailiva-form{display:flex;padding:10px;border-top:1px solid #eee;background:#fff;gap:6px}' +
    '.ailiva-input{flex:1;border:1px solid #ddd;border-radius:20px;padding:9px 14px;font-size:14px;outline:none;font-family:inherit}' +
    '.ailiva-input:focus{border-color:var(--ailiva-color)}' +
    '.ailiva-send{background:var(--ailiva-color);border:none;color:#fff;border-radius:50%;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.ailiva-send:disabled{opacity:.5;cursor:not-allowed}' +
    '.ailiva-send svg{width:18px;height:18px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ───── DOM ─────
  var btn = document.createElement('button');
  btn.className = 'ailiva-btn';
  btn.setAttribute('aria-label', 'Открыть чат');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'ailiva-panel';
  panel.innerHTML =
    '<div class="ailiva-header">' +
    '<div><h3 class="ailiva-title">AI-администратор</h3><small>обычно отвечает за секунды</small></div>' +
    '<button class="ailiva-close" aria-label="Закрыть">×</button>' +
    '</div>' +
    '<div class="ailiva-msgs"></div>' +
    '<form class="ailiva-form">' +
    '<input class="ailiva-input" type="text" placeholder="Напишите сообщение..." autocomplete="off" maxlength="1000" />' +
    '<button class="ailiva-send" type="submit" aria-label="Отправить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
    '</form>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgsEl = panel.querySelector('.ailiva-msgs');
  var formEl = panel.querySelector('.ailiva-form');
  var inputEl = panel.querySelector('.ailiva-input');
  var sendBtn = panel.querySelector('.ailiva-send');
  var titleEl = panel.querySelector('.ailiva-title');
  var closeBtn = panel.querySelector('.ailiva-close');

  function applyColor(color) {
    document.documentElement.style.setProperty('--ailiva-color', color);
  }
  applyColor(config.color);

  // ───── State ─────
  function addMsg(text, direction) {
    var div = document.createElement('div');
    div.className = 'ailiva-msg ' + direction;
    div.textContent = text;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }
  function showTyping() {
    var div = document.createElement('div');
    div.className = 'ailiva-typing';
    div.id = 'ailiva-typing';
    div.textContent = 'печатает...';
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById('ailiva-typing');
    if (t) t.remove();
  }

  // ───── API ─────
  function loadConfig() {
    return fetch(apiBase + '/api/widget/' + salonId + '/config')
      .then(function (r) { return r.json(); })
      .then(function (c) {
        if (c && c.name) {
          config = Object.assign(config, c);
          titleEl.textContent = c.name;
          applyColor(c.color || '#7C3AED');
        }
      })
      .catch(function (e) { console.warn('[ailiva-widget] config load fail', e); });
  }

  function loadHistory() {
    if (!sessionId) return Promise.resolve();
    return fetch(apiBase + '/api/widget/' + salonId + '/history?sessionId=' + encodeURIComponent(sessionId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var msgs = (data && data.messages) || [];
        if (msgs.length === 0) {
          addMsg(config.greeting, 'in');
        } else {
          msgs.forEach(function (m) { addMsg(m.text, m.direction === 'in' ? 'out' : 'in'); });
        }
      });
  }

  function sendMessage(text) {
    addMsg(text, 'out');
    inputEl.value = '';
    sendBtn.disabled = true;
    showTyping();
    var body = { text: text };
    if (sessionId) body.sessionId = sessionId;
    return fetch(apiBase + '/api/widget/' + salonId + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data && data.sessionId && !sessionId) {
          sessionId = data.sessionId;
          localStorage.setItem(STORAGE_KEY, sessionId);
        }
        addMsg(data.reply || '(пустой ответ)', 'in');
      })
      .catch(function (e) {
        hideTyping();
        addMsg('Ошибка соединения. Попробуйте позже.', 'in');
        console.error(e);
      })
      .finally(function () {
        sendBtn.disabled = false;
        inputEl.focus();
      });
  }

  // ───── Events ─────
  var loaded = false;
  btn.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !loaded) {
      loaded = true;
      loadConfig().then(loadHistory);
      setTimeout(function () { inputEl.focus(); }, 100);
    }
  });
  closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });
  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;
    sendMessage(text);
  });
})();
