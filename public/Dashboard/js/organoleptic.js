// ══════════════════════════════════════════════════════════════════
//  ORGANOLEPTIC TEST PANEL — js/organoleptic.js
//  v3.0 — Account-based lock, fixed HTML layout, full DB integration
//  Requires: /api/organoleptic (GET, POST, PUT /:id, DELETE /:id)
//  User identity: reads from window.SAIL_USER (injected by server in HTML)
//                 fallback: #sidebar-username element text
// ══════════════════════════════════════════════════════════════════

// ── User Identity — SAIL logged-in account ──────────────────────────
// Server harus inject: <script>window.SAIL_USER = { username:'budi', name:'Budi Santoso', role:'scientist' };</script>
function orgGetCurrentUser() {
  // 1) Pakai window.SAIL_USER (injected by EJS/server)
  if (window.SAIL_USER && window.SAIL_USER.username) {
    return window.SAIL_USER.username;
  }
  // 2) Fallback: cari elemen sidebar yang menampilkan nama/username
  const el = document.getElementById('sidebar-username')
          || document.getElementById('user-display-name')
          || document.querySelector('[data-user]');
  if (el) {
    const txt = (el.dataset.user || el.textContent || '').trim();
    if (txt) return txt;
  }
  // 3) Last fallback: session cookie atau localStorage yang di-set saat login
  return localStorage.getItem('sail_username') || '';
}

function orgGetCurrentUserDisplay() {
  if (window.SAIL_USER) {
    return window.SAIL_USER.name || window.SAIL_USER.username || '';
  }
  return orgGetCurrentUser();
}

// Cek apakah user ini sudah mengisi test tertentu (berdasarkan username akun)
function orgHasFilledTest(test) {
  const me = orgGetCurrentUser();
  if (!me) return false;
  return (test.assessments || []).some(a => a.accountUser === me || a.panelName === me);
}

function orgGetUserPanelNo(test) {
  const me = orgGetCurrentUser();
  if (!me) return null;
  const a = (test.assessments || []).find(a => a.accountUser === me || a.panelName === me);
  return a ? a.panelNo : null;
}

// ── API Layer ─────────────────────────────────────────────────────────
const ORG_LS_KEY   = 'organoleptic_tests_v2';
let   _orgUseAPI   = true; // reset ke true setiap load — jangan persistent false

async function orgApiCall(path = '', method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api/organoleptic' + path, opts);
    if (res.status === 404 || res.status === 501) { _orgUseAPI = false; return null; }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _orgUseAPI = true; // reset kalau berhasil
    return await res.json();
  } catch (e) {
    console.warn('orgApiCall error:', e.message);
    return null; // jangan matikan _orgUseAPI permanen
  }
}

async function orgGetAll() {
  if (_orgUseAPI) {
    const data = await orgApiCall();
    if (data && Array.isArray(data)) {
      // Selalu prioritaskan data dari API — ini sumber kebenaran tunggal
      // agar survey dari perangkat/akun lain selalu terlihat
      localStorage.setItem(ORG_LS_KEY, JSON.stringify(data));
      return data;
    }
  }
  // Fallback ke localStorage kalau API tidak tersedia
  try { return JSON.parse(localStorage.getItem(ORG_LS_KEY) || '[]'); }
  catch { return []; }
}

async function orgSave(test) {
  // Selalu update localStorage dulu sebagai guard
  const allLS = JSON.parse(localStorage.getItem(ORG_LS_KEY) || '[]');
  if (test._id) {
    const i = allLS.findIndex(t => String(t._id) === String(test._id));
    if (i >= 0) allLS[i] = test; else allLS.push(test);
  } else {
    test._id = 'local_' + Date.now();
    allLS.push(test);
  }
  localStorage.setItem(ORG_LS_KEY, JSON.stringify(allLS));

  if (_orgUseAPI && test._id) {
    const res = test._id.toString().startsWith('local_')
      ? await orgApiCall('', 'POST', test)
      : await orgApiCall('/' + test._id, 'PUT', test);
    if (res) {
      // Update localStorage dengan data dari API (termasuk _id asli jika baru)
      const newAll = JSON.parse(localStorage.getItem(ORG_LS_KEY) || '[]');
      const idx = newAll.findIndex(t => String(t._id) === String(test._id));
      if (idx >= 0) newAll[idx] = res; else newAll.push(res);
      localStorage.setItem(ORG_LS_KEY, JSON.stringify(newAll));
      return res;
    }
    // API gagal (misal 500) — data sudah aman di localStorage, return dari sana
    console.warn('orgSave: API gagal, data disimpan lokal sementara.');
  }
  return test;
}

async function orgDelete(id) {
  if (_orgUseAPI) await orgApiCall('/' + id, 'DELETE');
  const all = JSON.parse(localStorage.getItem(ORG_LS_KEY) || '[]');
  localStorage.setItem(ORG_LS_KEY, JSON.stringify(all.filter(t => t._id !== id)));
}

// ── Category Definitions ─────────────────────────────────────────────
const ORG_CAT_KEY     = 'org_custom_categories';
const ORG_DEL_CAT_KEY = 'org_deleted_default_categories';

const ORG_DEFAULT_CATS = [
  { value: 'teh-hijau',       label: '🍵 Teh Hijau',                  type: 'teh'  },
  { value: 'oolong',          label: '🍵 Oolong',                      type: 'teh'  },
  { value: 'black-tea',       label: '🍵 Black Tea',                   type: 'teh'  },
  { value: 'roasted-jasmine', label: '🍵 Roasted Green Tea Jasmine',   type: 'teh'  },
  { value: 'robusta',         label: '☕ Kopi Robusta',                 type: 'kopi' },
  { value: 'arabika',         label: '☕ Kopi Arabika',                 type: 'kopi' },
];

function orgGetCats() {
  const deleted = JSON.parse(localStorage.getItem(ORG_DEL_CAT_KEY) || '[]');
  const custom  = JSON.parse(localStorage.getItem(ORG_CAT_KEY) || '[]');
  return [
    ...ORG_DEFAULT_CATS.filter(c => !deleted.includes(c.value)),
    ...custom,
  ];
}

function orgGetCatType(value) {
  return (orgGetCats().find(c => c.value === value) || {}).type || 'kopi';
}

function orgGetCatLabel(value) {
  return (orgGetCats().find(c => c.value === value) || { label: value }).label;
}

// ── Attribute Definitions ─────────────────────────────────────────────
// Skala 1–5 : 1 = less/rendah, 5 = very/sangat tinggi
const ORG_ATTRS = {
  teh: [
    { key: 'bitterness', label: 'Bitterness', icon: '🍵', hint: 'Tingkat kepahitan' },
    { key: 'astringent', label: 'Astringent',  icon: '🌿', hint: 'Tingkat sepet/astringen' },
    { key: 'sweet',      label: 'Sweet',       icon: '🍬', hint: 'Tingkat kemanisan' },
    { key: 'grassy',     label: 'Grassy',      icon: '🌱', hint: 'Aroma/rasa rumput segar' },
    { key: 'smoky',      label: 'Smoky',       icon: '💨', hint: 'Intensitas aroma asap' },
    { key: 'aroma',      label: 'Aroma',       icon: '🌸', hint: 'Intensitas aroma keseluruhan' },
    { key: 'mouthFeel',  label: 'Mouth Feel',  icon: '💧', hint: 'Sensasi/tekstur di mulut' },
  ],
  kopi: [
    { key: 'aroma',      label: 'Aroma',       icon: '👃', hint: 'Intensitas aroma' },
    { key: 'flavour',    label: 'Flavour',     icon: '☕', hint: 'Kekayaan & kedalaman rasa' },
    { key: 'sour',       label: 'Sour',        icon: '🍋', hint: 'Tingkat keasaman' },
    { key: 'bitter',     label: 'Bitter',      icon: '🫘', hint: 'Tingkat kepahitan' },
    { key: 'cleanest',   label: 'Cleanest',    icon: '✨', hint: 'Kebersihan / kejernihan rasa' },
    { key: 'saltinest',  label: 'Saltinest',   icon: '🧂', hint: 'Tingkat keasinan' },
    { key: 'mouthFeel',  label: 'Mouth Feel',  icon: '💧', hint: 'Sensasi/tekstur di mulut' },
  ],
};
const ORG_SCALE_MAX = 5; // skala penilaian 1–5

// ── Sample Number Generator ──────────────────────────────────────────
function orgGenSampleNo(all) {
  const now  = new Date();
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const suffix = `${dd}${mm}${yyyy}`;
  const today  = (all || []).filter(t => (t.sampleNo || '').endsWith('-' + suffix));
  return `${String(today.length + 1).padStart(3, '0')}-${suffix}`;
}

// ── HTML Escape ──────────────────────────────────────────────────────
function orgEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Active tab + poll ────────────────────────────────────────────────
let _orgTab       = 'panel';
let _orgPollTimer = null;

// ══════════════════════════════════════════════════════════════════
//  1. MAIN PAGE HTML  — FIXED: semua div ditutup dengan benar
// ══════════════════════════════════════════════════════════════════
function getOrganolepticHTML() {
  const userName    = orgGetCurrentUserDisplay() || 'Belum dikenali';
  const userAccount = orgGetCurrentUser() || '';

  return `
<div class="de-wrap" id="org-wrap">

  <!-- ── Header ── -->
  <div class="de-header">
    <div>
      <h2 class="de-title">Organoleptic Test Panel</h2>
      <p class="de-sub">SAIL / QC / Organoleptic</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
      <span id="org-user-name-badge"
        style="font-size:12px;color:var(--txt2);background:var(--bg);border:1px solid var(--border);
               padding:5px 12px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:6px;">
        👤 <span id="org-badge-name">${orgEsc(userName)}</span>
      </span>
      ${(['utility','Produksi','scientist','limbah'].includes(localStorage.getItem('role') || '')) ? '' : `
      <button class="de-btn de-btn-primary" onclick="orgOpenAddModal()"
        style="display:flex;align-items:center;gap:8px;padding:10px 20px;font-size:13px;font-weight:700;white-space:nowrap;">
        ＋ Tambah Tes
      </button>
      `}
    </div>
  </div>

  <!-- ── Sub-tabs ── -->
  <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border);overflow-x:auto;">
    <button id="org-tab-panel"   class="org-tab active" onclick="orgSwitchTab('panel')">🧪 Tes Panel</button>
    <button id="org-tab-summary" class="org-tab"        onclick="orgSwitchTab('summary')">📊 Summary</button>
  </div>

  <!-- ── Tab Contents ── -->
  <div id="org-panel-content">
    <div id="org-panel-list"></div>
  </div>
  <div id="org-summary-content" style="display:none;">
    <div id="org-summary-body"></div>
  </div>

</div>

<style>
/* ── Tab ──────────────────────────────── */
.org-tab {
  padding:10px 22px; background:transparent; border:none;
  border-bottom:3px solid transparent; color:var(--txt3);
  font-size:13px; font-weight:700; cursor:pointer; transition:all .2s;
  white-space:nowrap; display:flex; align-items:center; gap:6px; margin-bottom:-2px;
}
.org-tab:hover  { color:var(--txt); background:var(--surface); border-radius:8px 8px 0 0; }
.org-tab.active { color:var(--blue); border-bottom-color:var(--blue); background:var(--surface); border-radius:8px 8px 0 0; }

/* ── Card ─────────────────────────────── */
.org-card {
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  padding:16px 18px; margin-bottom:12px; position:relative; transition:all .2s; overflow:hidden;
}
.org-card:hover { border-color:var(--blue); box-shadow:0 4px 16px rgba(43,125,233,.09); }
.org-card-accent { position:absolute;top:0;left:0;bottom:0;width:4px;border-radius:12px 0 0 12px; }
.org-card-header { display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px; }
.org-sample-name { font-size:15px;font-weight:800;color:var(--txt);line-height:1.2;margin-bottom:3px; }
.org-sample-no   { font-family:'DM Mono',monospace;font-size:10px;font-weight:700;color:var(--txt3);
                   background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:2px 7px; }
.org-status-badge{ font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;white-space:nowrap; }
.org-progress-wrap{ background:var(--bg);border-radius:99px;height:5px;overflow:hidden;margin:8px 0 4px; }
.org-progress-bar { height:100%;border-radius:99px;transition:width .4s; }
.org-actions { display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center; }

/* ── Filled badge ─────────────────────── */
.org-filled-badge {
  background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px;
  padding:8px 14px; font-size:12px; font-weight:700; color:#166534;
  display:flex; align-items:center; gap:6px; flex:1;
}

/* ── Panel dots ───────────────────────── */
.org-dot-row { display:flex;gap:5px;flex-wrap:wrap;margin:6px 0; }
.org-dot {
  width:26px;height:26px;border-radius:50%;border:2px solid var(--border);
  background:var(--bg);display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;color:var(--txt3);transition:all .2s;
  position:relative; cursor:default;
}
.org-dot.done    { background:var(--green);border-color:var(--green);color:#fff; }
.org-dot.mine    { background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 0 0 3px rgba(43,125,233,.2); }

/* ── Modal ────────────────────────────── */
.org-modal-overlay {
  position:fixed;inset:0;background:rgba(0,0,0,.52);display:flex;
  align-items:center;justify-content:center;z-index:9999;padding:16px;
  animation:orgFadeIn .15s ease;
}
@keyframes orgFadeIn  { from{opacity:0}   to{opacity:1} }
@keyframes orgSlideUp { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
.org-modal {
  background:var(--surface);border-radius:16px;width:100%;max-width:480px;
  max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.28);
  animation:orgSlideUp .2s ease;
}
.org-modal-lg { max-width:560px; }
.org-modal-head {
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 22px 0;margin-bottom:16px;
}
.org-modal-title { font-size:16px;font-weight:800;color:var(--txt); }
.org-modal-close {
  width:30px;height:30px;border:none;background:var(--bg);border-radius:7px;
  cursor:pointer;font-size:15px;color:var(--txt3);display:flex;align-items:center;justify-content:center;
}
.org-modal-close:hover { background:var(--border);color:var(--txt); }
.org-modal-body { padding:0 22px 22px; }

/* ── Attribute rating block ───────────── */
.org-attr-block {
  background:var(--bg);border:1px solid var(--border);border-radius:10px;
  padding:12px 14px;margin-bottom:10px;
}
.org-attr-header { display:flex;align-items:center;gap:7px;margin-bottom:8px; }
.org-attr-label  { font-size:12px;font-weight:700;color:var(--txt); }
.org-attr-hint   { font-size:10px;color:var(--txt3);margin-left:auto; }
.org-rating-row-compact { display:flex;gap:4px;margin-bottom:8px; }
.org-rb {
  flex:1;padding:6px 0;border:1.5px solid var(--border);border-radius:6px;
  background:var(--surface);font-size:11px;font-weight:700;color:var(--txt3);
  cursor:pointer;transition:all .12s;text-align:center;min-width:0;
}
.org-rb:hover      { border-color:var(--blue);background:#ebf2fd;color:var(--blue); }
.org-rb.sel        { border-color:var(--blue);background:var(--blue);color:#fff;box-shadow:0 2px 8px rgba(43,125,233,.35); }
.org-rb.sel-red    { border-color:#ef4444;background:#ef4444;color:#fff; }
.org-rb.sel-orange { border-color:#f97316;background:#f97316;color:#fff; }
.org-rb.sel-yellow { border-color:#eab308;background:#eab308;color:#fff; }
.org-rb.sel-green  { border-color:#22c55e;background:#22c55e;color:#fff; }
.org-rb.sel-blue   { border-color:#3b82f6;background:#3b82f6;color:#fff; }
.org-rb.sel-purple { border-color:#8b5cf6;background:#8b5cf6;color:#fff; }
.org-notes-input {
  width:100%;box-sizing:border-box;border:1.5px solid var(--border);border-radius:7px;
  background:var(--surface);color:var(--txt);font-size:11px;padding:6px 10px;
  resize:vertical;min-height:48px;outline:none;transition:border-color .15s;font-family:inherit;
}
.org-notes-input:focus { border-color:var(--blue); }
.org-section-header {
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;
  color:var(--txt3);margin:14px 0 8px;padding:0 2px;display:flex;align-items:center;gap:6px;
}
.org-section-header::after { content:'';flex:1;height:1px;background:var(--border); }

/* ── Summary card ─────────────────────── */
.org-sum-card { background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:14px; }
.org-sum-title { font-size:14px;font-weight:800;color:var(--txt);margin-bottom:3px; }
.org-sum-meta  { font-size:10px;color:var(--txt3);margin-bottom:14px;font-family:'DM Mono',monospace; }
.org-sum-attr  { margin-bottom:12px; }
.org-sum-attr-label { font-size:11px;font-weight:700;color:var(--txt2);margin-bottom:5px; }
.org-sum-bar-row  { display:flex;align-items:center;gap:8px;margin-bottom:3px; }
.org-sum-bar-label{ font-size:10px;color:var(--txt3);width:52px;text-align:right;flex-shrink:0; }
.org-sum-bar-wrap { flex:1;background:var(--bg);border-radius:99px;height:8px;overflow:hidden; }
.org-sum-bar      { height:100%;border-radius:99px;transition:width .5s; }
.org-sum-bar-val  { font-size:10px;font-weight:700;color:var(--txt);width:36px;flex-shrink:0; }

/* ── Share chip ───────────────────────── */
.org-share-chip {
  display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
  background:var(--bg);border:1px solid var(--border);border-radius:99px;
  font-size:11px;font-weight:700;color:var(--txt2);cursor:pointer;transition:.15s;
}
.org-share-chip:hover { background:var(--blue);color:#fff;border-color:var(--blue); }

/* ── Category manager ─────────────────── */
.org-cat-row {
  display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:7px;
  font-size:12px;margin-bottom:4px;background:var(--bg);border:1px solid var(--border);
}
.org-cat-type-badge { font-size:9px;font-weight:700;padding:2px 6px;border-radius:99px; }

/* ── Empty state ──────────────────────── */
.org-empty { text-align:center;padding:50px 20px;color:var(--txt3); }
.org-empty-ico { font-size:44px;margin-bottom:10px; }
.org-empty-txt { font-size:13px;font-weight:700; }
.org-empty-sub { font-size:11px;margin-top:4px; }

/* ── Status bar ───────────────────────── */
.org-sb { display:none;padding:9px 13px;border-radius:7px;margin-bottom:12px;font-size:12px;font-weight:600; }

@media(max-width:400px){
  .org-rb { font-size:10px;padding:5px 0; }
  .org-modal-head { padding:14px 16px 0; }
  .org-modal-body { padding:0 16px 16px; }
}
</style>`;
}
window.getOrganolepticHTML = getOrganolepticHTML;

// ══════════════════════════════════════════════════════════════════
//  2. INIT
// ══════════════════════════════════════════════════════════════════
async function initOrganoleptic() {
  _orgTab = 'panel';
  orgRenderTab('panel');
  orgUpdateBadge();

  // Cross-device URL param
  const params  = new URLSearchParams(window.location.search);
  const entryId = params.get('panel_entry');
  if (entryId) {
    await orgOpenPanelistEntryPage(entryId);
    return;
  }

  await orgRenderPanelList();

  if (_orgPollTimer) clearInterval(_orgPollTimer);
  _orgPollTimer = setInterval(async () => {
    if (_orgTab === 'panel')   await orgRenderPanelList(false); // false = no loading blink
    if (_orgTab === 'summary') await orgRenderSummary();
  }, 10000); // 10 detik cukup, kurangi frekuensi blink
}
window.initOrganoleptic = initOrganoleptic;

function orgUpdateBadge() {
  const nameEl = document.getElementById('org-badge-name');
  if (nameEl) nameEl.textContent = orgGetCurrentUserDisplay() || 'Belum dikenali';
}

// ══════════════════════════════════════════════════════════════════
//  3. TAB SWITCHING
// ══════════════════════════════════════════════════════════════════
async function orgSwitchTab(tab) {
  _orgTab = tab;
  orgRenderTab(tab);
  if (tab === 'panel')   await orgRenderPanelList(true);
  if (tab === 'summary') await orgRenderSummary();
}
window.orgSwitchTab = orgSwitchTab;

function orgRenderTab(active) {
  ['panel', 'summary'].forEach(t => {
    const btn = document.getElementById('org-tab-' + t);
    const con = document.getElementById('org-' + t + '-content');
    if (!btn || !con) return;
    btn.classList.toggle('active', t === active);
    con.style.display = t === active ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════════
//  4. RENDER PANEL LIST
// ══════════════════════════════════════════════════════════════════
async function orgRenderPanelList(showLoading = true) {
  const container = document.getElementById('org-panel-list');
  if (!container) return;

  // Jangan re-render kalau ada modal yang sedang terbuka (user sedang input)
  const modalOpen = document.getElementById('org-add-modal')
    || document.getElementById('org-fill-modal')
    || document.getElementById('org-share-modal')
    || document.getElementById('org-confirm-modal');
  if (modalOpen) return;

  // Hanya tampilkan loading spinner saat pertama kali (bukan saat poll otomatis)
  if (showLoading && !container.hasChildNodes()) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--txt3);font-size:12px;">⏳ Memuat…</div>`;
  }

  const all = await orgGetAll();
  if (!all.length) {
    container.innerHTML = `
      <div class="org-empty">
        <div class="org-empty-ico">🧪</div>
        <div class="org-empty-txt">Belum ada Tes Panel</div>
        <div class="org-empty-sub">Klik <b>＋ Tambah Tes</b> untuk memulai sesi.</div>
      </div>`;
    return;
  }
  const newHTML = [...all].map(test => orgCardHTML(test)).join('');
  // Hanya update DOM kalau kontennya benar-benar berubah (hindari blink)
  if (container.innerHTML !== newHTML) {
    container.innerHTML = newHTML;
  }
}

// ── Card HTML ────────────────────────────────────────────────────────
function orgCardHTML(test) {
  const done      = (test.assessments || []).length;
  const total     = test.panelCount || 4;
  const completed = done >= total || test.status === 'closed';
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
  const catLabel  = orgGetCatLabel(test.category);
  const catType   = test.categoryType || orgGetCatType(test.category);

  const catBadgeColor = catType === 'kopi' ? '#92400e' : '#166534';
  const catBadgeBg    = catType === 'kopi' ? '#fff7ed' : '#f0fdf4';
  const catIcon       = catType === 'kopi' ? '☕' : '🍵';

  const accentColor = completed ? 'var(--green)' : (done > 0 ? 'var(--orange)' : 'var(--border)');
  const statusBg    = completed ? '#f0fdf4' : (done > 0 ? '#fff7ed' : '#f8fafc');
  const statusColor = completed ? '#166534' : (done > 0 ? '#92400e' : '#555');
  const statusText  = completed ? '✅ Selesai' : (done > 0 ? `⏳ ${done}/${total}` : '🔴 Belum Diisi');
  const barColor    = completed ? 'var(--green)' : (done > 0 ? 'var(--orange)' : 'var(--border)');

  const me         = orgGetCurrentUser();
  const iAlreadyFilled = orgHasFilledTest(test);
  const myPanelNo  = orgGetUserPanelNo(test);

  // Dots — show who filled (highlight mine)
  const dots = Array.from({ length: total }, (_, i) => {
    const n      = i + 1;
    const assess = (test.assessments || []).find(a => a.panelNo === n);
    const isDone = !!assess;
    const isMine = assess && (assess.accountUser === me || assess.panelName === me);
    const cls    = isMine ? 'mine' : (isDone ? 'done' : '');
    const tip    = isMine ? `Panel ${n} — Anda` : (isDone ? `Panel ${n} — sudah diisi` : `Panel ${n}`);
    return `<div class="org-dot ${cls}" title="${tip}">${n}</div>`;
  }).join('');

  const shareUrl = `${window.location.origin}${window.location.pathname}?panel_entry=${test._id}`;

  // ── Action area — 3 states ──────────────────────────────────────
  let actionHTML = '';
  if (completed) {
    actionHTML = `
      <button class="de-btn" onclick="orgSwitchTab('summary')"
        style="font-size:12px;padding:7px 14px;background:var(--bg);border-color:var(--green);color:#166534;">
        📊 Lihat Summary
      </button>`;
  } else if (iAlreadyFilled) {
    // User ini sudah mengisi — tampilkan lock card
    actionHTML = `
      <div class="org-filled-badge">
        🔒 Anda sudah mengisi!
        <span style="font-weight:400;color:#15803d;font-size:11px;">(Panel #${myPanelNo})</span>
      </div>`;
  } else if (!me) {
    // User belum dikenali sistem
    actionHTML = `
      <div style="font-size:12px;color:var(--txt3);padding:8px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
        ⚠️ Login untuk mengisi penilaian
      </div>`;
  } else {
    // User dikenali dan belum mengisi
    actionHTML = `
      <button class="de-btn de-btn-primary" onclick="orgOpenFillModal('${orgEsc(test._id)}')"
        style="font-size:12px;padding:7px 14px;gap:5px;">
        ✏️ Isi Penilaian
      </button>
      <span class="org-share-chip" onclick="orgShowShareModal('${orgEsc(test._id)}', '${orgEsc(shareUrl)}')"
        title="Bagikan QR ke panelis">
        📤 Bagikan
      </span>`;
  }

  const dateStr = test.created_at
    ? new Date(test.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
    : (test.createdAt ? new Date(test.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—');

  return `
  <div class="org-card">
    <div class="org-card-accent" style="background:${accentColor};"></div>
    <div style="padding-left:8px;">
      <div class="org-card-header">
        <div style="flex:1;min-width:0;">
          <div class="org-sample-name">${orgEsc(test.sampleName)}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="background:${catBadgeBg};color:${catBadgeColor};padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;">${catIcon} ${orgEsc(catLabel)}</span>
            <span>👥 ${done}/${total} panelis</span>
            <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--txt3);">${dateStr}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
          <span class="org-sample-no">${orgEsc(test.sampleNo || '')}</span>
          <span class="org-status-badge" style="background:${statusBg};color:${statusColor};">${statusText}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="org-progress-wrap">
        <div class="org-progress-bar" style="width:${pct}%;background:${barColor};"></div>
      </div>

      <!-- Panel dots -->
      <div class="org-dot-row">${dots}</div>
      ${me ? `<div style="font-size:9px;color:var(--txt3);margin-bottom:4px;">🔵 = panel Anda &nbsp; 🟢 = sudah diisi</div>` : ''}

      <!-- Actions -->
      <div class="org-actions">
        ${actionHTML}
        <button class="de-btn" onclick="orgConfirmDelete('${orgEsc(test._id)}')"
          style="font-size:12px;padding:7px 12px;background:var(--bg);border-color:var(--border);color:var(--txt3);margin-left:auto;"
          title="Hapus sesi ini">
          🗑️
        </button>
      </div>
    </div>
  </div>`;
}

// ── Share Modal dengan QR Code ────────────────────────────────────────
function orgShowShareModal(id, url) {
  document.getElementById('org-share-modal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'org-share-modal';
  overlay.className = 'org-modal-overlay';
  overlay.innerHTML = `
    <div class="org-modal" style="max-width:360px;">
      <div class="org-modal-head">
        <div class="org-modal-title">📤 Bagikan ke Panelis</div>
        <button class="org-modal-close" onclick="document.getElementById('org-share-modal').remove()">✕</button>
      </div>
      <div class="org-modal-body" style="text-align:center;">
        <div style="font-size:11px;color:var(--txt3);margin-bottom:14px;">
          Panelis scan QR ini atau buka link untuk mengisi penilaian.<br>
          <b style="color:var(--txt);">Tidak perlu login</b> — cukup masukkan nama saja.
        </div>
        <!-- QR Code container -->
        <div id="org-qr-wrap" style="display:inline-block;padding:12px;background:#fff;border-radius:12px;border:1px solid var(--border);margin-bottom:14px;">
          <div id="org-qr-canvas"></div>
        </div>
        <!-- Link copy -->
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
          <input id="org-share-url-input" value="${url}" readonly
            style="flex:1;font-size:10px;padding:7px 10px;border:1.5px solid var(--border);border-radius:7px;
                   background:var(--bg);color:var(--txt2);outline:none;font-family:'DM Mono',monospace;overflow:hidden;text-overflow:ellipsis;">
          <button class="de-btn de-btn-primary" onclick="orgCopyShareUrl('${id}')"
            style="padding:7px 14px;font-size:11px;white-space:nowrap;">
            📋 Salin
          </button>
        </div>
        <div id="org-share-copy-msg" style="font-size:11px;color:var(--green);min-height:16px;"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Generate QR menggunakan API qr-server (tidak butuh library)
  const qrImg = document.createElement('img');
  const encoded = encodeURIComponent(url);
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
  qrImg.width  = 180;
  qrImg.height = 180;
  qrImg.style.borderRadius = '6px';
  qrImg.alt = 'QR Code';
  document.getElementById('org-qr-canvas').appendChild(qrImg);
}
window.orgShowShareModal = orgShowShareModal;

function orgCopyShareUrl(id) {
  const input = document.getElementById('org-share-url-input');
  if (!input) return;
  const url = input.value;
  navigator.clipboard?.writeText(url).then(() => {
    const msg = document.getElementById('org-share-copy-msg');
    if (msg) { msg.textContent = '✅ Link berhasil disalin!'; setTimeout(() => { msg.textContent = ''; }, 2500); }
  }).catch(() => {
    input.select();
    document.execCommand('copy');
    const msg = document.getElementById('org-share-copy-msg');
    if (msg) { msg.textContent = '✅ Link berhasil disalin!'; setTimeout(() => { msg.textContent = ''; }, 2500); }
  });
}
window.orgCopyShareUrl = orgCopyShareUrl;

// ══════════════════════════════════════════════════════════════════
//  5. ADD TEST MODAL
// ══════════════════════════════════════════════════════════════════
async function orgOpenAddModal() {
  document.getElementById('org-add-modal')?.remove();
  const all      = await orgGetAll();
  const previewNo = orgGenSampleNo(all);
  const cats     = orgGetCats();
  const catOptions = cats.map(c =>
    `<option value="${orgEsc(c.value)}">${orgEsc(c.label)}</option>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'org-add-modal';
  overlay.className = 'org-modal-overlay';
  overlay.innerHTML = `
    <div class="org-modal org-modal-lg">
      <div class="org-modal-head">
        <div class="org-modal-title">➕ Tambah Tes Panel Baru</div>
        <button class="org-modal-close" onclick="document.getElementById('org-add-modal').remove()">✕</button>
      </div>
      <div class="org-modal-body">

        <!-- Sample No preview -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:9px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">No. Sample (Auto)</div>
            <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:800;color:var(--blue);">${previewNo}</div>
          </div>
          <span style="font-size:22px;">🔖</span>
        </div>

        <!-- Nama Sample -->
        <div style="margin-bottom:12px;">
          <label style="font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:5px;">NAMA SAMPLE <span style="color:var(--red)">*</span></label>
          <input class="de-input" type="text" id="org-add-name" placeholder="Contoh: Arabika Batch-07"
            autocomplete="off" autocorrect="off" spellcheck="false"
            style="width:100%;box-sizing:border-box;"
            onkeydown="event.stopPropagation()">
        </div>

        <!-- Kategori -->
        <div style="margin-bottom:6px;">
          <label style="font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:5px;">KATEGORI <span style="color:var(--red)">*</span></label>
          <select class="de-input de-select" id="org-add-cat" style="width:100%;box-sizing:border-box;" onchange="orgUpdateCatPreview()">
            <option value="">-- Pilih kategori --</option>
            ${catOptions}
          </select>
          <div id="org-cat-type-preview" style="margin-top:5px;font-size:11px;color:var(--txt3);"></div>
        </div>

        <!-- Category Manager -->
        <div style="margin-bottom:16px;">
          <button onclick="orgToggleCatManager()" style="font-size:11px;font-weight:600;color:var(--blue);background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;">
            ⚙️ Kelola Kategori
          </button>
          <div id="org-cat-manager" style="display:none;margin-top:10px;border:1px solid var(--border);border-radius:9px;padding:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--txt2);margin-bottom:8px;">Daftar Kategori</div>
            <div id="org-cat-list">${orgCatManagerHTML()}</div>
            <div style="display:flex;gap:6px;margin-top:10px;">
              <input class="de-input" type="text" id="org-new-cat-name" placeholder="Nama kategori baru…" style="flex:1;font-size:12px;padding:7px 10px;">
              <select class="de-input de-select" id="org-new-cat-type" style="font-size:12px;padding:7px 10px;">
                <option value="teh">Teh</option>
                <option value="kopi">Kopi</option>
              </select>
              <button class="de-btn de-btn-primary" onclick="orgAddCategory()" style="font-size:12px;padding:7px 12px;white-space:nowrap;">＋</button>
            </div>
          </div>
        </div>

        <!-- Jumlah Panel -->
        <div style="margin-bottom:18px;">
          <label style="font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:5px;">JUMLAH PANELIS <span style="color:var(--red)">*</span></label>
          <input class="de-input" type="number" id="org-add-count" value="4" min="1" max="20"
            style="width:100%;box-sizing:border-box;">
          <div style="font-size:10px;color:var(--txt3);margin-top:3px;">💡 Sesi ditutup otomatis setelah semua panelis mengisi.</div>
        </div>

        <div id="org-add-sb" class="org-sb"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="de-btn" onclick="document.getElementById('org-add-modal').remove()"
            style="padding:9px 18px;background:var(--bg);border-color:var(--border);color:var(--txt3);">Batal</button>
          <button class="de-btn de-btn-primary" onclick="orgSaveNewTest()" style="padding:9px 22px;font-weight:700;">💾 Buat Sesi</button>
        </div>

      </div>
    </div>`;
  document.body.appendChild(overlay);
  // Focus + reset input dengan delay lebih panjang untuk handle kasus setelah PDF viewer
  // PDF viewer (browser native) kadang mengunci focus/keyboard event di background
  const focusInput = () => {
    const inp = document.getElementById('org-add-name');
    if (!inp) return;
    // Force browser melepas state lama: blur dulu, baru focus ulang
    inp.blur();
    inp.disabled = true;
    requestAnimationFrame(() => {
      inp.disabled = false;
      inp.focus();
      inp.click();
      // Pastikan cursor benar-benar di dalam input
      inp.setSelectionRange(inp.value.length, inp.value.length);
    });
  };
  setTimeout(focusInput, 100);
  setTimeout(focusInput, 400);
  setTimeout(focusInput, 800); // retry tambahan kalau PDF viewer benar-benar stuck
  // Klik manual di overlay (selain modal) tidak boleh menutup browser native focus trap
  document.addEventListener('visibilitychange', function _vc() {
    if (!document.hidden) { focusInput(); document.removeEventListener('visibilitychange', _vc); }
  });
}
window.orgOpenAddModal = orgOpenAddModal;

function orgUpdateCatPreview() {
  const val = document.getElementById('org-add-cat')?.value;
  const el  = document.getElementById('org-cat-type-preview');
  if (!el) return;
  if (!val) { el.textContent = ''; return; }
  const type = orgGetCatType(val);
  el.innerHTML = type === 'kopi'
    ? '<span style="background:#fff7ed;color:#92400e;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;">☕ Kopi — atribut: Bitterness, Sweet, Sour, Body, Aroma, Overall</span>'
    : '<span style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;">🍵 Teh — atribut: Flavour Aroma, Smoky Aroma, Rasa, Level Astringent</span>';
}
window.orgUpdateCatPreview = orgUpdateCatPreview;

function orgCatManagerHTML() {
  const deleted = JSON.parse(localStorage.getItem(ORG_DEL_CAT_KEY) || '[]');
  const custom  = JSON.parse(localStorage.getItem(ORG_CAT_KEY) || '[]');
  let html = '';
  ORG_DEFAULT_CATS.forEach(c => {
    const isDeleted = deleted.includes(c.value);
    const color = c.type === 'kopi' ? '#92400e' : '#166534';
    const bg    = c.type === 'kopi' ? '#fff7ed' : '#f0fdf4';
    html += `<div class="org-cat-row" style="${isDeleted ? 'opacity:.4;' : ''}">
      <span style="flex:1;font-size:12px;${isDeleted ? 'text-decoration:line-through;' : ''}">${orgEsc(c.label)}</span>
      <span class="org-cat-type-badge" style="background:${bg};color:${color};">${c.type}</span>
      ${isDeleted
        ? `<button onclick="orgRestoreDefaultCat('${c.value}')" style="font-size:10px;background:var(--green);color:#fff;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;">Pulihkan</button>`
        : `<button onclick="orgDeleteDefaultCat('${c.value}')" style="font-size:10px;background:var(--bg);color:var(--txt3);border:1px solid var(--border);border-radius:4px;padding:2px 7px;cursor:pointer;">🗑️</button>`
      }
    </div>`;
  });
  custom.forEach((c, i) => {
    const color = c.type === 'kopi' ? '#92400e' : '#166534';
    const bg    = c.type === 'kopi' ? '#fff7ed' : '#f0fdf4';
    html += `<div class="org-cat-row">
      <span style="flex:1;font-size:12px;">📌 ${orgEsc(c.label)}</span>
      <span class="org-cat-type-badge" style="background:${bg};color:${color};">${c.type}</span>
      <button onclick="orgDeleteCustomCat(${i})" style="font-size:10px;background:var(--bg);color:var(--txt3);border:1px solid var(--border);border-radius:4px;padding:2px 7px;cursor:pointer;">🗑️</button>
    </div>`;
  });
  return html || '<div style="font-size:11px;color:var(--txt3);">Tidak ada kategori.</div>';
}

function orgToggleCatManager() {
  const el = document.getElementById('org-cat-manager');
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}
window.orgToggleCatManager = orgToggleCatManager;

function orgDeleteDefaultCat(value) {
  const deleted = JSON.parse(localStorage.getItem(ORG_DEL_CAT_KEY) || '[]');
  if (!deleted.includes(value)) deleted.push(value);
  localStorage.setItem(ORG_DEL_CAT_KEY, JSON.stringify(deleted));
  orgRefreshCatManager();
}
window.orgDeleteDefaultCat = orgDeleteDefaultCat;

function orgRestoreDefaultCat(value) {
  const deleted = JSON.parse(localStorage.getItem(ORG_DEL_CAT_KEY) || '[]');
  localStorage.setItem(ORG_DEL_CAT_KEY, JSON.stringify(deleted.filter(v => v !== value)));
  orgRefreshCatManager();
}
window.orgRestoreDefaultCat = orgRestoreDefaultCat;

function orgDeleteCustomCat(idx) {
  const custom = JSON.parse(localStorage.getItem(ORG_CAT_KEY) || '[]');
  custom.splice(idx, 1);
  localStorage.setItem(ORG_CAT_KEY, JSON.stringify(custom));
  orgRefreshCatManager();
}
window.orgDeleteCustomCat = orgDeleteCustomCat;

function orgAddCategory() {
  const nameEl = document.getElementById('org-new-cat-name');
  const typeEl = document.getElementById('org-new-cat-type');
  const name   = nameEl?.value?.trim();
  const type   = typeEl?.value || 'teh';
  if (!name) { nameEl?.focus(); return; }
  const custom = JSON.parse(localStorage.getItem(ORG_CAT_KEY) || '[]');
  const icon   = type === 'kopi' ? '☕' : '🍵';
  custom.push({ value: 'custom_' + Date.now(), label: `${icon} ${name}`, type });
  localStorage.setItem(ORG_CAT_KEY, JSON.stringify(custom));
  if (nameEl) nameEl.value = '';
  orgRefreshCatManager();
}
window.orgAddCategory = orgAddCategory;

function orgRefreshCatManager() {
  const listEl = document.getElementById('org-cat-list');
  if (listEl) listEl.innerHTML = orgCatManagerHTML();
  const sel  = document.getElementById('org-add-cat');
  const cats = orgGetCats();
  if (sel) {
    const curVal = sel.value;
    sel.innerHTML = '<option value="">-- Pilih kategori --</option>' +
      cats.map(c => `<option value="${orgEsc(c.value)}" ${curVal === c.value ? 'selected' : ''}>${orgEsc(c.label)}</option>`).join('');
  }
}

async function orgSaveNewTest() {
  const name  = document.getElementById('org-add-name')?.value?.trim();
  const cat   = document.getElementById('org-add-cat')?.value;
  const count = parseInt(document.getElementById('org-add-count')?.value);
  const sb    = document.getElementById('org-add-sb');

  if (!name)              { orgShowSb(sb, '⚠️ Nama sample wajib diisi.',          '#fff7ed', '#92400e'); return; }
  if (!cat)               { orgShowSb(sb, '⚠️ Pilih kategori terlebih dahulu.',   '#fff7ed', '#92400e'); return; }
  if (!count || count < 1){ orgShowSb(sb, '⚠️ Jumlah panelis minimal 1.',         '#fff7ed', '#92400e'); return; }

  const all     = await orgGetAll();
  const newTest = {
    sampleNo:    orgGenSampleNo(all),
    sampleName:  name,
    category:    cat,
    categoryType: orgGetCatType(cat),
    panelCount:  count,
    assessments: [],
    status:      'open',
    createdAt:   Date.now(),
    createdBy:   orgGetCurrentUser() || null,
  };

  orgShowSb(sb, '⏳ Menyimpan…', '#eff6ff', '#1e40af');
  const saved = await orgSave(newTest);
  if (!saved) { orgShowSb(sb, '❌ Gagal menyimpan. Coba lagi.', '#fef2f2', '#b91c1c'); return; }

  orgShowSb(sb, '✅ Sesi berhasil dibuat!', '#f0fdf4', '#166534');
  setTimeout(() => {
    document.getElementById('org-add-modal')?.remove();
    orgSwitchTab('panel');
  }, 600);
}
window.orgSaveNewTest = orgSaveNewTest;

// ══════════════════════════════════════════════════════════════════
//  6. FILL PENILAIAN MODAL — account-locked, 1 fill per user
// ══════════════════════════════════════════════════════════════════
let _orgFillTestId  = null;
let _orgFillPanel   = 1;
let _orgFillRatings = {};

async function orgOpenFillModal(testId) {
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));
  
  if (!test) {
    console.error("Gagal membuka form: ID tidak ditemukan", testId);
    return;
  }
  // Guard: sudah diisi oleh akun ini
  if (orgHasFilledTest(test)) {
    const pNo = orgGetUserPanelNo(test);
    orgShowToast(`🔒 Anda (<b>${orgEsc(me)}</b>) sudah mengisi Panel #${pNo} untuk sesi ini.`, '#166534');
    return;
  }

  // Guard: sesi sudah penuh
  const done  = (test.assessments || []).length;
  const total = test.panelCount;
  if (done >= total || test.status === 'closed') {
    orgShowToast('✅ Semua panelis sudah mengisi. Sesi ditutup.', '#166534');
    return;
  }

  _orgFillTestId  = testId;
  _orgFillRatings = {};

  // Ambil nomor panel berikutnya yang belum diisi
  const filledNos = (test.assessments || []).map(a => a.panelNo);
  let next = 1;
  for (let i = 1; i <= total; i++) {
    if (!filledNos.includes(i)) { next = i; break; }
  }
  _orgFillPanel = next;

  orgRenderFillModal(test);
}
window.orgOpenFillModal = orgOpenFillModal;

function orgRenderFillModal(test) {
  document.getElementById('org-fill-modal')?.remove();
  const catType  = test.categoryType || orgGetCatType(test.category);
  const attrs    = ORG_ATTRS[catType] || ORG_ATTRS.kopi;
  const done     = (test.assessments || []).length;
  const total    = test.panelCount;
  const me       = orgGetCurrentUser();
  const meName   = orgGetCurrentUserDisplay();
  const catLabel = orgGetCatLabel(test.category);
  const catIcon  = catType === 'kopi' ? '☕' : '🍵';

  const overlay = document.createElement('div');
  overlay.id    = 'org-fill-modal';
  overlay.className = 'org-modal-overlay';
  overlay.innerHTML = `
    <div class="org-modal org-modal-lg">
      <div class="org-modal-head">
        <div>
          <div class="org-modal-title">✏️ Isi Penilaian — Panel #${_orgFillPanel}</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:2px;font-family:'DM Mono',monospace;">
            ${orgEsc(test.sampleNo || '')} — ${orgEsc(test.sampleName)}
          </div>
        </div>
        <button class="org-modal-close" onclick="orgCloseFill()">✕</button>
      </div>
      <div class="org-modal-body">

        <!-- Progress -->
        <div style="background:var(--bg);border-radius:99px;height:4px;overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;border-radius:99px;background:var(--blue);width:${Math.round((done/total)*100)}%;transition:width .4s;"></div>
        </div>
        <div style="font-size:10px;color:var(--txt3);text-align:right;margin-bottom:14px;font-family:'DM Mono',monospace;">${done}/${total} panelis sudah mengisi</div>

        <!-- Panel info card -->
        <div style="background:linear-gradient(135deg,var(--blue),#3b82f6);color:#fff;border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:9px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.5px;">Penilaian oleh</div>
            <div style="font-size:16px;font-weight:800;">👤 ${orgEsc(meName || me || 'Panelis')}</div>
            <div style="font-size:10px;opacity:.8;margin-top:2px;">${catIcon} ${orgEsc(catLabel)} &nbsp;·&nbsp; Panel #${_orgFillPanel}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:26px;">🧪</div>
            <div style="font-size:9px;opacity:.7;margin-top:2px;">Slot ${done + 1} dari ${total}</div>
          </div>
        </div>

        <!-- Attribute blocks -->
        ${orgBuildAttrBlocks(attrs)}

        <div id="org-fill-sb" class="org-sb"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
          <button class="de-btn" onclick="orgCloseFill()"
            style="padding:9px 18px;background:var(--bg);border-color:var(--border);color:var(--txt3);">Batal</button>
          <button class="de-btn de-btn-primary" onclick="orgSubmitFill('${orgEsc(test._id)}')"
            style="padding:9px 22px;font-weight:700;">✅ Simpan Penilaian</button>
        </div>

      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function orgBuildAttrBlocks(attrs) {
  let html = '';
  attrs.forEach(attr => {
    // Tombol 1–5
    const btns = [1,2,3,4,5].map(r =>
      `<button class="org-rb" id="org-rb-${attr.key}-${r}" onclick="orgSelectAttrRating('${attr.key}',${r})">${r}</button>`
    ).join('');
    html += `
    <div class="org-attr-block">
      <div class="org-attr-header">
        <span style="font-size:16px;">${attr.icon || '📋'}</span>
        <span class="org-attr-label">${orgEsc(attr.label)}</span>
        <span class="org-attr-hint">${orgEsc(attr.hint)}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:9px;color:var(--txt3);">1 = Less</span>
        <span style="font-size:9px;color:var(--txt3);">5 = Very</span>
      </div>
      <div class="org-rating-row-compact">${btns}</div>
      <div id="org-rating-val-${attr.key}" style="font-size:10px;color:var(--txt3);text-align:center;margin-bottom:6px;min-height:14px;"></div>
      <textarea class="org-notes-input" id="org-notes-${attr.key}" placeholder="Catatan (opsional)…"></textarea>
    </div>`;
  });
  return html;
}

function orgRatingClass(r) {
  if (r === 1) return 'sel-red';
  if (r === 2) return 'sel-orange';
  if (r === 3) return 'sel-yellow';
  if (r === 4) return 'sel-green';
  return 'sel-blue'; // 5
}
function orgRatingLabel(r) {
  if (r === 1) return '😐 Sangat Rendah';
  if (r === 2) return '🙂 Rendah';
  if (r === 3) return '😊 Sedang';
  if (r === 4) return '🌟 Tinggi';
  return '🏆 Sangat Tinggi'; // 5
}

function orgSelectAttrRating(key, r) {
  if (!_orgFillRatings[key]) _orgFillRatings[key] = {};
  _orgFillRatings[key].score = r;
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`org-rb-${key}-${i}`);
    if (!btn) continue;
    btn.className = 'org-rb' + (i === r ? ' ' + orgRatingClass(r) : '');
  }
  const lbl = document.getElementById(`org-rating-val-${key}`);
  if (lbl) {
    lbl.style.color = 'var(--txt2)';
    lbl.textContent = `${r}/5 — ${orgRatingLabel(r)}`;
  }
}
window.orgSelectAttrRating = orgSelectAttrRating;

async function orgSubmitFill(testId) {
  const sb   = document.getElementById('org-fill-sb');
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));
  if (!test) return;

  const me      = orgGetCurrentUser();
  const meName  = orgGetCurrentUserDisplay();
  const catType = test.categoryType || orgGetCatType(test.category);
  const attrs   = ORG_ATTRS[catType] || ORG_ATTRS.kopi;

  // Double-check: cegah submit ganda dari akun yang sama
  if (orgHasFilledTest(test)) {
    orgShowSb(sb, '🔒 Akun Anda sudah mengisi sesi ini.', '#f0fdf4', '#166534');
    return;
  }

  // Validasi semua atribut diisi
  const missing = attrs.filter(a => !_orgFillRatings[a.key]?.score);
  if (missing.length > 0) {
    orgShowSb(sb, `⚠️ Lengkapi penilaian: ${missing.map(a => a.label).join(', ')}`, '#fff7ed', '#92400e');
    document.getElementById(`org-rb-${missing[0].key}-1`)
      ?.closest('.org-attr-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Kumpulkan ratings + notes
  const ratings = {};
  attrs.forEach(attr => {
    ratings[attr.key] = {
      score: _orgFillRatings[attr.key].score,
      notes: document.getElementById(`org-notes-${attr.key}`)?.value?.trim() || '',
    };
  });

  // Push assessment — simpan accountUser (username akun) sebagai kunci lock
  test.assessments = (test.assessments || []).filter(a => a.panelNo !== _orgFillPanel);
  test.assessments.push({
    panelNo:     _orgFillPanel,
    panelName:   meName || me || 'Panelis ' + _orgFillPanel,
    accountUser: me,                // KEY: kunci lock per akun
    ratings,
    ts: Date.now(),
  });

  const newDone    = test.assessments.length;
  const isComplete = newDone >= test.panelCount;
  if (isComplete) {
    test.status      = 'closed';
    test.completedAt = Date.now();
  }

  orgShowSb(sb, '⏳ Menyimpan…', '#eff6ff', '#1e40af');
  const saved = await orgSave(test);
  if (!saved) { orgShowSb(sb, '❌ Gagal menyimpan. Coba lagi.', '#fef2f2', '#b91c1c'); return; }

  document.getElementById('org-fill-modal')?.remove();

  if (isComplete) {
    orgShowToast(`✅ Sesi <b>${orgEsc(test.sampleName)}</b> selesai! Semua ${test.panelCount} panelis telah mengisi.`, '#166534');
    await orgRenderPanelList();
    setTimeout(() => orgSwitchTab('summary'), 800);
  } else {
    orgShowToast(`✅ Penilaian Panel #${_orgFillPanel} tersimpan! (${newDone}/${test.panelCount})`, '#166534');
    await orgRenderPanelList();
  }
}
window.orgSubmitFill = orgSubmitFill;

function orgCloseFill() {
  document.getElementById('org-fill-modal')?.remove();
  orgRenderPanelList();
}
window.orgCloseFill = orgCloseFill;

// ══════════════════════════════════════════════════════════════════
//  7. CROSS-DEVICE PANELIST ENTRY (standalone via URL ?panel_entry=)
//     Alur: masuk → isi nama (jika belum) → form penilaian
// ══════════════════════════════════════════════════════════════════

// Ambil nama tamu dari localStorage (disimpan saat panelis pertama kali isi nama)
function orgGetGuestName() {
  return localStorage.getItem('org_guest_name') || '';
}
function orgSetGuestName(name) {
  localStorage.setItem('org_guest_name', name.trim());
}

async function orgOpenPanelistEntryPage(testId) {
  const wrap = document.getElementById('org-wrap');
  if (!wrap) return;

  wrap.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--txt3);">⏳ Memuat sesi penilaian…</div>`;

  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));

  if (!test) {
    wrap.innerHTML = `
      <div class="org-empty" style="padding-top:60px;">
        <div class="org-empty-ico">❌</div>
        <div class="org-empty-txt">Sesi tidak ditemukan</div>
        <div class="org-empty-sub">Link mungkin sudah expired atau ID salah.</div>
      </div>`;
    return;
  }

  const done  = (test.assessments || []).length;
  const total = test.panelCount;

  // Cek apakah sudah mengisi (via accountUser login ATAU nama tamu + tanda di assessment)
  const guestName  = orgGetGuestName();
  const accountMe  = orgGetCurrentUser();
  const alreadyFilled = (test.assessments || []).some(a =>
    (accountMe && (a.accountUser === accountMe)) ||
    (guestName && a.guestName && a.guestName.toLowerCase() === guestName.toLowerCase())
  );

  if (alreadyFilled) {
    const myAssess = (test.assessments || []).find(a =>
      (accountMe && (a.accountUser === accountMe)) ||
      (guestName && a.guestName && a.guestName.toLowerCase() === guestName.toLowerCase())
    );
    wrap.innerHTML = `
      <div class="org-empty" style="padding-top:60px;">
        <div class="org-empty-ico">🔒</div>
        <div class="org-empty-txt" style="color:#166534;">Anda sudah mengisi!</div>
        <div style="margin-top:12px;padding:14px 20px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;display:inline-block;max-width:320px;">
          <div style="font-size:13px;font-weight:700;color:#166534;">👤 ${orgEsc(myAssess?.panelName || guestName || accountMe || '—')}</div>
          <div style="font-size:11px;color:#15803d;margin-top:4px;">Panel #${myAssess?.panelNo} untuk <b>${orgEsc(test.sampleName)}</b> sudah tersimpan.</div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--txt3);">${done} dari ${total} panelis telah mengisi.</div>
      </div>`;
    return;
  }

  if (done >= total || test.status === 'closed') {
    wrap.innerHTML = `
      <div class="org-empty" style="padding-top:60px;">
        <div class="org-empty-ico">🔒</div>
        <div class="org-empty-txt">Sesi sudah ditutup</div>
        <div class="org-empty-sub">Semua ${total} panelis sudah mengisi. Terima kasih!</div>
      </div>`;
    return;
  }

  // Jika nama sudah tersimpan → langsung ke form penilaian
  if (guestName || accountMe) {
    const displayName = guestName || orgGetCurrentUserDisplay() || accountMe;
    orgShowEntryForm(wrap, test, testId, displayName);
    return;
  }

  // Belum ada nama → tampilkan halaman input nama
  orgShowNamePage(wrap, test, testId);
}

// ── Halaman isi nama ─────────────────────────────────────────────────
function orgShowNamePage(wrap, test, testId) {
  const catType  = test.categoryType || orgGetCatType(test.category);
  const catLabel = orgGetCatLabel(test.category);
  const catIcon  = catType === 'kopi' ? '☕' : '🍵';
  const done     = (test.assessments || []).length;
  const total    = test.panelCount;

  wrap.innerHTML = `
    <div style="max-width:420px;margin:0 auto;padding:32px 16px 60px;display:flex;flex-direction:column;align-items:center;">

      <!-- Logo/Brand -->
      <div style="font-size:36px;margin-bottom:6px;">🧪</div>
      <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">SAIL Organoleptic</div>

      <!-- Sample card -->
      <div style="width:100%;background:linear-gradient(135deg,var(--blue),#3b82f6);color:#fff;border-radius:14px;padding:18px 20px;margin-bottom:24px;text-align:left;">
        <div style="font-size:10px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">${catIcon} ${orgEsc(catLabel)}</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:4px;">${orgEsc(test.sampleName)}</div>
        <div style="font-size:11px;opacity:.8;">${orgEsc(test.sampleNo || '')} &nbsp;·&nbsp; ${done}/${total} panelis sudah mengisi</div>
      </div>

      <!-- Form nama -->
      <div style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 20px;">
        <div style="font-size:15px;font-weight:800;color:var(--txt);margin-bottom:4px;">Selamat Datang 👋</div>
        <div style="font-size:12px;color:var(--txt3);margin-bottom:18px;">Masukkan nama Anda sebelum mengisi penilaian.</div>

        <label style="font-size:11px;font-weight:700;color:var(--txt2);display:block;margin-bottom:6px;">Nama Lengkap</label>
        <input id="org-guest-name-input" type="text" placeholder="Contoh: Budi Santoso"
          maxlength="60" autocomplete="name"
          style="width:100%;box-sizing:border-box;padding:11px 14px;border:2px solid var(--border);border-radius:9px;
                 background:var(--bg);color:var(--txt);font-size:14px;outline:none;transition:border-color .15s;font-family:inherit;"
          onfocus="this.style.borderColor='var(--blue)'"
          onblur="this.style.borderColor='var(--border)'"
          onkeydown="if(event.key==='Enter')orgGuestNameSubmit('${orgEsc(testId)}')" />
        <div id="org-name-err" style="font-size:11px;color:#ef4444;min-height:16px;margin-top:5px;"></div>

        <button class="de-btn de-btn-primary" onclick="orgGuestNameSubmit('${orgEsc(testId)}')"
          style="width:100%;padding:12px;font-size:14px;font-weight:800;border-radius:10px;justify-content:center;margin-top:8px;">
          Mulai Penilaian →
        </button>
      </div>

      <div style="font-size:10px;color:var(--txt3);margin-top:16px;text-align:center;">
        Nama hanya digunakan untuk identifikasi panelis
      </div>
    </div>`;

  setTimeout(() => document.getElementById('org-guest-name-input')?.focus(), 100);
}
window.orgShowNamePage = orgShowNamePage;

async function orgGuestNameSubmit(testId) {
  const input = document.getElementById('org-guest-name-input');
  const errEl = document.getElementById('org-name-err');
  const name  = (input?.value || '').trim();

  if (!name || name.length < 2) {
    if (errEl) errEl.textContent = '⚠️ Nama minimal 2 karakter.';
    input?.focus();
    return;
  }
  if (errEl) errEl.textContent = '';

  // Simpan nama ke localStorage
  orgSetGuestName(name);

  // Lanjut ke form penilaian
  const wrap = document.getElementById('org-wrap');
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));
  if (!wrap || !test) return;
  orgShowEntryForm(wrap, test, testId, name);
}
window.orgGuestNameSubmit = orgGuestNameSubmit;

// ── Form penilaian (setelah nama diisi) ─────────────────────────────
function orgShowEntryForm(wrap, test, testId, displayName) {
  const done     = (test.assessments || []).length;
  const total    = test.panelCount;
  const catType  = test.categoryType || orgGetCatType(test.category);
  const attrs    = ORG_ATTRS[catType] || ORG_ATTRS.teh;
  const catLabel = orgGetCatLabel(test.category);
  const catIcon  = catType === 'kopi' ? '☕' : '🍵';

  // Ambil panel number berikutnya
  const filledNos = (test.assessments || []).map(a => a.panelNo);
  let panelNo = 1;
  for (let i = 1; i <= total; i++) {
    if (!filledNos.includes(i)) { panelNo = i; break; }
  }
  _orgFillTestId  = testId;
  _orgFillPanel   = panelNo;
  _orgFillRatings = {};

  wrap.innerHTML = `
    <div style="max-width:520px;margin:0 auto;padding:16px 0 40px;">

      <!-- Header card -->
      <div style="background:linear-gradient(135deg,var(--blue),#3b82f6);color:#fff;border-radius:14px;padding:18px 20px;margin-bottom:16px;">
        <div style="font-size:10px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Organoleptic Test Panel</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:2px;">${orgEsc(test.sampleName)}</div>
        <div style="font-size:11px;opacity:.85;">${orgEsc(test.sampleNo || '')} &nbsp;·&nbsp; ${catIcon} ${orgEsc(catLabel)}</div>
        <div style="margin-top:10px;background:rgba(255,255,255,.18);border-radius:99px;height:4px;overflow:hidden;">
          <div style="height:100%;border-radius:99px;background:#fff;width:${Math.round((done/total)*100)}%;"></div>
        </div>
        <div style="font-size:10px;opacity:.8;margin-top:4px;">${done}/${total} panelis sudah mengisi</div>
      </div>

      <!-- User + panel badge -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.4px;">Anda adalah</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);">Panel #${panelNo}</div>
          <div style="font-size:12px;color:var(--txt2);margin-top:2px;">👤 ${orgEsc(displayName)}</div>
        </div>
        <button onclick="orgChangeName('${orgEsc(testId)}')"
          style="font-size:10px;padding:5px 10px;border:1px solid var(--border);border-radius:7px;
                 background:var(--bg);color:var(--txt3);cursor:pointer;white-space:nowrap;">
          ✏️ Ganti nama
        </button>
      </div>

      <!-- Skala penjelasan -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:10px 14px;margin-bottom:14px;
                  display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--txt2);">
        <span>Skala Penilaian:</span>
        <span><b style="color:#ef4444;">1</b> = Less &nbsp;·&nbsp; <b style="color:#22c55e;">3</b> = Medium &nbsp;·&nbsp; <b style="color:#3b82f6;">5</b> = Very</span>
      </div>

      <!-- Attribute blocks -->
      ${orgBuildAttrBlocks(attrs)}

      <div id="org-entry-sb" class="org-sb"></div>

      <button class="de-btn de-btn-primary" onclick="orgSubmitEntryPage('${orgEsc(testId)}')"
        style="width:100%;padding:13px;font-size:14px;font-weight:800;border-radius:10px;justify-content:center;">
        ✅ Kirim Penilaian Saya
      </button>

      <div style="text-align:center;font-size:10px;color:var(--txt3);margin-top:12px;">
        SAIL Organoleptic System &nbsp;·&nbsp; Panel #${panelNo} dari ${total}
      </div>
    </div>`;
}
window.orgShowEntryForm = orgShowEntryForm;

function orgChangeName(testId) {
  localStorage.removeItem('org_guest_name');
  const wrap = document.getElementById('org-wrap');
  wrap.innerHTML = `<div style="text-align:center;padding:30px;color:var(--txt3);">⏳</div>`;
  orgOpenPanelistEntryPage(testId);
}
window.orgChangeName = orgChangeName;

async function orgSubmitEntryPage(testId) {
  const sb   = document.getElementById('org-entry-sb');
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));
  if (!test) return;

  const accountMe  = orgGetCurrentUser();
  const guestName  = orgGetGuestName();
  const meName     = accountMe ? (orgGetCurrentUserDisplay() || accountMe) : guestName;
  const catType    = test.categoryType || orgGetCatType(test.category);
  const attrs      = ORG_ATTRS[catType] || ORG_ATTRS.teh;

  // Double-check: sudah mengisi?
  const alreadyFilled = (test.assessments || []).some(a =>
    (accountMe && a.accountUser === accountMe) ||
    (guestName && a.guestName && a.guestName.toLowerCase() === guestName.toLowerCase())
  );
  if (alreadyFilled) {
    orgShowSb(sb, '🔒 Anda sudah mengisi sesi ini!', '#f0fdf4', '#166534');
    return;
  }

  const missing = attrs.filter(a => !_orgFillRatings[a.key]?.score);
  if (missing.length > 0) {
    orgShowSb(sb, `⚠️ Lengkapi semua penilaian: ${missing.map(a => a.label).join(', ')}`, '#fff7ed', '#92400e');
    document.getElementById(`org-rb-${missing[0].key}-1`)
      ?.closest('.org-attr-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const ratings = {};
  attrs.forEach(attr => {
    ratings[attr.key] = {
      score: _orgFillRatings[attr.key].score,
      notes: document.getElementById(`org-notes-${attr.key}`)?.value?.trim() || '',
    };
  });

  test.assessments = (test.assessments || []).filter(a => a.panelNo !== _orgFillPanel);
  test.assessments.push({
    panelNo:     _orgFillPanel,
    panelName:   meName || 'Panelis ' + _orgFillPanel,
    accountUser: accountMe || null,
    guestName:   guestName || null,
    ratings,
    ts: Date.now(),
  });

  const newDone    = test.assessments.length;
  const isComplete = newDone >= test.panelCount;
  if (isComplete) { test.status = 'closed'; test.completedAt = Date.now(); }

  orgShowSb(sb, '⏳ Mengirim penilaian…', '#eff6ff', '#1e40af');
  const saved = await orgSave(test);
  if (!saved) { orgShowSb(sb, '❌ Gagal mengirim. Coba lagi.', '#fef2f2', '#b91c1c'); return; }

  const wrap = document.getElementById('org-wrap');
  if (wrap) {
    wrap.innerHTML = `
      <div class="org-empty" style="padding-top:60px;">
        <div class="org-empty-ico">🎉</div>
        <div class="org-empty-txt" style="color:var(--green);font-size:18px;">Terima Kasih!</div>
        <div style="margin-top:10px;padding:14px 20px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;display:inline-block;max-width:340px;">
          <div style="font-size:13px;font-weight:700;color:#166534;">Penilaian Panel #${_orgFillPanel} tersimpan ✅</div>
          <div style="font-size:11px;color:#15803d;margin-top:4px;">
            Sample: <b>${orgEsc(test.sampleName)}</b><br>
            ${meName ? `Panelis: <b>${orgEsc(meName)}</b>` : ''}
          </div>
        </div>
        ${isComplete
          ? `<div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:10px;color:#166534;font-size:12px;font-weight:700;max-width:300px;">🔒 Semua ${test.panelCount} panelis sudah mengisi. Sesi ditutup.</div>`
          : `<div style="margin-top:12px;font-size:12px;color:var(--txt3);">${newDone} dari ${test.panelCount} panelis telah mengisi.</div>`
        }
      </div>`;
  }
}
window.orgSubmitEntryPage = orgSubmitEntryPage;

// ══════════════════════════════════════════════════════════════════
//  8. DELETE
// ══════════════════════════════════════════════════════════════════
async function orgConfirmDelete(id) {
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(id));
  if (!test) return;
  if (!confirm(`Hapus sesi "${test.sampleName}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
  await orgDelete(id);
  await orgRenderPanelList();
  if (_orgTab === 'summary') await orgRenderSummary();
}
window.orgConfirmDelete = orgConfirmDelete;

// ══════════════════════════════════════════════════════════════════
//  9. SUMMARY TAB  — v4.0 Spider per-panelis + Bar frekuensi level
// ══════════════════════════════════════════════════════════════════

// Palet warna panelis (hingga 12 panelis)
const ORG_PANELIST_COLORS = [
  '#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1',
  '#14b8a6','#e11d48',
];

// State aktif panelis per test (key = testId)
const _orgActivePanel = {};

function orgSumSetActive(testId, panelNo) {
  const container = document.getElementById(`org-sum-card-${testId}`);
  if (!container) return;
  const all = container.querySelectorAll('[data-panel-no]');

  // Toggle: klik yang sudah aktif → tampilkan semua
  if (_orgActivePanel[testId] === panelNo) {
    delete _orgActivePanel[testId];
    all.forEach(el => { el.style.opacity = '1'; el.style.fontWeight = ''; });
    orgSumRedrawSpider(testId);
    orgSumUpdateBars(testId);
    return;
  }
  _orgActivePanel[testId] = panelNo;
  all.forEach(el => {
    const pno = parseInt(el.dataset.panelNo);
    el.style.opacity = pno === panelNo ? '1' : '0.25';
    el.style.fontWeight = pno === panelNo ? '700' : '';
  });
  orgSumRedrawSpider(testId);
  orgSumUpdateBars(testId);
}
window.orgSumSetActive = orgSumSetActive;

// ── Spider Chart ─────────────────────────────────────────────────
function orgDrawSpider(canvasId, testId, assessments, attrs) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R  = Math.min(W, H) / 2 - 38;
  const N  = attrs.length;
  const activePno = _orgActivePanel[testId];

  ctx.clearRect(0, 0, W, H);

  // ── Grid (skala 1–5) ──
  const levels = [1, 2, 3, 4, 5];
  levels.forEach(lvl => {
    ctx.beginPath();
    attrs.forEach((_, i) => {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const r = (lvl / 5) * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // level label di sumbu pertama
    const ang0 = -Math.PI / 2;
    const lx = cx + (lvl / 5) * R * Math.cos(ang0) + 4;
    const ly = cy + (lvl / 5) * R * Math.sin(ang0);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(lvl), lx, ly + 3);
  });

  // ── Axis lines + labels ──
  attrs.forEach((attr, i) => {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    const ex = cx + R * Math.cos(angle);
    const ey = cy + R * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    const lpad = 14;
    const lx = cx + (R + lpad) * Math.cos(angle);
    const ly = cy + (R + lpad) * Math.sin(angle);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.1 ? 'center'
                  : Math.cos(angle) > 0 ? 'left' : 'right';
    ctx.fillText(attr.label, lx, ly + 4);
  });

  // ── Plot each panelist ──
  assessments.forEach((a, pi) => {
    const pno = a.panelNo;
    const color = ORG_PANELIST_COLORS[(pno - 1) % ORG_PANELIST_COLORS.length];
    const isActive = activePno == null || activePno === pno;
    const alpha = isActive ? 1 : 0.08;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    attrs.forEach((attr, i) => {
      const score = a.ratings?.[attr.key]?.score || 0;
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const r = (score / 5) * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();
    // Fill transparan
    ctx.fillStyle = color;
    ctx.globalAlpha = isActive ? 0.08 : 0.02;
    ctx.fill();

    // Dots pada tiap vertex
    ctx.globalAlpha = alpha;
    attrs.forEach((attr, i) => {
      const score = a.ratings?.[attr.key]?.score || 0;
      if (!score) return;
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const r = (score / 5) * R;
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), isActive ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    ctx.restore();
  });
}

function orgSumRedrawSpider(testId) {
  const container = document.getElementById(`org-sum-card-${testId}`);
  if (!container) return;
  const canvas = container.querySelector('canvas[data-spider]');
  if (!canvas) return;
  const assessments = JSON.parse(canvas.dataset.assessments || '[]');
  const attrs       = JSON.parse(canvas.dataset.attrs || '[]');
  orgDrawSpider(canvas.id, testId, assessments, attrs);
}

// ── Update bar frekuensi berdasarkan panelis aktif ────────────────
function orgSumUpdateBars(testId) {
  const container = document.getElementById(`org-sum-card-${testId}`);
  if (!container) return;
  const activePno = _orgActivePanel[testId];
  const assessmentsEl = container.querySelector('[data-all-assessments]');
  if (!assessmentsEl) return;
  const assessments = JSON.parse(assessmentsEl.dataset.allAssessments || '[]');
  const attrsEl = container.querySelector('[data-all-attrs]');
  const attrs   = JSON.parse(attrsEl?.dataset.allAttrs || '[]');

  // Filter assessments jika ada yang aktif
  const filtered = activePno == null
    ? assessments
    : assessments.filter(a => a.panelNo === activePno);

  attrs.forEach(attr => {
    // Hitung frekuensi tiap level 1-5 dari filtered assessments
    const counts = [1,2,3,4,5].map(level => ({
      level,
      count: filtered.filter(a => a.ratings?.[attr.key]?.score === level).length,
    }));
    const maxCount = Math.max(...counts.map(c => c.count), 1);

    counts.forEach(({ level, count }) => {
      const barEl = container.querySelector(`[data-bar="${testId}-${attr.key}-${level}"]`);
      const cntEl = container.querySelector(`[data-barcnt="${testId}-${attr.key}-${level}"]`);
      const color = orgBarColor(level);

      if (barEl) {
        // Yang terbanyak = 100%, sisanya proporsional (misal max=2, count=1 → 50%)
        barEl.style.width   = count > 0 ? (count / maxCount) * 100 + '%' : '0%';
        barEl.style.opacity = count > 0 ? '1' : '0.15';
        barEl.style.minWidth = count > 0 ? '4px' : '0';
      }
      if (cntEl) {
        cntEl.textContent   = String(count);
        cntEl.style.fontWeight = count > 0 ? '800' : '400';
        cntEl.style.color      = count > 0 ? color : 'var(--txt3)';
      }
    });
  });
}

// ── Bar color by level (skala 1–5) ───────────────────────────────
function orgBarColor(level) {
  if (level === 1) return '#ef4444'; // merah
  if (level === 2) return '#f97316'; // orange
  if (level === 3) return '#eab308'; // kuning
  if (level === 4) return '#22c55e'; // hijau
  return '#3b82f6';                  // biru (5)
}

// ── Main render ───────────────────────────────────────────────────
async function orgRenderSummary() {
  const container = document.getElementById('org-summary-body');
  if (!container) return;
  const all  = await orgGetAll();
  const data = all.filter(t => (t.assessments || []).length > 0);

  if (!data.length) {
    container.innerHTML = `
      <div class="org-empty">
        <div class="org-empty-ico">📊</div>
        <div class="org-empty-txt">Belum ada data summary</div>
        <div class="org-empty-sub">Isi penilaian terlebih dahulu.</div>
      </div>`;
    return;
  }

  container.innerHTML = data.map(test => {
    const done     = test.assessments.length;
    const total    = test.panelCount;
    const complete = done >= total || test.status === 'closed';
    const catType  = test.categoryType || orgGetCatType(test.category);
    const attrs    = ORG_ATTRS[catType] || ORG_ATTRS.kopi;
    const catLabel = orgGetCatLabel(test.category);
    const catIcon  = catType === 'kopi' ? '☕' : '🍵';
    const tid      = String(test._id);
    const dateStr  = test.created_at
      ? new Date(test.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
      : (test.createdAt ? new Date(test.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—');

    const statusBadge = complete
      ? `<span style="font-size:10px;font-weight:700;background:#f0fdf4;color:#166534;padding:3px 10px;border-radius:6px;">✅ Selesai</span>`
      : `<span style="font-size:10px;font-weight:700;background:#fff7ed;color:#92400e;padding:3px 10px;border-radius:6px;">⏳ ${done}/${total}</span>`;

    // Grand average
    const allScores = test.assessments.flatMap(a =>
      Object.values(a.ratings || {}).map(r => r.score).filter(Boolean)
    );
    const grandAvg = allScores.length
      ? (allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(1)
      : '—';

    // ── Legend panelis (klik untuk isolate) ──
    const legendItems = test.assessments.map(a => {
      const color = ORG_PANELIST_COLORS[(a.panelNo - 1) % ORG_PANELIST_COLORS.length];
      const name  = orgEsc(a.panelName || a.accountUser || `Panel ${a.panelNo}`);
      return `<div data-panel-no="${a.panelNo}"
        onclick="orgSumSetActive('${tid}',${a.panelNo})"
        style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;
               border-radius:99px;border:2px solid ${color};background:transparent;
               cursor:pointer;transition:all .15s;font-size:11px;color:var(--txt);user-select:none;"
        onmouseenter="orgSumHover('${tid}',${a.panelNo},true)"
        onmouseleave="orgSumHover('${tid}',${a.panelNo},false)">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
        #${a.panelNo} ${name}
      </div>`;
    }).join('');

    // ── Spider canvas ──
    const canvasId = `org-spider-${tid}`;
    const attrsForCanvas   = JSON.stringify(attrs.map(a => ({ key: a.key, label: a.label })));
    const assessForCanvas  = JSON.stringify(test.assessments.map(a => ({
      panelNo: a.panelNo,
      ratings: a.ratings,
    })));

    // ── Bar sections per atribut ──
    let lastHeader = null;
    const barSections = attrs.map(attr => {
      const scores = test.assessments.map(a => a.ratings?.[attr.key]?.score).filter(Boolean);
      if (!scores.length) return '';

      const allNotes = test.assessments.flatMap(a => {
        const n = a.ratings?.[attr.key]?.notes;
        return n && n.trim() ? [`<b>#${a.panelNo}</b>: ${orgEsc(n)}`] : [];
      });

      let headerHtml = '';
      if (attr.header && attr.header !== lastHeader) {
        lastHeader = attr.header;
        headerHtml = `<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--txt3);padding:10px 0 6px;border-top:1px solid var(--border);margin-top:10px;">${orgEsc(attr.header)}</div>`;
      }

      // Rows level 1–5 — selalu tampil semua, count 0 tetap ditampilkan
      const maxCnt = Math.max(...[1,2,3,4,5].map(l => scores.filter(s => s === l).length), 1);
      const barRows = [1,2,3,4,5].map(level => {
        const count = scores.filter(s => s === level).length;
        const color = orgBarColor(level);
        const pct   = count > 0 ? (count / maxCnt) * 100 : 0;
        const labelColor = count > 0 ? color : 'var(--txt3)';
        return `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
            <div style="font-size:12px;font-weight:700;color:var(--txt2);width:18px;text-align:right;flex-shrink:0;font-family:'DM Mono',monospace;">${level}</div>
            <div style="flex:1;background:var(--bg);border-radius:6px;height:20px;overflow:hidden;border:1px solid var(--border);">
              <div data-bar="${tid}-${attr.key}-${level}"
                style="height:100%;border-radius:6px;background:${color};
                       width:${pct}%;min-width:${count>0?'4px':'0'};opacity:${count>0?1:0.15};transition:width .4s;"></div>
            </div>
            <div data-barcnt="${tid}-${attr.key}-${level}"
              style="font-size:13px;font-weight:${count>0?'800':'400'};width:22px;text-align:left;color:${labelColor};">
              ${count}
            </div>
          </div>`;
      }).join('');

      return `${headerHtml}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span>${attr.icon || '📋'}</span> ${orgEsc(attr.label)}
            <span style="margin-left:auto;font-size:10px;color:var(--txt3);font-weight:400;">
              1 = less &nbsp;&nbsp; 5 = very
            </span>
          </div>
          ${barRows}
          ${allNotes.length ? `
            <div style="margin-top:10px;padding:8px 10px;background:var(--bg);border-radius:7px;border-left:3px solid var(--blue);">
              <div style="font-size:9px;font-weight:800;color:var(--txt3);letter-spacing:.8px;margin-bottom:5px;">CATATAN:</div>
              ${allNotes.map(n => `<div style="font-size:11px;color:var(--txt2);margin-bottom:2px;">• ${n}</div>`).join('')}
            </div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="org-sum-card" id="org-sum-card-${tid}">
        <!-- Hidden data containers -->
        <div data-all-assessments='${assessForCanvas.replace(/'/g,"&#39;")}' style="display:none;"></div>
        <div data-all-attrs='${attrsForCanvas.replace(/'/g,"&#39;")}' style="display:none;"></div>

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:4px;">
          <div class="org-sum-title">${orgEsc(test.sampleName)}</div>
          ${statusBadge}
        </div>
        <div class="org-sum-meta" style="margin-bottom:14px;">
          ${orgEsc(test.sampleNo || '')} &nbsp;·&nbsp; ${catIcon} ${orgEsc(catLabel)} &nbsp;·&nbsp;
          ${dateStr} &nbsp;·&nbsp; Grand avg: <b>${grandAvg}/10</b>
        </div>

        <!-- Spider + legend -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;color:var(--txt2);margin-bottom:10px;">🕸️ Spider Chart — Per Panelis</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:12px;">
            ${legendItems}
          </div>
          <div style="text-align:center;">
            <canvas id="${canvasId}" data-spider="1"
              data-assessments='${assessForCanvas.replace(/'/g,"&#39;")}'
              data-attrs='${attrsForCanvas.replace(/'/g,"&#39;")}'
              width="320" height="260"
              style="max-width:100%;"></canvas>
          </div>
          <div style="font-size:10px;color:var(--txt3);text-align:center;margin-top:6px;">
            💡 Klik nama panelis untuk isolasi &nbsp;·&nbsp; Klik lagi untuk tampilkan semua
          </div>
        </div>

        <!-- Bar frekuensi per atribut -->
        <div>
          ${barSections}
        </div>
      </div>`;
  }).join('');

  // Draw semua spider setelah DOM siap
  data.forEach(test => {
    const tid      = String(test._id);
    const catType  = test.categoryType || orgGetCatType(test.category);
    const attrs    = ORG_ATTRS[catType] || ORG_ATTRS.kopi;
    const canvasId = `org-spider-${tid}`;
    orgDrawSpider(canvasId, tid, test.assessments, attrs);
  });
}
window.orgRenderSummary = orgRenderSummary;

// Hover effect (tanpa click, cuma preview sementara)
function orgSumHover(testId, panelNo, enter) {
  if (_orgActivePanel[testId] != null) return; // ada yang di-click, abaikan hover
  if (enter) {
    _orgActivePanel[testId] = panelNo;
    orgSumRedrawSpider(testId);
    orgSumUpdateBars(testId);
  } else {
    delete _orgActivePanel[testId];
    orgSumRedrawSpider(testId);
    orgSumUpdateBars(testId);
  }
}
window.orgSumHover = orgSumHover;

// ══════════════════════════════════════════════════════════════════
//  10. HELPERS
// ══════════════════════════════════════════════════════════════════
function orgShowSb(el, msg, bg, color) {
  if (!el) return;
  el.style.display = 'block';
  el.style.background = bg;
  el.style.color = color;
  el.style.border = `1px solid ${color}33`;
  el.textContent = msg;
}

function orgShowToast(html, bgColor = '#166534') {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:99999;
    background:${bgColor};color:#fff;padding:12px 18px;border-radius:10px;
    font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.2);
    animation:orgFadeIn .3s ease;max-width:300px;line-height:1.4;`;
  t.innerHTML = html;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ══════════════════════════════════════════════════════════════════
//  11. WINDOW EXPORTS
// ══════════════════════════════════════════════════════════════════
window.getOrganolepticHTML = getOrganolepticHTML;
window.initOrganoleptic    = initOrganoleptic;
window.orgRenderSummary    = orgRenderSummary;
window.orgRenderPanelList  = orgRenderPanelList;