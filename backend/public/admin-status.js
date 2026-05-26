(function () {
  'use strict';

  const STORAGE_KEY = 'liva_admin_token';
  let token = localStorage.getItem(STORAGE_KEY);

  document.addEventListener('DOMContentLoaded', function () {
    const tokenInput = document.getElementById('token');
    const loginBtn = document.getElementById('login-btn');
    const authDiv = document.getElementById('auth');
    const contentDiv = document.getElementById('content');
    const tsDiv = document.getElementById('ts');

    function applyToken(v) {
      token = v;
      localStorage.setItem(STORAGE_KEY, v);
      authDiv.style.display = 'none';
      contentDiv.style.display = 'block';
      load();
      setInterval(load, 15000);
    }

    loginBtn.addEventListener('click', function () {
      const v = tokenInput.value.trim();
      if (v) applyToken(v);
    });
    tokenInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        const v = tokenInput.value.trim();
        if (v) applyToken(v);
      }
    });

    if (!token) {
      authDiv.style.display = 'block';
      tsDiv.textContent = 'нужен ADMIN_TOKEN';
      tokenInput.focus();
    } else {
      contentDiv.style.display = 'block';
      load();
      setInterval(load, 15000);
    }

    function fmt(n) {
      return (n == null ? 0 : n).toLocaleString('ru-RU');
    }
    function pillHealth(ok) {
      return '<span class="pill ' + (ok ? 'ok' : 'err') + '">' + (ok ? 'up' : 'down') + '</span>';
    }

    async function load() {
      document.body.classList.add('loading');
      try {
        const r = await fetch('/api/admin/status', { headers: { 'X-Admin-Token': token } });
        if (r.status === 403) {
          localStorage.removeItem(STORAGE_KEY);
          location.reload();
          return;
        }
        const d = await r.json();

        tsDiv.textContent = 'обновляется каждые 15 сек · env ' + d.health.env;
        document.getElementById('updated').textContent = 'обновлено ' + new Date(d.timestamp).toLocaleTimeString('ru-RU');

        document.getElementById('salons-total').textContent = fmt(d.salons.total);
        document.getElementById('salons-active').textContent = fmt(d.salons.active);
        document.getElementById('salons-new24h').textContent = '+' + fmt(d.salons.new24h);

        document.getElementById('users-total').textContent = fmt(d.users.total);
        document.getElementById('users-active7d').textContent = fmt(d.users.activeLast7d);

        document.getElementById('ch-telegram').textContent = fmt(d.channels.telegram);
        document.getElementById('ch-max').textContent = fmt(d.channels.max);
        document.getElementById('ch-avito').textContent = fmt(d.channels.avito);
        document.getElementById('ch-yclients').textContent = fmt(d.channels.yclients);

        document.getElementById('clients-total').textContent = fmt(d.clients.total);
        document.getElementById('clients-new24h').textContent = '+' + fmt(d.clients.new24h);

        document.getElementById('appts-total').textContent = fmt(d.appointments.total);
        document.getElementById('appts-24h').textContent = '+' + fmt(d.appointments.last24h);
        document.getElementById('appts-status').innerHTML = d.appointments.byStatus
          .map(function (s) { return '<div class="row"><span>' + s.status + '</span><span>' + fmt(s.count) + '</span></div>'; })
          .join('');

        document.getElementById('msgs-24h').textContent = fmt(d.messages24h.total);
        document.getElementById('msgs-channels').innerHTML = d.messages24h.byChannel
          .map(function (c) { return '<div class="row"><span>' + c.channel + '</span><span>' + fmt(c.count) + '</span></div>'; })
          .join('');

        const t = d.llm.last24h.tokens;
        document.getElementById('llm-in').textContent = fmt(t.inputTokens);
        document.getElementById('llm-out').textContent = fmt(t.outputTokens);
        document.getElementById('llm-cache-read').textContent = fmt(t.cacheReadTokens);
        document.getElementById('llm-cache-create').textContent = fmt(t.cacheCreateTokens);
        document.getElementById('llm-cost').textContent = '$' + d.llm.last24h.estimatedCostUsd.toFixed(4);
        document.getElementById('llm-cache-hit').textContent = (d.llm.last24h.cacheHitRate * 100).toFixed(1) + '%';
        document.getElementById('llm-cost-total').textContent = '$' + d.llm.total.estimatedCostUsd.toFixed(2);
        document.getElementById('llm-cache-hit-total').textContent = (d.llm.total.cacheHitRate * 100).toFixed(1) + '%';

        const q = d.remindersQueue;
        if (!q.error) {
          document.getElementById('q-waiting').textContent = fmt(q.waiting);
          document.getElementById('q-active').textContent = fmt(q.active);
          document.getElementById('q-delayed').textContent = fmt(q.delayed);
          document.getElementById('q-failed').textContent = fmt(q.failed);
        }

        document.getElementById('h-pg').innerHTML = pillHealth(d.health.postgres === 'up');
        document.getElementById('h-redis').innerHTML = pillHealth(d.health.redis === 'up');
        document.getElementById('h-env').textContent = d.health.env;

        const sr = await fetch('/api/admin/salons?limit=20', { headers: { 'X-Admin-Token': token } });
        const salons = await sr.json();
        const rows = salons.map(function (s) {
          return '<tr>' +
            '<td>' + new Date(s.createdAt).toLocaleDateString('ru-RU') + '</td>' +
            '<td><strong>' + s.name + '</strong>' + (s.isActive ? '' : ' <span class="pill err">off</span>') + '</td>' +
            '<td>' + s.niche + '</td>' +
            '<td>' + (s.channels.telegram ? 'TG ' : '') + (s.channels.yclients ? 'YC' : '') + '</td>' +
            '<td>' + fmt(s.counts.clients) + '</td>' +
            '<td>' + fmt(s.counts.appointments) + '</td>' +
            '<td>' + fmt(s.counts.messages) + '</td>' +
            '</tr>';
        }).join('');
        document.querySelector('#salons-table tbody').innerHTML = rows;
      } catch (e) {
        tsDiv.textContent = 'ошибка: ' + e.message;
      } finally {
        document.body.classList.remove('loading');
      }
    }
  });
})();
