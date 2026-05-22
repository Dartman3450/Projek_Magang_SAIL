function _isEspAlive(key) {
  const t = _espLastSeen[key];
  if (!t) return false;
  return (Date.now() - new Date(t).getTime()) < ESP_TIMEOUT_MS;
}

function updateEspBadge() {
  const wrap = document.getElementById('esp-badge');
  if (!wrap) return;

  const states = _ESP_DEFS.map(e => ({ ...e, alive: _isEspAlive(e.key) }));
  const connCount = states.filter(e => e.alive).length;
  const total     = states.length;

  // Warna badge keseluruhan
  let badgeClass = 'esp-badge';
  if (connCount === total)      badgeClass += ' connected';
  else if (connCount === 0)     badgeClass += ' waiting';
  else                          badgeClass += ' partial';

  const summaryText = 'ESP Status';

  wrap.className = badgeClass;
  wrap.onclick   = toggleEspPopup;
  wrap.style.cursor = 'pointer';
  wrap.style.userSelect = 'none';

  wrap.innerHTML = `
    <div class="esp-dot"></div>
    <span id="esp-label">${summaryText}</span>
    <span style="font-size:9px;margin-left:3px;color:inherit;opacity:.7">▾</span>
  `;
}

function toggleEspPopup() {
  let popup = document.getElementById('esp-popup');
  if (popup) { popup.remove(); return; }

  const wrap  = document.getElementById('esp-badge');
  const rect  = wrap.getBoundingClientRect();
  const states = _ESP_DEFS.map(e => ({ ...e, alive: _isEspAlive(e.key) }));

  popup = document.createElement('div');
  popup.id = 'esp-popup';
  popup.style.cssText = `
    position:fixed;
    top:${rect.bottom + 8}px;
    right:${window.innerWidth - rect.right}px;
    background:#fff;
    border:1px solid #e2e8f0;
    border-radius:12px;
    box-shadow:0 8px 24px rgba(0,0,0,.12);
    padding:10px 4px;
    z-index:9999;
    min-width:210px;
    font-family:inherit;
  `;

  popup.innerHTML = `
    <div style="padding:4px 14px 8px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
      ESP Status
    </div>
    ${states.map(e => {
      const alive   = e.alive;
      const dotClr  = alive ? '#22c55e' : '#f59e0b';
      const dotShadow = alive ? '0 0 6px rgba(34,197,94,.6)' : 'none';
      // Tampilkan waktu terakhir yang pernah diterima (bisa non-numeric)
      const lastTs  = (typeof _espLastReceived !== 'undefined' && _espLastReceived?.[e.key]) || (typeof _espLastSeen !== 'undefined' && _espLastSeen?.[e.key]) || null;
      const lastStr = lastTs
        ? new Date(lastTs).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
        : '—';
      const statusTxt = alive ? 'Connected' : (lastTs ? 'No Data' : 'No Data');
      const statusClr = alive ? '#16a34a' : (lastTs ? '#b45309' : '#b45309');
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:7px 14px;border-radius:8px;transition:.15s;"
          onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <div style="width:9px;height:9px;border-radius:50%;background:${dotClr};box-shadow:${dotShadow};flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;color:#1e293b;">${e.label}</div>
            <div style="font-size:10px;color:#94a3b8;">Last: ${lastStr}</div>
          </div>
          <div style="font-size:11px;font-weight:700;color:${statusClr};">${statusTxt}</div>
        </div>`;
    }).join('')}
  `;

  document.body.appendChild(popup);

  // Tutup kalau klik di luar
  setTimeout(() => {
    document.addEventListener('click', function _close(ev) {
      if (!popup.contains(ev.target) && ev.target.id !== 'esp-badge' && !document.getElementById('esp-badge')?.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 50);
}
window.toggleEspPopup = toggleEspPopup;

// Legacy — masih dipanggil kalau ada kode lain
function setEspStatus(state) {
  updateEspBadge();
}

// ══ IOT RENDER ═════════════════════════════════════
function renderIoT(content) {
  content.innerHTML = getIoTHTML();
  initWidgets();
  renderTankCards();
  fetchSummary();
  setTimeout(updateDashWidgets, 200);
  // Fetch water quality setelah DOM siap
  setTimeout(fetchWaterQuality, 500);
  // Clear any existing poll before setting new one
  if (window._poll)   { clearInterval(window._poll);   window._poll   = null; }
  if (window._wqPoll) { clearInterval(window._wqPoll); window._wqPoll = null; }
  // Robust polling: setiap 5 detik, selalu fetch ulang
  window._poll = setInterval(() => {
    if (!document.getElementById('wl-tanks-container')) {
      clearInterval(window._poll);
      window._poll = null;
      return;
    }
    fetchSummary();
  }, 5000);
  // Water quality refresh setiap 5 menit
  window._wqPoll = setInterval(() => {
    if (!document.getElementById('wq-tw2-tds')) {
      clearInterval(window._wqPoll);
      window._wqPoll = null;
      return;
    }
    fetchWaterQuality();
  }, 5 * 60 * 1000);
}

function getIoTHTML() {
  const ov = `
    <div class="esp-waiting-overlay show" id="ov-ID">
      <div class="esp-wait-icon">🔌</div>
      <div class="esp-wait-txt">Waiting for ESP<span class="dots"></span></div>
      <div class="esp-wait-sub">Belum ada data masuk</div>
    </div>`;

  return `
  <div class="sensor-grid">

    <!-- TANGKI AIR — DYNAMIC MULTI SENSOR -->
    <div class="s-card" style="--acc:var(--blue);grid-column:1/-1">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-wl')}
      <div class="s-label">Water Level</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div class="s-pill st-wait" id="wl-status" style="margin:0">—</div>
        <button class="s-detail-btn" style="position:static" onclick="openDetail('water-level')">Detail ↗</button>
      </div>
      <!-- tanks rendered dynamically by renderTankCards() -->
      <div id="wl-tanks-container"></div>
      <div id="wl-sensor-status-list" style="margin-top:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:8px 10px"></div>
      <!-- volume summary -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:1px">TOTAL VOLUME</span>
          <span style="font-size:9px;color:var(--txt3)" id="wl-time">—</span>
        </div>
        <div id="wl-vol-rows" style="display:flex;flex-direction:column;gap:3px"></div>
        <div style="display:flex;justify-content:flex-end;margin-top:4px">
          <button onclick="loadPage('tank-dimension-setting')" style="font-size:9px;padding:2px 10px;background:#ebf2fd;border:1px solid #c3d9fa;border-radius:5px;color:var(--blue);font-weight:600;cursor:pointer;font-family:inherit">⚙ Kelola Sensor</button>
        </div>
      </div>
    </div>

    
    <!-- Widget Filter water -->
    <div class="d-widget" style="--wacc:var(--blue)">
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Air Feed Slurry</div>
      <div style="display:flex;justify-content:center;align-items:center;height:120px">
        <div style="position:relative;width:100px;height:100px">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--blue)" stroke-width="10"
              stroke-dasharray="238.8" stroke-dashoffset="238.8" transform="rotate(-90,50,50)"
              style="transition:stroke-dashoffset 1s ease;stroke-linecap:round" id="gauge1-arc"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:var(--blue)" id="gauge1-val">—</div>
            <div style="font-size:8px;color:var(--txt3)">unit</div>
          </div>
        </div>
      </div>
      <div id="wf-sensor-status-list" style="margin-top:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:7px 9px"></div>
    </div>

    <!-- Widget Slurry Water -->
    <div class="d-widget" style="--wacc:var(--purple)">\
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Air EDI</div>
      <div style="display:flex;justify-content:center;align-items:center;height:120px">
        <div style="position:relative;width:100px;height:100px">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--purple)" stroke-width="10"
              stroke-dasharray="238.8" stroke-dashoffset="238.8" transform="rotate(-90,50,50)"
              style="transition:stroke-dashoffset 1s ease;stroke-linecap:round" id="gauge2-arc"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:var(--purple)" id="gauge2-val">—</div>
            <div style="font-size:8px;color:var(--txt3)">unit</div>
          </div>
        </div>
      </div>
      <div id="env-sensor-status-list" style="margin-top:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:7px 9px"></div>
    </div>

    <!-- Widget Air Steam Generator -->
    <div class="d-widget" style="--wacc:var(--green)">
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Air Steam Generator</div>
      <div style="display:flex;justify-content:center;align-items:center;height:120px">
        <div style="position:relative;width:100px;height:100px">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--green)" stroke-width="10"
              stroke-dasharray="238.8" stroke-dashoffset="238.8" transform="rotate(-90,50,50)"
              style="transition:stroke-dashoffset 1s ease;stroke-linecap:round" id="gauge3-arc"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:var(--green)" id="gauge3-val">—</div>
            <div style="font-size:8px;color:var(--txt3)">unit</div>
          </div>
        </div>
      </div>
    </div>

  </div>
  </div>
  <!-- ══ TREAT WATER 2 — full width ══ -->
  <div class="s-card" style="--acc:#8b5cf6;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('treatwater2')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#8b5cf6">TREAT WATER 2</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">


      <!-- TANK Aroma -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">TANK Aroma</div>
        <div id="tank-body-tanu_edi" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-tanu_edi" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-tanu_edi" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-tanu_edi" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">7.200lt / 10.000lt</div>
        <div id="tank-cm-tanu_edi" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-tanu_edi" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-tanu_edi" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- FEED Aroma -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">FEED Aroma</div>
        <div id="tank-body-feed_edi" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-feed_edi" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-feed_edi" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_edi" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">5.800lt / 10.000lt</div>
        <div id="tank-cm-feed_edi" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-feed_edi" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-feed_edi" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#7c3aed">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#5b21b6;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-tds">—</span>
            <span style="font-size:9px;color:#c4b5fd;font-weight:600">ppm</span>
          </div>
          <div style="margin-top:8px;background:#ddd6fe;border-radius:99px;height:3px">
            <div style="width:16%;background:#8b5cf6;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#4f46e5">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#3730a3;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-hardness">—</span>
            <span style="font-size:9px;color:#a5b4fc;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#c7d2fe;border-radius:99px;height:3px">
            <div style="width:18%;background:#6366f1;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#ca8a04">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#a16207;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-ph">—</span>
          </div>
          <div style="margin-top:8px;background:#fef9c3;border-radius:99px;height:3px">
            <div style="width:50%;background:#eab308;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#059669">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#065f46;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-alkaline">—</span>
            <span style="font-size:9px;color:#6ee7b7;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#a7f3d0;border-radius:99px;height:3px">
            <div style="width:48%;background:#10b981;border-radius:99px;height:3px"></div>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Normal</span>
      <span style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
    <div id="tw1-sensor-status-list" style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px"></div>
  </div>

  <!-- ══ TREAT WATER 1 — full width ══ -->
  <div class="s-card" style="--acc:#6366f1;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('treatwater1')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#6366f1">TREAT WATER 1</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">


      <!-- SLURY 1 -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">SLURY 1</div>
        <div id="tank-body-slury_1" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-slury_1" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-slury_1" style="font-size:24px;font-weight:900;color:#ffffff;text-shadow:none;letter-spacing:0.5px;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeSpeed;line-height:1;-webkit-text-stroke:0.3px rgba(255,255,255,0.3)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-slury_1" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">6.000lt / 10.000lt</div>
        <div id="tank-cm-slury_1" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-slury_1" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-slury_1" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- SLURY 2 -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">SLURY 2</div>
        <div id="tank-body-slury_2" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-slury_2" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-slury_2" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-slury_2" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">5.500lt / 10.000lt</div>
        <div id="tank-cm-slury_2" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-slury_2" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-slury_2" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- FEED SLURY -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">FEED SLURY</div>
        <div id="tank-body-feed_slury" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-feed_slury" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-feed_slury" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_slury" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">7.000lt / 10.000lt</div>
        <div id="tank-cm-feed_slury" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-feed_slury" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-feed_slury" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#4f46e5">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#3730a3;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-tds">—</span>
            <span style="font-size:9px;color:#a5b4fc;font-weight:600">ppm</span>
          </div>
          <div style="margin-top:8px;background:#c7d2fe;border-radius:99px;height:3px">
            <div style="width:28%;background:#6366f1;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#7c3aed">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#5b21b6;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-hardness">—</span>
            <span style="font-size:9px;color:#c4b5fd;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#ddd6fe;border-radius:99px;height:3px">
            <div style="width:42%;background:#8b5cf6;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#ca8a04">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#a16207;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-ph">—</span>
          </div>
          <div style="margin-top:8px;background:#fef9c3;border-radius:99px;height:3px">
            <div style="width:53%;background:#eab308;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#059669">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#065f46;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-alkaline">—</span>
            <span style="font-size:9px;color:#6ee7b7;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#a7f3d0;border-radius:99px;height:3px">
            <div style="width:60%;background:#10b981;border-radius:99px;height:3px"></div>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Normal</span>
      <span style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
    <div id="tw2-sensor-status-list" style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px"></div>
  </div>

  <!-- ══ FILTER WATER — full width ══ -->
  <div class="s-card" style="--acc:#0ea5e9;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('filterwater')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#0ea5e9">FILTER WATER</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- AIR PROSES (s1=air_proses) -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">AIR PROSES</div>
        <div id="tank-body-air_proses" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-air_proses" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-air_proses" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4)">—%</span>
            <span id="tank-cm-air_proses" style="font-size:9px;color:rgba(255,255,255,.75)">— cm air</span>
          </div>
          <div id="tank-offline-air_proses" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-air_proses" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">— lt</div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-air_proses" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- FLOW vertikal -->
      <div style="display:flex;align-items:center;justify-content:center">
        <div style="writing-mode:vertical-rl;text-orientation:mixed;font-size:8px;font-weight:800;letter-spacing:2px;color:#0369a1;background:#e0f2fe;border:1px solid #7dd3fc;border-radius:6px;padding:10px 6px;transform:rotate(180deg)">FLOW</div>
      </div>

      <!-- GROUND TANK A (s9 — belum aktif) -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#0284c7">GROUND TANK A</div>
        <div id="tank-body-ground_tank_a" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #7dd3fc;border-radius:10px;overflow:hidden;background:#e0f2fe">
          <div id="tank-water-ground_tank_a" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#38bdf8,#0284c7);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-ground_tank_a" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4)">—%</span>
            <span id="tank-cm-ground_tank_a" style="font-size:9px;color:rgba(255,255,255,.75)">— cm air</span>
          </div>
          <div id="tank-offline-ground_tank_a" style="display:flex;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.35);color:#fff;font-size:9px;padding:2px 10px;border-radius:99px">Sensor belum aktif</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-ground_tank_a" style="font-size:9px;color:#0369a1;font-weight:600;text-align:center">— lt</div>
        <div style="width:100%;background:#bae6fd;border-radius:99px;height:5px">
          <div id="tank-bar-ground_tank_a" style="width:0%;background:#0ea5e9;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#0284c7">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#0369a1;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-tds">—</span>
            <span style="font-size:9px;color:#7dd3fc;font-weight:600">ppm</span>
          </div>
          <div style="margin-top:8px;background:#e0f2fe;border-radius:99px;height:3px">
            <div style="width:24%;background:#0ea5e9;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#16a34a">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#15803d;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-hardness">—</span>
            <span style="font-size:9px;color:#86efac;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#dcfce7;border-radius:99px;height:3px">
            <div style="width:38%;background:#22c55e;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#ca8a04">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#a16207;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-ph">—</span>
          </div>
          <div style="margin-top:8px;background:#fef9c3;border-radius:99px;height:3px">
            <div style="width:51%;background:#eab308;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#059669">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#065f46;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-alkaline">—</span>
            <span style="font-size:9px;color:#6ee7b7;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#a7f3d0;border-radius:99px;height:3px">
            <div style="width:58%;background:#10b981;border-radius:99px;height:3px"></div>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Normal</span>
      <span style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
    <div id="filter-sensor-status-list" style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px"></div>
  </div>

  <!-- ══ Chiller in & out ══ -->
  <div class="s-card" style="--acc:#0ea5e9;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('filterwater')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#0ea5e9">Chiller in & out</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- Chiller in (s3=tanu_edi) — Key: s3, 1m×0.8m×1.22m, 976 L -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">Chiller in</div>
        <div id="tank-body-tanu_edi" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-tanu_edi" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-tanu_edi" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4)">—%</span>
            <span id="tank-cm-tanu_edi" style="font-size:9px;color:rgba(255,255,255,.75)">— cm air</span>
          </div>
          <div id="tank-offline-tanu_edi" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-tanu_edi" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">— / 976 lt</div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-tanu_edi" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- FLOW vertikal -->
      <div style="display:flex;align-items:center;justify-content:center">
        <div style="writing-mode:vertical-rl;text-orientation:mixed;font-size:8px;font-weight:800;letter-spacing:2px;color:#0369a1;background:#e0f2fe;border:1px solid #7dd3fc;border-radius:6px;padding:10px 6px;transform:rotate(180deg)">Chiller</div>
      </div>

      <!-- Chiller out (s4=feed_edi) — Key: s4, 1m×0.8m×1.22m, 976 L, Zero: 0cm -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#0284c7">Chiller out</div>
        <div id="tank-body-feed_edi" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #7dd3fc;border-radius:10px;overflow:hidden;background:#e0f2fe">
          <div id="tank-water-feed_edi" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#38bdf8,#0284c7);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-feed_edi" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4)">—%</span>
            <span id="tank-cm-feed_edi" style="font-size:9px;color:rgba(255,255,255,.75)">— cm air</span>
          </div>
          <div id="tank-offline-feed_edi" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_edi" style="font-size:9px;color:#0369a1;font-weight:600;text-align:center">— / 976 lt</div>
        <div style="width:100%;background:#bae6fd;border-radius:99px;height:5px">
          <div id="tank-bar-feed_edi" style="width:0%;background:#0ea5e9;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#0284c7">Condition 1</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#0369a1;font-family:'Cascadia Code','Consolas',monospace">72</span>
            <span style="font-size:9px;color:#7dd3fc;font-weight:600">ppm</span>
          </div>
          <div style="margin-top:8px;background:#e0f2fe;border-radius:99px;height:3px">
            <div style="width:24%;background:#0ea5e9;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#16a34a">Condition 2</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#15803d;font-family:'Cascadia Code','Consolas',monospace">38</span>
            <span style="font-size:9px;color:#86efac;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#dcfce7;border-radius:99px;height:3px">
            <div style="width:38%;background:#22c55e;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#ca8a04">Condition 3</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#a16207;font-family:'Cascadia Code','Consolas',monospace">7.2</span>
          </div>
          <div style="margin-top:8px;background:#fef9c3;border-radius:99px;height:3px">
            <div style="width:51%;background:#eab308;border-radius:99px;height:3px"></div>
          </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#059669">Condition 4</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:22px;font-weight:800;color:#065f46;font-family:'Cascadia Code','Consolas',monospace">115</span>
            <span style="font-size:9px;color:#6ee7b7;font-weight:600">mg/L</span>
          </div>
          <div style="margin-top:8px;background:#a7f3d0;border-radius:99px;height:3px">
            <div style="width:58%;background:#10b981;border-radius:99px;height:3px"></div>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Normal</span>
      <span style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
  </div>

  <!-- ══ WWTP / LIMBAH — full width ══ -->
  <div class="s-card" style="--acc:#16a34a;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('wwtp')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#16a34a">WWTP / LIMBAH</div>
    <div style="display:grid;grid-template-columns:1fr auto 180px 180px;grid-template-rows:1fr 1fr;gap:8px;margin-top:12px;align-items:stretch">

      <!-- GROUND TANK B — span 2 baris di kolom 1 -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;grid-row:span 2">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">GROUND TANK B</div>
        <div id="tank-body-ground_tank_b" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-ground_tank_b" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-ground_tank_b" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-ground_tank_b" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">65.000lt / 73.000lt</div>
        <div id="tank-cm-ground_tank_b" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-ground_tank_b" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-ground_tank_b" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- SEPARATOR — span 2 baris di kolom 2 -->
      <div style="grid-row:span 2;display:flex;align-items:center;justify-content:center">
        <div style="writing-mode:vertical-rl;text-orientation:mixed;font-size:8px;font-weight:800;letter-spacing:2px;color:#15803d;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 6px;transform:rotate(180deg)">WWTP</div>
      </div>

      <!-- COD -->
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#dc2626">COD</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-cod-val" style="font-size:22px;font-weight:800;color:#b91c1c;font-family:'Cascadia Code','Consolas',monospace">472</span>
          <span style="font-size:9px;color:#fca5a5;font-weight:600">ppm</span>
        </div>
        <div style="margin-top:8px;background:#fee2e2;border-radius:99px;height:3px">
          <div id="wwtp-cod-bar" style="width:79%;background:#ef4444;border-radius:99px;height:3px;transition:width 1s ease"></div>
        </div>
      </div>

      <!-- BOD -->
      <div style="background:#fef9ee;border:1px solid #d1fae5;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#059669">BOD</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-bod-val" style="font-size:22px;font-weight:800;color:#065f46;font-family:'Cascadia Code','Consolas',monospace">236</span>
          <span style="font-size:9px;color:#6ee7b7;font-weight:600">ppm</span>
        </div>
        <div style="margin-top:8px;background:#d1fae5;border-radius:99px;height:3px">
          <div id="wwtp-bod-bar" style="width:39%;background:#10b981;border-radius:99px;height:3px;transition:width 1s ease"></div>
        </div>
      </div>

      <!-- PH -->
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#ca8a04">PH</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-ph-val" style="font-size:22px;font-weight:800;color:#a16207;font-family:'Cascadia Code','Consolas',monospace">8.1</span>
        </div>
        <div style="margin-top:8px;background:#fef9c3;border-radius:99px;height:3px">
          <div id="wwtp-ph-bar" style="width:58%;background:#eab308;border-radius:99px;height:3px;transition:width 1s ease"></div>
        </div>
      </div>

      <!-- TDS -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#0284c7">TDS</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-tds-val" style="font-size:22px;font-weight:800;color:#0369a1;font-family:'Cascadia Code','Consolas',monospace">310</span>
          <span style="font-size:9px;color:#7dd3fc;font-weight:600">ppm</span>
        </div>
        <div style="margin-top:8px;background:#e0f2fe;border-radius:99px;height:3px">
          <div id="wwtp-tds-bar" style="width:52%;background:#0ea5e9;border-radius:99px;height:3px;transition:width 1s ease"></div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Monitoring</span>
      <span id="wwtp-live-time" style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
  </div>

  <!-- ══ DIESEL OIL — full width ══ -->
  <div class="s-card" style="--acc:#16a34a;grid-column:1/-1;position:relative">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('dieseloil')">Detail</button>
    <div class="s-label" style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#16a34a">DIESEL OIL</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- TANK -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#16a34a">TANK</div>
        <div id="tank-body-diesel_tank" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-diesel_tank" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-diesel_tank" style="font-size:24px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-diesel_tank" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">3.900lt / 5.000lt</div>
        <div id="tank-cm-diesel_tank" style="font-size:8px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-diesel_tank" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:5px">
          <div id="tank-bar-diesel_tank" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GENSET + TANK GENSET -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#15803d">GENSET</div>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px">
          <div style="font-size:28px">⚡</div>
          <div>
            <div style="font-size:10px;font-weight:700;color:#15803d">STATUS</div>
            <div id="genset-status-val" style="font-size:14px;font-weight:800;color:#16a34a">STANDBY</div>
          </div>
        </div>
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#15803d;margin-top:4px">TANK GENSET</div>
        <div id="tank-body-diesel_genset" style="position:relative;width:100%;height:70px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-diesel_genset" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-diesel_genset" style="font-size:18px;font-weight:800;color:white;text-shadow:0 1px 3px rgba(0,0,0,.4);filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div id="tank-vol-diesel_genset" style="font-size:9px;color:#15803d;font-weight:600;text-align:center">310lt / 500lt</div>
        <div id="tank-cm-diesel_genset" style="font-size:8px;color:#94a3b8;text-align:center">— cm</div>
        <div id="tank-offline-diesel_genset" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="width:100%;background:#bbf7d0;border-radius:99px;height:4px">
          <div id="tank-bar-diesel_genset" style="width:0%;background:#22c55e;border-radius:99px;height:4px;transition:width 1.8s ease"></div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)"></div>
      <span style="font-size:10px;font-weight:600;color:#16a34a">Monitoring</span>
      <span id="diesel-live-time" style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
  </div>


  </div>
`;
}
// ══ UPDATE NEW SECTIONS (s5, s6, s7, s8) ═══════════════════════════════════
// Dipanggil dari applyWL() setiap kali data water level masuk
function updateNewSectionTanks(wl) {
  if (!wl || typeof wl !== 'object') return;

  // Ambil FIXED_TANK_SLOTS dari sensors.js
  const slots = typeof FIXED_TANK_SLOTS !== 'undefined' ? FIXED_TANK_SLOTS : [];

  // Helper: update satu tangki persegi/silinder berdasarkan sensor config + rawCm
  function applyTankEl(elId, sensor, rawCm) {
    const hasData = (rawCm !== null && rawCm !== undefined && rawCm !== '' && Number.isFinite(Number(rawCm)));

    // Offline indicator
    const offEl = document.getElementById('tank-offline-' + elId);
    if (offEl) {
      offEl.style.display = hasData ? 'none' : 'flex';
    }

    if (!hasData) {
      // Reset to dash state
      const pctEl = document.getElementById('tank-pct-' + elId);
      if (pctEl) pctEl.textContent = '—%';
      const volEl = document.getElementById('tank-vol-' + elId);
      if (volEl && sensor) {
        const maxVol = Math.round(calcMaxVolumeLiter(sensor));
        volEl.textContent = '— / ' + maxVol.toLocaleString('id-ID') + ' lt';
      }
      const cmEl = document.getElementById('tank-cm-' + elId);
      if (cmEl) cmEl.textContent = '— cm air';
      const wEl = document.getElementById('tank-water-' + elId);
      if (wEl) wEl.style.height = '0%';
      const bEl = document.getElementById('tank-bar-' + elId);
      if (bEl) bEl.style.width = '0%';
      return false;
    }

    if (!sensor) return false;
    const raw = Number(rawCm);
    const maxVol = calcMaxVolumeLiter(sensor);
    const vol    = calcVolumeLiter(sensor, raw);
    const info   = cmToInfo(sensor, raw);
    const pct    = Math.round(info.pct);
    const pctLin = Math.round(info.pctLinear);
    const h      = Math.round(info.h);

    // Warna dinamis berdasarkan pct
    const col = getTankColorByPct(pct);

    const pctEl = document.getElementById('tank-pct-' + elId);
    if (pctEl) { 
      pctEl.textContent = pct + '%'; 
      pctEl.style.fontSize = '42px';
      pctEl.style.fontWeight = '900';
      pctEl.style.color = '#1f2937';
      pctEl.style.textShadow = 'none';
    }

    const volEl = document.getElementById('tank-vol-' + elId);
    if (volEl) {
      volEl.textContent = Math.round(vol).toLocaleString('id-ID') + ' / ' + Math.round(maxVol).toLocaleString('id-ID') + ' lt';
      volEl.style.color = col.label;
    }

    const cmEl = document.getElementById('tank-cm-' + elId);
    if (cmEl) cmEl.textContent = h + ' cm air';

    // Tank container fill - water level visual (no animation)
    const wEl = document.getElementById('tank-water-' + elId);
    if (wEl) { 
      wEl.style.display = 'block';
      wEl.style.height = pctLin + '%'; 
      wEl.style.background = col.water;
      wEl.style.transition = 'none';
    }

    const bodyEl = document.getElementById('tank-body-' + elId);
    if (bodyEl) { bodyEl.style.borderColor = col.border; bodyEl.style.background = col.bg; }

    // Hide bar below completely (including parent container)
    const bEl = document.getElementById('tank-bar-' + elId);
    if (bEl) { 
      bEl.style.display = 'none';
      if (bEl.parentElement) {
        bEl.parentElement.style.display = 'none';
      }
    }

    return true;
  }

  function findSlot(key) {
    return slots.find(s => s.key === key) || null;
  }

  // ── s3: Treat Water 2 — Tank Aroma (tanu_edi) ──────────────
  const s3val    = wl.s3_cm ?? wl.s3 ?? null;
  const s3slot   = findSlot('s3');
  const s3online = applyTankEl('tanu_edi', s3slot, s3val);

  // ── s4: Treat Water 2 — Feed Aroma (feed_edi) ───────────────
  const s4val    = wl.s4_cm ?? wl.s4 ?? null;
  const s4slot   = findSlot('s4');
  const s4online = applyTankEl('feed_edi', s4slot, s4val);
  _updateSectionStatus('treatwater2', s3online || s4online);

  // ── s6: Treat Water 1 — Slury 1 ─────────────────────────────
  const s6val    = wl.s6_cm ?? wl.s6 ?? null;
  const s6slot   = findSlot('s6');
  const s6online = applyTankEl('slury_1', s6slot, s6val);

  // ── s7: Treat Water 1 — Slury 2 ─────────────────────────────
  const s7val    = wl.s7_cm ?? wl.s7 ?? null;
  const s7slot   = findSlot('s7');
  const s7online = applyTankEl('slury_2', s7slot, s7val);

  // ── s2: Treat Water 1 — Feed Slury ──────────────────────────
  const s2val    = wl.s2_cm ?? wl.s2 ?? null;
  const s2slot   = findSlot('s2');
  const s2online = applyTankEl('feed_slury', s2slot, s2val);
  _updateTW1Status(s6online, s7online, s2online);

  // ── s1: Filter Water — Air Proses ────────────────────────────
  const s1val    = wl.s1_cm ?? wl.s1 ?? null;
  const s1slot   = findSlot('s1');
  const s1online = applyTankEl('air_proses', s1slot, s1val);

  // ── s9: Filter Water — Ground Tank A ─────────────────────────
  const s9val    = wl.s9_cm ?? wl.s9 ?? null;
  const s9slot   = findSlot('s9');
  const gtaOnline = applyTankEl('ground_tank_a', s9slot, s9val);
  _updateSectionStatus('filter', s1online || gtaOnline);

  // ── s5: Diesel Oil — Tangki Solar ────────────────────────────
  const s5val    = wl.s5_cm ?? wl.s5 ?? null;
  const s5slot   = findSlot('s5');
  const s5online = applyTankEl('solar', s5slot, s5val);
  _updateSectionStatus('solar', s5online);

  // ── s8: Boiler Feed Water ─────────────────────────────────────
  const s8val    = wl.s8_cm ?? wl.s8 ?? null;
  const s8slot   = findSlot('s8');
  const s8online = applyTankEl('boiler_fw', s8slot, s8val);
  _updateSectionStatus('boiler', s8online);
}

function _updateSectionStatus(prefix, online) {
  const dot   = document.getElementById(prefix + '-dot');
  const txt   = document.getElementById(prefix + '-status-txt');
  const liveDot   = document.getElementById(prefix + '-live-dot');
  const liveLabel = document.getElementById(prefix + '-live-label');
  const liveTime  = document.getElementById(prefix + '-live-time');

  const clr = online ? '#22c55e' : '#94a3b8';
  if (dot) dot.style.background = online ? '#22c55e' : '#94a3b8';
  if (txt) { txt.textContent = online ? 'ONLINE' : 'OFFLINE'; txt.style.color = online ? '#15803d' : '#94a3b8'; }
  if (liveDot) { liveDot.style.background = clr; liveDot.style.boxShadow = online ? '0 0 6px rgba(34,197,94,.6)' : 'none'; }
  if (liveLabel) { liveLabel.textContent = online ? 'Normal' : 'Menunggu data...'; liveLabel.style.color = online ? '#16a34a' : '#94a3b8'; }
  if (liveTime) liveTime.textContent = online ? new Date().toLocaleTimeString('id-ID') : 'Data statis';
}

function _updateTW1Status(s6online, s7online, s2online) {
  // Sensor list dots
  const d6 = document.getElementById('tw1-s6-dot');
  const t6 = document.getElementById('tw1-s6-txt');
  if (d6) d6.style.background = s6online ? '#22c55e' : '#94a3b8';
  if (t6) { t6.textContent = s6online ? 'ONLINE' : 'OFFLINE'; t6.style.color = s6online ? '#15803d' : '#94a3b8'; }

  const d7 = document.getElementById('tw1-s7-dot');
  const t7 = document.getElementById('tw1-s7-txt');
  if (d7) d7.style.background = s7online ? '#22c55e' : '#94a3b8';
  if (t7) { t7.textContent = s7online ? 'ONLINE' : 'OFFLINE'; t7.style.color = s7online ? '#15803d' : '#94a3b8'; }

  const d2 = document.getElementById('tw1-s2-dot');
  const t2 = document.getElementById('tw1-s2-txt');
  if (d2) d2.style.background = s2online ? '#22c55e' : '#94a3b8';
  if (t2) { t2.textContent = s2online ? 'ONLINE' : 'OFFLINE'; t2.style.color = s2online ? '#15803d' : '#94a3b8'; }

  const anyOnline = s6online || s7online || s2online;
  const liveDot   = document.getElementById('tw1-live-dot');
  const liveLabel = document.getElementById('tw1-live-label');
  const liveTime  = document.getElementById('tw1-live-time');
  if (liveDot) { liveDot.style.background = anyOnline ? '#22c55e' : '#94a3b8'; liveDot.style.boxShadow = anyOnline ? '0 0 6px rgba(34,197,94,.6)' : 'none'; }
  if (liveLabel) { liveLabel.textContent = anyOnline ? 'Normal' : 'Menunggu data...'; liveLabel.style.color = anyOnline ? '#16a34a' : '#94a3b8'; }
  if (liveTime) liveTime.textContent = anyOnline ? new Date().toLocaleTimeString('id-ID') : 'Data statis';
}


// ── Water Quality Display — dari Laporan Harian Lab ──────────────────────────
async function fetchWaterQuality() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res   = await fetch('/api/dataentry/laboratorium-harian?tanggal=' + today + '&limit=10');
    const json  = await res.json();
    if (!json.success || !json.data?.length) return;

    // Ambil entry TERBARU per section untuk display di dashboard
    // Format baru: water_quality[section] = array of entries
    // Format lama: water_quality[section] = object (backward compat)
    let wq = {};
    for (const row of json.data) {
      if (row.water_quality && Object.keys(row.water_quality).length > 0) {
        for (const section of ['tw1','tw2','filter']) {
          const sec = row.water_quality[section];
          if (!sec) continue;
          // Ambil entry terakhir (terbaru) dari array, atau object langsung jika format lama
          const latest = Array.isArray(sec) ? sec[sec.length - 1] : sec;
          if (latest) wq[section] = latest;
        }
      }
    }
    updateWQDisplay('tw2',    wq.tw2    || {});
    updateWQDisplay('tw1',    wq.tw1    || {});
    updateWQDisplay('filter', wq.filter || {});
    console.log('💧 WQ updated:', wq);
  } catch (err) {
    console.warn('fetchWaterQuality error:', err.message);
  }
}

function updateWQDisplay(section, data) {
  const setEl = (id, val) => {
    const el = document.getElementById('wq-' + section + '-' + id);
    if (!el) return;
    el.textContent = (val !== null && val !== undefined && val !== '') ? val : '—';
  };
  setEl('tds',      data.tds);
  setEl('hardness', data.hardness);
  setEl('ph',       data.ph);
  setEl('alkaline', data.alkaline ?? data.alkali);
}
window.fetchWaterQuality  = fetchWaterQuality;
window.updateWQDisplay    = updateWQDisplay;


// ── Water Quality History Modal ───────────────────────────────────────────────
const _WQ_SECTION_MAP = {
  'treatwater2': { key: 'tw2',    label: 'Treat Water 2', color: '#8b5cf6' },
  'treatwater1': { key: 'tw1',    label: 'Treat Water 1', color: '#6366f1' },
  'filterwater': { key: 'filter', label: 'Filter Water',  color: '#0ea5e9' },
};

async function openSensorDetailModal(section) {
  const cfg = _WQ_SECTION_MAP[section];
  if (!cfg) return;

  let modal = document.getElementById('wq-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wq-detail-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);';
    modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:min(700px,95vw);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden">
      <div style="padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${cfg.color};text-transform:uppercase">${cfg.label}</div>
          <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px">History Laporan harian lab</div>
        </div>
        <button onclick="document.getElementById('wq-detail-modal').style.display='none'"
          style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:600;color:#64748b">✕ Tutup</button>
      </div>
      <div id="wq-detail-body" style="overflow-y:auto;flex:1;padding:16px 22px">
        <div style="text-align:center;padding:40px;color:#94a3b8">⏳ Memuat data...</div>
      </div>
    </div>`;

  try {
    const dateFrom = new Date(); dateFrom.setDate(dateFrom.getDate() - 30);
    const res  = await fetch('/api/dataentry/laboratorium-harian?tanggal_dari=' + dateFrom.toISOString().split('T')[0] + '&limit=200');
    const json = await res.json();
    const body = document.getElementById('wq-detail-body');
    if (!body) return;

    if (!json.success || !json.data?.length) {
      body.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">📭 Belum ada data</div>';
      return;
    }

    // Kumpulkan semua entries per tanggal
    // Format baru: water_quality[section] = array of {tds,hardness,ph,alkaline,recorded_at}
    // Format lama: water_quality[section] = object (backward compat — wrap jadi array)
    const grouped = {}; // { 'YYYY-MM-DD': [ entry, ... ] }
    for (const r of json.data) {
      const sec = r.water_quality?.[cfg.key];
      if (!sec) continue;
      const tgl = r.tanggal?.substring(0, 10) || '—';
      const entries = Array.isArray(sec)
        ? sec
        : (typeof sec === 'object' ? [{ ...sec, recorded_at: sec.updated_at || r.updated_at || r.created_at }] : []);
      const valid = entries.filter(e => e && Object.values(e).some(v => v !== null && v !== undefined && v !== '' && v !== 'recorded_at'));
      if (!valid.length) continue;
      if (!grouped[tgl]) grouped[tgl] = [];
      grouped[tgl].push(...valid);
    }

    if (!Object.keys(grouped).length) {
      body.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">📭 Belum ada data analisa untuk section ini</div>';
      return;
    }

    const v = val => (val !== null && val !== undefined && val !== '')
      ? `<strong>${val}</strong>`
      : '<span style="color:#cbd5e1">—</span>';

    let html = '';
    Object.keys(grouped).sort().reverse().forEach(tgl => {
      const entries = grouped[tgl].slice().sort((a, b) => {
        // Urutkan per jam dalam hari — terbaru di atas
        return new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0);
      });
      html += `
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:${cfg.color};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;padding:6px 10px;background:${cfg.color}15;border-radius:6px;border-left:3px solid ${cfg.color};display:flex;align-items:center;justify-content:space-between">
            <span>📅 ${new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
            <span style="font-size:10px;font-weight:600;background:${cfg.color}25;padding:2px 8px;border-radius:99px">${entries.length} entry</span>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0">JAM ENTRY</th>
                  <th style="padding:8px 12px;text-align:center;color:#7c3aed;font-weight:700;border-bottom:2px solid #e2e8f0">TDS<br><span style="font-weight:400;font-size:10px">ppm</span></th>
                  <th style="padding:8px 12px;text-align:center;color:#4f46e5;font-weight:700;border-bottom:2px solid #e2e8f0">HARDNESS<br><span style="font-weight:400;font-size:10px">mg/L</span></th>
                  <th style="padding:8px 12px;text-align:center;color:#ca8a04;font-weight:700;border-bottom:2px solid #e2e8f0">PH</th>
                  <th style="padding:8px 12px;text-align:center;color:#059669;font-weight:700;border-bottom:2px solid #e2e8f0">ALKALINE<br><span style="font-weight:400;font-size:10px">mg/L</span></th>
                </tr>
              </thead>
              <tbody>
                ${entries.map((e, i) => {
                  const jam = e.recorded_at
                    ? new Date(e.recorded_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
                    : '—';
                  const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                  return `<tr style="background:${bg};border-bottom:1px solid #f1f5f9">
                    <td style="padding:10px 12px;color:#374151;font-family:'DM Mono',monospace;font-size:11px">🕐 ${jam}</td>
                    <td style="padding:10px 12px;text-align:center;color:#5b21b6">${v(e.tds)}</td>
                    <td style="padding:10px 12px;text-align:center;color:#3730a3">${v(e.hardness)}</td>
                    <td style="padding:10px 12px;text-align:center;color:#a16207">${v(e.ph)}</td>
                    <td style="padding:10px 12px;text-align:center;color:#065f46">${v(e.alkaline ?? e.alkali)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    });
    body.innerHTML = html;
  } catch (err) {
    const body = document.getElementById('wq-detail-body');
    if (body) body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444">❌ Gagal: ${err.message}</div>`;
  }
}
window.openSensorDetailModal = openSensorDetailModal;