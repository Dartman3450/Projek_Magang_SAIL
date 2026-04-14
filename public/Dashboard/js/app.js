// ══ STATE ══════════════════════════════════════════
let espConnected = false;
let _activeTab   = 'water-level';

const API = {
  summary:    '/api/iot/dashboard/summary',
  waterLevel: '/api/iot/water-level',
  waterFlow:  '/api/iot/water-flow',
  lingkungan: '/api/iot/lingkungan',
  patroli:    '/api/iot/patroli',
};

// ══ UTILS ══════════════════════════════════════════
const $ = id => document.getElementById(id);
const set = (id, v) => { const el=$(id); if(el) el.textContent=v; };
const fmtT  = ts => ts ? new Date(ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '—';
const fmtDT = ts => ts ? new Date(ts).toLocaleString('id-ID') : '—';
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

// ══ CLOCK ══════════════════════════════════════════
setInterval(() => set('clock', new Date().toLocaleTimeString('id-ID')), 1000);

// ══ SIDEBAR ════════════════════════════════════════
function toggleNav(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('show');
}

// ── Role-based access control ──────────────────────────────────────
const ROLE_ACCESS = {
  admin:     null, // null = all pages allowed
  scientist: ['iot', 'laboratorium', 'reporting', 'change-password'],
  utility:   ['iot', 'utility',      'reporting', 'change-password'],
  limbah: ['iot', 'limbah',      'reporting', 'change-password'],
};
// ───────────────────────────────────────────────────────────────────

function loadPage(page) {
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const map = {
    iot:['Dashboard IoT','SAIL / Dashboard / Monitor IoT'],
    ongoing:['On Going Project','SAIL / Project / On Going'],
    completed:['Completed Project','SAIL / Project / Completed'],
    production:['Data Entry Production','SAIL / Data / Production'],
    utility:['Data Entry Utility','SAIL / Data / Utility'],
    laboratorium:['Data Entry Laboratorium','SAIL / Data / Laboratorium'],
    limbah:['Data Entry Limbah','SAIL / Data / Limbah'],
    reporting:['Reporting','SAIL / Reporting'],
    'change-email':['Change Email','SAIL / Setting / Email'],
    'change-password':['Change Password','SAIL / Setting / Password'],
    'tank-dimension-setting':['Change Containers Volume','SAIL / Setting / Sensor Manager'],
    'kartu-stok':['Kartu Stok','SAIL / Gudang / Kartu Stok'],
    'surat-jalan':['Surat Jalan','SAIL / Reporting / Surat Jalan'],
  };
  const [title, crumb] = map[page] || [page,'SAIL'];
  set('page-title', title);
  set('page-crumb', crumb);
  const content = $('content');
  if (page === 'iot') {
    renderIoT(content);
  } else if (page === 'ongoing') {
    content.innerHTML = getProjectHTML('ongoing','On Going Projects'); initProjectPage('ongoing');
  } else if (page === 'completed') {
    content.innerHTML = getProjectHTML('completed','Completed Projects'); initProjectPage('completed');
  } else if (page === 'production') {
    content.innerHTML = getDataEntryProduction('production','Data Entry Production','Record daily production data','🏭'); initDataEntryForm('production');
  } else if (page === 'utility') {
    content.innerHTML = getDataEntryUtility('utility','Data Entry Utility','Record daily utility data','⚡'); initDataEntryForm('utility');
  } else if (page === 'laboratorium') {
    content.innerHTML = getDataEntryLaboratorium('laboratorium','Data Entry Laboratory','Record daily laboratory data','🧪'); initDataEntryForm('laboratorium');
  } else if (page === 'limbah') {
    content.innerHTML = getDataEntryLimbah('limbah','Data Entry Waste','Record daily waste data','♻️'); initDataEntryForm('limbah');
  } else if (page === 'change-password') {
    content.innerHTML = getChangePasswordHTML();
  } else if (page === 'tank-dimension-setting') {
    content.innerHTML = getTankDimensionHTML();
    initTankDimensionSetting();
  } else if (page === 'reporting') {
    content.innerHTML = getReporting();
    initReportingForm();
  } else if (page === 'kartu-stok') {
    content.innerHTML = getKartuStokHTML();
    initKartuStok();
  } else if (page === 'surat-jalan') {
    content.innerHTML = getSuratJalanHTML();
    initSuratJalan();
  } else {
    content.innerHTML = `<div class="page-placeholder"><div class="ph-ico">🚧</div><h2>${title}</h2><p>This page is under development.</p></div>`;
  }
}

function getReporting(state) {
    return `
    <div class="de-wrap">
        <div class="de-header">
            <div>
                <h2 class="de-title">Report harian</h2>
                <p class="de-sub">SAIL / Reporting</p>
            </div>
        </div>

        <div class="de-card">
            <form id="reportForm">
                <div class="de-grid">
                    <div class="de-field de-full">
                        <label class="de-label">Judul Laporan</label>
                        <input type="text" class="de-input" placeholder="Contoh: Kerusakan Sensor Tanki A" required>
                    </div>

                    <div class="de-field">
                        <label class="de-label">Kategori Laporan</label>
                        <select class="de-input de-select">
                            <option value="teknis">Masalah Teknis</option>
                            <option value="operasional">Kegiatan Operasional</option>
                            <option value="keamanan">Keamanan/Patroli</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>

                    <div class="de-field">
                        <label class="de-label">Tingkat Prioritas</label>
                        <select class="de-input de-select">
                            <option value="low">Rendah</option>
                            <option value="medium">Sedang</option>
                            <option value="high">Tinggi/Urgent</option>
                        </select>
                    </div>
                </div>

                 <div class="Electricity">
                    <div class="Penggunaan Listrik">
                        <label class="de-label">Laporan penggunaan listrik</label>
                        <input type="text" class="de-input" placeholder="Contoh:100 volt / jam" required>
                    </div>

                 <div class="Utility report">
                    <div class="Durability & condition">
                        <label class = "de-label"> Laporan Durability Utility </label>
                        <select class="de-input de-select">
                            <option value="Baik">Rendah</option>
                            <option value="Normal">Sedang</option>
                            <option value="Rusak">Tinggi/Urgent</option>
                        </select>
                    </div>
                 <div class="Utility report">
                    <div class="Stok barang">
                       <label class="de-label">Laporan Stok barang<label><br>
                       <input type = "text" class="de-input" placeholder="Contoh teh = sisa 100kg">
                    </div>

                <div class="de-actions">
                    <button type="submit" class="de-btn de-btn-primary">Kirim Laporan</button>
                </div>
            </form>
        </div>
    </div>
    `;
    // Pastikan kode ini berjalan setelah DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.getElementById('mainContent'); // Pastikan ID ini sesuai dengan <section> kamu

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            if (page === 'reporting') {
                // Menghapus tulisan "Under development" dan menggantinya dengan form
                mainContent.innerHTML = getReporting();
                
                // Update judul di atas agar sesuai
                document.getElementById('pageTitle').innerText = "Reporting";
                document.getElementById('breadcrumb').innerText = "SAIL / Reporting";
            }
        });
    });
});
}


// ══ ESP STATUS ═════════════════════════════════════
function setEspStatus(state) {
  const badge = $('esp-badge');
  const label = $('esp-label');
  badge.className = 'esp-badge ' + state;
  if (state === 'connected') {
    label.innerHTML = 'ESP Connected';
  } else if (state === 'error') {
    label.innerHTML = 'Connection Failed';
  } else {
    label.innerHTML = 'Waiting for ESP<span class="dots"></span>';
  }
}

// ══ IOT RENDER ═════════════════════════════════════
function renderIoT(content) {
  content.innerHTML = getIoTHTML();
  initWidgets();
  renderTankCards();
  fetchSummary();
  setTimeout(updateDashWidgets, 200);
  // Clear any existing poll before setting new one
  if (window._poll) { clearInterval(window._poll); window._poll = null; }
  // Robust polling: setiap 5 detik, selalu fetch ulang
  window._poll = setInterval(() => {
    // Check if IoT page is still active (wl-tanks-container ada di DOM)
    if (!document.getElementById('wl-tanks-container')) {
      clearInterval(window._poll);
      window._poll = null;
      return;
    }
    fetchSummary();
  }, 5000);
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
      <div id="wl-tanks-container" style="min-height:130px;overflow:visible"></div>
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

    <!-- WATER FLOW -->
    <div class="s-card" style="--acc:var(--green)">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-wf')}
      <div class="s-label">Water Flow</div>
      <div class="s-header">
        <div>
          <div class="s-num" id="wf-val">—</div>
          <div class="s-unit">L/min</div>
          <div class="s-pill st-wait" id="wf-status">—</div>
        <button class="s-detail-btn" onclick="openDetail('water-flow')">Detail ↗</button>
        </div>
      </div>
      <div class="s-viz pipe-wrap">
        <div class="pipe-row">
          <div class="pipe-cap l"></div>
          <div class="pipe-seg"><div id="pfl"></div></div>
          <div class="fan-hub">
            <svg class="fan-svg" id="fan-svg" width="32" height="32" viewBox="0 0 40 40">
              <g transform="translate(20,20)">
                <ellipse rx="3" ry="7" transform="rotate(0)"   fill="#18a96a" opacity=".9"/>
                <ellipse rx="3" ry="7" transform="rotate(60)"  fill="#18a96a" opacity=".6"/>
                <ellipse rx="3" ry="7" transform="rotate(120)" fill="#18a96a" opacity=".4"/>
                <ellipse rx="3" ry="7" transform="rotate(180)" fill="#18a96a" opacity=".9"/>
                <ellipse rx="3" ry="7" transform="rotate(240)" fill="#18a96a" opacity=".6"/>
                <ellipse rx="3" ry="7" transform="rotate(300)" fill="#18a96a" opacity=".4"/>
                <circle r="4" fill="white" stroke="#18a96a" stroke-width="1.5"/>
                <circle r="1.5" fill="#18a96a"/>
              </g>
            </svg>
          </div>
          <div class="pipe-seg"><div id="pfr"></div></div>
          <div class="pipe-cap r"></div>
        </div>
        <div class="pipe-stats">
          <div class="ps"><div class="psl">SPEED</div><div class="psv" id="wf-rpm">—</div></div>
          <div class="ps"><div class="psl">VOLUME</div><div class="psv" id="wf-vol">—</div></div>
          <div class="ps"><div class="psl">UPDATE</div><div class="psv" style="color:var(--txt3)" id="wf-time">—</div></div>
        </div>
      </div>
    </div>

    <!-- TEMPERATURE -->
    <div class="s-card" style="--acc:var(--orange)">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-suhu')}
      <div class="s-label">Temperature</div>
      <div class="s-header">
        <div>
          <div class="s-num" id="suhu-val">—</div>
          <div class="s-unit">°C</div>
          <div class="s-pill st-wait" id="suhu-status">—</div>
        <button class="s-detail-btn" onclick="openDetail('lingkungan')">Detail ↗</button>
        </div>
      </div>
      <div class="s-viz thermo-wrap">
        <div class="thermo-col">
          <div class="thermo-tube"><div class="thermo-merc" id="thermo-merc" style="height:0%"></div></div>
          <div class="thermo-neck"></div>
          <div class="thermo-bulb" id="thermo-bulb"></div>
        </div>
        <div class="thermo-scale"><span>50°</span><span>40°</span><span>30°</span><span>20°</span><span>10°</span><span>0°</span></div>
        <div class="s-rows">
          <div class="irow"><span class="ik">TEMP</span><span class="iv" id="suhu-v2">—</span></div>
          <div class="irow"><span class="ik">CONDITION</span><span class="iv" id="suhu-cond">—</span></div>
          <div class="irow"><span class="ik">UPDATE</span><span class="iv" id="suhu-time">—</span></div>
        </div>
      </div>
    </div>

    <!-- HUMIDITY -->
    <div class="s-card" style="--acc:var(--yellow)">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-kel')}
      <div class="s-label">Humidity</div>
      <div class="s-header">
        <div>
          <div class="s-num" id="kel-val">—</div>
          <div class="s-unit">%RH</div>
          <div class="s-pill st-wait" id="kel-status">—</div>
        <button class="s-detail-btn" onclick="openDetail('lingkungan')">Detail ↗</button>
        </div>
      </div>
      <div class="s-viz hum-wrap">
        <div class="gauge-outer">
          <svg width="144" height="78" viewBox="0 0 156 86" style="overflow:visible">
            <defs>
              <linearGradient id="gGrd" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stop-color="#2b7de9"/>
                <stop offset="50%"  stop-color="#c99a0a"/>
                <stop offset="100%" stop-color="#dc3545"/>
              </linearGradient>
            </defs>
            <path d="M13 83 A65 65 0 0 1 143 83" stroke="#e4e8ed" stroke-width="11" fill="none" stroke-linecap="round"/>
            <path id="g-arc" d="M13 83 A65 65 0 0 1 143 83" stroke="url(#gGrd)" stroke-width="11" fill="none" stroke-linecap="round"
              stroke-dasharray="204" stroke-dashoffset="204" style="transition:stroke-dashoffset 1.6s ease"/>
            <text x="7"   y="84" font-family="DM Mono,monospace" font-size="8" fill="#a0aec0">0</text>
            <text x="70"  y="16" font-family="DM Mono,monospace" font-size="8" fill="#a0aec0">50</text>
            <text x="138" y="84" font-family="DM Mono,monospace" font-size="8" fill="#a0aec0">100</text>
            <g id="g-needle" transform="rotate(-90,78,83)">
              <line x1="78" y1="83" x2="78" y2="24" stroke="#c99a0a" stroke-width="2" stroke-linecap="round"/>
              <circle cx="78" cy="83" r="4.5" fill="#c99a0a" stroke="white" stroke-width="2"/>
            </g>
          </svg>
          <div class="gauge-ct"><div class="g-num" id="g-num">—</div><div class="g-unit">%RH</div></div>
        </div>
        <div class="drops-row" id="drops-row"></div>
      </div>
    </div>

    <!-- GAS -->
    <div class="s-card" style="--acc:var(--purple)">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-gas')}
      <div class="s-label">Gas Level</div>
      <div class="s-header">
        <div>
          <div class="s-num" id="gas-val">—</div>
          <div class="s-unit">ppm</div>
          <div class="s-pill st-wait" id="gas-status">—</div>
        <button class="s-detail-btn" onclick="openDetail('lingkungan')">Detail ↗</button>
        </div>
      </div>
      <div class="s-viz gas-wrap">
        <div class="gas-icon-row">
          <div class="gas-emoji">☁️</div>
          <div class="gas-bars">
            <div class="gbrow">
              <span class="gbl">VALUE</span>
              <div class="gbt"><div class="gbf" id="gbar-main" style="width:0%;background:linear-gradient(90deg,#18a96a,#6f52d9)"></div></div>
              <span class="gbv" id="gas-pct-lbl" style="color:var(--purple)">—</span>
            </div>
            <div class="gbrow">
              <span class="gbl" style="color:var(--green)">SAFE</span>
              <div class="gbt"><div class="gbf" style="width:50%;background:linear-gradient(90deg,rgba(24,169,106,.55),rgba(24,169,106,.1))"></div></div>
              <span class="gbv" style="color:var(--green)">300</span>
            </div>
            <div class="gbrow">
              <span class="gbl" style="color:var(--red)">MAX</span>
              <div class="gbt"><div class="gbf" style="width:100%;background:linear-gradient(90deg,rgba(220,53,69,.55),rgba(220,53,69,.1))"></div></div>
              <span class="gbv" style="color:var(--red)">600</span>
            </div>
          </div>
        </div>
        <div class="gas-ptcl" id="gas-ptcl"></div>
      </div>
    </div>

    <!-- PATROLI -->
    <div class="s-card" style="--acc:var(--blue)">
      <div class="s-bar"></div>
      ${ov.replace('ov-ID','ov-pat')}
      <div class="s-label">Patrol Report</div>
      <div class="s-header">
        <div>
          <div class="s-num" id="pat-total">—</div>
          <div class="s-unit">total reports</div>
          <button class="s-detail-btn" onclick="openDetail('patroli')">Detail ↗</button>
        </div>
      </div>
      <div class="s-viz patrol-wrap">
        <div class="pat-ring-outer">
          <svg viewBox="0 0 88 88" width="76" height="76">
            <defs>
              <linearGradient id="rGrd" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#2b7de9"/>
                <stop offset="100%" stop-color="#18a96a"/>
              </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="35" stroke="#e4e8ed" stroke-width="7" fill="none"/>
            <circle id="pat-ring" cx="44" cy="44" r="35"
              stroke="url(#rGrd)" stroke-width="7" fill="none"
              stroke-dasharray="220" stroke-dashoffset="220"
              transform="rotate(-90,44,44)"
              style="transition:stroke-dashoffset 1.6s ease;stroke-linecap:round"/>
          </svg>
          <div class="pat-ring-num" id="pat-ring-num">—</div>
        </div>
        <div class="pat-list" id="patrol-list">
          <div style="font-size:11px;color:var(--txt3)">—</div>
        </div>
      </div>
    </div>

  </div>

  <!-- TABLE -->
  <!-- 3 NEW DASHBOARD WIDGETS -->
  <div class="dash-new-grid" id="dash-new-widgets">

    <!-- Air baku -->
    <div class="d-widget" style="--wacc:var(--blue)">
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Air Baku</div>
      <p> Flow air</p>
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
    </div>

    <!-- Widget Filter water -->
    <div class="d-widget" style="--wacc:var(--blue)">
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Air Proses/Filter</div>
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
    </div>

    <!-- Widget Slurry Water -->
    <div class="d-widget" style="--wacc:var(--purple)">\
      <div class="d-widget-bar"></div>
      <div class="d-widget-label">Slurry water</div>
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
`;
}

// ══ INIT WIDGETS ═══════════════════════════════════
function initWidgets() {
  mkPipe('pfl',6); mkPipe('pfr',6);
  const dr=$('drops-row');
  if(dr) for(let i=0;i<7;i++){
    const d=document.createElement('div'); d.className='drp'; d.id='drp-'+i;
    d.style.cssText='height:6px;background:#e4e8ed;opacity:.3';
    dr.appendChild(d);
  }
  const gp=$('gas-ptcl');
  const gc=['#6f52d9','#a78bfa','#5b3fc9','#c4b5fd','#4c2ec4'];
  if(gp) for(let i=0;i<10;i++){
    const p=document.createElement('div'); p.className='gp';
    p.style.cssText=`background:${gc[i%5]};height:${8+Math.random()*14}px;animation-duration:${.6+Math.random()*.9}s;animation-delay:${Math.random()*.8}s`;
    gp.appendChild(p);
  }
}

function mkPipe(id,n){
  const c=$(id); if(!c) return;
  for(let i=0;i<n;i++){
    const p=document.createElement('div'); p.className='fp';
    p.style.cssText=`top:${7+Math.random()*6}px;height:${2+Math.random()*2}px;animation-duration:${.8+Math.random()*.9}s;animation-delay:${Math.random()*1.5}s;opacity:${.45+Math.random()*.4}`;
    c.appendChild(p);
  }
}

// ══ FETCH DATA (REAL API) ══════════════════════════
async function fetchSummary() {
  try {
    const res = await fetch(API.summary);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (!j.success) throw new Error(j.message || 'error');

    espConnected = true;
    setEspStatus('connected');
    showOverlays(false);

    const d = j.data;
    applyWL(d.water_level);
    applyWF(d.water_flow);
    applyEnv(d.lingkungan);
    applyPatroli(d.total_patroli);

  } catch(e) {
    console.warn('ESP tidak terhubung:', e.message);
    espConnected = false;
    setEspStatus('waiting');
    showOverlays(true);
    // table removed
  }
}

function showOverlays(show) {
  ['wl','wf','suhu','kel','gas','pat'].forEach(k=>{
    const ov=$('ov-'+k); if(ov) ov.classList.toggle('show', show);
  });
}

// ── Apply data ──────────────────────────────────────
// ── SENSOR COLOR PALETTE ─────────────────────────────────
const SENSOR_COLORS = [
  { border:'#2b7de9', water:'linear-gradient(180deg,#bfdffa,#3b9de8)', waterDark:'#2563eb', bg:'#eff6ff', text:'var(--blue)',   label:'#2b7de9' },
  { border:'#7c3aed', water:'linear-gradient(180deg,#d8b4fe,#7c3aed)', waterDark:'#6d28d9', bg:'#f5f3ff', text:'var(--purple)', label:'#7c3aed' },
  { border:'#18a96a', water:'linear-gradient(180deg,#6ee7b7,#059669)', waterDark:'#047857', bg:'#f0fdf4', text:'var(--green)',  label:'#18a96a' },
  { border:'#e07b2a', water:'linear-gradient(180deg,#fdba74,#c2410c)', waterDark:'#c2410c', bg:'#fff7ed', text:'var(--orange)', label:'#e07b2a' },
  { border:'#c99a0a', water:'linear-gradient(180deg,#fde68a,#b45309)', waterDark:'#a16207', bg:'#fefce8', text:'var(--yellow)', label:'#c99a0a' },
  { border:'#dc3545', water:'linear-gradient(180deg,#fca5a5,#b91c1c)', waterDark:'#991b1b', bg:'#fef2f2', text:'var(--red)',    label:'#dc3545' },
];

function getSensors() {
  const saved = localStorage.getItem('tank_sensors');
  if (saved) {
    // Migrate old sensors that don't have 'shape' field
    const sensors = JSON.parse(saved);
    sensors.forEach(s => { if (!s.shape) s.shape = 'persegi'; });
    return sensors;
  }
  // Default: 2 sensors — persegi (rectangular)
  return [
    { id:'s1', name:'Sensor 1', key:'s1', shape:'persegi', panjang:1, lebar:1, tinggi:1 },
    { id:'s2', name:'Sensor 2', key:'s2', shape:'persegi', panjang:1, lebar:1, tinggi:1 },
  ];
}

// ── Volume calculation based on shape ──────────────────────
// Returns volume in LITERS given sensor config and sensor distance reading (cm).
// rawCm = jarak sensor ke air (HC-SR04 di atas).
// Returns actual water volume in liters given rawCm reading from sensor
// Uses sensorZeroCm as the zero-offset (jarak sensor saat penuh = 100%)
function calcVolumeLiter(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape      = sensor.shape    || 'persegi';
  const orientasi  = sensor.orientasi || 'vertikal';
  const h = rawCmToWaterHeight(sensor, rawCm);

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      const r = tinggiTankiCm / 2;
      const L = +(sensor.panjang || 1) * 100;
      return Math.max(0, segmenVolume(h, r, L) / 1000);
    } else {
      const r = (+(sensor.diameter || 1) / 2) * 100;
      return (Math.PI * r * r * h) / 1000;
    }
  } else {
    const p = +(sensor.panjang || 1);
    const l = +(sensor.lebar   || 1);
    return p * l * (h / 100) * 1000;
  }
}

// Total volume (capacity at 100%) in liters — based on FULL physical tank height
function calcMaxVolumeLiter(sensor) {
  const shape     = sensor.shape     || 'persegi';
  const orientasi = sensor.orientasi || 'vertikal';
  const tinggiCm  = +(sensor.tinggi  || 1) * 100;

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      // Silinder rebah penuh = setengah lingkaran × 2 = lingkaran penuh × panjang
      const r = tinggiCm / 2;
      const L = +(sensor.panjang || 1) * 100;
      return (Math.PI * r * r * L) / 1000;
    } else {
      const r = (+(sensor.diameter || 1) / 2) * 100;
      return (Math.PI * r * r * tinggiCm) / 1000;
    }
  } else {
    // Persegi: kapasitas = p × l × tinggi (sama vertikal/horizontal)
    return +(sensor.panjang||1) * +(sensor.lebar||1) * (tinggiCm / 100) * 1000;
  }
}

// ═══════════════════════════════════════════════════════════════
// KONVERSI SENSOR → PERSENTASE
// ═══════════════════════════════════════════════════════════════
// HC-SR04 dipasang di ATAS tangki, mengukur jarak ke permukaan air.
//   rawCm        = jarak sensor ke permukaan air
//   sensorZeroCm = jarak sensor ke air saat tangki PENUH (offset fisik sensor)
//   tinggiTankiCm= total dimensi vertikal tangki (= diameter untuk silinder horizontal)
//
// h = tinggi air dari DASAR tangki (cm)
//   = sensorZeroCm + tinggiTankiCm - rawCm
//   → saat penuh: rawCm = sensorZeroCm  → h = tinggiTankiCm  ✓
//   → saat kosong: rawCm = sensorZeroCm + tinggiTankiCm → h = 0 ✓
//
// TANGKI VERTIKAL (persegi/silinder):
//   pct = h / tinggiTankiCm × 100  ← LINEAR, akurat
//
// TANGKI HORIZONTAL PERSEGI:
//   pct = h / tinggiTankiCm × 100  ← LINEAR, akurat
//   (tinggiTankiCm = dimensi vertikal = yang diukur sensor)
//
// TANGKI HORIZONTAL SILINDER ← NON-LINEAR!
//   h = tinggi air di cross-section lingkaran (0 → diameter)
//   Volume segmen lingkaran = L × r² × [arccos((r-h)/r) - ((r-h)/r)×√(2rh-h²)]
//   pct_volume = V(h) / V_max × 100
//   → 25% h ≈ 9.3% volume,  50% h = 50% volume,  75% h ≈ 90.7% volume

// Hitung tinggi air (h) dari dasar tangki berdasarkan rawCm sensor
function rawCmToWaterHeight(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const sensorZeroCm  = +(sensor.sensorZeroCm ?? 0);
  return Math.max(0, Math.min(sensorZeroCm + tinggiTankiCm - rawCm, tinggiTankiCm));
}

// Volume segmen lingkaran (cm³) — untuk silinder horizontal
// h = tinggi air dari dasar (0 ≤ h ≤ diameter=2r), r = jari-jari, L = panjang sumbu
function segmenVolume(h, r, L) {
  if (r <= 0 || L <= 0) return 0;
  if (h <= 0) return 0;
  if (h >= 2 * r) return Math.PI * r * r * L; // penuh = lingkaran penuh
  const hc  = Math.max(1e-9, Math.min(h, 2 * r - 1e-9));
  const cos = (r - hc) / r;                    // nilai ∈ (-1, 1)
  const sin = Math.sqrt(Math.max(0, 2 * r * hc - hc * hc));
  return L * r * r * (Math.acos(cos) - cos * sin / r);
}

// Konversi rawCm → { pct, hLinear, pctLinear }
//   pct       = persentase VOLUME yang benar (untuk ditampilkan & fill visual)
//   hLinear   = tinggi air linear dari dasar (cm) — untuk info tambahan
//   pctLinear = persentase tinggi linear (bukan volume) — untuk info tambahan
function cmToPct(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape         = sensor.shape     || 'persegi';
  const orientasi     = sensor.orientasi || 'vertikal';

  const h = rawCmToWaterHeight(sensor, rawCm);
  if (tinggiTankiCm <= 0) return 0;

  if (shape === 'silinder' && orientasi === 'horizontal') {
    // NON-LINEAR: hitung % berdasarkan volume aktual
    const r      = tinggiTankiCm / 2; // jari-jari = diameter/2
    const L      = +(sensor.panjang || 1) * 100;
    const vol    = segmenVolume(h, r, L);
    const maxVol = segmenVolume(2 * r, r, L); // volume penuh = lingkaran penuh × L
    if (maxVol <= 0) return 0;
    return Math.round(Math.max(0, Math.min(100, (vol / maxVol) * 100)));
  }

  // Vertikal & persegi horizontal: LINEAR
  return Math.round(Math.max(0, Math.min(100, (h / tinggiTankiCm) * 100)));
}

// Versi lengkap — kembalikan semua info (untuk applyWL)
function cmToInfo(sensor, rawCm) {
  const tinggiTankiCm = +(sensor.tinggi || 1) * 100;
  const shape         = sensor.shape     || 'persegi';
  const orientasi     = sensor.orientasi || 'vertikal';
  const h             = rawCmToWaterHeight(sensor, rawCm);

  const pctLinear = Math.round(Math.max(0, Math.min(100, (h / tinggiTankiCm) * 100)));

  if (shape === 'silinder' && orientasi === 'horizontal') {
    const r      = tinggiTankiCm / 2;
    const L      = +(sensor.panjang || 1) * 100;
    const vol    = segmenVolume(h, r, L);
    const maxVol = Math.PI * r * r * L; // volume silinder penuh = π r² L
    const pctVol = maxVol > 0
      ? Math.round(Math.max(0, Math.min(100, (vol / maxVol) * 100)))
      : 0;
    console.log(`[WL] ${sensor.name}: rawCm=${rawCm}, h=${h.toFixed(1)}cm, r=${r}cm, vol=${vol.toFixed(0)}cm³, maxVol=${maxVol.toFixed(0)}cm³, pctVol=${pctVol}%, pctLinear=${pctLinear}%`);
    return { pct: pctVol, pctLinear, h, isNonLinear: true };
  }

  return { pct: pctLinear, pctLinear, h, isNonLinear: false };
}

// Konversi % VOLUME → % TINGGI LINEAR (untuk posisi garis warn/crit di visual tangki silinder horizontal)
// pctVol 0-100, tinggiTankiCm = diameter tangki
// Gunakan binary search karena fungsi segmenVolume tidak invertible secara analitik
function pctVolToLinear(pctVol, tinggiTankiCm) {
  if (pctVol <= 0) return 0;
  if (pctVol >= 100) return 100;
  const r = tinggiTankiCm / 2;
  const maxVol = segmenVolume(2 * r, r, 1); // L=1 karena kita cari rasio
  const targetVol = (pctVol / 100) * maxVol;
  // Binary search h ∈ [0, 2r]
  let lo = 0, hi = 2 * r;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (segmenVolume(mid, r, 1) < targetVol) lo = mid; else hi = mid;
  }
  return Math.round(((lo + hi) / 2) / tinggiTankiCm * 100);
}

function renderTankCards() {
  const container = document.getElementById('wl-tanks-container');
  if (!container) return;
  const sensors = getSensors();
  const n = sensors.length;

  // Set responsive grid class based on count
  container.className = '';
  container.classList.add('tanks-' + Math.min(n, 10));

  container.innerHTML = sensors.map((s, i) => {
    const col       = SENSOR_COLORS[i % SENSOR_COLORS.length];
    const shape     = s.shape     || 'persegi';
    const orientasi = s.orientasi || 'vertikal';
    const maxVol    = Math.round(calcMaxVolumeLiter(s));
    const tinggiM   = +(s.tinggi || 1);
    const warnPct   = +(s.warnPct ?? 40);
    const critPct   = +(s.critPct ?? 15);
    const sensorZeroCm = +(s.sensorZeroCm ?? 0);
    const isHoriz   = orientasi === 'horizontal';

    // ── HORIZONTAL TANK CARD (Improved Design) ─────────────────────────────────
    if (isHoriz) {
      const tankW  = 100;  // Increased width for better proportion
      const tankH  = shape === 'silinder' ? 48 : 40;
      const ellW   = 16;   // Slightly wider ellipse
      const tinggiTankiCm = tinggiM * 100;

      // Volume % to linear % conversion for cylinder
      const warnLineH = (shape === 'silinder')
        ? pctVolToLinear(warnPct, tinggiTankiCm)
        : warnPct;
      const critLineH = (shape === 'silinder')
        ? pctVolToLinear(critPct, tinggiTankiCm)
        : critPct;

      let bodyHTML;
      if (shape === 'silinder') {
        // IMPROVED: Better 3D cylinder with gradient and depth
        bodyHTML = `
          <div style="display:flex;align-items:center;position:relative;filter:drop-shadow(0 2px 4px rgba(0,0,0,.08));">
            <!-- Left ellipse (back) -->
            <svg width="${ellW}" height="${tankH}" viewBox="0 0 ${ellW} ${tankH}" style="flex-shrink:0;display:block">
              <defs>
                <linearGradient id="ellGrad${s.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${col.border}" stop-opacity="0.4"/>
                  <stop offset="50%" stop-color="${col.border}" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="${col.border}" stop-opacity="0.9"/>
                </linearGradient>
              </defs>
              <ellipse cx="${ellW/2}" cy="${tankH/2}" rx="${ellW/2-1}" ry="${tankH/2-2}" 
                fill="url(#ellGrad${s.id})" stroke="${col.border}" stroke-width="1.5"/>
            </svg>
            <!-- Cylinder body with improved shading -->
            <div id="tank-body-${s.id}" style="width:${tankW}px;height:${tankH}px;border-top:1.5px solid ${col.border};border-bottom:1.5px solid ${col.border};position:relative;overflow:hidden;background:linear-gradient(180deg, ${col.bg || 'var(--bg)'} 0%, #f8f9fa 50%, ${col.bg || 'var(--bg)'} 100%);flex-shrink:0;box-shadow:inset 0 -2px 4px rgba(0,0,0,.03),inset 0 2px 4px rgba(255,255,255,.3);">
              <!-- Water fill with realistic gradient -->
              <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg, ${col.water} 0%, ${col.waterDark || col.water} 100%);height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1);box-shadow:inset 0 2px 6px rgba(0,0,0,.1);">
                <!-- Animated water surface -->
                <div style="position:absolute;top:-4px;left:0;right:0;height:6px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%;"></div>
                <!-- Bubbles -->
                <div class="bbl" style="width:3px;height:3px;left:25%;animation-duration:${2.5+i*.3}s"></div>
                <div class="bbl" style="width:2.5px;height:2.5px;left:55%;animation-duration:${3+i*.2}s;animation-delay:.4s"></div>
                <div class="bbl" style="width:2px;height:2px;left:75%;animation-duration:${2.8+i*.2}s;animation-delay:.8s"></div>
              </div>
              <!-- Warning line -->
              <div style="position:absolute;left:0;right:0;bottom:${warnLineH}%;height:2px;background:linear-gradient(90deg,transparent,var(--yellow),transparent);opacity:.85;pointer-events:none" title="WARNING ${warnPct}%"></div>
              <!-- Critical line -->
              <div style="position:absolute;left:0;right:0;bottom:${critLineH}%;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent);opacity:.85;pointer-events:none" title="DANGER ${critPct}%"></div>
              <!-- Orientation label -->
              <div style="position:absolute;top:3px;left:4px;font-size:7px;color:${col.border};font-weight:700;opacity:.5;letter-spacing:.5px;pointer-events:none">↔ HORIZONTAL</div>
              <!-- Subtle depth shading -->
              <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.02) 0%, transparent 15%, transparent 85%, rgba(0,0,0,.02) 100%);pointer-events:none;"></div>
            </div>
            <!-- Right ellipse (front, solid) -->
            <svg width="${ellW}" height="${tankH}" viewBox="0 0 ${ellW} ${tankH}" style="flex-shrink:0;display:block">
              <defs>
                <radialGradient id="ellGradFront${s.id}">
                  <stop offset="0%" stop-color="${col.border}" stop-opacity="0.6"/>
                  <stop offset="70%" stop-color="${col.border}" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="${col.border}" stop-opacity="1"/>
                </radialGradient>
              </defs>
              <ellipse cx="${ellW/2}" cy="${tankH/2}" rx="${ellW/2-1}" ry="${tankH/2-2}" 
                fill="url(#ellGradFront${s.id})" stroke="${col.border}" stroke-width="1.5"/>
            </svg>
          </div>`;
      } else {
        // Persegi rebah dengan slight improvement
        bodyHTML = `
          <div id="tank-body-${s.id}" style="width:${tankW+ellW*2}px;height:${tankH}px;border:1.5px solid ${col.border};border-radius:6px;position:relative;overflow:hidden;background:var(--bg);box-shadow:0 1px 3px rgba(0,0,0,.06);">
            <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:${col.water};height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1);">
              <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%"></div>
              <div class="bbl" style="width:3px;height:3px;left:30%;animation-duration:${2.5+i*.3}s"></div>
              <div class="bbl" style="width:2px;height:2px;left:70%;animation-duration:${3+i*.2}s;animation-delay:.6s"></div>
            </div>
            <div style="position:absolute;left:0;right:0;bottom:${warnLineH}%;height:1.5px;background:var(--yellow);opacity:.8;pointer-events:none" title="WARNING ${warnPct}%"></div>
            <div style="position:absolute;left:0;right:0;bottom:${critLineH}%;height:1.5px;background:var(--red);opacity:.8;pointer-events:none" title="DANGER ${critPct}%"></div>
            <div style="position:absolute;top:2px;left:3px;font-size:7px;color:${col.border};font-weight:700;opacity:.6;pointer-events:none">↔ HORIZONTAL</div>
          </div>`;
      }

      // Side scale for horizontal tank
      const sideScale = `
        <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0;margin-right:3px">
          <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3);font-weight:500">⌀100</span>
          <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3);font-weight:500">⌀50</span>
          <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3);font-weight:500">⌀0</span>
        </div>`;

      return `
        <div class="tank-card-cell" style="border-top: 3px solid ${col.border};align-items:flex-start">
          <div style="font-size:9px;font-weight:700;color:${col.label};letter-spacing:.8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;width:100%">${s.name.toUpperCase()}</div>
          <div style="font-size:7px;color:var(--txt3);margin-bottom:6px;width:100%;text-align:center">${shape === 'silinder' ? '⬤ Silinder' : '▬ Persegi'} ↔ Horizontal · ≤${sensorZeroCm}cm=100%</div>
          <div style="display:flex;align-items:center;gap:4px;width:100%;justify-content:center">
            ${sideScale}
            ${bodyHTML}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:6px">
            <div id="tank-pct-${s.id}" style="font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:${col.label};line-height:1.3">—%</div>
            <div id="tank-vol-${s.id}" style="font-family:'DM Mono',monospace;font-size:9px;font-weight:600;color:${col.label}">— L</div>
          </div>
          <div id="tank-cm-${s.id}" style="font-size:8px;color:var(--txt3);width:100%">— cm terisi</div>
          <div style="font-size:7px;color:var(--txt3)">max ${maxVol.toLocaleString('id-ID')} L</div>
        </div>
      `;
    }

    // ── VERTICAL TANK CARD ────────────────────────────────────
    // Tangki vertikal: tampil portrait, air mengisi dari bawah (tinggi berkurang saat air turun)
    const isTall = tinggiM >= 1.5;
    const isWide = shape !== 'silinder' && ((+(s.panjang||1)) >= 2 || (+(s.lebar||1)) >= 2);
    let tankW = isWide ? 60 : 48, tankH = isTall ? 110 : 90;
    let borderRadius = '4px 4px 6px 6px';
    let topSvg = '';

    if (shape === 'silinder') {
      tankW = isTall ? 48 : 44;
      tankH = isTall ? 110 : 90;
      borderRadius = '0 0 50% 50% / 0 0 10px 10px';
      topSvg = `<svg width="${tankW}" height="12" viewBox="0 0 ${tankW} 12" style="display:block;margin-bottom:-2px">
        <ellipse cx="${tankW/2}" cy="6" rx="${tankW/2-1}" ry="5" fill="var(--bg)" stroke="${col.border}" stroke-width="1.5"/>
      </svg>`;
    }

    return `
      <div class="tank-card-cell" style="border-top: 3px solid ${col.border}">
        <div style="font-size:9px;font-weight:700;color:${col.label};letter-spacing:.8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${s.name.toUpperCase()}</div>
        <div style="font-size:7px;color:var(--txt3);margin-bottom:2px">${shape === 'silinder' ? '⬤ Silinder' : '▬ Persegi'} ↕ Vertikal · ≤${sensorZeroCm}cm=100%</div>
        <div style="display:flex;align-items:flex-end;gap:5px">
          <div style="display:flex;flex-direction:column;align-items:center">
            ${topSvg}
            <div id="tank-body-${s.id}" style="width:${tankW}px;height:${tankH}px;border:1.5px solid ${col.border};border-radius:${borderRadius};position:relative;overflow:hidden;background:var(--bg)">
              <!-- Air mengisi dari bawah, ketika air turun → tinggi (height) berkurang -->
              <div id="tank-water-${s.id}" style="position:absolute;bottom:0;left:0;right:0;background:${col.water};height:0%;transition:height 1.8s cubic-bezier(.34,1.2,.64,1)">
                <div style="position:absolute;top:-3px;left:0;right:0;height:6px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:wsurf 3s ease-in-out infinite;border-radius:50%"></div>
                <div class="bbl" style="width:3px;height:3px;left:25%;animation-duration:${2.5+i*.3}s"></div>
                <div class="bbl" style="width:2px;height:2px;left:65%;animation-duration:${3+i*.2}s;animation-delay:.8s"></div>
              </div>
              ${shape === 'silinder' ? `<div style="position:absolute;bottom:0;left:0;right:0;height:8px;border-radius:0 0 50% 50%;background:${col.border};opacity:.15;pointer-events:none"></div>` : ''}
              <!-- warn line --><div style="position:absolute;left:0;right:0;bottom:${warnPct}%;height:2px;background:var(--yellow);opacity:.75;pointer-events:none" title="WARNING ${warnPct}%"></div>
              <!-- crit line --><div style="position:absolute;left:0;right:0;bottom:${critPct}%;height:2px;background:var(--red);opacity:.75;pointer-events:none" title="DANGER ${critPct}%"></div>
              <!-- zero line (sensor zero) -->${sensorZeroCm > 0 ? `<div style="position:absolute;left:0;right:0;top:0;height:2px;background:var(--blue);opacity:.4;pointer-events:none" title="Sensor 0 = ${sensorZeroCm}cm = 100%"></div>` : ''}
            </div>
          </div>
          <!-- Skala tinggi vertikal -->
          <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0">
            <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3)">100%</span>
            <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3)">50%</span>
            <span style="font-family:'DM Mono',monospace;font-size:6px;color:var(--txt3)">0%</span>
          </div>
        </div>
        <div id="tank-pct-${s.id}" style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:${col.label}">—%</div>
        <div id="tank-cm-${s.id}" style="font-size:8px;color:var(--txt3)">— cm air</div>
        <div id="tank-vol-${s.id}" style="font-family:'DM Mono',monospace;font-size:9px;font-weight:600;color:${col.label}">— L</div>
        <div style="font-size:7px;color:var(--txt3)">max ${maxVol.toLocaleString('id-ID')} L</div>
      </div>
    `;
  }).join('');
}

function applyWL(wl) {
  if (!wl) return;
  window._lastWLData = wl;
  set('wl-time', fmtT(wl.created_at));
  const sensors = getSensors();
  let grandTotal = 0;
  let sumPct = 0;
  const volRows = document.getElementById('wl-vol-rows');
  const volRowsHTML = [];

  sensors.forEach((s, i) => {
    let rawCm = wl[s.key + '_cm'] ?? wl[s.key] ?? wl['s'+(i+1)+'_cm'] ?? wl['s'+(i+1)] ?? null;
    if (rawCm === null) return;
    rawCm = Math.max(0, parseFloat(rawCm));

    // Gunakan cmToInfo untuk mendapat % volume (akurat) DAN % linear (untuk info tambahan)
    const info = cmToInfo(s, rawCm);
    const pct        = info.pct;        // % volume — yang dipakai untuk fill visual & alert
    const pctLinear  = info.pctLinear;  // % tinggi linear — info tambahan
    const waterCm    = +info.h.toFixed(1); // tinggi air dari dasar (cm)
    const isNonLinear = info.isNonLinear;  // true jika silinder horizontal
    sumPct += pct;

    // Update visual: fill air menggunakan % LINEAR agar tampilan tangki proporsional secara visual
    // tapi label persentase menampilkan % VOLUME yang akurat
    // Untuk silinder horizontal: visual fill = pctLinear (agar gambar tangki terlihat benar)
    // Angka % yang ditampilkan = pct (volume-based, akurat)
    const tw = document.getElementById('tank-water-' + s.id);
    if (tw) tw.style.height = pctLinear + '%'; // fill visual proporsional terhadap tinggi air

    const tp = document.getElementById('tank-pct-' + s.id);
    if (tp) {
      const critAt = +(s.critPct ?? 15), warnAt = +(s.warnPct ?? 40);
      const clr = pct <= critAt ? 'var(--red)' : pct <= warnAt ? 'var(--orange)' : SENSOR_COLORS[i % SENSOR_COLORS.length].label;
      if (isNonLinear) {
        // Silinder horizontal: tampilkan % volume + keterangan tinggi linear
        tp.innerHTML = `<span style="font-size:12px;font-weight:700;color:${clr}">${pct}%</span><span style="font-size:7px;color:var(--txt3);display:block;line-height:1.2">vol · ${pctLinear}% tinggi</span>`;
      } else {
        tp.textContent = pct + '%';
        tp.style.color = clr;
      }
    }

    const tcm = document.getElementById('tank-cm-' + s.id);
    if (tcm) {
      const isHoriz = (s.orientasi || 'vertikal') === 'horizontal';
      if (isHoriz && isNonLinear) {
        tcm.textContent = waterCm.toFixed(1) + ' cm terisi (dari bawah ⌀)';
      } else if (isHoriz) {
        tcm.textContent = waterCm.toFixed(1) + ' cm tinggi air';
      } else {
        tcm.textContent = waterCm.toFixed(1) + ' cm air';
      }
    }

    const vol    = Math.round(calcVolumeLiter(s, rawCm));
    const maxVol = Math.round(calcMaxVolumeLiter(s));
    grandTotal += vol;
    const tv = document.getElementById('tank-vol-' + s.id);
    if (tv) tv.textContent = vol.toLocaleString('id-ID') + ' L';

    const col = SENSOR_COLORS[i % SENSOR_COLORS.length];
    if (isNonLinear) {
      // Tampilkan info lengkap untuk silinder horizontal
      volRowsHTML.push(`
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:${col.label};font-weight:600">${s.name} <span style="font-weight:400;color:var(--txt3)">↔⬤</span></span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt)">
            ${vol.toLocaleString('id-ID')} L
            <span style="color:var(--txt3);font-size:8px">(vol: ${pct}% · tinggi: ${pctLinear}% · ${waterCm}cm ⌀)</span>
          </span>
        </div>`);
    } else {
      const isHoriz = (s.orientasi || 'vertikal') === 'horizontal';
      volRowsHTML.push(`
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;color:${col.label};font-weight:600">${s.name}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--txt)">${vol.toLocaleString('id-ID')} L <span style="color:var(--txt3);font-size:8px">(${pct}% · ${waterCm}cm ${isHoriz ? '↔' : 'air'})</span></span>
        </div>`);
    }
  });

  if (volRows) volRows.innerHTML = volRowsHTML.join('');
  set('wl-vol-total', grandTotal.toLocaleString('id-ID') + ' L');

  const avg = sensors.length ? sumPct / sensors.length : 0;
  pill('wl-status', avg, 70, 90);
}

function applyWF(wf) {
  if(!wf) return;
  const v = +(wf.rate ?? wf.flow_rate ?? wf.flow ?? 0);
  set('wf-val', v);
  set('wf-rpm', Math.round(v*8)+' rpm');
  set('wf-vol', (wf.total ?? '—')+' mL');
  set('wf-time', fmtT(wf.created_at));
  const fan=$('fan-svg');
  if(fan) fan.style.animationDuration = v>0 ? Math.max(.2,5/v)+'s' : '20s';
  document.querySelectorAll('.fp').forEach(p=>{
    p.style.animationPlayState = v>0?'running':'paused';
    p.style.animationDuration  = v>0?(1.2/Math.max(v,.5))+'s':'2s';
  });
  pill('wf-status', v, 80, 120);
}

function applyEnv(env) {
  if(!env) return;
  const suhu = +(env.t ?? env.suhu ?? env.temperature ?? 0);
  const lemb = +(env.h ?? env.kelembapan ?? env.humidity ?? 0);
  const gas  = +(env.raw ?? env.gas ?? env.gas_value ?? 0);

  set('suhu-val', suhu); set('suhu-v2', suhu+'°C'); set('suhu-time', fmtT(env.created_at));
  const merc=$('thermo-merc'); if(merc) merc.style.height=clamp(suhu/50*100,0,100)+'%';
  let cond='NORMAL', bb='radial-gradient(circle at 35% 35%,#93c5fd,#1d4ed8)';
  if(suhu>=38){cond='SANGAT PANAS';bb='radial-gradient(circle at 35% 35%,#fca5a5,#b91c1c)';}
  else if(suhu>=35){cond='PANAS';bb='radial-gradient(circle at 35% 35%,#fdba74,#c2410c)';}
  else if(suhu>=30){cond='HANGAT';bb='radial-gradient(circle at 35% 35%,#fed7aa,#ea580c)';}
  set('suhu-cond', cond);
  const bulb=$('thermo-bulb'); if(bulb) bulb.style.background=bb;
  pill('suhu-status', suhu, 35, 40);

  set('kel-val', lemb); set('g-num', lemb);
  const arc=$('g-arc'); if(arc) arc.style.strokeDashoffset=204-(lemb/100)*204;
  const ndl=$('g-needle'); if(ndl) ndl.setAttribute('transform',`rotate(${-90+(lemb/100)*180},78,83)`);
  for(let i=0;i<7;i++){
    const drp=$('drp-'+i); if(!drp) continue;
    const active=(lemb/100*7)>i;
    drp.style.height=(active?11+i*2:6)+'px';
    drp.style.opacity=active?'.8':'.2';
    drp.style.background=lemb>90?'var(--red)':lemb>75?'var(--yellow)':'var(--blue)';
  }
  pill('kel-status', lemb, 80, 95);

  const maxG=600, gPct=clamp(Math.round(gas/maxG*100),0,100);
  set('gas-val', gas); set('gas-pct-lbl', gPct+'%');
  const gbar=$('gbar-main');
  if(gbar){
    gbar.style.width=gPct+'%';
    gbar.style.background=gas>=500?'linear-gradient(90deg,#e07b2a,#dc3545)':gas>=300?'linear-gradient(90deg,#c99a0a,#e07b2a)':'linear-gradient(90deg,#18a96a,#6f52d9)';
  }
  document.querySelectorAll('.gp').forEach((p,i)=>{
    p.style.animationDuration=(Math.max(.3,1.4-gas/600)+(i%3)*.12)+'s';
  });
  pill('gas-status', gas, 300, 500);
}


function applyPatroli(total) {
  const tot = parseInt(total)||0;
  set('pat-total', tot); set('pat-ring-num', tot);
  const ring=$('pat-ring');
  if(ring) ring.style.strokeDashoffset=220-(tot/Math.max(tot,50))*220;
}

function pill(id, v, warnAt, critAt) {
  const el=$(id); if(!el) return;
  if(v==null){el.textContent='—';el.className='s-pill st-wait';return;}
  let c='st-ok',t='NORMAL';
  if(critAt!==undefined&&v>=critAt){c='st-crit';t='DANGER';}
  else if(warnAt!==undefined&&v>=warnAt){c='st-warn';t='WARNING';}
  el.textContent=t; el.className='s-pill '+c;
}

// ══ TABLE ══════════════════════════════════════════
const tabApi = {
  'water-level': API.waterLevel,
  'water-flow':  API.waterFlow,
  'lingkungan':  API.lingkungan,
  'patroli':     API.patroli,
};

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
      if (pct > warnAt) { _wlAlertState[stateKey] = false; _wlAlertState[critKey] = false; }
      if (pct > critAt) { _wlAlertState[critKey] = false; }
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

function showWLWarnAlert(pct, sensorName) {
  const el = document.getElementById('wl-warn-pct');
  const ov = document.getElementById('wl-warn-overlay');
  if (el) el.textContent = (sensorName ? sensorName + ' — ' : '') + Math.round(pct) + '% — Batas Warning';
  if (ov) ov.classList.add('show');
}

function showWLDangerAlert(pct, sensorName) {
  const el  = document.getElementById('wl-danger-pct');
  const ov  = document.getElementById('wl-danger-overlay');
  const box = document.getElementById('wl-danger-box');
  if (el) el.textContent = (sensorName ? sensorName + ' — ' : '') + Math.round(pct) + '% — BAHAYA!';
  if (ov) ov.classList.add('show');
  if (box) { box.classList.add('wl-danger-pulse'); setTimeout(()=>box.classList.remove('wl-danger-pulse'),400); }
  _playDangerSound();
  _stopDangerSound();
  _wlDangerInterval = setInterval(() => {
    const overlay = document.getElementById('wl-danger-overlay');
    if (overlay && overlay.classList.contains('show')) _playDangerSound();
    else _stopDangerSound();
  }, 3000);
}

function dismissWLAlert(type) {
  const ov = document.getElementById('wl-' + type + '-overlay');
  if (ov) ov.classList.remove('show');
  if (type === 'danger') _stopDangerSound();
}
window.dismissWLAlert = dismissWLAlert;

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

// ══ DEMO MODE ══════════════════════════════════════════════
// Memungkinkan uji coba banyak tanki virtual dengan hanya 2 sensor fisik.
// Cara kerja: setiap tanki virtual bisa pakai key yang sama (mis. s1/s2),
// tapi dengan dimensi berbeda. Demo mode mensimulasikan data sensor tanpa ESP.
let _demoActive = false;
let _demoTimer  = null;

function toggleDemoMode() {
  _demoActive = !_demoActive;
  const btn   = document.getElementById('demo-btn');
  const panel = document.getElementById('demo-panel');
  if (btn)   { btn.style.background = _demoActive ? '#7c3aed' : '#f3f0ff'; btn.style.color = _demoActive ? '#fff' : 'var(--purple)'; btn.textContent = _demoActive ? '⏹ Stop Demo' : '🧪 Demo'; }
  if (panel) panel.style.display = _demoActive ? 'block' : 'none';
  if (_demoActive) {
    _buildDemoSliders();
    _applyDemo();
    _demoTimer = setInterval(_applyDemo, 800);
  } else {
    if (_demoTimer) { clearInterval(_demoTimer); _demoTimer = null; }
  }
}

function _buildDemoSliders() {
  const wrap = document.getElementById('demo-sliders');
  if (!wrap) return;
  const sensors  = getSensors();
  // Group by physical key — only one slider per unique key
  const seen = {};
  const unique = sensors.filter(s => { if (seen[s.key]) return false; seen[s.key]=true; return true; });
  wrap.innerHTML = unique.map(s => {
    const tinggiCm  = Math.round(+(s.tinggi||1) * 100);
    const zeroCm    = +(s.sensorZeroCm ?? 0);
    const maxDist   = Math.round(tinggiCm * 1.05); // 105% of tank height
    const defDist   = Math.round(tinggiCm * 0.4);  // default: ~60% penuh
    const defPct    = Math.max(0, Math.round((tinggiCm - defDist - zeroCm) / Math.max(1, tinggiCm - zeroCm) * 100));
    return `
    <div style="background:white;border:1px solid #e9d5ff;border-radius:7px;padding:7px 10px;min-width:140px">
      <div style="font-size:9px;font-weight:700;color:var(--purple)">📡 key: ${s.key}</div>
      <div style="font-size:8px;color:var(--txt3);margin-bottom:4px">Jarak sensor (${zeroCm}cm=100%, ${tinggiCm}cm=0%)</div>
      <input type="range" min="0" max="${maxDist}" value="${defDist}" id="demo-sl-${s.key}"
        style="width:100%;accent-color:var(--purple)"
        oninput="_onDemoSlide('${s.key}',+this.value,${tinggiCm},${zeroCm},this)">
      <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:10px;margin-top:3px">
        <span id="demo-lbl-${s.key}" style="color:var(--purple)">${defDist}cm</span>
        <span id="demo-pct-${s.key}" style="color:var(--green)">${defPct}%</span>
      </div>
    </div>`;
  }).join('');
}

function _onDemoSlide(key, dist, tankCm, zeroCm, el) {
  const lbl = document.getElementById('demo-lbl-'+key);
  const pct = document.getElementById('demo-pct-'+key);
  const range = tankCm - zeroCm;
  const p = range > 0 ? Math.max(0, Math.min(100, Math.round((tankCm - dist - zeroCm) / range * 100))) : 0;
  if (lbl) lbl.textContent = dist + 'cm';
  if (pct) { pct.textContent = p + '%'; pct.style.color = p<=15?'var(--red)':p<=40?'var(--yellow)':'var(--green)'; }
  _applyDemo();
}
window._onDemoSlide = _onDemoSlide;

function _applyDemo() {
  const sensors = getSensors();
  const fakeWL  = { created_at: new Date().toISOString() };
  const seen    = {};
  sensors.forEach(s => {
    if (seen[s.key]) return; seen[s.key] = true;
    const sl = document.getElementById('demo-sl-'+s.key);
    fakeWL[s.key+'_cm'] = sl ? +sl.value : Math.round(+(s.tinggi||1)*50);
  });
  window._lastWLData = fakeWL;
  applyWL(fakeWL);
  showOverlays(false);
  setEspStatus('connected');
}

// ══ BOOT ════════════════════════════════════════════
filterNav();
loadPage('iot');
// Trigger new widgets after short delay (DOM ready)
setTimeout(updateDashWidgets, 500);

// ═══════════════════════════════════════════════════════════
// DATA ENTRY
// ═══════════════════════════════════════════════════════════
 function getDataEntryProduction(key,title,sub,icon){return`<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> ${title}</div>

    <div class="de-proj-select-wrap">
      <label class="de-label">Pilih Ongoing Project</label>
      <select id="dep-proj-sel-${key}" onchange="loadDEProjForm('${key}')">
        <option value="">-- Pilih project ongoing --</option>
      </select>
    </div>

    <div id="dep-form-${key}"></div>
  </div>
</div>`;}

function getDataEntryLimbah(key,title,sub,icon){return`<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div><div class="de-date" id="de-dt-${key}">--</div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> Input Form — ${title}</div>
    <div class="de-grid">
      <div class="de-field"><label class="de-label" style="color:#111;">DATE</label><input class="de-input" type="date" id="${key}-date"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">Volume Limbah<span class="de-unit"> (L)</span></label><input class="de-input" type="number" id="${key}-vol" placeholder="0" min="0" step="0.1"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">COD<span class="de-unit"> (mg/L)</span></label><input class="de-input" type="number" id="${key}-cod" placeholder="0" min="0" step="0.1"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">BOD<span class="de-unit"> (mg/L)</span></label><input class="de-input" type="number" id="${key}-bod" placeholder="0" min="0" step="0.1"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">TSS<span class="de-unit"> (mg/L)</span></label><input class="de-input" type="number" id="${key}-tss" placeholder="0" min="0" step="0.1"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">pH</label><input class="de-input" type="number" id="${key}-ph" placeholder="7.0" min="0" max="14" step="0.1"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">Temperatur Effluent<span class="de-unit"> (°C)</span></label><input class="de-input" type="number" id="${key}-temp" placeholder="0" min="0" step="0.1"></div>
      <div class="de-field de-full"><label class="de-label" style="color:#111;">NOTES</label><textarea class="de-input de-textarea" id="${key}-notes" placeholder="Add notes here..."></textarea></div>
      <div class="de-field de-full">
        <label class="de-label" style="color:#111;">FOTO DOKUMENTASI <span style="font-weight:400;color:var(--txt3)">(opsional, bisa beberapa — dikompres otomatis)</span></label>
        <div class="de-photo-wrap" id="${key}-photo-wrap">
          <label class="de-photo-drop" onclick="document.getElementById('${key}-photo-input').click()">
            <input type="file" id="${key}-photo-input" accept="image/*" multiple style="display:none" onchange="handlePhotoUpload('${key}',this)">
            <div class="de-photo-ico">📷</div>
            <div style="font-size:12px;color:var(--txt2);font-weight:600">Klik untuk pilih foto</div>
            <div style="font-size:10px;color:var(--txt3);margin-top:2px">JPG / PNG / WEBP — dikompres otomatis</div>
          </label>
          <div class="de-photo-preview" id="${key}-photo-preview"></div>
        </div>
      </div>
    </div>
    <div class="de-status-bar" id="${key}-sb" style="display:none"><span id="${key}-sm"></span></div>
    <div class="de-actions">
      <button class="de-btn de-btn-ghost" onclick="resetDE('${key}')">🔄 Reset</button>
      <button class="de-btn de-btn-primary" onclick="submitDE('${key}')">💾 Save Data</button>
    </div>
  </div>
</div>`;}

function getDataEntryUtility(key,title,sub,icon){return`<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div><div class="de-date" id="de-dt-${key}">--</div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> Input Form — ${title}</div>

    <!-- Pilihan tipe: Harian / Project -->
    <div style="margin-bottom:20px;">
      <label class="de-label" style="color:#111;">TIPE ENTRY</label>
      <div style="display:flex;gap:10px;margin-top:6px;">
        <label style="display:flex;align-items:center;gap:8px;padding:10px 18px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s;flex:1;justify-content:center;" id="util-tab-harian" onclick="utilSwitchType('${key}','harian')">
          <input type="radio" name="${key}-util-type" value="harian" checked style="accent-color:var(--blue);">
          <span style="font-size:13px;font-weight:700;color:#111;">📅 Harian</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;padding:10px 18px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s;flex:1;justify-content:center;" id="util-tab-project" onclick="utilSwitchType('${key}','project')">
          <input type="radio" name="${key}-util-type" value="project" style="accent-color:var(--blue);">
          <span style="font-size:13px;font-weight:700;color:#111;">📋 Project</span>
        </label>
      </div>
    </div>

    <!-- Sub-dropdown Harian -->
    <div id="util-harian-sub-${key}" style="margin-bottom:18px;">
      <label class="de-label" style="color:#111;">KATEGORI HARIAN</label>
      <select class="de-input de-select" id="util-harian-cat-${key}" onchange="utilRenderHarian('${key}',this.value)" style="margin-top:6px;">
        <option value="">-- Pilih kategori --</option>
        <option value="solar">⛽ Solar</option>
        <option value="listrik">⚡ Listrik</option>
        <option value="air">💧 Air</option>
      </select>
    </div>

    <!-- Sub-dropdown Project -->
    <div id="util-project-sub-${key}" style="display:none;margin-bottom:18px;">
      <label class="de-label" style="color:#111;">ONGOING PROJECT</label>
      <select class="de-input de-select" id="util-project-cat-${key}" onchange="utilRenderProject('${key}',this.value)" style="margin-top:6px;">
        <option value="">-- Pilih project --</option>
      </select>
    </div>

    <!-- Dynamic form area -->
    <div id="util-form-area-${key}"></div>
  </div>
</div>`;}

function utilSwitchType(key, type) {
  const harianSub = document.getElementById('util-harian-sub-'+key);
  const projSub   = document.getElementById('util-project-sub-'+key);
  const tabH      = document.getElementById('util-tab-harian');
  const tabP      = document.getElementById('util-tab-project');
  const area      = document.getElementById('util-form-area-'+key);
  if (!harianSub || !projSub) return;

  if (type === 'harian') {
    harianSub.style.display = '';
    projSub.style.display = 'none';
    tabH.style.borderColor = 'var(--blue)'; tabH.style.background = '#ebf2fd';
    tabP.style.borderColor = 'var(--border)'; tabP.style.background = 'var(--bg)';
    // Reset sub dropdowns
    document.getElementById('util-harian-cat-'+key).value = '';
    if (area) area.innerHTML = '';
  } else {
    harianSub.style.display = 'none';
    projSub.style.display = '';
    tabH.style.borderColor = 'var(--border)'; tabH.style.background = 'var(--bg)';
    tabP.style.borderColor = 'var(--blue)'; tabP.style.background = '#ebf2fd';
    // Populate ongoing projects
    const sel = document.getElementById('util-project-cat-'+key);
    const projs = gPJ('ongoing');
    sel.innerHTML = '<option value="">-- Pilih project --</option>';
    projs.forEach((p,i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = p.name;
      sel.appendChild(opt);
    });
    if (area) area.innerHTML = '';
  }
}
window.utilSwitchType = utilSwitchType;

function utilRenderHarian(key, cat) {
  const area = document.getElementById('util-form-area-'+key);
  if (!area) return;
  if (!cat) { area.innerHTML = ''; return; }

  const labels = { solar: '⛽ Solar (Liter)', listrik: '⚡ Listrik (kWh)', air: '💧 Air (m³)' };
  const label = labels[cat] || cat;
  const uid = key + '_' + cat;

  area.innerHTML = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:16px;">📊 ${label} — Entry Harian</div>
      <div class="de-grid">
        <div class="de-field">
          <label class="de-label" style="color:#111;">TANGGAL</label>
          <input class="de-input" type="date" id="util-${uid}-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="de-field">
          <label class="de-label" style="color:#111;">AWAL</label>
          <input class="de-input" type="number" id="util-${uid}-awal" step="0.01" placeholder="Nilai awal..." oninput="utilCalcTotal('${uid}')">
        </div>
        <div class="de-field">
          <label class="de-label" style="color:#111;">AKHIR</label>
          <input class="de-input" type="number" id="util-${uid}-akhir" step="0.01" placeholder="Nilai akhir..." oninput="utilCalcTotal('${uid}')">
        </div>
        <div class="de-field">
          <label class="de-label" style="color:#111;">TOTAL <span style="font-weight:400;color:var(--txt3)">(akhir – awal)</span></label>
          <input class="de-input" type="number" id="util-${uid}-total" placeholder="Auto-hitung..." readonly style="background:#f3f4f6;color:var(--txt3);">
        </div>
        <div class="de-field de-full">
          <label class="de-label" style="color:#111;">NOTES</label>
          <textarea class="de-input de-textarea" id="util-${uid}-notes" placeholder="Catatan tambahan..."></textarea>
        </div>
      </div>
      <div class="de-status-bar" id="util-${uid}-sb" style="display:none"><span id="util-${uid}-sm"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="utilResetHarian('${uid}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="utilSaveHarian('${uid}','${cat}')">💾 Simpan</button>
      </div>
    </div>`;
}
window.utilRenderHarian = utilRenderHarian;

function utilCalcTotal(uid) {
  const a = parseFloat(document.getElementById('util-'+uid+'-awal')?.value) || 0;
  const b = parseFloat(document.getElementById('util-'+uid+'-akhir')?.value) || 0;
  const t = document.getElementById('util-'+uid+'-total');
  if (t) t.value = (b - a).toFixed(2);
}
window.utilCalcTotal = utilCalcTotal;

function utilResetHarian(uid) {
  ['awal','akhir','total','notes'].forEach(f => {
    const el = document.getElementById('util-'+uid+'-'+f);
    if (el) el.value = '';
  });
  const d = document.getElementById('util-'+uid+'-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
}
window.utilResetHarian = utilResetHarian;

function utilSaveHarian(uid, cat) {
  const b = document.getElementById('util-'+uid+'-sb');
  const m = document.getElementById('util-'+uid+'-sm');
  if (b && m) {
    b.style.display = 'flex'; b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Data ' + cat + ' tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.utilSaveHarian = utilSaveHarian;

// Helper: build a single numbered row with label + time slots
function _utilProjField(uid, rowId, label, type='number', unit='') {
  const unitSpan = unit ? `<span class="de-input-unit">${unit}</span>` : '';
  const inputEl = unit
    ? `<div class="de-input-wrap"><input class="de-input" type="${type}" step="0.01" id="util-${uid}-${rowId}" placeholder="—">${unitSpan}</div>`
    : `<input class="de-input" type="${type}" id="util-${uid}-${rowId}" placeholder="—">`;
  return `
    <tr>
      <td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);white-space:nowrap;min-width:28px;text-align:center;font-weight:600;">${rowId}</td>
      <td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);white-space:nowrap;">${label}</td>
      <td style="padding:4px 8px;border-bottom:1px solid var(--border);">${inputEl}</td>
    </tr>`;
}

function utilRenderProject(key, idx) {
  const area = document.getElementById('util-form-area-'+key);
  if (!area) return;
  if (idx === '') { area.innerHTML = ''; return; }
  const proj = gPJ('ongoing')[+idx];
  if (!proj) { area.innerHTML = ''; return; }
  const uid = key + '_proj_' + idx;

  // Fields from Image 1 (PRODUKSI sheet):
  // 1-Set point, 2-Water in temperature, 3-Water out temperature, 4-CAP,
  // 5-Discharge pressure A, 6-Main suction pressure A,
  // 7-Discharge pressure B, 8-Main suction pressure B,
  // 9-Unit total capacity, 10-Cir A total capacity, 11-Cir B total Capacity
  const fields = [
    {id:'f1',  label:'Set point',             unit:''},
    {id:'f2',  label:'Water in temperature',  unit:'°C'},
    {id:'f3',  label:'Water out temperature', unit:'°C'},
    {id:'f4',  label:'CAP',                   unit:''},
    {id:'f5',  label:'Discharge pressure A',  unit:''},
    {id:'f6',  label:'Main suction pressure A', unit:''},
    {id:'f7',  label:'Discharge pressure B',  unit:''},
    {id:'f8',  label:'Main suction pressure B', unit:''},
    {id:'f9',  label:'Unit total capacity',   unit:''},
    {id:'f10', label:'Cir A total capacity',  unit:''},
    {id:'f11', label:'Cir B total Capacity',  unit:''},
  ];

  const rows = fields.map((f, i) =>
    _utilProjField(uid, f.id, f.label, 'number', f.unit)
  ).join('');

  area.innerHTML = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div style="font-size:13px;font-weight:700;color:#111;">📋 ${proj.name}</div>
        <div style="font-size:11px;color:var(--txt3);">Ongoing Project — Utility Entry</div>
      </div>

      <div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="de-field">
          <label class="de-label" style="color:#111;">TANGGAL</label>
          <input class="de-input" type="date" id="util-${uid}-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="de-field">
          <label class="de-label" style="color:#111;">WAKTU</label>
          <input class="de-input" type="time" id="util-${uid}-time">
        </div>
      </div>

      <!-- Data table matching spreadsheet layout -->
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:14px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1f2937;">
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:center;width:36px;">No.</th>
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left;">Bagian</th>
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left;min-width:140px;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div class="de-field" style="margin-bottom:14px;">
        <label class="de-label" style="color:#111;">NOTES</label>
        <textarea class="de-input de-textarea" id="util-${uid}-notes" placeholder="Catatan tambahan..." style="min-height:60px;"></textarea>
      </div>

      <div class="de-status-bar" id="util-${uid}-sb" style="display:none"><span id="util-${uid}-sm"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="utilResetProj('${uid}',${fields.length})">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="utilSaveProject('${uid}','${proj.name}')">💾 Simpan</button>
      </div>
    </div>`;
}
window.utilRenderProject = utilRenderProject;

function utilResetProj(uid, count) {
  for (let i = 1; i <= count; i++) {
    const el = document.getElementById('util-'+uid+'-f'+i);
    if (el) el.value = '';
  }
  const notes = document.getElementById('util-'+uid+'-notes');
  if (notes) notes.value = '';
  const d = document.getElementById('util-'+uid+'-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
  const t = document.getElementById('util-'+uid+'-time');
  if (t) t.value = '';
}
window.utilResetProj = utilResetProj;

function utilSaveProject(uid, projName) {
  const b = document.getElementById('util-'+uid+'-sb');
  const m = document.getElementById('util-'+uid+'-sm');
  if (b && m) {
    b.style.display = 'flex'; b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Utility untuk "' + projName + '" tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.utilSaveProject = utilSaveProject;

function getDataEntryLaboratorium(key,title,sub,icon){return`<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> ${title}</div>

    <div class="de-proj-select-wrap">
      <label class="de-label" style="color:#111;">Pilih Ongoing Project</label>
      <select id="dep-proj-sel-${key}" onchange="loadDEProjForm('${key}')">
        <option value="">-- Pilih project ongoing --</option>
      </select>
    </div>

    <!-- Boiler Checklist section (Image 2 fields) -->
    <div id="lab-boiler-section-${key}" style="margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        🔥 Boiler Checklist &amp; Penggunaan
      </div>

      <!-- Date + Time row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="de-field">
          <label class="de-label" style="color:#111;">TANGGAL</label>
          <input class="de-input" type="date" id="${key}-boiler-date" value="">
        </div>
        <div class="de-field">
          <label class="de-label" style="color:#111;">WAKTU</label>
          <input class="de-input" type="time" id="${key}-boiler-time">
        </div>
      </div>

      <!-- Fields table matching Image 2 -->
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1f2937;">
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:center;width:36px;">No.</th>
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left;">Bagian</th>
              <th style="padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left;min-width:160px;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">1</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Steam Press</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b1" placeholder="—"><span class="de-input-unit">kPa</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">2</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Flue gass temperature</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b2" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">3</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Feed water temperature</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b3" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">4</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Scale monitor temperature</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b4" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">5</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Overheat sensor temperature</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b5" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">6</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">To next blowdown</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><input class="de-input" type="text" id="${key}-b6" placeholder="—"></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">7</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Conductivity</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b7" placeholder="—"><span class="de-input-unit">µS/cm</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">8</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Air pressure</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b8" placeholder="—"><span class="de-input-unit">bar</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">9</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Ignition count</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><input class="de-input" type="number" step="1" id="${key}-b9" placeholder="—"></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">10</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Oil L-fire time</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><input class="de-input" type="text" id="${key}-b10" placeholder="—"></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">11</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Oil H-fire time</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><input class="de-input" type="text" id="${key}-b11" placeholder="—"></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">12</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Flue Gas temp (L-fire)</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b12" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">13</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Flue Gas temp (H-fire)</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b13" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">14</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Feed water avg temp</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b14" placeholder="—"><span class="de-input-unit">°C</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">15</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Oil B-Eficiency</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b15" placeholder="—"><span class="de-input-unit">%</span></div></td></tr>
            <tr style="background:#fefce8;"><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:700;">16</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);font-weight:700;">O Fuel consumption</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><input class="de-input" type="number" step="0.01" id="${key}-b16" placeholder="—"></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">17</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Steam output</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b17" placeholder="—"><span class="de-input-unit">kg/h</span></div></td></tr>
            <tr><td style="padding:6px 10px;font-size:12px;color:#555;border-bottom:1px solid var(--border);text-align:center;font-weight:600;">18</td><td style="padding:6px 10px;font-size:12px;color:#111;border-bottom:1px solid var(--border);">Surface blowdown</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);"><div class="de-input-wrap"><input class="de-input" type="number" step="0.01" id="${key}-b18" placeholder="—"><span class="de-input-unit">L</span></div></td></tr>
          </tbody>
        </table>
      </div>

      <div class="de-field" style="margin-bottom:14px;">
        <label class="de-label" style="color:#111;">NOTES</label>
        <textarea class="de-input de-textarea" id="${key}-boiler-notes" placeholder="Catatan tambahan..." style="min-height:60px;"></textarea>
      </div>

      <div class="de-status-bar" id="${key}-boiler-sb" style="display:none"><span id="${key}-boiler-sm"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="resetLabBoiler('${key}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="saveLabBoiler('${key}')">💾 Simpan Boiler Data</button>
      </div>
    </div>

    <!-- Set Point section (project-based) -->
    <div style="border-top:1px solid var(--border);margin-top:24px;padding-top:20px;">
      <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:12px;">🧪 Set Point Data Entry</div>
      <div id="dep-form-${key}"></div>
    </div>
  </div>
</div>`;}

function resetLabBoiler(key) {
  for (let i = 1; i <= 18; i++) {
    const el = document.getElementById(key+'-b'+i);
    if (el) el.value = '';
  }
  const d = document.getElementById(key+'-boiler-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
  const t = document.getElementById(key+'-boiler-time');
  if (t) t.value = '';
  const n = document.getElementById(key+'-boiler-notes');
  if (n) n.value = '';
}
window.resetLabBoiler = resetLabBoiler;

function saveLabBoiler(key) {
  const b = document.getElementById(key+'-boiler-sb');
  const m = document.getElementById(key+'-boiler-sm');
  if (b && m) {
    b.style.display = 'flex'; b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Boiler checklist tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.saveLabBoiler = saveLabBoiler;

// SP field definitions (same order as Set Point modal)
// SP field definitions - Reorganized with pagination
const SP_FIELDS_PAGE1 = [
  {id:'sp-slurry',     label:'Slurry Ratio',         type:'number', unit:'%'},
  {id:'sp-hopper',     label:'Hopper Calibration',   type:'text',   unit:''},
  {id:'sp-density',    label:'Density',              type:'number', unit:'Kg/m³'},
  {id:'sp-feed',       label:'Feed',                 type:'number', unit:'L/h'},
  {id:'sp-aroma',      label:'Aroma Flowrate',       type:'number', unit:'L/h'},
  {id:'sp-steam',      label:'Stripping Steam',      type:'number', unit:'kg/h'},
  {id:'sp-prod-out',   label:'Product Out',          type:'number', unit:'L/h'},
  {id:'sp-cond1',      label:'Condensate #1',        type:'number', unit:'L/h'},
  {id:'sp-cond2',      label:'Condensate #2',        type:'number', unit:'L/h'},
  {id:'sp-ext',        label:'Strip Rate External',  type:'number', unit:'%'},
  {id:'sp-int',        label:'Strip Rate Internal',  type:'text',   unit:''},
  {id:'sp-cond-rate',  label:'Condenser #1',         type:'number', unit:'%'},
  {id:'sp-offset',     label:'Offset',               type:'number', unit:'°C'},
];

const SP_FIELDS_PAGE2 = [
  {id:'sp-temp-feed',  label:'Product Feed',         type:'number', unit:'°C'},
  {id:'sp-temp-heater',label:'Product Heater',       type:'number', unit:'°C'},
  {id:'sp-temp-top',   label:'Top of Column',        type:'number', unit:'°C'},
  {id:'sp-vacuum',     label:'Vacuum',               type:'number', unit:'mBar', calculated: true},
  {id:'sp-temp-bot',   label:'Bottom of Column',     type:'number', unit:'°C'},
  {id:'sp-temp-c1',    label:'Product Out',          type:'number', unit:'°C'},
  {id:'sp-temp-c2',    label:'Condensate #1',        type:'number', unit:'°C'},
  {id:'sp-temp-out',   label:'Condensate #2',        type:'number', unit:'°C'},
  {id:'sp-chill',      label:'Chilled Water',        type:'number', unit:'°C'},
  {id:'sp-cond-water', label:'Condenser Water',      type:'number', unit:'°C'},
  {id:'sp-press-sys',  label:'Pressure System',      type:'number', unit:'kPa'},
  {id:'sp-press-steam',label:'Steam Flow',           type:'number', unit:'Kg/h'},
];

// Legacy SP_FIELDS for backwards compatibility
const SP_FIELDS = [...SP_FIELDS_PAGE1, ...SP_FIELDS_PAGE2];

function initDataEntryForm(key){
  // Utility: form with tabs — set date + clock + init tab highlight
  if(key === 'utility'){
    const d = document.getElementById(key+'-date');
    if(d) d.value = new Date().toISOString().split('T')[0];
    if(window._deClock) clearInterval(window._deClock);
    window._deClock = setInterval(()=>{
      const el = document.getElementById('de-dt-'+key);
      if(!el){ clearInterval(window._deClock); return; }
      el.textContent = new Date().toLocaleString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }, 1000);
    // Init tab highlight
    const tabH = document.getElementById('util-tab-harian');
    if (tabH) { tabH.style.borderColor = 'var(--blue)'; tabH.style.background = '#ebf2fd'; }
    return;
  }
  // Limbah: form langsung
  if(key === 'limbah'){
    const d = document.getElementById(key+'-date');
    if(d) d.value = new Date().toISOString().split('T')[0];
    if(window._deClock) clearInterval(window._deClock);
    window._deClock = setInterval(()=>{
      const el = document.getElementById('de-dt-'+key);
      if(!el){ clearInterval(window._deClock); return; }
      el.textContent = new Date().toLocaleString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }, 1000);
    return;
  }
  // Production & Laboratorium: populate project dropdown + set boiler date for lab
  const sel = document.getElementById('dep-proj-sel-'+key);
  if(key === 'laboratorium') {
    const bd = document.getElementById(key+'-boiler-date');
    if(bd) bd.value = new Date().toISOString().split('T')[0];
  }
  if(!sel) return;
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  sel.innerHTML = '<option value="">-- Pilih project ongoing --</option>';
  projs.forEach((p,i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

// ═══════════════════════════════════════════════════════════
// HTML TEMPLATE BUILDERS - Modular & Reusable
// ═══════════════════════════════════════════════════════════

function buildSetpointPage(fields, key, sp) {
  return fields.map(f => buildSetpointField(f, key, sp[f.id] || '')).join('');
}

function buildTempProdField(key) {
  return `
    <div class="de-field de-full" style="margin-bottom:4px;">
      <label class="de-label" style="color:#111;">TEMPERATUR PRODUKSI</label>
      <div class="de-input-wrap" style="max-width:220px">
        <input class="de-input" id="dep-temp-prod-${key}" type="number" step="0.1" placeholder="Masukkan suhu..." oninput="checkVacuum('${key}')">
        <span class="de-input-unit">°C</span>
      </div>
      <div id="dep-vacuum-note-${key}" style="display:none;margin-top:8px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;"></div>
    </div>`;
}

function buildPhotoUpload(key) {
  return `
    <div class="de-field de-full">
      <label class="de-label">FOTO DOKUMENTASI <span style="font-weight:400;color:var(--txt3)">(opsional, bisa beberapa — dikompres otomatis)</span></label>
      <div class="de-photo-wrap" id="${key}-photo-wrap">
        <label class="de-photo-drop" onclick="document.getElementById('${key}-photo-input').click()">
          <input type="file" id="${key}-photo-input" accept="image/*" multiple style="display:none" onchange="handlePhotoUpload('${key}',this)">
          <div class="de-photo-ico">📷</div>
          <div style="font-size:12px;color:var(--txt2);font-weight:600">Klik untuk pilih foto</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:2px">JPG / PNG / WEBP — dikompres otomatis</div>
        </label>
        <div class="de-photo-preview" id="${key}-photo-preview"></div>
      </div>
    </div>`;
}

function buildFormActions(key, currentPage) {
  if (currentPage === 1) {
    return `
      <div class="de-status-bar" id="dep-sb-${key}" style="display:none"><span id="dep-sm-${key}"></span></div>
      <div class="de-actions" style="justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="dep-cip-status-${key}" style="font-size:10px;padding:4px 12px;border-radius:100px;background:#fef3c7;color:#854d0e;border:1px solid #fde047;font-weight:700;cursor:pointer;" onclick="openCIPModal('${key}')" title="Klik untuk buka CIP">🧼 CIP: Belum diisi</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="de-btn de-btn-ghost" onclick="resetDEP('${key}')">🔄 Reset</button>
          <button class="de-btn de-btn-primary" onclick="goToSetpointPage2('${key}')">Next →</button>
        </div>
      </div>`;
  } else {
    return `
      <div class="de-status-bar" id="dep-sb-${key}" style="display:none"><span id="dep-sm-${key}"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="goToSetpointPage1('${key}')">← Back</button>
        <button class="de-btn de-btn-primary" onclick="submitDEP('${key}')">💾 Save Data</button>
      </div>`;
  }
}

// Pagination functions
function goToSetpointPage2(key) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) return;
  
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const sel = document.getElementById('dep-proj-sel-'+key);
  const proj = projs[+sel.value];
  if (!proj || !proj.setPoint) return;
  
  renderSetpointPage(key, proj, 2);
}

function goToSetpointPage1(key) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) return;
  
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const sel = document.getElementById('dep-proj-sel-'+key);
  const proj = projs[+sel.value];
  if (!proj || !proj.setPoint) return;
  
  renderSetpointPage(key, proj, 1);
}

function buildSetpointField(f, key, spVal) {
  const isCalculated = f.calculated || false;
  const inputAttrs = isCalculated 
    ? `class="de-input" id="dep-${f.id}-${key}" type="${f.type}" step="0.1" value="${spVal}" readonly style="background:#f3f4f6;color:var(--txt3);cursor:not-allowed;" title="Calculated field - not editable"`
    : `class="de-input sp-ghost" id="dep-${f.id}-${key}" type="${f.type}" step="0.1" placeholder="${spVal}" onfocus="this.classList.remove('sp-ghost');this.placeholder=''" onblur="if(this.value===''){this.classList.add('sp-ghost');this.placeholder='${spVal}';}"`; 
  
  // Top of Column gets vacuum note
  const extraNote = (f.id === 'sp-temp-top') 
    ? ` oninput="checkTopColumnVacuum('${key}',this.value)"` 
    : '';
  const finalInputAttrs = isCalculated ? inputAttrs : inputAttrs.replace('onblur=', extraNote + ' onblur=');

  if (f.unit) {
    return `
      <div class="de-field">
        <label class="de-label" style="color:#111;">${f.label}${isCalculated ? ' <span style="font-size:9px;color:var(--txt3);">(auto)</span>' : ''}</label>
        <div class="de-input-wrap">
          <input ${finalInputAttrs}>
          <span class="de-input-unit">${f.unit}</span>
        </div>
        ${f.id === 'sp-temp-top' ? `<div id="dep-top-vacuum-note-${key}" style="display:none;margin-top:6px;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;"></div>` : ''}
      </div>`;
  }
  return `
    <div class="de-field">
      <label class="de-label" style="color:#111;">${f.label}${isCalculated ? ' <span style="font-size:9px;color:var(--txt3);">(auto)</span>' : ''}</label>
      <input ${finalInputAttrs}>
      ${f.id === 'sp-temp-top' ? `<div id="dep-top-vacuum-note-${key}" style="display:none;margin-top:6px;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;"></div>` : ''}
    </div>`;
}

function checkTopColumnVacuum(key, val) {
  const note = document.getElementById('dep-top-vacuum-note-' + key);
  if (!note) return;
  const v = parseFloat(val);
  if (isNaN(v)) { note.style.display = 'none'; return; }
  note.style.display = 'block';
  if (v <= 97) {
    note.textContent = '🔵 Vacuum';
    note.style.background = '#dbeafe'; note.style.color = '#1e40af'; note.style.border = '1px solid #93c5fd';
  } else {
    note.textContent = '⭕ Not Vacuum';
    note.style.background = '#fef9c3'; note.style.color = '#713f12'; note.style.border = '1px solid #fde047';
  }
}
window.checkTopColumnVacuum = checkTopColumnVacuum;

function renderSetpointPage(key, proj, page) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) return;
  
  const sp = proj.setPoint;
  const fields = page === 1 ? SP_FIELDS_PAGE1 : SP_FIELDS_PAGE2;
  
  const pageTitle = page === 1 ? 'Set Point - Page 1 of 2' : 'Untitled — Set Point Page 2 of 2';
  const setpointHTML = buildSetpointPage(fields, key, sp);
  
  let html = `
    <div class="de-entry-note">
      📄 <strong>${pageTitle}</strong> — Nilai set point ditampilkan sebagai placeholder abu-abu. Klik kolom untuk menghapusnya dan isi nilai baru.
    </div>
    <div class="setpoint-grid" style="margin-bottom:18px;">
      ${setpointHTML}
    </div>
  `;
  
  if (page === 1) {
    html += `
      <div class="de-field" style="margin-bottom:16px;">
        ${buildTempProdField(key)}
        <label class="de-label" style="color:#111;">NOTES</label>
        <textarea class="de-input de-textarea" id="dep-notes-${key}" placeholder="Catatan tambahan..."></textarea>
        ${buildPhotoUpload(key)}
      </div>
    `;
  }
  
  html += buildFormActions(key, page);
  
  wrap.innerHTML = html;
  
  // Update CIP status if already saved (only on page 1) — show bottom-left
  if (page === 1) {
    updateCIPStatus(key, proj);
  }
}

window.goToSetpointPage1 = goToSetpointPage1;
window.goToSetpointPage2 = goToSetpointPage2;

// ═══════════════════════════════════════════════════════════
// LOAD DATA ENTRY PROJECT FORM - Refactored Version with Pagination
// ═══════════════════════════════════════════════════════════

function loadDEProjForm(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  const wrap = document.getElementById('dep-form-'+key);
  if(!sel || !wrap) return;
  if(sel.value === '') { wrap.innerHTML = ''; return; }

  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const proj = projs[+sel.value];
  if(!proj || !proj.setPoint) { wrap.innerHTML = ''; return; }

  // Store current project info in window for CIP modal
  window._currentDEProj = { key, proj, projIndex: +sel.value };

  // Always start on page 1
  renderSetpointPage(key, proj, 1);
}

function updateCIPStatus(key, proj) {
  const cipDone = key === 'production' ? proj.cipProdDone : proj.cipLabDone;
  const cipData = key === 'production' ? proj.cipProdData : proj.cipLabData;
  const statusEl = document.getElementById('dep-cip-status-'+key);
  if (!statusEl) return;
  if (cipDone) {
    const savedAt = cipData?.savedAt ? new Date(cipData.savedAt).toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
    statusEl.textContent = '✅ CIP Selesai' + (savedAt ? ' · ' + savedAt : '');
    statusEl.style.background = '#dcfce7';
    statusEl.style.color = '#15803d';
    statusEl.style.borderColor = '#86efac';
  } else if (cipData) {
    const savedAt = cipData.savedAt ? new Date(cipData.savedAt).toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
    statusEl.textContent = '💾 CIP Tersimpan' + (savedAt ? ' · ' + savedAt : '');
    statusEl.style.background = '#dbeafe';
    statusEl.style.color = '#1e40af';
    statusEl.style.borderColor = '#93c5fd';
  }
}

function resetDEP(key){
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('dep-'+f.id+'-'+key);
    if(el){el.value='';el.classList.add('sp-ghost');}
  });
  // restore placeholders from current selected project
  loadDEProjForm(key);
}

// ═══════════════════════════════════════════════════════════
// CIP MODAL SYSTEM - Clean in Place with Checklist & Timestamp
// ═══════════════════════════════════════════════════════════

// CIP Checklist definitions based on production type
const CIP_CHECKLISTS = {
  production: {
    title: 'SCC CIP - Birsing Production',
    sections: [
      {
        name: 'Desanter',
        items: ['Caustic', 'Birsing Caustic', 'Citric', 'Birsing Citric', 'Revurs', 'Shutdown']
      },
      {
        name: 'Conln (Birsing Prod) + Raw Tank',
        items: ['Caustic', 'Birsing Caustic', 'Citric', 'Birsing Citric', 'Svildenn']
      },
      {
        name: 'After CIP',
        items: ['Birsing', 'Caustic + Birsing', 'Citric + Birsing']
      },
      {
        name: 'CT CIP',
        items: ['Birsing Prod', 'Caustic', 'Birsing Caustic', 'Citric', 'Birsing Citric']
      },
      {
        name: 'Clarified',
        items: ['Birsing Prod', 'Caustic', 'Birsing Caustic', 'Citric', 'Birsing Citric']
      },
      {
        name: 'Concentrate',
        items: ['Sama Split Clarified']
      }
    ],
    fields: [
      { id: 'ph', label: 'PH', type: 'number', step: '0.1' },
      { id: 'total_chemical', label: 'Total Chemical', type: 'text' }
    ]
  },
  laboratorium: {
    title: 'Laboratory CIP',
    sections: [
      {
        name: 'General CIP',
        items: ['Pre-rinse', 'Caustic Wash', 'Intermediate Rinse', 'Acid Wash', 'Final Rinse', 'Sanitization']
      }
    ],
    fields: [
      { id: 'ph', label: 'PH', type: 'number', step: '0.1' }
    ]
  }
};

function buildCIPChecklist(key, cipData) {
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  
  let checklistHTML = '';
  config.sections.forEach((section, sIdx) => {
    checklistHTML += `
      <div style="margin-bottom:20px;">
        <div style="background:#1f2937;color:white;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:700;margin-bottom:10px;">
          ${section.name}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
    `;
    
    section.items.forEach((item, iIdx) => {
      const checkId = `cip-check-${sIdx}-${iIdx}`;
      const timeId = `cip-time-${sIdx}-${iIdx}`;
      const isChecked = cipData?.checklist?.[checkId] || false;
      const timestamp = cipData?.checklist?.[timeId] || '';
      
      checklistHTML += `
        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:6px;">
          <input type="checkbox" id="${checkId}" ${isChecked ? 'checked' : ''} 
                 onchange="handleCIPCheckbox('${checkId}', '${timeId}')"
                 style="width:16px;height:16px;cursor:pointer;">
          <label for="${checkId}" style="font-size:13px;color:var(--txt2);cursor:pointer;user-select:none;">
            ${item}
          </label>
          <span id="${timeId}" style="font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;min-width:120px;text-align:right;">
            ${timestamp || '—'}
          </span>
        </div>
      `;
    });
    
    checklistHTML += `
        </div>
      </div>
    `;
  });
  
  return checklistHTML;
}

function buildCIPFields(key, cipData) {
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  
  return config.fields.map(f => {
    const value = cipData?.fields?.[f.id] || '';
    return `
      <div class="de-field">
        <label class="de-label" style="color:#111;">${f.label}</label>
        <input class="de-input" id="cip-field-${f.id}" type="${f.type}" 
               ${f.step ? `step="${f.step}"` : ''} value="${value}">
      </div>
    `;
  }).join('');
}

function handleCIPCheckbox(checkId, timeId) {
  const checkbox = document.getElementById(checkId);
  const timeSpan = document.getElementById(timeId);
  
  if (checkbox.checked) {
    // Set timestamp when checked
    const now = new Date();
    const timestamp = now.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    timeSpan.textContent = timestamp;
  } else {
    // Clear timestamp when unchecked
    timeSpan.textContent = '—';
  }
}

window.handleCIPCheckbox = handleCIPCheckbox;

function openCIPModal(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') {
    showQuickToast('❌ Pilih project dulu!');
    return;
  }

  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const proj = projs[+sel.value];
  if (!proj) return;

  // Get existing CIP data
  const cipData = key === 'production' ? proj.cipProdData : proj.cipLabData;
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;

  const now = new Date();
  const nowStr = now.toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const savedAtStr = cipData?.savedAt ? new Date(cipData.savedAt).toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : null;

  const modalHTML = `
    <div id="cip-modal-overlay" onclick="closeCIPModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;"></div>
    <div id="cip-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:0;width:min(700px,92vw);max-height:88vh;overflow:hidden;z-index:9999;box-shadow:0 25px 70px rgba(0,0,0,.3);">
      
      <!-- Header -->
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);background:#1f2937;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:17px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;">
            🧼 ${config.title}
          </div>
          <div style="font-size:12px;color:#9ca3af;margin-top:3px;">${proj.name} — ${key === 'production' ? 'Production' : 'Laboratorium'}</div>
        </div>
        <button onclick="closeCIPModal()" style="width:32px;height:32px;border-radius:8px;border:1px solid #374151;background:#111827;color:#9ca3af;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">✕</button>
      </div>
      
      <!-- Body -->
      <div style="padding:24px;max-height:calc(88vh - 180px);overflow-y:auto;">
        
        <!-- Info Notice -->
        <div style="background:#fffbeb;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#854d0e;line-height:1.5;">
          ℹ️ <strong>CIP Checklist:</strong> Centang setiap step yang sudah selesai. Timestamp akan otomatis tercatat. Data akan tersimpan saat klik Save atau Finish.
        </div>

        <!-- Realtime date + last saved info -->
        <div style="background:#f9fafb;border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">🕐 Tanggal & Waktu</div>
            <div style="font-size:13px;font-weight:600;color:#111;" id="cip-realtime-clock">${nowStr}</div>
          </div>
          ${savedAtStr ? `<div style="text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">💾 Terakhir Disimpan</div>
            <div style="font-size:12px;font-weight:600;color:#1e40af;">${savedAtStr}</div>
          </div>` : ''}
        </div>

        <!-- CIP Form Fields (PH + Total Chemical only) -->
        <div style="background:#f9fafb;border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:12px;">📋 CIP Information</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
            ${buildCIPFields(key, cipData)}
          </div>
        </div>

        <!-- CIP Checklist -->
        <div id="cip-checklist-container">
          ${buildCIPChecklist(key, cipData)}
        </div>

        <div id="cip-modal-msg" style="margin-top:16px;font-size:12px;text-align:center;"></div>
      </div>
      
      <!-- Footer Actions -->
      <div style="padding:16px 24px;border-top:1px solid var(--border);background:var(--bg);display:flex;gap:10px;justify-content:space-between;">
        <button class="de-btn de-btn-ghost" onclick="closeCIPModal()">Cancel</button>
        <div style="display:flex;gap:10px;">
          <button class="de-btn de-btn-ghost" onclick="saveCIPModal('${key}', false)" style="background:white;border-color:var(--border2);">💾 Save</button>
          <button class="de-btn de-btn-primary" onclick="saveCIPModal('${key}', true)" style="background:#15803d;border-color:#15803d;">✅ Save & Finish</button>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'cip-modal-container';
  container.innerHTML = modalHTML;
  document.body.appendChild(container);
  
  // Realtime clock inside modal
  window._cipClockTimer = setInterval(() => {
    const el = document.getElementById('cip-realtime-clock');
    if (!el) { clearInterval(window._cipClockTimer); return; }
    el.textContent = new Date().toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }, 1000);

  // Store current key for later use
  window._currentCIPKey = key;
}

function closeCIPModal() {
  const container = document.getElementById('cip-modal-container');
  if (container) container.remove();
  if (window._cipClockTimer) { clearInterval(window._cipClockTimer); window._cipClockTimer = null; }
  window._currentCIPKey = null;
}

function saveCIPModal(key, isFinish) {
  // Collect form fields
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  const fields = {};
  config.fields.forEach(f => {
    const el = document.getElementById('cip-field-' + f.id);
    if (el) fields[f.id] = el.value;
  });

  // Collect checklist data
  const checklist = {};
  config.sections.forEach((section, sIdx) => {
    section.items.forEach((item, iIdx) => {
      const checkId = `cip-check-${sIdx}-${iIdx}`;
      const timeId = `cip-time-${sIdx}-${iIdx}`;
      const checkEl = document.getElementById(checkId);
      const timeEl = document.getElementById(timeId);
      
      if (checkEl) checklist[checkId] = checkEl.checked;
      if (timeEl) checklist[timeId] = timeEl.textContent !== '—' ? timeEl.textContent : '';
    });
  });

  // Find and save to project
  const sel = document.getElementById('dep-proj-sel-'+key);
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const proj = projs[+sel.value];
  if (!proj) return;

  const allProjs = gPJ('ongoing');
  const realIdx = allProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
  if (realIdx < 0) return;

  // Save CIP data
  const cipData = { fields, checklist, savedAt: new Date().toISOString() };
  
  if (key === 'production') {
    allProjs[realIdx].cipProdDone = isFinish;
    allProjs[realIdx].cipProdData = cipData;
  } else if (key === 'laboratorium') {
    allProjs[realIdx].cipLabDone = isFinish;
    allProjs[realIdx].cipLabData = cipData;
  }
  
  sPJ('ongoing', allProjs);

  // Update status indicator
  const statusEl = document.getElementById('dep-cip-status-'+key);
  if (statusEl) {
    const savedAt = new Date().toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    if (isFinish) {
      statusEl.textContent = '✅ CIP Selesai · ' + savedAt;
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#15803d';
      statusEl.style.borderColor = '#86efac';
    } else {
      statusEl.textContent = '💾 CIP Tersimpan · ' + savedAt;
      statusEl.style.background = '#dbeafe';
      statusEl.style.color = '#1e40af';
      statusEl.style.borderColor = '#93c5fd';
    }
  }

  // Show success message
  const action = isFinish ? 'selesai' : 'tersimpan';
  showQuickToast(`✅ CIP ${key === 'production' ? 'Production' : 'Laboratorium'} ${action}!`);
  
  // Close modal
  closeCIPModal();
}

window.openCIPModal = openCIPModal;
window.closeCIPModal = closeCIPModal;
window.saveCIPModal = saveCIPModal;

// ── LEGACY: Keep old saveCIPFromDE for backwards compatibility ──
function saveCIPFromDE(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') {
    const msg = document.getElementById('dep-cip-msg-'+key);
    if(msg) msg.textContent = '❌ Pilih project dulu!';
    return;
  }

  // Collect CIP fields
  const fields = {};
  let hasAny = false;
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('dep-cip-f'+i+'-'+key);
    fields['f'+i] = el ? el.value.trim() : '';
    if (fields['f'+i]) hasAny = true;
  }
  if (!hasAny) {
    const msg = document.getElementById('dep-cip-msg-'+key);
    if(msg) msg.textContent = '❌ Isi minimal satu kolom CIP!';
    return;
  }

  // Find real project in ongoing list
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const proj  = projs[+sel.value];
  if (!proj) return;
  const allProjs  = gPJ('ongoing');
  const realIdx   = allProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
  if (realIdx < 0) return;

  // Save CIP to correct field based on key
  if (key === 'production') {
    allProjs[realIdx].cipProdDone   = true;
    allProjs[realIdx].cipProdFields = fields;
  } else if (key === 'laboratorium') {
    allProjs[realIdx].cipLabDone   = true;
    allProjs[realIdx].cipLabFields = fields;
  }
  sPJ('ongoing', allProjs);

  // Update UI
  const statusEl = document.getElementById('dep-cip-status-'+key);
  if (statusEl) {
    statusEl.textContent = '✅ CIP Tersimpan';
    statusEl.style.background = '#dcfce7';
    statusEl.style.color = '#15803d';
  }
  const msg = document.getElementById('dep-cip-msg-'+key);
  if(msg) { msg.textContent = '✅ CIP berhasil disimpan!'; msg.style.color = 'var(--green)'; }
  showQuickToast('✅ CIP ' + (key==='production'?'Production':'Laboratorium') + ' disimpan!');
}
window.saveCIPFromDE = saveCIPFromDE;

function submitDEP(key){
  // Get the selected project index from dropdown
  const sel = document.getElementById('dep-proj-sel-'+key);
  if(!sel || sel.value === '') {
    const b=document.getElementById('dep-sb-'+key), m=document.getElementById('dep-sm-'+key);
    if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Pilih project dulu!';}
    return;
  }

  // Get the actual project from ongoing list
  const projs = gPJ('ongoing').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const projIdx = +sel.value;
  const proj = projs[projIdx];
  if(!proj) return;

  // Find real index in full ongoing list
  const allProjs = gPJ('ongoing');
  const realIdx = allProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
  if(realIdx < 0) return;

  // Collect filled values — only update fields that have a value entered
  let hasAny = false;
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('dep-'+f.id+'-'+key);
    if(el && el.value !== '' && !el.classList.contains('sp-ghost')) {
      allProjs[realIdx].setPoint[f.id] = el.value;
      hasAny = true;
    }
  });

  if(!hasAny) {
    const b=document.getElementById('dep-sb-'+key), m=document.getElementById('dep-sm-'+key);
    if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Isi minimal satu field dulu!';}
    return;
  }

  // Save back to localStorage
  sPJ('ongoing', allProjs);

  const b=document.getElementById('dep-sb-'+key), m=document.getElementById('dep-sm-'+key);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Set Point diperbarui! Nilai baru tersimpan.';}

  // Reload form so placeholders reflect new values
  setTimeout(()=>{
    if(b) b.style.display='none';
    loadDEProjForm(key);
  }, 1500);
}

// Utility/Limbah simple DE helpers
function resetDE(key){
  ['vol','cod','bod','tss','ph','temp','notes',
   'steam','fgtemp','fwtemp','airp','sout','cond','sbd'].forEach(f=>{
    const el=document.getElementById(key+'-'+f); if(el) el.value='';
  });
  const d=document.getElementById(key+'-date'); if(d) d.value=new Date().toISOString().split('T')[0];
}
function submitDE(key){
  const b=document.getElementById(key+'-sb'),m=document.getElementById(key+'-sm');
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Data berhasil disimpan!';}
  setTimeout(()=>{if(b)b.style.display='none';},3000);
}

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════
function getChangePasswordHTML(){return`<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">Change Password</div><div class="de-sub">Update your account password securely</div></div></div>
  <div class="de-card" style="max-width:480px">
    <div class="de-card-title"><span class="de-card-ico">🔐</span> Change Password</div>
    <div class="de-field"><label class="de-label">CURRENT PASSWORD</label>
      <div class="cp-input-wrap"><input class="de-input" type="password" id="cp-old" placeholder="Enter current password..."><span class="cp-eye" onclick="cpTog('cp-old')">👁</span></div></div>
    <div class="de-field" style="margin-top:14px"><label class="de-label">NEW PASSWORD</label>
      <div class="cp-input-wrap"><input class="de-input" type="password" id="cp-new" placeholder="Min. 6 characters..." oninput="cpVal()"><span class="cp-eye" onclick="cpTog('cp-new')">👁</span></div></div>
    <div class="de-field" style="margin-top:14px"><label class="de-label">CONFIRM NEW PASSWORD</label>
      <div class="cp-input-wrap"><input class="de-input" type="password" id="cp-cf" placeholder="Repeat new password..." oninput="cpVal()"><span class="cp-eye" onclick="cpTog('cp-cf')">👁</span></div></div>
    <div class="cp-rules"><div class="cp-rule" id="cpr-len">○ Minimum 6 characters</div><div class="cp-rule" id="cpr-mt">○ Passwords match</div></div>
    <div class="de-status-bar" id="cp-sb" style="display:none"><span id="cp-sm"></span></div>
    <div class="de-actions" style="margin-top:20px">
      <button class="de-btn de-btn-ghost" onclick="cpRst()">🔄 Reset</button>
      <button class="de-btn de-btn-primary" id="cp-btn" onclick="submitCP()">🔐 Change Password</button>
    </div>
  </div>
</div>`;}
function cpTog(id){const el=document.getElementById(id);if(el)el.type=el.type==='password'?'text':'password';}
function cpRst(){['cp-old','cp-new','cp-cf'].forEach(id=>{const el=document.getElementById(id);if(el){el.value='';el.type='password';}});const b=document.getElementById('cp-sb');if(b)b.style.display='none';cpVal();}
function cpVal(){
  const np=document.getElementById('cp-new')?.value||'',cf=document.getElementById('cp-cf')?.value||'';
  const lo=np.length>=6,mo=np===cf&&np.length>0;
  const le=document.getElementById('cpr-len'),me=document.getElementById('cpr-mt');
  if(le){le.textContent=(lo?'✅':'○')+' Minimum 6 characters';le.style.color=lo?'var(--green)':'var(--txt3)';}
  if(me){me.textContent=(mo?'✅':'○')+' Passwords match';me.style.color=mo?'var(--green)':'var(--txt3)';}
  return lo&&mo;
}
async function submitCP(){
  if(!cpVal()){showCPSt('error','❌ Password must be 6+ chars and match!');return;}
  const op=document.getElementById('cp-old')?.value,np=document.getElementById('cp-new')?.value;
  if(!op){showCPSt('error','❌ Please enter your current password!');return;}
  const uid=localStorage.getItem('user_id');if(!uid){showCPSt('error','❌ Session not found. Please log in again.');return;}
  showCPSt('loading','⏳ Saving changes...');const btn=document.getElementById('cp-btn');if(btn)btn.disabled=true;
  try{const res=await fetch('/api/auth/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:uid,old_password:op,new_password:np})});
    const d=await res.json();if(d.success){showCPSt('success','✅ Password changed successfully!');cpRst();}
    else showCPSt('error','❌ '+(d.message||'Failed'));}
  catch{showCPSt('error','❌ Server connection failed');}
  finally{if(btn)btn.disabled=false;}
}
function showCPSt(type,msg){const b=document.getElementById('cp-sb'),m=document.getElementById('cp-sm');
  if(!b||!m)return;b.style.display='flex';b.className='de-status-bar de-status-'+type;m.textContent=msg;
  if(type==='success')setTimeout(()=>{if(b)b.style.display='none';},5000);}

// ═══════════════════════════════════════════════════════════
// IoT DETAIL DRAWER
// ═══════════════════════════════════════════════════════════
const DAPI={
  'water-level':{url:'/api/iot/water-level',label:'Water Level'},
  'water-flow': {url:'/api/iot/water-flow', label:'Water Flow'},
  'lingkungan': {url:'/api/iot/lingkungan', label:'Environment'},
  'patroli':    {url:'/api/iot/patroli',    label:'Patrol'},
};
const DLABELS={s1_cm:'Sensor 1 (cm)',s2_cm:'Sensor 2 (cm)',s1:'Tank S1',s2:'Tank S2',p1:'Pompa 1',p2:'Pompa 2',rate:'Flow Rate',total:'Volume Total',t:'Temperature',h:'Humidity',raw:'Gas Level',stat:'Status'};
const DUNITS ={s1_cm:'cm',s2_cm:'cm',s1:'%',s2:'%',p1:'',p2:'',rate:'L/min',total:'mL',t:'°C',h:'%RH',raw:'ppm'};
function openDetail(tab){
  document.getElementById('detail-title').textContent=(DAPI[tab]?.label||tab)+' — Detail Data';
  document.getElementById('detail-tabs').innerHTML=`<button class="detail-tab active" onclick="swDTab('${tab}',this)">${DAPI[tab]?.label||tab}</button>`;
  document.getElementById('detail-overlay').classList.add('show');
  document.getElementById('detail-drawer').classList.add('show');
  document.body.style.overflow='hidden';
  loadDetailData(tab);
}
function closeDetail(){document.getElementById('detail-overlay')?.classList.remove('show');document.getElementById('detail-drawer')?.classList.remove('show');document.body.style.overflow='';}
function swDTab(tab,el){document.querySelectorAll('.detail-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');loadDetailData(tab);}
async function loadDetailData(tab){
  const body=document.getElementById('detail-body');
  body.innerHTML='<div style="padding:40px;text-align:center;color:var(--txt3)">Loading…</div>';
  try{
    const j=await(await fetch(DAPI[tab].url)).json();
    if(!j.success||!j.data?.length){body.innerHTML='<div style="padding:40px;text-align:center;color:var(--txt3)">No data available</div>';return;}
    const rows=j.data,latest=rows[0],keys=Object.keys(latest);
    const skip=['id','created_at','updated_at'];
    const valKeys=keys.filter(k=>!skip.includes(k));
    // Summary cards
    let h=`<div class="detail-stat-grid">${valKeys.map(k=>`
      <div class="detail-stat">
        <div class="detail-stat-label">${(DLABELS[k]||k).toUpperCase()}</div>
        <div class="detail-stat-value">${latest[k]??'—'}</div>
        <div class="detail-stat-unit">${DUNITS[k]||''}</div>
      </div>`).join('')}</div>`;
    // Timestamp
    h+=`<div class="detail-ts">🕐 Last updated: ${fmtDT(latest.created_at||latest.updated_at)}</div>`;
    // Table
    h+=`<div class="detail-tbl-title">📋 Recent Records (${rows.length})</div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--bg)">${keys.map(k=>`<th style="text-align:left;padding:9px 12px;font-size:9px;font-weight:700;color:var(--txt3);border-bottom:1px solid var(--border);text-transform:uppercase;white-space:nowrap;letter-spacing:1px">${DLABELS[k]||k.replace(/_/g,' ')}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r,ri)=>`<tr style="background:${ri%2===0?'var(--surface)':'var(--bg)'}">
        ${keys.map(k=>{const v=r[k];
          if(k==='id') return`<td style="padding:8px 12px"><span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);background:#ebf2fd;padding:2px 7px;border-radius:5px;font-weight:600">#${v}</span></td>`;
          if(k.includes('_at')) return`<td style="padding:8px 12px;color:var(--txt3);font-size:10px;font-family:'DM Mono',monospace;white-space:nowrap">${fmtDT(v)}</td>`;
          if(k==='stat'){const s=v==='AMAN'||v==='SAFE'||v===0||v==='0';return`<td style="padding:8px 12px"><span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;border:1px solid;${s?'background:#edfaf4;color:#0e7a4a;border-color:#8edcba':'background:#fef2f2;color:#b91c1c;border-color:#f0a0a0'}">${v}</span></td>`;}
          return`<td style="padding:8px 12px;color:var(--txt2);font-family:'DM Mono',monospace;font-size:12px">${v??'—'}</td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>`;
    body.innerHTML=h;
  }catch(e){body.innerHTML=`<div style="padding:40px;text-align:center;color:var(--red)">Failed to load: ${e.message}</div>`;}
}

// ═══════════════════════════════════════════════════════════
// PROJECT PAGES  (with Edit / Update)
// ═══════════════════════════════════════════════════════════

// 20 field labels for the update form
const UPD_FIELDS = [
   'Slurry ratio','Hopper calibration', 'Density', 'feed', 'Aroma flowrate', 'Stripping '
];

function getProjectHTML(type, title) {
  const isOngoing = type === 'ongoing';
  return `<div class="proj-wrap">
  <div class="proj-header">
    <div><div class="proj-title">${title}</div><div class="proj-sub">Manage and track your projects</div></div>
    <span class="proj-count-badge" id="pc-${type}">0 projects</span>
  </div>
  <input class="proj-search" id="ps-${type}" placeholder="🔍  Search projects..." oninput="renderPJ('${type}')">
  <div class="proj-list" id="pl-${type}"></div>
</div>
${isOngoing ? '<button class="proj-fab" onclick="openAPJ(\'ongoing\')">＋</button>' : ''}

<!-- ADD modal -->
<div class="proj-modal-overlay" id="pmo-${type}">
  <div class="proj-modal">
    <div class="proj-modal-head"><div class="proj-modal-title">📋 Add New Project</div><button class="proj-modal-close" onclick="closeAPJ('${type}')">✕</button></div>
    <div class="proj-modal-body">
      <div class="proj-modal-grid">
        <div class="de-field proj-modal-full"><label class="de-label">PROJECT TITLE *</label><input class="de-input" id="pf-nm-${type}" type="text" placeholder="Enter project title..."></div>
        <div class="de-field"><label class="de-label">START DATE</label><input class="de-input" id="pf-st-${type}" type="date"></div>
        <div class="de-field"><label class="de-label">EXPECTED END</label><input class="de-input" id="pf-en-${type}" type="date"></div>
        <div class="de-field proj-modal-full">
          <label class="de-label">KATEGORI PRODUK</label>
          <div style="display:flex;gap:6px;align-items:center">
            <select class="de-input de-select" id="pf-cat-${type}" style="flex:1" onchange="onProjCatChange('${type}','pf')">
              <option value="">-- Pilih kategori --</option>
              <option value="teh-hijau">🍵 Teh Hijau</option>
              <option value="oolong">🍵 Oolong</option>
              <option value="black-tea">☕ Black Tea</option>
              <option value="roasted-jasmine">🌸 Roasted Green Tea Jasmine</option>
              <option value="robusta">☕ Kopi Robusta</option>
              <option value="arabika">☕ Kopi Arabika</option>
            </select>
            <button type="button" class="de-btn de-btn-ghost" style="padding:6px 10px;font-size:11px;white-space:nowrap" onclick="addCustomCategory('${type}','pf')">＋ Tambah</button>
          </div>
          <div id="pf-cat-custom-${type}" style="display:none;margin-top:6px">
            <input class="de-input" id="pf-cat-new-${type}" type="text" placeholder="Nama kategori baru..." style="margin-bottom:4px">
            <button type="button" class="de-btn de-btn-primary" style="padding:5px 14px;font-size:11px" onclick="saveCustomCategory('${type}','pf')">Simpan</button>
          </div>
        </div>
        <div class="de-field proj-modal-full">
          <label class="de-label">PREPARATION METHOD</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg)" id="pf-tl-${type}">
            ${['Ekstraksi','Separator Kasar','Separator Halus','Filtrasi','Evaporasi'].map(m=>`
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--txt2);cursor:pointer;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);transition:all .15s" class="method-chip">
                <input type="checkbox" value="${m}" style="accent-color:var(--blue);cursor:pointer"> ${m}
              </label>`).join('')}
          </div>
        </div>
        <div class="de-field proj-modal-full"><label class="de-label">MATERIALS USED</label><textarea class="de-input de-textarea" id="pf-mat-${type}" placeholder="e.g. Steel pipes, concrete..." style="min-height:60px"></textarea></div>
        <div class="de-field proj-modal-full"><label class="de-label">NOTES</label><textarea class="de-input de-textarea" id="pf-nt-${type}" placeholder="Additional notes..." style="min-height:60px"></textarea></div>
      </div>
      <div class="de-status-bar" id="psb-${type}" style="display:none"><span id="psm-${type}"></span></div>
      <div class="de-actions" style="margin-top:18px">
        <button class="de-btn de-btn-ghost" onclick="closeAPJ('${type}')">Cancel</button>
        <button class="de-btn de-btn-primary" onclick="submitPJ('${type}')">💾 Create Project</button>
      </div>
    </div>
  </div>
</div>

<!-- EDIT modal -->
<div class="proj-modal-overlay" id="edit-overlay-${type}">
  <div class="proj-modal">
    <div class="proj-modal-head"><div class="proj-modal-title">✏️ Edit Project</div><button class="proj-modal-close" onclick="closeEditPJ('${type}')">✕</button></div>
    <div class="proj-modal-body">
      <div class="proj-modal-grid">
        <div class="de-field proj-modal-full"><label class="de-label">PROJECT TITLE *</label><input class="de-input" id="ef-nm-${type}" type="text"></div>
        <div class="de-field">
          <label class="de-label">KATEGORI PRODUK</label>
          <div style="display:flex;gap:6px;align-items:center">
            <select class="de-input de-select" id="ef-cat-${type}" style="flex:1" onchange="onProjCatChange('${type}','ef')">
              <option value="">-- Pilih kategori --</option>
              <option value="teh-hijau">🍵 Teh Hijau</option>
              <option value="oolong">🍵 Oolong</option>
              <option value="black-tea">☕ Black Tea</option>
              <option value="roasted-jasmine">🌸 Roasted Green Tea Jasmine</option>
              <option value="robusta">☕ Kopi Robusta</option>
              <option value="arabika">☕ Kopi Arabika</option>
            </select>
            <button type="button" class="de-btn de-btn-ghost" style="padding:6px 10px;font-size:11px;white-space:nowrap" onclick="addCustomCategory('${type}','ef')">＋ Tambah</button>
          </div>
          <div id="ef-cat-custom-${type}" style="display:none;margin-top:6px">
            <input class="de-input" id="ef-cat-new-${type}" type="text" placeholder="Nama kategori baru..." style="margin-bottom:4px">
            <button type="button" class="de-btn de-btn-primary" style="padding:5px 14px;font-size:11px" onclick="saveCustomCategory('${type}','ef')">Simpan</button>
          </div>
        </div>
        <div class="de-field"><label class="de-label">START DATE</label><input class="de-input" id="ef-st-${type}" type="date"></div>
        <div class="de-field"><label class="de-label">EXPECTED END</label><input class="de-input" id="ef-en-${type}" type="date"></div>
        <div class="de-field proj-modal-full"><label class="de-label">MATERIALS USED</label><textarea class="de-input de-textarea" id="ef-mat-${type}" style="min-height:70px"></textarea></div>
        <div class="de-field proj-modal-full">
          <label class="de-label">PREPARATION METHOD</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg)" id="ef-tl-${type}">
            ${['Ekstraksi','Separator Kasar','Separator Halus','Filtrasi','Evaporasi'].map(m=>`
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--txt2);cursor:pointer;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);transition:all .15s" class="method-chip">
                <input type="checkbox" value="${m}" style="accent-color:var(--blue);cursor:pointer"> ${m}
              </label>`).join('')}
          </div>
        </div>
        <div class="de-field proj-modal-full"><label class="de-label">NOTES</label><textarea class="de-input de-textarea" id="ef-nt-${type}" style="min-height:60px"></textarea></div>
      </div>
      <div class="de-status-bar" id="esb-${type}" style="display:none"><span id="esm-${type}"></span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;gap:10px">
        <button class="de-btn" style="background:#fef2f2;color:var(--red);border:1px solid #fecaca;padding:9px 16px" onclick="deleteFromSetPoint('${type}')">🗑️ Delete</button>
        <div style="display:flex;gap:10px">
          <button class="de-btn de-btn-ghost" onclick="closeEditPJ('${type}')">Cancel</button>
          <button class="de-btn de-btn-primary" onclick="saveEditPJ('${type}')">💾 Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- SET POINT modal -->
<div class="proj-modal-overlay" id="sp-overlay-${type}">
  <div class="proj-modal sp-modal">
    <div class="proj-modal-head">
      <div class="proj-modal-title">⚙️ Set Point — <span id="sp-proj-nm-${type}">Project</span></div>
      <button class="proj-modal-close" onclick="closeSP('${type}')">✕</button>
    </div>
    <div class="proj-modal-body">
      <div style="padding:10px 12px;background:#ebf2fd;border:1px solid #c3d9fa;border-radius:8px;font-size:11px;color:var(--blue);margin-bottom:16px;">
        <strong>⚠️ Note:</strong> Fill all required parameters for this production batch. These values will be used as reference in data entry forms.
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">🧪 Slurry</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">Slurry Ratio</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-slurry-${type}" type="number" step="0.1"><span class="de-input-unit">%</span></div></div>
          <div class="de-field"><label class="de-label">Hopper Calibration</label><input class="de-input sp-field-${type}" id="sp-hopper-${type}" type="text"></div>
          <div class="de-field"><label class="de-label">Density</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-density-${type}" type="number" step="0.1"><span class="de-input-unit">Kg/m³</span></div></div>
        </div>
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">💧 Flow</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">Feed</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-feed-${type}" type="number" step="0.1"><span class="de-input-unit">L/h</span></div></div>
          <div class="de-field"><label class="de-label">Aroma Flowrate</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-aroma-${type}" type="number" step="0.1"><span class="de-input-unit">L/h</span></div></div>
          <div class="de-field"><label class="de-label">Stripping Steam</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-steam-${type}" type="number" step="0.1"><span class="de-input-unit">kg/h</span></div></div>
          <div class="de-field"><label class="de-label">Product Out</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-prod-out-${type}" type="number" step="0.1"><span class="de-input-unit">L/h</span></div></div>
          <div class="de-field"><label class="de-label">Condensate #1</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-cond1-${type}" type="number" step="0.1"><span class="de-input-unit">L/h</span></div></div>
          <div class="de-field"><label class="de-label">Condensate #2</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-cond2-${type}" type="number" step="0.1"><span class="de-input-unit">L/h</span></div></div>
        </div>
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">📊 Strip Rate</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">External</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-ext-${type}" type="number" step="0.1"><span class="de-input-unit">%</span></div></div>
          <div class="de-field"><label class="de-label">Internal</label><input class="de-input sp-field-${type}" id="sp-int-${type}" type="text"></div>
          <div class="de-field"><label class="de-label">Condenser #1</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-cond-rate-${type}" type="number" step="0.1"><span class="de-input-unit">%</span></div></div>
          <div class="de-field"><label class="de-label">Offset</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-offset-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
        </div>
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">🌡️ Temperatures</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">Product Feed</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-feed-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Product Heater</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-heater-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Top of Column</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-top-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Bottom of Column</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-bot-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Product Out</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-c1-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Condensate #1</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-c2-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Condensate #2</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-out-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
        </div>
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">❄️ Coolants</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">Chilled Water</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-chill-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          <div class="de-field"><label class="de-label">Condenser Water</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-cond-water-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
        </div>
      </div>
      <div class="setpoint-section">
        <div class="setpoint-section-title">📏 Pressure</div>
        <div class="setpoint-grid">
          <div class="de-field"><label class="de-label">System</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-press-sys-${type}" type="number" step="0.1"><span class="de-input-unit">kPa(g)</span></div></div>
          <div class="de-field"><label class="de-label">Steam Flow</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-press-steam-${type}" type="number" step="0.1"><span class="de-input-unit">Kg/h</span></div></div>
        </div>
      </div>
      <div class="de-status-bar" id="sp-sb-${type}" style="display:none"><span id="sp-sm-${type}"></span></div>
      <div class="de-actions" style="margin-top:20px">
        <button class="de-btn de-btn-ghost" onclick="closeSP('${type}')">Cancel</button>
        <button class="de-btn de-btn-primary" onclick="saveSP('${type}')">💾 Save Set Point</button>
      </div>
    </div>
  </div>
</div>

<!-- CIP modal (6 blank untitled fields) -->
<div class="proj-modal-overlay" id="cip-overlay-${type}">
  <div class="proj-modal cip-modal" style="max-width:600px!important">
    <div class="proj-modal-head">
      <div class="proj-modal-title">🧼 CIP — <span id="cip-proj-nm-${type}">Project</span></div>
      <button class="proj-modal-close" onclick="closeCIP_enh('${type}')">✕</button>
    </div>
    <div class="proj-modal-body">
      <div class="cip-blank-note">
        ℹ️ Isi formulir CIP sebelum melanjutkan ke Finish Production. Simpan untuk mengaktifkan tombol <strong>End</strong>.
      </div>
      <div class="cip-grid">
        <div class="de-field"><label class="de-label">Untitled 1</label><input class="de-input" id="cip-f1-${type}" type="text" placeholder="Isi kolom ini..."></div>
        <div class="de-field"><label class="de-label">Untitled 2</label><input class="de-input" id="cip-f2-${type}" type="text" placeholder="Isi kolom ini..."></div>
        <div class="de-field"><label class="de-label">Untitled 3</label><input class="de-input" id="cip-f3-${type}" type="text" placeholder="Isi kolom ini..."></div>
        <div class="de-field"><label class="de-label">Untitled 4</label><input class="de-input" id="cip-f4-${type}" type="text" placeholder="Isi kolom ini..."></div>
        <div class="de-field"><label class="de-label">Untitled 5</label><input class="de-input" id="cip-f5-${type}" type="text" placeholder="Isi kolom ini..."></div>
        <div class="de-field"><label class="de-label">Untitled 6</label><input class="de-input" id="cip-f6-${type}" type="text" placeholder="Isi kolom ini..."></div>
      </div>
      <div class="de-status-bar" id="cip-sb-${type}" style="display:none"><span id="cip-sm-${type}"></span></div>
      <div class="de-actions" style="margin-top:18px">
        <button class="de-btn de-btn-ghost" onclick="closeCIP_enh('${type}')">Cancel</button>
        <button class="de-btn de-btn-primary" onclick="saveCIP_enh('${type}')">💾 Save CIP</button>
      </div>
    </div>
  </div>
</div>

<!-- FINISH PRODUCTION modal (Date / Name / Code / Brix entries) -->
<div class="proj-modal-overlay" id="fp-overlay-${type}">
  <div class="proj-modal fp-modal" style="max-width:760px!important">
    <div class="proj-modal-head">
      <div class="proj-modal-title">🏭 Finish Production — <span id="fp-proj-nm-${type}">Project</span></div>
      <button class="proj-modal-close" onclick="closeFP('${type}')">✕</button>
    </div>
    <div class="proj-modal-body">
      <div style="padding:10px 14px;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:8px;font-size:11px;color:#7c3aed;margin-bottom:16px;">
        ℹ️ Isi data produksi akhir. Tambah baris sesuai kebutuhan. Simpan untuk mengaktifkan tombol <strong>End</strong>.
      </div>
      <div id="fp-items-${type}"></div>
      <button class="fp-add-btn" onclick="addFPItem('${type}')">＋ Tambah Baris</button>
      <div class="de-status-bar" id="fp-sb-${type}" style="display:none"><span id="fp-sm-${type}"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="closeFP('${type}')">Cancel</button>
        <button class="de-btn de-btn-primary" onclick="saveFP('${type}')">💾 Save</button>
      </div>
    </div>
  </div>
</div>

<!-- UPDATE (20 form) modal -->
<div class="upd-overlay" id="upd-overlay-${type}">
  <div class="upd-modal">
    <div class="upd-modal-head">
      <div>
        <div class="upd-modal-title">📝 Update Laporan Harian</div>
        <div class="upd-modal-sub" id="upd-proj-name-${type}">—</div>
      </div>
      <button class="upd-modal-close" onclick="closeUpdModal('${type}')">✕</button>
    </div>
    <div class="upd-modal-body">
      <div id="upd-entry-count-${type}" style="font-size:11px;color:var(--txt3);margin-bottom:14px;padding:8px 12px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">📋 Entri ke-<strong id="upd-entry-num-${type}">1</strong> — isi semua kolom lalu klik Simpan</div>
      <div class="upd-fields-grid" id="upd-fields-${type}"></div>
    </div>
    <div class="upd-modal-foot">
      <button class="de-btn de-btn-ghost" onclick="closeUpdModal('${type}')">Tutup</button>
      <button class="de-btn de-btn-primary" onclick="saveUpdEntry('${type}')">💾 Simpan</button>
    </div>
  </div>
</div>

<!-- SUMMARY drawer (completed) -->
<div class="summ-overlay" id="summ-overlay-${type}" onclick="closeSumm('${type}')"></div>
<div class="summ-drawer" id="summ-drawer-${type}">
  <div class="summ-head">
    <div>
      <div class="proj-det-name" id="summ-nm-${type}">—</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:3px" id="summ-dt-${type}">—</div>
    </div>
    <button class="proj-modal-close" onclick="closeSumm('${type}')">✕</button>
  </div>
  <div class="summ-body" id="summ-body-${type}"></div>
</div>
<!-- DETAIL drawer (for recent) -->
<div class="proj-det-overlay" id="pdo-${type}" onclick="closePD('${type}')"></div>
<div class="proj-det-drawer" id="pdd-${type}">
  <div class="proj-det-head">
    <div><div class="proj-det-name" id="pd-nm-${type}">—</div><div class="proj-det-date" id="pd-dt-${type}">—</div></div>
    <button class="proj-modal-close" onclick="closePD('${type}')">✕</button>
  </div>
  <div class="proj-det-body" id="pd-bd-${type}"></div>
</div>
`;
}

// ── Storage helpers ───────────────────────────────────────
function initProjectPage(t) {
  const d = document.getElementById('pf-st-'+t);
  if (d) d.value = new Date().toISOString().split('T')[0];
  renderPJ(t);
}
const gPJ = t => JSON.parse(localStorage.getItem('pj_'+t) || '[]');
const sPJ = (t, l) => localStorage.setItem('pj_'+t, JSON.stringify(l));

// ── Render list ───────────────────────────────────────────
function renderPJ(type) {
  const list=document.getElementById('pl-'+type), cnt=document.getElementById('pc-'+type);
  const q=(document.getElementById('ps-'+type)?.value||'').toLowerCase();
  if(!list) return;
  let ps=gPJ(type); if(q) ps=ps.filter(p=>p.name.toLowerCase().includes(q));
  if(cnt) cnt.textContent=ps.length+' project'+(ps.length!==1?'s':'');
  if(!ps.length){list.innerHTML=`<div class="proj-empty"><div class="proj-empty-ico">📂</div>${q?'No projects match.':'No projects yet — click ＋ to add one!'}</div>`;return;}
  const col={ongoing:'var(--blue)',recent:'var(--orange)',completed:'var(--green)'};
  const isOngoing = type === 'ongoing';
  const isCompleted = type === 'completed';

  list.innerHTML=ps.map((p,i)=>{
    const updCount = (p.updates||[]).length;
    const hasSetPoint = p.setPoint && Object.keys(p.setPoint).length > 0;
    const hasCIPProd = p.cipProdDone === true;
    const hasCIPLab  = p.cipLabDone  === true;
    const hasCIP     = hasCIPProd && hasCIPLab;
    const hasFP      = p.fpDone === true;
    const isReady    = hasSetPoint && hasCIP && hasFP;

    // CIP status helper
    let cipStatus = '';
    if (hasCIPProd && hasCIPLab) cipStatus = '✅ CIP Lengkap';
    else if (hasCIPProd) cipStatus = '⚙️ CIP Prod ✓';
    else if (hasCIPLab)  cipStatus = '🧪 CIP Lab ✓';

    // Status label & class
    let statusCls = type, statusLbl = 'ON GOING';
    if (isOngoing) {
      if (isReady)           { statusCls = 'ready';    statusLbl = 'READY'; }
      else if (hasCIP)       { statusCls = 'ongoing';  statusLbl = 'CIP ✓'; }
      else if (hasSetPoint)  { statusCls = 'ongoing';  statusLbl = 'SP ✓'; }
      else                   { statusCls = 'ongoing';  statusLbl = 'ONGOING'; }
    } else if (isCompleted)  { statusCls = 'completed'; statusLbl = 'DONE'; }

    const actionBtns = isOngoing ? `
      <div class="proj-card-divider"></div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        <button class="pj-btn pj-btn-edit" onclick="openEditPJ('${type}',${i})">✏️ Edit</button>
        <button class="pj-btn pj-btn-edit" onclick="${hasSetPoint?'':('openSP(\''+type+'\','+i+')')}"
          ${hasSetPoint ? 'disabled style="opacity:.45;cursor:not-allowed;background:#f3f4f6;border-color:#d1d5db;color:#9ca3af;"' : ''}
          title="${hasSetPoint?'Set Point sudah dikunci':'Isi Set Point'}">
          ${hasSetPoint ? '🔒 Set Point' : '⚙️ Set Point'}
        </button>
        <button class="pj-btn pj-btn-finish" onclick="openFP('${type}',${i})"
          title="Finish Production">
          ${p.fpDone ? '✓ Finish Prod' : '🏭 Finish Prod'}
        </button>
        ${cipStatus ? `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:var(--green-bg);color:var(--green);border:1px solid #6ee7b7;font-weight:600">${cipStatus}</span>` : `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db">⏳ CIP Belum</span>`}
        <button class="pj-btn pj-btn-end" onclick="endProd('${type}',${i})"
          ${!(hasCIP && hasFP) ? 'disabled' : ''}
          title="${!(hasCIP && hasFP)?'Lengkapi CIP (Prod+Lab) dan Finish Production dulu':'Akhiri produksi'}">
          🏁 End
        </button>
      </div>` : '';
    const viewBtn = isCompleted ? `
      <div class="proj-card-divider"></div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        <button class="pj-btn pj-btn-update" onclick="openSumm('${type}',${i})">📊 Summary</button>
      </div>` : '';
    return `
      <div class="proj-card" style="--acc:${col[type]||'var(--blue)'}; flex-wrap:wrap; gap:0;" onclick="${isOngoing||isCompleted?'':'openPD(\''+type+'\','+i+')'}">
        <div style="display:flex;align-items:flex-start;gap:14px;width:100%;">
          <div class="proj-card-icon">📋</div>
          <div class="proj-card-body" style="min-width:200px;flex:1">
            <div class="proj-card-name">${p.name}</div>
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:4px;">
              <div>
                <div class="proj-card-meta"><span>📅 ${p.start||'—'}</span><span>🏁 ${p.end||'—'}</span>${updCount>0?`<span>🔄 ${updCount} upd</span>`:''}</div>
                ${p.kategori?`<div style="font-size:10px;color:var(--txt3);margin-top:3px">🏷️ ${getCatLabel(p.kategori)}</div>`:''}
                <span class="proj-status ${statusCls}">${statusLbl}</span>
              </div>
              ${p.batch?`<div style="font-size:10px;font-family:'DM Mono',monospace;font-weight:700;color:#6b7280;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:3px 8px;white-space:nowrap;flex-shrink:0">${p.batch}</div>`:''}
            </div>
          </div>
        </div>
        ${actionBtns}${viewBtn}
      </div>`}).join('');
}

// ── Add project ───────────────────────────────────────────
function openAPJ(t){
  document.getElementById('pmo-'+t)?.classList.add('show');
  const pfCatSel = document.getElementById('pf-cat-'+t);
  if (pfCatSel) loadCustomCategoriesIntoSelect(pfCatSel);
}
function closeAPJ(t){
  document.getElementById('pmo-'+t)?.classList.remove('show');
  ['pf-nm-','pf-st-','pf-en-','pf-mat-','pf-nt-'].forEach(f=>{const el=document.getElementById(f+t);if(el)el.value='';});
  document.querySelectorAll('#pf-tl-'+t+' input[type=checkbox]').forEach(cb=>cb.checked=false);
  const b=document.getElementById('psb-'+t);if(b)b.style.display='none';
}
function genBatchNo() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yy = String(today.getFullYear()).slice(-2);
  const key = 'batch_'+dd+mm+yy;
  let seq = (parseInt(localStorage.getItem(key)||'0'))+1;
  localStorage.setItem(key, seq);
  return String(seq).padStart(2,'0')+'-'+dd+mm+yy;
}
function getCatLabel(val) {
  const map = {'teh-hijau':'Teh Hijau','oolong':'Oolong','black-tea':'Black Tea',
    'roasted-jasmine':'Roasted Green Tea Jasmine','robusta':'Kopi Robusta','arabika':'Kopi Arabika'};
  if (map[val]) return map[val];
  // Custom categories from localStorage
  const customs = JSON.parse(localStorage.getItem('custom_categories')||'[]');
  const found = customs.find(c=>c.value===val);
  return found ? found.label : val;
}
function onProjCatChange(type, prefix) {}
function addCustomCategory(type, prefix) {
  const wrap = document.getElementById(prefix+'-cat-custom-'+type);
  if (wrap) wrap.style.display = wrap.style.display==='none' ? 'block' : 'none';
}
function saveCustomCategory(type, prefix) {
  const inp = document.getElementById(prefix+'-cat-new-'+type);
  const sel = document.getElementById(prefix+'-cat-'+type);
  if (!inp || !sel) return;
  const label = inp.value.trim();
  if (!label) return;
  const value = 'custom-'+label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const customs = JSON.parse(localStorage.getItem('custom_categories')||'[]');
  if (!customs.find(c=>c.value===value)) {
    customs.push({value, label});
    localStorage.setItem('custom_categories', JSON.stringify(customs));
  }
  // Add to this select if not already there
  if (!sel.querySelector('option[value="'+value+'"]')) {
    const opt = document.createElement('option');
    opt.value = value; opt.textContent = '📌 '+label;
    sel.appendChild(opt);
  }
  sel.value = value;
  inp.value = '';
  const wrap = document.getElementById(prefix+'-cat-custom-'+type);
  if (wrap) wrap.style.display = 'none';
  showQuickToast('✅ Kategori "'+label+'" ditambahkan!');
}
function loadCustomCategoriesIntoSelect(selEl) {
  if (!selEl) return;
  const customs = JSON.parse(localStorage.getItem('custom_categories')||'[]');
  customs.forEach(c => {
    if (!selEl.querySelector('option[value="'+c.value+'"]')) {
      const opt = document.createElement('option');
      opt.value = c.value; opt.textContent = '📌 '+c.label;
      selEl.appendChild(opt);
    }
  });
}
function submitPJ(t){
  const name=document.getElementById('pf-nm-'+t)?.value.trim();
  if(!name){showPSt(t,'error','❌ Project title is required!');return;}
  const kategori = document.getElementById('pf-cat-'+t)?.value || '';
  const batch = genBatchNo();
  const p={name,kategori,batch,start:document.getElementById('pf-st-'+t)?.value,end:document.getElementById('pf-en-'+t)?.value,
   materials:document.getElementById('pf-mat-'+t)?.value.trim(),
   tools:[...document.querySelectorAll('#pf-tl-'+t+' input[type=checkbox]:checked')].map(cb=>cb.value).join(', '),
    notes:document.getElementById('pf-nt-'+t)?.value.trim(),
    setPoint:null, cipDone:false,
    updates:[],created_at:new Date().toISOString()};
  const l=gPJ(t);l.unshift(p);sPJ(t,l);
  showPSt(t,'success','✅ Project saved! Batch: '+batch);setTimeout(()=>{closeAPJ(t);renderPJ(t);},900);
}
function showPSt(t, k, m) {
  const b  = document.getElementById('psb-'+t);
  const el = document.getElementById('psm-'+t);
  if (!b || !el) return;
  b.style.display = 'flex';
  b.className     = 'de-status-bar de-status-'+k;
  el.textContent  = m;
}

// ── Edit project ──────────────────────────────────────────
let _editPJIdx = -1;
function openEditPJ(type, idx) {
  _editPJIdx = idx;
  const p = gPJ(type)[idx]; if(!p) return;
  document.getElementById('ef-nm-'+type).value  = p.name || '';
  const efCatSel = document.getElementById('ef-cat-'+type);
  if (efCatSel) { loadCustomCategoriesIntoSelect(efCatSel); efCatSel.value = p.kategori || ''; }
  document.getElementById('ef-st-'+type).value  = p.start || '';
  document.getElementById('ef-en-'+type).value  = p.end || '';
  document.getElementById('ef-mat-'+type).value = p.materials || '';
  const _saved = (p.tools||'').split(', ').filter(Boolean);
  document.querySelectorAll('#ef-tl-'+type+' input[type=checkbox]').forEach(cb=>{cb.checked=_saved.includes(cb.value);});
  document.getElementById('ef-nt-'+type).value  = p.notes || '';
  document.getElementById('edit-overlay-'+type)?.classList.add('show');
}
function closeEditPJ(type) {
  document.getElementById('edit-overlay-'+type)?.classList.remove('show');
  const b=document.getElementById('esb-'+type);if(b)b.style.display='none';
}
function saveEditPJ(type) {
  const name = document.getElementById('ef-nm-'+type)?.value.trim();
  if(!name){const b=document.getElementById('esb-'+type),m=document.getElementById('esm-'+type);if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Title required!';}return;}
  const ps = gPJ(type);
  ps[_editPJIdx] = {...ps[_editPJIdx],
    name,
    kategori: document.getElementById('ef-cat-'+type)?.value || ps[_editPJIdx].kategori || '',
    start:   document.getElementById('ef-st-'+type)?.value,
    end:     document.getElementById('ef-en-'+type)?.value,
    materials: document.getElementById('ef-mat-'+type)?.value.trim(),
    tools: [...document.querySelectorAll('#ef-tl-'+type+' input[type=checkbox]:checked')].map(cb=>cb.value).join(', '),
    notes:   document.getElementById('ef-nt-'+type)?.value.trim(),
  };
  sPJ(type, ps);
  const b=document.getElementById('esb-'+type),m=document.getElementById('esm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Project updated!';}
  setTimeout(()=>{closeEditPJ(type);renderPJ(type);},900);
}

function deleteFromSetPoint(type) {
  if (_editPJIdx < 0) return;
  const ps = gPJ(type);
  const name = ps[_editPJIdx]?.name || 'Project ini';
  if (!confirm(`Hapus "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  ps.splice(_editPJIdx, 1);
  sPJ(type, ps);
  closeEditPJ(type);
  renderPJ(type);
  showQuickToast('🗑️ Project dihapus.');
}

// ── Set Point functions ───────────────────────────────────
let _spPJIdx = -1;
function openSP(type, idx) {
  _spPJIdx = idx;
  const p = gPJ(type)[idx]; if (!p) return;
  document.getElementById('sp-proj-nm-'+type).textContent = p.name;
  // Clear all SP fields
  document.querySelectorAll('.sp-field-'+type).forEach(f => f.value = '');
  // Load existing set point
  if (p.setPoint) {
    Object.keys(p.setPoint).forEach(k => {
      const el = document.getElementById(k+'-'+type);
      if (el) el.value = p.setPoint[k];
    });
  }
  const sb = document.getElementById('sp-sb-'+type); if(sb) sb.style.display='none';
  document.getElementById('sp-overlay-'+type)?.classList.add('show');
}
function closeSP(type) {
  document.getElementById('sp-overlay-'+type)?.classList.remove('show');
  _spPJIdx = -1;
}
function saveSP(type) {
  if (_spPJIdx < 0) return;
  const spData = {};
  document.querySelectorAll('.sp-field-'+type).forEach(f => {
    // Store by base key (strip the type suffix)
    const baseKey = f.id.replace('-'+type,'');
    spData[baseKey] = f.value;
  });
  const ps = gPJ(type);
  ps[_spPJIdx].setPoint = spData;
  sPJ(type, ps);
  const b=document.getElementById('sp-sb-'+type),m=document.getElementById('sp-sm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Set Point saved!';}
  setTimeout(()=>{closeSP(type);renderPJ(type);},900);
}

// ── CIP functions (6 untitled fields) ────────────────────
let _cipPJIdx = -1;
function openCIP_enh(type, idx) {
  _cipPJIdx = idx;
  const p = gPJ(type)[idx]; if (!p) return;
  document.getElementById('cip-proj-nm-'+type).textContent = p.name;
  for(let i=1;i<=6;i++){
    const el = document.getElementById('cip-f'+i+'-'+type);
    if(el) el.value = (p.cipFields && p.cipFields['f'+i]) || '';
  }
  const sb = document.getElementById('cip-sb-'+type); if(sb) sb.style.display='none';
  document.getElementById('cip-overlay-'+type)?.classList.add('show');
}
function closeCIP_enh(type) {
  document.getElementById('cip-overlay-'+type)?.classList.remove('show');
  _cipPJIdx = -1;
}
function saveCIP_enh(type) {
  if (_cipPJIdx < 0) return;
  const fields = {};
  let hasAny = false;
  for(let i=1;i<=6;i++){
    const el = document.getElementById('cip-f'+i+'-'+type);
    fields['f'+i] = el ? el.value.trim() : '';
    if(fields['f'+i]) hasAny = true;
  }
  if(!hasAny){
    const b=document.getElementById('cip-sb-'+type),m=document.getElementById('cip-sm-'+type);
    if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Isi minimal satu kolom!';}
    return;
  }
  const ps = gPJ(type);
  ps[_cipPJIdx].cipDone   = true;
  ps[_cipPJIdx].cipFields = fields;
  sPJ(type, ps);
  const b=document.getElementById('cip-sb-'+type),m=document.getElementById('cip-sm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ CIP disimpan! Lanjutkan ke Finish Production.';}
  setTimeout(()=>{closeCIP_enh(type);renderPJ(type);},900);
}

// ── Finish Production functions ───────────────────────────
let _fpPJIdx = -1;
function openFP(type, idx) {
  _fpPJIdx = idx;
  const p = gPJ(type)[idx]; if (!p) return;
  document.getElementById('fp-proj-nm-'+type).textContent = p.name;
  const container = document.getElementById('fp-items-'+type);
  container.innerHTML = '';
  if(p.fpItems && p.fpItems.length > 0){
    p.fpItems.forEach(item => addFPItem(type, item));
  } else {
    addFPItem(type);
  }
  const sb = document.getElementById('fp-sb-'+type); if(sb) sb.style.display='none';
  document.getElementById('fp-overlay-'+type)?.classList.add('show');
}
function closeFP(type) {
  document.getElementById('fp-overlay-'+type)?.classList.remove('show');
  _fpPJIdx = -1;
}
function addFPItem(type, data=null) {
  const container = document.getElementById('fp-items-'+type);
  if(!container) return;
  const uid = Date.now() + Math.random();
  const row = document.createElement('div');
  row.className = 'fp-item';
  row.id = 'fp-row-'+uid;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;background:var(--bg);border-radius:8px;align-items:end;margin-bottom:8px;border:1px solid var(--border);';
  row.innerHTML = `
    <div class="de-field">
      <label class="de-label">Tanggal</label>
      <input class="de-input" id="fpr-date-${uid}" type="date" value="${data?.date || new Date().toISOString().split('T')[0]}">
    </div>
    <div class="de-field">
      <label class="de-label">Nama Produk</label>
      <input class="de-input" id="fpr-name-${uid}" type="text" value="${data?.name||''}" placeholder="Nama produk...">
    </div>
    <div class="de-field">
      <label class="de-label">Kode Produksi</label>
      <input class="de-input" id="fpr-code-${uid}" type="text" value="${data?.code||''}" placeholder="Kode produksi...">
    </div>
    <div class="de-field">
      <label class="de-label">Brix <span style="font-weight:400;color:var(--txt3)">(°Bx)</span></label>
      <input class="de-input" id="fpr-brix-${uid}" type="number" step="0.1" value="${data?.brix||''}" placeholder="0.0">
    </div>
    <div class="de-field">
      <label class="de-label">Berat <span style="font-weight:400;color:var(--txt3)">(kg)</span></label>
      <input class="de-input" id="fpr-berat-${uid}" type="number" step="0.1" value="${data?.berat||''}" placeholder="0.0">
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:flex-end">
      <button class="fp-item-remove" onclick="document.getElementById('fp-row-${uid}').remove()" style="padding:8px 14px;font-size:12px">✕ Hapus</button>
    </div>`;
  container.appendChild(row);
}
function saveFP(type) {
  if (_fpPJIdx < 0) return;
  const items = [];
  document.querySelectorAll(`#fp-items-${type} .fp-item`).forEach(row => {
    const uid = row.id.replace('fp-row-','');
    items.push({
      date:  document.getElementById('fpr-date-'+uid)?.value  || '',
      name:  document.getElementById('fpr-name-'+uid)?.value  || '',
      code:  document.getElementById('fpr-code-'+uid)?.value  || '',
      brix:  document.getElementById('fpr-brix-'+uid)?.value  || '',
      berat: document.getElementById('fpr-berat-'+uid)?.value || '',
    });
  });
  const ps = gPJ(type);
  ps[_fpPJIdx].fpDone  = true;
  ps[_fpPJIdx].fpItems = items;
  sPJ(type, ps);
  const b=document.getElementById('fp-sb-'+type),m=document.getElementById('fp-sm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Finish Production disimpan! Tombol End sekarang aktif.';}
  setTimeout(()=>{closeFP(type);renderPJ(type);},900);
}

// ── End Production ────────────────────────────────────────
function endProd(type, idx) {
  const ps = gPJ(type);
  const p  = ps[idx];
  if (!p) return;
  const hasCIPProd = p.cipProdDone === true;
  const hasCIPLab  = p.cipLabDone  === true;
  const hasCIP     = hasCIPProd && hasCIPLab;
  const hasFP      = p.fpDone === true;
  if (!hasCIPProd) { showQuickToast('❌ CIP Data Entry Production belum diisi!'); return; }
  if (!hasCIPLab)  { showQuickToast('❌ CIP Data Entry Laboratorium belum diisi!'); return; }
  if (!hasFP)      { showQuickToast('❌ Finish Production belum diisi!'); return; }
  if (!confirm(`Akhiri produksi untuk "${p.name}"?\nProyek akan dipindahkan ke Completed.`)) return;
  p.completed_at = new Date().toISOString();
  const comp = gPJ('completed');
  comp.unshift(p);
  sPJ('completed', comp);
  ps.splice(idx, 1);
  sPJ(type, ps);
  renderPJ(type);
  showQuickToast('✅ Produksi selesai! Proyek dipindahkan ke Completed.');
}

// ── Complete project (kept for backward compat) ───────────
function completePJ(idx) {
  endProd('ongoing', idx);
}

// ── Update modal (20 fields) ──────────────────────────────
let _updPJIdx = -1, _updType = '';
function openUpdModal(type, idx) {
  _updPJIdx = idx; _updType = type;
  const p = gPJ(type)[idx]; if(!p) return;
  document.getElementById('upd-proj-name-'+type).textContent = '📁 '+p.name;
  const entryNum = (p.updates||[]).length + 1;
  document.getElementById('upd-entry-num-'+type).textContent = entryNum;
  // Build 20 fields (10 left, 10 right)
  const grid = document.getElementById('upd-fields-'+type);
  grid.innerHTML = UPD_FIELDS.map((label, i) => `
    <div class="upd-field">
      <label class="upd-label">Untitled${i+1} — ${label}</label>
      <input class="upd-input" id="upd-f${i}-${type}" type="text" placeholder="Isi kolom ini...">
    </div>`).join('');
  document.getElementById('upd-overlay-'+type)?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeUpdModal(type) {
  document.getElementById('upd-overlay-'+type)?.classList.remove('show');
  document.body.style.overflow = '';
}
function saveUpdEntry(type) {
  const ps = gPJ(type);
  const p = ps[_updPJIdx]; if(!p) return;
  const entry = {
    entry_num: (p.updates||[]).length + 1,
    saved_at: new Date().toISOString(),
    fields: UPD_FIELDS.map((label, i) => ({
      label: `Untitled ${i+1} — ${label}`,
      value: document.getElementById('upd-f'+i+'-'+type)?.value || ''
    }))
  };
  if(!p.updates) p.updates = [];
  p.updates.push(entry);
  sPJ(type, ps);
  closeUpdModal(type);
  renderPJ(type);
  // Show quick toast
  showQuickToast('✅ Update #'+entry.entry_num+' Stored!');
}
function showQuickToast(msg) {
  let t = document.getElementById('_toast');
  if(!t){t=document.createElement('div');t.id='_toast';t.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:100px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;transition:opacity .3s';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._hide);t._hide=setTimeout(()=>{t.style.opacity='0';},2500);
}

// ── Summary drawer ────────────────────────────────────────
function openSumm(type, idx) {
  const p = gPJ(type)[idx]; if(!p) return;
  document.getElementById('summ-nm-'+type).textContent = p.name;
  document.getElementById('summ-dt-'+type).textContent =
    '📅 '+(p.start||'—')+' → 🏁 '+(p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—');
  const body = document.getElementById('summ-body-'+type);

  const tblStyle = 'width:100%;border-collapse:collapse;font-size:12px;';
  const thStyle  = 'text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--txt3);background:var(--bg);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;';
  const tdStyle  = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--txt2);font-size:12px;vertical-align:top;';
  const tdMonoStyle = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--blue);font-family:\'DM Mono\',monospace;font-size:11px;font-weight:600;vertical-align:top;';

  // ── Section helper ────────────────────────────────────
  const section = (icon, title, tableHTML) => `
    <div class="summ-section">
      <div class="summ-section-title">${icon} <span>${title}</span></div>
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:4px">
        <table style="${tblStyle}">${tableHTML}</table>
      </div>
    </div>`;

  let html = '';

  // ── 1. Project Info ───────────────────────────────────
  html += section('📋', 'Informasi Project', `
    <thead><tr>
      <th style="${thStyle}">Field</th>
      <th style="${thStyle}">Value</th>
    </tr></thead>
    <tbody>
      <tr><td style="${tdStyle}">Nama Project</td><td style="${tdMonoStyle}">${p.name||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Mulai</td><td style="${tdStyle}">${p.start||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Selesai</td><td style="${tdStyle}">${p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tipe Project</td><td style="${tdStyle}">${p.projType==='separator'?'Separator / Distillation':'Boiler / Steam Generator'}</td></tr>
      <tr><td style="${tdStyle}">Notes</td><td style="${tdStyle}">${p.notes||'—'}</td></tr>
    </tbody>`);

  // ── 2. Set Point Table ────────────────────────────────
  if (p.setPoint && Object.keys(p.setPoint).length > 0) {
    const spRows = SP_FIELDS.map(f => {
      const val = p.setPoint[f.id] || '—';
      return `<tr><td style="${tdStyle}">${f.label}</td><td style="${tdMonoStyle}">${val}${val!=='—'&&f.unit?' <span style=\'font-size:10px;color:var(--txt3);font-weight:400\'>'+f.unit+'</span>':''}</td></tr>`;
    }).join('');
    html += section('⚙️', 'Set Point Parameters', `
      <thead><tr>
        <th style="${thStyle}">Parameter</th>
        <th style="${thStyle}">Nilai Set Point</th>
      </tr></thead>
      <tbody>${spRows}</tbody>`);
  }

  // ── 3. CIP Data ───────────────────────────────────────
  if (p.cipDone && p.cipFields) {
    const cipRows = Object.entries(p.cipFields).map(([k,v], i) =>
      `<tr><td style="${tdStyle}">CIP Field ${i+1}</td><td style="${tdStyle}">${v||'—'}</td></tr>`
    ).join('');
    html += section('🧼', 'Data CIP', `
      <thead><tr><th style="${thStyle}">Field</th><th style="${thStyle}">Value</th></tr></thead>
      <tbody>${cipRows}</tbody>`);
  }

  // ── 4. Finish Production ──────────────────────────────
  if (p.fpDone && p.fpItems && p.fpItems.length) {
    const fpRows = p.fpItems.map((item, i) => `
      <tr>
        <td style="${tdStyle}">${i+1}</td>
        <td style="${tdStyle}">${item.date||'—'}</td>
        <td style="${tdStyle}">${item.name||'—'}</td>
        <td style="${tdStyle}">${item.code||'—'}</td>
        <td style="${tdMonoStyle}">${item.brix||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">°Bx</span></td>
        <td style="${tdMonoStyle}">${item.berat||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">kg</span></td>
      </tr>`).join('');
    html += section('🏭', 'Finish Production', `
      <thead><tr>
        <th style="${thStyle}">#</th>
        <th style="${thStyle}">Tanggal</th>
        <th style="${thStyle}">Nama Produk</th>
        <th style="${thStyle}">Kode</th>
        <th style="${thStyle}">Brix</th>
        <th style="${thStyle}">Berat</th>
      </tr></thead>
      <tbody>${fpRows}</tbody>`);
  }

  // ── 5. Update History Table ───────────────────────────
  const updates = p.updates || [];
  if (updates.length) {
    // Collect all unique field names across all updates
    const allFieldNames = [];
    updates.forEach(u => {
      u.fields && u.fields.forEach(f => {
        const nm = f.name || f.label || '';
        if (!allFieldNames.includes(nm)) allFieldNames.push(nm);
      });
    });

    // Build header
    const headerCols = ['Update #', 'Tanggal & Waktu', ...allFieldNames];
    const thead = '<thead><tr>' + headerCols.map(h =>
      `<th style="${thStyle};min-width:90px">${h}</th>`).join('') + '</tr></thead>';

    // Build rows — one row per update entry
    const tbody = '<tbody>' + updates.map(u => {
      const date = new Date(u.saved_at).toLocaleString('id-ID');
      // Build a quick lookup by field name
      const lookup = {};
      (u.fields||[]).forEach(f => { lookup[f.name||f.label||''] = f.value||'—'; });

      const dataCols = allFieldNames.map(nm => {
        const val = lookup[nm] || '—';
        return `<td style="${val!=='—'?tdMonoStyle:tdStyle}">${val}</td>`;
      });

      return `<tr>
        <td style="${tdMonoStyle}">#${u.entry_num}</td>
        <td style="${tdStyle};white-space:nowrap;font-size:10px;color:var(--txt3)">${date}</td>
        ${dataCols.join('')}
      </tr>`;
    }).join('') + '</tbody>';

    html += section('📝', `Riwayat Update Parameter (${updates.length} entri)`,
      thead + tbody);
  } else {
    html += `<div class="summ-section">
      <div class="summ-section-title">📝 <span>Riwayat Update</span></div>
      <div style="color:var(--txt3);font-size:12px;padding:16px;text-align:center">Tidak ada update dicatat.</div>
    </div>`;
  }

  body.innerHTML = html;
  document.getElementById('summ-overlay-'+type)?.classList.add('show');
  document.getElementById('summ-drawer-'+type)?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSumm(type) {
  document.getElementById('summ-overlay-'+type)?.classList.remove('show');
  document.getElementById('summ-drawer-'+type)?.classList.remove('show');
  document.body.style.overflow = '';
}

// ── Detail drawer (for recent) ────────────────────────────
function openPD(type,idx){
  const p=gPJ(type)[idx];if(!p)return;
  document.getElementById('pd-nm-'+type).textContent=p.name;
  document.getElementById('pd-dt-'+type).textContent='📅 '+(p.start||'—')+' → 🏁 '+(p.end||'—');
  document.getElementById('pd-bd-'+type).innerHTML=`
    <div class="proj-info-grid">
      <div><div class="proj-info-lbl">START</div><div class="proj-info-val">${p.start||'—'}</div></div>
      <div><div class="proj-info-lbl">EXPECTED END</div><div class="proj-info-val">${p.end||'—'}</div></div>
    </div>
    <div><div class="proj-info-lbl">MATERIALS</div><div class="proj-info-val">${p.materials||'—'}</div></div>
    <div><div class="proj-info-lbl">TOOLS</div><div class="proj-info-val">${p.tools||'—'}</div></div>
    ${p.notes?`<div><div class="proj-info-lbl">NOTES</div><div class="proj-info-val">${p.notes}</div></div>`:''}
    <div><div class="proj-info-lbl">STATUS CIP</div><div class="proj-info-val">${p.cipDone?'✅ Selesai':'⏳ Belum'}</div></div>
    <div><div class="proj-info-lbl">SET POINT</div><div class="proj-info-val">${(p.setPoint&&Object.keys(p.setPoint).length)?'✅ Sudah diisi':'⏳ Belum'}</div></div>
    <div><div class="proj-info-lbl">CREATED</div><div class="proj-info-val" style="font-family:'DM Mono',monospace;font-size:11px">${new Date(p.created_at).toLocaleString('en-GB')}</div></div>
    <button class="proj-del-btn" onclick="delPJ('${type}',${idx})">🗑️ Delete Project</button>`;
  document.getElementById('pdo-'+type)?.classList.add('show');
  document.getElementById('pdd-'+type)?.classList.add('show');
  document.body.style.overflow='hidden';
}
function closePD(t) {
  document.getElementById('pdo-'+t)?.classList.remove('show');
  document.getElementById('pdd-'+t)?.classList.remove('show');
  document.body.style.overflow = '';
}
function delPJ(t, i) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  const l = gPJ(t);
  l.splice(i, 1);
  sPJ(t, l);
  closePD(t);
  renderPJ(t);
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeDetail();closeSensorModal();
    ['ongoing','recent','completed'].forEach(t=>{
      closeAPJ(t);closePD(t);closeEditPJ(t);closeUpdModal(t);closeSumm(t);
      closeSP(t);closeCIP_enh(t);closeFP(t);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// IoT DETAIL DRAWER HTML
// ═══════════════════════════════════════════════════════════
function initReportingForm() {
  const form = document.getElementById("reportForm");
  const statusDiv = document.getElementById("report-status");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      nama: document.getElementById("r-nama").value,
      shift: document.getElementById("r-shift").value,
      kategori: document.getElementById("r-kategori").value,
      prioritas: document.getElementById("r-prioritas").value,
      deskripsi: document.getElementById("r-deskripsi").value,
      tanggal: new Date().toISOString()
    };

    console.log("DATA REPORT:", data);

    statusDiv.innerHTML = `
      <div class="de-status-bar de-status-loading">
        ⏳ Mengirim laporan...
      </div>
    `;

    setTimeout(() => {
      statusDiv.innerHTML = `
        <div class="de-status-bar de-status-success">
          ✅ Laporan berhasil dikirim!
        </div>
      `;
      form.reset();
    }, 1000);
  });
}

// ══ REPORTING HELPERS ═════════════════════════════════════════
function submitReport() {
  const g = id => document.getElementById(id)?.value?.trim();
  const title = g('r-title'), nama = g('r-nama'), desc = g('r-deskripsi');
  if (!title || !nama || !desc) { showRpSt('error', '❌ Please fill in Title, Reporter Name, and Description!'); return; }
  showRpSt('loading', '⏳ Submitting report...');
  setTimeout(() => {
    const hist = JSON.parse(localStorage.getItem('report_history') || '[]');
    hist.unshift({ id:Date.now(), title, nama,
      shift:g('r-shift'), kategori:g('r-kategori'), prioritas:g('r-prioritas'),
      lokasi:g('r-lokasi')||'—', deskripsi:desc, aksi:g('r-aksi')||'—',
      submitted_at:new Date().toISOString() });
    localStorage.setItem('report_history', JSON.stringify(hist.slice(0, 100)));
    showRpSt('success', '✅ Report submitted successfully!');
    resetReport(); loadReportHistory();
  }, 600);
}
function resetReport() {
  ['r-title','r-nama','r-lokasi','r-deskripsi','r-aksi'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['r-shift','r-kategori','r-prioritas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });
}
function showRpSt(type, msg) {
  const b = document.getElementById('rp-sb'), m = document.getElementById('rp-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type === 'success') setTimeout(() => { if (b) b.style.display = 'none'; }, 4000);
}
function loadReportHistory() {
  const c = document.getElementById('rp-history'); if (!c) return;
  const hist = JSON.parse(localStorage.getItem('report_history') || '[]');
  if (!hist.length) { c.innerHTML = '<div class="de-empty">No reports submitted yet</div>'; return; }
  const priColor = {low:'var(--green)', medium:'var(--yellow)', high:'var(--red)'};
  const priLabel = {low:'LOW', medium:'MEDIUM', high:'HIGH'};
  const catLabel = {teknis:'Technical', operasional:'Operational', keamanan:'Security', lingkungan:'Environmental', lainnya:'Other'};
  const shiftLabel = {pagi:'🌅 Morning', siang:'☀️ Afternoon', malam:'🌙 Night'};
  c.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' +
    hist.map(r => `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-left:3px solid ${priColor[r.prioritas]||'var(--blue)'}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--txt)">${r.title}</div>
            <div style="font-size:11px;color:var(--txt3);margin-top:2px">👤 ${r.nama} • ${shiftLabel[r.shift]||r.shift||'—'} • 📍 ${r.lokasi}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;color:${priColor[r.prioritas]||'var(--blue)'};border:1px solid ${priColor[r.prioritas]||'var(--blue)'}44">${priLabel[r.prioritas]||r.prioritas}</span>
            <span style="font-size:9px;color:var(--txt3);font-family:'DM Mono',monospace">${new Date(r.submitted_at).toLocaleString('en-GB')}</span>
          </div>
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-bottom:6px;line-height:1.5">${r.deskripsi}</div>
        ${r.aksi && r.aksi !== '—' ? `<div style="font-size:11px;color:var(--txt3);padding:6px 10px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">✅ Action: ${r.aksi}</div>` : ''}
        <div style="margin-top:6px"><span style="font-size:9px;background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:2px 8px;color:var(--txt3)">${catLabel[r.kategori]||r.kategori}</span></div>
      </div>`).join('') + '</div>';
}


// ═══════════════════════════════════════════════════════════
// SENSOR MANAGER — Add / Edit / Delete sensors dynamically
// Data tersimpan di localStorage('tank_sensors')
// Dashboard membaca otomatis tanpa ubah kode
// ═══════════════════════════════════════════════════════════

const SENSOR_COL_NAMES = ['Biru','Ungu','Hijau','Oranye','Kuning','Merah'];

function getTankDimensionHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div>
      <div class="de-title">Change Containers Volume</div>
      <div class="de-sub">Add, edit, or delete sensors — pilih bentuk tanki (persegi atau silinder). Dashboard otomatis menyesuaikan visualisasi.</div>
    </div>
    <div class="de-date" id="tds-dt">--</div>
  </div>

  <!-- SENSOR LIST -->
  <div class="de-card" style="margin-bottom:16px">
    <div class="de-card-title" style="justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px"><span class="de-card-ico">📡</span> Daftar Sensor Aktif</div>
      <button class="de-btn de-btn-primary" style="padding:6px 16px;font-size:12px" onclick="openAddSensor()">＋ Tambah Sensor</button>
    </div>
    <div id="sensor-list-wrap"></div>
  </div>

  <!-- STATUS -->
  <div class="de-status-bar" id="tds-sb" style="display:none"><span id="tds-sm"></span></div>

  <!-- ADD / EDIT MODAL -->
  <div id="sensor-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:16px;width:520px;max-width:95vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.22)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--surface);z-index:1">
        <div style="font-size:15px;font-weight:700;color:var(--txt)" id="sensor-modal-title">Tambah Sensor Baru</div>
        <button onclick="closeSensorModal()" style="width:30px;height:30px;border-radius:7px;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-size:13px;color:var(--txt2);display:grid;place-items:center">✕</button>
      </div>
      <div style="padding:20px 22px 22px">

        <!-- ══ SHAPE + ORIENTASI SELECTOR ══ -->
        <div style="margin-bottom:18px">
          <div class="de-label" style="margin-bottom:8px">BENTUK TANKI / WADAH *</div>
          <div style="display:flex;gap:10px;margin-bottom:10px">
            <label id="shape-btn-persegi" onclick="selectShape('persegi')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;border:2px solid var(--blue);border-radius:10px;cursor:pointer;background:#ebf2fd;transition:all .18s">
              <svg width="40" height="32" viewBox="0 0 40 32">
                <rect x="4" y="4" width="32" height="24" rx="3" fill="#bfdffa" stroke="#2b7de9" stroke-width="2"/>
                <rect x="4" y="20" width="32" height="8" rx="0 0 3 3" fill="#3b9de8" opacity=".7"/>
              </svg>
              <span style="font-size:11px;font-weight:700;color:var(--blue)">Persegi / Kotak</span>
              <span style="font-size:9px;color:var(--txt3)">Panjang × Lebar × Tinggi</span>
            </label>
            <label id="shape-btn-silinder" onclick="selectShape('silinder')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s">
              <svg width="40" height="38" viewBox="0 0 40 38">
                <ellipse cx="20" cy="8" rx="14" ry="5" fill="#d8b4fe" stroke="#7c3aed" stroke-width="1.8"/>
                <rect x="6" y="8" width="28" height="22" fill="#d8b4fe" stroke="none"/>
                <rect x="6" y="22" width="28" height="8" fill="#7c3aed" opacity=".5"/>
                <ellipse cx="20" cy="30" rx="14" ry="5" fill="#7c3aed" stroke="#7c3aed" stroke-width="1.8" opacity=".8"/>
                <line x1="6" y1="8" x2="6" y2="30" stroke="#7c3aed" stroke-width="1.8"/>
                <line x1="34" y1="8" x2="34" y2="30" stroke="#7c3aed" stroke-width="1.8"/>
              </svg>
              <span style="font-size:11px;font-weight:700;color:var(--purple)">Silinder / Tabung</span>
              <span style="font-size:9px;color:var(--txt3)">Diameter × Tinggi / Panjang</span>
            </label>
          </div>
          <input type="hidden" id="sf-shape" value="persegi">

          <!-- ── ORIENTASI ── -->
          <div class="de-label" style="margin-bottom:8px;margin-top:4px">ORIENTASI TANKI *</div>
          <div style="display:flex;gap:10px">
            <label id="ori-btn-vertikal" onclick="selectOrientasi('vertikal')" style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid var(--green);border-radius:10px;cursor:pointer;background:#edfaf4;transition:all .18s">
              <svg width="28" height="38" viewBox="0 0 28 38">
                <rect x="4" y="2" width="20" height="34" rx="4" fill="#bbf7d0" stroke="#18a96a" stroke-width="1.8"/>
                <rect x="4" y="22" width="20" height="14" rx="0 0 4 4" fill="#18a96a" opacity=".6"/>
                <line x1="14" y1="6" x2="14" y2="20" stroke="#18a96a" stroke-width="1.5" stroke-dasharray="2,2"/>
                <polygon points="10,7 14,2 18,7" fill="#18a96a"/>
              </svg>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--green)">Vertikal</div>
                <div style="font-size:9px;color:var(--txt3)">Berdiri tegak, sensor di atas</div>
                <div style="font-size:9px;color:var(--txt3)" id="ori-v-hint">Tinggi = dimensi vertikal</div>
              </div>
            </label>
            <label id="ori-btn-horizontal" onclick="selectOrientasi('horizontal')" style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s">
              <svg width="38" height="28" viewBox="0 0 38 28">
                <rect x="2" y="4" width="34" height="20" rx="4" fill="#fed7aa" stroke="#e07b2a" stroke-width="1.8"/>
                <rect x="20" y="4" width="16" height="20" rx="0 4 4 0" fill="#e07b2a" opacity=".6"/>
                <line x1="6" y1="14" x2="18" y2="14" stroke="#e07b2a" stroke-width="1.5" stroke-dasharray="2,2"/>
                <polygon points="7,10 2,14 7,18" fill="#e07b2a"/>
              </svg>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange)">Horizontal</div>
                <div style="font-size:9px;color:var(--txt3)">Rebah/tidur, sensor di atas</div>
                <div style="font-size:9px;color:var(--txt3)" id="ori-h-hint">Tinggi = diameter/lebar vertikal</div>
              </div>
            </label>
          </div>
          <input type="hidden" id="sf-orientasi" value="vertikal">

          <!-- Info box orientasi — dinamis -->
          <div id="orientasi-info" style="margin-top:8px;padding:9px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:11px;color:#92400e;line-height:1.6;display:none"></div>
        </div>

        <!-- Preview mini tank (dynamic shape) -->
        <div style="display:flex;justify-content:center;margin-bottom:20px">
          <div style="text-align:center">
            <div id="modal-tank-preview-wrap" style="margin:0 auto 6px;position:relative">
              <!-- Rendered dynamically by previewModalTank() -->
            </div>
            <div style="font-size:10px;color:var(--txt3)" id="modal-tank-vol-label">1.000 L</div>
          </div>
        </div>

        <div class="de-grid">
          <div class="de-field de-full">
            <label class="de-label">NAMA SENSOR / KOLAM *</label>
            <input class="de-input" type="text" id="sf-name" placeholder="Contoh: Kolam Utama, Tangki A...">
          </div>
          <div class="de-field">
            <label class="de-label">KUNCI DATA API *</label>
            <input class="de-input" type="text" id="sf-key" placeholder="s1, s2, s3 ...">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px">Field key dari ESP (data dalam cm: s1_cm / s2_cm)</div>
          </div>
          <div class="de-field">
            <label class="de-label">LOKASI</label>
            <input class="de-input" type="text" id="sf-loc" placeholder="Lantai 1, Area A...">
          </div>

          <!-- Persegi fields -->
          <div class="de-field sf-persegi-field">
            <label class="de-label" style="color:var(--blue)">PANJANG <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-p" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
          </div>
          <div class="de-field sf-persegi-field">
            <label class="de-label" style="color:var(--green)">LEBAR <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-l" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
          </div>

          <!-- Silinder fields -->
          <div class="de-field sf-silinder-field" style="display:none">
            <label class="de-label" style="color:var(--purple)">DIAMETER <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-d" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
            <div style="font-size:9px;color:var(--txt3);margin-top:3px" id="sf-d-hint">Diameter lingkaran silinder</div>
          </div>
          <div class="de-field sf-silinder-field sf-silinder-horiz-field" style="display:none">
            <label class="de-label" style="color:var(--orange)">PANJANG SILINDER <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-psilinder" min="0.1" step="0.1" value="2" oninput="previewModalTank()">
            <div style="font-size:9px;color:var(--txt3);margin-top:3px">Panjang sumbu tangki horizontal</div>
          </div>

          <!-- Shared: Tinggi -->
          <div class="de-field">
            <label class="de-label" style="color:var(--orange)">TINGGI TANKI <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-t" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px" id="sf-t-hint">Tinggi vertikal tanki = air 100%</div>
          </div>

          <!-- Sensor Zero Point -->
          <div class="de-field">
            <label class="de-label" style="color:var(--blue)">TITIK NOL SENSOR <span class="de-unit">(cm)</span></label>
            <input class="de-input" type="number" id="sf-zero" min="0" step="0.5" value="0" oninput="previewModalTank()">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px">Jarak sensor saat air <strong>PENUH 100%</strong> (biasanya 0–5 cm). Default: 0</div>
          </div>

          <div class="de-field de-full">
            <label class="de-label">CATATAN</label>
            <textarea class="de-input de-textarea" id="sf-note" placeholder="Keterangan tambahan..." style="min-height:60px"></textarea>
          </div>
          <!-- Batas peringatan per tanki -->
          <div class="de-field" style="grid-column:1/-1;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <label class="de-label" style="margin-bottom:8px;display:block">⚠️ BATAS PERINGATAN TANKI INI</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label style="font-size:9px;font-weight:700;color:var(--yellow);letter-spacing:1px">WARNING (%)</label>
                <input class="de-input" type="number" id="sf-warn" min="0" max="100" step="1" value="40" style="margin-top:4px">
                <div style="font-size:9px;color:var(--txt3);margin-top:2px">Alert kuning</div>
              </div>
              <div>
                <label style="font-size:9px;font-weight:700;color:var(--red);letter-spacing:1px">DANGER (%)</label>
                <input class="de-input" type="number" id="sf-crit" min="0" max="100" step="1" value="15" style="margin-top:4px">
                <div style="font-size:9px;color:var(--txt3);margin-top:2px">Alert merah</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Volume preview in modal -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
          <div><div style="font-size:9px;color:var(--txt3)">Volume</div><div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--blue)" id="modal-m3">— m³</div></div>
          <div><div style="font-size:9px;color:var(--txt3)">Kapasitas</div><div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--green)" id="modal-liter">— L</div></div>
          <div><div style="font-size:9px;color:var(--txt3)">Bentuk</div><div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:var(--orange)" id="modal-dim">—</div></div>
        </div>

        <div class="de-actions">
          <button class="de-btn de-btn-ghost" onclick="closeSensorModal()">Batal</button>
          <button class="de-btn de-btn-primary" onclick="saveSensor()">💾 Simpan Sensor</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

function selectShape(shape) {
  document.getElementById('sf-shape').value = shape;
  const btnP = document.getElementById('shape-btn-persegi');
  const btnS = document.getElementById('shape-btn-silinder');
  if (shape === 'silinder') {
    btnP.style.cssText = btnP.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--border);background:var(--bg);';
    btnS.style.cssText = btnS.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--purple);background:#f3f0ff;';
    document.querySelectorAll('.sf-persegi-field').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.sf-silinder-field').forEach(el => el.style.display = '');
  } else {
    btnP.style.cssText = btnP.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--blue);background:#ebf2fd;';
    btnS.style.cssText = btnS.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--border);background:var(--bg);';
    document.querySelectorAll('.sf-persegi-field').forEach(el => el.style.display = '');
    document.querySelectorAll('.sf-silinder-field').forEach(el => el.style.display = 'none');
  }
  // Re-apply orientasi to update field visibility based on new shape
  const ori = document.getElementById('sf-orientasi')?.value || 'vertikal';
  selectOrientasi(ori, true); // true = skip setvalue (already set)
  previewModalTank();
}

function selectOrientasi(ori, skipSet) {
  if (!skipSet) document.getElementById('sf-orientasi').value = ori;
  const shape = document.getElementById('sf-shape')?.value || 'persegi';
  const btnV  = document.getElementById('ori-btn-vertikal');
  const btnH  = document.getElementById('ori-btn-horizontal');
  const infoBox = document.getElementById('orientasi-info');

  if (btnV) btnV.style.cssText = btnV.style.cssText.replace(/border:[^;]+/,'').replace(/background:[^;]+/,'') +
    (ori==='vertikal' ? ';border:2px solid var(--green);background:#edfaf4;' : ';border:2px solid var(--border);background:var(--bg);');
  if (btnH) btnH.style.cssText = btnH.style.cssText.replace(/border:[^;]+/,'').replace(/background:[^;]+/,'') +
    (ori==='horizontal' ? ';border:2px solid var(--orange);background:#fff7ed;' : ';border:2px solid var(--border);background:var(--bg);');

  // Show/hide panjang silinder field (only for silinder horizontal)
  document.querySelectorAll('.sf-silinder-horiz-field').forEach(el => {
    el.style.display = (shape === 'silinder' && ori === 'horizontal') ? '' : 'none';
  });

  // Update tinggi label & hint based on shape+orientasi
  const tLabel = document.getElementById('sf-t-label');
  const tHint  = document.getElementById('sf-t-hint');
  if (shape === 'silinder' && ori === 'horizontal') {
    if (tLabel) tLabel.innerHTML = 'DIAMETER SILINDER <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi vertikal tangki rebah (= diameter penampang)';
  } else if (shape === 'silinder') {
    if (tLabel) tLabel.innerHTML = 'TINGGI SILINDER <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi silinder berdiri = air 100%';
  } else if (ori === 'horizontal') {
    if (tLabel) tLabel.innerHTML = 'TINGGI VERTIKAL <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Sisi tegak tangki rebah (sensor ukur ini)';
  } else {
    if (tLabel) tLabel.innerHTML = 'TINGGI TANKI <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi vertikal tanki = air 100%';
  }

  // Info box
  if (infoBox) {
    if (ori === 'horizontal') {
      if (shape === 'silinder') {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `⚠️ <strong>Silinder Horizontal</strong> — Tangki rebah, sensor di atas mengukur <strong>tinggi air</strong> di penampang silinder (= berapa cm diameter yang terisi dari bawah). Volume dihitung dengan rumus <em>segmen lingkaran</em> (non-linear). 50% diameter terisi ≈ 50% volume, tapi 25% diameter terisi ≈ hanya ~9% volume. Persentase yang ditampilkan adalah <strong>volume aktual</strong>. Tampilan dashboard menunjukkan tangki rebah ↔ dengan air mengisi dari bawah.`;
      } else {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `ℹ️ <strong>Persegi Horizontal</strong> — Tangki rebah, sensor di atas mengukur <strong>tinggi air vertikal</strong>. Ketika air turun, yang berkurang adalah <strong>tinggi air</strong> (dimensi vertikal = field "Tinggi Vertikal"). Volume = Panjang × Lebar × tinggi_air. Perhitungan linear.`;
      }
    } else {
      infoBox.style.display = 'none';
    }
  }
  previewModalTank();
}

function initTankDimensionSetting() {
  if (window._tdsClock) clearInterval(window._tdsClock);
  window._tdsClock = setInterval(() => {
    const el = document.getElementById('tds-dt');
    if (!el) { clearInterval(window._tdsClock); return; }
    el.textContent = new Date().toLocaleString('id-ID');
  }, 1000);
  renderSensorList();
}

// ── Render sensor list in settings page ──────────────────
function renderSensorList() {
  const wrap = document.getElementById('sensor-list-wrap');
  if (!wrap) return;
  const sensors = getSensors();
  if (!sensors.length) {
    wrap.innerHTML = '<div class="de-empty">Belum ada sensor. Klik "+ Tambah Sensor"</div>';
    return;
  }
  wrap.innerHTML = sensors.map((s, i) => {
    const col   = SENSOR_COLORS[i % SENSOR_COLORS.length];
    const shape = s.shape || 'persegi';
    const liter = Math.round(calcMaxVolumeLiter(s));
    const orientasi  = s.orientasi || 'vertikal';
    const oriIcon    = orientasi === 'horizontal' ? '↔' : '↕';
    const shapeIcon  = shape === 'silinder' ? '⬤' : '▬';
    let dimStr;
    if (shape === 'silinder') {
      if (orientasi === 'horizontal') {
        dimStr = `⌀${s.tinggi||1}m (diameter) × L${s.panjang||2}m ↔`;
      } else {
        dimStr = `⌀${s.diameter||1}m × ${s.tinggi||1}m tinggi`;
      }
    } else {
      dimStr = orientasi === 'horizontal'
        ? `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m ↔`
        : `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m`;
    }

    // mini tank preview
    let miniTank;
    if (shape === 'silinder') {
      miniTank = `
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <svg width="32" height="7" viewBox="0 0 32 7"><ellipse cx="16" cy="3.5" rx="14" ry="3.5" fill="var(--surface)" stroke="${col.label}" stroke-width="1.5"/></svg>
          <div style="width:32px;height:36px;border-left:1.5px solid ${col.label};border-right:1.5px solid ${col.label};position:relative;overflow:hidden;background:var(--surface)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:${col.water}"></div>
          </div>
          <svg width="32" height="7" viewBox="0 0 32 7"><ellipse cx="16" cy="3.5" rx="14" ry="3.5" fill="${col.label}" stroke="${col.label}" stroke-width="1.5" opacity=".8"/></svg>
        </div>`;
    } else {
      miniTank = `
        <div style="width:32px;height:44px;border:1.5px solid ${col.label};border-radius:3px 3px 5px 5px;position:relative;overflow:hidden;flex-shrink:0;background:var(--surface)">
          <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:${col.water}"></div>
        </div>`;
    }

    return `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg);border-left:4px solid ${col.label}">
      ${miniTank}
      <!-- info -->
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:13px;font-weight:600;color:var(--txt)">${s.name}</span>
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${shape==='silinder'?'#f3f0ff':'#ebf2fd'};color:${shape==='silinder'?'var(--purple)':'var(--blue)'};">${shapeIcon} ${shape.charAt(0).toUpperCase()+shape.slice(1)}</span>
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${orientasi==='horizontal'?'#fff7ed':'#f0fdf4'};color:${orientasi==='horizontal'?'var(--orange)':'var(--green)'};">${oriIcon} ${orientasi.charAt(0).toUpperCase()+orientasi.slice(1)}</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:3px">
          <span style="font-size:10px;color:var(--txt3)">🔑 Key: <strong style="color:${col.label}">${s.key}</strong></span>
          <span style="font-size:10px;color:var(--txt3)">📐 ${dimStr}</span>
          <span style="font-size:10px;color:var(--txt3)">💧 ${liter.toLocaleString('id-ID')} L</span>
          <span style="font-size:10px;color:var(--blue)">📡 Zero: <strong>${s.sensorZeroCm ?? 0}cm</strong> = 100%</span>
          ${s.loc ? `<span style="font-size:10px;color:var(--txt3)">📍 ${s.loc}</span>` : ''}
        </div>
        ${s.note ? `<div style="font-size:10px;color:var(--txt3);margin-top:2px;font-style:italic">${s.note}</div>` : ''}
      </div>
      <!-- actions -->
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="openEditSensor(${i})" style="padding:5px 10px;background:#ebf2fd;border:1px solid #c3d9fa;border-radius:7px;color:var(--blue);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">✏️ Edit</button>
        ${sensors.length > 1
          ? `<button onclick="deleteSensor(${i})" style="padding:5px 10px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;color:var(--red);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">🗑</button>`
          : `<button disabled style="padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--txt3);font-size:11px;cursor:not-allowed;font-family:inherit" title="Minimal 1 sensor">🗑</button>`}
      </div>
    </div>`;
  }).join('');
}

// ── Modal helpers ─────────────────────────────────────────
let _editIdx = -1;

function openAddSensor() {
  _editIdx = -1;
  document.getElementById('sensor-modal-title').textContent = '➕ Tambah Sensor Baru';
  ['sf-name','sf-key','sf-loc','sf-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('sf-p').value = 1;
  document.getElementById('sf-l').value = 1;
  document.getElementById('sf-d').value = 1;
  document.getElementById('sf-t').value = 1;
  const zf=document.getElementById('sf-zero'); if(zf) zf.value=0;
  const wf=document.getElementById('sf-warn'); if(wf) wf.value=40;
  const cf=document.getElementById('sf-crit'); if(cf) cf.value=15;
  // Reset shape to persegi + orientasi to vertikal
  selectShape('persegi');
  selectOrientasi('vertikal');
  // suggest next key
  const sensors = getSensors();
  document.getElementById('sf-key').value = 's' + (sensors.length + 1);
  document.getElementById('sf-name').value = 'Sensor ' + (sensors.length + 1);
  previewModalTank();
  const ov = document.getElementById('sensor-modal-overlay');
  ov.style.display = 'flex';
}

function openEditSensor(idx) {
  _editIdx = idx;
  const s = getSensors()[idx];
  if (!s) return;
  document.getElementById('sensor-modal-title').textContent = '✏️ Edit Sensor: ' + s.name;
  document.getElementById('sf-name').value = s.name;
  document.getElementById('sf-key').value  = s.key;
  document.getElementById('sf-loc').value  = s.loc  || '';
  document.getElementById('sf-note').value = s.note || '';
  document.getElementById('sf-t').value    = s.tinggi  || 1;
  const zfe=document.getElementById('sf-zero'); if(zfe) zfe.value = s.sensorZeroCm ?? 0;
  const wfe=document.getElementById('sf-warn'); if(wfe) wfe.value = s.warnPct ?? 40;
  const cfe=document.getElementById('sf-crit'); if(cfe) cfe.value = s.critPct ?? 15;

  const shape = s.shape || 'persegi';
  const ori   = s.orientasi || 'vertikal';
  selectShape(shape);
  selectOrientasi(ori);

  if (shape === 'silinder') {
    if (ori === 'horizontal') {
      document.getElementById('sf-psilinder').value = s.panjang || 2;
    } else {
      document.getElementById('sf-d').value = s.diameter || 1;
    }
  } else {
    document.getElementById('sf-p').value = s.panjang || 1;
    document.getElementById('sf-l').value = s.lebar   || 1;
  }

  previewModalTank();
  document.getElementById('sensor-modal-overlay').style.display = 'flex';
}

function closeSensorModal() {
  document.getElementById('sensor-modal-overlay').style.display = 'none';
}

function previewModalTank() {
  const shape   = document.getElementById('sf-shape')?.value    || 'persegi';
  const ori     = document.getElementById('sf-orientasi')?.value || 'vertikal';
  const t       = +(document.getElementById('sf-t')?.value)     || 1;
  const zeroCm  = +(document.getElementById('sf-zero')?.value)  || 0;
  const setEl   = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  let m3, liter, dimText;

  if (shape === 'silinder') {
    if (ori === 'horizontal') {
      // t = diameter, panjang = sumbu silinder
      const r  = t / 2;
      const pL = +(document.getElementById('sf-psilinder')?.value) || 2;
      m3    = +(Math.PI * r * r * pL).toFixed(3);
      liter = (Math.round(m3 * 1000 / 100) * 100);
      dimText = `⌀${t}m × L${pL}m ↔`;
    } else {
      const d  = +(document.getElementById('sf-d')?.value) || 1;
      const r  = d / 2;
      m3    = +(Math.PI * r * r * t).toFixed(3);
      liter = (Math.round(m3 * 1000 / 100) * 100);
      dimText = `⌀${d}m × ${t}m`;
    }
  } else {
    const p = +(document.getElementById('sf-p')?.value) || 1;
    const l = +(document.getElementById('sf-l')?.value) || 1;
    m3    = +(p * l * t).toFixed(3);
    liter = (Math.round(m3 * 1000 / 100) * 100);
    dimText = ori === 'horizontal' ? `${p}m × ${l}m × ${t}m ↔` : `${p}m × ${l}m × ${t}m`;
  }

  setEl('modal-m3',    m3 + ' m³');
  setEl('modal-liter', liter.toLocaleString('id-ID') + ' L');
  setEl('modal-dim',   dimText);
  setEl('modal-tank-vol-label', liter.toLocaleString('id-ID') + ' L');

  // Re-draw the mini preview
  const wrap = document.getElementById('modal-tank-preview-wrap');
  if (!wrap) return;
  const pct = 50;
  const zeroPxFromTop = zeroCm > 0 ? Math.round((zeroCm / (t * 100)) * Math.max(50, Math.min(90, t*40))) : 0;
  const zeroLine = zeroCm > 0
    ? `<div style="position:absolute;top:${zeroPxFromTop}px;left:0;right:0;height:2px;background:#2b7de9;opacity:.5;z-index:1" title="Zero = 100%"></div>`
    : '';

  if (shape === 'silinder' && ori === 'horizontal') {
    // Preview tangki silinder rebah: badan horizontal, air mengisi dari bawah cross-section (height %)
    // Ketika air turun: diameter yang terisi (height) berkurang dari atas ke bawah
    const tankW = 80, tankH = Math.max(30, Math.min(54, t * 30));
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
        <div style="font-size:9px;color:var(--txt3);font-weight:600">✅ Air turun → diameter terisi (⌀) berkurang dari atas</div>
        <div style="display:flex;align-items:center;gap:0">
          <!-- Skala diameter kiri -->
          <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0;margin-right:3px">
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀100%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀50%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀0%</span>
          </div>
          <svg width="14" height="${tankH}" viewBox="0 0 14 ${tankH}" style="flex-shrink:0">
            <ellipse cx="7" cy="${tankH/2}" rx="6" ry="${tankH/2-1}" fill="var(--bg)" stroke="var(--purple)" stroke-width="1.8"/>
          </svg>
          <div style="width:${tankW}px;height:${tankH}px;border-top:2px solid var(--purple);border-bottom:2px solid var(--purple);position:relative;overflow:hidden;background:var(--bg);flex-shrink:0">
            <!-- Air mengisi dari bawah (height %) → diameter terisi berkurang saat air turun -->
            <div style="position:absolute;bottom:0;left:0;width:100%;height:${pct}%;background:linear-gradient(180deg,#d8b4fe,#7c3aed);transition:.5s">
              <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
            </div>
            <div style="position:absolute;top:2px;left:4px;font-size:8px;color:rgba(124,58,237,.7);font-weight:700;pointer-events:none">↔ ⌀${t}m</div>
          </div>
          <svg width="14" height="${tankH}" viewBox="0 0 14 ${tankH}" style="flex-shrink:0">
            <ellipse cx="7" cy="${tankH/2}" rx="6" ry="${tankH/2-1}" fill="var(--purple)" stroke="var(--purple)" stroke-width="1.8" opacity=".8"/>
          </svg>
        </div>
        <div style="font-size:8px;color:var(--txt3);font-style:italic">Tampilan cross-section: air turun = area biru berkurang dari atas</div>
      </div>`;
  } else if (shape === 'silinder') {
    const tankPxH = Math.max(50, Math.min(90, t*40));
    wrap.innerHTML = `
      <svg width="56" height="10" viewBox="0 0 56 10" style="display:block;margin-bottom:-1px">
        <ellipse cx="28" cy="5" rx="26" ry="5" fill="var(--bg)" stroke="var(--purple)" stroke-width="1.8"/>
      </svg>
      <div style="width:56px;height:${tankPxH}px;border-left:2px solid var(--purple);border-right:2px solid var(--purple);border-bottom:none;position:relative;overflow:hidden;background:var(--bg)">
        ${zeroLine}
        <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#d8b4fe,#7c3aed);transition:height .5s">
          <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
        </div>
      </div>
      <svg width="56" height="10" viewBox="0 0 56 10" style="display:block;margin-top:-1px">
        <ellipse cx="28" cy="5" rx="26" ry="5" fill="var(--purple)" stroke="var(--purple)" stroke-width="1.8" opacity=".8"/>
      </svg>`;
  } else if (ori === 'horizontal') {
    // Persegi horizontal — air mengisi dari bawah (tinggi vertikal berkurang saat air turun)
    const tankW = 80, tankH = Math.max(30, Math.min(50, t * 30));
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
        <div style="font-size:9px;color:var(--txt3);font-weight:600">✅ Air turun → tinggi vertikal air berkurang</div>
        <div style="display:flex;align-items:center;gap:3px">
          <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0">
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">100%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">50%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">0%</span>
          </div>
          <div style="width:${tankW}px;height:${tankH}px;border:2px solid var(--orange);border-radius:4px;position:relative;overflow:hidden;background:var(--bg)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#fed7aa,#e07b2a);transition:.5s">
              <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
            </div>
            <div style="position:absolute;top:2px;left:4px;font-size:8px;color:rgba(224,123,42,.7);font-weight:700;pointer-events:none">↔ rebah</div>
          </div>
        </div>
        <div style="font-size:8px;color:var(--txt3);font-style:italic">Tinggi vertikal = ${t}m (dimensi yang diukur sensor)</div>
      </div>`;
  } else {
    const tankPxH = Math.max(50, Math.min(90, t*40));
    wrap.innerHTML = `
      <div style="width:56px;height:${tankPxH}px;border:2px solid var(--blue);border-radius:4px 4px 8px 8px;position:relative;overflow:hidden;background:var(--bg)">
        ${zeroLine}
        <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#bfdffa,#3b9de8);transition:height .5s">
          <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
        </div>
      </div>`;
  }
}

function saveSensor() {
  const name  = document.getElementById('sf-name')?.value.trim();
  const key   = document.getElementById('sf-key')?.value.trim();
  const t     = +(document.getElementById('sf-t')?.value);
  const shape = document.getElementById('sf-shape')?.value || 'persegi';
  const zeroCm = +(document.getElementById('sf-zero')?.value ?? 0);

  if (!name) { showTDSSt('error', '❌ Nama sensor wajib diisi!'); return; }
  if (!key)  { showTDSSt('error', '❌ Kunci data API wajib diisi!'); return; }
  if (!t || t <= 0) { showTDSSt('error', '❌ Tinggi tanki harus lebih dari 0!'); return; }
  if (zeroCm < 0) { showTDSSt('error', `❌ Titik nol sensor tidak boleh negatif!`); return; }

  const orientasi = document.getElementById('sf-orientasi')?.value || 'vertikal';
  let sensorObj = { shape, orientasi, tinggi: t, sensorZeroCm: zeroCm };

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      // horizontal: sf-t = diameter, sf-psilinder = panjang sumbu
      const pSil = +(document.getElementById('sf-psilinder')?.value);
      if (!pSil || pSil <= 0) { showTDSSt('error', '❌ Panjang silinder harus lebih dari 0!'); return; }
      sensorObj.panjang = pSil; // panjang sumbu silinder rebah
    } else {
      const d = +(document.getElementById('sf-d')?.value);
      if (!d || d <= 0) { showTDSSt('error', '❌ Diameter harus lebih dari 0!'); return; }
      sensorObj.diameter = d;
    }
  } else {
    const p = +(document.getElementById('sf-p')?.value);
    const l = +(document.getElementById('sf-l')?.value);
    if (!p || !l || p <= 0 || l <= 0) { showTDSSt('error', '❌ Panjang dan lebar harus lebih dari 0!'); return; }
    sensorObj.panjang = p;
    sensorObj.lebar   = l;
  }

  const sensors = getSensors();
  const dupIdx  = sensors.findIndex(s => s.key === key);
  if (dupIdx !== -1 && dupIdx !== _editIdx) {
    showTDSSt('error', `❌ Kunci "${key}" sudah dipakai sensor lain!`); return;
  }

  sensorObj = {
    id:   _editIdx >= 0 ? sensors[_editIdx].id : 'sensor_' + Date.now(),
    name, key,
    ...sensorObj,
    warnPct: Math.max(0, Math.min(100, +(document.getElementById('sf-warn')?.value ?? 40))),
    critPct: Math.max(0, Math.min(100, +(document.getElementById('sf-crit')?.value ?? 15))),
    loc:  document.getElementById('sf-loc')?.value.trim()  || '',
    note: document.getElementById('sf-note')?.value.trim() || '',
  };

  if (_editIdx >= 0) {
    sensors[_editIdx] = sensorObj;
  } else {
    sensors.push(sensorObj);
  }

  localStorage.setItem('tank_sensors', JSON.stringify(sensors));
  closeSensorModal();
  renderSensorList();
  // Re-render tank cards on dashboard if visible
  renderTankCards();
  const liter = Math.round(calcMaxVolumeLiter(sensorObj)).toLocaleString('id-ID');
  showTDSSt('success', _editIdx >= 0
    ? `✅ Sensor "${name}" diperbarui — ${liter} L (titik nol: ${zeroCm}cm)`
    : `✅ Sensor "${name}" ditambahkan! Wadah baru muncul di dashboard.`);
}

function deleteSensor(idx) {
  const sensors = getSensors();
  if (sensors.length <= 1) { showTDSSt('error','❌ Minimal harus ada 1 sensor!'); return; }
  const name = sensors[idx]?.name || 'Sensor ini';
  if (!confirm(`Hapus "${name}"? Wadahnya akan hilang dari dashboard.`)) return;
  sensors.splice(idx, 1);
  localStorage.setItem('tank_sensors', JSON.stringify(sensors));
  renderSensorList();
  showTDSSt('success', '✅ Sensor dihapus. Dashboard otomatis diperbarui.');
}
// Make deleteSensor & openEditSensor globally accessible for innerHTML onclick
window.deleteSensor   = deleteSensor;
window.openEditSensor = openEditSensor;
// Expose project functions used inside innerHTML
window.completePJ  = completePJ;
window.openEditPJ  = openEditPJ;
window.openUpdModal= openUpdModal;
window.openSumm    = openSumm;
window.closePD     = closePD;
window.delPJ       = delPJ;
window.openSP      = openSP;
window.closeSP     = closeSP;
window.saveSP      = saveSP;
window.openCIP_enh = openCIP_enh;
window.closeCIP_enh= closeCIP_enh;
window.saveCIP_enh = saveCIP_enh;
window.openFP      = openFP;
window.closeFP     = closeFP;
window.addFPItem   = addFPItem;
window.saveFP      = saveFP;
window.endProd     = endProd;
window.loadDEProjForm = loadDEProjForm;

function showTDSSt(type, msg) {
  const b = document.getElementById('tds-sb'), m = document.getElementById('tds-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type !== 'error') setTimeout(() => { if (b) b.style.display = 'none'; }, 4000);
}


// ═══════════════════════════════════════════════════════════
// VACUUM / TEMPERATURE NOTE
// ═══════════════════════════════════════════════════════════
function checkVacuum(key) {
  const inp  = document.getElementById('dep-temp-prod-' + key);
  const note = document.getElementById('dep-vacuum-note-' + key);
  if (!inp || !note) return;
  const val = parseFloat(inp.value);
  if (isNaN(val) || inp.value === '') { note.style.display = 'none'; return; }
  note.style.display = 'block';
  if (val <= 97) {
    note.style.background = '#eff6ff';
    note.style.border = '1px solid #bfdbfe';
    note.style.color = '#1d4ed8';
    note.innerHTML = '💧 <strong>VACUUM</strong> — Suhu ≤97°C, sistem berada dalam kondisi vakum.';
  } else {
    note.style.background = '#fff7ed';
    note.style.border = '1px solid #fed7aa';
    note.style.color = '#c2410c';
    note.innerHTML = '🌡️ <strong>NOT VACUUM</strong> — Suhu >97°C, sistem tidak dalam kondisi vakum.';
  }
}

// ═══════════════════════════════════════════════════════════
// PHOTO UPLOAD + CLIENT-SIDE COMPRESSION
// ═══════════════════════════════════════════════════════════
function handlePhotoUpload(key, input) {
  const preview = document.getElementById(key + '-photo-preview');
  if (!preview) return;
  const files = Array.from(input.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Compress via canvas
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        const sizeKB = Math.round(compressed.length * 0.75 / 1024);
        // Render thumbnail
        const uid = Date.now() + Math.random();
        const wrap = document.createElement('div');
        wrap.className = 'de-photo-thumb';
        wrap.id = 'photo-' + uid;
        wrap.innerHTML = `
          <img src="${compressed}" alt="${file.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;display:block">
          <button class="de-photo-remove" onclick="document.getElementById('photo-${uid}').remove()" title="Hapus foto">✕</button>
          <div class="de-photo-size">${sizeKB} KB</div>`;
        preview.appendChild(wrap);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  // Reset input so same file can be re-selected
  input.value = '';
}

// ═══════════════════════════════════════════════════════════
// KARTU STOK
// ═══════════════════════════════════════════════════════════
function getKartuStokHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div><div class="de-title">Kartu Stok</div><div class="de-sub">SAIL / Gudang / Kartu Stok — Kelola stok barang masuk & keluar</div></div>
    <button class="de-btn de-btn-primary" style="padding:8px 18px" onclick="openKartuStokForm()">＋ Tambah Entri</button>
  </div>

  <!-- Filter bar -->
  <div class="de-card" style="padding:14px 18px;margin-bottom:0;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input class="de-input" id="ks-search" placeholder="🔍 Cari nama barang..." style="flex:1;min-width:180px" oninput="renderKartuStok()">
    <select class="de-input de-select" id="ks-filter-type" style="width:160px" onchange="renderKartuStok()">
      <option value="">Semua Tipe</option>
      <option value="in">📥 Masuk</option>
      <option value="out">📤 Keluar</option>
    </select>
  </div>

  <!-- Table -->
  <div class="de-card" style="padding:0;overflow:hidden">
    <div style="overflow-x:auto">
      <table class="ks-table" id="ks-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Tanggal Entri</th>
            <th>Nama Barang</th>
            <th>Tipe</th>
            <th>Tgl Masuk</th>
            <th>Tgl Keluar</th>
            <th>Jumlah</th>
            <th>Satuan</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="ks-tbody"></tbody>
      </table>
    </div>
    <div id="ks-empty" style="display:none;padding:48px;text-align:center;color:var(--txt3)">
      <div style="font-size:32px;margin-bottom:8px">📦</div>
      <div style="font-size:13px">Belum ada entri stok — klik <strong>＋ Tambah Entri</strong> untuk mulai.</div>
    </div>
  </div>

  <!-- Summary cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:0">
    <div class="ks-sum-card" id="ks-sum-total" style="border-left:3px solid var(--blue)">
      <div class="ks-sum-label">Total Entri</div>
      <div class="ks-sum-val" id="ks-total-count">0</div>
    </div>
    <div class="ks-sum-card" id="ks-sum-in" style="border-left:3px solid var(--green)">
      <div class="ks-sum-label">📥 Total Masuk</div>
      <div class="ks-sum-val" style="color:var(--green)" id="ks-in-count">0</div>
    </div>
    <div class="ks-sum-card" id="ks-sum-out" style="border-left:3px solid var(--red)">
      <div class="ks-sum-label">📤 Total Keluar</div>
      <div class="ks-sum-val" style="color:var(--red)" id="ks-out-count">0</div>
    </div>
  </div>

  <!-- Modal -->
  <div class="proj-modal-overlay" id="ks-modal-overlay">
    <div class="proj-modal" style="max-width:500px">
      <div class="proj-modal-head">
        <div class="proj-modal-title" id="ks-modal-title">📦 Tambah Entri Stok</div>
        <button class="proj-modal-close" onclick="closeKartuStokForm()">✕</button>
      </div>
      <div class="proj-modal-body">
        <div class="de-grid">
          <div class="de-field de-full"><label class="de-label">NAMA BARANG *</label><input class="de-input" id="ks-f-name" type="text" placeholder="Contoh: Teh Hijau, Filter Paper..."></div>
          <div class="de-field"><label class="de-label">TIPE *</label>
            <select class="de-input de-select" id="ks-f-type">
              <option value="in">📥 Masuk</option>
              <option value="out">📤 Keluar</option>
            </select>
          </div>
          <div class="de-field"><label class="de-label">TANGGAL ENTRI</label><input class="de-input" id="ks-f-date" type="date"></div>
          <div class="de-field"><label class="de-label">TANGGAL MASUK</label><input class="de-input" id="ks-f-date-in" type="date"></div>
          <div class="de-field"><label class="de-label">TANGGAL KELUAR</label><input class="de-input" id="ks-f-date-out" type="date"></div>
          <div class="de-field"><label class="de-label">JUMLAH *</label><input class="de-input" id="ks-f-qty" type="number" min="0" step="0.01" placeholder="0"></div>
          <div class="de-field"><label class="de-label">SATUAN</label><input class="de-input" id="ks-f-unit" type="text" placeholder="kg, L, pcs, box..."></div>
          <div class="de-field de-full"><label class="de-label">KETERANGAN</label><textarea class="de-input de-textarea" id="ks-f-notes" placeholder="Keterangan tambahan..." style="min-height:60px"></textarea></div>
        </div>
        <div class="de-status-bar" id="ks-sb" style="display:none"><span id="ks-sm"></span></div>
        <div class="de-actions" style="margin-top:16px">
          <button class="de-btn de-btn-ghost" onclick="closeKartuStokForm()">Batal</button>
          <button class="de-btn de-btn-primary" onclick="submitKartuStok()">💾 Simpan</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

const gKS  = () => JSON.parse(localStorage.getItem('kartu_stok') || '[]');
const sKS  = (d) => localStorage.setItem('kartu_stok', JSON.stringify(d));
let _ksEditIdx = -1;

function initKartuStok() {
  renderKartuStok();
}

function renderKartuStok() {
  const q    = (document.getElementById('ks-search')?.value || '').toLowerCase();
  const type = document.getElementById('ks-filter-type')?.value || '';
  let data   = gKS();
  const total = data.length;
  const inCount  = data.filter(d => d.type === 'in').length;
  const outCount = data.filter(d => d.type === 'out').length;
  if (q)    data = data.filter(d => d.name.toLowerCase().includes(q));
  if (type) data = data.filter(d => d.type === type);

  const tbody  = document.getElementById('ks-tbody');
  const empty  = document.getElementById('ks-empty');
  const table  = document.getElementById('ks-table');
  if (!tbody) return;

  const el = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  el('ks-total-count', total);
  el('ks-in-count',  inCount);
  el('ks-out-count', outCount);

  if (!data.length) {
    table.style.display = 'none'; empty.style.display = 'block';
    return;
  }
  table.style.display = ''; empty.style.display = 'none';

  const allData = gKS(); // For real index lookup
  tbody.innerHTML = data.map((d) => {
    const realIdx = allData.findIndex(x => x.id === d.id);
    const typeTag = d.type === 'in'
      ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:#dcfce7;color:#15803d;border:1px solid #86efac">📥 MASUK</span>'
      : '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5">📤 KELUAR</span>';
    return `<tr>
      <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--txt3)">${realIdx+1}</td>
      <td style="font-size:11px;white-space:nowrap">${d.date || '—'}</td>
      <td style="font-weight:600;color:var(--txt)">${d.name}</td>
      <td>${typeTag}</td>
      <td style="font-size:11px;white-space:nowrap;color:var(--green)">${d.dateIn || '—'}</td>
      <td style="font-size:11px;white-space:nowrap;color:var(--red)">${d.dateOut || '—'}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600">${d.qty || '—'}</td>
      <td style="font-size:11px;color:var(--txt3)">${d.unit || '—'}</td>
      <td style="font-size:11px;color:var(--txt2);max-width:180px">${d.notes || '—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="pj-btn pj-btn-edit" onclick="editKartuStok(${realIdx})">✏️</button>
          <button class="pj-btn pj-btn-end" style="padding:4px 8px" onclick="deleteKartuStok(${realIdx})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openKartuStokForm(idx = -1) {
  _ksEditIdx = idx;
  const today = new Date().toISOString().split('T')[0];
  if (idx >= 0) {
    const d = gKS()[idx];
    document.getElementById('ks-modal-title').textContent = '✏️ Edit Entri Stok';
    document.getElementById('ks-f-name').value    = d.name || '';
    document.getElementById('ks-f-type').value    = d.type || 'in';
    document.getElementById('ks-f-date').value    = d.date || today;
    document.getElementById('ks-f-date-in').value = d.dateIn || '';
    document.getElementById('ks-f-date-out').value= d.dateOut || '';
    document.getElementById('ks-f-qty').value     = d.qty || '';
    document.getElementById('ks-f-unit').value    = d.unit || '';
    document.getElementById('ks-f-notes').value   = d.notes || '';
  } else {
    document.getElementById('ks-modal-title').textContent = '📦 Tambah Entri Stok';
    ['ks-f-name','ks-f-qty','ks-f-unit','ks-f-notes'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('ks-f-date').value = today;
    document.getElementById('ks-f-date-in').value = '';
    document.getElementById('ks-f-date-out').value = '';
    document.getElementById('ks-f-type').value = 'in';
  }
  const sb = document.getElementById('ks-sb'); if(sb) sb.style.display='none';
  document.getElementById('ks-modal-overlay')?.classList.add('show');
}
function closeKartuStokForm() {
  document.getElementById('ks-modal-overlay')?.classList.remove('show');
  _ksEditIdx = -1;
}
function submitKartuStok() {
  const name = document.getElementById('ks-f-name')?.value.trim();
  if (!name) { showKsSt('error','❌ Nama barang wajib diisi!'); return; }
  const qty  = document.getElementById('ks-f-qty')?.value;
  if (!qty)  { showKsSt('error','❌ Jumlah wajib diisi!'); return; }
  const entry = {
    id:      _ksEditIdx >= 0 ? gKS()[_ksEditIdx].id : Date.now(),
    name,
    type:    document.getElementById('ks-f-type')?.value || 'in',
    date:    document.getElementById('ks-f-date')?.value || '',
    dateIn:  document.getElementById('ks-f-date-in')?.value || '',
    dateOut: document.getElementById('ks-f-date-out')?.value || '',
    qty,
    unit:    document.getElementById('ks-f-unit')?.value.trim() || '',
    notes:   document.getElementById('ks-f-notes')?.value.trim() || '',
  };
  const data = gKS();
  if (_ksEditIdx >= 0) data[_ksEditIdx] = entry;
  else data.unshift(entry);
  sKS(data);
  showKsSt('success', _ksEditIdx >= 0 ? '✅ Entri diperbarui!' : '✅ Entri stok ditambahkan!');
  setTimeout(() => { closeKartuStokForm(); renderKartuStok(); }, 800);
}
function editKartuStok(idx) {
  openKartuStokForm(idx);
}
function deleteKartuStok(idx) {
  const name = gKS()[idx]?.name || 'entri ini';
  if (!confirm(`Hapus "${name}"?`)) return;
  const data = gKS(); data.splice(idx,1); sKS(data); renderKartuStok();
  showQuickToast('🗑️ Entri dihapus.');
}
function showKsSt(type,msg) {
  const b=document.getElementById('ks-sb'),m=document.getElementById('ks-sm');
  if(!b||!m)return; b.style.display='flex'; b.className='de-status-bar de-status-'+type; m.textContent=msg;
  if(type==='success') setTimeout(()=>{if(b)b.style.display='none';},3000);
}
window.editKartuStok   = editKartuStok;
window.deleteKartuStok = deleteKartuStok;

// ═══════════════════════════════════════════════════════════
// SURAT JALAN
// ═══════════════════════════════════════════════════════════
function getSuratJalanHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div><div class="de-title">Surat Jalan</div><div class="de-sub">SAIL / Reporting / Surat Jalan</div></div>
    <button class="de-btn de-btn-primary" style="padding:8px 18px" onclick="openSuratJalanForm()">＋ Buat Surat Jalan</button>
  </div>

  <!-- List -->
  <div id="sj-list" style="display:flex;flex-direction:column;gap:12px"></div>
  <div id="sj-empty" style="display:none">
    <div class="de-card" style="text-align:center;padding:48px">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div style="font-size:13px;color:var(--txt3)">Belum ada surat jalan — klik <strong>＋ Buat Surat Jalan</strong>.</div>
    </div>
  </div>

  <!-- Modal Form -->
  <div class="proj-modal-overlay" id="sj-modal-overlay">
    <div class="proj-modal" style="max-width:580px">
      <div class="proj-modal-head">
        <div class="proj-modal-title" id="sj-modal-title">📋 Buat Surat Jalan</div>
        <button class="proj-modal-close" onclick="closeSuratJalanForm()">✕</button>
      </div>
      <div class="proj-modal-body">
        <div class="de-grid">
          <div class="de-field"><label class="de-label">NO. SURAT JALAN</label><input class="de-input" id="sj-f-no" type="text" placeholder="Otomatis atau isi manual"></div>
          <div class="de-field"><label class="de-label">TANGGAL</label><input class="de-input" id="sj-f-date" type="date"></div>
          <div class="de-field de-full"><label class="de-label">NAMA PENERIMA / TUJUAN *</label><input class="de-input" id="sj-f-penerima" type="text" placeholder="Nama perusahaan atau orang..."></div>
          <div class="de-field de-full"><label class="de-label">ALAMAT TUJUAN</label><textarea class="de-input de-textarea" id="sj-f-alamat" style="min-height:56px" placeholder="Alamat pengiriman..."></textarea></div>
          <div class="de-field"><label class="de-label">NAMA PENGIRIM</label><input class="de-input" id="sj-f-pengirim" type="text" placeholder="Nama pengirim..."></div>
          <div class="de-field"><label class="de-label">KENDARAAN / EKSPEDISI</label><input class="de-input" id="sj-f-kendaraan" type="text" placeholder="Nopol / nama ekspedisi..."></div>
        </div>

        <!-- Barang items -->
        <div style="margin:14px 0 8px;font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase">Daftar Barang</div>
        <div id="sj-items"></div>
        <button class="de-btn de-btn-ghost" style="width:100%;margin-bottom:14px;font-size:12px" onclick="addSuratJalanItem()">＋ Tambah Barang</button>

        <div class="de-field de-full"><label class="de-label">CATATAN</label><textarea class="de-input de-textarea" id="sj-f-notes" style="min-height:56px" placeholder="Catatan tambahan..."></textarea></div>
        <div class="de-status-bar" id="sj-sb" style="display:none"><span id="sj-sm"></span></div>
        <div class="de-actions" style="margin-top:16px">
          <button class="de-btn de-btn-ghost" onclick="closeSuratJalanForm()">Batal</button>
          <button class="de-btn de-btn-primary" onclick="submitSuratJalan()">💾 Simpan Surat Jalan</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

let _sjItemCount = 0;
let _sjEditIdx   = -1;
const gSJ = () => JSON.parse(localStorage.getItem('surat_jalan') || '[]');
const sSJ = (d) => localStorage.setItem('surat_jalan', JSON.stringify(d));

function genSJNo() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yy = today.getFullYear();
  const key = 'sj_seq_'+dd+mm+yy;
  const seq = (parseInt(localStorage.getItem(key)||'0'))+1;
  localStorage.setItem(key, seq);
  return `SJ/${String(seq).padStart(3,'0')}/${mm}/${yy}`;
}

function initSuratJalan() {
  renderSuratJalan();
}
function renderSuratJalan() {
  const list  = document.getElementById('sj-list');
  const empty = document.getElementById('sj-empty');
  if (!list) return;
  const data = gSJ();
  if (!data.length) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  list.innerHTML = data.map((sj, idx) => `
    <div class="de-card" style="padding:16px 20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">${sj.no}</div>
          <div style="font-size:14px;font-weight:700;color:var(--txt)">${sj.penerima}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">📅 ${sj.date} &nbsp;•&nbsp; 🚚 ${sj.kendaraan||'—'} &nbsp;•&nbsp; 👤 ${sj.pengirim||'—'}</div>
          ${sj.alamat ? `<div style="font-size:11px;color:var(--txt3);margin-top:2px">📍 ${sj.alamat}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="pj-btn pj-btn-edit" onclick="editSuratJalan(${idx})">✏️ Edit</button>
          <button class="pj-btn pj-btn-end" onclick="deleteSuratJalan(${idx})">🗑️</button>
        </div>
      </div>
      ${sj.items?.length ? `
      <div style="margin-top:12px;overflow-x:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:var(--bg)">
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Nama Barang</th>
            <th style="padding:7px 10px;text-align:center;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Qty</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Satuan</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Keterangan</th>
          </tr></thead>
          <tbody>${sj.items.map((it,i) => `
            <tr style="background:${i%2===0?'var(--surface)':'var(--bg)'}">
              <td style="padding:7px 10px;color:var(--txt);font-weight:600">${it.name||'—'}</td>
              <td style="padding:7px 10px;text-align:center;font-family:'DM Mono',monospace;font-weight:600;color:var(--blue)">${it.qty||'—'}</td>
              <td style="padding:7px 10px;color:var(--txt3)">${it.unit||'—'}</td>
              <td style="padding:7px 10px;color:var(--txt2)">${it.desc||'—'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>` : ''}
      ${sj.notes ? `<div style="margin-top:10px;font-size:11px;color:var(--txt3);padding:8px 12px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">📝 ${sj.notes}</div>` : ''}
    </div>`).join('');
}

function openSuratJalanForm(idx=-1) {
  _sjEditIdx = idx; _sjItemCount = 0;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sj-items').innerHTML = '';
  const sb = document.getElementById('sj-sb'); if(sb) sb.style.display='none';
  if (idx >= 0) {
    const sj = gSJ()[idx];
    document.getElementById('sj-modal-title').textContent = '✏️ Edit Surat Jalan';
    document.getElementById('sj-f-no').value        = sj.no || '';
    document.getElementById('sj-f-date').value      = sj.date || today;
    document.getElementById('sj-f-penerima').value  = sj.penerima || '';
    document.getElementById('sj-f-alamat').value    = sj.alamat || '';
    document.getElementById('sj-f-pengirim').value  = sj.pengirim || '';
    document.getElementById('sj-f-kendaraan').value = sj.kendaraan || '';
    document.getElementById('sj-f-notes').value     = sj.notes || '';
    (sj.items||[]).forEach(it => addSuratJalanItem(it));
  } else {
    document.getElementById('sj-modal-title').textContent = '📋 Buat Surat Jalan';
    document.getElementById('sj-f-no').value        = genSJNo();
    document.getElementById('sj-f-date').value      = today;
    ['sj-f-penerima','sj-f-alamat','sj-f-pengirim','sj-f-kendaraan','sj-f-notes'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    addSuratJalanItem();
  }
  document.getElementById('sj-modal-overlay')?.classList.add('show');
}
function closeSuratJalanForm() {
  document.getElementById('sj-modal-overlay')?.classList.remove('show');
  _sjEditIdx = -1;
}
function addSuratJalanItem(data=null) {
  const uid = ++_sjItemCount;
  const container = document.getElementById('sj-items');
  if (!container) return;
  const row = document.createElement('div');
  row.id = 'sj-item-'+uid;
  row.style.cssText = 'display:grid;grid-template-columns:2fr 80px 80px 1fr auto;gap:6px;align-items:end;margin-bottom:6px;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)';
  row.innerHTML = `
    <div><label class="de-label" style="font-size:9px">NAMA BARANG</label><input class="de-input" id="sj-i-name-${uid}" value="${data?.name||''}" placeholder="Nama barang..."></div>
    <div><label class="de-label" style="font-size:9px">QTY</label><input class="de-input" id="sj-i-qty-${uid}" type="number" value="${data?.qty||''}" placeholder="0" min="0"></div>
    <div><label class="de-label" style="font-size:9px">SATUAN</label><input class="de-input" id="sj-i-unit-${uid}" value="${data?.unit||''}" placeholder="kg / pcs"></div>
    <div><label class="de-label" style="font-size:9px">KETERANGAN</label><input class="de-input" id="sj-i-desc-${uid}" value="${data?.desc||''}" placeholder="Opsional..."></div>
    <div style="padding-bottom:2px"><button class="fp-item-remove" onclick="document.getElementById('sj-item-${uid}').remove()" title="Hapus">✕</button></div>`;
  container.appendChild(row);
}
function submitSuratJalan() {
  const penerima = document.getElementById('sj-f-penerima')?.value.trim();
  if (!penerima) { showSjSt('error','❌ Nama penerima wajib diisi!'); return; }
  const items = [];
  document.querySelectorAll('#sj-items > div[id^="sj-item-"]').forEach(row => {
    const uid = row.id.replace('sj-item-','');
    items.push({
      name: document.getElementById('sj-i-name-'+uid)?.value.trim() || '',
      qty:  document.getElementById('sj-i-qty-'+uid)?.value || '',
      unit: document.getElementById('sj-i-unit-'+uid)?.value.trim() || '',
      desc: document.getElementById('sj-i-desc-'+uid)?.value.trim() || '',
    });
  });
  const entry = {
    id:        _sjEditIdx>=0 ? gSJ()[_sjEditIdx].id : Date.now(),
    no:        document.getElementById('sj-f-no')?.value.trim() || genSJNo(),
    date:      document.getElementById('sj-f-date')?.value || '',
    penerima,
    alamat:    document.getElementById('sj-f-alamat')?.value.trim() || '',
    pengirim:  document.getElementById('sj-f-pengirim')?.value.trim() || '',
    kendaraan: document.getElementById('sj-f-kendaraan')?.value.trim() || '',
    notes:     document.getElementById('sj-f-notes')?.value.trim() || '',
    items,
    created_at: new Date().toISOString(),
  };
  const data = gSJ();
  if (_sjEditIdx >= 0) data[_sjEditIdx] = entry; else data.unshift(entry);
  sSJ(data);
  showSjSt('success','✅ Surat jalan tersimpan!');
  setTimeout(()=>{ closeSuratJalanForm(); renderSuratJalan(); }, 800);
}
function editSuratJalan(idx) {
  openSuratJalanForm(idx);
}
function deleteSuratJalan(idx) {
  if (!confirm('Hapus surat jalan ini?')) return;
  const data=gSJ(); data.splice(idx,1); sSJ(data); renderSuratJalan();
  showQuickToast('🗑️ Surat jalan dihapus.');
}
function showSjSt(type,msg) {
  const b=document.getElementById('sj-sb'),m=document.getElementById('sj-sm');
  if(!b||!m)return; b.style.display='flex'; b.className='de-status-bar de-status-'+type; m.textContent=msg;
  if(type==='success') setTimeout(()=>{if(b)b.style.display='none';},3000);
}
window.editSuratJalan   = editSuratJalan;
window.deleteSuratJalan = deleteSuratJalan;
window.addSuratJalanItem = addSuratJalanItem;
window.checkVacuum = checkVacuum;
window.handlePhotoUpload = handlePhotoUpload;

// ═══════════════════════════════════════════════════════════
// Add Surat Jalan link to Reporting page nav
// ═══════════════════════════════════════════════════════════