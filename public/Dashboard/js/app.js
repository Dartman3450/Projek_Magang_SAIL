var _pjCache = { ongoing: [], completed: [] };
// ── INJEKSI CSS UNTUK KOTAK SATUAN (UNIT ADD-ON) ──
const unitAddonStyle = document.createElement('style');
unitAddonStyle.innerHTML = `
  .input-group { 
    display: flex; 
    align-items: stretch; 
    width: 100%; 
    margin-top: 4px; 
  }
  .input-group .de-input { 
    flex: 1; 
    border-top-right-radius: 0 !important; 
    border-bottom-right-radius: 0 !important; 
    margin-top: 0 !important; 
  }
  .input-group .group-unit { 
    display: flex; 
    align-items: center; 
    background: #f8fafc; 
    border: 1px solid var(--border); 
    border-left: none; 
    padding: 0 12px; 
    border-top-right-radius: 8px; 
    border-bottom-right-radius: 8px; 
    color: var(--txt2); 
    font-size: 11px; 
    font-weight: 700; 
    white-space: nowrap;
  }
`;
document.head.appendChild(unitAddonStyle);

// ── INJEKSI TAMPILAN KOTAK HITUNGAN OTOMATIS (READONLY) ──
const autoInputStyle = document.createElement('style');
autoInputStyle.innerHTML = `
  /* Mengubah warna dasar, teks, dan border untuk semua input otomatis */
  .de-input[readonly] {
    background-color: #ebf2fd !important; /* Background biru sangat pudar */
    color: #0284c7 !important; /* Teks warna biru laut pekat */
    font-weight: 700 !important; /* Teks tebal */
    border-color: #bae6fd !important; /* Garis pinggir biru muda */
    cursor: not-allowed;
  }
  
  /* Mengubah warna teks bayangan (placeholder) agar serasi */
  .de-input[readonly]::placeholder {
    color: #7dd3fc !important; /* Placeholder biru muda */
    font-weight: normal !important;
  }
`;
document.head.appendChild(autoInputStyle);

// ── INJEKSI STYLE SIDEBAR — nav bold + SAIL lebih besar ──
const sidebarStyle = document.createElement('style');
sidebarStyle.innerHTML = `
  /* SAIL title — lebih besar dan bold */
  .logo-tag {
    font-size: 24px !important;
    font-weight: 800 !important;
    letter-spacing: 4px;
  }
  
  /* Support Operational System — lebih besar dan bold */
  .logo-sub {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #555 !important;
    letter-spacing: 1.5px;
  }

  /* Nav items utama — hitam dan bold */
  .nav-item {
    color: #111 !important;
    font-weight: 700 !important;
  }
  .nav-item:hover {
    color: #111 !important;
  }
  .nav-item.active {
    color: var(--blue) !important;
  }

  /* Nav group header (Project, Data & Information, dll) — bold hitam */
  .nav-group-head {
    color: #111 !important;
    font-weight: 700 !important;
  }
  .nav-group-head:hover {
    color: #111 !important;
  }

  /* Sub-item (On Going Project, Completed Project, dll) — hitam bold */
  .nav-sub-item {
    color: #333 !important;
    font-weight: 600 !important;
  }
  .nav-sub-item:hover {
    color: var(--blue) !important;
  }

  /* Logout button — tetap merah */
  .logout-btn {
    color: var(--txt3) !important;
    font-weight: 600 !important;
  }
  .logout-btn:hover {
    color: var(--red) !important;
  }
  
  /* ESP badge partial (sebagian konek) */
  .esp-badge.partial {
    background: #fffbeb;
    border-color: #fde68a;
    color: #b45309;
  }
  .esp-badge.partial .esp-dot {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245,158,11,.5);
  }
`;
document.head.appendChild(sidebarStyle);

let espConnected = false;
let _activeTab   = 'water-level';
let _activeReportTab = 'lab';
let _reportSortBy = 'newest';

// Project management state variables
let _editPJIdx = -1;
let _spPJIdx = -1;
let _cipPJIdx = -1;
let _fpPJIdx = -1;
let _updPJIdx = -1, _updType = '';

const API = {
  summary:    '/api/iot/dashboard/summary',
  waterLevel: '/api/iot/water-level',
  waterFlow:  '/api/iot/water-flow',
  lingkungan: '/api/iot/lingkungan',
  patroli:    '/api/iot/patroli',
};

// Lab CIP state
let _labCIPItems = {}; // menyimpan counter item per uid

// Set Point field definitions (pagination)
const SP_FIELDS_PAGE1 = [
  {id:'sp-slurry',     label:'Slurry Ratio',         type:'number', unit:'%'},
  {id:'sp-hopper',     label:'Hopper Calibration',   type:'text',   unit:''},
  {id:'sp-density',    label:'Density',              type:'number', unit:'Kg/m³'},
  {id:'sp-feed',       label:'Feed',                 type:'number', unit:'L/h'},
  {id:'sp-aroma',      label:'Aroma Flowrate',       type:'number', unit:'L/h',      calculated:true, formula:'External strip rate % * Feed'},
  {id:'sp-steam',      label:'Stripping Steam',      type:'number', unit:'kg/h',     calculated:true, formula:'Aroma + 0.0933 * Top of Column - 2.3333 + Math.abs(Offset) * Feed * 0.0018'},
  {id:'sp-prod-out',   label:'Product Out',          type:'number', unit:'L/h'},
  {id:'sp-cond1',      label:'Condensate #1',        type:'number', unit:'L/h',      calculated:true, formula:'Condenser #1 % * Feed'},
  {id:'sp-cond2',      label:'Condensate #2',        type:'number', unit:'L/h',      calculated:true, formula:'(External strip rate % - Condenser #1 %) * Feed'},
  {id:'sp-ext',        label:'External Strip Rate ',  type:'number', unit:'%'},
  {id:'sp-int',        label:'Internal Strip Rate ',  type:'text',   unit:'',         calculated:true, formula:'100 * Stripping Steam / Feed'},
  {id:'sp-cond-rate',  label:'Condenser #1',         type:'number', unit:'%'},
  {id:'sp-offset',     label:'Offset',               type:'number', unit:'°C'},
];
// Set Point field definitions (pagination)
const SP_FIELDS_PAGE2 = [
  {id:'sp-temp-feed',  label:'Product Feed',         type:'number', unit:'°C'},
  {id:'sp-temp-heater',label:'Product Heater',       type:'number', unit:'°C',      calculated:true, formula:'Top of Column + Offset'},
  {id:'sp-temp-top',   label:'Top of Column',        type:'number', unit:'°C'},
  {id:'sp-Condensate1', label:'Condensate #1',         type:'number', unit:'°C'},
  {id:'sp-Condensate2', label:'Condensate #2',         type:'number', unit:'°C'},
  {id:'sp-temp-bot',   label:'Bottom of Column',     type:'number', unit:'°C'},
  {id:'sp-add1',       label:'Product Flowrate',                    type:'text',   unit:''},
  {id:'sp-add2',       label:'Product Flow Control Valve Position', type:'text',   unit:''},
  {id:'sp-add3',       label:'CT Steam Pressure',                   type:'text',   unit:''},
  {id:'sp-add4',       label:'Concentrate Recirculation Flow',      type:'text',   unit:''},
  {id:'sp-add5',       label:'Product Cooler Temperature',          type:'text',   unit:''},
  {id:'sp-add6',       label:'CT Discharge Level',                  type:'text',   unit:''},
  {id:'sp-add7',       label:'Brix Input',                          type:'text',   unit:''},
  {id:'sp-add8',       label:'Brix Output',                         type:'text',   unit:''},
  {id:'sp-chilled',    label:'Chilled Water',                       type:'text',   unit:''},
  {id:'sp-condenser-water', label:'Condenser Water',                type:'text',   unit:''},
  {id:'sp-system-vacuum',   label:'System Vacuum',                  type:'text',   unit:''},
  {id:'sp-steam-flow',      label:'Steam Flow',                     type:'text',   unit:'KG/h'},
];
const SP_FIELDS = [...SP_FIELDS_PAGE1, ...SP_FIELDS_PAGE2];

const DE_SECTIONS = [
  {
    label: 'Slurry',
    icon: '🌿',
    color: '#166534',
    bg: '#f0fdf4',
    border: '#86efac',
    fields: ['sp-slurry', 'sp-hopper', 'sp-density']
  },
  {
    label: 'Flow',
    icon: '💧',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#93c5fd',
    fields: ['sp-feed', 'sp-aroma', 'sp-steam', 'sp-cond1', 'sp-cond2']
  },
  {
    label: 'Strip Rate',
    icon: '📊',
    color: '#6b21a8',
    bg: '#faf5ff',
    border: '#c4b5fd',
    fields: ['sp-ext', 'sp-int', 'sp-cond-rate', 'sp-offset']
  },
  {
    label: 'Temperature',
    icon: '🌡️',
    color: '#b32222',
    bg: '#fff7ed',
    border: '#fdba74',
    fields: ['sp-temp-feed', 'sp-temp-heater', 'sp-temp-top', 'sp-Condensate1', 'sp-Condensate2', 'sp-temp-bot', 'sp-prod-out']
  },
  {
    label: 'Coolants',
    icon: '🧊',
    color: '#0284c7', // Biru laut pekat (mudah dibaca)
    bg: '#f0f9ff',    // Biru es sangat lembut (cerah)
    border: '#bae6fd',
    fields: ['sp-chilled', 'sp-condenser-water']
  },
  {
    label: 'Pressure',
    icon: '⚡',
    color: '#d97706', // Oranye/Amber pekat tegas
    bg: '#fffbeb',    // Kuning gading sangat lembut
    border: '#fde68a',
    fields: ['sp-system-vacuum', 'sp-steam-flow']
  },
  {
    label: 'Parameter CT',
    icon: '🔬',
    color: '#15803d', // Hijau tua (segar & jelas)
    bg: '#f0fdf4',    // Hijau mint pucat (bersih)
    border: '#bbf7d0',
    fields: ['sp-add1', 'sp-add2', 'sp-add3', 'sp-add4', 'sp-add5', 'sp-add6', 'sp-add7', 'sp-add8']
  }
];

// ═══════════════════════════════════════════════════════════════
// CIP MODAL SYSTEM - Checklist definitions (MUST BE BEFORE openCIPModal)
// ═══════════════════════════════════════════════════════════════
const CIP_CHECKLISTS = {
  production: {
    title: 'CIP Production',
    sections: [
      {
        name: '',
        items:['Finish Raw Product']
      },
      {
        name: 'SSC + Decanter CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric', 'Revers', 'Shutdown']
      },
      {
        name: 'Centri + Raw Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric', 'Shutdown']
      },
      {
        name: 'Filter CIP',
        items: ['Rinsing', 'Caustic + Rinsing', 'Citric + Rinsing']
      },
      {
        name: 'CT CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name: 'Clarified Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name: 'Concentrate Tank CIP',
        items: ['Rinsing Prod', 'Caustic', 'Rinsing Caustic', 'Citric', 'Rinsing Citric']
      },
      {
        name :'Aroma Tank CIP',
        items: ['Rinsing Hot Water']
      },
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
window.toggleNav = toggleNav;

// ── Role-based access control ──────────────────────────────────────
const ROLE_ACCESS = {
  admin:      null, // null = all pages allowed
  superadmin: null,
  PPIC:       null, // sama seperti admin — akses semua halaman
  scientist:  ['iot', 'laboratorium', 'reporting', 'change-password'],
  utility:    ['iot', 'utility',      'reporting', 'change-password'],
  limbah:     ['iot', 'limbah',       'reporting', 'change-password'],
  Produksi:   ['iot', 'production',   'reporting', 'change-password'],
};
// ───────────────────────────────────────────────────────────────────

function loadPage(page) {
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const map = {
    iot:['Dashboard IoT','SAIL / Dashboard / Monitor IoT'],
    ongoing:['On Going Project','SAIL / Project / On Going'],
    completed:['Completed Project','SAIL / Project / Completed'],
    receipt:['Receipt — Template Set Point','SAIL / Project / Receipt'],
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
  } else if (page === 'receipt') {              // ← TAMBAH CASE INI
    content.innerHTML = getReceiptPageHTML(); initReceiptPage();
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

function getReporting() {
    return `
    <div class="de-wrap">
        <div class="de-header">
            <div>
                <h2 class="de-title">Report Harian</h2>
                <p class="de-sub">SAIL / Reporting</p>
            </div>
        </div>

        <!-- Tab Navigation -->
        <div class="report-tabs" style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0;overflow-x:auto">
            <button class="report-tab active" data-tab="lab" onclick="switchReportTab('lab', this)">
                <span style="font-size:16px">🧪</span> Lab
            </button>
            <button class="report-tab" data-tab="utility" onclick="switchReportTab('utility', this)">
                <span style="font-size:16px">⚡</span> Utility
            </button>
            <button class="report-tab" data-tab="limbah" onclick="switchReportTab('limbah', this)">
                <span style="font-size:16px">♻️</span> Limbah
            </button>
        </div>

        <!-- Sorting Controls -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:8px">
                    <label style="font-size:12px;color:var(--txt3);font-weight:600">Urutkan:</label>
                    <select id="report-sort-select" onchange="changeReportSort(this.value)" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--txt);font-size:12px;cursor:pointer">
                        <option value="newest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <label style="font-size:12px;color:var(--txt3);font-weight:600">Dari:</label>
                    <input type="date" id="report-date-from" onchange="renderHarianReports()" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--txt);font-size:12px;cursor:pointer">
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <label style="font-size:12px;color:var(--txt3);font-weight:600">Sampai:</label>
                    <input type="date" id="report-date-to" onchange="renderHarianReports()" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--txt);font-size:12px;cursor:pointer">
                </div>
                <button onclick="clearDateFilters()" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--txt3);font-size:11px;cursor:pointer;font-weight:600">✕ Clear</button>
            </div>
            <div style="font-size:11px;color:var(--txt3);font-family:'DM Mono',monospace" id="report-count-label">0 laporan</div>
        </div>

        <!-- Display Reports Container -->
        <div id="harian-reports-container">
            <!-- Will be populated by JavaScript -->
        </div>
    </div>

    <style>
    .report-tab {
        padding: 10px 20px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        color: var(--txt3);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .report-tab:hover {
        color: var(--txt);
        background: var(--surface);
        border-radius: 8px 8px 0 0;
    }
    .report-tab.active {
        color: var(--blue);
        border-bottom-color: var(--blue);
        background: var(--surface);
        border-radius: 8px 8px 0 0;
    }
    
    .report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
    }
    
    .report-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 16px;
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
    }
    
    .report-card:hover {
        border-color: var(--blue);
        box-shadow: 0 4px 12px rgba(43, 125, 233, 0.08);
        transform: translateY(-2px);
    }
    
    .report-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 10px;
    }
    
    .report-card-date {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        color: var(--txt3);
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .report-card-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
    }
    
    .report-params {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .report-param-row {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 12px;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid var(--border);
    }
    
    .report-param-row:last-child {
        border-bottom: none;
    }
    
    .report-param-label {
        font-size: 10px;
        color: var(--txt3);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .report-param-value {
        font-family: 'DM Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: var(--blue);
    }

    @media (max-width: 768px) {
        .report-grid {
            grid-template-columns: 1fr;
        }
    }
    </style>
    `;
}



// ══ ESP STATUS — 3 ESP ═══════════════════════════════
const _ESP_DEFS = [
  { key: 'wl',  label: 'ESP Water Level' },
  { key: 'wf',  label: 'ESP Water Flow'  },
  { key: 'env', label: 'ESP Environment' },
];
// Simpan timestamp data terakhir tiap ESP
const _espLastSeen = { wl: null, wf: null, env: null };

// Threshold: jika data terakhir > 90 detik lalu → dianggap offline
const ESP_TIMEOUT_MS = 90_000;

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
      const lastTs  = _espLastSeen[e.key];
      const lastStr = lastTs
        ? new Date(lastTs).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
        : '—';
      const statusTxt = alive ? 'Connected' : (lastTs ? 'Waiting / Off' : 'No Data');
      const statusClr = alive ? '#16a34a' : '#b45309';
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
async function fetchSummary() {
  try {
    const res = await fetch(API.summary);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (!j.success) throw new Error(j.message || 'error');

    espConnected = true;
    showOverlays(false);

    const d = j.data;

    // ── Update last-seen per ESP ──────────────────────
    if (d.water_level?.created_at)  _espLastSeen.wl  = d.water_level.created_at;
    if (d.water_flow?.created_at)   _espLastSeen.wf  = d.water_flow.created_at;
    if (d.lingkungan?.created_at)   _espLastSeen.env = d.lingkungan.created_at;

    updateEspBadge();

    applyWL(d.water_level);
    applyWF(d.water_flow);
    applyEnv(d.lingkungan);
    applyPatroli(d.total_patroli);

  } catch(e) {
    console.warn('ESP tidak terhubung:', e.message);
    espConnected = false;
    setEspStatus('waiting');
    showOverlays(true);
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

// ── pill: update status indicator element ────────────────────
function pill(id, val, warn, danger) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = parseFloat(val);
  if (isNaN(v)) { el.className = 's-pill st-wait'; return; }
  if (v >= danger)    el.className = 's-pill st-danger';
  else if (v >= warn) el.className = 's-pill st-warn';
  else                el.className = 's-pill st-ok';
}

// ── applyPatroli: update patrol status display ───────────────
function applyPatroli(data) {
  if (!data) return;
  const positions = Array.isArray(data) ? data : (data.positions || []);
  positions.forEach(p => {
    const el = document.getElementById('pat-pos-' + p.pos);
    if (!el) return;
    el.className = 'pat-status pat-' + (p.status || 'Aman').toLowerCase();
    el.textContent = p.status || 'Aman';
  });
  const totalEl = document.getElementById('pat-total');
  if (totalEl && data.total != null) totalEl.textContent = data.total;
}

// ══ TABLE ══════════════════════════════════════════
const tabApi = {
  'water-level': API.waterLevel,
  'water-flow':  API.waterFlow,
  'lingkungan':  API.lingkungan,
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

// ══ BOOT ════════════════════════════════════════════
filterNav();
loadPage('iot');
// Trigger new widgets after short delay (DOM ready)
setTimeout(updateDashWidgets, 500);

// ═══════════════════════════════════════════════════════════
// DATA ENTRY
// ═══════════════════════════════════════════════════════════
function getDataEntryProduction(key,title,sub,icon){
  // Ambil semua project ongoing untuk bisa mulai set point dari project baru atau ongoing
  const projs = gPJ('ongoing');
  const projOpts = projs.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');
  return `<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> ${title}</div>
    <div class="de-proj-select-wrap">
      <label class="de-label" style="color:#111;">Pilih Ongoing Project</label>
      <select id="dep-proj-sel-${key}" onchange="loadDEProjForm('${key}')">
        <option value="">-- Pilih project ongoing --</option>
        ${projOpts}
      </select>
    </div>
    <div id="dep-form-${key}"></div>
  </div>
</div>`;
}

// ── FORM UTAMA LIMBAH ─────────────────────────────────────────
function getDataEntryLimbah(key,title,sub,icon){
  return `<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div><div class="de-date" id="de-dt-${key}">--</div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> Input Form — ${title}</div>
    <div class="de-grid">
      
      <div class="de-field de-full"><label class="de-label" style="color:#111; font-weight:700;">LINK KE PROJECT</label>
        <select class="de-input de-select" id="limbah-proj-sel" style="margin-top:4px; border-color:var(--blue); background:#ebf2fd;" onchange="toggleLimbahVolumeMode('${key}')">
          <option value="">-- Tidak ditautkan ke project (Simpan ke Laporan Harian) --</option>
        </select>
        <div style="font-size:10px; color:var(--txt3); margin-top:4px;">💡 Biarkan kosong jika ingin menyimpannya sebagai Laporan Harian biasa.</div>
      </div>

      <div class="de-field"><label class="de-label" style="color:#111;">DATE</label><input class="de-input" type="date" id="${key}-date"></div>
      
      <div class="de-field" id="${key}-awal-wrap" style="display:none;"><label class="de-label" style="color:#111;">Awal</label>
        <div class="input-group"><input class="de-input" type="number" id="${key}-awal" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">L</span></div>
      </div>
      <div class="de-field" id="${key}-akhir-wrap" style="display:none;"><label class="de-label" style="color:#111;">Akhir</label>
        <div class="input-group"><input class="de-input" type="number" id="${key}-akhir" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">L</span></div>
      </div>
      <div class="de-field"><label class="de-label" style="color:#111;">Total Volume</label>
        <div class="input-group"><input class="de-input" type="number" id="${key}-vol" placeholder="Input manual..." style="background:#fff; color:var(--blue); font-weight:700;"><span class="group-unit">L</span></div>
      </div>
      
      <div class="de-field"><label class="de-label" style="color:#111;">COD</label><div class="input-group"><input class="de-input" type="number" id="${key}-cod" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">BOD</label><div class="input-group"><input class="de-input" type="number" id="${key}-bod" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">TSS</label><div class="input-group"><input class="de-input" type="number" id="${key}-tss" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">pH</label><input class="de-input" type="number" id="${key}-ph" placeholder="7.0" step="0.1"></div>
      <div class="de-field de-full"><label class="de-label" style="color:#111;">NOTES</label><textarea class="de-input de-textarea" id="${key}-notes" placeholder="Add notes here..."></textarea></div>
      ${buildPhotoUpload(key)}

    </div>
    <div class="de-status-bar" id="${key}-sb" style="display:none"><span id="${key}-sm"></span></div>
    
    <div class="de-actions" style="justify-content:space-between; margin-top:20px; align-items:center;">
      <button class="de-btn de-btn-primary" onclick="openJarTestModal('${key}')" style="background:#0ea5e9; border-color:#0ea5e9; font-size:12px; padding:10px 18px; box-shadow:0 4px 10px rgba(14,165,233,0.3);">🧪 Buka Jar Test</button>
      
      <div style="display:flex; gap:10px;">
        <button class="de-btn de-btn-ghost" onclick="resetDE('${key}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="submitLimbah('${key}')">💾 Save Data</button>
      </div>
    </div>
  </div>
</div>`;
}

// 1. Fungsi Switch Tampilan & Mode
function toggleLimbahVolumeMode(key) {
  const sel = document.getElementById('limbah-proj-sel');
  const awalWrap = document.getElementById(key + '-awal-wrap');
  const akhirWrap = document.getElementById(key + '-akhir-wrap');
  const volEl = document.getElementById(key + '-vol');
  
  if (!sel || !awalWrap || !akhirWrap || !volEl) return;

  if (sel.value === '') {
    // JIKA TIDAK DITAUTKAN (LAPORAN HARIAN)
    awalWrap.style.display = 'none';
    akhirWrap.style.display = 'none';
    
    // Total Volume bisa diketik manual
    volEl.readOnly = false;
    volEl.style.background = '#fff';
    volEl.placeholder = 'Input manual...';
    
    // Bersihkan angkanya agar tidak nyangkut
    document.getElementById(key + '-awal').value = '';
    document.getElementById(key + '-akhir').value = '';
    volEl.value = '';
  } else {
    // JIKA DITAUTKAN KE PROJECT
    awalWrap.style.display = '';
    akhirWrap.style.display = '';
    
    // Total Volume digembok (Auto-hitung Akhir - Awal)
    volEl.readOnly = true;
    volEl.style.background = '#f3f4f6';
    volEl.placeholder = 'Auto (Akhir - Awal)';
    calcLimbahTotal(key); // Jalankan rumus
  }
}
window.toggleLimbahVolumeMode = toggleLimbahVolumeMode;

// 2. Fungsi Hitung (AKHIR - AWAL)
function calcLimbahTotal(key) {
  const volEl = document.getElementById(key + '-vol');
  if (volEl && !volEl.readOnly) return; // Cegah rumus berjalan jika sedang mode ketik manual
  
  const awal = parseFloat(document.getElementById(key + '-awal')?.value) || 0;
  const akhir = parseFloat(document.getElementById(key + '-akhir')?.value) || 0;
  
  if (volEl) {
    if (document.getElementById(key + '-awal').value !== '' || document.getElementById(key + '-akhir').value !== '') {
      volEl.value = (akhir - awal).toFixed(2);
    } else {
      volEl.value = '';
    }
  }
}
window.calcLimbahTotal = calcLimbahTotal;

// 3. Ganti fungsi Reset ini agar kotak Awal, Akhir, Total juga ikut terhapus saat direset
function resetDE(key){
  ['vol','awal','akhir','total','cod','bod','tss','ph','temp','notes',
   'steam','fgtemp','fwtemp','airp','sout','cond','sbd'].forEach(f=>{
    const el=document.getElementById(key+'-'+f); if(el) el.value='';
  });
  const d=document.getElementById(key+'-date'); if(d) d.value=new Date().toISOString().split('T')[0];
}

function openJarTestModal() {
  const currentRole = localStorage.getItem('role') || 'limbah';
  const isAdmin     = ['admin','superadmin'].includes(currentRole);
  const allProjs    = gPJ('ongoing');
  const projs       = isAdmin ? allProjs : allProjs.filter(p => {
    if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
    return p.allowed_roles.includes(currentRole);
  });
  let projOptions = '<option value="">-- Simpan ke Laporan Harian --</option>';
  projs.forEach(p => {
    const realIdx = allProjs.indexOf(p);
    projOptions += `<option value="${realIdx}">${p.name}</option>`;
  });

  const modalHTML = `
    <div id="jar-modal-wrapper">
      <div id="jar-modal-overlay" onclick="closeJarTestModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;display:flex;align-items:center;justify-content:center;"></div>
      <div id="jar-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:12px;width:min(850px,95vw);z-index:9999;box-shadow:0 20px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;max-height:90vh;">
        
        <div style="padding:16px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
          <span style="font-weight:700; font-size:16px; color:#1e293b;">🧪 Input Jar Test Multi-Sampel</span>
          <button onclick="closeJarTestModal()" style="border:none; background:none; cursor:pointer; font-size:18px; color:#64748b;">✕</button>
        </div>
        
        <div style="padding:20px; overflow-y:auto; flex:1;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
            <div class="de-field">
              <label class="de-label">LINK KE PROJECT</label>
              <select class="de-input" id="jar-proj-sel" style="border-color:var(--blue); background:#ebf2fd;">${projOptions}</select>
            </div>
            <div class="de-field">
              <label class="de-label">DATE</label>
              <input class="de-input" type="date" id="jar-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:80px 1fr 1fr 1fr 1fr 40px; gap:10px; padding:0 10px 8px; border-bottom:2px solid #eee; margin-bottom:10px; font-size:11px; font-weight:700; color:var(--txt2); text-align:center;">
            <div>pH</div>
            <div>PAC (mg)</div>
            <div>Dozing PAC</div>
            <div>Polimer (mg)</div>
            <div>Dozing Polimer</div>
            <div></div>
          </div>

          <div id="jar-row-container"></div>

          <button class="de-btn de-btn-ghost" onclick="addJarTestRow()" style="width:100%; margin-top:10px; border-style:dashed; font-size:12px;">＋ Tambah Sampel Pengujian</button>
          
          <div style="font-size:11px; font-style:italic; color:var(--txt3); text-align:right; margin-top:15px;">
            * Volume Sample = 500ml
          </div>
        </div>
        
        <div style="padding:16px 20px; border-top:1px solid #eee; background:#f8fafc; display:flex; justify-content:space-between;">
          <button class="de-btn de-btn-ghost" onclick="resetJarModalInputs()">🔄 Clear All</button>
          <button class="de-btn de-btn-primary" onclick="submitJarTestModal()">💾 Save All Data</button>
        </div>
      </div>
    </div>
  `;
  const div = document.createElement('div');
  div.id = 'jar-modal-root';
  div.innerHTML = modalHTML;
  document.body.appendChild(div);

  // Tambahkan baris pertama secara otomatis
  addJarTestRow();
}

// 1. Fungsi Tambah Baris (Dilengkapi Unit Add-on & Fix Auto Mode)
function addJarTestRow() {
  const container = document.getElementById('jar-row-container');
  const uid = Date.now() + Math.random().toString(36).substr(2, 5);
  
  const row = document.createElement('div');
  row.className = 'jar-data-row';
  row.id = 'jar-row-' + uid;
  row.style.cssText = 'display:grid; grid-template-columns:70px 1fr 1fr 1fr 1fr 35px; gap:12px; margin-bottom:10px; align-items:center; background:#fdfdfd; padding:8px; border-radius:8px; border:1px solid #f1f1f1;';
  
  row.innerHTML = `
    <input class="de-input jar-ph" type="number" step="0.1" placeholder="7.0">
    
    <div class="input-group">
      <input class="de-input jar-pac" id="pac-input-${uid}" type="number" placeholder="0" oninput="calcJarRowDosing('${uid}', 'pac')">
      <span class="group-unit">mg</span>
    </div>

    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pac" id="doz-pac-${uid}" readonly style="padding-right:45px;" placeholder="0">
      <button onclick="toggleJarRowMode('${uid}', 'pac')" id="btn-pac-${uid}" data-mode="auto" style="position:absolute; right:46px; top:50%; transform:translateY(-50%); font-size:8px; padding:3px 6px; border:1px solid var(--blue); background:#ebf2fd; color:var(--blue); border-radius:4px; cursor:pointer; font-weight:700;">AUTO</button>
      <span class="group-unit">ppm</span>
    </div>
    
    <div class="input-group">
      <input class="de-input jar-pol" id="pol-input-${uid}" type="number" placeholder="0" oninput="calcJarRowDosing('${uid}', 'pol')">
      <span class="group-unit">mg</span>
    </div>

    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pol" id="doz-pol-${uid}" readonly style="padding-right:45px;" placeholder="0">
      <button onclick="toggleJarRowMode('${uid}', 'pol')" id="btn-pol-${uid}" data-mode="auto" style="position:absolute; right:46px; top:50%; transform:translateY(-50%); font-size:8px; padding:3px 6px; border:1px solid var(--blue); background:#ebf2fd; color:var(--blue); border-radius:4px; cursor:pointer; font-weight:700;">AUTO</button>
      <span class="group-unit">ppm</span>
    </div>
    
    <button onclick="document.getElementById('jar-row-${uid}').remove()" style="background:none; border:none; color:var(--red); cursor:pointer; font-size:16px;">✕</button>
  `;
  container.appendChild(row);
}
window.addJarTestRow = addJarTestRow;

// 2. Fungsi Hitung Otomatis Real-time (Anti Ngebug)
function calcJarRowDosing(uid, type) {
  const inputEl = document.getElementById(type + '-input-' + uid);
  if (!inputEl) return;
  
  const inputVal = parseFloat(inputEl.value) || 0;
  const dozEl = document.getElementById('doz-' + type + '-' + uid);
  const btn = document.getElementById('btn-' + type + '-' + uid);
  
  if (dozEl && btn && btn.getAttribute('data-mode') === 'auto') {
    // Rumus: mg * 2 (Sesuai volume sampel 500ml)
    dozEl.value = inputVal > 0 ? (inputVal * 2).toFixed(2) : '';
  }
}
window.calcJarRowDosing = calcJarRowDosing;

// 3. Fungsi Switch AUTO/MANUAL (Dengan support CSS global)
function toggleJarRowMode(uid, type) {
  const el = document.getElementById('doz-' + type + '-' + uid);
  const btn = document.getElementById('btn-' + type + '-' + uid);
  if (!el || !btn) return;
  
  const isAuto = btn.getAttribute('data-mode') === 'auto';
  
  if (isAuto) {
    // Pindah ke Manual
    btn.setAttribute('data-mode', 'manual');
    el.removeAttribute('readonly'); // Lepas efek biru readonly
    btn.textContent = 'MAN';
    btn.style.color = 'var(--orange)'; 
    btn.style.borderColor = 'var(--orange)';
    btn.style.background = '#fffbeb';
  } else {
    // Pindah ke Auto
    btn.setAttribute('data-mode', 'auto');
    el.setAttribute('readonly', 'true'); // Kembalikan efek biru readonly
    btn.textContent = 'AUTO';
    btn.style.color = 'var(--blue)'; 
    btn.style.borderColor = 'var(--blue)';
    btn.style.background = '#ebf2fd';
    
    // Langsung hitung ulang saat dikembalikan ke AUTO
    calcJarRowDosing(uid, type);
  }
}
window.toggleJarRowMode = toggleJarRowMode;

// ─── FUNGSI RESET JAR TEST (MULTI-BARIS) ───────────────
function resetJarModalInputs() {
  // 1. Kembalikan ke Laporan Harian (Project kosong)
  const projSel = document.getElementById('jar-proj-sel');
  if (projSel) projSel.value = '';

  // 2. Kembalikan tanggal ke hari ini
  const dateInput = document.getElementById('jar-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // 3. Bersihkan semua baris yang ada di dalam wadah (container)
  const container = document.getElementById('jar-row-container');
  if (container) {
    container.innerHTML = ''; 
  }

  // 4. Munculkan kembali 1 baris kosong yang baru
  addJarTestRow();
  
  showQuickToast('🔄 Form Jar Test dikosongkan.');
}
window.resetJarModalInputs = resetJarModalInputs;

// ─── FUNGSI SUBMIT & TUTUP JAR TEST (ANTI-FREEZE) ───────────────

function submitJarTestModal() {
  if (!confirm('Apakah Anda yakin ingin menyimpan semua baris Jar Test ini?')) return;
  const projIdx = document.getElementById('jar-proj-sel').value;
  const date = document.getElementById('jar-date').value;
  const rows = document.querySelectorAll('.jar-data-row');
  
  const allEntries = [];
  rows.forEach(row => {
    const ph = row.querySelector('.jar-ph').value;
    const pac = row.querySelector('.jar-pac').value;
    const dozPac = row.querySelector('.jar-doz-pac').value;
    const pol = row.querySelector('.jar-pol').value;
    const dozPol = row.querySelector('.jar-doz-pol').value;
    
    if (ph || pac || pol) {
      allEntries.push({ ph, pac, dozPac, pol, dozPol });
    }
  });

  if (allEntries.length === 0) {
    showQuickToast('❌ Isi minimal satu baris data!');
    return;
  }

  if (projIdx !== "") {
    const projs = gPJ('ongoing');
    const p = projs[+projIdx];
    if (!p.jarTestHistory) p.jarTestHistory = [];
    
    allEntries.forEach((ent, i) => {
      const suffix = allEntries.length > 1 ? ` (Sampel ${i+1})` : '';
      p.jarTestHistory.push({
        saved_at: new Date().toISOString(),
        fields: [
          { label: 'pH' + suffix, newVal: ent.ph || '—' },
          { label: 'Dozing PAC' + suffix, newVal: ent.dozPac || '0' },
          { label: 'Dozing Polimer' + suffix, newVal: ent.dozPol || '0' }
        ]
      });
    });
    sPJ('ongoing', projs);
    showQuickToast('✅ ' + allEntries.length + ' Data Jar Test disimpan ke Project.');
  } else {
    const harian = JSON.parse(localStorage.getItem('harian_entries') || '[]');
    allEntries.forEach((ent, i) => {
      harian.unshift({
        id: Date.now() + i,
        cat: 'limbah',
        projName: 'Jar Test Harian',
        data: { 
          'Tanggal': date, 
          'pH': ent.ph || '—', 
          'PAC (mg)': ent.pac || '—',
          'Doz. PAC': ent.dozPac || '—', 
          'Polimer (mg)': ent.pol || '—',
          'Doz. Polimer': ent.dozPol || '—' 
        },
        saved_at: new Date().toISOString()
      });
    });
    localStorage.setItem('harian_entries', JSON.stringify(harian));
    showQuickToast('✅ Data Jar Test masuk Laporan Harian.');
  }

  closeJarTestModal();
}

function closeJarTestModal() {
  document.getElementById('jar-modal-root')?.remove();
}
window.closeJarTestModal = closeJarTestModal;

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
  const harianSub = document.getElementById('util-harian-sub-' + key);
  const projectSub = document.getElementById('util-project-sub-' + key);
  const area = document.getElementById('util-form-area-' + key);
  
  // Ambil elemen label berdasarkan ID asli yang ada di HTML
  const tabH = document.getElementById('util-tab-harian');
  const tabP = document.getElementById('util-tab-project');
  
  if (!harianSub || !projectSub || !area) return;

  // 1. Ganti warna / background tombol saat diklik
  if (tabH && tabP) {
    // Reset warna ke putih/abu-abu (Non-aktif)
    tabH.style.borderColor = 'var(--border)';
    tabH.style.background = 'var(--bg)';
    tabH.style.color = '#111';
    
    tabP.style.borderColor = 'var(--border)';
    tabP.style.background = 'var(--bg)';
    tabP.style.color = '#111';
    
    // Warnai Biru tombol yang aktif
    if (type === 'harian') {
      tabH.style.borderColor = 'var(--blue)';
      tabH.style.background = '#ebf2fd';
      tabH.style.color = 'var(--blue)';
    } else {
      tabP.style.borderColor = 'var(--blue)';
      tabP.style.background = '#ebf2fd';
      tabP.style.color = 'var(--blue)';
    }
  }

  // 2. Bersihkan form lama agar tidak bertumpuk
  area.innerHTML = ''; 

  // 3. Tampilkan dropdown sesuai tipe
  if (type === 'harian') {
    harianSub.style.display = 'block';
    projectSub.style.display = 'none';
    
    // Render otomatis jika kategori harian sudah ada isinya
    const cat = document.getElementById('util-harian-cat-' + key).value;
    if (cat) utilRenderHarian(key, cat);
    
  } else {
    harianSub.style.display = 'none';
    projectSub.style.display = 'block';
    
    // Muat daftar project Ongoing ke dropdown Project
    const projSel = document.getElementById('util-project-cat-' + key);
    if (projSel) {
      const currentRole = localStorage.getItem('role') || 'utility';
      const isAdmin     = ['admin','superadmin'].includes(currentRole);
      const allProjs    = gPJ('ongoing');
      const projs       = isAdmin ? allProjs : allProjs.filter(p => {
        if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
        return p.allowed_roles.includes(currentRole);
      });
      projSel.innerHTML = '<option value="">-- Pilih project --</option>';
      projs.forEach(p => {
        const realIdx = allProjs.indexOf(p);
        const opt = document.createElement('option');
        opt.value = realIdx; opt.textContent = p.name;
        projSel.appendChild(opt);
      });
      
      // Render jika sebelumnya sudah ada project yang dipilih
      if (projSel.value !== '') utilRenderProject(key, projSel.value);
    }
  }
}
window.utilSwitchType = utilSwitchType;

function utilRenderHarian(key, cat) {
  const area = document.getElementById('util-form-area-'+key);
  if (!area) return;
  if (!cat) { area.innerHTML = ''; return; }

  // Jika kategori AIR → render 3 form sekaligus
  if (cat === 'air') {
    const airTypes = [
      { id: 'air_baku',    label: '💧 Air Baku (m³)' },
      { id: 'air_proses',  label: '💧 Air Feed Slurry (m³)' },
      { id: 'air_sibel',   label: '💧 Air Steam Generator (m³)' },
    ];

    area.innerHTML = airTypes.map(({ id, label }) => {
      const uid = key + '_' + id;
      return `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:16px;">
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
              <label class="de-label" style="color:#111;">TOTAL <span style="font-weight:400;color:var(--txt3)"></span></label>
              <input class="de-input" type="number" id="util-${uid}-total" placeholder="Auto-hitung..." readonly style="background:#f3f4f6;color:var(--txt3);">
            </div>
            <div class="de-field de-full">
              <label class="de-label" style="color:#111;">NOTES</label>
              <textarea class="de-input de-textarea" id="util-${uid}-notes" placeholder="Catatan tambahan..."></textarea>
            </div>
            ${buildPhotoUpload(uid)}
          </div>
          <div class="de-status-bar" id="util-${uid}-sb" style="display:none"><span id="util-${uid}-sm"></span></div>
          <div class="de-actions">
            <button class="de-btn de-btn-ghost" onclick="utilResetHarian('${uid}')">🔄 Reset</button>
            <button class="de-btn de-btn-primary" onclick="utilSaveHarian('${uid}','${label}')">💾 Simpan</button>
          </div>
        </div>`;
    }).join('');
    return;
  }

  // Kategori lain (solar, listrik) → render 1 form seperti biasa
  const labels = { solar: '⛽ Solar (Liter)', listrik: '⚡ Listrik (kWh)' };
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
          <label class="de-label" style="color:#111;">TOTAL <span style="font-weight:400;color:var(--txt3)"></span></label>
          <input class="de-input" type="number" id="util-${uid}-total" placeholder="Auto-hitung..." readonly style="background:#f3f4f6;color:var(--txt3);">
        </div>
        <div class="de-field de-full">
          <label class="de-label" style="color:#111;">NOTES</label>
          <textarea class="de-input de-textarea" id="util-${uid}-notes" placeholder="Catatan tambahan..."></textarea>
        </div>
        ${buildPhotoUpload(uid)}
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
  // Ambil nilai input string untuk mengecek apakah form sudah diisi
  const strAwal = document.getElementById('util-'+uid+'-awal')?.value;
  const strAkhir = document.getElementById('util-'+uid+'-akhir')?.value;
  
  const a = parseFloat(strAwal) || 0; // Awal
  const b = parseFloat(strAkhir) || 0; // Akhir
  const t = document.getElementById('util-'+uid+'-total');
  
  if (t) {
    if (strAwal !== '' || strAkhir !== '') {
      // Jika kategori adalah Solar ATAU khusus Air Baku saja
      // Rumus: AWAL - AKHIR
      if (uid.includes('solar') || uid.includes('air_proses') || uid.includes('air_sibel')) {
        t.value = (a - b).toFixed(2);
      } 
      // Jika kategori Listrik, Air Proses (Feed Slurry), atau Air Sibel (Steam Gen)
      // Rumus: AKHIR - AWAL
      else {
        t.value = (b - a).toFixed(2);
      }
    } else {
      // Kosongkan total jika input awal dan akhir kosong
      t.value = '';
    }
  }
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
  if (!confirm('Apakah Anda yakin ingin menyimpan data Utility Harian ini?')) return;
  // ── Collect all harian form fields and save to localStorage ──
  const formArea = document.getElementById('util-form-area-utility');
  const data = {};
  if (formArea) {
    formArea.querySelectorAll('[id^="util-'+uid+'"]').forEach(el => {
      const key = el.id.replace('util-'+uid+'-','');
      if (el.value) data[key] = el.value;
    });
  }
  const projName = (()=>{
    const s = document.getElementById('util-project-cat-utility');
    return s && s.value ? (gPJ('ongoing')[+s.value]?.name||'') : '';
  })();
  const entry = { saved_at: new Date().toISOString(), cat, uid, projName, data };
  const all = JSON.parse(localStorage.getItem('harian_entries')||'[]');
  all.push(entry);
  localStorage.setItem('harian_entries', JSON.stringify(all));

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

// 1. Fungsi untuk berpindah tab Boiler / Chiller
function utilSwitchTab(uid, tab) {
  const tabBoiler = document.getElementById('util-'+uid+'-tab-boiler');
  const tabChiller = document.getElementById('util-'+uid+'-tab-chiller');
  const formBoiler = document.getElementById('util-'+uid+'-form-boiler');
  const formChiller = document.getElementById('util-'+uid+'-form-chiller');
  
  if (!tabBoiler || !tabChiller || !formBoiler || !formChiller) return;
  
  if (tab === 'boiler') {
    formBoiler.style.display = 'block';
    formChiller.style.display = 'none';
    tabBoiler.style.borderBottomColor = 'var(--blue)';
    tabBoiler.style.color = '#111';
    tabChiller.style.borderBottomColor = 'transparent';
    tabChiller.style.color = '#666';
  } else {
    formBoiler.style.display = 'none';
    formChiller.style.display = 'block';
    tabBoiler.style.borderBottomColor = 'transparent';
    tabBoiler.style.color = '#666';
    tabChiller.style.borderBottomColor = 'var(--blue)';
    tabChiller.style.color = '#111';
  }
}
window.utilSwitchTab = utilSwitchTab;

// 2. Render Project Form (Tampilan Tab Terpisah)
function utilRenderProject(key, idx) {
  const area = document.getElementById('util-form-area-'+key);
  if (!area) return;
  if (idx === '') { area.innerHTML = ''; return; }
  const proj = gPJ('ongoing')[+idx];
  if (!proj) { area.innerHTML = ''; return; }
  const uid = key + '_proj_' + idx;
  
  // Load previous entry data if exists
  const prevData = proj.utilityData?.[uid] || {};

  area.innerHTML = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-size:13px;font-weight:700;color:#111;">📋 ${proj.name}</div>
          <div style="font-size:11px;color:var(--txt3);">Ongoing Project — Utility Entry</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="util-${uid}-tab-boiler" class="de-btn" type="button" style="padding:12px 24px;font-size:13px;font-weight:600;background:transparent;border:none;border-bottom:3px solid var(--blue);cursor:pointer;color:#111;transition:all .2s;" 
          onclick="utilSwitchTab('${uid}','boiler')">🔥 BOILER</button>
        <button id="util-${uid}-tab-chiller" class="de-btn" type="button" style="padding:12px 24px;font-size:13px;font-weight:600;background:transparent;border:none;border-bottom:3px solid transparent;cursor:pointer;color:#666;transition:all .2s;" 
          onclick="utilSwitchTab('${uid}','chiller')">❄️ CHILLER</button>
      </div>

      <div id="util-${uid}-form-boiler" style="display:block;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Steam Press</label>${makeNumberInputWithUnit('util-'+uid+'-b1', prevData.b1, 'kPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Flue gass temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b2', prevData.b2, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Feed water temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b3', prevData.b3, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Scale monitor temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b4', prevData.b4, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Overheat sensor temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b5', prevData.b5, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">To Next Blowdown</label>${makeInputField('util-'+uid+'-b6', prevData.b6, 'text')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Conductivity</label>${makeNumberInputWithUnit('util-'+uid+'-b7', prevData.b7, 'µS/cm')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Air pressure</label>${makeNumberInputWithUnit('util-'+uid+'-b8', prevData.b8, 'bar')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Ignition count</label>${makeNumberInput('util-'+uid+'-b9', prevData.b9)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil L-fire time</label>${makeInputField('util-'+uid+'-b10', prevData.b10, 'text')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil H-fire time</label>${makeInputField('util-'+uid+'-b11', prevData.b11, 'text')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Fuel Gas Temp (L-fire)</label>${makeNumberInputWithUnit('util-'+uid+'-b12', prevData.b12, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Fuel Gas Temp (H-fire)</label>${makeNumberInputWithUnit('util-'+uid+'-b13', prevData.b13, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Feed Water Avg Temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b14', prevData.b14, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil B-Efficiency</label>${makeNumberInputWithUnit('util-'+uid+'-b15', prevData.b15, '%')}</div>
          <div class="de-field"><label class="de-label" style="color:#7e1818;background:#FFD1D1;padding:8px 12px;border-radius:6px;font-weight:600;display:inline-block;">O Fuel Consumption</label>${makeNumberInputWithUnit('util-'+uid+'-b16', prevData.b16, 'KG/h')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Steam output</label>${makeNumberInputWithUnit('util-'+uid+'-b17', prevData.b17, 'kg/h')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Surface blowdown</label>${makeNumberInputWithUnit('util-'+uid+'-b18', prevData.b18, 'L')}</div>
          <div class="de-field" style="grid-column: 1 / -1;"><label class="de-label" style="color:#111;">Catatan Boiler</label>${makeTextareaField('util-'+uid+'-notes', prevData.notes)}</div>
        </div>
      </div>

      <div id="util-${uid}-form-chiller" style="display:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Set Point</label>${makeNumberInput('util-'+uid+'-c1', prevData.c1)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Water in temperature</label>${makeNumberInputWithUnit('util-'+uid+'-c2', prevData.c2, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Water out temperature</label>${makeNumberInputWithUnit('util-'+uid+'-c3', prevData.c3, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">CAP</label>${makeNumberInput('util-'+uid+'-c4', prevData.c4)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Discharge Pressure A</label>${makeNumberInput('util-'+uid+'-c5', prevData.c5)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Main Suction A</label>${makeNumberInput('util-'+uid+'-c6', prevData.c6)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Discharge Pressure B</label>${makeNumberInput('util-'+uid+'-c7', prevData.c7)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Main Suction B</label>${makeNumberInput('util-'+uid+'-c8', prevData.c8)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Unit Total Capacity</label>${makeNumberInput('util-'+uid+'-c9', prevData.c9)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Cir A Capacity</label>${makeNumberInput('util-'+uid+'-c10', prevData.c10)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Cir B Capacity</label>${makeNumberInput('util-'+uid+'-c11', prevData.c11)}</div>
          <div class="de-field" style="grid-column: 1 / -1;"><label class="de-label" style="color:#111;">Catatan Chiller</label>${makeTextareaField('util-'+uid+'-cnotes', prevData.cnotes)}</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        ${buildPhotoUpload(uid)}
      </div>

      <div class="de-status-bar" id="util-${uid}-sb" style="display:none"><span id="util-${uid}-sm"></span></div>
      <div class="de-actions">
        <button class="de-btn de-btn-ghost" onclick="utilResetProj('${uid}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="utilSaveProject('${uid}','${proj.name.replace(/'/g,"\\'")}')">💾 Simpan</button>
      </div>
    </div>`;
}
window.utilRenderProject = utilRenderProject;
// ── Reset Form Utility ──────────────────────────────────────
function utilResetProj(uid, count) {
  // Reset Boiler fields (b1-b18)
  for (let i = 1; i <= 18; i++) {
    const el = document.getElementById('util-'+uid+'-b'+i);
    if (el) el.value = '';
  }
  // Reset Chiller fields (c1-c11)
  for (let i = 1; i <= 11; i++) {
    const el = document.getElementById('util-'+uid+'-c'+i);
    if (el) el.value = '';
  }
  // Reset notes (Boiler & Chiller)
  const notes = document.getElementById('util-'+uid+'-notes');
  if (notes) notes.value = '';
  const cnotes = document.getElementById('util-'+uid+'-cnotes');
  if (cnotes) cnotes.value = '';
}
window.utilResetProj = utilResetProj;

function utilSaveProject(uid, projName) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Utility Project ini?')) return;
  const projIdx = +uid.split('_').pop();
  const projs = gPJ('ongoing');
  const proj = projs[projIdx];
  if (!proj) return;
  
  const prevData = proj.utilityData?.[uid] || {};
  const formData = {};
  
  // Tangkap nilai Boiler (b1-b18) sesuai ketikan user (termasuk nol)
  for (let i = 1; i <= 18; i++) {
    const el = document.getElementById('util-'+uid+'-b'+i);
    formData['b' + i] = el ? el.value : '';
  }
  
  // Tangkap nilai Chiller (c1-c11)
  for (let i = 1; i <= 11; i++) {
    const el = document.getElementById('util-'+uid+'-c'+i);
    formData['c' + i] = el ? el.value : '';
  }
  
  // Tangkap Catatan
  formData.notes = document.getElementById('util-'+uid+'-notes')?.value || '';
  formData.cnotes = document.getElementById('util-'+uid+'-cnotes')?.value || '';
  
  if (!proj.utilityData) proj.utilityData = {};

  // Record history
  const utilHistFields = [];
  const boilerLabels = {b1:'Steam Press (kPa)',b2:'Flue Gass Temperature (°C)',b3:'Feed Water Temperature (°C)',b4:'Scale Monitor Temperature (°C)',b5:'Overheat Sensor Temperature (°C)',b6:'To Next Blowdown',b7:'Conductivity (µS/cm)',b8:'Air Pressure (bar)',b9:'Ignition Count',b10:'Oil L-fire Time',b11:'Oil H-fire Time',b12:'Fuel Gas Temp (L-fire) (°C)',b13:'Fuel Gas Temp (H-fire) (°C)',b14:'Feed Water Avg Temperature (°C)',b15:'Oil B-Efficiency (%)',b16:'Oil Fuel Consumption',b17:'Steam Output (kg/h)',b18:'Surface Blowdown (L)'};
  const chillerLabels = {c1:'Set Point',c2:'Water In Temperature (°C)',c3:'Water Out Temperature (°C)',c4:'CAP',c5:'Discharge A',c6:'Suction A',c7:'Discharge B',c8:'Suction B',c9:'Unit Capacity',c10:'Cir A Capacity',c11:'Cir B Capacity'};
  
  [...Object.entries(boilerLabels), ...Object.entries(chillerLabels)].forEach(([k, lbl]) => {
    const oldVal = prevData[k] || '';
    const newVal = formData[k] || '';
    if (newVal || oldVal) utilHistFields.push({ label: lbl, oldVal, newVal });
  });

  if (formData.notes || prevData.notes) utilHistFields.push({ label: 'Catatan Boiler', oldVal: prevData.notes||'', newVal: formData.notes });
  if (formData.cnotes || prevData.cnotes) utilHistFields.push({ label: 'Catatan Chiller', oldVal: prevData.cnotes||'', newVal: formData.cnotes });

  if (!proj.utilityHistory) proj.utilityHistory = [];
  proj.utilityHistory.push({ saved_at: new Date().toISOString(), uid, fields: utilHistFields });

  proj.utilityData[uid] = formData;
  sPJ('ongoing', projs);
  
  const b = document.getElementById('util-'+uid+'-sb');
  const m = document.getElementById('util-'+uid+'-sm');
  if (b && m) {
    b.style.display = 'flex'; b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Utility untuk "' + projName + '" tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.utilSaveProject = utilSaveProject;

// ── 1. FUNGSI PEMBUAT FORM LAB UTAMA ──
function getDataEntryLaboratorium(key, title, sub, icon) {
  return `<div class="de-wrap">
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> ${title}</div>

    <div style="margin-bottom:20px;">
      <label class="de-label" style="color:#111;">TIPE ENTRY</label>
      <div style="display:flex; gap:10px; margin-top:6px;">
        <button type="button" id="lab-tab-harian-${key}" class="de-btn" style="flex:1; cursor:pointer; padding:12px; border:2px solid var(--blue); background:#ebf2fd; color:var(--blue); border-radius:10px; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.2s; font-weight:700; font-size:13px;" onclick="labSwitchType('${key}', 'harian')">
          📅 Harian
        </button>
        
        <button type="button" id="lab-tab-project-${key}" class="de-btn" style="flex:1; cursor:pointer; padding:12px; border:2px solid var(--border); background:var(--bg); color:#111; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.2s; font-weight:700; font-size:13px;" onclick="labSwitchType('${key}', 'project')">
          📋 Project
        </button>
      </div>
    </div>

    <div id="lab-harian-sub-${key}">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:16px;">🧪 Analisa Air — Entry Harian</div>
        <div class="de-grid">
          <div class="de-field de-full">
            <label class="de-label" style="color:#111;">NAMA SAMPLE</label>
            <input class="de-input" type="text" id="lab-h-${key}-sample" placeholder="Nama sample...">
          </div>
          <div class="de-field">
            <label class="de-label" style="color:#111;">pH</label>
            <input class="de-input" type="number" step="0.01" id="lab-h-${key}-ph" placeholder="—">
          </div>
          <div class="de-field">
            <label class="de-label" style="color:#111;">TDS</label>
            <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-tds" placeholder="—"><span class="group-unit">mg/L</span></div>
          </div>
          <div class="de-field">
            <label class="de-label" style="color:#111;">HARDNESS</label>
            <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-hardness" placeholder="—"><span class="group-unit">mg/L</span></div>
          </div>
          <div class="de-field">
            <label class="de-label" style="color:#111;">ALKALI</label>
            <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-alkali" placeholder="—"><span class="group-unit">mg/L</span></div>
          </div>
          <div class="de-field de-full">
            <label class="de-label" style="color:#111;">NOTES</label>
            <textarea class="de-input de-textarea" id="lab-h-${key}-notes" placeholder="Catatan tambahan..."></textarea>
          </div>
        </div>
        <div class="de-status-bar" id="lab-h-${key}-sb" style="display:none"><span id="lab-h-${key}-sm"></span></div>
        <div class="de-actions">
          <button class="de-btn de-btn-ghost" onclick="labResetHarian('${key}')">🔄 Reset</button>
          <button class="de-btn de-btn-primary" onclick="labSaveHarian('${key}')">💾 Simpan</button>
        </div>
      </div>
    </div>

    <div id="lab-project-sub-${key}" style="display:none;">
      <div style="margin-bottom:16px;">
        <label class="de-label" style="color:#111;">PILIH ONGOING PROJECT</label>
        <select class="de-input de-select" id="lab-proj-sel-${key}" onchange="labRenderProject('${key}')" style="margin-top:6px;">
          <option value="">-- Pilih project --</option>
        </select>
      </div>
      <div id="lab-proj-form-${key}"></div>
    </div>

  </div>
</div>`;
}
window.getDataEntryLaboratorium = getDataEntryLaboratorium;


// ── 2. FUNGSI SWITCH TIPE LAB (Anti Ngebug) ──
function labSwitchType(key, type) {
  const harianSub = document.getElementById('lab-harian-sub-' + key);
  const projectSub = document.getElementById('lab-project-sub-' + key);
  
  // Ambil elemen tombol dengan ID yang presisi
  const tabH = document.getElementById('lab-tab-harian-' + key);
  const tabP = document.getElementById('lab-tab-project-' + key);
  
  if (!harianSub || !projectSub) return;

  // 1. Ubah warna tombol saat diklik
  if (tabH && tabP) {
    // Reset warna ke putih/abu-abu (Non-aktif)
    tabH.style.borderColor = 'var(--border)';
    tabH.style.background = 'var(--bg)';
    tabH.style.color = '#111';
    
    tabP.style.borderColor = 'var(--border)';
    tabP.style.background = 'var(--bg)';
    tabP.style.color = '#111';
    
    // Warnai Biru tombol yang aktif
    if (type === 'harian') {
      tabH.style.borderColor = 'var(--blue)';
      tabH.style.background = '#ebf2fd';
      tabH.style.color = 'var(--blue)';
    } else {
      tabP.style.borderColor = 'var(--blue)';
      tabP.style.background = '#ebf2fd';
      tabP.style.color = 'var(--blue)';
    }
  }

  // 2. Tampilkan area yang sesuai
  if (type === 'harian') {
    harianSub.style.display = 'block';
    projectSub.style.display = 'none';
  } else {
    harianSub.style.display = 'none';
    projectSub.style.display = 'block';
    
    // Muat daftar project ke dropdown Project
    const projSel = document.getElementById('lab-proj-sel-' + key);
    if (projSel) {
      const currentRole = localStorage.getItem('role') || 'scientist';
      const isAdmin     = ['admin','superadmin'].includes(currentRole);
      const allProjs    = gPJ('ongoing');
      const projs = isAdmin ? allProjs : allProjs.filter(p => {
  // Jika role adalah scientist atau utility, izinkan melihat semua project ongoing
     if (currentRole === 'scientist' || currentRole === 'utility') return true; 
     if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
     return p.allowed_roles.includes(currentRole);
     });
      projSel.innerHTML = '<option value="">-- Pilih project --</option>';
      projs.forEach(p => {
        const realIdx = allProjs.indexOf(p);
        const o = document.createElement('option');
        o.value = realIdx; o.textContent = p.name;
        projSel.appendChild(o);
      });
      
      // Jika project sudah pernah dipilih, tampilkan langsung form-nya
      if (projSel.value !== '' && typeof labRenderProject === 'function') {
        labRenderProject(key);
      }
    }
  }
}
window.labSwitchType = labSwitchType;

// ─────────────────────────────────────────────────
// Helper: Build Previous Entry Reference Display
// ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────
// CIP Lab — PH + Keterangan + Add button
// Ganti/replace fungsi labRenderProject yang lama
// ─────────────────────────────────────────────────

// Helper untuk membuat input number field dengan unit
function makeNumberInputWithUnit(id, val, unit) {
  const v = (val !== undefined && val !== null) ? val : '';
  // Jika tidak ada satuan, render input biasa
  if (!unit) return `<input class="de-input" id="${id}" type="number" step="any" value="${v}" placeholder="0">`;
  
  // Jika ada satuan, render menggunakan gaya menempel
  return `
  <div class="input-group">
    <input class="de-input" id="${id}" type="number" step="any" value="${v}" placeholder="0">
    <span class="group-unit">${unit}</span>
  </div>`;
}
window.makeNumberInputWithUnit = makeNumberInputWithUnit;

// Helper untuk membuat input text field dengan styling dari nilai sebelumnya
function makeNumberInput(id, value, placeholder='—') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<input class="de-input" type="number" step="0.01" id="${id}" placeholder="${placeholder}" value="${hasValue ? value : ''}" data-prev-value="${prevValue}" style="${style}" 
    onfocus="
      if(this.value===this.dataset.prevValue && this.dataset.prevValue){
        this.value='';
        this.style.color='#111';
      }
    "
    onblur="
      if(!this.value && this.dataset.prevValue){
        this.value=this.dataset.prevValue;
        this.style.color='#999';
      } else if(this.value) {
        this.style.color='#111';
      }
    "
  >`;
}

// Helper untuk membuat textarea field dengan placeholder dari nilai sebelumnya
function makeTextareaField(id, value, placeholder='Catatan tambahan...') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<textarea class="de-input de-textarea" id="${id}" placeholder="${placeholder}" style="min-height:60px;${style}" data-prev-value="${prevValue}"
    onfocus="
      if(this.value===this.dataset.prevValue && this.dataset.prevValue){
        this.value='';
        this.style.color='#111';
      }
    "
    onblur="
      if(!this.value && this.dataset.prevValue){
        this.value=this.dataset.prevValue;
        this.style.color='#999';
      } else if(this.value) {
        this.style.color='#111';
      }
    "
  >${hasValue ? value : ''}</textarea>`;
}

// Helper untuk membuat input field dengan placeholder dari nilai sebelumnya
function makeInputField(id, value, type='text', placeholder='—') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<input class="de-input" type="${type}" id="${id}" placeholder="${placeholder}" value="${hasValue ? value : ''}" data-prev-value="${prevValue}" style="${style}" 
    onfocus="
      if(this.value===this.dataset.prevValue && this.dataset.prevValue){
        this.value='';
        this.style.color='#111';
      }
    "
    onblur="
      if(!this.value && this.dataset.prevValue){
        this.value=this.dataset.prevValue;
        this.style.color='#999';
      } else if(this.value) {
        this.style.color='#111';
      }
    "
  >`;
}

function labRenderProject(key) {
  const sel  = document.getElementById('lab-proj-sel-'+key);
  const area = document.getElementById('lab-proj-form-'+key);
  if (!area || !sel || sel.value === '') { if(area) area.innerHTML=''; return; }
  const proj = gPJ('ongoing')[+sel.value];
  if (!proj) { area.innerHTML=''; return; }

  const uid = key+'_proj_'+sel.value;
  _labCIPItems[uid] = 0; // reset counter

  // Load existing CIP entries kalau ada
  const existing = proj.cipLabEntries || [];
  
  // Load previous entry data if exists
  const prevData = proj.laboratoriumData?.[uid] || {};

  area.innerHTML = `
    <!-- Lab Form Panel with Toggle CIP -->
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:16px;">
      
      <!-- Header Title -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:13px;font-weight:700;color:#111;">🧪 ${proj.name}</div>
          <div style="font-size:11px;color:var(--txt3);">Ongoing Project — Lab Entry</div>
        </div>
      </div>

      <!-- Tab Switch: BRIX & MOISTURE -->
      <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="lab-${uid}-tab-brix" class="de-btn" style="padding:12px 24px;font-size:13px;font-weight:600;background:transparent;border:none;border-bottom:3px solid transparent;cursor:pointer;color:#666;transition:all .2s;" 
          onclick="labSwitchTab('${uid}','brix')">📊 BRIX</button>
        <button id="lab-${uid}-tab-moisture" class="de-btn" style="padding:12px 24px;font-size:13px;font-weight:600;background:transparent;border:none;border-bottom:3px solid transparent;cursor:pointer;color:#666;transition:all .2s;" 
          onclick="labSwitchTab('${uid}','moisture')">💯 MOISTURE</button>
      </div>

      <!-- BRIX Form Content -->
      <div id="lab-${uid}-form-brix" style="display:block;margin-bottom:20px;">
        <!-- Container untuk multiple BRIX entries -->
        <div id="lab-${uid}-brix-form-entries">
          <div id="lab-${uid}-brix-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
              <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-brix-entry-0').remove()" style="display:none;" id="lab-${uid}-brix-remove-0" title="Hapus entry">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
              <div class="de-field">
                <label class="de-label" style="color:#111;">Nama Sample</label>
                ${makeInputField('lab-'+uid+'-tlv', prevData.tlv)}
              </div>
              <div class="de-field">
                <label class="de-label" style="color:#111;">Kode Pile</label>
                ${makeInputField('lab-'+uid+'-lab-code', prevData.labCode)}
              </div>
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#111;">Brix</label>
              ${makeInputField('lab-'+uid+'-air-test', prevData.airTest)}
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#111;">Catatan</label>
              ${makeTextareaField('lab-'+uid+'-notes-brix', prevData.notes)}
            </div>
          </div>
        </div>
        <button class="de-btn de-btn-primary" style="padding:8px 16px;font-size:12px;margin-top:10px;" onclick="labAddBrixFormEntry('${uid}')">＋ Add Entry</button>
      </div>

      <!-- MOISTURE Form Content -->
      <div id="lab-${uid}-form-moisture" style="display:none;margin-bottom:20px;">
        <!-- Container untuk multiple MOISTURE entries -->
        <div id="lab-${uid}-moisture-form-entries">
          <div id="lab-${uid}-moisture-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
              <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-moisture-entry-0').remove()" style="display:none;" id="lab-${uid}-moisture-remove-0" title="Hapus entry">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
              <div class="de-field">
                <label class="de-label" style="color:#111;">Nama Sample</label>
                ${makeInputField('lab-'+uid+'-header-retaking', prevData.headerRetaking)}
              </div>
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#111;">MC%</label>
              ${makeInputField('lab-'+uid+'-sampling-point', prevData.samplingPoint)}
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#111;">Catatan</label>
              ${makeTextareaField('lab-'+uid+'-notes-moisture', prevData.notes)}
            </div>
          </div>
        </div>
        <button class="de-btn de-btn-primary" style="padding:8px 16px;font-size:12px;margin-top:10px;" onclick="labAddMoistureFormEntry('${uid}')">＋ Add Entry</button>
      </div>

      ${buildPhotoUpload('lab_'+uid)}

      <div class="de-status-bar" id="lab-${uid}-sb" style="display:none"><span id="lab-${uid}-sm"></span></div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:14px;">
        <button class="de-btn de-btn-primary" style="padding:8px 16px;font-size:12px;"
          onclick="labToggleCIPForm('${uid}')">🧼 CIP Lab</button>
        <div class="de-actions">
          <button class="de-btn de-btn-ghost" onclick="labResetProject('${uid}')">🔄 Reset</button>
          <button class="de-btn de-btn-primary" onclick="labSaveProject('${uid}','${proj.name.replace(/'/g,"\\'")}')">💾 Simpan Lab</button>
        </div>
      </div>
    </div>

    <!-- CIP Lab Modal Overlay -->
    <div id="lab-${uid}-cip-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;" onclick="if(event.target.id==='lab-${uid}-cip-overlay') labToggleCIPForm('${uid}')"></div>

    <!-- CIP Lab Modal -->
    <div id="lab-${uid}-cip-modal" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg);border:1px solid var(--border);border-radius:14px;width:540px;max-width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.22);z-index:201;">
      <!-- Modal Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:1;">
        <div style="font-size:14px;font-weight:700;color:#111;">🧼 CIP Lab Entry</div>
        <button onclick="labToggleCIPForm('${uid}')" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:white;cursor:pointer;font-size:16px;color:#666;display:grid;place-items:center;transition:all .15s;">✕</button>
      </div>

      <!-- Modal Body -->
      <div style="padding:18px 22px;">
        <!-- Container untuk baris entry CIP -->
        <div id="${uid}-cip-entries">
          ${existing.map((e, i) => buildLabCIPRow(uid, i, e)).join('')}
          ${!existing.length ? buildLabCIPRow(uid, 0, null) : ''}
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;margin-bottom:16px;">
          <button class="de-btn de-btn-primary" style="padding:8px 16px;font-size:12px"
            onclick="labAddCIPEntry('${uid}','${key}')">＋ Add Entry</button>
        </div>

        <div class="de-status-bar" id="${uid}-cip-sb" style="display:none"><span id="${uid}-cip-sm"></span></div>
      </div>

      <!-- Modal Footer -->
      <div style="display:flex;gap:10px;padding:16px 22px;border-top:1px solid var(--border);background:var(--surface);sticky:bottom;">
        <button class="de-btn de-btn-ghost" onclick="labResetCIPEntries('${uid}','${key}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="labSaveCIPEntries('${uid}','${key}')">💾 Simpan CIP</button>
      </div>
    </div>`;

  // Sinkronkan counter dengan jumlah row yang sudah dirender
  _labCIPItems[uid] = Math.max(existing.length, 1);
  
  // Initialize tab: set BRIX as default
  setTimeout(() => labInitTab(uid), 100);
}
window.labRenderProject = labRenderProject;

// ── Toggle CIP Modal Popup ────────────────────────────────
function labToggleCIPForm(uid) {
  const overlay = document.getElementById('lab-'+uid+'-cip-overlay');
  const modal = document.getElementById('lab-'+uid+'-cip-modal');
  if (!overlay || !modal) return;
  
  const isHidden = overlay.style.display === 'none';
  overlay.style.display = isHidden ? 'block' : 'none';
  modal.style.display = isHidden ? 'block' : 'none';
  
  // Add/remove body scroll lock
  if (isHidden) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}
window.labToggleCIPForm = labToggleCIPForm;

// ── Switch Tab: BRIX / MOISTURE ──────────────────────
function labSwitchTab(uid, tab) {
  const tabBrix = document.getElementById('lab-'+uid+'-tab-brix');
  const tabMoisture = document.getElementById('lab-'+uid+'-tab-moisture');
  const formBrix = document.getElementById('lab-'+uid+'-form-brix');
  const formMoisture = document.getElementById('lab-'+uid+'-form-moisture');
  
  if (!tabBrix || !tabMoisture || !formBrix || !formMoisture) return;
  
  if (tab === 'brix') {
    // Show BRIX, hide MOISTURE
    formBrix.style.display = 'block';
    formMoisture.style.display = 'none';
    tabBrix.style.borderBottomColor = 'var(--blue)';
    tabBrix.style.color = '#111';
    tabMoisture.style.borderBottomColor = 'transparent';
    tabMoisture.style.color = '#666';
  } else {
    // Show MOISTURE, hide BRIX
    formBrix.style.display = 'none';
    formMoisture.style.display = 'block';
    tabBrix.style.borderBottomColor = 'transparent';
    tabBrix.style.color = '#666';
    tabMoisture.style.borderBottomColor = 'var(--blue)';
    tabMoisture.style.color = '#111';
  }
}
window.labSwitchTab = labSwitchTab;

// ── Init tab: set BRIX as default ────────────────────
function labInitTab(uid) {
  labSwitchTab(uid, 'brix');
}
window.labInitTab = labInitTab;

// ── Add BRIX Form Entry ──────────────────────────────
function labAddBrixFormEntry(uid) {
  const container = document.getElementById('lab-'+uid+'-brix-form-entries');
  if (!container) return;
  
  const entryCount = container.querySelectorAll('[id^="lab-'+uid+'-brix-entry-"]').length;
  const newIdx = entryCount;
  
  const newEntry = document.createElement('div');
  newEntry.id = 'lab-'+uid+'-brix-entry-'+newIdx;
  newEntry.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;';
  newEntry.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:600;color:#666;">Entry #${newIdx+1}</div>
      <button class="fp-item-remove" onclick="document.getElementById('${newEntry.id}').remove()" title="Hapus entry">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
      <div class="de-field">
        <label class="de-label" style="color:#111;">Nama Sample</label>
        <input class="de-input" type="text" placeholder="—">
      </div>
      <div class="de-field">
        <label class="de-label" style="color:#111;">Kode Pile</label>
        <input class="de-input" type="text" placeholder="—">
      </div>
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">Brix</label>
      <input class="de-input" type="text" placeholder="—">
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">Catatan</label>
      <textarea class="de-input de-textarea" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea>
    </div>
  `;
  
  container.appendChild(newEntry);
  
  // Show delete button for all entries jika lebih dari 1
  if (entryCount > 0) {
    const allRemoveButtons = container.querySelectorAll('[id^="lab-'+uid+'-brix-remove-"]');
    allRemoveButtons.forEach(btn => btn.style.display = 'block');
  }
}
window.labAddBrixFormEntry = labAddBrixFormEntry;

// ── Add MOISTURE Form Entry ──────────────────────────
function labAddMoistureFormEntry(uid) {
  const container = document.getElementById('lab-'+uid+'-moisture-form-entries');
  if (!container) return;
  
  const entryCount = container.querySelectorAll('[id^="lab-'+uid+'-moisture-entry-"]').length;
  const newIdx = entryCount;
  
  const newEntry = document.createElement('div');
  newEntry.id = 'lab-'+uid+'-moisture-entry-'+newIdx;
  newEntry.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;';
  newEntry.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:600;color:#666;">Entry #${newIdx+1}</div>
      <button class="fp-item-remove" onclick="document.getElementById('${newEntry.id}').remove()" title="Hapus entry">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
      <div class="de-field">
        <label class="de-label" style="color:#111;">Nama Sample</label>
        <input class="de-input" type="text" placeholder="—">
      </div>
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">MC%</label>
      <input class="de-input" type="text" placeholder="—">
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">Catatan</label>
      <textarea class="de-input de-textarea" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea>
    </div>
  `;
  
  container.appendChild(newEntry);
  
  // Show delete button for all entries jika lebih dari 1
  if (entryCount > 0) {
    const allRemoveButtons = container.querySelectorAll('[id^="lab-'+uid+'-moisture-remove-"]');
    allRemoveButtons.forEach(btn => btn.style.display = 'block');
  }
}
window.labAddMoistureFormEntry = labAddMoistureFormEntry;

// ── Reset Lab Form ───────────────────────────────────
function labResetProject(uid) {
  ['tlv','header-retaking','air-test','lab-code','sampling-point','notes-brix','notes-moisture'].forEach(f => {
    const el = document.getElementById('lab-'+uid+'-'+f);
    if (el) el.value = '';
  });
}
window.labResetProject = labResetProject;

// ── Save Lab Form ────────────────────────────────────
function labSaveProject(uid, projName) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Lab Project ini?')) return;
  const projIdx = +uid.split('_').pop();
  const projs = gPJ('ongoing');
  const proj = projs[projIdx];
  if (!proj) return;
  
  // Tangkap semua baris pada form BRIX
  const brixEntries = [];
  const brixContainer = document.getElementById('lab-'+uid+'-brix-form-entries');
  if (brixContainer) {
    Array.from(brixContainer.children).forEach(entryDiv => {
      const inputs = entryDiv.querySelectorAll('input, textarea');
      if (inputs.length >= 4) {
        brixEntries.push({
          sample: inputs[0].value.trim(),
          kode: inputs[1].value.trim(),
          brix: inputs[2].value.trim(),
          notes: inputs[3].value.trim()
        });
      }
    });
  }

  // Tangkap semua baris pada form MOISTURE
  const moistEntries = [];
  const moistContainer = document.getElementById('lab-'+uid+'-moisture-form-entries');
  if (moistContainer) {
    Array.from(moistContainer.children).forEach(entryDiv => {
      const inputs = entryDiv.querySelectorAll('input, textarea');
      if (inputs.length >= 3) {
        moistEntries.push({
          sample: inputs[0].value.trim(),
          mc: inputs[1].value.trim(),
          notes: inputs[2].value.trim()
        });
      }
    });
  }

  // Siapkan label baru untuk diletakkan di history
  const labHistFields = [];

  brixEntries.forEach((e, i) => {
    const suffix = brixEntries.length > 1 ? ` (Baris ${i+1})` : '';
    if (e.sample || e.kode || e.brix || e.notes) {
      labHistFields.push({ label: `Nama Sample (Brix)${suffix}`, oldVal: '', newVal: e.sample });
      labHistFields.push({ label: `Kode Pile${suffix}`, oldVal: '', newVal: e.kode });
      labHistFields.push({ label: `Brix${suffix}`, oldVal: '', newVal: e.brix });
      // Hapus kondisi "if (e.notes)" agar baris catatan selalu terbentuk di tabel summary
      labHistFields.push({ label: `Catatan Brix${suffix}`, oldVal: '', newVal: e.notes });
    }
  });

  moistEntries.forEach((e, i) => {
    const suffix = moistEntries.length > 1 ? ` (Baris ${i+1})` : '';
    if (e.sample || e.mc || e.notes) {
      labHistFields.push({ label: `Nama Sample (Moisture)${suffix}`, oldVal: '', newVal: e.sample });
      labHistFields.push({ label: `MC%${suffix}`, oldVal: '', newVal: e.mc });
      // Baris catatan selalu terbentuk
      labHistFields.push({ label: `Catatan Moisture${suffix}`, oldVal: '', newVal: e.notes });
    }
  });

  // Simpan data
  const formData = { brixEntries, moistEntries };
  if (!proj.laboratoriumData) proj.laboratoriumData = {};
  if (!proj.labHistory) proj.labHistory = [];
  
  if (labHistFields.length > 0) {
    proj.labHistory.push({ saved_at: new Date().toISOString(), uid, fields: labHistFields });
  }

  proj.laboratoriumData[uid] = formData;
  sPJ('ongoing', projs);
  
  const b = document.getElementById('lab-'+uid+'-sb');
  const m = document.getElementById('lab-'+uid+'-sm');
  if (b && m) {
    b.style.display = 'flex';
    b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Lab untuk "' + projName + '" tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.labSaveProject = labSaveProject;

// ── Helper: build satu baris entry CIP ──────────────
function buildLabCIPRow(uid, idx, data) {
  const rowId = uid+'-cip-row-'+idx;
  return `
    <div id="${rowId}" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;
      padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">
      <div>
        <label class="de-label" style="font-size:9px;color:#111;">PH</label>
        <div class="de-input-wrap">
          <input class="de-input" type="number" step="0.01" min="0" max="14"
            id="${uid}-cip-ph-${idx}" value="${data?.ph || ''}" placeholder="0.00">
          <span class="de-input-unit">pH</span>
        </div>
      </div>
      <div>
        <label class="de-label" style="font-size:9px;color:#111;">KETERANGAN</label>
        <input class="de-input" type="text"
          id="${uid}-cip-ket-${idx}" value="${data?.keterangan || ''}" placeholder="Keterangan...">
      </div>
      <div style="padding-bottom:2px;">
        <button class="fp-item-remove"
          onclick="document.getElementById('${rowId}').remove()"
          title="Hapus baris">✕</button>
      </div>
    </div>`;
}
window.buildLabCIPRow = buildLabCIPRow;

// ── Tambah baris entry baru ──────────────────────────
function labAddCIPEntry(uid, key) {
  _labCIPItems[uid] = (_labCIPItems[uid] || 0) + 1;
  const idx       = _labCIPItems[uid];
  const container = document.getElementById(uid+'-cip-entries');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', buildLabCIPRow(uid, idx, null));
}
window.labAddCIPEntry = labAddCIPEntry;

// ── Reset semua entry ke satu baris kosong ───────────
function labResetCIPEntries(uid, key) {
  _labCIPItems[uid] = 0;
  const container = document.getElementById(uid+'-cip-entries');
  if (container) container.innerHTML = buildLabCIPRow(uid, 0, null);
}
window.labResetCIPEntries = labResetCIPEntries;

// ── Save semua entry CIP ke project ─────────────────
function labSaveCIPEntries(uid, key) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data CIP Lab ini?')) return;
  const container = document.getElementById(uid+'-cip-entries');
  if (!container) return;

  const entries = [];
  container.querySelectorAll('[id^="'+uid+'-cip-row-"]').forEach(row => {
    const idxMatch = row.id.match(/-cip-row-(\d+)$/);
    if (!idxMatch) return;
    const idx = idxMatch[1];
    const ph  = document.getElementById(uid+'-cip-ph-'+idx)?.value.trim();
    const ket = document.getElementById(uid+'-cip-ket-'+idx)?.value.trim();
    if (ph || ket) entries.push({ ph: ph || '', keterangan: ket || '' });
  });

  if (!entries.length) {
    showLabCIPSt(uid, 'error', '❌ Isi minimal satu baris PH!');
    return;
  }

  // Simpan ke project di localStorage
  const projIdx = parseInt(uid.split('_proj_')[1]);
  const allProjs = gPJ('ongoing');
  if (!allProjs[projIdx]) { showLabCIPSt(uid, 'error', '❌ Project tidak ditemukan!'); return; }

  allProjs[projIdx].cipLabEntries = entries;
  allProjs[projIdx].cipLabDone    = true;
  sPJ('ongoing', allProjs);

  showLabCIPSt(uid, 'success', '✅ CIP Lab tersimpan! ' + entries.length + ' entry.');
  setTimeout(() => {
    const sb = document.getElementById(uid+'-cip-sb');
    if (sb) sb.style.display = 'none';
    // Close modal after 1.5 seconds
    setTimeout(() => {
      labToggleCIPForm(uid);
    }, 1500);
  }, 500);
}
window.labSaveCIPEntries = labSaveCIPEntries;

function showLabCIPSt(uid, type, msg) {
  const b = document.getElementById(uid+'-cip-sb');
  const m = document.getElementById(uid+'-cip-sm');
  if (!b || !m) return;
  b.style.display = 'flex';
  b.className = 'de-status-bar de-status-' + type;
  m.textContent = msg;
  if (type === 'success') setTimeout(() => { if(b) b.style.display='none'; }, 3000);
}
window.showLabCIPSt = showLabCIPSt;

function labResetHarian(key) {
  ['sample','ph','tds','hardness','alkali','notes'].forEach(f => {
    const el = document.getElementById('lab-h-'+key+'-'+f); if(el) el.value='';
  });
}
window.labResetHarian = labResetHarian;

function labSaveHarian(key) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Lab Harian ini?')) return;
  // 1. Ambil semua nilai dari input form
  const sample = document.getElementById('lab-h-'+key+'-sample')?.value.trim();
  const ph = document.getElementById('lab-h-'+key+'-ph')?.value;
  const tds = document.getElementById('lab-h-'+key+'-tds')?.value;
  const hardness = document.getElementById('lab-h-'+key+'-hardness')?.value;
  const alkali = document.getElementById('lab-h-'+key+'-alkali')?.value;
  const notes = document.getElementById('lab-h-'+key+'-notes')?.value.trim();

  // Cek apakah minimal ada 1 data yang diisi
  if (!sample && !ph && !tds && !hardness && !alkali && !notes) {
    showQuickToast('❌ Isi minimal satu field sebelum menyimpan!');
    return;
  }

  // 2. Simpan data ke dalam Laporan Harian (Harian Entries)
  const harianEntries = JSON.parse(localStorage.getItem('harian_entries') || '[]');
  harianEntries.unshift({
    id: Date.now(),
    cat: 'laboratorium', // Kategori ini akan otomatis masuk ke tab Lab di menu Reporting
    data: {
      'Judul Laporan': 'Analisa Air Harian',
      'Nama Sample': sample || '—',
      'pH': ph || '—',
      'TDS': tds || '—',
      'Hardness': hardness || '—',
      'Alkali': alkali || '—',
      'Catatan': notes || '—'
    },
    saved_at: new Date().toISOString(),
    projName: 'Laboratorium Harian'
  });
  localStorage.setItem('harian_entries', JSON.stringify(harianEntries));

  // 3. Tampilkan Notifikasi Sukses
  const b = document.getElementById('lab-h-'+key+'-sb');
  const m = document.getElementById('lab-h-'+key+'-sm');
  if (b && m) { 
    b.style.display = 'flex'; 
    b.className = 'de-status-bar de-status-success'; 
    m.textContent = '✅ Data analisa air berhasil tersimpan!'; 
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000); 
  }

  // 4. Kosongkan form setelah berhasil disimpan agar siap untuk entri baru
  labResetHarian(key);
}
window.labSaveHarian = labSaveHarian;

function labResetProjSection(uid, section, fields) {
  fields.forEach(f => { const el=document.getElementById(uid+'-'+section+'-'+f); if(el) el.value=''; });
}
window.labResetProjSection = labResetProjSection;

function labSaveProjSection(uid, section, label) {
  const b=document.getElementById(uid+'-'+section+'-sb'), m=document.getElementById(uid+'-'+section+'-sm');
  if(b&&m){ b.style.display='flex'; b.className='de-status-bar de-status-success'; m.textContent='✅ Data '+label+' tersimpan!'; setTimeout(()=>{ if(b) b.style.display='none'; },3000); }
}
window.labSaveProjSection = labSaveProjSection;

// Buka modal Set Point dari halaman Lab
function openLabSetPoint(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') { showQuickToast('❌ Pilih project dulu!'); return; }
  const projIdx = +sel.value;
  const allProjs = gPJ('ongoing');
  if (projIdx < 0 || projIdx >= allProjs.length) return;
  openSP('ongoing', projIdx);
}
window.openLabSetPoint = openLabSetPoint;

function openLabCIP(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') { showQuickToast('❌ Pilih project dulu!'); return; }
  openCIP_enh('ongoing', +sel.value);
}
window.openLabCIP = openLabCIP;

// Buka modal Set Point dari halaman Utility Project
function openUtilSetPoint(key, projName) {
  const allProjs = gPJ('ongoing');
  const idx = allProjs.findIndex(p => p.name === projName);
  if (idx < 0) { showQuickToast('❌ Project tidak ditemukan!'); return; }
  openSP('ongoing', idx);
}
window.openUtilSetPoint = openUtilSetPoint;

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
  const preview = document.getElementById(key+'-boiler-photo-preview');
  if (preview) preview.innerHTML = '';
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

function resetLabChiller(key) {
  for (let i = 1; i <= 18; i++) {
    const el = document.getElementById(key+'-c'+i);
    if (el) el.value = '';
  }
  const d = document.getElementById(key+'-chiller-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
  const t = document.getElementById(key+'-chiller-time');
  if (t) t.value = '';
  const n = document.getElementById(key+'-chiller-notes');
  if (n) n.value = '';
  const preview = document.getElementById(key+'-chiller-photo-preview');
  if (preview) preview.innerHTML = '';
}
window.resetLabChiller = resetLabChiller;

function saveLabChiller(key) {
  const b = document.getElementById(key+'-chiller-sb');
  const m = document.getElementById(key+'-chiller-sm');
  if (b && m) {
    b.style.display = 'flex'; b.className = 'de-status-bar de-status-success';
    m.textContent = '✅ Chiller checklist tersimpan!';
    setTimeout(() => { if(b) b.style.display = 'none'; }, 3000);
  }
}
window.saveLabChiller = saveLabChiller;

function resetLabAll(key) {
  resetLabBoiler(key);
  resetLabChiller(key);
  const sb = document.getElementById(key+'-lab-sb');
  const sm = document.getElementById(key+'-lab-sm');
  if (sb && sm) { sb.style.display = 'none'; sm.textContent = ''; }
}
window.resetLabAll = resetLabAll;

function saveLabAll(key) {
  const sb = document.getElementById(key+'-lab-sb');
  const sm = document.getElementById(key+'-lab-sm');
  if (sb && sm) {
    sb.style.display = 'flex'; sb.className = 'de-status-bar de-status-success';
    sm.textContent = '✅ Boiler dan Chiller checklist tersimpan!';
    setTimeout(() => { if (sb) sb.style.display = 'none'; }, 3000);
  }
}
window.saveLabAll = saveLabAll;


// Fungsi dummy untuk mencegah reference error apabila ada event listener usang yang memanggil ini.
window.onLabProjChange = function(key) {}; 

function initDataEntryForm(key){
  // ── UTILITY ──────────────────────────────────────────────
  if(key === 'utility'){
    if(window._deClock) clearInterval(window._deClock);
    window._deClock = setInterval(()=>{
      const el = document.getElementById('de-dt-'+key);
      if(!el){ clearInterval(window._deClock); return; }
      el.textContent = new Date().toLocaleString('en-GB',{
        weekday:'long',day:'numeric',month:'long',
        year:'numeric',hour:'2-digit',minute:'2-digit'
      });
    }, 1000);
    const tabH = document.getElementById('util-tab-harian');
    if(tabH){ tabH.style.borderColor='var(--blue)'; tabH.style.background='#ebf2fd'; }
    const area = document.getElementById('util-form-area-utility');
    if(area) area.innerHTML = '';
    return;
  }
  // ── LIMBAH ───────────────────────────────────────────────
  if(key === 'limbah'){
    const d = document.getElementById(key+'-date');
    if(d) d.value = new Date().toISOString().split('T')[0];
    
    const psel = document.getElementById('limbah-proj-sel');
    if (psel) {
      const currentRole = localStorage.getItem('role') || 'limbah';
      const isAdmin     = ['admin','superadmin'].includes(currentRole);
      const allProjs    = gPJ('ongoing');
      const projs       = isAdmin ? allProjs : allProjs.filter(p => {
        if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
        return p.allowed_roles.includes(currentRole);
      });
      psel.innerHTML = '<option value="">-- Tidak ditautkan ke project --</option>';
      projs.forEach(p => {
        const realIdx = allProjs.indexOf(p);
        const opt = document.createElement('option');
        opt.value = realIdx; opt.textContent = p.name;
        psel.appendChild(opt);
      });
      // Panggil fungsi toggle ini agar Awal & Akhir langsung sembunyi!
      toggleLimbahVolumeMode(key); 
    }
    
    if(window._deClock) clearInterval(window._deClock);
    window._deClock = setInterval(()=>{
      const el = document.getElementById('de-dt-'+key);
      if(!el){ clearInterval(window._deClock); return; }
      el.textContent = new Date().toLocaleString('en-GB',{
        weekday:'long',day:'numeric',month:'long',
        year:'numeric',hour:'2-digit',minute:'2-digit'
      });
    }, 1000);
    return;
  }

  // ── LABORATORIUM ─────────────────────────────────────────
  if(key === 'laboratorium'){
    // Data Entry Lab sekarang memakai tab Harian vs Project.
    // Default-nya buka Tab Harian.
    const tabH = document.getElementById('lab-tab-harian-'+key);
    if(tabH) tabH.click();
    return;
  }

  // ── PRODUCTION ───────────────────────────────────────────
  const sel = document.getElementById('dep-proj-sel-'+key);
  if(!sel) return;
  sel.innerHTML = '<option value="">⏳ Memuat project...</option>';
  sel.disabled = true;

  loadPJ('ongoing').then(allProjs => {
    const currentRole = localStorage.getItem('role') || '';
    const isAdmin     = ['admin','superadmin'].includes(currentRole);

    // Filter: tampilkan project yang:
    // 1. allowed_roles null/kosong (dibuat admin tanpa restrict) → semua role lihat
    // 2. allowed_roles berisi role user ini
    const visibleProjs = isAdmin ? allProjs : allProjs.filter(p => {
      if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
      return p.allowed_roles.includes(currentRole);
    });

    sel.innerHTML = '<option value="">-- Pilih project ongoing --</option>';
    visibleProjs.forEach(p => {
      const realIdx = allProjs.indexOf(p); // pakai index asli agar loadDEProjForm tidak salah
      const opt = document.createElement('option');
      opt.value = realIdx;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
    sel.disabled = false;
  }).catch(() => {
    sel.innerHTML = '<option value="">-- Gagal memuat project --</option>';
    sel.disabled = false;
  });
}

/**
 * Versi buildSetpointPage dengan section header bergaya Set Point modal.
 * Menggantikan buildSetpointPage(fields, key, sp) di renderSetpointPage.
 */
function buildSetpointPageWithHeaders(key, sp) {
  // Buat lookup: field id → field definition
  const fieldMap = {};
  SP_FIELDS.forEach(f => { fieldMap[f.id] = f; });

  return DE_SECTIONS.map(section => {
    const sectionFields = section.fields
      .map(id => fieldMap[id])
      .filter(Boolean); // abaikan jika field tidak ditemukan

    const fieldsHTML = sectionFields
      .map(f => buildSetpointField(f, key, sp[f.id] || ''))
      .join('');

    return `
      <div style="margin-bottom:20px;">
        <!-- Section Header -->
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          background:${section.bg};
          border:1px solid ${section.border};
          border-radius:8px;
          padding:9px 14px;
          margin-bottom:12px;
        ">
          <span style="font-size:15px;">${section.icon}</span>
          <span style="
            font-size:12px;
            font-weight:700;
            color:${section.color};
            letter-spacing:0.5px;
            text-transform:uppercase;
          ">${section.label}</span>
        </div>
        <!-- Fields Grid -->
        <div class="setpoint-grid">
          ${fieldsHTML}
        </div>
      </div>`;
  }).join('');
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
          <button class="de-btn de-btn-primary" id="dep-cip-status-${key}" style="padding:8px 16px;font-size:12px;cursor:pointer;" onclick="console.log('CIP button clicked'); openCIPModal('${key}')">🧼 CIP</button>
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

// Single page actions for production
function buildFormActionsSinglePage(key) {
  return `
    <div class="de-status-bar" id="dep-sb-${key}" style="display:none"><span id="dep-sm-${key}"></span></div>
    <div class="de-actions" style="justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="de-btn de-btn-primary" id="dep-cip-status-${key}" style="padding:8px 16px;font-size:12px;cursor:pointer;">🧼 CIP</button>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="de-btn de-btn-ghost" onclick="resetDEP('${key}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="submitDEP('${key}')">💾 Save Data</button>
      </div>
    </div>`;
}
function saveSetpointDraft(key) {
  window._spDrafts = window._spDrafts || {};
  const draft = {};
  SP_FIELDS.forEach(f => { // Gunakan semua field karena sekarang single page
    const el = document.getElementById('dep-'+f.id+'-'+key);
    if (el) draft[f.id] = el.value.trim();
  });
  const tempEl = document.getElementById('dep-temp-prod-'+key);
  if (tempEl) draft['temp-prod'] = tempEl.value.trim();
  const notesEl = document.getElementById('dep-notes-'+key);
  if (notesEl) draft.notes = notesEl.value.trim();
  window._spDrafts[key] = draft;
}

function goToSetpointPage2(key) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) return;
  
  const projs = gPJ('ongoing');
  const sel = document.getElementById('dep-proj-sel-'+key);
  const proj = projs[+sel.value];
  if (!proj) return;
  saveSetpointDraft(key);
  renderSetpointPage(key, proj, 2);
}

function goToSetpointPage1(key) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) return;
  
  const projs = gPJ('ongoing');
  const sel = document.getElementById('dep-proj-sel-'+key);
  const proj = projs[+sel.value];
  if (!proj) return;
  
  renderSetpointPage(key, proj, 1);
}

// Fungsi baru untuk mengganti mode Auto/Manual
function toggleSPMode(elementId, fieldId, key) {
  const inputEl = document.getElementById(elementId);
  const btn = document.getElementById(`btn-mode-${elementId}`);
  if (!inputEl || !btn) return;

  const currentMode = inputEl.getAttribute('data-mode') || 'auto';
  
  if (currentMode === 'auto') {
      // 1. Switch ke MANUAL
      inputEl.setAttribute('data-mode', 'manual');
      btn.textContent = 'MANUAL';
      btn.style.background = '#fff7ed';
      btn.style.color = 'var(--orange)';
      btn.style.borderColor = 'var(--orange)';
      
      inputEl.readOnly = false;
      inputEl.style.background = '#fff';
      inputEl.style.color = '#111';
      inputEl.style.cursor = 'text';
      inputEl.title = 'Manual input';
      inputEl.focus();
  } else {
      // 2. Switch kembali ke AUTO
      inputEl.setAttribute('data-mode', 'auto');
      btn.textContent = 'AUTO';
      btn.style.background = '#ebf2fd';
      btn.style.color = 'var(--blue)';
      btn.style.borderColor = 'var(--blue)';
      
      inputEl.readOnly = true;
      inputEl.style.background = '#f3f4f6';
      inputEl.style.color = 'var(--txt3)';
      inputEl.style.cursor = 'not-allowed';
      inputEl.title = 'Auto-calculated';

      // Jalankan hitungan otomatis seketika saat kembali ke Auto
      if (elementId.startsWith('dep-')) {
          calculateSetpointField(fieldId, key);
      } else {
          calculateSPModalField(fieldId, key);
      }
  }
}
window.toggleSPMode = toggleSPMode;

function buildSetpointField(f, key, spVal) {
  const extraNote = (f.id === 'sp-temp-top')
    ? ` oninput="checkTopColumnVacuum('${key}',this.value)"`
    : '';

  const isCalc = f.calculated;
  // Jika ini adalah field kalkulasi otomatis, setting awal adalah AUTO (Terkunci)
  const calcAttrs = isCalc ? ' data-mode="auto" readonly style="background:#f3f4f6;color:var(--txt3);cursor:not-allowed;" title="Auto-calculated"' : '';
  // Non-calculated fields: set value so DOM reads correctly for calculations and save
  const valueAttr = (!isCalc && spVal !== '' && spVal !== undefined) ? ` value="${spVal}"` : '';
  const inputAttrs = `class="de-input" id="dep-${f.id}-${key}" type="${f.type}" step="0.1" placeholder="${spVal}"${valueAttr} onfocus="this.classList.remove('sp-ghost');this.placeholder=''" onblur="if(this.value===''){this.classList.add('sp-ghost');this.placeholder='${spVal}';}${extraNote}" ${calcAttrs}`;

  // Tombol Toggle Auto/Manual
  const autoTag = isCalc ? ` <button type="button" id="btn-mode-dep-${f.id}-${key}" onclick="toggleSPMode('dep-${f.id}-${key}', '${f.id}', '${key}')" style="margin-left:auto;font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid var(--blue);background:#ebf2fd;color:var(--blue);cursor:pointer;font-weight:700;transition:all 0.2s;">AUTO</button>` : '';

  // TRIK CSS AGAR RAPI:
  // 1. .de-field diset 'flex-col' & 'justify-end'. Jika teks label panjang, kotak input tetap terdorong ke paling bawah sejajar dengan sebelahnya.
  // 2. Semua input (dengan unit maupun tanpa unit) sekarang DIBUNGKUS merata dengan div .de-input-wrap agar proporsinya sama.
  return `
    <div class="de-field" style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;">
      <label class="de-label" style="color:#111;display:flex;align-items:flex-start;margin-bottom:8px;line-height:1.4;min-height:16px;">
        <span style="flex:1;word-break:break-word;">${f.label}</span>
        ${autoTag}
      </label>
      
      <div class="de-input-wrap" style="width:100%;">
        <input ${inputAttrs} style="width:100%;">
        ${f.unit ? `<span class="de-input-unit">${f.unit}</span>` : ''}
      </div>
      
      ${f.id === 'sp-temp-top' ? `<div id="dep-top-vacuum-note-${key}" style="display:none;margin-top:6px;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;"></div>` : ''}
    </div>`;
}

function checkTopColumnVacuum(key, val) {
  // Try both dep- and sp- prefixes
  let note = document.getElementById('dep-top-vacuum-note-' + key);
  if (!note) note = document.getElementById('sp-top-vacuum-note-' + key);
  if (!note) return;
  
  const v = parseFloat(val);
  if (isNaN(v)) { note.style.display = 'none'; return; }
  note.style.display = 'block';
  if (v < 97) {
    note.textContent = '🔵 Vacuum';
    note.style.background = '#dbeafe'; note.style.color = '#1e40af'; note.style.border = '1px solid #93c5fd';
  } else {
    note.textContent = '⭕ Not Vacuum';
    note.style.background = '#fef9c3'; note.style.color = '#713f12'; note.style.border = '1px solid #fde047';
  }
}
window.checkTopColumnVacuum = checkTopColumnVacuum;

function calculateSetpointField(fieldId, key) {
  const field = SP_FIELDS.find(f => f.id === fieldId);
  if (!field || !field.calculated) return;
  const inputEl = document.getElementById('dep-' + fieldId + '-' + key);
  
  if (!inputEl) return;
  // CEGAH KALKULASI JIKA USER MENGATUR MODE KE 'MANUAL'
  if (inputEl.getAttribute('data-mode') === 'manual') return; 

  const v = id => parseFloat(document.getElementById('dep-' + id + '-' + key)?.value) || 0;
  let result = '';

  try {
    if (fieldId === 'sp-aroma') {
      result = (v('sp-ext') * v('sp-feed') / 100).toFixed(2);
    } else if (fieldId === 'sp-steam') {
      const aroma = parseFloat(document.getElementById('dep-sp-aroma-' + key)?.value) || 0;
      result = (aroma + 0.0933 * v('sp-temp-top') - 2.3333 + Math.abs(v('sp-offset')) * v('sp-feed') * 0.0018).toFixed(2);
    } else if (fieldId === 'sp-cond1') {
      result = (v('sp-cond-rate') * v('sp-feed') / 100).toFixed(2);
    } else if (fieldId === 'sp-cond2') {
      result = ((v('sp-ext') - v('sp-cond-rate')) * v('sp-feed') / 100).toFixed(2);
    } else if (fieldId === 'sp-int') {
      const steam = parseFloat(document.getElementById('dep-sp-steam-' + key)?.value) || 0;
      const feed  = v('sp-feed');
      result = feed === 0 ? '—' : (100 * steam / feed).toFixed(2);
    } else if (fieldId === 'sp-temp-heater') {
      result = (v('sp-temp-top') + v('sp-offset')).toFixed(2);
    }
  } catch (e) {}

  if (result !== '') inputEl.value = result;
}

function recalcChain(key) {
  calculateSetpointField('sp-aroma',       key);
  calculateSetpointField('sp-steam',       key);
  calculateSetpointField('sp-cond1',       key);
  calculateSetpointField('sp-cond2',       key);
  calculateSetpointField('sp-int',         key);
  calculateSetpointField('sp-temp-heater', key);
}

function setupSetpointCalculations(key) {
  const proj = (() => {
    const sel = document.getElementById('dep-proj-sel-' + key);
    if (!sel || sel.value === '') return null;
    return gPJ('ongoing')[+sel.value] || null;
  })();

  const sp = { ...(proj?.setPoint || {}), ...(window._spDrafts?.[key] || {}) };
  const CALCULATED = ['sp-aroma', 'sp-steam', 'sp-cond1', 'sp-cond2', 'sp-int', 'sp-temp-heater'];

  CALCULATED.forEach(fieldId => {
    const el = document.getElementById('dep-' + fieldId + '-' + key);
    if (!el) return;
    const saved = sp[fieldId];
    if (saved !== undefined && saved !== '') {
      el.value = saved;
    } else {
      calculateSetpointField(fieldId, key);
    }
  });

  ['sp-ext', 'sp-feed', 'sp-cond-rate', 'sp-temp-top', 'sp-offset'].forEach(triggerId => {
    const el = document.getElementById('dep-' + triggerId + '-' + key);
    if (!el) return;
    // Pastikan value di DOM sudah terisi dari data tersimpan sebelum recalc
    if ((el.value === '' || el.value === undefined) && sp[triggerId] !== undefined && sp[triggerId] !== '') {
      el.value = sp[triggerId];
    }
    el.addEventListener('input', () => recalcChain(key));
  });

  // Recalc chain setelah semua trigger fields terisi
  recalcChain(key);
}

function calculateSPModalField(fieldId, type) {
  const el = document.getElementById(fieldId + '-' + type);
  if (!el) return;
  // CEGAH KALKULASI PADA MODAL JIKA MODE = MANUAL
  if (el.getAttribute('data-mode') === 'manual') return; 
  
  const v = id => parseFloat(document.getElementById(id + '-' + type)?.value) || 0;
  let result = '';

  if (fieldId === 'sp-aroma') {
    result = (v('sp-ext') * v('sp-feed') / 100).toFixed(2);
  } else if (fieldId === 'sp-steam') {
    const aroma = parseFloat(document.getElementById('sp-aroma-' + type)?.value) || 0;
    result = (aroma + 0.0933 * v('sp-temp-top') - 2.3333 + Math.abs(v('sp-offset')) * v('sp-feed') * 0.0018).toFixed(2);
  } else if (fieldId === 'sp-cond1') {
    result = (v('sp-cond-rate') * v('sp-feed') / 100).toFixed(2);
  } else if (fieldId === 'sp-cond2') {
    result = ((v('sp-ext') - v('sp-cond-rate')) * v('sp-feed') / 100).toFixed(2);
  } else if (fieldId === 'sp-int') {
    const steam = parseFloat(document.getElementById('sp-steam-' + type)?.value) || 0;
    const feed  = v('sp-feed');
    result = feed === 0 ? '—' : (100 * steam / feed).toFixed(2);
  } else if (fieldId === 'sp-temp-heater') {
    result = (v('sp-temp-top') + v('sp-offset')).toFixed(2);
  }

  if (result !== '') el.value = result;
}

function recalcSPChain(type) {
  calculateSPModalField('sp-aroma',       type);
  calculateSPModalField('sp-steam',       type);
  calculateSPModalField('sp-cond1',       type);
  calculateSPModalField('sp-cond2',       type);
  calculateSPModalField('sp-int',         type);
  calculateSPModalField('sp-temp-heater', type);
}

function setupSPModalCalculations(type) {
  const CALCULATED_SP = ['sp-aroma', 'sp-steam', 'sp-cond1', 'sp-cond2', 'sp-int', 'sp-temp-heater'];
  CALCULATED_SP.forEach(fieldId => {
    const el = document.getElementById(fieldId + '-' + type);
    if (!el) return;
    
    // Default Inisialisasi ke Auto Mode
    if (el.getAttribute('data-mode') !== 'manual') {
        el.setAttribute('data-mode', 'auto');
        el.readOnly = true;
        el.style.background = '#f3f4f6';
        el.style.color = 'var(--txt3)';
        el.style.cursor = 'not-allowed';
        el.title = 'Auto-calculated';
    }

    const label = el.closest('.de-field')?.querySelector('.de-label');
    if (label && !label.querySelector('.sp-auto-tag')) {
      label.style.display = 'flex'; 
      label.style.alignItems = 'center';
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sp-auto-tag';
      btn.id = `btn-mode-${fieldId}-${type}`;
      btn.onclick = () => toggleSPMode(`${fieldId}-${type}`, fieldId, type);
      
      // Render visualisasi tombol sesuai statenya sekarang
      if (el.getAttribute('data-mode') === 'manual') {
          btn.textContent = 'MANUAL';
          btn.style.cssText = 'margin-left:6px;font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid var(--orange);background:#fff7ed;color:var(--orange);cursor:pointer;font-weight:700;transition:all 0.2s;';
      } else {
          btn.textContent = 'AUTO';
          btn.style.cssText = 'margin-left:6px;font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid var(--blue);background:#ebf2fd;color:var(--blue);cursor:pointer;font-weight:700;transition:all 0.2s;';
      }
      label.appendChild(btn);
    }
  });

  ['sp-ext', 'sp-feed', 'sp-cond-rate', 'sp-temp-top', 'sp-offset'].forEach(triggerId => {
    const el = document.getElementById(triggerId + '-' + type);
    if (!el) return;
    el.addEventListener('input', () => recalcSPChain(type));
  });

  recalcSPChain(type);
}

window.calculateSetpointField = calculateSetpointField;
window.recalcChain = recalcChain;
window.setupSetpointCalculations = setupSetpointCalculations;
window.calculateSPModalField = calculateSPModalField;
window.recalcSPChain = recalcSPChain;
window.setupSPModalCalculations = setupSPModalCalculations; 

function renderSetpointPage(key, proj, page) {
  const wrap = document.getElementById('dep-form-'+key);
  if (!wrap) {
    console.error('Wrap element not found for key:', key);
    return;
  }

  console.log('Rendering setpoint page for:', key, proj);

  const draft = window._spDrafts?.[key] || {};
  // setPoint dari cache (sudah di-map dbToApp), set_point dari raw DB response
  // Draft paling prioritas (perubahan belum disimpan), lalu setPoint, lalu set_point
  const sp = { ...(proj.setPoint || proj.set_point || {}), ...draft };
  const fields = SP_FIELDS; // Gunakan semua field dalam satu page
  const pageTitle = 'Set Point — All Fields';

  try {
    let html = `
      <div class="de-entry-note">
        ⚙️ <strong>Set Point — All Fields</strong> — Nilai set point ditampilkan sebagai placeholder. Klik kolom untuk isi nilai baru.
      </div>
      <div style="margin-bottom:18px;">
        ${buildSetpointPageWithHeaders(key, sp)}
      </div>`;

    // Selalu tampilkan field tambahan di akhir
    html += `
      <div class="de-field" style="margin-bottom:16px;">
        <label class="de-label" style="color:#111;margin-top:10px;display:block;">NOTES</label>
        <textarea class="de-input de-textarea" id="dep-notes-${key}" placeholder="Catatan tambahan...">${sp.notes || ''}</textarea>
        ${buildPhotoUpload(key)}
      </div>`;

    html += buildFormActionsSinglePage(key);
    wrap.innerHTML = html;

    // Setup automatic calculations for set point fields
    setTimeout(() => setupSetpointCalculations(key), 10);

    // Setup CIP button event listener
    const cipButton = wrap.querySelector('#dep-cip-status-'+key);
    if (cipButton) {
      cipButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Extra check: CIP tidak bisa diakses jika sudah done
        if (cipButton.disabled) {
          showQuickToast('❌ CIP sudah selesai dan tidak dapat diubah lagi!');
          return;
        }
        
        console.log('🔘 CIP button clicked via event listener');
        openCIPModal(key);
      });
    }

    updateCIPStatus(key, proj);

    console.log('Setpoint page rendered successfully for:', key);
  } catch (error) {
    console.error('Error rendering setpoint page:', error);
    wrap.innerHTML = '<div style="color:red;">Error rendering form: ' + error.message + '</div>';
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

  // Ambil dari cache — kalau dipanggil setelah loadPJ, data sudah fresh
  const projs = gPJ('ongoing');
  const proj  = projs[+sel.value];
  if(!proj) { wrap.innerHTML = ''; return; }

  // Store current project info in window for CIP modal
  window._currentDEProj = { key, proj, projIndex: +sel.value };

  // Always start on single page
  renderSetpointPage(key, proj, 1);
}

function updateCIPStatus(key, proj) {
  const cipDone = key === 'production' ? proj.cipProdDone : proj.cipLabDone;
  const cipData = key === 'production' ? proj.cipProdData : proj.cipLabData;
  const statusEl = document.getElementById('dep-cip-status-'+key);
  if (!statusEl) return;
  if (cipDone) {
    statusEl.textContent = '✅ CIP Selesai';
    statusEl.style.background = '#15803d';
    statusEl.style.borderColor = '#15803d';
    statusEl.style.color = 'white';
    statusEl.disabled = true;
    statusEl.style.cursor = 'not-allowed';
    statusEl.style.opacity = '0.6';
    statusEl.onclick = null;
  } else if (cipData) {
    statusEl.textContent = '💾 CIP Tersimpan';
    statusEl.style.background = '#1e40af';
    statusEl.style.borderColor = '#1e40af';
    statusEl.style.color = 'white';
    statusEl.disabled = false;
    statusEl.style.cursor = 'pointer';
    statusEl.style.opacity = '1';
  } else {
    statusEl.textContent = '🧼 CIP';
    statusEl.style.background = '';
    statusEl.style.borderColor = '';
    statusEl.style.color = '';
    statusEl.disabled = false;
    statusEl.style.cursor = 'pointer';
    statusEl.style.opacity = '1';
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
// (CIP_CHECKLISTS definition moved to top of file for proper initialization)
// ═══════════════════════════════════════════════════════════

function buildCIPChecklist(key, cipData) {
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;

  // Support format baru (checks dengan key unik) dan lama
  const checks = cipData?.checks || cipData?.cip_prod_checks || cipData?.cip_lab_checks || {};

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
      const checkId  = `cip-check-${sIdx}-${iIdx}`;
      const timeId   = `cip-time-${sIdx}-${iIdx}`;
      // Key unik per section supaya "Rinsing Prod" di section berbeda tidak saling overwrite
      const uniqueKey = `${sIdx}__${item}`;
      const isChecked = checks[uniqueKey] || checks[item] || false;
      const timestamp = cipData?.timestamps?.[uniqueKey] || '';

      checklistHTML += `
        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:6px;">
          <input type="checkbox" id="${checkId}" data-key="${uniqueKey}" ${isChecked ? 'checked' : ''}
                 onchange="handleCIPCheckbox('${checkId}', '${timeId}')"
                 style="width:16px;height:16px;cursor:pointer;">
          <label for="${checkId}" style="font-size:13px;color:var(--txt2);cursor:pointer;user-select:none;">
            ${item}
          </label>
          <span id="${timeId}" style="font-size:10px;color:var(--txt3);font-family:monospace;min-width:120px;text-align:right;">
            ${timestamp || '—'}
          </span>
        </div>
      `;
    });

    checklistHTML += `</div></div>`;
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
window.buildCIPChecklist = buildCIPChecklist;
window.buildCIPFields = buildCIPFields;

function closeCIPModal() {
  const overlay = document.getElementById('cip-modal-overlay');
  if (overlay) overlay.remove();
  const container = document.getElementById('cip-modal-container');
  if (container) container.remove();
  if (window._cipClockTimer) { clearInterval(window._cipClockTimer); window._cipClockTimer = null; }
  window._currentCIPKey = null;
  document.body.style.overflow = '';
}

function openCIPModal(key) {
  console.log('🔍 openCIPModal called with key:', key);
  try {
    let sel = document.getElementById('dep-proj-sel-'+key);
    if (!sel) sel = document.getElementById('lab-proj-sel-'+key);
    
    console.log('🔍 Project selector element:', sel, 'value:', sel?.value);
    
    if (!sel || sel.value === '') {
      showQuickToast('❌ Pilih project dulu!');
      return;
    }

    const allProjs = gPJ('ongoing');
    const proj = allProjs[+sel.value];
    
    if (!proj) { showQuickToast('❌ Project tidak ditemukan!'); return; }

    const cipDone = key === 'production' ? proj.cipProdDone : proj.cipLabDone;
    if (cipDone) {
      showQuickToast('❌ CIP sudah selesai dan tidak dapat diubah lagi!');
      return;
    }

    // Load cipData dari field DB yang benar
    const cipData = key === 'production'
      ? { checks: proj.cip_prod_checks || proj.cipProdChecks || {} }
      : { checks: proj.cip_lab_checks  || proj.cipLabChecks  || {} };
    const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;

    const now = new Date();
    const nowStr = now.toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const savedAtStr = cipData?.savedAt ? new Date(cipData.savedAt).toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : null;

    const modalHTML = `
      <div id="cip-modal-overlay" onclick="closeCIPModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;"></div>
      <div id="cip-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:0;width:min(700px,92vw);max-height:88vh;overflow:hidden;z-index:9999;box-shadow:0 25px 70px rgba(0,0,0,.3);">
        
        <div style="padding:20px 24px;border-bottom:1px solid var(--border);background:#1f2937;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;">
              🧼 ${config.title}
            </div>
            <div style="font-size:12px;color:#9ca3af;margin-top:3px;">${proj.name} — ${key === 'production' ? 'Production' : 'Laboratorium'}</div>
          </div>
          <button onclick="closeCIPModal()" style="width:32px;height:32px;border-radius:8px;border:1px solid #374151;background:#111827;color:#9ca3af;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">✕</button>
        </div>
        
        <div style="padding:24px;max-height:calc(88vh - 180px);overflow-y:auto;">
          
          <div style="background:#fffbeb;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#854d0e;line-height:1.5;">
            ℹ️ <strong>CIP Checklist:</strong> Centang setiap step yang sudah selesai. Timestamp otomatis tercatat.
          </div>

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

          <div id="cip-checklist-container">
            ${buildCIPChecklist(key, cipData)}
          </div>

          <div id="cip-modal-msg" style="margin-top:16px;font-size:12px;text-align:center;"></div>
        </div>
        
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
    document.body.style.overflow = 'hidden'; 
    
    window._cipClockTimer = setInterval(() => {
      const el = document.getElementById('cip-realtime-clock');
      if (!el) { clearInterval(window._cipClockTimer); return; }
      el.textContent = new Date().toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }, 1000);

    window._currentCIPKey = key;
  } catch (error) {
    console.error('❌ Error in openCIPModal:', error);
    showQuickToast('❌ Error membuka CIP Modal: ' + error.message);
  }
}

async function saveCIPModal(key, isFinish) {
  const aksi = isFinish ? "MENYELESAIKAN" : "MENYIMPAN DRAF";
  if (!confirm(`Apakah Anda yakin ingin ${aksi} data CIP ${key === 'production' ? 'Produksi' : 'Laboratorium'} ini?`)) return;

  const config  = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  const checks  = {};
  let   allDone = true;

  // Kumpulkan semua checkbox berdasarkan data-item attribute
  // supaya tidak bergantung pada format ID yang berubah-ubah
  config.sections.forEach((sec, sIdx) => {
    sec.items.forEach((item, iIdx) => {
      const checkId   = `cip-check-${sIdx}-${iIdx}`;
      const uniqueKey = `${sIdx}__${item}`;
      const el  = document.getElementById(checkId);
      const val = el ? el.checked : false;
      checks[uniqueKey] = val;
      if (!val) allDone = false;
    });
  });

  // Cari project yang sedang aktif
  let sel = document.getElementById('dep-proj-sel-'+key) || document.getElementById('cip-proj-sel-'+key);
  if (!sel) sel = document.getElementById('lab-proj-sel-'+key);
  const proj = sel && sel.value !== '' ? gPJ('ongoing')[+sel.value] : null;

  if (proj && proj._id) {
    try {
      const isProd = key === 'production';
      const body   = isProd
        ? { cip_prod_done: isFinish || allDone, cip_prod_checks: checks }
        : { cip_lab_done:  isFinish || allDone, cip_lab_checks:  checks };
      const res  = await fetch('/api/projects/'+proj._id+'/cip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await loadPJ('ongoing');
    } catch(e) {
      console.error('saveCIPModal API error:', e);
      showQuickToast('❌ Gagal simpan CIP: ' + e.message);
      return;
    }
  } else if (proj) {
    // Fallback localStorage
    const allProjs = gPJ('ongoing');
    const realIdx  = +sel.value;
    if (key === 'production') {
      allProjs[realIdx].cipProdDone   = isFinish || allDone;
      allProjs[realIdx].cipProdChecks = checks;
      allProjs[realIdx].cip_prod_checks = checks;
    } else {
      allProjs[realIdx].cipLabDone   = isFinish || allDone;
      allProjs[realIdx].cipLabChecks = checks;
      allProjs[realIdx].cip_lab_checks = checks;
    }
    sPJ('ongoing', allProjs);
  }

  closeCIPModal(key);
  showQuickToast((isFinish || allDone) ? '✅ CIP selesai!' : '💾 CIP progress tersimpan.');
}

window.openCIPModal = openCIPModal;
window.closeCIPModal = closeCIPModal;
window.saveCIPModal = saveCIPModal;

// ── LEGACY: Keep old saveCIPFromDE for backwards compatibility ──
function saveCIPFromDE(key) {
  // --- TAMBAHKAN BARIS INI ---
  if (!confirm('Apakah Anda yakin ingin menyimpan data CIP ini?')) return;
  // ---------------------------

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

async function submitDEP(key){
  if (!confirm('Apakah Anda yakin ingin menyimpan data Set Point Produksi ini?')) return;

  const sel = document.getElementById('dep-proj-sel-'+key);
  const b   = document.getElementById('dep-sb-'+key);
  const m   = document.getElementById('dep-sm-'+key);
  const showStatus = (type, msg) => {
    if(b&&m){ b.style.display='flex'; b.className='de-status-bar de-status-'+type; m.textContent=msg; }
  };

  if(!sel || sel.value === '') { showStatus('error','❌ Pilih project dulu!'); return; }

  const projs   = gPJ('ongoing');
  const projIdx = +sel.value;
  const proj    = projs[projIdx];
  if(!proj) return;

  // Kumpulkan semua SP field dari DOM
  const draft   = window._spDrafts?.[key] || {};
  const spData  = {};
  let anyFilled = false;

  SP_FIELDS.forEach(f => {
    const el    = document.getElementById('dep-'+f.id+'-'+key);
    const domVal = el ? el.value.trim() : '';
    // Kalau DOM kosong, coba ambil dari draft atau setPoint yang sudah ada
    const value = domVal !== '' ? domVal : (draft[f.id] || proj.setPoint?.[f.id] || '');
    if (f.calculated) { if (value) spData[f.id] = value; return; }
    // Hanya set jika ada nilai — jangan overwrite field lama dengan string kosong
    if (value !== '') {
      anyFilled = true;
      spData[f.id] = value;
    }
    // Jika kosong, biarkan mergedSP mengambil dari proj.setPoint (tidak di-set di sini)
  });

  const notesValue = document.getElementById('dep-notes-'+key)?.value.trim() || draft.notes || '';
  if (notesValue) spData.notes = notesValue;

  if (!anyFilled && !notesValue) {
    showStatus('error','❌ Isi minimal satu field atau tambahkan notes sebelum menyimpan!');
    return;
  }

  // Gabungkan dengan setPoint yang sudah ada — agar field lama tidak hilang
  const mergedSP = { ...(proj.setPoint || {}), ...spData };

  showStatus('loading','⏳ Menyimpan ke database...');

  // Kirim ke API
  try {
    const payload = {
      project_name:    proj.name,
      notes:           notesValue,
      foto_urls:       window._photoData?.[key] || [],
      cip_prod_done:   proj.cip_prod_done   || false,
      cip_prod_checks: proj.cip_prod_checks || {},
      cip_lab_done:    proj.cip_lab_done    || false,
      cip_lab_checks:  proj.cip_lab_checks  || {},
      fp_entries:      proj.fp_entries      || [],
      ...mergedSP, // semua field set point
    };

    const res  = await fetch('/api/dataentry/production', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal simpan');

    // Simpan juga ke API project set_point agar renderPJ tahu SP sudah diisi
    if (proj._id) {
      await fetch('/api/projects/'+proj._id+'/setpoint', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(mergedSP),
      }).catch(e => console.warn('setpoint API warn:', e));
    }

    // Update cache lokal dengan data merged agar tidak perlu reload penuh
    const allProjs = gPJ('ongoing');
    const realIdx  = allProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
    if (realIdx >= 0) {
      // Record history
      const oldSP = allProjs[realIdx].setPoint || {};
      const histFields = SP_FIELDS
        .map(f => ({ id:f.id, label:f.label, unit:f.unit||'', oldVal:oldSP[f.id]||'', newVal:mergedSP[f.id]||'' }))
        .filter(f => f.newVal !== '' || f.oldVal !== '');
      if (!allProjs[realIdx].productionHistory) allProjs[realIdx].productionHistory = [];
      allProjs[realIdx].productionHistory.push({ saved_at: new Date().toISOString(), source: key, fields: histFields, db_id: json.id });

      allProjs[realIdx].setPoint = mergedSP;
      sPJ('ongoing', allProjs);
    }

    if (window._spDrafts) delete window._spDrafts[key];
    showStatus('success','✅ Set Point tersimpan ke database!');

    // Reload data segar dari API lalu render ulang form
    setTimeout(async () => {
      if(b) b.style.display = 'none';
      await loadPJ('ongoing');
      loadDEProjForm(key);
    }, 1200);

  } catch(err) {
    console.error('submitDEP error:', err);
    showStatus('error','❌ Gagal simpan: ' + err.message);
  }
}

// Utility/Limbah simple DE helpers
function resetDE(key){
  ['vol','cod','bod','tss','ph','temp','notes',
   'steam','fgtemp','fwtemp','airp','sout','cond','sbd'].forEach(f=>{
    const el=document.getElementById(key+'-'+f); if(el) el.value='';
  });
  const d=document.getElementById(key+'-date'); if(d) d.value=new Date().toISOString().split('T')[0];
}
function submitLimbah(key) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Limbah ini?')) return;
  const projSel = document.getElementById('limbah-proj-sel');
  const selectedIdx = projSel ? projSel.value : "";
  
  // Ambil Data Form
  const basicData = {
    date: document.getElementById(key+'-date').value,
    vol: document.getElementById(key+'-vol').value,
    cod: document.getElementById(key+'-cod').value,
    bod: document.getElementById(key+'-bod').value,
    tss: document.getElementById(key+'-tss').value,
    ph: document.getElementById(key+'-ph').value,
    notes: document.getElementById(key+'-notes').value,
    jar: window._tmpJar || null
  };

  if (selectedIdx !== "") {
    // ── JALUR A: SIMPAN KE SUMMARY PROJECT ──
    const projs = gPJ('ongoing');
    const p = projs[+selectedIdx];
    if (!p.limbahHistory) p.limbahHistory = [];
    
    // Susun fields untuk tabel summary bergaya Excel
    const fields = [
      { label: 'Tanggal', newVal: basicData.date },
      { label: 'Volume (L)', newVal: basicData.vol },
      { label: 'COD (mg/L)', newVal: basicData.cod },
      { label: 'BOD (mg/L)', newVal: basicData.bod },
      { label: 'TSS (mg/L)', newVal: basicData.tss },
      { label: 'pH', newVal: basicData.ph },
      { label: 'Catatan', newVal: basicData.notes }
    ];
    // Tambah info jar test jika ada
    if (basicData.jar) {
      fields.push({ label: 'Jar Test Alum (PPM)', newVal: basicData.jar.alum });
      fields.push({ label: 'Jar Test Total (PPM)', newVal: basicData.jar.total });
    }

    p.limbahHistory.push({
      saved_at: new Date().toISOString(),
      fields: fields
    });
    
    sPJ('ongoing', projs);
    showQuickToast('✅ Data tersimpan di Summary Project: ' + p.name);
  } else {
    // ── JALUR B: SIMPAN KE LAPORAN HARIAN ──
    const harian = JSON.parse(localStorage.getItem('harian_entries') || '[]');
    
    // Build data object with all limbah fields
    const reportData = {
      'Tanggal': basicData.date || '—',
      'Volume (L)': basicData.vol || '—',
      'COD (mg/L)': basicData.cod || '—',
      'BOD (mg/L)': basicData.bod || '—',
      'TSS (mg/L)': basicData.tss || '—',
      'pH': basicData.ph || '—',
      'Catatan': basicData.notes || '—'
    };
    
    // Add jar test data if present
    if (basicData.jar) {
      reportData['Jar Test - Alum (PPM)'] = basicData.jar.alum || '—';
      reportData['Jar Test - Total (PPM)'] = basicData.jar.total || '—';
    }
    
    harian.unshift({
      id: Date.now(),
      cat: 'limbah',
      projName: 'Limbah Harian (Umum)',
      data: reportData,
      saved_at: new Date().toISOString()
    });
    localStorage.setItem('harian_entries', JSON.stringify(harian));
    showQuickToast('✅ Data tersimpan di Laporan Harian.');
  }

  // Reset & Bersihkan
  resetDE(key);
  window._tmpJar = null;
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
  const deletedCats = JSON.parse(localStorage.getItem('deleted_default_categories') || '[]');
  const customCats = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  const DEFAULT_CATEGORIES = [
    { value: 'teh-hijau', label: '🍵 Teh Hijau' },
    { value: 'oolong', label: '🍵 Oolong' },
    { value: 'black-tea', label: '☕ Black Tea' },
    { value: 'roasted-jasmine', label: '🌸 Roasted Green Tea Jasmine' },
    { value: 'robusta', label: '☕ Kopi Robusta' },
    { value: 'arabika', label: '☕ Kopi Arabika' }
  ];
  let catOptions = '<option value="">-- Pilih kategori --</option>';
  DEFAULT_CATEGORIES.forEach(c => {
    if (!deletedCats.includes(c.value)) catOptions += `<option value="${c.value}">${c.label}</option>`;
  });
  customCats.forEach(c => {
    catOptions += `<option value="${c.value}">📌 ${c.label}</option>`;
  });

  return `<div class="proj-wrap">
  <div class="proj-header">
    <div><div class="proj-title">${title}</div><div class="proj-sub">Manage and track your projects</div></div>
    <span class="proj-count-badge" id="pc-${type}">0 projects</span>
  </div>
  <input class="proj-search" id="ps-${type}" placeholder="🔍  Search projects..." oninput="renderPJ('${type}')">
  <div class="proj-list" id="pl-${type}"></div>
</div>
${isOngoing && ['admin','superadmin'].includes(localStorage.getItem('role')||'') ? '<button class="proj-fab" onclick="openAPJ(\'ongoing\')">＋</button>' : ''}

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
              ${catOptions}
            </select>
            <button type="button" id="pf-cat-del-${type}" style="display:none;background:none;border:none;color:var(--red);font-size:20px;font-weight:bold;cursor:pointer;padding:0 5px;" onclick="deleteSelectedCategory('${type}','pf')" title="Hapus Kategori Ini">✕</button>
            <button type="button" class="de-btn de-btn-ghost" style="padding:6px 10px;font-size:11px;white-space:nowrap" onclick="addCustomCategory('${type}','pf')">＋ Tambah</button>
          </div>
          <div id="pf-cat-custom-${type}" style="display:none;margin-top:6px">
            <div style="display:flex; gap:6px; align-items:center;">
              <input class="de-input" id="pf-cat-new-${type}" type="text" placeholder="Nama kategori baru..." style="flex:1;">
              <button type="button" class="de-btn de-btn-primary" style="padding:7px 14px;font-size:11px" onclick="saveCustomCategory('${type}','pf')">Simpan</button>
              <button type="button" onclick="document.getElementById('pf-cat-custom-${type}').style.display='none'" style="background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Batal Tambah">✕</button>
            </div>
          </div>
        </div>

        <div class="de-field proj-modal-full">
          <label class="de-label">PREPARATION METHOD</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg)" id="pf-tl-${type}">
            ${['Ekstraksi','Decanter (Separator Kasar)','Centrifuge (Separator Halus)','Filtrasi','Evaporasi', 'Full Condensation', 'Separate Condensation'].map(m=>`
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

<div class="proj-modal-overlay" id="edit-overlay-${type}">
  <div class="proj-modal">
    <div class="proj-modal-head"><div class="proj-modal-title">✏️ Edit Project</div><button class="proj-modal-close" onclick="closeEditPJ('${type}')">✕</button></div>
    <div class="proj-modal-body">
      <div class="proj-modal-grid">
        <div class="de-field proj-modal-full"><label class="de-label">PROJECT TITLE *</label><input class="de-input" id="ef-nm-${type}" type="text"></div>
        
        <div class="de-field"><label class="de-label">START DATE</label><input class="de-input" id="ef-st-${type}" type="date"></div>
        <div class="de-field"><label class="de-label">EXPECTED END</label><input class="de-input" id="ef-en-${type}" type="date"></div>

        <div class="de-field proj-modal-full">
          <label class="de-label">KATEGORI PRODUK</label>
          <div style="display:flex;gap:6px;align-items:center">
            <select class="de-input de-select" id="ef-cat-${type}" style="flex:1">
              ${catOptions}
            </select>
            <button type="button" class="de-btn de-btn-ghost" style="padding:6px 10px;font-size:11px;white-space:nowrap" onclick="addCustomCategory('${type}','ef')">＋ Tambah</button>
          </div>
          <div id="ef-cat-custom-${type}" style="display:none;margin-top:6px">
            <div style="display:flex; gap:6px; align-items:center;">
              <input class="de-input" id="ef-cat-new-${type}" type="text" placeholder="Nama kategori baru..." style="flex:1;">
              <button type="button" class="de-btn de-btn-primary" style="padding:7px 14px;font-size:11px" onclick="saveCustomCategory('${type}','ef')">Simpan</button>
              <button type="button" onclick="document.getElementById('ef-cat-custom-${type}').style.display='none'" style="background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Batal Tambah">✕</button>
            </div>
          </div>
        </div>

        <div class="de-field proj-modal-full"><label class="de-label">MATERIALS USED</label><textarea class="de-input de-textarea" id="ef-mat-${type}" style="min-height:70px"></textarea></div>
        <div class="de-field proj-modal-full">
          <label class="de-label">PREPARATION METHOD</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg)" id="ef-tl-${type}">
            ${['Ekstraksi','Decanter (Separator Kasar)','Centrifuge (Separator Halus)','Filtrasi','Evaporasi', 'Full Condensation', 'Separate Condensation'].map(m=>`
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
      <div style="display:flex;flex-direction:column;gap:4px">
        <div class="proj-modal-title">⚙️ Set Point — <span id="sp-proj-nm-${type}">Project</span></div>
        <div style="display:flex;gap:6px;align-items:center">
          <span id="sp-page-dot1-${type}" style="width:8px;height:8px;border-radius:50%;background:var(--blue);display:inline-block;transition:all .2s"></span>
          <span id="sp-page-dot2-${type}" style="width:8px;height:8px;border-radius:50%;background:#d1d5db;display:inline-block;transition:all .2s"></span>
          <span id="sp-page-lbl-${type}" style="font-size:10px;color:var(--txt3);font-weight:600">Page 1 / 2</span>
        </div>
      </div>
      <button class="proj-modal-close" onclick="closeSP('${type}')">✕</button>
    </div>

      <!-- ── Receipt Selector ── -->
      <div style="padding:12px 14px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;margin-bottom:14px;display:flex;gap:10px;align-items:center;">
        <div style="font-size:13px;font-weight:700;color:#7c3aed;white-space:nowrap;">📋 Pakai Receipt:</div>
        <select class="de-input de-select" id="sp-receipt-sel-${type}" style="flex:1;border-color:#e9d5ff;background:#faf5ff;" onchange="applyReceiptToSP('${type}')">
          <option value="">— Isi manual —</option>
        </select>
      </div>
      <div id="sp-receipt-banner-${type}" style="display:none;padding:10px 14px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;font-size:12px;color:#6d28d9;margin-bottom:12px;align-items:center;justify-content:space-between;gap:8px;"></div>
    <div class="proj-modal-body">

      <!-- ═══ PAGE 1 ═══ -->
      <div id="sp-page1-${type}">
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
            <div class="de-field"><label class="de-label">Top of Column</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-top-${type}" type="number" step="0.1" oninput="checkTopColumnVacuum('${type}',this.value)"><span class="de-input-unit">°C</span></div><div id="sp-top-vacuum-note-${type}" style="display:none;margin-top:6px;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;"></div></div>
            <div class="de-field"><label class="de-label">Condensate #1</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-Condensate1-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
            <div class="de-field"><label class="de-label">Condensate #2</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-Condensate2-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
            <div class="de-field"><label class="de-label">Bottom of Column</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-temp-bot-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
            <div class="de-field"><label class="de-label">Product Outlet</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-prod-out-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          </div>
        </div>
        <div class="setpoint-section">
          <div class="setpoint-section-title">Coolants</div>
          <div class="setpoint-grid">
            <div class="de-field"><label class="de-label">Chilled Water</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-chilled-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
            <div class="de-field"><label class="de-label">Condenser Water</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-condenser-water-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          </div>
        </div>
        <div class="setpoint-section">
          <div class="setpoint-section-title">Pressure</div>
          <div class="setpoint-grid">
            <div class="de-field"><label class="de-label">System Vacuum</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-system-vacuum-${type}" type="number" step="0.1"><span class="de-input-unit">mBar</span></div></div>
            <div class="de-field"><label class="de-label">Steam Flow</label><div class="de-input-wrap"><input class="de-input sp-field-${type}" id="sp-steam-flow-${type}" type="number" step="0.1"><span class="de-input-unit">°C</span></div></div>
          </div>
        </div>
        <div class="de-actions" style="margin-top:20px;justify-content:space-between">
          <button class="de-btn de-btn-ghost" onclick="closeSP('${type}')">Cancel</button>
          <button class="de-btn de-btn-primary" onclick="spGoPage2('${type}')">Next →</button>
        </div>
      </div>

      <!-- ═══ PAGE 2 ═══ -->
      <div id="sp-page2-${type}" style="display:none">
        <div style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:11px;color:#15803d;margin-bottom:16px;">
          📋 <strong>Halaman 2:</strong> Isi 8 field tambahan untuk melengkapi Set Point produksi ini.
        </div>
        <div class="setpoint-section">
          <div class="setpoint-section-title">📝 Parameter CT</div>
          <div class="setpoint-grid">
            <div class="de-field"><label class="de-label">Product Flowrate</label><input class="de-input sp-field-${type}" id="sp-add1-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">Product Flow Control Valve Position</label><input class="de-input sp-field-${type}" id="sp-add2-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">CT Steam Pressure</label><input class="de-input sp-field-${type}" id="sp-add3-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">Concentrate Recirculation Flow</label><input class="de-input sp-field-${type}" id="sp-add4-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">Product Cooler Temperature</label><input class="de-input sp-field-${type}" id="sp-add5-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">CT Discharge Level</label><input class="de-input sp-field-${type}" id="sp-add6-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">Brix Input</label><input class="de-input sp-field-${type}" id="sp-add7-${type}" type="text" placeholder="—"></div>
            <div class="de-field"><label class="de-label">Brix Output</label><input class="de-input sp-field-${type}" id="sp-add8-${type}" type="text" placeholder="—"></div>
          </div>
        </div>
        <div class="de-status-bar" id="sp-sb-${type}" style="display:none"><span id="sp-sm-${type}"></span></div>
        <div class="de-actions" style="margin-top:20px;justify-content:space-between">
          <div style="display:flex;gap:8px;">
            <button class="de-btn de-btn-ghost" onclick="spGoPage1('${type}')">← Back</button>
            <button class="de-btn" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;" onclick="saveCurrentSPAsReceipt('${type}')" title="Simpan nilai set point ini sebagai template receipt">📋 Simpan sebagai Receipt</button>
          </div>
          <button class="de-btn de-btn-primary" onclick="saveSP('${type}')">💾 Save Set Point</button>
        </div>
      </div>

    </div>
  </div>
</div>

<div class="proj-modal-overlay" id="fp-overlay-${type}">
  <div class="proj-modal fp-modal" style="max-width:760px!important">
    <div class="proj-modal-head">
      <div class="proj-modal-title">🏭 Finish Production — <span id="fp-proj-nm-${type}">Project</span></div>
      <button class="proj-modal-close" onclick="closeFP('${type}')">✕</button>
    </div>
    
    <div class="proj-modal-body">
      <div id="fp-page1-${type}">
        
        <div style="font-size:15px;font-weight:700;color:var(--txt);margin:16px 0 12px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">🌿</span> Data Aroma
        </div>

        <div id="fp-items-${type}"></div>
        <button class="de-btn de-btn-ghost" style="width:100%;margin-bottom:14px;font-size:12px" onclick="addFPItem('${type}')">＋ Tambah Baris</button>
        
        <div class="de-actions" style="justify-content:space-between">
          <div>
            <button class="de-btn de-btn-ghost" onclick="closeFP('${type}')">Cancel</button>
            <button class="de-btn de-btn-ghost" onclick="resetFPForm('${type}')" style="color:var(--red);border-color:var(--red);opacity:0.7;">🔄 Reset</button>
          </div>
          <button class="de-btn de-btn-primary" onclick="fpGoPage2('${type}')">Next →</button>
        </div>
      </div>

      <div id="fp-page2-${type}" style="display:none">
        
        <div style="font-size:15px;font-weight:700;color:var(--txt);margin:16px 0 12px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">📦</span> Data Produk
        </div>

        <div id="fp-items2-${type}"></div>
        <button class="de-btn de-btn-ghost" style="width:100%;margin-bottom:14px;font-size:12px" onclick="addFPItem2('${type}')">＋ Tambah Baris</button>
        <div class="de-status-bar" id="fp-sb-${type}" style="display:none"><span id="fp-sm-${type}"></span></div>

        <div class="de-actions" style="margin-top:20px;justify-content:space-between">
          <div>
            <button class="de-btn de-btn-ghost" onclick="fpGoPage1('${type}')">← Back</button>
            <button class="de-btn de-btn-ghost" onclick="resetFPForm('${type}')" style="color:var(--red);border-color:var(--red);opacity:0.7;">🔄 Reset</button>
          </div>
          <button class="de-btn de-btn-primary" onclick="saveFP('${type}')">💾 Save</button>
        </div>
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
async function initProjectPage(t) {
  const d = document.getElementById('pf-st-'+t);
  if (d) d.value = new Date().toISOString().split('T')[0];
  const list = document.getElementById('pl-'+t);
  if (list) list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt3)">⏳ Loading projects...</div>';
  await loadPJ(t);
  renderPJ(t);
}

// Ambil dari cache (sync), load dari API (async)
function gPJ(t) {
  return _pjCache[t] || [];
}

// Simpan ke cache lokal
function sPJ(t, l) {
  _pjCache[t] = l;
}

// Load projects dari API dan update cache
async function loadPJ(type) {
  try {
    const res  = await fetch('/api/projects?type=' + type);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    _pjCache[type] = json.data.map(dbToApp);
    return _pjCache[type];
  } catch (err) {
    console.error('loadPJ error:', err);
    _pjCache[type] = JSON.parse(localStorage.getItem('pj_'+type) || '[]');
    return _pjCache[type];
  }
}

// Konversi format database ke format yang dipakai app
function dbToApp(p) {
  return {
    _id:            p.id,
    name:           p.name,
    type:           p.type,
    kategori:       p.kategori   || '',
    batch:          p.batch      || '',
    start:          p.start_date || '',
    end:            p.end_date   || '',
    materials:      p.materials  || '',
    tools:          p.tools      || '',
    notes:          p.notes      || '',
    progress:       p.progress   || 0,
    locked:         p.locked     || false,
    setPoint:       p.set_point  || null,
    cip_prod_done:  p.cip_prod_done   || false,
    cip_prod_checks:p.cip_prod_checks || {},
    cip_lab_done:   p.cip_lab_done    || false,
    cip_lab_checks: p.cip_lab_checks  || {},
    fp_done:        p.fp_done         || false,
    fp_entries:     p.fp_entries      || [],
    allowed_roles:  p.allowed_roles   || null,
    cipProdDone:    p.cip_prod_done   || false,
    cipLabDone:     p.cip_lab_done    || false,
    fpDone:         p.fp_done         || false,
    updates:        [],
    created_at:     p.created_at,
    updated_at:     p.updated_at,
  };
}

// ── Render list ───────────────────────────────────────────
function renderPJ(type) {
  const list=document.getElementById('pl-'+type), cnt=document.getElementById('pc-'+type);
  const q=(document.getElementById('ps-'+type)?.value||'').toLowerCase();
  if(!list) return;

  const currentRole = localStorage.getItem('role') || 'utility';
  const isAdmin = ['admin','superadmin'].includes(currentRole);

  let ps = gPJ(type);

  // Filter berdasarkan role: admin lihat semua, role lain hanya lihat
  // project yang allowed_roles-nya null (semua) atau mengandung role mereka
  if (!isAdmin) {
    ps = ps.filter(p => {
      if (!p.allowed_roles || p.allowed_roles.length === 0) return true; // null = semua boleh
      return p.allowed_roles.includes(currentRole);
    });
  }

  if (q) ps = ps.filter(p=>p.name.toLowerCase().includes(q));
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

    // admin/superadmin = bisa edit penuh
    // PPIC = lihat saja (view-only) untuk project card actions
    const canEdit = ['admin','superadmin'].includes(currentRole);
    const canReceipt = ['admin','superadmin','PPIC'].includes(currentRole);

    const actionBtns = isOngoing && canEdit ? `
      <div class="proj-card-divider"></div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        <button class="pj-btn pj-btn-edit" onclick="openEditPJ('${type}',${i})">✏️ Edit</button>
        <button class="pj-btn pj-btn-edit" onclick="${hasSetPoint?'':('openSP(\''+type+'\','+i+')')}"
          ${hasSetPoint ? 'disabled style="opacity:.45;cursor:not-allowed;background:#f3f4f6;border-color:#d1d5db;color:#9ca3af;"' : ''}
          title="${hasSetPoint?'Set Point sudah dikunci':'Isi Set Point'}">
          ${hasSetPoint ? '🔒 Set Point' : '⚙️ Set Point'}
        </button>
        <button class="pj-btn pj-btn-finish" onclick="openFP('${type}',${i})" title="Finish Production">
          ${p.fpDone ? '✓ Finish Prod' : '🏭 Finish Prod'}
        </button>
        ${cipStatus ? `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:var(--green-bg);color:var(--green);border:1px solid #6ee7b7;font-weight:600">${cipStatus}</span>` : `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db">⏳ CIP Belum</span>`}
        <button class="pj-btn pj-btn-end" onclick="endProd('${type}',${i})"
          ${!(hasCIP && hasFP) ? 'disabled' : ''}
          title="${!(hasCIP && hasFP)?'Lengkapi CIP (Prod+Lab) dan Finish Production dulu':'Akhiri produksi'}">
          🏁 End
        </button>
      </div>` : isOngoing ? `
      <div class="proj-card-divider"></div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        ${cipStatus ? `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:var(--green-bg);color:var(--green);border:1px solid #6ee7b7;font-weight:600">${cipStatus}</span>` : `<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db">⏳ CIP Belum</span>`}
        <span style="font-size:10px;padding:3px 8px;border-radius:100px;background:#f0f9ff;color:#0284c7;border:1px solid #bae6fd;font-weight:600">👁️ View Only</span>
      </div>` : '';
    const viewBtn = isCompleted ? `
      <div class="proj-card-divider"></div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        <button class="pj-btn pj-btn-update" onclick="openSumm('${type}',${i})">📊 Summary</button>
      </div>` : '';
    return `
      <div class="proj-card" style="--acc:${col[type]||'var(--blue)'}; flex-wrap:wrap; gap:0;" ${!isOngoing&&!isCompleted?'onclick="openPD(\''+type+'\','+i+')\""':''}">
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

function openAPJ(type) {
  // Tampilkan picker modal dulu (bukan langsung form)
  document.getElementById('apj-picker-overlay')?.remove();

  const receipts = getReceipts();
  const hasReceipts = receipts.length > 0;

  const picker = document.createElement('div');
  picker.id = 'apj-picker-overlay';
  picker.className = 'proj-modal-overlay show';
  picker.innerHTML = `
    <div class="proj-modal" style="max-width:400px;width:95vw;">
      <div class="proj-modal-head">
        <div class="proj-modal-title">➕ Buat Project Baru</div>
        <button class="proj-modal-close" onclick="document.getElementById('apj-picker-overlay').remove()">✕</button>
      </div>
      <div class="proj-modal-body" style="padding:20px;">
        <p style="font-size:13px;color:var(--txt2);margin-bottom:20px;">Pilih cara membuat project baru:</p>

        <!-- Create New -->
        <div onclick="closePicker_openForm('${type}', false)"
          style="display:flex;align-items:center;gap:14px;padding:16px 18px;border:2px solid var(--border);border-radius:12px;cursor:pointer;margin-bottom:12px;transition:.15s;background:var(--surface);"
          onmouseover="this.style.borderColor='var(--blue)';this.style.background='#ebf2fd'"
          onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
          <div style="width:44px;height:44px;border-radius:10px;background:#ebf2fd;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📋</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--txt);">Create New</div>
            <div style="font-size:12px;color:var(--txt3);margin-top:2px;">Isi semua data dari awal</div>
          </div>
        </div>

        <!-- Use Receipt -->
        <div onclick="${hasReceipts ? `closePicker_openForm('${type}', true)` : ''}"
          style="display:flex;align-items:center;gap:14px;padding:16px 18px;border:2px solid var(--border);border-radius:12px;cursor:${hasReceipts ? 'pointer' : 'not-allowed'};transition:.15s;background:var(--surface);opacity:${hasReceipts ? '1' : '0.5'};"
          ${hasReceipts ? `onmouseover="this.style.borderColor='#7c3aed';this.style.background='#f5f3ff'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'"` : ''}>
          <div style="width:44px;height:44px;border-radius:10px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">⚡</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--txt);">Use Receipt</div>
            <div style="font-size:12px;color:var(--txt3);margin-top:2px;">${hasReceipts ? `Gunakan template (${receipts.length} receipt tersedia)` : 'Belum ada receipt — buat dulu di tab Receipt'}</div>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(picker);
}
window.openAPJ = openAPJ;

function closePicker_openForm(type, useReceipt) {
  document.getElementById('apj-picker-overlay')?.remove();

  if (useReceipt) {
    // Tampilkan receipt selector modal
    openAPJFromReceipt(type);
  } else {
    // Buka form biasa
    _openNewProjectForm(type, null);
  }
}
window.closePicker_openForm = closePicker_openForm;

// Form Create New (atau form dengan prefill receipt)
function _openNewProjectForm(type, receipt) {
  const o = document.getElementById('pmo-'+type);
  if (!o) return;

  // Reset semua field
  document.getElementById('pf-nm-'+type).value = '';
  // Tanggal: set hari ini, tidak bisa diketik manual (hanya klik)
  const stEl = document.getElementById('pf-st-'+type);
  const enEl = document.getElementById('pf-en-'+type);
  if (stEl) { stEl.value = new Date().toISOString().split('T')[0]; stEl.setAttribute('readonly', true); stEl.onclick = () => stEl.removeAttribute('readonly'); stEl.onblur = () => stEl.setAttribute('readonly', true); }
  if (enEl) { enEl.value = ''; enEl.setAttribute('readonly', true); enEl.onclick = () => enEl.removeAttribute('readonly'); enEl.onblur = () => enEl.setAttribute('readonly', true); }

  document.getElementById('pf-mat-'+type).value = '';
  document.getElementById('pf-nt-'+type).value  = '';
  document.querySelectorAll('#pf-tl-'+type+' input[type=checkbox]').forEach(cb => cb.checked = false);

  const pfCatSel = document.getElementById('pf-cat-'+type);
  if (pfCatSel) { loadCategoriesIntoSelect(pfCatSel); pfCatSel.value = ''; onProjCatChange(type, 'pf'); }

  // Jika dari receipt → prefill semua field kecuali nama & tanggal
  if (receipt) {
    const pjInfo = receipt.proj_info || {};
    if (pjInfo.kategori && pfCatSel) { pfCatSel.value = pjInfo.kategori; onProjCatChange(type, 'pf'); }
    if (pjInfo.materials) document.getElementById('pf-mat-'+type).value = pjInfo.materials;
    if (pjInfo.notes)     document.getElementById('pf-nt-'+type).value  = pjInfo.notes;
    if (pjInfo.tools) {
      const toolArr = pjInfo.tools.split(', ').filter(Boolean);
      document.querySelectorAll('#pf-tl-'+type+' input[type=checkbox]').forEach(cb => {
        cb.checked = toolArr.includes(cb.value);
      });
    }
    // Tampilkan banner receipt
    const head = document.querySelector('#pmo-'+type+' .proj-modal-head .proj-modal-title');
    if (head) head.textContent = `⚡ Dari Receipt: ${receipt.name}`;
    // Simpan receipt ke state sementara untuk nanti dipakai submitPJ
    window._activeReceiptForPJ = { type, receipt };
  } else {
    const head = document.querySelector('#pmo-'+type+' .proj-modal-head .proj-modal-title');
    if (head) head.textContent = '📋 Add New Project';
    window._activeReceiptForPJ = null;
  }

  o.classList.add('show');
}
window._openNewProjectForm = _openNewProjectForm;

// Tampilkan picker receipt sebelum buka form
function openAPJFromReceipt(type) {
  document.getElementById('apj-receipt-picker')?.remove();
  const receipts = getReceipts();

  const overlay = document.createElement('div');
  overlay.id = 'apj-receipt-picker';
  overlay.className = 'proj-modal-overlay show';
  overlay.innerHTML = `
    <div class="proj-modal" style="max-width:520px;width:95vw;max-height:85vh;display:flex;flex-direction:column;">
      <div class="proj-modal-head">
        <div class="proj-modal-title">⚡ Pilih Receipt</div>
        <button class="proj-modal-close" onclick="document.getElementById('apj-receipt-picker').remove()">✕</button>
      </div>
      <div class="proj-modal-body" style="overflow-y:auto;flex:1;">
        <p style="font-size:12px;color:var(--txt3);margin-bottom:14px;">Pilih template receipt. Semua data (kategori, bahan, metode, catatan, set point) akan terisi otomatis — Anda hanya perlu mengisi nama dan tanggal project.</p>
        ${receipts.map((r, ri) => `
          <div onclick="applyReceiptToPJForm('${type}', ${ri})"
            style="display:flex;align-items:center;gap:12px;padding:13px 15px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;margin-bottom:8px;transition:.15s;background:var(--bg);"
            onmouseover="this.style.borderColor='#7c3aed';this.style.background='#f5f3ff'"
            onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg)'">
            <div style="width:36px;height:36px;border-radius:8px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📋</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13px;color:var(--txt);">${r.name}</div>
              <div style="font-size:11px;color:var(--txt3);margin-top:2px;">
                ${r.proj_info?.kategori ? `🏷️ ${r.proj_info.kategori} &nbsp;·&nbsp;` : ''}
                📅 ${new Date(r.created_at).toLocaleDateString('id-ID')}
                &nbsp;·&nbsp; ✅ ${Object.values(r.sp_data || {}).filter(v=>v!=='').length} field SP terisi
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:#7c3aed;">Pilih →</div>
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
window.openAPJFromReceipt = openAPJFromReceipt;

function applyReceiptToPJForm(type, receiptIdx) {
  document.getElementById('apj-receipt-picker')?.remove();
  const receipts = getReceipts();
  const r = receipts[receiptIdx];
  if (!r) return;
  _openNewProjectForm(type, r);
}
window.applyReceiptToPJForm = applyReceiptToPJForm;

function closeAPJ(t) {
  document.getElementById('pmo-'+t)?.classList.remove('show');
  ['pf-nm-','pf-st-','pf-en-','pf-cat-','pf-mat-','pf-nt-'].forEach(f => {
    const el = document.getElementById(f+t); if (el) el.value = '';
  });
  document.querySelectorAll('#pf-tl-'+t+' input[type=checkbox]').forEach(cb => cb.checked = false);
  // Reset title dan active receipt
  const head = document.querySelector('#pmo-'+t+' .proj-modal-head .proj-modal-title');
  if (head) head.textContent = '📋 Add New Project';
  window._activeReceiptForPJ = null;
}

function genBatchNo() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yyyy = String(today.getFullYear());
  const dateStr = dd+mm+yyyy;
  
  // Ambil semua project dari localStorage
  try {
    const ongoing = JSON.parse(localStorage.getItem('pj_ongoing') || '[]');
    const completed = JSON.parse(localStorage.getItem('pj_completed') || '[]');
    const allProjects = [...ongoing, ...completed];
    
    // Hitung project hari ini
    const todayISO = today.toISOString().split('T')[0];
    const todayCount = allProjects.filter(p => {
      if (!p.created_at) return false;
      return p.created_at.substring(0, 10) === todayISO;
    }).length;
    
    const seq = todayCount + 1;
    return String(seq).padStart(3,'0')+'-'+dateStr;
  } catch(e) {
    console.error('genBatchNo error:', e);
    return '001-'+dateStr;
  }
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
// Memunculkan tombol Silang ✕ hanya saat ada kategori yang dipilih
function onProjCatChange(type, prefix) {
  const sel = document.getElementById(prefix + '-cat-' + type);
  const delBtn = document.getElementById(prefix + '-cat-del-' + type);
  if (!sel || !delBtn) return;
  
  if (sel.value !== '') {
    delBtn.style.display = 'block';
  } else {
    delBtn.style.display = 'none';
  }
}
window.onProjCatChange = onProjCatChange;

function addCustomCategory(type, prefix) {
  const wrap = document.getElementById(prefix+'-cat-custom-'+type);
  if (wrap) wrap.style.display = wrap.style.display==='none' ? 'block' : 'none';
}
window.addCustomCategory = addCustomCategory;

// Fungsi Refresh Dropdown saat Edit Project / Ada kategori baru
function loadCategoriesIntoSelect(selEl) {
  if (!selEl) return;
  const deletedCats = JSON.parse(localStorage.getItem('deleted_default_categories') || '[]');
  const customCats = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  const DEFAULT_CATEGORIES = [
    { value: 'teh-hijau', label: '🍵 Teh Hijau' }, { value: 'oolong', label: '🍵 Oolong' },
    { value: 'black-tea', label: '☕ Black Tea' }, { value: 'roasted-jasmine', label: '🌸 Roasted Green Tea Jasmine' },
    { value: 'robusta', label: '☕ Kopi Robusta' }, { value: 'arabika', label: '☕ Kopi Arabika' }
  ];
  
  const currVal = selEl.value; // Simpan nilai yg sedang dipilih
  let html = '<option value="">-- Pilih kategori --</option>';
  
  DEFAULT_CATEGORIES.forEach(c => {
    if (!deletedCats.includes(c.value)) html += `<option value="${c.value}">${c.label}</option>`;
  });
  customCats.forEach(c => {
    html += `<option value="${c.value}">📌 ${c.label}</option>`;
  });
  
  selEl.innerHTML = html;
  selEl.value = currVal;
}
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;

// Simpan Kategori
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
  
  // Sinkronkan semua dropdown kategori
  document.querySelectorAll('.de-select[id$="-cat-'+type+'"]').forEach(el => loadCategoriesIntoSelect(el));
  
  sel.value = value;
  inp.value = '';
  document.getElementById(prefix+'-cat-custom-'+type).style.display = 'none';
  onProjCatChange(type, prefix);
  showQuickToast('✅ Kategori "'+label+'" ditambahkan!');
}
window.saveCustomCategory = saveCustomCategory;

// HAPUS KATEGORI TERPILIH (Berlaku Custom & Bawaan)
function deleteSelectedCategory(type, prefix) {
  const sel = document.getElementById(prefix + '-cat-' + type);
  if (!sel || sel.value === '') return;
  
  const valToDelete = sel.value;
  const optToDelete = sel.options[sel.selectedIndex];
  const labelName = optToDelete.text.replace('📌 ', '');

  if (!confirm(`Hapus kategori "${labelName}" secara permanen dari daftar?`)) return;

  if (valToDelete.startsWith('custom-')) {
    // Hapus dari penyimpanan Custom
    let customs = JSON.parse(localStorage.getItem('custom_categories') || '[]');
    customs = customs.filter(c => c.value !== valToDelete);
    localStorage.setItem('custom_categories', JSON.stringify(customs));
  } else {
    // Sembunyikan dari penyimpanan Bawaan (Default)
    let deletedDefaults = JSON.parse(localStorage.getItem('deleted_default_categories') || '[]');
    if (!deletedDefaults.includes(valToDelete)) {
      deletedDefaults.push(valToDelete);
      localStorage.setItem('deleted_default_categories', JSON.stringify(deletedDefaults));
    }
  }

  // Bersihkan layar
  optToDelete.remove();
  sel.value = '';
  onProjCatChange(type, prefix);
  showQuickToast(`🗑️ Kategori "${labelName}" berhasil dihapus.`);
}
window.deleteSelectedCategory = deleteSelectedCategory;

async function submitPJ(t) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data project ini?')) return;
  const name = document.getElementById('pf-nm-'+t)?.value.trim();
  if (!name) { showPSt(t,'error','❌ Project title is required!'); return; }
  const kategori    = document.getElementById('pf-cat-'+t)?.value || '';
  const batch       = genBatchNo();
  const checkedRoles = [...document.querySelectorAll(`input[name="pf-role-check-${t}"]:checked`)].map(cb => cb.value);
  const allowedRoles = checkedRoles.length > 0 ? checkedRoles : null;

  const payload = {
    type:          t,
    name, kategori, batch,
    start:         document.getElementById('pf-st-'+t)?.value || null,
    end:           document.getElementById('pf-en-'+t)?.value || null,
    materials:     document.getElementById('pf-mat-'+t)?.value.trim() || '',
    tools:         [...document.querySelectorAll('#pf-tl-'+t+' input[type=checkbox]:checked')].map(cb=>cb.value).join(', '),
    notes:         document.getElementById('pf-nt-'+t)?.value.trim() || '',
    allowed_roles: allowedRoles,
  };
  showPSt(t,'loading','⏳ Saving project...');
  try {
    const res  = await fetch('/api/projects', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal simpan');
    await loadPJ(t);

    // Jika dari receipt → auto-save set point juga
    const activeRcpt = window._activeReceiptForPJ;
    if (activeRcpt?.receipt?.sp_data && Object.keys(activeRcpt.receipt.sp_data).length > 0) {
      const newProjs = gPJ(t);
      const newProj  = newProjs.find(p => p.name === name && p.batch === batch);
      if (newProj?._id) {
        try {
          await fetch('/api/projects/'+newProj._id+'/setpoint', {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(activeRcpt.receipt.sp_data)
          });
          await loadPJ(t);
        } catch(e) { console.warn('Auto-save SP from receipt failed:', e); }
      }
    }
    window._activeReceiptForPJ = null;
    showPSt(t,'success','✅ Project saved! Batch: '+batch);
    setTimeout(() => { closeAPJ(t); renderPJ(t); }, 900);
  } catch(e) {
    console.error('Save error:', e);
    showPSt(t,'error','❌ Failed to save: '+e.message);
  }
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
function openEditPJ(type, idx) {
  _editPJIdx = idx;
  const p = gPJ(type)[idx]; if(!p) return;
  document.getElementById('ef-nm-'+type).value  = p.name || '';
  
  const efCatSel = document.getElementById('ef-cat-'+type);
  if (efCatSel) { 
    loadCategoriesIntoSelect(efCatSel); // <--- Memuat ulang agar list terupdate
    efCatSel.value = p.kategori || ''; 
    onProjCatChange(type, 'ef'); 
  }
  
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
async function saveEditPJ(type) {
  const name = document.getElementById('ef-nm-'+type)?.value.trim();
  if(!name){const b=document.getElementById('esb-'+type),m=document.getElementById('esm-'+type);if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Title required!';}return;}
  const ps  = gPJ(type);
  const proj = ps[_editPJIdx];
  if (!proj || !proj._id) { console.error('No project ID'); return; }
  const payload = {
    name,
    kategori:  document.getElementById('ef-cat-'+type)?.value || proj.kategori || '',
    start:     document.getElementById('ef-st-'+type)?.value  || null,
    end:       document.getElementById('ef-en-'+type)?.value  || null,
    materials: document.getElementById('ef-mat-'+type)?.value.trim() || '',
    tools:     [...document.querySelectorAll('#ef-tl-'+type+' input[type=checkbox]:checked')].map(cb=>cb.value).join(', '),
    notes:     document.getElementById('ef-nt-'+type)?.value.trim() || '',
  };
  const b=document.getElementById('esb-'+type),m=document.getElementById('esm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-loading';m.textContent='⏳ Saving...';}
  try {
    const res  = await fetch('/api/projects/'+proj._id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadPJ(type);
    if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Project updated!';}
    setTimeout(()=>{closeEditPJ(type);renderPJ(type);},900);
  } catch(e) {
    console.error('saveEditPJ error:', e);
    if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-error';m.textContent='❌ Failed: '+e.message;}
  }
}

async function deleteFromSetPoint(type) {
  if (_editPJIdx < 0) return;
  const ps   = gPJ(type);
  const proj = ps[_editPJIdx];
  if (!proj) return;
  const name = proj.name || 'Project ini';
  if (!confirm('Hapus "'+name+'"? Tindakan ini tidak bisa dibatalkan.')) return;
  if (!proj._id) {
    // Fallback: hapus dari cache saja
    ps.splice(_editPJIdx, 1);
    sPJ(type, ps);
    closeEditPJ(type);
    renderPJ(type);
    showQuickToast('🗑️ Project dihapus.');
    return;
  }
  try {
    const res  = await fetch('/api/projects/'+proj._id, { method:'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadPJ(type);
    closeEditPJ(type);
    renderPJ(type);
    showQuickToast('🗑️ Project dihapus.');
  } catch(e) {
    console.error('deleteFromSetPoint error:', e);
    showQuickToast('❌ Gagal hapus: '+e.message);
  }
}

// ── Set Point page navigation ────────────────────────────
function spGoPage2(type) {
  document.getElementById('sp-page1-'+type).style.display = 'none';
  document.getElementById('sp-page2-'+type).style.display = '';
  document.getElementById('sp-page-dot1-'+type).style.background = '#d1d5db';
  document.getElementById('sp-page-dot2-'+type).style.background = 'var(--blue)';
  document.getElementById('sp-page-lbl-'+type).textContent = 'Page 2 / 2';
  // scroll modal body back to top
  const body = document.querySelector('#sp-overlay-'+type+' .proj-modal-body');
  if (body) body.scrollTop = 0;
}
function spGoPage1(type) {
  document.getElementById('sp-page2-'+type).style.display = 'none';
  document.getElementById('sp-page1-'+type).style.display = '';
  document.getElementById('sp-page-dot1-'+type).style.background = 'var(--blue)';
  document.getElementById('sp-page-dot2-'+type).style.background = '#d1d5db';
  document.getElementById('sp-page-lbl-'+type).textContent = 'Page 1 / 2';
  const body = document.querySelector('#sp-overlay-'+type+' .proj-modal-body');
  if (body) body.scrollTop = 0;
}
window.spGoPage1 = spGoPage1;
window.spGoPage2 = spGoPage2;

function openSP(type, idx) {
  _spPJIdx = idx;
  const p = gPJ(type)[idx]; if (!p) return;
  document.getElementById('sp-proj-nm-'+type).textContent = p.name;

  // ── Populate receipt dropdown ──────────────────────────
  const rcptSel = document.getElementById('sp-receipt-sel-'+type);
  if (rcptSel) {
    const receipts = getReceipts();
    rcptSel.innerHTML = '<option value="">— Isi manual —</option>' +
      receipts.map((r, ri) =>
        `<option value="${ri}">📋 ${r.name}${r.kategori ? ' · ' + r.kategori : ''}</option>`
      ).join('');
    rcptSel.value = '';
    // Tampilkan banner area tapi kosong
    const banner = document.getElementById('sp-receipt-banner-'+type);
    if (banner) banner.style.display = 'none';
  }

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
  spGoPage1(type);
  document.getElementById('sp-overlay-'+type)?.classList.add('show');
  setupSPModalCalculations(type);
}

// Import receipt ke SP modal dari dropdown di header SP modal
function applyReceiptToSP(type) {
  const sel = document.getElementById('sp-receipt-sel-'+type);
  if (!sel || sel.value === '') return;
  const receipts = getReceipts();
  const r = receipts[+sel.value];
  if (!r) return;

  let count = 0;
  SP_FIELDS.forEach(f => {
    const el = document.getElementById(f.id+'-'+type);
    if (el && r.sp_data[f.id] !== undefined && r.sp_data[f.id] !== '') {
      el.value = r.sp_data[f.id]; count++;
    }
  });

  // Tampilkan banner konfirmasi
  const banner = document.getElementById('sp-receipt-banner-'+type);
  if (banner) {
    banner.style.display = 'flex';
    banner.innerHTML = `
      <span>✅ Receipt <strong>"${r.name}"</strong> di-import (${count} field). Edit manual jika perlu.</span>
      <button onclick="this.parentElement.style.display='none'" style="background:none;border:none;color:#6d28d9;font-size:16px;cursor:pointer;padding:0 4px;">✕</button>`;
  }
  showQuickToast(`✅ Receipt "${r.name}" diaplikasikan!`);
}
window.applyReceiptToSP = applyReceiptToSP;

function closeSP(type) {
  document.getElementById('sp-overlay-'+type)?.classList.remove('show');
  _spPJIdx = -1;
}
async function saveSP(type) {
  const ps    = gPJ(type);
  const proj  = ps[_spPJIdx];
  if (!proj) return;
  const spData = {};
  SP_FIELDS.forEach(f => {
    const el = document.getElementById(f.id+'-'+type);
    if (el) spData[f.id] = el.value.trim();
  });
  const sb=document.getElementById('sp-sb-'+type),sm=document.getElementById('sp-sm-'+type);
  if(sb&&sm){sb.style.display='flex';sb.className='de-status-bar de-status-loading';sm.textContent='⏳ Saving...';}
  if (proj._id) {
    try {
      const res  = await fetch('/api/projects/'+proj._id+'/setpoint', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(spData) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await loadPJ(type);
    } catch(e) {
      console.error('saveSP API error:', e);
    }
  } else {
    // Fallback localStorage
    ps[_spPJIdx].setPoint = spData;
    sPJ(type, ps);
  }
  if(sb&&sm){sb.style.display='flex';sb.className='de-status-bar de-status-success';sm.textContent='✅ Set Point saved!';}
  setTimeout(()=>{closeSP(type);renderPJ(type);},900);
}

// ═══════════════════════════════════════════════════════════
// RECEIPT SYSTEM — Template Set Point yang bisa disimpan & diimport
// ═══════════════════════════════════════════════════════════

// Helpers localStorage receipt
function getReceipts()       { try { return JSON.parse(localStorage.getItem('sail_receipts') || '[]'); } catch { return []; } }
function saveReceipts(list)  { localStorage.setItem('sail_receipts', JSON.stringify(list)); }

// Buka modal Receipt untuk project tertentu
function openReceiptModal(type, projIdx) {
  // Hapus modal lama kalau ada
  document.getElementById('receipt-modal-overlay')?.remove();

  const receipts = getReceipts();
  const proj = gPJ(type)[projIdx];
  if (!proj) return;

  const listHTML = receipts.length === 0
    ? `<div style="text-align:center;padding:32px;color:var(--txt3);font-size:13px;">Belum ada receipt. Simpan receipt baru dari Set Point yang sudah diisi.</div>`
    : receipts.map((r, ri) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg);margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;color:var(--txt);">📋 ${r.name}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px;">
            ${r.kategori ? `🏷️ ${r.kategori} &nbsp;·&nbsp;` : ''}
            Dibuat: ${new Date(r.created_at).toLocaleDateString('id-ID')}
            &nbsp;·&nbsp; ${Object.keys(r.sp_data).filter(k=>r.sp_data[k]!=='').length} field terisi
          </div>
        </div>
        <button class="pj-btn" style="border-color:var(--blue);color:var(--blue);background:#eff6ff;white-space:nowrap;"
          onclick="importReceiptToSP('${type}',${projIdx},${ri})">⬇️ Import</button>
        <button class="pj-btn" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;white-space:nowrap;"
          onclick="editReceipt(${ri})">✏️ Edit</button>
        <button class="pj-btn pj-btn-end" style="white-space:nowrap;"
          onclick="deleteReceipt(${ri})">🗑️</button>
      </div>`).join('');

  const modal = document.createElement('div');
  modal.id = 'receipt-modal-overlay';
  modal.className = 'proj-modal-overlay show';
  modal.innerHTML = `
    <div class="proj-modal" style="max-width:680px;width:95vw;">
      <div class="proj-modal-head">
        <div>
          <div class="proj-modal-title">📋 Receipt — Template Set Point</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:3px;">Project: <strong>${proj.name}</strong></div>
        </div>
        <button class="proj-modal-close" onclick="document.getElementById('receipt-modal-overlay').remove()">✕</button>
      </div>
      <div class="proj-modal-body">
        <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;">
          <div style="flex:1;font-size:13px;color:var(--txt2);">
            Pilih receipt untuk di-import ke Set Point project ini, atau buat receipt baru.
          </div>
          <button class="de-btn de-btn-primary" style="white-space:nowrap;" onclick="openAddReceiptModal('${type}',${projIdx})">＋ Buat Receipt</button>
        </div>
        <div id="receipt-list-body">${listHTML}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
window.openReceiptModal = openReceiptModal;

// Import receipt ke Set Point modal (buka SP modal dengan nilai receipt)
function importReceiptToSP(type, projIdx, receiptIdx) {
  const receipts = getReceipts();
  const r = receipts[receiptIdx];
  if (!r) return;

  // Tutup receipt modal
  document.getElementById('receipt-modal-overlay')?.remove();

  // Buka SP modal dulu
  openSP(type, projIdx);

  // Tunggu modal render lalu isi semua field dari receipt
  setTimeout(() => {
    let importedCount = 0;
    SP_FIELDS.forEach(f => {
      const el = document.getElementById(f.id + '-' + type);
      if (el && r.sp_data[f.id] !== undefined && r.sp_data[f.id] !== '') {
        el.value = r.sp_data[f.id];
        importedCount++;
      }
    });

    // Tampilkan banner notifikasi di dalam SP modal
    const page1 = document.getElementById('sp-page1-' + type);
    if (page1) {
      const banner = document.createElement('div');
      banner.style.cssText = 'padding:10px 14px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;font-size:12px;color:#6d28d9;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;';
      banner.innerHTML = `
        <span>✅ Receipt <strong>"${r.name}"</strong> berhasil di-import (${importedCount} field). Anda bisa edit manual sebelum disimpan.</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#6d28d9;font-size:16px;cursor:pointer;padding:0 4px;">✕</button>`;
      page1.insertBefore(banner, page1.firstChild);
    }

    showQuickToast(`✅ Receipt "${r.name}" di-import ke Set Point!`);
  }, 150);
}
window.importReceiptToSP = importReceiptToSP;

function openAddReceiptModal(type, projIdx, editIdx = -1) {
  document.getElementById('receipt-add-overlay')?.remove();

  const receipts = getReceipts();
  const isEdit   = editIdx >= 0;
  const existing = isEdit ? receipts[editIdx] : null;
  const proj     = gPJ(type)?.[projIdx];

  // Pre-fill dari set point project yang sedang dipilih (kalau bukan edit)
  const prefill  = existing?.sp_data || (proj?.setPoint || {});

  // ═══ TAMBAHAN BARU: Dropdown completed projects ═══
  const completedProjs = gPJ('completed').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const projOpts = completedProjs.length === 0
    ? '<option value="">— Tidak ada project selesai dengan Set Point —</option>'
    : '<option value="">— Isi manual —</option>' +
      completedProjs.map((p, i) => `<option value="${i}">${p.name}${p.kategori ? ' · ' + p.kategori : ''}</option>`).join('');
  // ═══ AKHIR TAMBAHAN ═══

  const fieldsHTML = SP_FIELDS.map(f => {
    const val = prefill[f.id] || '';
    const isCalc = f.calculated;
    return `
      <div class="de-field">
        <label class="de-label" style="color:#111;">${f.label}${isCalc ? ' <span style="font-size:9px;color:var(--txt3)">(auto)</span>' : ''}</label>
        <div class="de-input-wrap">
          <input class="de-input receipt-sp-field" id="rsp-${f.id}"
            type="${f.type}" step="0.1"
            value="${val}"
            placeholder="${val || '—'}"
            ${isCalc ? 'readonly style="background:#f3f4f6;color:var(--txt3)"' : ''}>
          ${f.unit ? `<span class="de-input-unit">${f.unit}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'receipt-add-overlay';
  overlay.className = 'proj-modal-overlay show';
  overlay.innerHTML = `
    <div class="proj-modal sp-modal" style="max-width:760px;width:95vw;max-height:90vh;">
      <div class="proj-modal-head">
        <div class="proj-modal-title">${isEdit ? '✏️ Edit Receipt' : '＋ Buat Receipt Baru'}</div>
        <button class="proj-modal-close" onclick="document.getElementById('receipt-add-overlay').remove()">✕</button>
      </div>
      <div class="proj-modal-body" style="overflow-y:auto;max-height:calc(90vh - 120px);">
        <div class="de-field" style="margin-bottom:16px;">
          <label class="de-label" style="color:#111;">NAMA RECEIPT *</label>
          <input class="de-input" id="receipt-name-inp" type="text"
            value="${existing?.name || ''}"
            placeholder="Contoh: Teh Hijau Standard, Oolong Premium...">
        </div>
        <div class="de-field" style="margin-bottom:20px;">
          <label class="de-label" style="color:#111;">KATEGORI (opsional)</label>
          <input class="de-input" id="receipt-cat-inp" type="text"
            value="${existing?.kategori || proj?.kategori || ''}"
            placeholder="Contoh: Teh Hijau, Oolong...">
        </div>
        
        ${completedProjs.length > 0 ? `
        <!-- ═══ TAMBAHAN BARU: Import Section ═══ -->
        <div style="padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:8px;">🏭 Import Set Point dari Project Selesai</div>
          <div style="display:flex;gap:10px;align-items:center;">
            <select class="de-input de-select" id="receipt-proj-import-modal" style="flex:1;" onchange="importCompletedToReceiptModal()">
              ${projOpts}
            </select>
          </div>
          <div style="font-size:10px;color:#16a34a;margin-top:5px;">Memilih project akan mengisi otomatis semua field di bawah. Anda tetap bisa edit manual.</div>
        </div>
        <!-- ═══ AKHIR TAMBAHAN ═══ -->
        ` : ''}
        
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--txt3);margin-bottom:12px;">📊 Nilai Set Point</div>
        <div class="setpoint-grid" style="margin-bottom:20px;">${fieldsHTML}</div>
        <div class="de-status-bar" id="receipt-sb" style="display:none"><span id="receipt-sm"></span></div>
        <div class="de-actions" style="margin-top:8px;">
          <button class="de-btn de-btn-ghost" onclick="document.getElementById('receipt-add-overlay').remove()">Batal</button>
          <button class="de-btn de-btn-primary" onclick="saveReceiptFromModal('${type}',${projIdx},${editIdx})">
            💾 ${isEdit ? 'Update Receipt' : 'Simpan Receipt'}
          </button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// Import set point dari completed project ke receipt modal
function importCompletedToReceiptModal() {
  const sel = document.getElementById('receipt-proj-import-modal');
  if (!sel || sel.value === '') return;
  
  const completedProjs = gPJ('completed').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const proj = completedProjs[+sel.value];
  if (!proj?.setPoint) return;
  
  // Fill semua field SP
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('rsp-' + f.id);
    if (el && proj.setPoint[f.id] !== undefined) {
      el.value = proj.setPoint[f.id];
    }
  });
  
  // Auto-isi nama receipt dari nama project jika masih kosong
  const nameEl = document.getElementById('receipt-name-inp');
  if (nameEl && !nameEl.value.trim()) {
    nameEl.value = proj.name + (proj.kategori ? ' — ' + proj.kategori : '');
  }
  
  // Auto-isi kategori
  const catEl = document.getElementById('receipt-cat-inp');
  if (catEl && !catEl.value.trim() && proj.kategori) {
    catEl.value = proj.kategori;
  }
  
  showQuickToast('✅ Set Point dari "' + proj.name + '" berhasil di-import!');
}
window.importCompletedToReceiptModal = importCompletedToReceiptModal;

// Simpan receipt dari modal (buat baru atau update)
function saveReceiptFromModal(type, projIdx, editIdx = -1) {
  const name = document.getElementById('receipt-name-inp')?.value.trim();
  if (!name) {
    const sb = document.getElementById('receipt-sb');
    const sm = document.getElementById('receipt-sm');
    if (sb && sm) { sb.style.display='flex'; sb.className='de-status-bar de-status-error'; sm.textContent='❌ Nama receipt wajib diisi!'; }
    return;
  }

  const sp_data = {};
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('rsp-' + f.id);
    if (el) sp_data[f.id] = el.value.trim();
  });

  const receipts = getReceipts();
  const entry = {
    name,
    kategori:   document.getElementById('receipt-cat-inp')?.value.trim() || '',
    sp_data,
    created_at: editIdx >= 0 ? receipts[editIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (editIdx >= 0) {
    receipts[editIdx] = entry;
  } else {
    receipts.unshift(entry);
  }
  saveReceipts(receipts);

  document.getElementById('receipt-add-overlay')?.remove();
  showQuickToast(`✅ Receipt "${name}" ${editIdx >= 0 ? 'diupdate' : 'disimpan'}!`);

  // Refresh receipt list kalau modal receipt masih terbuka
  if (document.getElementById('receipt-modal-overlay')) {
    openReceiptModal(type, projIdx);
  }
}
window.saveReceiptFromModal = saveReceiptFromModal;

// Edit receipt yang sudah ada
function editReceipt(receiptIdx) {
  // Ambil type dan projIdx dari context — pakai dummy 'ongoing',0 karena hanya edit data receipt
  document.getElementById('receipt-modal-overlay')?.remove();
  openAddReceiptModal('ongoing', 0, receiptIdx);
}
window.editReceipt = editReceipt;

// Hapus receipt
function deleteReceipt(receiptIdx) {
  if (!confirm('Hapus receipt ini?')) return;
  const receipts = getReceipts();
  const name = receipts[receiptIdx]?.name || '';
  receipts.splice(receiptIdx, 1);
  saveReceipts(receipts);
  showQuickToast(`🗑️ Receipt "${name}" dihapus.`);
  // Refresh list — ambil type/projIdx dari modal yg masih terbuka
  const overlay = document.getElementById('receipt-modal-overlay');
  if (overlay) {
    // Re-render list saja
    const listBody = document.getElementById('receipt-list-body');
    const recs = getReceipts();
    if (listBody) {
      listBody.innerHTML = recs.length === 0
        ? `<div style="text-align:center;padding:32px;color:var(--txt3);font-size:13px;">Belum ada receipt.</div>`
        : recs.map((r, ri) => `
          <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg);margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:13px;color:var(--txt);">📋 ${r.name}</div>
              <div style="font-size:11px;color:var(--txt3);margin-top:2px;">
                ${r.kategori ? `🏷️ ${r.kategori} &nbsp;·&nbsp;` : ''}
                ${new Date(r.created_at).toLocaleDateString('id-ID')}
                &nbsp;·&nbsp; ${Object.keys(r.sp_data).filter(k=>r.sp_data[k]!=='').length} field terisi
              </div>
            </div>
            <button class="pj-btn" style="border-color:var(--blue);color:var(--blue);background:#eff6ff;" onclick="importReceiptToSP('ongoing',0,${ri})">⬇️ Import</button>
            <button class="pj-btn" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;" onclick="editReceipt(${ri})">✏️ Edit</button>
            <button class="pj-btn pj-btn-end" onclick="deleteReceipt(${ri})">🗑️</button>
          </div>`).join('');
    }
  }
}
window.deleteReceipt = deleteReceipt;

// Shortcut: simpan Set Point yang sudah diisi sebagai receipt baru
function saveCurrentSPAsReceipt(type) {
  const sp_data = {};
  SP_FIELDS.forEach(f => {
    const el = document.getElementById(f.id + '-' + type);
    if (el) sp_data[f.id] = el.value.trim();
  });

  const filled = Object.values(sp_data).filter(v => v !== '').length;
  if (filled === 0) { showQuickToast('❌ Isi minimal satu field Set Point dulu!'); return; }

  const name = prompt('Nama receipt ini?');
  if (!name || !name.trim()) return;

  const receipts = getReceipts();
  receipts.unshift({
    name: name.trim(),
    kategori: '',
    sp_data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  saveReceipts(receipts);
  showQuickToast(`✅ Receipt "${name.trim()}" disimpan dari Set Point saat ini!`);
}
window.saveCurrentSPAsReceipt = saveCurrentSPAsReceipt;

// ═══════════════════════════════════════════════════════════
// RECEIPT PAGE — Halaman manajemen semua receipt
// ═══════════════════════════════════════════════════════════
function getReceiptPageHTML() {
  return `
<div class="de-wrap">
  <div class="de-header">
    <div>
      <div class="de-title">📋 Receipt — Template Set Point</div>
      <div class="de-sub">Simpan dan kelola template set point untuk digunakan kembali</div>
    </div>
    <button class="de-btn de-btn-primary" onclick="openAddReceiptStandalone()">＋ Tambah Receipt</button>
  </div>
  <div class="de-card" id="receipt-page-card">
    <div id="receipt-page-list" style="padding:4px 0;">
      <div style="text-align:center;padding:48px;color:var(--txt3);font-size:13px;">⏳ Memuat...</div>
    </div>
  </div>
</div>`;
}

function initReceiptPage() {
  renderReceiptPage();
}

function renderReceiptPage() {
  const list = document.getElementById('receipt-page-list');
  if (!list) return;
  const receipts = getReceipts();

  if (receipts.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:40px;margin-bottom:12px;">📋</div>
        <div style="font-size:15px;font-weight:700;color:var(--txt);margin-bottom:6px;">Belum ada receipt</div>
        <div style="font-size:13px;color:var(--txt3);margin-bottom:20px;">Buat template set point baru atau simpan dari Set Point project yang sudah ada.</div>
        <button class="de-btn de-btn-primary" onclick="openAddReceiptStandalone()">＋ Buat Receipt Pertama</button>
      </div>`;
    return;
  }

  list.innerHTML = receipts.map((r, ri) => `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg);margin-bottom:10px;transition:.15s;"
      onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="width:40px;height:40px;border-radius:10px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📋</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px;color:var(--txt);">${r.name}</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px;display:flex;gap:10px;flex-wrap:wrap;">
          ${r.kategori ? `<span>🏷️ ${r.kategori}</span>` : ''}
          <span>📅 ${new Date(r.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})}</span>
          <span>✅ ${Object.values(r.sp_data).filter(v=>v!=='').length} field terisi</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="pj-btn" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;"
          onclick="openEditReceiptStandalone(${ri})">✏️ Edit</button>
        <button class="pj-btn pj-btn-end"
          onclick="deleteReceiptFromPage(${ri})">🗑️</button>
      </div>
    </div>`).join('');
}
window.renderReceiptPage = renderReceiptPage;

function deleteReceiptFromPage(ri) {
  if (!confirm('Hapus receipt ini? Tindakan tidak bisa dibatalkan.')) return;
  const receipts = getReceipts();
  const name = receipts[ri]?.name || '';
  receipts.splice(ri, 1);
  saveReceipts(receipts);
  renderReceiptPage();
  showQuickToast(`🗑️ Receipt "${name}" dihapus.`);
}
window.deleteReceiptFromPage = deleteReceiptFromPage;

// Buka modal add receipt dari halaman Receipt (standalone, tanpa context project)
function openAddReceiptStandalone(editIdx = -1) {
  document.getElementById('receipt-standalone-overlay')?.remove();
  const receipts  = getReceipts();
  const isEdit    = editIdx >= 0;
  const existing  = isEdit ? receipts[editIdx] : null;
  const sp_prefill = existing?.sp_data || {};
  const pj_prefill = existing?.proj_info || {};
  const today     = new Date().toISOString().split('T')[0];

  const deletedCats = JSON.parse(localStorage.getItem('deleted_default_categories') || '[]');
  const customCats  = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  const DEFAULT_CATEGORIES = [
    { value:'teh-hijau', label:'🍵 Teh Hijau' },{ value:'oolong', label:'🍵 Oolong' },
    { value:'black-tea', label:'☕ Black Tea' },{ value:'roasted-jasmine', label:'🌸 Roasted Green Tea Jasmine' },
    { value:'robusta', label:'☕ Kopi Robusta' },{ value:'arabika', label:'☕ Kopi Arabika' },
  ];
  let catOpts = '<option value="">-- Pilih kategori --</option>';
  DEFAULT_CATEGORIES.forEach(c => { if (!deletedCats.includes(c.value)) catOpts += `<option value="${c.value}" ${pj_prefill.kategori===c.value?'selected':''}>${c.label}</option>`; });
  customCats.forEach(c => { catOpts += `<option value="${c.value}" ${pj_prefill.kategori===c.value?'selected':''}>📌 ${c.label}</option>`; });

  const completedProjs = gPJ('completed').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const projOpts = completedProjs.length === 0
    ? '<option value="">— Tidak ada project selesai dengan Set Point —</option>'
    : '<option value="">— Isi manual —</option>' +
      completedProjs.map((p,i) => `<option value="${i}">${p.name}${p.kategori?' · '+p.kategori:''}</option>`).join('');

  const spFieldsHTML = buildReceiptSPForm(sp_prefill);

  const savedTools = (pj_prefill.tools || '').split(', ').filter(Boolean);
  const toolsHTML  = ['Ekstraksi','Decanter (Separator Kasar)','Centrifuge (Separator Halus)','Filtrasi','Evaporasi','Full Condensation','Separate Condensation']
    .map(m => `<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--txt2);cursor:pointer;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);">
      <input type="checkbox" value="${m}" ${savedTools.includes(m)?'checked':''} style="accent-color:var(--blue);"> ${m}
    </label>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'receipt-standalone-overlay';
  overlay.className = 'proj-modal-overlay show';
  overlay.innerHTML = `
    <div class="proj-modal sp-modal" style="max-width:780px;width:95vw;max-height:93vh;display:flex;flex-direction:column;">
      <div class="proj-modal-head">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="proj-modal-title">${isEdit ? '✏️ Edit Receipt' : '＋ Tambah Receipt Baru'}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span id="rcpt-dot1" style="width:8px;height:8px;border-radius:50%;background:var(--blue);display:inline-block;"></span>
            <span id="rcpt-dot2" style="width:8px;height:8px;border-radius:50%;background:#d1d5db;display:inline-block;"></span>
            <span id="rcpt-page-lbl" style="font-size:10px;color:var(--txt3);font-weight:600;">Halaman 1 / 2 — Info Project</span>
          </div>
        </div>
        <button class="proj-modal-close" onclick="document.getElementById('receipt-standalone-overlay').remove()">✕</button>
      </div>
      <div class="proj-modal-body" style="overflow-y:auto;flex:1;">

        <!-- ════ PAGE 1: PROJECT INFO ════ -->
        <div id="rcpt-page1">
          <div style="padding:10px 12px;background:#f5f3ff;border:1px solid #e9d5ff;border-radius:8px;font-size:11px;color:#7c3aed;margin-bottom:16px;">
            <strong>ℹ️ Halaman 1:</strong> Isi info project yang akan jadi template receipt. Nama & tanggal akan bisa diubah saat pakai receipt.
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div class="de-field">
              <label class="de-label" style="color:#111;">NAMA RECEIPT *</label>
              <input class="de-input" id="rcpt-name" type="text"
                value="${existing?.name || ''}" placeholder="Contoh: Teh Hijau Standard...">
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#111;">TANGGAL RECEIPT</label>
              <input class="de-input" id="rcpt-date" type="date"
                value="${existing ? existing.created_at?.split('T')[0] : today}"
                readonly onclick="this.removeAttribute('readonly')" onblur="this.setAttribute('readonly',true)">
            </div>
          </div>

          <div class="de-field proj-modal-full" style="margin-bottom:14px;">
            <label class="de-label" style="color:#111;">KATEGORI PRODUK</label>
            <select class="de-input de-select" id="rcpt-kategori">${catOpts}</select>
          </div>

          <div class="de-field proj-modal-full" style="margin-bottom:14px;">
            <label class="de-label" style="color:#111;">PREPARATION METHOD</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);">${toolsHTML}</div>
          </div>

          <div class="de-field proj-modal-full" style="margin-bottom:14px;">
            <label class="de-label" style="color:#111;">MATERIALS USED</label>
            <textarea class="de-input de-textarea" id="rcpt-materials" style="min-height:60px;" placeholder="e.g. Steel pipes, concrete...">${pj_prefill.materials || ''}</textarea>
          </div>

          <div class="de-field proj-modal-full" style="margin-bottom:20px;">
            <label class="de-label" style="color:#111;">NOTES</label>
            <textarea class="de-input de-textarea" id="rcpt-notes" style="min-height:60px;" placeholder="Catatan tambahan...">${pj_prefill.notes || ''}</textarea>
          </div>

          <div class="de-actions" style="margin-top:8px;justify-content:space-between;">
            <button class="de-btn de-btn-ghost" onclick="document.getElementById('receipt-standalone-overlay').remove()">Batal</button>
            <button class="de-btn de-btn-primary" onclick="rcptGoPage2()">Next → Set Point</button>
          </div>
        </div>

        <!-- ════ PAGE 2: SET POINT ════ -->
        <div id="rcpt-page2" style="display:none;">
          <div style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:11px;color:#15803d;margin-bottom:16px;">
            <strong>📊 Halaman 2:</strong> Isi nilai Set Point untuk template ini. Bisa dikosongkan jika tidak diperlukan.
          </div>

          ${completedProjs.length > 0 && !isEdit ? `
          <div style="padding:11px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:7px;">🏭 Import SP dari Project Selesai</div>
            <select class="de-input de-select" id="rcpt-proj-import" style="width:100%;" onchange="importCompletedProjectToReceipt()">${projOpts}</select>
          </div>` : ''}

          <div id="rcpt-sp-fields">${spFieldsHTML}</div>

          <div class="de-status-bar" id="rcpt-sb" style="display:none"><span id="rcpt-sm"></span></div>
          <div class="de-actions" style="margin-top:16px;justify-content:space-between;">
            <button class="de-btn de-btn-ghost" onclick="rcptGoPage1()">← Back</button>
            <button class="de-btn de-btn-primary" onclick="saveReceiptStandalone(${editIdx})">
              💾 ${isEdit ? 'Update Receipt' : 'Simpan Receipt'}
            </button>
          </div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(overlay);
}
window.openAddReceiptStandalone = openAddReceiptStandalone;

function rcptGoPage2() {
  document.getElementById('rcpt-page1').style.display = 'none';
  document.getElementById('rcpt-page2').style.display = '';
  document.getElementById('rcpt-dot1').style.background = '#d1d5db';
  document.getElementById('rcpt-dot2').style.background = 'var(--blue)';
  document.getElementById('rcpt-page-lbl').textContent = 'Halaman 2 / 2 — Set Point';
  document.querySelector('#receipt-standalone-overlay .proj-modal-body').scrollTop = 0;
}
window.rcptGoPage2 = rcptGoPage2;

function rcptGoPage1() {
  document.getElementById('rcpt-page2').style.display = 'none';
  document.getElementById('rcpt-page1').style.display = '';
  document.getElementById('rcpt-dot1').style.background = 'var(--blue)';
  document.getElementById('rcpt-dot2').style.background = '#d1d5db';
  document.getElementById('rcpt-page-lbl').textContent = 'Halaman 1 / 2 — Info Project';
  document.querySelector('#receipt-standalone-overlay .proj-modal-body').scrollTop = 0;
}
window.rcptGoPage1 = rcptGoPage1;

function openEditReceiptStandalone(editIdx) {
  openAddReceiptStandalone(editIdx);
}
window.openEditReceiptStandalone = openEditReceiptStandalone;

// Import set point dari project selesai ke form receipt standalone
function importCompletedProjectToReceipt() {
  const sel = document.getElementById('rcpt-proj-import');
  if (!sel || sel.value === '') return;
  const proj = gPJ('completed').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0)[+sel.value];
  if (!proj?.setPoint) return;
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('rcpt-sp-' + f.id);
    if (el && proj.setPoint[f.id] !== undefined) el.value = proj.setPoint[f.id];
  });
  // Auto-isi nama receipt dari nama project jika masih kosong
  const nameEl = document.getElementById('rcpt-name');
  if (nameEl && !nameEl.value.trim()) nameEl.value = proj.name + (proj.kategori ? ' — ' + proj.kategori : '');
  showQuickToast('✅ Set Point dari "' + proj.name + '" berhasil di-import!');
}
window.importCompletedProjectToReceipt = importCompletedProjectToReceipt;

// Build HTML form SP fields identik dengan Set Point modal (menggunakan SP_FIELDS)
function buildReceiptSPForm(prefill = {}) {
  const sections = [
    { title: '🧪 Slurry',      fields: ['sp-slurry','sp-hopper','sp-density'] },
    { title: '💧 Flow',        fields: ['sp-feed','sp-aroma','sp-steam','sp-cond1','sp-cond2'] },
    { title: '📊 Strip Rate',  fields: ['sp-ext','sp-int','sp-cond-rate','sp-offset'] },
    { title: '🌡️ Temperature', fields: ['sp-temp-feed','sp-temp-heater','sp-temp-top','sp-Condensate1','sp-Condensate2','sp-temp-bot','sp-prod-out'] },
    { title: '⚙️ Pressure',    fields: ['sp-system-vacuum','sp-steam-flow'] },
    { title: '📝 Parameter CT',fields: ['sp-add1','sp-add2','sp-add3','sp-add4','sp-add5','sp-add6','sp-add7','sp-add8'] },
  ];
  const fieldMap = {};
  SP_FIELDS.forEach(f => { fieldMap[f.id] = f; });

  return sections.map(sec => {
    const fieldsHTML = sec.fields.map(id => {
      const f = fieldMap[id]; if (!f) return '';
      const val = prefill[id] || '';
      return `
        <div class="de-field">
          <label class="de-label" style="color:#111;">${f.label}</label>
          <div class="de-input-wrap">
            <input class="de-input" id="rcpt-sp-${f.id}" type="${f.type}" step="0.1"
              value="${val}" placeholder="—"
              ${f.calculated ? 'readonly style="background:#ebf2fd;color:#0284c7;font-weight:700;border-color:#bae6fd;"' : ''}>
            ${f.unit ? `<span class="de-input-unit">${f.unit}</span>` : ''}
          </div>
        </div>`;
    }).join('');
    return `
      <div class="setpoint-section" style="margin-bottom:18px;">
        <div class="setpoint-section-title">${sec.title}</div>
        <div class="setpoint-grid">${fieldsHTML}</div>
      </div>`;
  }).join('');
}

function saveReceiptStandalone(editIdx = -1) {
  const name = document.getElementById('rcpt-name')?.value.trim();
  if (!name) {
    const sb = document.getElementById('rcpt-sb'), sm = document.getElementById('rcpt-sm');
    if (sb&&sm) { sb.style.display='flex'; sb.className='de-status-bar de-status-error'; sm.textContent='❌ Nama receipt wajib diisi!'; }
    return;
  }
  const dateVal = document.getElementById('rcpt-date')?.value || new Date().toISOString();

  // Kumpulkan proj_info dari page 1
  const proj_info = {
    kategori:  document.getElementById('rcpt-kategori')?.value  || '',
    materials: document.getElementById('rcpt-materials')?.value.trim() || '',
    notes:     document.getElementById('rcpt-notes')?.value.trim()     || '',
    tools: [...document.querySelectorAll('#receipt-standalone-overlay input[type=checkbox]:checked')]
      .map(cb => cb.value).join(', '),
  };

  const sp_data = {};
  SP_FIELDS.forEach(f => {
    const el = document.getElementById('rcpt-sp-' + f.id);
    if (el) sp_data[f.id] = el.value.trim();
  });

  const receipts = getReceipts();
  const entry = {
    name, proj_info, sp_data,
    kategori:   proj_info.kategori,
    created_at: editIdx >= 0 ? receipts[editIdx].created_at : (dateVal.includes('T') ? dateVal : dateVal + 'T00:00:00.000Z'),
    updated_at: new Date().toISOString(),
  };

  if (editIdx >= 0) receipts[editIdx] = entry;
  else receipts.unshift(entry);
  saveReceipts(receipts);

  document.getElementById('receipt-standalone-overlay')?.remove();
  showQuickToast(`✅ Receipt "${name}" ${editIdx >= 0 ? 'diupdate' : 'disimpan'}!`);
  renderReceiptPage();
}
window.saveReceiptStandalone = saveReceiptStandalone;

function resetFPForm(type) {
  if (_fpPJIdx < 0) return;
  
  if (!confirm('Apakah Anda yakin ingin menghapus semua data input dan baris tambahan di form ini? Semua data Finish Production project ini akan dikosongkan.')) return;

  // 1. Hapus draf di memori (RAM)
  if (window._fpDraft1) delete window._fpDraft1[type + _fpPJIdx];
  if (window._fpDraft2) delete window._fpDraft2[type + _fpPJIdx];

  // 2. Hapus draf DAN Data yang sudah disave di Database (localStorage)
  const ps = gPJ(type);
  if (ps[_fpPJIdx]) {
    delete ps[_fpPJIdx].fpItems1Draft; // Hapus draf Page 1
    delete ps[_fpPJIdx].fpItems2Draft; // Hapus draf Page 2
    delete ps[_fpPJIdx].fpItems1;      // Hapus data Save Page 1 (Aroma)
    delete ps[_fpPJIdx].fpItems2;      // Hapus data Save Page 2 (Produk)
    delete ps[_fpPJIdx].fpItems;       // Hapus data legacy
    ps[_fpPJIdx].fpDone = false;       // Kembalikan status tombol End
    
    sPJ(type, ps); // Simpan status kosong ke database
  }

  // 3. Render ulang form (sekarang pasti kembali ke 1 baris kosong)
  openFP(type, _fpPJIdx);
  
  // Matikan notifikasi hijau jika ada
  const sb = document.getElementById('fp-sb-'+type);
  if (sb) sb.style.display = 'none';
  
  showQuickToast('🔄 Form berhasil di-reset menjadi kosong.');
}
window.resetFPForm = resetFPForm;

// ── Finish Production functions ───────────────────────────

// Fungsi baru untuk simpan draf kedua-dua page secara berasingan
function _saveFPDrafts(type) {
  if (_fpPJIdx < 0) return;
  
  // Ambil data Page 1 (Aroma)
  const items1 = [];
  document.querySelectorAll(`#fp-items-${type} .fp-item`).forEach(row => {
    const uid = row.id.replace('fp-row-','');
    items1.push({
      date:  document.getElementById('fpr-date-'+uid)?.value  || '',
      name:  document.getElementById('fpr-name-'+uid)?.value  || '',
      code:  document.getElementById('fpr-code-'+uid)?.value  || '',
      berat: document.getElementById('fpr-berat-'+uid)?.value || '',
    });
  });

  // Ambil data Page 2 (Produk)
  const items2 = [];
  document.querySelectorAll(`#fp-items2-${type} .fp-item2`).forEach(row => {
    const uid = row.id.replace('fp-row2-','');
    items2.push({
      date:  document.getElementById('fpr2-date-'+uid)?.value  || '',
      name:  document.getElementById('fpr2-name-'+uid)?.value  || '',
      code:  document.getElementById('fpr2-code-'+uid)?.value  || '',
      brix:  document.getElementById('fpr2-brix-'+uid)?.value  || '',
      berat: document.getElementById('fpr2-berat-'+uid)?.value || '',
    });
  });

  // Simpan dalam cache/memori sementara
  window._fpDraft1 = window._fpDraft1 || {};
  window._fpDraft2 = window._fpDraft2 || {};
  window._fpDraft1[type+_fpPJIdx] = items1;
  window._fpDraft2[type+_fpPJIdx] = items2;
}

function openFP(type, idx) {
  _fpPJIdx = idx;
  const p = gPJ(type)[idx]; if (!p) return;
  document.getElementById('fp-proj-nm-'+type).textContent = p.name;
  
  // Load PAGE 1 (Aroma)
  const container1 = document.getElementById('fp-items-'+type);
  container1.innerHTML = '';
  // Cek draf memori atau draf dari localStorage (jika ditutup sebelum ni)
  const draft1 = window._fpDraft1?.[type+idx] || p.fpItems1Draft;
  const items1 = draft1 || (p.fpItems1?.length ? p.fpItems1 : null);
  if (items1 && items1.length > 0) { items1.forEach(item => addFPItem(type, item)); }
  else { addFPItem(type); }

  // Load PAGE 2 (Produk)
  const container2 = document.getElementById('fp-items2-'+type);
  container2.innerHTML = '';
  const draft2 = window._fpDraft2?.[type+idx] || p.fpItems2Draft;
  // (Pakej fallback `p.fpItems` untuk data lama)
  const items2 = draft2 || (p.fpItems2?.length ? p.fpItems2 : (p.fpItems?.length ? p.fpItems : null));
  if (items2 && items2.length > 0) { items2.forEach(item => addFPItem2(type, item)); }
  else { addFPItem2(type); }

  const sb = document.getElementById('fp-sb-'+type); if(sb) sb.style.display='none';
  fpGoPage1(type);
  document.getElementById('fp-overlay-'+type)?.classList.add('show');
}

function closeFP(type) {
  // Save draf setiap kali form ditutup
  _saveFPDrafts(type);
  
  // Simpan ke localStorage supaya form tidak hilang walaupun page di-refresh
  if (_fpPJIdx >= 0) {
      const ps = gPJ(type);
      if(ps[_fpPJIdx]) {
          ps[_fpPJIdx].fpItems1Draft = window._fpDraft1[type+_fpPJIdx];
          ps[_fpPJIdx].fpItems2Draft = window._fpDraft2[type+_fpPJIdx];
          sPJ(type, ps);
      }
  }

  document.getElementById('fp-overlay-'+type)?.classList.remove('show');
  _fpPJIdx = -1;
}

function fpGoPage1(type) {
  _saveFPDrafts(type); // Simpan status semasa pindah tab
  document.getElementById('fp-page1-'+type).style.display = '';
  document.getElementById('fp-page2-'+type).style.display = 'none';
}

function fpGoPage2(type) {
  _saveFPDrafts(type); // Simpan status semasa pindah tab
  document.getElementById('fp-page1-'+type).style.display = 'none';
  document.getElementById('fp-page2-'+type).style.display = '';
}

function _saveFPDraft(type) {
  window._fpDraft = window._fpDraft || {};
  const items = [];
  document.querySelectorAll(`#fp-items-${type} .fp-item`).forEach(row => {
    const uid = row.id.replace('fp-row-','');
    items.push({
      date:  document.getElementById('fpr-date-'+uid)?.value  || '',
      name:  document.getElementById('fpr-name-'+uid)?.value  || '',
      code:  document.getElementById('fpr-code-'+uid)?.value  || '',
      berat: document.getElementById('fpr-berat-'+uid)?.value || '',
    });
  });
  window._fpDraft[type+_fpPJIdx] = items;
}

function addFPItem(type, data=null) {
  const container = document.getElementById('fp-items-'+type);
  if (!container) return;
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
      <label class="de-label">Kode Kemasan</label>
      <input class="de-input" id="fpr-code-${uid}" type="text" value="${data?.code||''}" placeholder="Kode kemasan...">
    </div>
    <div class="de-field">
      <label class="de-label">Berat <span style="font-weight:400;color:var(--txt3)">(kg)</span></label>
      <input class="de-input" id="fpr-berat-${uid}" type="number" step="0.1" value="${data?.berat||''}" placeholder="0.0">
    </div>
    
    <div class="de-field" style="grid-column: 1 / -1;">
      <label class="de-label">Catatan</label>
      <textarea class="de-input" id="fpr-notes-${uid}" placeholder="Catatan..." style="min-height:50px;">${data?.notes||''}</textarea>
    </div>

    <div></div>
    <div style="display:flex;align-items:flex-end;justify-content:flex-end">
      <button class="fp-item-remove" onclick="document.getElementById('fp-row-${uid}').remove()" style="padding:8px 14px;font-size:12px">✕ Hapus</button>
    </div>`;
  container.appendChild(row);
}

function addFPItem2(type, data=null) {
  const container = document.getElementById('fp-items2-'+type);
  if (!container) return;
  const uid = Date.now() + Math.random();
  const row = document.createElement('div');
  row.className = 'fp-item2';
  row.id = 'fp-row2-'+uid;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;background:var(--bg);border-radius:8px;align-items:end;margin-bottom:8px;border:1px solid var(--border);';
  row.innerHTML = `
    <div class="de-field">
      <label class="de-label">Tanggal</label>
      <input class="de-input" id="fpr2-date-${uid}" type="date" value="${data?.date || new Date().toISOString().split('T')[0]}">
    </div>
    <div class="de-field">
      <label class="de-label">Nama Produk</label>
      <input class="de-input" id="fpr2-name-${uid}" type="text" value="${data?.name||''}" placeholder="Nama produk...">
    </div>
    <div class="de-field">
      <label class="de-label">Kode Kemasan</label>
      <input class="de-input" id="fpr2-code-${uid}" type="text" value="${data?.code||''}" placeholder="Kode kemasan...">
    </div>
    <div class="de-field">
      <label class="de-label">Brix <span style="font-weight:400;color:var(--txt3)">(°Bx)</span></label>
      <input class="de-input" id="fpr2-brix-${uid}" type="number" step="0.1" value="${data?.brix||''}" placeholder="0.0">
    </div>
    <div class="de-field">
      <label class="de-label">Berat <span style="font-weight:400;color:var(--txt3)">(kg)</span></label>
      <input class="de-input" id="fpr2-berat-${uid}" type="number" step="0.1" value="${data?.berat||''}" placeholder="0.0">
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:flex-end">
      <button class="fp-item-remove" onclick="document.getElementById('fp-row2-${uid}').remove()" style="padding:8px 14px;font-size:12px">✕ Hapus</button>
    </div>`;
  container.appendChild(row);
}

async function saveFP(type) {
  if (!confirm('Apakah Anda yakin ingin menyelesaikan Finish Production?')) return;
  if (_fpPJIdx < 0) return;
  _saveFPDrafts(type);
  const ps   = gPJ(type);
  const proj = ps[_fpPJIdx];
  if (!proj) return;
  // Kumpulkan items dari kedua page
  const items1 = window._fpDraft1?.[type+_fpPJIdx] || [];
  const items2 = window._fpDraft2?.[type+_fpPJIdx] || [];
  const allFilled = (items1.length > 0 || items2.length > 0);
  if (proj._id) {
    try {
      await fetch('/api/projects/'+proj._id+'/fp', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fp_done: allFilled, fp_entries: items2 }) });
      await loadPJ(type);
    } catch(e) { console.error('saveFP API error:', e); }
  } else {
    // Fallback localStorage
    ps[_fpPJIdx].fpDone    = allFilled;
    ps[_fpPJIdx].fpItems1  = items1;
    ps[_fpPJIdx].fpItems2  = items2;
    ps[_fpPJIdx].fpItems   = items2;
    delete ps[_fpPJIdx].fpItems1Draft;
    delete ps[_fpPJIdx].fpItems2Draft;
    sPJ(type, ps);
  }
  if (window._fpDraft1) delete window._fpDraft1[type+_fpPJIdx];
  if (window._fpDraft2) delete window._fpDraft2[type+_fpPJIdx];
  const b=document.getElementById('fp-sb-'+type),m=document.getElementById('fp-sm-'+type);
  if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-success';m.textContent='✅ Finish Production disimpan! Tombol End sekarang aktif.';}
  setTimeout(()=>{closeFP(type);renderPJ(type);},900);
}

window.fpGoPage1 = fpGoPage1;
window.fpGoPage2 = fpGoPage2;
window.addFPItem = addFPItem;
window.addFPItem2 = addFPItem2;
window.saveFP = saveFP;
window.openFP = openFP;
window.closeFP = closeFP;

// ── End Production ────────────────────────────────────────
async function endProd(type, idx) {
  const ps = gPJ(type);
  const p  = ps[idx];
  if (!p) return;
  const hasCIPProd = p.cipProdDone === true;
  const hasCIPLab  = p.cipLabDone  === true;
  const hasFP      = p.fpDone === true;
  if (!hasCIPProd) { showQuickToast('❌ CIP Data Entry Production belum diisi!'); return; }
  if (!hasCIPLab)  { showQuickToast('❌ CIP Data Entry Laboratorium belum diisi!'); return; }
  if (!hasFP)      { showQuickToast('❌ Finish Production belum diisi!'); return; }
  if (!confirm(`Akhiri produksi untuk "${p.name}"?\nProyek akan dipindahkan ke Completed.`)) return;
  if (p._id) {
    try {
      await fetch('/api/projects/'+p._id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'completed', completed_at: new Date().toISOString() }) });
      await loadPJ('ongoing');
      await loadPJ('completed');
    } catch(e) { console.error('endProd API error:', e); }
  } else {
    p.completed_at = new Date().toISOString();
    const comp = gPJ('completed');
    comp.unshift(p);
    sPJ('completed', comp);
    ps.splice(idx, 1);
    sPJ(type, ps);
  }
  renderPJ(type);
  showQuickToast('✅ Produksi selesai! Proyek dipindahkan ke Completed.');
}

// ── Complete project (kept for backward compat) ───────────
function completePJ(idx) {
  endProd('ongoing', idx);
}

// ── Update modal (20 fields) ──────────────────────────────
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
async function saveUpdEntry(type) {
  const ps   = gPJ(type);
  const proj = ps[_updPJIdx];
  if (!proj) return;
  const note = document.getElementById('upd-note-'+type)?.value.trim();
  if (!note) { showQuickToast('❌ Catatan tidak boleh kosong!'); return; }
  const entry = { note, date: new Date().toISOString() };
  if (!proj.updates) proj.updates = [];
  proj.updates.unshift(entry);
  if (proj._id) {
    try {
      await fetch('/api/projects/'+proj._id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ notes: note }) });
      await loadPJ(type);
    } catch(e) { console.error('saveUpdEntry API error:', e); }
  } else {
    sPJ(type, ps);
  }
  closeUpdEntry(type);
  renderPJ(type);
  showQuickToast('✅ Update tersimpan!');
}
function showQuickToast(msg) {
  let t = document.getElementById('_toast');
  if(!t){t=document.createElement('div');t.id='_toast';t.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:100px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;transition:opacity .3s';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._hide);t._hide=setTimeout(()=>{t.style.opacity='0';},2500);
}

// ── Summary drawer ────────────────────────────────────────
if (!window._summState) window._summState = {}; // { type: { idx, activeTab } }

function openSumm(type, idx) {
  const p = gPJ(type)[idx]; if(!p) return;
  if (!window._summState) window._summState = {};
  window._summState[type] = { idx, activeTab: 'setpoint' };

  const nmEl = document.getElementById('summ-nm-'+type);
  const dtEl = document.getElementById('summ-dt-'+type);
  const body  = document.getElementById('summ-body-'+type);
  if (!nmEl || !dtEl || !body) {
    console.warn('openSumm: DOM elements not found for type='+type);
    return;
  }

  nmEl.textContent = p.name;
  dtEl.textContent =
    '📅 '+(p.start||'—')+' → 🏁 '+(p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—');

  const tblStyle    = 'width:100%;border-collapse:collapse;font-size:12px;';
  const thStyle     = 'text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--txt3);background:var(--bg);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;';
  const tdStyle     = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--txt2);font-size:12px;vertical-align:top;';
  const tdMonoStyle = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--blue);font-family:\'DM Mono\',monospace;font-size:11px;font-weight:600;vertical-align:top;';

  const section = (icon, title, tableHTML) => `
    <div class="summ-section">
      <div class="summ-section-title">${icon} <span>${title}</span></div>
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:4px">
        <table style="${tblStyle}">${tableHTML}</table>
      </div>
    </div>`;

  // ── 1. Project Info ───────────────────────────────────
  let html = section('📋', 'Informasi Project', `
    <thead><tr>
      <th style="${thStyle}">Field</th>
      <th style="${thStyle}">Value</th>
    </tr></thead>
    <tbody>
      <tr><td style="${tdStyle}">Nama Project</td><td style="${tdMonoStyle}">${p.name||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Mulai</td><td style="${tdStyle}">${p.start||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Selesai</td><td style="${tdStyle}">${p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—'}</td></tr>
      <tr><td style="${tdStyle}">Metode</td><td style="${tdStyle}">${p.method||'—'}</td></tr>
      <tr><td style="${tdStyle}">Materials</td><td style="${tdStyle}">${p.materials||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tools</td><td style="${tdStyle}">${p.tools||'—'}</td></tr>
      <tr><td style="${tdStyle}">Notes</td><td style="${tdStyle}">${p.notes||'—'}</td></tr>
    </tbody>`);

  // ── 2. Unified Switch: Set Point + Data Entry ────────
  const switchDefs = [
    { id:'produksi',  label:'🏭 Produksi'  },
    { id:'lab',       label:'🧪 Lab'       },
    { id:'utility',   label:'⚡ Utility'   },
    { id:'limbah',    label:'♻️ Limbah'    },
  ];
  html += `
    <div class="summ-section" style="padding-bottom:0">
      <div class="summ-section-title" style="margin-bottom:10px">📊 <span>Data Summary</span></div>
      <div style="display:flex;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;padding:3px;gap:2px;flex-wrap:wrap;margin-bottom:14px;">
        ${switchDefs.map(t=>`
          <button id="summ-tab-${type}-${t.id}"
            onclick="switchSummTab('${type}','${t.id}')"
            style="flex:1;min-width:60px;padding:6px 10px;font-size:10.5px;font-weight:600;border-radius:9px;border:none;cursor:pointer;transition:all .18s;white-space:nowrap;
              ${t.id==='produksi'
                ? 'background:var(--blue);color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.12);'
                : 'background:transparent;color:var(--txt3);'}"
          >${t.label}</button>`).join('')}
      </div>
      <div id="summ-tab-content-${type}" style="margin-bottom:4px"></div>
    </div>`;

  // ── 4. CIP Data ───────────────────────────────────────
  if (p.cipDone && p.cipHistory && p.cipHistory.length) {
    // Group CIP history by type (production vs laboratorium)
    const cipTypes = {};
    p.cipHistory.forEach(entry => {
      const type = entry.type || 'production';
      if (!cipTypes[type]) cipTypes[type] = [];
      cipTypes[type].push(entry);
    });

    Object.entries(cipTypes).forEach(([cipType, entries]) => {
      const typeLabel = cipType === 'laboratorium' ? '🧪 Lab CIP' : '🏭 Production CIP';
      
      // Build thead with update columns
      let thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>`;
      entries.forEach((entry, i) => {
        const dateObj = new Date(entry.saved_at);
        const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
        thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span></th>`;
      });
      thead += `</tr>`;

      // Collect all unique parameters
      const allParams = new Set();
      entries.forEach(entry => {
        if (entry.fields) {
          Object.keys(entry.fields).forEach(key => allParams.add(key));
        }
      });

      // Build tbody
      let tbody = '';
      let rowIdx = 0;
      [...allParams].sort().forEach(param => {
        const rowBg = rowIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
        let rowHtml = `<td style="${tdStyle}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${param}</td>`;
        
        entries.forEach(entry => {
          const val = entry.fields?.[param];
          if (val !== undefined && val !== '') {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${val}</td>`;
          } else {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
          }
        });
        tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
        rowIdx++;
      });

      html += `
        <div class="summ-section">
          <div class="summ-section-title">🧼 <span>${typeLabel}</span></div>
          <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:4px">
            <table style="${tblStyle}">
              <thead>${thead}</thead>
              <tbody>${tbody}</tbody>
            </table>
          </div>
        </div>`;
    });
  }

  // ── 5. Finish Production ──────────────────────────────
  if (p.fpDone) {
    // Display Aroma data (fpItems1) if exists
    if (p.fpItems1 && p.fpItems1.length) {
      const aromaRows = p.fpItems1.map((item, i) => `
        <tr>
          <td style="${tdStyle}">${i+1}</td>
          <td style="${tdStyle}">${item.date||'—'}</td>
          <td style="${tdStyle}">${item.name||'—'}</td>
          <td style="${tdStyle}">${item.code||'—'}</td>
          <td style="${tdMonoStyle}">${item.berat||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">kg</span></td>
        </tr>`).join('');
      html += section('🌸', 'Finish Production - Aroma', `
        <thead><tr>
          <th style="${thStyle}">#</th>
          <th style="${thStyle}">Tanggal</th>
          <th style="${thStyle}">Nama Produk</th>
          <th style="${thStyle}">Kode</th>
          <th style="${thStyle}">Berat</th>
        </tr></thead>
        <tbody>${aromaRows}</tbody>`);
    }

    // Display Product data (fpItems2 or fpItems for backward compatibility)
    const productItems = p.fpItems2 || p.fpItems;
    if (productItems && productItems.length) {
      const fpRows = productItems.map((item, i) => `
        <tr>
          <td style="${tdStyle}">${i+1}</td>
          <td style="${tdStyle}">${item.date||'—'}</td>
          <td style="${tdStyle}">${item.name||'—'}</td>
          <td style="${tdStyle}">${item.code||'—'}</td>
          <td style="${tdMonoStyle}">${item.brix||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">°Bx</span></td>
          <td style="${tdMonoStyle}">${item.berat||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">kg</span></td>
        </tr>`).join('');
      html += section('🏭', 'Finish Production - Product', `
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
  }

  body.innerHTML = html;

  // Render initial tab content (Produksi as default)
  renderSummTabContent(type, 'produksi', p);

  document.getElementById('summ-overlay-'+type)?.classList.add('show');
  document.getElementById('summ-drawer-'+type)?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ── Tab switcher ──────────────────────────────────────────
function switchSummTab(type, tabId) {
  const st = window._summState[type]; if(!st) return;
  st.activeTab = tabId;
  const p = gPJ(type)[st.idx]; if(!p) return;

  // Update switch button styles
  ['produksi','lab','utility','limbah'].forEach(t => {
    const btn = document.getElementById('summ-tab-'+type+'-'+t);
    if (!btn) return;
    if (t === tabId) {
      btn.style.background = 'var(--blue)';
      btn.style.color = '#fff';
      btn.style.boxShadow = '0 1px 4px rgba(0,0,0,.12)';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--txt3)';
      btn.style.boxShadow = 'none';
    }
  });

  renderSummTabContent(type, tabId, p);
}
window.switchSummTab = switchSummTab;

// ── Tab content renderer ──────────────────────────────────
function renderSummTabContent(type, tabId, p) {
  const wrap = document.getElementById('summ-tab-content-'+type);
  if (!wrap) return;

  // Base Styles yang lebih compact/rapat
  const tblStyle = 'width:100%;border-collapse:collapse;font-size:11px;';
  const thStyle  = 'padding:6px 10px;font-size:9px;font-weight:700;color:var(--txt3);background:var(--bg);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;';
  const tdLabel  = 'padding:6px 10px;border-bottom:1px solid var(--border);color:var(--txt2);font-size:11px;vertical-align:middle;white-space:nowrap;';
  
  const emptyMsg = (msg) => `<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px;background:var(--bg);border-radius:8px;border:1px dashed var(--border)">${msg}</div>`;

  const tableHeaderUI = (title) => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">${title}</div>
      <div style="font-size:9px;color:var(--blue);background:#ebf2fd;padding:3px 8px;border-radius:4px;font-weight:600">↔ Geser kanan untuk melihat update</div>
    </div>`;

  // ─── PRODUKSI (includes Set Point) ────────────────────
  if (tabId === 'produksi') {
    const hist = p.productionHistory || [];
    const hasSetPoint = p.setPoint && Object.keys(p.setPoint).length > 0;

    if (!hasSetPoint && !hist.length) {
      wrap.innerHTML = emptyMsg('📭 Belum ada data Set Point atau Produksi untuk project ini.');
      return;
    }

    let thead = `<tr>
      <th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>
      <th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">SP Awal</th>`;

    hist.forEach((entry, i) => {
      const dateObj = new Date(entry.saved_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
      thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">
        Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span>
      </th>`;
    });
    thead += `</tr>`;

    let tbody = '';
    let visibleRows = 0;
    
    SP_FIELDS.forEach(f => {
      const baseVal = p.setPoint ? (p.setPoint[f.id] || '') : '';
      let rowHasData = baseVal !== '';
      
      const historyCells = hist.map(entry => {
        const fieldData = entry.fields.find(hf => hf.id === f.id || hf.label === f.label);
        if (fieldData && fieldData.newVal !== '' && fieldData.newVal !== fieldData.oldVal) {
          rowHasData = true;
          return `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${fieldData.newVal}</td>`;
        } else {
          return `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
        }
      });

      if (rowHasData) {
        const unitHtml = f.unit ? ` <span style="font-size:8px;color:var(--txt3);font-weight:400">${f.unit}</span>` : '';
        const baseDisplay = baseVal ? `${baseVal}${unitHtml}` : `<span style="color:var(--txt3)">—</span>`;
        const rowBg = visibleRows % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
        visibleRows++;

        tbody += `<tr style="background:${rowBg};">
          <td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${f.label}</td>
          <td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:var(--txt);white-space:nowrap;background:inherit;">${baseDisplay}</td>
          ${historyCells.join('')}
        </tr>`;
      }
    });

    wrap.innerHTML = `
      <div style="margin-bottom:16px">
        ${tableHeaderUI('⚙️ Data & History Produksi')}
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:60vh;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </div>`;
    return;
  }

  // ─── LAB ─────────────────────────────────────────────
  if (tabId === 'lab') {
    const labHist = p.labHistory || [];
    if (!labHist.length) {
      wrap.innerHTML = emptyMsg('📭 Belum ada data entry Lab untuk project ini.');
      return;
    }

    // Auto mapping / Translate dari data nama Inggris lama ke nama Form Baru
    const mapLabel = (l) => {
        const map = {
            'TLV': 'Nama Sample (Brix)',
            'Lab Code': 'Kode Pile',
            'Air Test': 'Brix',
            'Header Retaking': 'Nama Sample (Moisture)',
            'Sampling Point': 'MC%'
        };
        return map[l] || l;
    };

    const normalizedHist = labHist.map(entry => ({
        ...entry,
        fields: (entry.fields || []).map(f => ({
            ...f,
            label: mapLabel(f.label)
        }))
    }));

    // Pisahkan Label Brix dan Moisture ke dua array berbeda
    const uniqueBrixLabels = [];
    const uniqueMoistLabels = [];

    normalizedHist.forEach(entry => {
      (entry.fields || []).forEach(f => {
        const lbl = f.label;
        // Deteksi apakah ini parameter Brix atau Moisture
        if (lbl.includes('Brix') || lbl.includes('Kode Pile')) {
            if (!uniqueBrixLabels.includes(lbl)) uniqueBrixLabels.push(lbl);
        } else if (lbl.includes('Moisture') || lbl.includes('MC%')) {
            if (!uniqueMoistLabels.includes(lbl)) uniqueMoistLabels.push(lbl);
        } else {
            // Jaga-jaga jika ada label tak terduga, masukkan ke Brix
            if (!uniqueBrixLabels.includes(lbl) && !uniqueMoistLabels.includes(lbl)) uniqueBrixLabels.push(lbl);
        }
      });
    });

    // Buat template Header Kolom (Sama untuk kedua tabel)
    let theadCols = ``;
    normalizedHist.forEach((entry, i) => {
      const dateObj = new Date(entry.saved_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
      theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span></th>`;
    });
    const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;

    // Fungsi pembuat baris tabel (tbody)
    const buildTbody = (labelsArr) => {
      let tbody = '';
      labelsArr.forEach((label, rIdx) => {
        const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
        let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${label}</td>`;
        
        normalizedHist.forEach(entry => {
          const field = (entry.fields || []).find(f => f.label === label);
          if (field && field.newVal !== '') {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${field.newVal}</td>`;
          } else {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
          }
        });
        tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
      });
      return tbody;
    };

    const brixTbody = buildTbody(uniqueBrixLabels);
    const moistTbody = buildTbody(uniqueMoistLabels);

    // Gabungkan menjadi dua tabel terpisah di dalam Summary
    wrap.innerHTML = `
      <div style="margin-bottom:16px">
        ${tableHeaderUI('🧪 Data & History Lab')}
        
        ${uniqueBrixLabels.length > 0 ? `
        <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;margin-top:12px;">
          <span style="font-size:14px;">📊</span> <span style="font-size:12px;font-weight:700;color:var(--txt);">DATA BRIX</span>
        </div>
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:20px;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${brixTbody}</tbody>
          </table>
        </div>
        ` : ''}

        ${uniqueMoistLabels.length > 0 ? `
        <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">💯</span> <span style="font-size:12px;font-weight:700;color:var(--txt);">DATA MOISTURE</span>
        </div>
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${moistTbody}</tbody>
          </table>
        </div>
        ` : ''}

      </div>`;
    return;
  }

  // ─── UTILITY ─────────────────────────────────────────
  if (tabId === 'utility') {
    const utilHist = p.utilityHistory || [];
    if (!utilHist.length) {
      wrap.innerHTML = emptyMsg('📭 Belum ada data entry Utility untuk project ini.');
      return;
    }

    // Separate boiler parameters from other utility parameters
    const boilerKeywords = ['Steam', 'Flue', 'Feed water', 'Scale', 'Overheat', 'Blowdown', 'Conductivity', 'Air pressure', 'Ignition', 'Oil', 'Fuel', 'Efficiency', 'Surface blowdown', 'output'];
    const boilerLabels = [];
    const otherLabels = [];
    
    utilHist.forEach(entry => {
      (entry.fields || []).forEach(f => {
        const isBoiler = boilerKeywords.some(keyword => f.label.includes(keyword));
        if (isBoiler) {
          if (!boilerLabels.includes(f.label)) boilerLabels.push(f.label);
        } else {
          if (!otherLabels.includes(f.label)) otherLabels.push(f.label);
        }
      });
    });

    // Build header columns (same for all tables)
    let theadCols = '';
    utilHist.forEach((entry, i) => {
      const dateObj = new Date(entry.saved_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
      theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span></th>`;
    });
    const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;

    // Function to build table body
    const buildTbody = (labelsArr) => {
      let tbody = '';
      labelsArr.forEach((label, rIdx) => {
        const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
        let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${label}</td>`;
        
        utilHist.forEach(entry => {
          const field = (entry.fields || []).find(f => f.label === label);
          if (field && field.newVal !== '') {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${field.newVal}</td>`;
          } else {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
          }
        });
        tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
      });
      return tbody;
    };

    wrap.innerHTML = `
      <div style="margin-bottom:16px">
        ${tableHeaderUI('⚡ Data & History Utility')}
        
        ${boilerLabels.length > 0 ? `
        <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;margin-top:12px;">
          <span style="font-size:14px;">🔥</span> <span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER BOILER</span>
        </div>
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:20px;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${buildTbody(boilerLabels)}</tbody>
          </table>
        </div>
        ` : ''}

        ${otherLabels.length > 0 ? `
        <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">⚙️</span> <span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER CHILLER</span>
        </div>
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${buildTbody(otherLabels)}</tbody>
          </table>
        </div>
        ` : ''}

      </div>`;
    return;
  }

  // ─── LIMBAH ──────────────────────────────────────────
  if (tabId === 'limbah') {
    const limbahHist = p.limbahHistory || [];
    if (!limbahHist.length) {
      wrap.innerHTML = emptyMsg('📭 Belum ada data entry Limbah untuk project ini.');
      return;
    }

    // Collect all unique labels from limbah history
    const uniqueLabels = [];
    limbahHist.forEach(entry => {
      (entry.fields || []).forEach(f => {
        if (!uniqueLabels.includes(f.label)) uniqueLabels.push(f.label);
      });
    });

    // Build header columns
    let theadCols = '';
    limbahHist.forEach((entry, i) => {
      const dateObj = new Date(entry.saved_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
      theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span></th>`;
    });
    const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;

    // Build table body
    let tbody = '';
    uniqueLabels.forEach((label, rIdx) => {
      const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
      let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${label}</td>`;
      
      limbahHist.forEach(entry => {
        const field = (entry.fields || []).find(f => f.label === label);
        if (field && field.newVal !== '' && field.newVal !== undefined) {
          rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${field.newVal}</td>`;
        } else {
          rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
        }
      });
      tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
    });

    wrap.innerHTML = `
      <div style="margin-bottom:16px">
        ${tableHeaderUI('♻️ Data & History Limbah')}
        <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:60vh;">
          <table style="${tblStyle}">
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </div>`;
    return;
  }

  wrap.innerHTML = '';
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
  // Render existing Harian reports as tables
  renderHarianReports();
  
  const form = document.getElementById("reportForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      id: Date.now(),
      title: document.getElementById("report-title").value.trim(),
      category: document.getElementById("report-category").value,
      priority: document.getElementById("report-priority").value,
      electricity: document.getElementById("report-electricity").value.trim(),
      utility: document.getElementById("report-utility").value,
      stock: document.getElementById("report-stock").value.trim(),
      saved_at: new Date().toISOString()
    };

    // Save to harian_entries
    const harianEntries = JSON.parse(localStorage.getItem('harian_entries') || '[]');
    harianEntries.unshift({
      id: data.id,
      cat: data.category,
      data: {
        'Judul Laporan': data.title,
        'Kategori': data.category,
        'Prioritas': data.priority,
        'Penggunaan Listrik': data.electricity || '—',
        'Durability Utility': data.utility,
        'Stok Barang': data.stock || '—'
      },
      saved_at: data.saved_at,
      projName: 'Laporan Harian' // default project name
    });
    localStorage.setItem('harian_entries', JSON.stringify(harianEntries));

    // Show success message
    showQuickToast('✅ Laporan harian berhasil disimpan!');
    
    // Reset form
    form.reset();
    
    // Re-render the reports
    renderHarianReports();
  });
}

async function renderHarianReports() {
    const container = document.getElementById('harian-reports-container');
    const countLabel = document.getElementById('report-count-label');
    if (!container) return;

    // Map tab ke endpoint API
    const tabEndpoint = {
      'lab':     '/api/dataentry/laboratorium',
      'utility': '/api/dataentry/utility',
      'limbah':  '/api/dataentry/limbah',
    };
    const tabColors = {
      'lab':     { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8', label: 'Lab' },
      'utility': { bg: '#fef08a', border: '#eab308', text: '#713f12', label: 'Utility' },
      'limbah':  { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'Limbah' },
    };

    const endpoint = tabEndpoint[_activeReportTab];
    if (!endpoint) return;

    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--txt3)">⏳ Memuat data...</div>`;

    try {
      const dateFrom = document.getElementById('report-date-from')?.value;
      const dateTo   = document.getElementById('report-date-to')?.value;
      let url = endpoint + '?limit=200';
      if (dateFrom) url += '&tanggal_dari=' + dateFrom;
      if (dateTo)   url += '&tanggal_sampai=' + dateTo;

      const res  = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      let data = json.data || [];
      data = [...data].sort((a, b) => {
        const dA = new Date(a.created_at || a.tanggal);
        const dB = new Date(b.created_at || b.tanggal);
        return _reportSortBy === 'oldest' ? dA - dB : dB - dA;
      });

      if (countLabel) countLabel.textContent = `${data.length} laporan`;

      if (!data.length) {
        container.innerHTML = `
          <div class="de-card" style="text-align:center;padding:60px 20px;background:var(--bg);border:1px dashed var(--border);border-radius:12px">
            <div style="font-size:48px;margin-bottom:16px;opacity:0.2">📭</div>
            <div style="font-size:14px;color:var(--txt2);font-weight:600;margin-bottom:6px">Belum ada laporan untuk ${getTabLabel(_activeReportTab)}</div>
            <div style="font-size:12px;color:var(--txt3)">Data laporan harian akan muncul di sini</div>
          </div>`;
        return;
      }

      const color = tabColors[_activeReportTab] || { bg:'#f3f4f6', border:'#9ca3af', text:'#374151', label:'Data' };
      let html = '<div class="report-grid">';
      data.forEach(entry => {
        const tgl      = entry.tanggal || (entry.created_at ? entry.created_at.substring(0,10) : '—');
        const proj     = entry.project_name || '—';
        const savedAt  = entry.created_at ? new Date(entry.created_at).toLocaleString('id-ID') : '—';
        const notes    = entry.notes || '—';
        html += `
          <div class="report-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">📅 ${tgl} — ${proj}</div>
                <div style="font-size:11px;color:var(--txt3)">🕐 ${savedAt}</div>
              </div>
              <div style="background:${color.bg};color:${color.text};border:1px solid ${color.border};border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600">${color.label}</div>
            </div>
            ${notes !== '—' ? `<div style="font-size:12px;color:var(--txt2);border-top:1px solid var(--border);padding-top:8px;margin-top:4px">📝 ${notes}</div>` : ''}
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;

    } catch(err) {
      console.error('renderHarianReports error:', err);
      container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--red)">❌ Gagal memuat data: ${err.message}</div>`;
    }
}


// ══ REPORTING HELPERS ═════════════════════════════════════════
async function submitReport() {
  const g = id => document.getElementById(id)?.value?.trim();
  const title = g('r-title'), nama = g('r-nama'), desc = g('r-deskripsi');
  if (!title || !nama || !desc) { showRpSt('error', '❌ Please fill in Title, Reporter Name, and Description!'); return; }
  showRpSt('loading', '⏳ Submitting report...');
  try {
    const res = await fetch('/api/dataentry/laporan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        nama,
        shift:     g('r-shift')     || null,
        kategori:  g('r-kategori')  || null,
        prioritas: g('r-prioritas') || null,
        lokasi:    g('r-lokasi')    || null,
        deskripsi: desc,
        aksi:      g('r-aksi')      || null,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal simpan');
    showRpSt('success', '✅ Report submitted successfully!');
    resetReport();
    loadReportHistory();
  } catch(err) {
    console.error('submitReport error:', err);
    showRpSt('error', '❌ Gagal: ' + err.message);
  }
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
async function loadReportHistory() {
  const c = document.getElementById('rp-history'); if (!c) return;
  try {
    const res  = await fetch('/api/dataentry/laporan?limit=50');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    const hist = json.data || [];
    if (!hist.length) { c.innerHTML = '<div class="de-empty">No reports submitted yet</div>'; return; }
    const priColor = {low:'var(--green)', medium:'var(--yellow)', high:'var(--red)'};
    const priLabel = {low:'LOW', medium:'MEDIUM', high:'HIGH'};
    const catLabel = {teknis:'Technical', operasional:'Operational', keamanan:'Security', lingkungan:'Environmental', lainnya:'Other'};
    const shiftLabel = {pagi:'🌅 Morning', siang:'☀️ Afternoon', malam:'🌙 Night'};
    c.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' +
      hist.map(r => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-left:3px solid ${priColor[r.prioritas]||'var(--blue)'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">
            <div style="font-weight:700;font-size:13px;color:var(--txt)">${r.title}</div>
            ${r.prioritas ? `<div style="font-size:10px;font-weight:700;color:${priColor[r.prioritas]||'var(--blue)'};background:${priColor[r.prioritas]||'var(--blue)'}15;padding:2px 8px;border-radius:4px">${priLabel[r.prioritas]||r.prioritas}</div>` : ''}
          </div>
          <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">
            👤 ${r.nama} ${r.shift ? '• '+shiftLabel[r.shift] : ''} ${r.kategori ? '• '+catLabel[r.kategori] : ''} ${r.lokasi ? '• 📍 '+r.lokasi : ''}
          </div>
          <div style="font-size:12px;color:var(--txt2)">${r.deskripsi}</div>
          ${r.aksi ? `<div style="font-size:11px;color:var(--txt3);margin-top:6px;border-top:1px solid var(--border);padding-top:6px">⚡ ${r.aksi}</div>` : ''}
          <div style="font-size:10px;color:var(--txt3);margin-top:6px">${new Date(r.created_at).toLocaleString('id-ID')}</div>
        </div>`).join('') + '</div>';
  } catch(err) {
    c.innerHTML = `<div style="color:var(--red);font-size:12px">❌ Gagal memuat: ${err.message}</div>`;
  }
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

// ── openCIP_enh / closeCIP_enh / saveCIP_enh ─────────────────
function openCIP_enh(type, idx) {
  _cipPJIdx = idx;
  const sel = document.getElementById('dep-proj-sel-' + type);
  if (sel) sel.value = idx;
  openCIPModal(type);
}
function closeCIP_enh(type) { closeCIPModal(); }
async function saveCIP_enh(type, isFinish) { await saveCIPModal(type, isFinish); }

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
    <button type="button" class="de-btn de-btn-primary" style="padding:8px 18px; position:relative; z-index:10; cursor:pointer;" onclick="openKartuStokForm()">＋ Tambah Entri</button>
  </div>

  <div class="de-card" style="padding:14px 18px;margin-bottom:0;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input class="de-input" id="ks-search" placeholder="🔍 Cari nama barang..." style="flex:1;min-width:180px" oninput="renderKartuStok()">
    <select class="de-input de-select" id="ks-filter-type" style="width:160px" onchange="renderKartuStok()">
      <option value="">Semua Tipe</option>
      <option value="in">📥 Masuk</option>
      <option value="out">📤 Keluar</option>
    </select>
  </div>

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

  <div class="proj-modal-overlay" id="ks-modal-overlay" style="display:none;">
    <div class="proj-modal" style="max-width:500px">
      <div class="proj-modal-head">
        <div class="proj-modal-title" id="ks-modal-title">📦 Tambah Entri Stok</div>
        <button type="button" class="proj-modal-close" onclick="closeKartuStokForm()">✕</button>
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
          <button type="button" class="de-btn de-btn-ghost" onclick="closeKartuStokForm()">Batal</button>
          <button type="button" class="de-btn de-btn-primary" onclick="submitKartuStok()">💾 Simpan</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
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
  
  // 💡 FIX: Paksa muncul dengan gaya display inline
  const modal = document.getElementById('ks-modal-overlay');
  if(modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
  }
}

function closeKartuStokForm() {
  // 💡 FIX: Paksa sembunyikan sepenuhnya
  const modal = document.getElementById('ks-modal-overlay');
  if(modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
  }
  _ksEditIdx = -1;
}

// ── Kartu Stok localStorage helpers ──────────────────────────
function gKS()       { try { return JSON.parse(localStorage.getItem('sail_kartu_stok') || '[]'); } catch { return []; } }
function sKS(list)   { localStorage.setItem('sail_kartu_stok', JSON.stringify(list)); }

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
function gSJ()       { try { return JSON.parse(localStorage.getItem('sail_surat_jalan') || '[]'); } catch { return []; } }
function sSJ(list)   { localStorage.setItem('sail_surat_jalan', JSON.stringify(list)); }
window.gSJ = gSJ;
window.sSJ = sSJ;

function getSuratJalanHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div><div class="de-title">Surat Jalan</div><div class="de-sub">SAIL / Reporting / Surat Jalan</div></div>
    <button type="button" class="de-btn de-btn-primary" onclick="openSuratJalanForm()">＋ Buat Surat Jalan</button>
  </div>

  <div id="sj-list" style="display:flex;flex-direction:column;gap:12px"></div>
  <div id="sj-empty" style="display:none">
    <div class="de-card" style="text-align:center;padding:48px">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div style="font-size:13px;color:var(--txt3)">Belum ada surat jalan — klik <strong>＋ Buat Surat Jalan</strong>.</div>
    </div>
  </div>

  <div class="proj-modal-overlay" id="sj-modal-overlay" style="display:none;">
    <div class="proj-modal" style="max-width:600px">
      <div class="proj-modal-head">
        <div class="proj-modal-title" id="sj-modal-title">📋 Buat Surat Jalan</div>
        <button type="button" class="proj-modal-close" onclick="closeSuratJalanForm()">✕</button>
      </div>
      <div class="proj-modal-body">
        <div class="de-grid">
          <div class="de-field"><label class="de-label">TANGGAL</label><input class="de-input" id="sj-f-date" type="date"></div>
          <div class="de-field"><label class="de-label">NO. SURAT JALAN</label><input class="de-input" id="sj-f-no" type="text" placeholder="Otomatis atau isi manual"></div>
          <div class="de-field"><label class="de-label">NOPOL / KENDARAAN</label><input class="de-input" id="sj-f-kendaraan" type="text" placeholder="B 1234 XY / Nama ekspedisi..."></div>
          <div class="de-field"><label class="de-label">DRIVER</label><input class="de-input" id="sj-f-driver" type="text" placeholder="Nama driver..."></div>
          <div class="de-field de-full"><label class="de-label">TUJUAN *</label><input class="de-input" id="sj-f-penerima" type="text" placeholder="Nama perusahaan atau orang..."></div>
          <div class="de-field de-full"><label class="de-label">PENGIRIM (Gudang)</label><input class="de-input" id="sj-f-pengirim" type="text" placeholder="Nama pengirim dari gudang..."></div>
        </div>

        <div style="margin:14px 0 8px;font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase">Daftar Barang</div>
        <div style="display:grid;grid-template-columns:2fr 80px 1fr;gap:6px;padding:6px 10px;background:var(--bg);border-radius:6px 6px 0 0;border:1px solid var(--border);border-bottom:none;">
          <div style="font-size:9px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;">NAMA BARANG</div>
          <div style="font-size:9px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;">QTY</div>
          <div style="font-size:9px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;">KETERANGAN</div>
        </div>
        <div id="sj-items"></div>
        <button type="button" class="de-btn de-btn-ghost" style="width:100%;margin-bottom:14px;font-size:12px;" onclick="addSuratJalanItem()">＋ Tambah Barang</button>

        <div class="de-field de-full"><label class="de-label">CATATAN</label><textarea class="de-input de-textarea" id="sj-f-notes" style="min-height:56px" placeholder="Catatan tambahan..."></textarea></div>
        <div class="de-status-bar" id="sj-sb" style="display:none"><span id="sj-sm"></span></div>
        <div class="de-actions" style="margin-top:16px">
          <button type="button" class="de-btn de-btn-ghost" onclick="closeSuratJalanForm()">Batal</button>
          <button type="button" class="de-btn de-btn-primary" onclick="submitSuratJalan()">💾 Simpan Surat Jalan</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
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
    document.getElementById('sj-f-kendaraan').value = sj.kendaraan || '';
    document.getElementById('sj-f-driver').value    = sj.driver || '';
    document.getElementById('sj-f-pengirim').value  = sj.pengirim || '';
    document.getElementById('sj-f-notes').value     = sj.notes || '';
    (sj.items||[]).forEach(it => addSuratJalanItem(it));
  } else {
    document.getElementById('sj-modal-title').textContent = '📋 Buat Surat Jalan';
    document.getElementById('sj-f-no').value = genSJNo();
    document.getElementById('sj-f-date').value = today;
    ['sj-f-penerima','sj-f-kendaraan','sj-f-driver','sj-f-pengirim','sj-f-notes'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
    addSuratJalanItem();
  }
  const modal = document.getElementById('sj-modal-overlay');
  if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
}

function closeSuratJalanForm() {
  // 💡 FIX: Sembunyikan total dengan display none
  const modal = document.getElementById('sj-modal-overlay');
  if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
  }
  _sjEditIdx = -1;
}

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
          <div style="font-size:14px;font-weight:700;color:var(--txt)">→ ${sj.penerima}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">📅 ${sj.date} &nbsp;•&nbsp; 🚚 ${sj.kendaraan||'—'} &nbsp;•&nbsp; 🧑 ${sj.driver||sj.pengirim||'—'}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="pj-btn" style="border-color:#dc2626;color:#dc2626;background:#fff5f5;" onclick="downloadSuratJalanPDF(${idx})">📄 PDF</button>
          <button class="pj-btn pj-btn-edit" onclick="editSuratJalan(${idx})">✏️ Edit</button>
          <button class="pj-btn pj-btn-end" onclick="deleteSuratJalan(${idx})">🗑️</button>
        </div>
      </div>
      ${sj.items?.length ? `
      <div style="margin-top:12px;overflow-x:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:var(--bg)">
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">No</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Nama Barang</th>
            <th style="padding:7px 10px;text-align:center;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">QTY</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Keterangan</th>
          </tr></thead>
          <tbody>${sj.items.map((it,i) => `
            <tr style="background:${i%2===0?'white':'#f9fafb'}">
              <td style="padding:7px 10px;color:var(--txt3)">${i+1}</td>
              <td style="padding:7px 10px;color:var(--txt);font-weight:600">${it.name||'—'}</td>
              <td style="padding:7px 10px;text-align:center;font-family:'DM Mono',monospace;font-weight:600;color:var(--blue)">${it.qty||'—'}</td>
              <td style="padding:7px 10px;color:var(--txt2)">${it.desc||'—'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>` : ''}
      ${sj.notes ? `<div style="margin-top:10px;font-size:11px;color:var(--txt3);padding:8px 12px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">📝 ${sj.notes}</div>` : ''}
    </div>`).join('');
}
function downloadSuratJalanPDF(idx) {
  const sj = gSJ()[idx];
  if (!sj) return;

  // Format tanggal: dd MMMM yyyy (Indonesia)
  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
  };

  // Baris barang — minimal 8 baris agar tabel penuh seperti template
  const MIN_ROWS = 8;
  const items = sj.items || [];
  let rowsHTML = items.map((it, i) => `
    <tr>
      <td style="border:1px solid #333;padding:5px 8px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #333;padding:5px 8px;">${it.name||''}</td>
      <td style="border:1px solid #333;padding:5px 8px;text-align:center;">${it.qty||''}</td>
      <td style="border:1px solid #333;padding:5px 8px;">${it.desc||''}</td>
    </tr>`).join('');
  // Tambah baris kosong
  for (let i = items.length; i < MIN_ROWS; i++) {
    rowsHTML += `<tr>
      <td style="border:1px solid #333;padding:5px 8px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #333;padding:5px 8px;">&nbsp;</td>
      <td style="border:1px solid #333;padding:5px 8px;">&nbsp;</td>
      <td style="border:1px solid #333;padding:5px 8px;">&nbsp;</td>
    </tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Jalan ${sj.no}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:12px; color:#000; background:#fff; padding:20px 28px; }
    .page { max-width:740px; margin:0 auto; }

    /* Header */
    .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #333; padding-bottom:10px; margin-bottom:14px; }
    .logo-area { display:flex; align-items:center; gap:10px; }
    .logo-box { width:70px; height:60px; border:1px solid #aaa; display:flex; align-items:center; justify-content:center; font-size:9px; color:#666; text-align:center; border-radius:4px; }
    .company-name { font-size:13px; font-weight:700; line-height:1.4; }
    .company-sub { font-size:9px; color:#555; }
    .doc-title { font-size:22px; font-weight:700; letter-spacing:2px; text-align:right; }

    /* Info fields */
    .info-table { width:100%; margin-bottom:14px; }
    .info-table td { padding:3px 6px; vertical-align:top; font-size:12px; }
    .info-table td.lbl { width:130px; font-weight:600; }
    .info-table td.sep { width:14px; text-align:center; }
    .info-table td.val { border-bottom:1px solid #aaa; min-width:180px; }
    .info-right td.lbl { text-align:right; }

    /* Items table */
    .items-table { width:100%; border-collapse:collapse; margin-bottom:18px; }
    .items-table thead tr { background:#3a4a5c; color:#fff; }
    .items-table th { border:1px solid #333; padding:7px 8px; text-align:center; font-size:11px; }
    .items-table td { border:1px solid #333; padding:5px 8px; font-size:11px; }

    /* Signatures */
    .sig-row { display:flex; gap:0; border:1px solid #333; }
    .sig-box { flex:1; padding:10px 14px; min-height:80px; border-right:1px solid #333; }
    .sig-box:last-child { border-right:none; }
    .sig-title { font-size:11px; font-weight:700; margin-bottom:6px; }
    .sig-name { font-size:11px; margin-top:4px; min-height:50px; }

    .note-area { font-size:11px; margin-bottom:10px; }

    @media print {
      body { padding:10px 16px; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-box">PT SILIWANGI<br>AGRO<br>INDO LESTARI</div>
    </div>
    <div class="doc-title">SURAT JALAN</div>
  </div>

  <!-- ── INFO ── -->
  <table class="info-table" style="margin-bottom:6px;">
    <tr>
      <td class="lbl">Tanggal</td>
      <td class="sep">:</td>
      <td class="val">${fmtDate(sj.date)}</td>
      <td style="width:40px"></td>
      <td class="lbl" style="text-align:right">Tujuan</td>
      <td class="sep">:</td>
      <td class="val" style="min-width:200px;">${sj.penerima||''}</td>
    </tr>
    <tr>
      <td class="lbl">No. SJ</td>
      <td class="sep">:</td>
      <td class="val">${sj.no||''}</td>
      <td></td>
      <td></td><td></td><td></td>
    </tr>
    <tr>
      <td class="lbl">Nopol / Kendaraan</td>
      <td class="sep">:</td>
      <td class="val">${sj.kendaraan||''}</td>
      <td></td>
      <td></td><td></td><td></td>
    </tr>
    <tr>
      <td class="lbl">Driver</td>
      <td class="sep">:</td>
      <td class="val">${sj.driver||''}</td>
      <td></td>
      <td></td><td></td><td></td>
    </tr>
  </table>

  <div style="font-size:12px;margin-bottom:8px;">Dikirimkan barang-barang sebagai berikut :</div>

  <!-- ── ITEMS TABLE ── -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px;">No</th>
        <th>Nama Barang</th>
        <th style="width:80px;">QTY</th>
        <th style="width:220px;">Keterangan</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>

  ${sj.notes ? `<div class="note-area">Catatan: ${sj.notes}</div>` : ''}

  <!-- ── SIGNATURES ── -->
  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-title">Gudang</div>
      <div class="sig-name">${sj.pengirim||''}</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Driver</div>
      <div class="sig-name">${sj.driver||''}</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Diterima Oleh</div>
      <div class="sig-name"></div>
    </div>
  </div>

</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type:'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Fallback: download langsung sebagai file
    const a = document.createElement('a');
    a.href = url; a.download = `Surat_Jalan_${sj.no.replace(/\//g,'-')}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
window.downloadSuratJalanPDF = downloadSuratJalanPDF;

function addSuratJalanItem(data=null) {
  const uid = ++_sjItemCount;
  const container = document.getElementById('sj-items');
  if (!container) return;
  const row = document.createElement('div');
  row.id = 'sj-item-'+uid;
  row.style.cssText = 'display:grid;grid-template-columns:2fr 80px 1fr auto;gap:6px;align-items:center;margin-bottom:4px;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-top:none;';
  row.innerHTML = `
    <input class="de-input" id="sj-i-name-${uid}" value="${data?.name||''}" placeholder="Nama barang..." style="margin:0">
    <input class="de-input" id="sj-i-qty-${uid}" type="number" value="${data?.qty||''}" placeholder="0" min="0" style="margin:0;text-align:center">
    <input class="de-input" id="sj-i-desc-${uid}" value="${data?.desc||''}" placeholder="Keterangan..." style="margin:0">
    <button class="fp-item-remove" onclick="document.getElementById('sj-item-${uid}').remove()" title="Hapus" style="margin:0">✕</button>`;
  container.appendChild(row);
}

function submitSuratJalan() {
  const penerima = document.getElementById('sj-f-penerima')?.value.trim();
  if (!penerima) { showSjSt('error','❌ Tujuan wajib diisi!'); return; }
  const items = [];
  document.querySelectorAll('#sj-items > div[id^="sj-item-"]').forEach(row => {
    const uid = row.id.replace('sj-item-','');
    items.push({
      name: document.getElementById('sj-i-name-'+uid)?.value.trim() || '',
      qty:  document.getElementById('sj-i-qty-'+uid)?.value || '',
      desc: document.getElementById('sj-i-desc-'+uid)?.value.trim() || '',
    });
  });
  const entry = {
    id:         _sjEditIdx>=0 ? gSJ()[_sjEditIdx].id : Date.now(),
    no:         document.getElementById('sj-f-no')?.value.trim() || genSJNo(),
    date:       document.getElementById('sj-f-date')?.value || '',
    penerima,
    kendaraan:  document.getElementById('sj-f-kendaraan')?.value.trim() || '',
    driver:     document.getElementById('sj-f-driver')?.value.trim() || '',
    pengirim:   document.getElementById('sj-f-pengirim')?.value.trim() || '',
    notes:      document.getElementById('sj-f-notes')?.value.trim() || '',
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

function switchReportTab(tab, el) {
    _activeReportTab = tab;
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderHarianReports();
}

function changeReportSort(sortBy) {
    _reportSortBy = sortBy;
    renderHarianReports();
}

function clearDateFilters() {
    const dateFrom = document.getElementById('report-date-from');
    const dateTo = document.getElementById('report-date-to');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    renderHarianReports();
}

function getTabLabel(tab) {
    const labels = {
        'produksi': 'Produksi',
        'lab': 'Lab',
        'utility': 'Utility',
        'limbah': 'Limbah'
    };
    return labels[tab] || tab;
}

window.editSuratJalan   = editSuratJalan;
window.deleteSuratJalan = deleteSuratJalan;
window.addSuratJalanItem = addSuratJalanItem;
window.checkVacuum = checkVacuum;
window.handlePhotoUpload = handlePhotoUpload;
window.switchReportTab = switchReportTab;
window.changeReportSort = changeReportSort;
window.clearDateFilters = clearDateFilters;