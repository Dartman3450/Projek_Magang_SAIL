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
  scientist:  ['iot', 'laboratorium', 'organoleptic', 'reporting', 'change-password'],
  utility:    ['iot', 'utility',      'organoleptic', 'reporting', 'change-password'],
  limbah:     ['iot', 'limbah',       'organoleptic', 'reporting', 'change-password'],
  Produksi:   ['iot', 'production', 'ongoing', 'organoleptic', 'reporting', 'change-password'],
  display:    ['iot'],  // hanya dashboard IoT
};
// ───────────────────────────────────────────────────────────────────

// ── Display mode: hide semua nav kecuali IoT, sidebar collapsed ──
function applyDisplayMode() {
  const role = window.SAIL_USER?.role || localStorage.getItem('role') || '';
  if (role !== 'display') return;

  // Sembunyikan semua section label dan nav group kecuali Main Menu + IoT
  document.querySelectorAll('.nav-section-label').forEach(el => {
    if (el.textContent.trim() === 'Main Menu') return;
    el.style.display = 'none';
  });
  document.querySelectorAll('.nav-group, .nav-item').forEach(el => {
    if (el.dataset.page === 'iot' || el.classList.contains('active')) return;
    // Sembunyikan semua nav-item dan nav-group selain IoT
    if (!el.querySelector('[data-page="iot"]') && el.dataset.page !== 'iot') {
      el.style.display = 'none';
    }
  });
  // Sembunyikan logout button
  const footer = document.querySelector('.sidebar-footer');
  if (footer) footer.style.display = 'none';

  // Collapse sidebar by default
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-toggle-btn');
  if (sidebar) sidebar.classList.add('collapsed');
  if (btn) btn.textContent = '▶';
  document.body.classList.add('sidebar-collapsed');
  console.log('📺 Display mode aktif — sidebar collapsed, menu disembunyikan');
}

function loadPage(page) {
  // Cek role-based access
  const role = window.SAIL_USER?.role || localStorage.getItem('role') || '';
  const allowed = ROLE_ACCESS[role];
  if (allowed && !allowed.includes(page)) {
    console.warn(`🚫 Role "${role}" tidak punya akses ke "${page}"`);
    return;
  }
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
    organoleptic: ['Organoleptic Test Panel', 'SAIL / QC / Organoleptic'],
    reporting:['Reporting','SAIL / Reporting'],
    'project-reporting':['Laporan Project','SAIL / Reporting / Project'],
    'change-email':['Change Email','SAIL / Setting / Email'],
    'change-password':['Change Password','SAIL / Setting / Password'],
    'tank-dimension-setting':['Change Containers Volume','SAIL / Setting / Sensor Manager'],
    'kartu-stok':['Stock Card','SAIL / Gudang / Stock Card'],
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
    // ── Simpan state form lab KE sessionStorage SEBELUM DOM dihancurkan ──
    // Ini satu-satunya tempat yang PASTI jalan sebelum content.innerHTML di-replace
    Object.values(window._labCollectState || {}).forEach(fn => { try { fn(); } catch {} });
    content.innerHTML = getDataEntryLaboratorium('laboratorium','Data Entry Laboratory','Record daily laboratory data','🧪'); initDataEntryForm('laboratorium');
  } else if (page === 'limbah') {
    content.innerHTML = getDataEntryLimbah('limbah','Data Entry Waste','Record daily waste data','♻️'); initDataEntryForm('limbah');
  } else if (page === 'change-password') {
    content.innerHTML = getChangePasswordHTML();
  } else if (page === 'tank-dimension-setting') {
    content.innerHTML = getTankDimensionHTML();
    initTankDimensionSetting();
    } else if (page === 'organoleptic') {
    content.innerHTML = getOrganolepticHTML();
    initOrganoleptic();
  } else if (page === 'reporting') {
    content.innerHTML = getReporting();
    initReportingForm();
  } else if (page === 'project-reporting') {
    content.innerHTML = '<div id="project-report-wrap"></div>';
    initProjectReportPage();
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
            <button class="report-tab active" id="htab-lab" data-tab="lab" onclick="if(window.switchReportTab)switchReportTab('lab')">
                <span style="font-size:16px">🧪</span> Lab
            </button>
            <button class="report-tab" id="htab-utility" data-tab="utility" onclick="if(window.switchReportTab)switchReportTab('utility')">
                <span style="font-size:16px">⚡</span> Utility
            </button>
            <button class="report-tab" id="htab-limbah" data-tab="limbah" onclick="if(window.switchReportTab)switchReportTab('limbah')">
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