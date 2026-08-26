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
    min-width:280px;
    max-height:600px;
    overflow-y:auto;
    font-family:inherit;
  `;

  // Build sensor list
  const sensorListHTML = buildSensorListHTML();

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
      const statusTxt = alive ? 'Online' : (lastTs ? 'Offline' : 'Offline');
      const statusClr = alive ? '#22c55e' : (lastTs ? '#ef4444' : '#ef4444');
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
    ${sensorListHTML}
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

function buildSensorListHTML() {
  // Get sensor data dari FIXED_TANK_SLOTS jika tersedia
  if (typeof FIXED_TANK_SLOTS === 'undefined') return '';
  
  const wlData = window._lastWLData || {};
  
  // Group sensors by active/inactive
  const activeSensors = [];
  const inactiveSensors = [];
  
  FIXED_TANK_SLOTS.forEach(slot => {
    // Check if sensor memiliki data valid (bukan null, bukan 0, bukan undefined)
    const keyWithCm = slot.key + '_cm';
    const sensorVal = wlData[keyWithCm] ?? wlData[slot.key] ?? null;
    const hasData = sensorVal !== null && sensorVal !== undefined && sensorVal !== '' && Number(sensorVal) > 0;
    
    const sensorInfo = {
      key: slot.key,
      name: slot.name,
      fixedId: slot.fixedId,
      hasData
    };
    
    if (hasData) {
      activeSensors.push(sensorInfo);
    } else {
      inactiveSensors.push(sensorInfo);
    }
  });
  
  if (activeSensors.length === 0 && inactiveSensors.length === 0) return '';
  
  // Build HTML
  let html = `
    <div style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px;">
      <div style="padding:4px 14px 8px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
        Sensor Status
      </div>
  `;
  
  // Active sensors
  if (activeSensors.length > 0) {
    html += `<div style="padding:2px 14px;font-size:9px;font-weight:600;color:#16a34a;text-transform:uppercase;margin-bottom:4px;">Detail sensor water level</div>`;
    html += `<div style="padding:2px 14px;font-size:9px;font-weight:600;color:#16a34a;text-transform:uppercase;margin-bottom:4px;">Online (${activeSensors.length})</div>`;
    activeSensors.forEach(sensor => {
      html += `
        <div style="display:flex;align-items:center;gap:8px;padding:4px 14px;font-size:11px;border-radius:6px;transition:.15s;"
          onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">
          <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;"></div>
          <div style="flex:1;">
            <span style="color:#1e293b;font-weight:500;">${sensor.key}</span>
            <span style="color:#94a3b8;margin-left:6px;">— ${sensor.name}</span>
          </div>
        </div>
      `;
    });
  }
  
  // Inactive sensors
  if (inactiveSensors.length > 0) {
    html += `<div style="padding:2px 14px;font-size:9px;font-weight:600;color:#b45309;text-transform:uppercase;margin-top:8px;margin-bottom:4px;">Offline (${inactiveSensors.length})</div>`;
    inactiveSensors.forEach(sensor => {
      html += `
        <div style="display:flex;align-items:center;gap:8px;padding:4px 14px;font-size:11px;border-radius:6px;transition:.15s;"
          onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='transparent'">
          <div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></div>
          <div style="flex:1;">
            <span style="color:#1e293b;font-weight:500;">${sensor.key}</span>
            <span style="color:#94a3b8;margin-left:6px;">— ${sensor.name}</span>
          </div>
        </div>
      `;
    });
  }
  
  html += '</div>';
  return html;
}
window.toggleEspPopup = toggleEspPopup;
window.buildSensorListHTML = buildSensorListHTML;

// Legacy — masih dipanggil kalau ada kode lain
function setEspStatus(state) {
  updateEspBadge();
}

// ══ IOT RENDER ═════════════════════════════════════
async function renderIoT(content) {
  content.innerHTML = getIoTHTML();
  initWidgets();

  // ── Load sensor settings dari API/DB dulu sebelum render tank ──
  // Ini memastikan dimensi & konfigurasi tersimpan user dipakai, bukan default hardcode
  if (typeof loadSensorSettingsFromAPI === 'function') {
    await loadSensorSettingsFromAPI();
  }

  renderTankCards();
  renderContainerList();
  
  // Start periodic sync agar perubahan setting langsung terlihat
  if (typeof startSensorSettingsSync === 'function') {
    startSensorSettingsSync();
  }

  // Init connection status display
  if (typeof updateConnectionStatus === 'function') {
    updateConnectionStatus();
  }
  
  fetchSummary();
  setTimeout(updateDashWidgets, 200);
  // Load cache dulu agar tidak blank saat navigasi
  try {
    const cached = JSON.parse(localStorage.getItem('sail_wq_cache') || '{}');
    if (Object.keys(cached).length) {
      updateWQDisplay('tw2',     cached.tw2     || {});
      updateWQDisplay('tw1',     cached.tw1     || {});
      updateWQDisplay('filter',  cached.filter  || {});
      updateWQDisplay('chiller', cached.chiller || {});
      updateWQDisplay('wwtp',    cached.wwtp    || {});
    }
  } catch(e) {}
  // Fetch terbaru dari API (500ms setelah DOM siap)
  setTimeout(fetchWaterQuality, 500);
  // Render container list setelah DOM ready
  setTimeout(renderContainerList, 300);
  // Clear any existing poll before setting new one
  if (window._poll)   { clearInterval(window._poll);   window._poll   = null; }
  if (window._wqPoll) { clearInterval(window._wqPoll); window._wqPoll = null; }

  // Guard: cek apakah halaman IoT masih aktif di DOM
  const _isIoTActive = () => !!document.getElementById('tank-pct-slury_2_tw1')
                          || !!document.getElementById('tank-pct-feed_slury_tw1')
                          || !!document.getElementById('wl-tanks-container');

  // Polling setiap 5 detik
  window._poll = setInterval(async () => {
    if (!_isIoTActive()) {
      clearInterval(window._poll);
      window._poll = null;
      return;
    }
    try { await fetchSummary(); } catch(e) { console.warn('⚠️ Poll fetchSummary error:', e.message); }
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

  // Resume polling saat tab kembali aktif (visibilitychange)
  document.removeEventListener('visibilitychange', window._pollVisibilityHandler || (() => {}));
  window._pollVisibilityHandler = () => {
    if (!document.hidden && _isIoTActive()) {
      try { fetchSummary(); } catch(e) {}
    }
  };
  document.addEventListener('visibilitychange', window._pollVisibilityHandler);
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

  <!-- ══ TREAT WATER 2 — full width ══ -->
    <div class="s-card" style="--acc:#8b5cf6;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('treatwater2')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">TREAT WATER 2</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">


      <!-- TANK Aroma -->
      <div style="background:#ffffff;border:1px solid #000000;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000"> Aroma Tank</div>
        <div id="tank-body-boiler_fw-tw2" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #000000;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-boiler_fw-tw2" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-boiler_fw-tw2" style="font-size:40px;font-weight:800;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#374151;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#374151;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-boiler_fw-tw2" style="font-size:40px;color:#ffffff;font-weight:600;text-align:center">— / 1.211 lt</div>
        <div id="tank-cm-boiler_fw-tw2" style="font-size:25px;color:#9ca3af;text-align:center">— cm air</div>
        <div id="tank-offline-boiler_fw-tw2" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #4b5563;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-boiler_fw-tw2" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- FEED Aroma Tank — sekarang aktif, diisi dari sensor s11 (EDI Cadangan) -->
      <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">Feed Aroma Tank</div>
        <div id="tank-body-feed_edi-tw2" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #7dd3fc;border-radius:10px;overflow:hidden;background:#e0f2fe">
          <div id="tank-water-feed_edi-tw2" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#38bdf8,#0284c7);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-feed_edi-tw2" style="font-size:40px;font-weight:800;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
            <span id="tank-cm-feed_edi-tw2" style="font-size:25px;color:rgba(255,255,255,.75)">— cm air</span>
          </div>
          <div id="tank-offline-feed_edi-tw2" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.35);color:#fff;font-size:9px;padding:2px 10px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_edi-tw2" style="font-size:40px;color:#0369a1;font-weight:600;text-align:center">— / 300lt</div>
        <div style="display:none">
          <div id="tank-bar-feed_edi-tw2" style="width:0%;background:#0ea5e9;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#ffffff;border:1px solid #000000;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#000000;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-tds">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #000000;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#000000;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-hardness">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #000000;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#000000;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-ph">—</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #000000;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#000000;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw2-alkaline">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,.4)"></div>
      <span style="font-size:10px;font-weight:600;color:#10b981">Normal</span>
      <span style="margin-left:auto;font-size:10px;color:#9ca3af">Data statis</span>
    </div>
    <div id="tw1-sensor-status-list" style="margin-top:10px;border-top:1px solid #374151;padding-top:10px"></div>
  </div>

  <!-- ══ TREAT WATER 1 — full width ══ -->
   <div class="s-card" style="--acc:#8b5cf6;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('treatwater1')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">TREAT WATER 1</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">


      <!-- SLURY 1 -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">SLURY 1 Tank</div>
        <div id="tank-body-slury_1_tw1" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #ffffff;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-slury_1_tw1" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-slury_1_tw1" style="font-size:40px;font-weight:900;letter-spacing:0.5px;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeSpeed;line-height:1;-webkit-text-stroke:0.3px rgba(255,255,255,0.3);color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-slury_1_tw1" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 1.579 lt</div>
        <div id="tank-cm-slury_1_tw1" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-slury_1_tw1" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:12px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-slury_1_tw1" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- SLURY 2 -->
      <div style="background:#ffffff;border:1px solid #000000;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">SLURY 2 Tank</div>
        <div id="tank-body-slury_2_tw1" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #000000;border-radius:10px;overflow:hidden;background:#ffffff">
          <div id="tank-water-slury_2_tw1" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-slury_2_tw1" style="font-size:40px;font-weight:800;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#374151;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#374151;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-slury_2_tw1" style="font-size:40px;color:#ffffff;font-weight:600;text-align:center">— / 1.579 lt</div>
        <div id="tank-cm-slury_2_tw1" style="font-size:25px;color:#9ca3af;text-align:center">— cm air</div>
        <div id="tank-offline-slury_2_tw1" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-slury_2_tw1" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>


      <!-- FEED SLURY -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">Feed Slurry tank</div>
        <div id="tank-body-feed_slury_tw1" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-feed_slury_tw1" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-feed_slury_tw1" style="font-size:40px;font-weight:800;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_slury_tw1" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 18.000 lt</div>
        <div id="tank-cm-feed_slury_tw1" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-feed_slury_tw1" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-feed_slury_tw1" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-tds">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-hardness">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-ph">—</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-tw1-alkaline">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
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
  <div class="s-card" style="--acc:#0ea5e9;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('filterwater')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">FILTER WATER</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- AIR PROSES (s1=air_proses) -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">Process Water Tank</div>
        <div id="tank-body-air_proses-fw" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #fffffff;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-air_proses-fw" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-air_proses-fw" style="font-size:40px;font-weight:800;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div id="tank-offline-air_proses-fw" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-air_proses-fw" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 6.000 lt</div>
        <div id="tank-cm-air_proses-fw" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div style="display:none">
          <div id="tank-bar-air_proses-fw" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- FLOW vertikal -->
      <div style="display:flex;align-items:center;justify-content:center">
        <div style="writing-mode:vertical-rl;text-orientation:mixed;font-size:8px;font-weight:800;letter-spacing:2px;color:#0369a1;background:#e0f2fe;border:1px solid #7dd3fc;border-radius:6px;padding:10px 6px;transform:rotate(180deg)">FLOW</div>
      </div>

      <!-- GROUND TANK A (s9) -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#0284c7">GROUND TANK A</div>
        <div id="tank-body-ground_tank_a-fw" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #7dd3fc;border-radius:10px;overflow:hidden;background:#e0f2fe">
          <div id="tank-water-ground_tank_a-fw" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#38bdf8,#0284c7);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-ground_tank_a-fw" style="font-size:40px;font-weight:800;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div id="tank-offline-ground_tank_a-fw" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.35);color:#fff;font-size:9px;padding:2px 10px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-ground_tank_a-fw" style="font-size:40px;color:#0369a1;font-weight:600;text-align:center">— / 72.000 lt</div>
        <div id="tank-cm-ground_tank_a-fw" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div style="display:none">
          <div id="tank-bar-ground_tank_a-fw" style="width:0%;background:#0ea5e9;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GRID 2x2: TDS + Hardness + PH + Alkaline -->
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">TDS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-tds">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">HARDNESS</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-hardness">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">PH</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-ph">—</span>
          </div>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">ALKALINE</div>
          <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
            <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-filter-alkaline">—</span>
            <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
          </div>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div id="filter-live-dot" style="width:7px;height:7px;border-radius:50%;background:#94a3b8"></div>
      <span id="filter-live-label" style="font-size:10px;font-weight:600;color:#94a3b8">Menunggu data...</span>
      <span id="filter-live-time" style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
    <div id="filter-sensor-status-list" style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px"></div>
  </div>

  <!-- ══ Chiller in & out ══ -->
  <div class="s-card" style="--acc:#0ea5e9;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('chiller')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">Chiller in & out</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 180px 180px;grid-template-rows:1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- Chiller in (s3=tanu_edi) — Key: s3, 1m×0.8m×1.22m, 976 L -->
      <div style="background:#ffffff;border:1px solid #bbf7d0;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;grid-row:1/3;grid-column:1">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#16a34a">Chiller in Tank</div>
        <div id="tank-body-tanu_edi-chiller" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-tanu_edi-chiller" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-tanu_edi-chiller" style="font-size:40px;font-weight:800;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div id="tank-offline-tanu_edi-chiller" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-tanu_edi-chiller" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 976 lt</div>
        <div id="tank-cm-tanu_edi-chiller" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div style="display:none">
          <div id="tank-bar-tanu_edi-chiller" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- Chiller out (s4=feed_edi) — Key: s4, 1m×0.8m×1.22m, 976 L, Zero: 0cm -->
      <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;grid-row:1/3;grid-column:2">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#0284c7">Chiller out Tank</div>
        <div id="tank-body-feed_edi-chiller" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #7dd3fc;border-radius:10px;overflow:hidden;background:#e0f2fe">
          <div id="tank-water-feed_edi-chiller" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#38bdf8,#0284c7);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
            <span id="tank-pct-feed_edi-chiller" style="font-size:40px;font-weight:800;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div id="tank-offline-feed_edi-chiller" style="display:none;position:absolute;bottom:8px;left:0;right:0;justify-content:center"><span style="background:rgba(0,0,0,.4);color:#fff;font-size:9px;padding:2px 8px;border-radius:99px">Offline</span></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#7dd3fc;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-feed_edi-chiller" style="font-size:40px;color:#0369a1;font-weight:600;text-align:center">— / 976 lt</div>
        <div id="tank-cm-feed_edi-chiller" style="font-size:25px;color:#0369a1;text-align:center">— cm air</div>
        <div style="display:none">
          <div id="tank-bar-feed_edi-chiller" style="width:0%;background:#0ea5e9;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- Condition 1 -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:1;grid-column:3">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">Condition 1</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-chiller-tds">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
        </div>
      </div>

      <!-- Condition 2 -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:1;grid-column:4">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">Condition 2</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-chiller-hardness">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
        </div>
      </div>

      <!-- Condition 3 -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:2;grid-column:3">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">Condition 3</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-chiller-ph">—</span>
        </div>
      </div>

      <!-- Condition 4 -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:2;grid-column:4">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">Condition 4</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace" id="wq-chiller-alkaline">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">mg/L</span>
        </div>
      </div>

    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
      <div id="chiller-live-dot" style="width:7px;height:7px;border-radius:50%;background:#94a3b8"></div>
      <span id="chiller-live-label" style="font-size:10px;font-weight:600;color:#94a3b8">Menunggu data...</span>
      <span id="chiller-live-time" style="margin-left:auto;font-size:10px;color:#94a3b8">Data statis</span>
    </div>
  </div>

  <!-- ══ WWTP / LIMBAH — full width ══ -->
  <div class="s-card" style="--acc:#16a34a;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('wwtp')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">WWTP / LIMBAH</div>
    <div style="display:grid;grid-template-columns:1fr 180px 180px;grid-template-rows:1fr 1fr;gap:8px;margin-top:12px;align-items:stretch">

      <!-- GROUND TANK B — span 2 baris di kolom 1 -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;grid-row:1/3;grid-column:1">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#16a34a">GROUND TANK B</div>
        <div id="tank-body-ground_tank_b" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #86efac;border-radius:10px;overflow:hidden;background:#dcfce7">
          <div id="tank-water-ground_tank_b" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-ground_tank_b" style="font-size:40px;font-weight:800;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-ground_tank_b" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 1.200 lt</div>
        <div id="tank-cm-ground_tank_b" style="font-size:30px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-ground_tank_b" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-ground_tank_b" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- COD -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:1;grid-column:2">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">COD</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-cod-val" style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
        </div>
      </div>

      <!-- BOD -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:1;grid-column:3">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">BOD</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-bod-val" style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
        </div>
      </div>

      <!-- PH -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:2;grid-column:2">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">PH</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-ph-val" style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace">—</span>
        </div>
      </div>

      <!-- TDS -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;grid-row:2;grid-column:3">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#000000">TSS</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:6px">
          <span id="wwtp-tds-val" style="font-size:75px;font-weight:800;color:#111827;font-family:'Cascadia Code','Consolas',monospace">—</span>
          <span style="font-size:20px;color:#000000;font-weight:600">ppm</span>
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
  <div class="s-card" style="--acc:#16a34a;grid-column:1/-1;position:relative;background:#111827;border:1px solid #1f2937;">
    <div class="s-bar"></div>
    <button class="s-detail-btn" onclick="openSensorDetailModal('dieseloil')">Detail History</button>
    <div class="s-label" style="font-size:22px;letter-spacing:1.5px;font-weight:700;color:#ffffff">DIESEL OIL</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;align-items:stretch">

      <!-- TANK -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#000000">Solar Tank</div>
        <div id="tank-body-solar-diesel" style="position:relative;width:100%;flex:1;min-height:110px;border:2px solid #ffffff;border-radius:10px;overflow:hidden;background:#ffffff">
          <div id="tank-water-solar-diesel" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:0 0 8px 8px;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span id="tank-pct-solar-diesel" style="font-size:40px;font-weight:800;filter:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased;color:#111;text-shadow:0 1px 2px rgba(255,255,255,.55)">—%</span>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:40%;height:1.5px;background:#eab308;opacity:.75;pointer-events:none"></div>
          <div style="position:absolute;left:0;right:0;bottom:15%;height:1.5px;background:#ef4444;opacity:.75;pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
          <div style="width:6px;height:14px;background:#86efac;border-radius:0 0 4px 4px"></div>
        </div>
        <div id="tank-vol-solar-diesel" style="font-size:40px;color:#15803d;font-weight:600;text-align:center">— / 7.281 lt</div>
        <div id="tank-cm-solar-diesel" style="font-size:25px;color:#94a3b8;text-align:center">— cm air</div>
        <div id="tank-offline-solar-diesel" style="display:none;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px">
          <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
        </div>
        <div style="display:none">
          <div id="tank-bar-solar-diesel" style="width:0%;background:#22c55e;border-radius:99px;height:5px;transition:width 1.8s ease"></div>
        </div>
      </div>

      <!-- GENSET + TANK GENSET -->
      <div style="background:#ffffff;border:1px solid #ffffff;border-radius:5px;padding:10px;display:flex;flex-direction:column;gap:9px">
        <div style="font-size:17px;font-weight:700;letter-spacing:1px;color:#15803d">GENSET</div>
        <div style="border-radius:8px;overflow:hidden;position:relative;background:#f8fafc;border:1px solid #e2e8f0;">
          <div id="tank-body-diesel_genset" style="position:absolute;left:18%;right:18%;top:80%;height:13%;border:2px solid #ffffff;border-radius:8px;overflow:hidden;background:rgba(220,252,231,.92);box-shadow:0 2px 6px rgba(0,0,0,.35);z-index:2">
            <div id="tank-water-diesel_genset" style="position:absolute;top:0;left:0;bottom:0;width:0%;background:linear-gradient(90deg,#4ade80,#16a34a);transition:width 1.8s cubic-bezier(.34,1.2,.64,1)"></div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              <span id="tank-pct-diesel_genset" style="font-size:13px;font-weight:800;color:#111;text-shadow:0 1px 1px rgba(255,255,255,.6)">—%</span>
            </div>
          </div>
          <div id="tank-vol-diesel_genset" style="position:absolute;left:18%;right:18%;top:calc(80% + 13% + 2px);text-align:center;font-size:9px;font-weight:700;color:#ffffff;text-shadow:0 1px 2px rgba(0,0,0,.8);z-index:2">— / — lt</div>
          <div id="tank-offline-diesel_genset" style="display:none;position:absolute;left:50%;top:calc(80% - 14px);transform:translateX(-50%);align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.5px;z-index:2">
            <span style="width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block"></span>OFFLINE
          </div>
          <div style="display:none">
            <div id="tank-bar-diesel_genset" style="width:0%;background:#22c55e;border-radius:99px;height:4px;transition:width 1.8s ease"></div>
            <div id="tank-cm-diesel_genset">— cm</div>
          </div>
          <img src="data:image/jpeg;base64,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" alt="Generator" style="width:100%;height:auto;object-fit:contain;display:block;background:#1a1a2e;">
          <div style="background:#111827;padding:5px 9px;display:flex;align-items:center;gap:5px;">
          </div>
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

  // Gunakan getSensors() agar dapat config terbaru (sensorZeroCm, dimensi, dll dari API/localStorage)
  // Fallback ke FIXED_TANK_SLOTS jika getSensors belum tersedia
  const slots = (typeof getSensors === 'function' ? getSensors() : null)
    || (typeof FIXED_TANK_SLOTS !== 'undefined' ? FIXED_TANK_SLOTS : []);

  // DEBUG: tampilkan semua keys dari water_level API untuk mudah diagnosis
  console.log('[updateNewSectionTanks] wl keys:', Object.keys(wl));

  // Helper: update satu tangki persegi/silinder berdasarkan sensor config + rawCm
  function applyTankEl(elId, sensor, rawCm, suffix = '') {
    const fullId = elId + suffix;  // e.g., 'air_proses' or 'air_proses-fw'
    const hasData = (rawCm !== null && rawCm !== undefined && rawCm !== '' && Number.isFinite(Number(rawCm)));

    // Offline indicator
    const offEl = document.getElementById('tank-offline-' + fullId);
    if (offEl) {
      offEl.style.display = hasData ? 'none' : 'flex';
    }

    if (!hasData) {
      // Cek apakah element sudah punya data dari applyWLToNewUI — jangan timpa jika sudah ada %
      const pctEl = document.getElementById('tank-pct-' + fullId);
      const currentPct = pctEl ? pctEl.textContent : '';
      // Kalau sudah ada persentase nyata (bukan —%), jangan reset
      if (currentPct && currentPct !== '—%' && !currentPct.startsWith('—')) {
        console.log(`[updateNewSectionTanks] ${fullId}: sudah ada data (${currentPct}), skip reset`);
        return true; // Anggap online karena sudah ada data
      }
      // Reset to dash state
      if (pctEl) pctEl.textContent = '—%';
      const volEl = document.getElementById('tank-vol-' + fullId);
      if (volEl && sensor) {
        const maxVol = Math.round(calcMaxVolumeLiter(sensor));
        volEl.textContent = '— / ' + maxVol.toLocaleString('id-ID') + ' lt';
      }
      const cmEl = document.getElementById('tank-cm-' + fullId);
      if (cmEl) cmEl.textContent = '— cm air';
      const wEl = document.getElementById('tank-water-' + fullId);
      if (wEl) { if (fullId === 'diesel_genset') wEl.style.width = '0%'; else wEl.style.height = '0%'; }
      const bEl = document.getElementById('tank-bar-' + fullId);
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

    // Warna dinamis untuk bar/label tetap mengikuti level (merah/kuning/hijau)
    const col = (elId === 'solar') ? getTankColorSolar(pct) : getTankColorByPct(pct);

    // Teks persentase selalu hitam — supaya tetap terbaca di background kuning/terang
    const textColor = '#000000';

    const pctEl = document.getElementById('tank-pct-' + fullId);
    if (pctEl) { 
      pctEl.textContent = pct + '%';
      pctEl.style.color = textColor;
    }

    const volEl = document.getElementById('tank-vol-' + fullId);
    if (volEl) {
      volEl.textContent = Math.round(vol).toLocaleString('id-ID') + ' / ' + Math.round(maxVol).toLocaleString('id-ID') + ' lt';
      volEl.style.color = col.label;
    }

    const cmEl = document.getElementById('tank-cm-' + fullId);
    if (cmEl) { const _zero = +(sensor.sensorZeroCm ?? 0); cmEl.textContent = Math.max(0, h - _zero) + ' cm air'; }

    // Tank container fill - water level visual (no animation)
    const wEl = document.getElementById('tank-water-' + fullId);
    if (wEl) {
      wEl.style.display = 'block';
      if (fullId === 'diesel_genset') { wEl.style.width = pctLin + '%'; wEl.style.height = '100%'; }
      else wEl.style.height = pctLin + '%';
      wEl.style.background = col.water;
      wEl.style.transition = 'none';
    }

    const bodyEl = document.getElementById('tank-body-' + fullId);
    if (bodyEl && fullId !== 'slury_2_tw1') { bodyEl.style.borderColor = col.border; bodyEl.style.background = col.bg; }

    // Hide bar below completely (including parent container)
    const bEl = document.getElementById('tank-bar-' + fullId);
    if (bEl) { 
      bEl.style.display = 'none';
      if (bEl.parentElement) {
        bEl.parentElement.style.display = 'none';
      }
    }

    return true;
  }

  // findSlot: cari berdasarkan key sensor ATAU fixedId, dengan hardcoded fallback
  function findSlot(keyOrId) {
    return slots.find(s => s.key === keyOrId || s.fixedId === keyOrId || s.id === keyOrId) || null;
  }

  // Helper: ambil nilai dari wl dengan semua kemungkinan nama field, + cache fallback
  function getVal(wl, sensorKey, fixedId, ...candidates) {
    // Coba cari di candidates dulu
    for (const c of candidates) {
      const v = wl[c];
      if (v !== null && v !== undefined && v !== '' && Number(v) > 0) return v;
    }
    
    // Fallback ke cache jika ada (gunakan function dari sensors.js)
    if (typeof getSensorValueWithFallback === 'function') {
      const result = getSensorValueWithFallback(wl, sensorKey, fixedId);
      return result.value;
    }
    
    return null;
  }

  // ── s4: Treat Water 2 / Chiller in (tanu_edi) ─────────────
  const s4val    = getVal(wl, 's4', 'tanu_edi', 's4_cm','s4','tanu_edi_cm','tanu_edi');
  const s4slot   = findSlot('s4') || findSlot('tanu_edi');
  const s4online = applyTankEl('tanu_edi', s4slot, s4val, '-chiller');  // Update Chiller in & out section dengan suffix '-chiller'

  // ── s5: Treat Water 2 / Chiller out (feed_edi) ──────────────
  const s5val    = getVal(wl, 's5', 'feed_edi', 's5_cm','s5','feed_edi_cm','feed_edi');
  const s5slot   = findSlot('s5') || findSlot('feed_edi');
  const s5online = applyTankEl('feed_edi', s5slot, s5val, '-chiller');  // Update Chiller in & out section dengan suffix '-chiller'
  // const s5feedaromaonline = applyTankEl('feed_edi', s5slot, s5val, '-tw2');  // DISABLED: Update TREAT WATER 2 Feed Aroma dengan suffix '-tw2' (share data dari Chiller out)
  // tanu_edi & feed_edi juga tampil di section Chiller in & out
  _updateSectionStatus('chiller', s4online || s5online);

  // ── s11: Treat Water 2 — Feed Aroma Tank (edi_cadangan) ─────────
  // Kartu "Feed Aroma Tank" sekarang diisi dari sensor s11 (EDI Cadangan), bukan lagi share dari s5
  const s11val    = getVal(wl, 's11', 'edi_cadangan', 's11_cm','s11','edi_cadangan_cm','edi_cadangan');
  const s11slot   = findSlot('s11') || findSlot('edi_cadangan');
  const s11online = applyTankEl('feed_edi', s11slot, s11val, '-tw2');  // Update TREAT WATER 2 Feed Aroma Tank dengan suffix '-tw2'
  console.log(`[TW2] s11/edi_cadangan (Feed Aroma Tank): rawVal=${s11val}, online=${s11online}`);

  // ── s12: TANK GENSET — sekarang ditangani terpisah lewat applyFuelGenset()
  // karena payload s12 dari MQTT langsung persen (bukan cm), lihat fetchSummary() di sensors.js

  // ── s6: Treat Water 2 — Tank Aroma ─────────────────────────────
  // Firmware mapping: s6 = "Tank Aroma"
  const s6val    = getVal(wl, 's6', 'boiler_fw', 's6_cm','s6','boiler_fw_cm','boiler_fw','tank_aroma_cm','tank_aroma');
  const s6slot   = findSlot('s6') || findSlot('boiler_fw') || {
    key:'s6', fixedId:'boiler_fw', id:'boiler_fw', name:'Tank Aroma',
    shape:'persegi', orientasi:'vertikal', tinggi:0.445, panjang:3.65, lebar:0.745,
    sensorZeroCm:0, warnPct:40, critPct:15
  };
  const s6online = applyTankEl('boiler_fw', s6slot, s6val, '-tw2');  // Update TREAT WATER 2 Tank Aroma dengan suffix '-tw2'
  console.log(`[TW2] s6/boiler_fw: rawVal=${s6val}, online=${s6online}`);

  // ── s7: Treat Water 1 — Slurry 1 ─────────────────────────────
  // Firmware mapping: s7 = "Slu 1"
  const s7val    = getVal(wl, 's7', 'slury_1', 's7_cm','s7','slury_1_cm','slury_1','slu_1_cm','slu_1','slurry_1_cm','slurry_1');
  const s7slot   = findSlot('s7') || findSlot('slury_1') || {
    key:'s7', fixedId:'slury_1', id:'slury_1', name:'Slurry 1',
    shape:'silinder', orientasi:'vertikal', tinggi:2.13, panjang:0.97,
    sensorZeroCm:20, warnPct:40, critPct:15
  };
  const s7online = applyTankEl('slury_1_tw1', s7slot, s7val);
  console.log(`[TW1] s7/slury_1: rawVal=${s7val}, online=${s7online}`);

  // ── s8: Treat Water 1 — Slurry 2 ─────────────────────────────
  // Firmware mapping: s8 = "Slu 2"
  const s8val    = getVal(wl, 's8', 'slury_2', 's8_cm','s8','slury_2_cm','slury_2','slu_2_cm','slu_2','slurry_2_cm','slurry_2');
  const s8slot   = findSlot('s8') || findSlot('slury_2') || {
    key:'s8', fixedId:'slury_2', id:'slury_2', name:'Slurry 2',
    shape:'silinder', orientasi:'vertikal', tinggi:2.13, panjang:0.97,
    sensorZeroCm:0, warnPct:40, critPct:15
  };
  const s8online = applyTankEl('slury_2_tw1', s8slot, s8val);
  console.log(`[TW1] s8/slury_2: rawVal=${s8val}, online=${s8online}`);
  _updateSectionStatus('boiler', s6online);
  _updateSectionStatus('treatwater2', s4online || s5online || s6online || s11online);  // Update TREAT WATER 2 status

  // ── s2: Treat Water 1 — Feed Slury ──────────────────────────
  // Firmware mapping: s2 = "Feed S"
  const s2val    = getVal(wl, 's2', 'feed_slury', 's2_cm','s2','feed_slury_cm','feed_slury','feed_s_cm','feed_s','feed_slurry_cm','feed_slurry');
  const s2slot   = findSlot('s2') || findSlot('feed_slury') || {
    key:'s2', fixedId:'feed_slury', id:'feed_slury', name:'Feed Slurry Water',
    shape:'persegi', orientasi:'vertikal', tinggi:1.5, panjang:6, lebar:2,
    sensorZeroCm:20, warnPct:40, critPct:15
  };
  const s2online = applyTankEl('feed_slury_tw1', s2slot, s2val);
  console.log(`[TW1] s2/feed_slury: rawVal=${s2val}, online=${s2online}`);

  // ── s1: Filter Water — Air Proses ────────────────────────────
  const s1val    = getVal(wl, 's1', 'air_proses', 's1_cm','s1','air_proses_cm','air_proses');
  const s1slot   = findSlot('s1') || findSlot('air_proses');
  const s1online = applyTankEl('air_proses', s1slot, s1val, '-fw');  // Update FILTER WATER section dengan suffix '-fw'

  // ── s9: Filter Water — Ground Tank A ─────────────────────────
  const s9val    = getVal(wl, 's9', 'ground_tank_a', 's9_cm','s9','ground_tank_a_cm','ground_tank_a','gnd_a_cm','gnd_a');
  const s9slot   = findSlot('s9') || findSlot('ground_tank_a');
  const gtaOnline = applyTankEl('ground_tank_a', s9slot, s9val, '-fw');
  _updateSectionStatus('filter', s1online || gtaOnline);

  // ── s10: WWTP — Ground Tank B ────────────────────────────────
  const s10val   = getVal(wl, 's10', 'ground_tank_b', 's10_cm','s10','ground_tank_b_cm','ground_tank_b','gnd_b_cm','gnd_b');
  const s10slot  = findSlot('s10') || findSlot('ground_tank_b');
  const gtbOnline = applyTankEl('ground_tank_b', s10slot, s10val);
  console.log(`[FW] s9/ground_tank_a: rawVal=${s9val}, online=${gtaOnline}`);
  console.log(`[WWTP] s10/ground_tank_b: rawVal=${s10val}, online=${gtbOnline}`);
  _updateSectionStatus('wwtp', gtbOnline);

  // ── s3: Tangki Solar ─────────────────────────────────────────
  const s3val    = getVal(wl, 's3', 'solar', 's3_cm','s3','solar_cm','solar');
  const s3slot   = findSlot('s3') || findSlot('solar');
  const s3online = applyTankEl('solar', s3slot, s3val);
  const s3dieselon = applyTankEl('solar', s3slot, s3val, '-diesel');  // Update DIESEL OIL TANK dengan suffix '-diesel'
  _updateSectionStatus('solar', s3online);
  _updateSectionStatus('dieseloil', s3dieselon);  // Update DIESEL OIL section status
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

function _updateTW1Status(s7online, s8online, s2online) {
  // Sensor list dots
  const d7 = document.getElementById('tw1-s7-dot');
  const t7 = document.getElementById('tw1-s7-txt');
  if (d7) d7.style.background = s7online ? '#22c55e' : '#94a3b8';
  if (t7) { t7.textContent = s7online ? 'ONLINE' : 'OFFLINE'; t7.style.color = s7online ? '#15803d' : '#94a3b8'; }

  const d8 = document.getElementById('tw1-s8-dot');
  const t8 = document.getElementById('tw1-s8-txt');
  if (d8) d8.style.background = s8online ? '#22c55e' : '#94a3b8';
  if (t8) { t8.textContent = s8online ? 'ONLINE' : 'OFFLINE'; t8.style.color = s8online ? '#15803d' : '#94a3b8'; }

  const d2 = document.getElementById('tw1-s2-dot');
  const t2 = document.getElementById('tw1-s2-txt');
  if (d2) d2.style.background = s2online ? '#22c55e' : '#94a3b8';
  if (t2) { t2.textContent = s2online ? 'ONLINE' : 'OFFLINE'; t2.style.color = s2online ? '#15803d' : '#94a3b8'; }

  const anyOnline = s7online || s8online || s2online;
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
    // Fetch 30 hari terakhir — ambil data terbaru meski bukan hari ini
    const res  = await fetch('/api/dataentry/laboratorium-harian?limit=200');
    const json = await res.json();

    // Kalau tidak ada data sama sekali, pertahankan tampilan terakhir
    if (!json.success || !json.data?.length) {
      console.log('💧 WQ: no data found');
      return;
    }

    // Cari entry terbaru per section dari semua data (newest first dari API)
    let wq = {};
    for (const row of json.data) {
      if (!row.water_quality || !Object.keys(row.water_quality).length) continue;
      for (const section of ['tw1','tw2','filter','chiller','wwtp']) {
        if (wq[section]) continue; // sudah ketemu entry terbaru, skip
        const sec = row.water_quality[section];
        if (!sec) continue;
        const latest = Array.isArray(sec) ? sec[sec.length - 1] : sec;
        if (latest && Object.values(latest).some(v => v !== null && v !== 'recorded_at')) {
          wq[section] = latest;
        }
      }
      // Kalau semua section sudah ketemu, stop loop
      if (['tw1','tw2','filter','chiller','wwtp'].every(s => wq[s])) break;
    }

    // Simpan ke cache lokal agar tidak hilang saat navigasi
    try { localStorage.setItem('sail_wq_cache', JSON.stringify(wq)); } catch(e) {}

    updateWQDisplay('tw2',     wq.tw2     || {});
    updateWQDisplay('tw1',     wq.tw1     || {});
    updateWQDisplay('filter',  wq.filter  || {});
    updateWQDisplay('chiller', wq.chiller || {});
    updateWQDisplay('wwtp',    wq.wwtp    || {});
    console.log('💧 WQ updated:', wq);
  } catch (err) {
    console.warn('fetchWaterQuality error:', err.message);
    // Coba load dari cache kalau fetch gagal
    try {
      const cached = JSON.parse(localStorage.getItem('sail_wq_cache') || '{}');
      if (Object.keys(cached).length) {
        updateWQDisplay('tw2',     cached.tw2     || {});
        updateWQDisplay('tw1',     cached.tw1     || {});
        updateWQDisplay('filter',  cached.filter  || {});
        updateWQDisplay('chiller', cached.chiller || {});
        updateWQDisplay('wwtp',    cached.wwtp    || {});
        console.log('💧 WQ loaded from cache');
      }
    } catch(e) {}
  }
}

function updateWQDisplay(section, data) {
  const d = Array.isArray(data) ? (data[data.length - 1] || {}) : (data || {});
  const s = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (val !== null && val !== undefined && val !== '') ? val : '—';
  };
  const bar = (id, val, max) => {
    const el = document.getElementById(id);
    if (!el || val == null) return;
    el.style.width = Math.min(100, Math.round((val / max) * 100)) + '%';
  };

  if (section === 'wwtp') {
    s('wwtp-cod-val', d.cod);
    s('wwtp-bod-val', d.bod);
    s('wwtp-ph-val',  d.ph);
    s('wwtp-tds-val', d.tds);
    // Update progress bars (COD max ~500, BOD max ~300)
    bar('wwtp-cod-bar', d.cod, 500);
    bar('wwtp-bod-bar', d.bod, 300);
  } else {
    s('wq-' + section + '-tds',      d.tds);
    s('wq-' + section + '-hardness', d.hardness);
    s('wq-' + section + '-ph',       d.ph);
    s('wq-' + section + '-alkaline', d.alkaline ?? d.alkali);
  }
}
window.fetchWaterQuality  = fetchWaterQuality;

// Auto-refresh WQ setiap 4 detik — sinkron dengan interval sensor
if (!window._wqRefreshInterval) {
  window._wqRefreshInterval = setInterval(fetchWaterQuality, 4000);
  console.log('💧 WQ auto-refresh setiap 4 detik aktif');
}
window.updateWQDisplay    = updateWQDisplay;


// ── Container Volume Overview ─────────────────────────────────────────────────
function renderContainerList() {
  const wrap = document.getElementById('container-overview-wrap');
  if (!wrap) return;
  
  const sensors = getSensors();
  if (!sensors.length) {
    wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txt3);font-size:12px">Tidak ada sensor yang dikonfigurasi</div>';
    return;
  }

  // Color palette from settings.js
  const SENSOR_COLORS = [
    { label: '#3b82f6', water: '#dbeafe' },      // blue
    { label: '#10b981', water: '#bbf7d0' },      // green
    { label: '#f59e0b', water: '#fed7aa' },      // amber
    { label: '#8b5cf6', water: '#d8b4fe' },      // purple
    { label: '#ec4899', water: '#fbcfe8' },      // pink
    { label: '#14b8a6', water: '#99f6e4' },      // teal
    { label: '#6366f1', water: '#a5b4fc' },      // indigo
    { label: '#06b6d4', water: '#a5f3fc' },      // cyan
    { label: '#0d9488', water: '#2dd4bf' },      // teal-600
    { label: '#7c3aed', water: '#e9d5ff' }       // violet
  ];
  
  let html = '';
  
  sensors.forEach((s, idx) => {
    const col = SENSOR_COLORS[idx % SENSOR_COLORS.length];
    const shape = s.shape || 'persegi';
    const orientasi = s.orientasi || 'vertikal';
    const maxLiter = Math.round(calcMaxVolumeLiter(s));
    const isFixed = !!(s.fixedId);
    
    // Get current water level data
    const wlData = window._lastWL || {};
    const rawCm = wlData[s.key + '_cm'] ?? wlData[s.key];
    const hasData = (rawCm !== null && rawCm !== undefined && rawCm !== '' && Number.isFinite(Number(rawCm)));
    
    let info = { pct: 0, pctLinear: 0, h: 0, isNonLinear: false };
    let curLiter = 0;
    if (hasData && s) {
      info = cmToInfo(s, Number(rawCm));
      curLiter = calcVolumeLiter(s, Number(rawCm));
    }
    
    // Dimensions display
    let dimStr;
    if (shape === 'silinder') {
      dimStr = orientasi === 'horizontal'
        ? `⌀${s.tinggi||1}m × L${s.panjang||2}m ↔`
        : `⌀${s.diameter||1}m × ${s.tinggi||1}m tinggi`;
    } else {
      dimStr = orientasi === 'horizontal'
        ? `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m ↔`
        : `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m`;
    }
    
    // Mini tank SVG (larger, like settings.js)
    let miniTank;
    if (shape === 'silinder') {
      miniTank = `
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <svg width="50" height="10" viewBox="0 0 50 10"><ellipse cx="25" cy="5" rx="20" ry="5" fill="var(--surface)" stroke="${col.label}" stroke-width="2"/></svg>
          <div style="width:50px;height:60px;border-left:2px solid ${col.label};border-right:2px solid ${col.label};position:relative;overflow:hidden;background:var(--surface)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:${hasData ? info.pctLinear : 0}%;background:${col.water};transition:height 1.2s ease"></div>
          </div>
          <svg width="50" height="10" viewBox="0 0 50 10"><ellipse cx="25" cy="5" rx="20" ry="5" fill="${col.label}" stroke="${col.label}" stroke-width="2" opacity=".8"/></svg>
        </div>`;
    } else {
      miniTank = `
        <div style="width:50px;height:70px;border:2px solid ${col.label};border-radius:5px 5px 8px 8px;position:relative;overflow:hidden;flex-shrink:0;background:var(--surface)">
          <div style="position:absolute;bottom:0;left:0;right:0;height:${hasData ? info.pctLinear : 0}%;background:${col.water};transition:height 1.2s ease"></div>
        </div>`;
    }
    
    const oriIcon = orientasi === 'horizontal' ? '↔' : '↕';
    const shapeIcon = shape === 'silinder' ? '⬤' : '▬';
    
    html += `
    <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-left:4px solid ${col.label};border-radius:12px;background:var(--bg);margin-bottom:10px">
      ${miniTank}
      <div style="flex:1;min-width:0">
        <!-- Header with badges -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <span style="font-size:13px;font-weight:700;color:var(--txt)">${s.name}</span>
          ${isFixed ? `<span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:100px;background:#f0fdf4;color:#15803d;border:1px solid #86efac">📌 Posisi Tetap</span>` : ''}
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${shape==='silinder'?'#f3f0ff':'#ebf2fd'};color:${shape==='silinder'?'var(--purple)':'var(--blue)'};">${shapeIcon} ${shape.charAt(0).toUpperCase()+shape.slice(1)}</span>
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${orientasi==='horizontal'?'#fff7ed':'#f0fdf4'};color:${orientasi==='horizontal'?'var(--orange)':'var(--green)'};">${oriIcon} ${orientasi.charAt(0).toUpperCase()+orientasi.slice(1)}</span>
        </div>
        
        <!-- Specs -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:10px;color:var(--txt3);margin-bottom:8px">
          <span>🔑 Key: <strong style="color:${col.label};font-weight:700">${s.key}</strong></span>
          <span>📐 ${dimStr}</span>
          <span>💧 ${maxLiter.toLocaleString('id-ID')} L</span>
          <span>📡 Zero: <strong>${s.sensorZeroCm ?? 0}cm</strong> = 100%</span>
          ${s.loc ? `<span>📍 ${s.loc}</span>` : ''}
        </div>
        
        <!-- Volume display -->
        <div style="font-size:10px;color:var(--txt);font-weight:600">
          ${hasData 
            ? `${Math.round(curLiter).toLocaleString('id-ID')} / ${maxLiter.toLocaleString('id-ID')} L`
            : '— / ' + maxLiter.toLocaleString('id-ID') + ' L'}
        </div>
      </div>
      
      <!-- Edit button -->
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="loadPage('tank-dimension-setting')" style="padding:5px 12px;background:${col.water};border:1px solid ${col.label};border-radius:7px;color:${col.label};font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">✏️ Edit</button>
      </div>
    </div>`;
  });
  
  wrap.innerHTML = html;
}
window.renderContainerList = renderContainerList;


// ── Water Quality History Modal ───────────────────────────────────────────────
const _WQ_SECTION_MAP = {
  'treatwater2': { key: 'tw2',     label: 'Harian Treat Water 2',   color: '#8b5cf6' },
  'treatwater1': { key: 'tw1',     label: 'Harian Treat Water 1',   color: '#6366f1' },
  'filterwater': { key: 'filter',  label: 'Harian Filter Water',    color: '#0ea5e9' },
  'chiller':     { key: 'chiller', label: 'Harian Chiller In & Out',color: '#0284c7' },
  'wwtp':        { key: 'wwtp',    label: 'Harian WWTP / Limbah',   color: '#dc2626' },
  'dieseloil':   { key: 'solar',   label: 'Solar Tank',             color: '#92400e' },
};

// ── HISTORY REKAM (dipanggil dari applyWL / updateNewSectionTanks) ──────────
window._wlHistory = window._wlHistory || {};

function _wlHistoryRecord(wl) {
  if (!wl) return;
  const ts = wl.created_at || new Date().toISOString();
  const sensors = (typeof getSensors === 'function') ? getSensors()
    : (typeof FIXED_TANK_SLOTS !== 'undefined' ? FIXED_TANK_SLOTS : []);
  sensors.forEach(s => {
    if (s.active === false) return;
    let raw = wl[s.key + '_cm'] ?? wl[s.key] ?? wl[s.fixedId + '_cm'] ?? wl[s.fixedId] ?? null;
    if (raw == null || parseFloat(raw) <= 0) return;
    const rawCm = Math.max(0, parseFloat(raw));
    let waterCm = rawCm, pct = 0, vol = 0;
    try {
      if (typeof cmToInfo === 'function') {
        const info = cmToInfo(s, rawCm);
        pct = info.pct;
        waterCm = +Math.max(0, info.h - +(s.sensorZeroCm ?? 0)).toFixed(1);
      }
      if (typeof calcVolumeLiter === 'function') vol = Math.round(calcVolumeLiter(s, rawCm));
    } catch(e) {}
    if (!window._wlHistory[s.fixedId]) window._wlHistory[s.fixedId] = [];
    const arr = window._wlHistory[s.fixedId];
    if (arr.length && arr[arr.length - 1].ts === ts) return;
    arr.push({ ts, rawCm, waterCm, pct, vol });
    if (arr.length > 500) arr.splice(0, arr.length - 500);
  });
}
window._wlHistoryRecord = _wlHistoryRecord;

// ── PETA SECTION → SENSOR ────────────────────────────────────────────────────
const _SECTION_SENSOR_MAP = {
  'treatwater2': ['boiler_fw'],
  'treatwater1': ['slury_1', 'slury_2', 'feed_slury'],
  'filterwater': ['air_proses', 'ground_tank_a'],
  'chiller':     ['tanu_edi', 'feed_edi'],
  'wwtp':        ['ground_tank_b'],
  'dieseloil':   ['solar'],
};

function _getSensorCfg(fixedId) {
  // Coba dari sensors.js (getSensors) dulu — lebih up-to-date dari API/localStorage
  if (typeof getSensors === 'function') {
    const s = getSensors().find(s => s.fixedId === fixedId || s.id === fixedId);
    if (s) return s;
  }
  // Fallback ke FIXED_TANK_SLOTS (defined di sensors.js)
  if (typeof FIXED_TANK_SLOTS !== 'undefined') {
    return FIXED_TANK_SLOTS.find(s => s.fixedId === fixedId) || null;
  }
  return null;
}

function _getSensorDOM(fixedId) {
  const sfxs = ['', '-fw', '-tw2', '-tw1', '-chiller', '-diesel'];
  let pct = '—%', cm = '— cm', vol = null;
  for (const sfx of sfxs) {
    const id = fixedId + sfx;
    const pe = document.getElementById('tank-pct-' + id);
    const ce = document.getElementById('tank-cm-'  + id);
    const ve = document.getElementById('tank-vol-' + id);
    if (pe && pe.textContent.trim() !== '—%' && pe.textContent.trim() !== '') pct = pe.textContent.trim();
    if (ce && ce.textContent.trim() !== '— cm' && ce.textContent.trim() !== '—') cm = ce.textContent.trim();
    if (ve && ve.textContent.trim() && !ve.textContent.startsWith('—')) vol = ve.textContent.trim();
  }
  return { pct, cm, vol };
}

// ── TAB: TINGGI AIR ──────────────────────────────────────────────────────────
async function renderTinggiAirTab(container, section, cfg) {
  const fixedIds = _SECTION_SENSOR_MAP[section] || [];
  if (!fixedIds.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">Sensor tidak terdaftar.</div>';
    return;
  }

  const cols = fixedIds.length === 1 ? '1fr' : fixedIds.length === 2 ? '1fr 1fr' : 'repeat(3,1fr)';
  let cardsHtml = `<div style="display:grid;grid-template-columns:${cols};gap:10px;margin-bottom:14px">`;

  fixedIds.forEach(fixedId => {
    const scfg = _getSensorCfg(fixedId);
    const dom  = _getSensorDOM(fixedId);
    const name = scfg ? scfg.name : fixedId;
    const maxV = (scfg && typeof calcMaxVolumeLiter === 'function')
      ? Math.round(calcMaxVolumeLiter(scfg)).toLocaleString('id-ID') + ' L' : '—';
    const pctNum = parseInt((dom.pct || '0').replace(/[^0-9]/g,'')) || 0;
    const barC = pctNum >= 60 ? '#22c55e' : pctNum >= 40 ? '#eab308' : '#ef4444';
    const barW = Math.max(2, Math.min(100, pctNum));

    cardsHtml += `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px">
        <div style="font-size:9px;font-weight:700;color:${cfg.color};letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;padding:5px 8px;background:${cfg.color}12;border-radius:6px">${name}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="background:#f8fafc;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">TINGGI AIR</div>
            <div style="font-size:16px;font-weight:800;color:${cfg.color};font-family:monospace">${dom.cm}</div>
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">PENUH</div>
            <div style="font-size:16px;font-weight:800;color:${cfg.color};font-family:monospace">${dom.pct}</div>
          </div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px">
          <div style="font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">VOLUME / KAPASITAS</div>
          <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px">${dom.vol || ('— / ' + maxV)}</div>
          <div style="background:#e2e8f0;border-radius:99px;height:5px;overflow:hidden">
            <div style="width:${barW}%;background:${barC};height:5px;border-radius:99px"></div>
          </div>
        </div>
      </div>`;
  });
  cardsHtml += '</div>';

  const noteHtml = `<div style="margin-bottom:14px;padding:9px 12px;background:#fef9ec;border:1px solid #fbbf24;border-radius:8px;font-size:10px;color:#92400e;font-family:monospace">
  </div>`;

  // ── LOAD HISTORY DARI DATABASE ────────────────────────────────────
  try {
    const res = await fetch('/api/iot/water-level?limit=500');
    const json = await res.json();
    if (json.success && json.data && json.data.length > 0) {
      // Map sensor column names ke fixedId (sesuai FIXED_TANK_SLOTS)
      const sensorMap = {
        's1_cm': 'air_proses',      's2_cm': 'feed_slury',
        's3_cm': 'solar',            's4_cm': 'tanu_edi',
        's5_cm': 'feed_edi',         's6_cm': 'boiler_fw',
        's7_cm': 'slury_1',          's8_cm': 'slury_2',
        's9_cm': 'ground_tank_a',    's10_cm': 'ground_tank_b',
        's11_cm': 'edi_cadangan',
        'p1': 'p1',                  'p2': 'p2'
      };
      
      // Process setiap row dari database
      json.data.forEach(row => {
        const ts = row.created_at;
        Object.entries(sensorMap).forEach(([colName, fixedId]) => {
          const rawCm = row[colName];
          if (rawCm == null || rawCm <= 0) return;
          if (!fixedIds.includes(fixedId)) return;
          
          const scfg = _getSensorCfg(fixedId);
          if (!scfg) return;
          
          // Kalkulasi pct dan vol
          let waterCm = rawCm, pct = 0, vol = 0;
          try {
            if (typeof cmToInfo === 'function') {
              const info = cmToInfo(scfg, rawCm);
              pct = info.pct;
              waterCm = +Math.max(0, info.h - +(scfg.sensorZeroCm ?? 0)).toFixed(1);
            }
            if (typeof calcVolumeLiter === 'function') vol = Math.round(calcVolumeLiter(scfg, rawCm));
          } catch(e) {}
          
          // Initialize array jika belum ada
          if (!window._wlHistory[fixedId]) window._wlHistory[fixedId] = [];
          const arr = window._wlHistory[fixedId];
          
          // Check duplikat timestamp
          if (arr.some(e => e.ts === ts)) return;
          
          arr.push({ ts, rawCm, waterCm, pct, vol });
        });
      });
    }
  } catch(err) {
    console.error('⚠️ Failed to load water level history from DB:', err.message);
  }

  // ── RENDER HISTORY ───────────────────────────────────────────────
  const allEntries = [];
  fixedIds.forEach(fixedId => {
    const scfg  = _getSensorCfg(fixedId);
    const name  = scfg ? scfg.name : fixedId;
    const maxVol = (scfg && typeof calcMaxVolumeLiter === 'function') ? Math.round(calcMaxVolumeLiter(scfg)) : null;
    (window._wlHistory[fixedId] || []).slice().reverse().forEach(e =>
      allEntries.push({ ...e, name, maxVol })
    );
  });
  allEntries.sort((a,b) => new Date(b.ts) - new Date(a.ts));

  let histHtml = '';
  if (!allEntries.length) {
    histHtml = `<div style="text-align:center;padding:28px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px">
      <div style="font-size:22px;margin-bottom:8px">📡</div>
      <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px">Riwayat belum ada</div>
      <div style="font-size:11px;color:#94a3b8">Terekam otomatis saat sensor aktif mengirim data (±5 detik).</div>
    </div>`;
  } else {
    const grp = {};
    allEntries.forEach(e => {
      const d = e.ts.substring(0,10);
      if (!grp[d]) grp[d] = [];
      grp[d].push(e);
    });
    const multiS = fixedIds.length > 1;
    histHtml = `<div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">
      📋 Riwayat Tinggi Air <span style="font-weight:400;font-size:9px;color:#94a3b8">(database · ${allEntries.length} pembacaan)</span>
    </div>`;
    Object.keys(grp).sort().reverse().forEach(tgl => {
      const rows = grp[tgl];
      const ds = new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      histHtml += `<div style="margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;color:${cfg.color};padding:6px 10px;background:${cfg.color}12;border-radius:6px;border-left:3px solid ${cfg.color};display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span>📅 ${ds}</span>
          <span style="font-size:9px;background:${cfg.color}22;padding:2px 8px;border-radius:99px">${rows.length} data</span>
        </div>`;
      rows.forEach((e, i) => {
        const jam = new Date(e.ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        const bg  = i % 2 === 0 ? '#fff' : '#f8fafc';
        const pc  = e.pct >= 60 ? '#16a34a' : e.pct >= 40 ? '#ca8a04' : '#dc2626';
        const bc  = e.pct >= 60 ? '#22c55e' : e.pct >= 40 ? '#eab308' : '#ef4444';
        const bw  = Math.max(2, Math.min(100, e.pct));
        const maxL = e.maxVol !== null ? e.maxVol.toLocaleString('id-ID') + ' L' : '—';
        const vL  = e.vol.toLocaleString('id-ID') + ' / ' + maxL;
        histHtml += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${bg};border:1px solid #f1f5f9;border-radius:8px;margin-bottom:4px">
          <div style="font-size:10px;color:#64748b;font-family:monospace;flex-shrink:0;min-width:68px">🕐 ${jam}</div>
          ${multiS ? `<div style="font-size:9px;font-weight:600;color:${cfg.color};flex-shrink:0;min-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name}</div>` : ''}
          <div style="flex:1;display:grid;grid-template-columns:80px 68px 1fr;gap:12px;align-items:center">
            <div><div style="font-size:8px;color:#94a3b8;margin-bottom:1px">TINGGI AIR</div><div style="font-size:15px;font-weight:700;color:${cfg.color};font-family:monospace">${e.waterCm} cm</div></div>
            <div><div style="font-size:8px;color:#94a3b8;margin-bottom:1px">PENUH</div><div style="font-size:15px;font-weight:700;color:${pc}">${e.pct}%</div></div>
            <div>
              <div style="font-size:8px;color:#94a3b8;margin-bottom:3px">VOLUME · ${vL}</div>
              <div style="background:#e2e8f0;border-radius:99px;height:4px;overflow:hidden"><div style="width:${bw}%;background:${bc};height:4px;border-radius:99px"></div></div>
            </div>
          </div>
        </div>`;
      });
      histHtml += '</div>';
    });
  }
  container.innerHTML = cardsHtml + noteHtml + histHtml;
}

// ── TAB: HARIAN LAB ──────────────────────────────────────────────────────────
async function renderHarianLabTab(container, section, cfg) {
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">⏳ Memuat data lab...</div>';
  try {
    const d0 = new Date(); d0.setDate(d0.getDate() - 30);
    const res  = await fetch('/api/dataentry/laboratorium-harian?tanggal_dari=' + d0.toISOString().split('T')[0] + '&limit=200');
    const json = await res.json();
    if (!json.success || !json.data?.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">📭 Belum ada data laboratorium</div>';
      return;
    }

    // Tanggal hari ini (lokal) untuk cek isToday
    const _now = new Date();
    const _today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;

    const grouped = {};
    for (const r of json.data) {
      const sec = r.water_quality?.[cfg.key];
      if (!sec) continue;

      // PRIORITAS: gunakan field 'tanggal' yang diisi user (bisa berbeda dari created_at)
      // Fallback ke created_at kalau tanggal tidak ada
      const userTanggal = r.tanggal || '';
      let tgl;
      if (userTanggal && userTanggal.length >= 10 && userTanggal[4] === '-') {
        // Plain YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss — ambil 10 char pertama
        tgl = userTanggal.substring(0, 10);
      } else if (userTanggal) {
        // Format lain — parse dan convert ke lokal
        const dt = new Date(userTanggal);
        tgl = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      } else if (r.created_at) {
        // Tidak ada tanggal user → pakai created_at sebagai lokal date
        const dt = new Date(r.created_at);
        tgl = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      } else {
        tgl = '—';
      }

      const ents = Array.isArray(sec) ? sec
        : (typeof sec === 'object' ? [{ ...sec, recorded_at: sec.updated_at || r.updated_at || r.created_at }] : []);
      const valid = ents.filter(e => e && Object.values(e).some(v => v != null && v !== '' && v !== 'recorded_at'));
      if (!valid.length) continue;
      if (!grouped[tgl]) grouped[tgl] = [];
      grouped[tgl].push(...valid);
    }
    if (!Object.keys(grouped).length) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">📭 Belum ada data analisa untuk section ini</div>';
      return;
    }
    const v = val => (val != null && val !== '') ? `<strong>${val}</strong>` : '<span style="color:#cbd5e1">—</span>';
    let html = '';
    Object.keys(grouped).sort().reverse().forEach(tgl => {
      const isToday = (tgl === _today);
      const entries = grouped[tgl].slice().sort((a,b) => new Date(b.recorded_at||0) - new Date(a.recorded_at||0));
      html += `<div style="margin-bottom:20px">
        <div style="font-size:10px;font-weight:700;color:${cfg.color};padding:6px 10px;background:${cfg.color}15;border-radius:6px;border-left:3px solid ${cfg.color};display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span>📅 ${(() => { const [y,m,d] = tgl.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); })()}</span>
          <span style="font-size:10px;background:${cfg.color}25;padding:2px 8px;border-radius:99px">${entries.length} entry</span>
        </div>
        <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0">JAM ENTRY</th>
            <th style="padding:8px 12px;text-align:center;color:#7c3aed;font-weight:700;border-bottom:2px solid #e2e8f0">TDS<br><span style="font-weight:400;font-size:10px">ppm</span></th>
            <th style="padding:8px 12px;text-align:center;color:#4f46e5;font-weight:700;border-bottom:2px solid #e2e8f0">HARDNESS<br><span style="font-weight:400;font-size:10px">mg/L</span></th>
            <th style="padding:8px 12px;text-align:center;color:#ca8a04;font-weight:700;border-bottom:2px solid #e2e8f0">PH</th>
            <th style="padding:8px 12px;text-align:center;color:#059669;font-weight:700;border-bottom:2px solid #e2e8f0">ALKALINE<br><span style="font-weight:400;font-size:10px">mg/L</span></th>
          </tr></thead>
          <tbody>${entries.map((e,i) => {
            // Kalau bukan hari ini → jam ditampilkan sebagai '-'
            const jam = isToday && e.recorded_at
              ? new Date(e.recorded_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
              : '—';
            const jamCell = jam === '—'
              ? `<span style="color:#cbd5e1;font-weight:600">—</span>`
              : `🕐 ${jam}`;
            return `<tr style="background:${i%2===0?'#fff':'#f8fafc'};border-bottom:1px solid #f1f5f9">
              <td style="padding:10px 12px;color:#374151;font-family:monospace;font-size:11px">${jamCell}</td>
              <td style="padding:10px 12px;text-align:center;color:#5b21b6">${v(e.tds)}</td>
              <td style="padding:10px 12px;text-align:center;color:#3730a3">${v(e.hardness)}</td>
              <td style="padding:10px 12px;text-align:center;color:#a16207">${v(e.ph)}</td>
              <td style="padding:10px 12px;text-align:center;color:#065f46">${v(e.alkaline ?? e.alkali)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>`;
    });
    container.innerHTML = html;
  } catch(err) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444">❌ Gagal: ${err.message}</div>`;
  }
}

// ── MODAL UTAMA 2 TAB ────────────────────────────────────────────────────────
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
  
  // Tentukan apakah show tab "Harian Lab"
  const hasLabTab = section !== 'dieseloil';
  
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:min(880px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden">
      <div style="padding:16px 22px 0;border-bottom:1px solid #f1f5f9;flex-shrink:0">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${cfg.color};text-transform:uppercase">${cfg.label}</div>
            <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px">Data Sensor &amp; Laporan Harian</div>
          </div>
          <button onclick="document.getElementById('wq-detail-modal').style.display='none'"
            style="background:#f1f5f9;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;flex-shrink:0;margin-left:12px">✕ Tutup</button>
        </div>
        <div style="display:flex;gap:4px">
          <button id="tab-btn-tinggiair" onclick="switchDetailTab('tinggiair','${section}')"
            style="padding:9px 22px;font-size:12px;font-weight:700;border:none;border-radius:8px 8px 0 0;cursor:pointer;background:${cfg.color};color:#fff;transition:.15s">
            💧 Tinggi Air</button>
          ${hasLabTab ? `<button id="tab-btn-harianlab" onclick="switchDetailTab('harianlab','${section}')"
            style="padding:9px 22px;font-size:12px;font-weight:700;border:none;border-radius:8px 8px 0 0;cursor:pointer;background:#f1f5f9;color:#64748b;transition:.15s">
            🧪 Harian Lab</button>` : ''}
        </div>
      </div>
      <div id="wq-tab-body" style="overflow-y:auto;flex:1;padding:18px 22px">
        <div style="text-align:center;padding:40px;color:#94a3b8">⏳</div>
      </div>
    </div>`;
  switchDetailTab('tinggiair', section);
}

function switchDetailTab(tab, section) {
  const cfg = _WQ_SECTION_MAP[section]; if (!cfg) return;
  const btnA = document.getElementById('tab-btn-tinggiair');
  const btnB = document.getElementById('tab-btn-harianlab');
  const body = document.getElementById('wq-tab-body'); if (!body) return;
  if (btnA) { btnA.style.background = '#f1f5f9'; btnA.style.color = '#64748b'; }
  if (btnB) { btnB.style.background = '#f1f5f9'; btnB.style.color = '#64748b'; }
  if (tab === 'tinggiair') {
    if (btnA) { btnA.style.background = cfg.color; btnA.style.color = '#fff'; }
    renderTinggiAirTab(body, section, cfg);
  } else {
    if (btnB) { btnB.style.background = cfg.color; btnB.style.color = '#fff'; }
    renderHarianLabTab(body, section, cfg);
  }
}

window.openSensorDetailModal = openSensorDetailModal;
window.switchDetailTab       = switchDetailTab;
window._wlHistoryRecord      = _wlHistoryRecord;