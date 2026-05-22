function swTab(tab, el) {
  _activeTab = tab;
  document.querySelectorAll('.iot-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  loadTable(tab);
}

async function loadTable(tab) {
  const c=$('tbl-cont'); if(!c) return;
  if(!espConnected){c.innerHTML='<div class="tbl-empty">Waiting for ESP…</div>';return;}
  c.innerHTML='<div class="tbl-empty" style="color:var(--txt3)">Memuat data…</div>';
  try {
    const j = await (await fetch(tabApi[tab])).json();
    if(!j.success||!j.data.length){c.innerHTML='<div class="tbl-empty">Belum ada data tersedia</div>';return;}
    const rows=j.data, keys=Object.keys(rows[0]);
    let h=`<table><thead><tr>${keys.map(k=>`<th>${k.replace(/_/g,' ')}</th>`).join('')}</tr></thead><tbody>`;
    rows.forEach(r=>{
      h+=`<tr>${keys.map(k=>{
        const v=r[k];
        if(k==='id') return `<td><span class="td-id">#${v}</span></td>`;
        if(k.includes('_at')) return `<td style="color:var(--txt3);font-size:11px">${fmtDT(v)}</td>`;
        return `<td>${v??'—'}</td>`;
      }).join('')}</tr>`;
    });
    c.innerHTML=h+'</tbody></table>';
  } catch(e){
    c.innerHTML=`<div class="tbl-empty">Gagal memuat data</div>`;
  }
}

// ══ LOGOUT ══════════════════════════════════════════
function confirmLogout() {
  // Show our styled modal instead of the ugly browser confirm()
  const overlay = document.getElementById('logout-overlay');
  const modal   = document.getElementById('logout-modal');
  overlay.style.display = 'flex';
  modal.style.display   = 'block';
}
function closeLogout() {
  // Hide the modal when user clicks Cancel or the dark overlay
  document.getElementById('logout-overlay').style.display = 'none';
  document.getElementById('logout-modal').style.display   = 'none';
}
function doLogout() {
  localStorage.removeItem('isLoggedin');
  localStorage.removeItem('user_id');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  window.location.href = '../Dashboard/Logout_Success.html';
}

// ── Hide nav items the current role cannot access ──
function filterNav() {
  const role  = localStorage.getItem('role') || 'admin';
  const allow = ROLE_ACCESS[role]; // null = admin, sees everything
  if (!allow) return;              // admin — nothing to hide

  // Hide individual nav items (sub-items and top-level items)
  document.querySelectorAll('[data-page]').forEach(el => {
    const page = el.getAttribute('data-page');
    if (!allow.includes(page)) {
      el.style.display = 'none';
    }
  });

  // If ALL sub-items in a nav-group are hidden, hide the whole group + its section label
  document.querySelectorAll('.nav-group').forEach(group => {
    const visibleItems = group.querySelectorAll('.nav-sub-item:not([style*="display: none"])');
    if (visibleItems.length === 0) {
      group.style.display = 'none';
      // Also hide the section label before this group
      const prev = group.previousElementSibling;
      if (prev && prev.classList.contains('nav-section-label')) {
        prev.style.display = 'none';
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// 3 NEW DASHBOARD WIDGETS
// ═══════════════════════════════════════════════════════════
function updateDashWidgets() {
  /* gauges are empty/untitled — reserved for future use */
}
function updateHealthWidget() {
  // reserved
}

// Refresh widgets every 30s
setInterval(updateDashWidgets, 30000);

// ═══════════════════════════════════════════════════════════
// WATER LEVEL ALERT SYSTEM
// ═══════════════════════════════════════════════════════════
let _wlAlertState = { warn: false, danger: false };
let _wlDangerInterval = null;

function _playDangerSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    play(880, 0, 0.18); play(660, 0.22, 0.18);
    play(880, 0.44, 0.18); play(660, 0.66, 0.18);
  } catch(e) {}
}

function _stopDangerSound() {
  if (_wlDangerInterval) { clearInterval(_wlDangerInterval); _wlDangerInterval = null; }
}

function checkWLAlerts(avgPct) {
  const sensors = getSensors();
  // Ambil last WL data dari cache jika ada
  const cached = window._lastWLData;
  if (cached && sensors.length) {
    sensors.forEach((s, i) => {
      let rawCm = cached[s.key + '_cm'] ?? cached[s.key] ?? cached['s'+(i+1)+'_cm'] ?? cached['s'+(i+1)] ?? null;
      if (rawCm === null) return;
      rawCm = Math.max(0, parseFloat(rawCm));
      const pct     = cmToPct(s, rawCm);
      const warnAt  = +(s.warnPct ?? 40);
      const critAt  = +(s.critPct ?? 15);
      const stateKey = 'w_' + s.id;
      const critKey  = 'c_' + s.id;
      const isDanger = pct <= critAt;
      const isWarn   = pct <= warnAt && pct > critAt;
      if (isDanger && !_wlAlertState[critKey]) {
        _wlAlertState[critKey] = true;
        _wlAlertState[stateKey] = true;
        showWLDangerAlert(pct, s.name);
      } else if (isWarn && !_wlAlertState[stateKey]) {
        _wlAlertState[stateKey] = true;
        showWLWarnAlert(pct, s.name);
      }
      if (pct > warnAt) {
        _wlAlertState[stateKey] = false; _wlAlertState[critKey] = false;
        _clearAlertForSensor(s.name, 'all'); // level kembali normal → hapus banner
      }
      if (pct > critAt) {
        _wlAlertState[critKey] = false;
        _clearAlertForSensor(s.name, 'danger'); // tidak lagi kritis → turunkan ke warn atau hapus
      }
    });
  } else {
    // fallback rata-rata
    const cfg    = JSON.parse(localStorage.getItem('wls_settings') || '{}');
    const warnAt = cfg.warn ?? 40;
    const critAt = cfg.crit ?? 15;
    const isWarn   = avgPct <= warnAt && avgPct > critAt;
    const isDanger = avgPct <= critAt;
    if (isDanger && !_wlAlertState.danger) {
      _wlAlertState.danger = true; _wlAlertState.warn = true;
      showWLDangerAlert(avgPct);
    } else if (isWarn && !_wlAlertState.warn) {
      _wlAlertState.warn = true;
      showWLWarnAlert(avgPct);
    }
    if (avgPct > warnAt) { _wlAlertState.warn = false; _wlAlertState.danger = false; }
    if (avgPct > critAt) { _wlAlertState.danger = false; }
  }
}

// ─── Alert Banner Strip helpers ────────────────────────────────
// _alertBanners: map dari key (sensor id atau 'avg') → { type:'warn'|'danger', dismissed:bool }
let _alertBanners = {};

function _renderAlertBanners() {
  const strip = document.getElementById('alert-banner-strip');
  if (!strip) return;

  // Kumpulkan semua alert yang aktif dan belum di-dismiss
  const active = Object.entries(_alertBanners).filter(([, v]) => v && !v.dismissed);

  if (!active.length) {
    strip.style.display = 'none';
    strip.innerHTML = '';
    return;
  }

  strip.style.display = 'flex';
  strip.innerHTML = active.map(([key, v]) => {
    const isDanger = v.type === 'danger';
    const icon  = isDanger ? '🚨' : '⚠️';
    const tag   = isDanger ? 'BAHAYA' : 'PERINGATAN';
    const label = v.label || key;
    const pct   = Math.round(v.pct ?? 0);
    const msg   = isDanger
      ? `<span class="alert-banner-text">${icon} <strong>${label}</strong> — Air kritis: <strong>${pct}%</strong> — Tindakan segera diperlukan!</span>`
      : `<span class="alert-banner-text">${icon} <strong>${label}</strong> — Level rendah: <strong>${pct}%</strong> — Segera periksa pasokan air.</span>`;
    return `<div class="alert-banner ${v.type}">
      <span class="alert-banner-tag">${tag}</span>
      ${msg}
      <button class="alert-banner-dismiss" onclick="dismissWLAlert('${key}')">✕ Tutup</button>
    </div>`;
  }).join('');
}

function showWLWarnAlert(pct, sensorName) {
  const key = sensorName || 'avg';
  // Jangan tampilkan warn kalau sudah ada danger untuk sensor yang sama
  if (_alertBanners[key]?.type === 'danger') return;
  _alertBanners[key] = { type: 'warn', pct, label: sensorName || 'Level Air', dismissed: false };
  _renderAlertBanners();
}

function showWLDangerAlert(pct, sensorName) {
  const key = sensorName || 'avg';
  _alertBanners[key] = { type: 'danger', pct, label: sensorName || 'Level Air', dismissed: false };
  _renderAlertBanners();
  _playDangerSound();
  _stopDangerSound();
  _wlDangerInterval = setInterval(() => {
    // Hanya bunyi kalau masih ada danger yang aktif dan belum di-dismiss
    const hasActiveDanger = Object.values(_alertBanners).some(v => v?.type === 'danger' && !v?.dismissed);
    if (hasActiveDanger) _playDangerSound();
    else _stopDangerSound();
  }, 3000);
}

function dismissWLAlert(key) {
  // key bisa 'warn'/'danger' (legacy) atau sensor name / 'avg'
  if (key === 'warn' || key === 'danger') {
    // Legacy call — dismiss semua banner tipe itu
    Object.keys(_alertBanners).forEach(k => {
      if (_alertBanners[k]?.type === key) _alertBanners[k].dismissed = true;
    });
  } else {
    if (_alertBanners[key]) _alertBanners[key].dismissed = true;
  }
  _renderAlertBanners();
  // Stop sound jika tidak ada danger aktif
  const hasActiveDanger = Object.values(_alertBanners).some(v => v?.type === 'danger' && !v?.dismissed);
  if (!hasActiveDanger) _stopDangerSound();
}
window.dismissWLAlert = dismissWLAlert;

// Saat sensor kembali normal → hapus bannernya otomatis
function _clearAlertForSensor(sensorName, clearType) {
  const key = sensorName || 'avg';
  if (_alertBanners[key] && (clearType === 'all' || _alertBanners[key]?.type === clearType)) {
    delete _alertBanners[key];
    _renderAlertBanners();
  }
}

// Hook into applyWL to trigger alerts
const _origApplyWL = applyWL;
applyWL = function(wl) {
  _origApplyWL(wl);
  if (!wl) return;
  const sensors = getSensors();
  let sum = 0;
  sensors.forEach((s, i) => {
    let rawCm = wl[s.key + '_cm'] ?? wl[s.key] ?? wl['s'+(i+1)+'_cm'] ?? wl['s'+(i+1)] ?? 0;
    rawCm = Math.max(0, parseFloat(rawCm));
    sum += cmToPct(s, rawCm);
  });
  const avg = sensors.length ? sum / sensors.length : 0;
  checkWLAlerts(avg);
};

// ═══════════════════════════════════════════════════════════
// SIDEBAR TOGGLE
// ═══════════════════════════════════════════════════════════
let _sidebarOpen = true;
let _sidebarHoverTimer = null;

function toggleSidebar() {
  _sidebarOpen = !_sidebarOpen;
  _applySidebar();
}

function openSidebar() {
  if (_sidebarOpen) return;
  _sidebarOpen = true;
  _applySidebar();
}

function _applySidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn     = document.getElementById('sidebar-toggle-btn');
  if (!sidebar || !btn) return;

  if (_sidebarOpen) {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
    btn.textContent = '◀';
    btn.title = 'Tutup sidebar';
  } else {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
    btn.textContent = '▶';
    btn.title = 'Buka sidebar';
  }
}

// When sidebar is open, hovering off the left edge keeps it open — nothing special needed.
// When collapsed, mouseleave on the ghost zone after a short delay closes it again.
document.addEventListener('DOMContentLoaded', () => {
  const ghost = document.getElementById('sidebar-ghost');
  if (!ghost) return;
  ghost.addEventListener('mouseleave', () => {
    // user moved mouse away from ghost zone — if sidebar re-opened via hover, close again
    _sidebarHoverTimer = setTimeout(() => {
      if (_sidebarOpen && document.body.classList.contains('sidebar-collapsed')) {
        // shouldn't happen, but guard
      }
    }, 300);
  });
});

// Also close sidebar when clicking the ghost zone (alternative open)
// Already handled via onmouseenter="openSidebar()" in HTML

// ══ BOOT ════════════════════════════════════════════
filterNav();
loadPage('iot');
// Trigger new widgets after short delay (DOM ready)
setTimeout(updateDashWidgets, 500);

// ── Start syncing sensor settings from database (shared across all accounts) ──
if (typeof startSensorSettingsSync === 'function') {
  setTimeout(() => {
    console.log('🔄 Starting sensor settings sync from database...');
    startSensorSettingsSync();
  }, 1000);
}