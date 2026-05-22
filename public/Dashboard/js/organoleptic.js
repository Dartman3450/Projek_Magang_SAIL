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
      // Merge: kalau localStorage punya versi lebih baru (assessments lebih banyak), pakai lokal
      let local = [];
      try { local = JSON.parse(localStorage.getItem(ORG_LS_KEY) || '[]'); } catch {}
      const merged = data.map(apiItem => {
        const localItem = local.find(l => String(l._id) === String(apiItem._id));
        if (localItem &&
            (localItem.assessments || []).length > (apiItem.assessments || []).length) {
          return localItem; // lokal lebih up-to-date (API belum ter-sync)
        }
        return apiItem;
      });
      localStorage.setItem(ORG_LS_KEY, JSON.stringify(merged));
      return merged;
    }
  }
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

// ── Attribute Definitions ────────────────────────────────────────────
const ORG_ATTRS = {
  kopi: [
    { key: 'bitterness', label: 'Bitterness', icon: '☕', hint: 'Tingkat kepahitan' },
    { key: 'sweet',      label: 'Sweet',       icon: '🍬', hint: 'Tingkat kemanisan' },
    { key: 'sour',       label: 'Sour',        icon: '🍋', hint: 'Tingkat keasaman' },
    { key: 'body',       label: 'Body',        icon: '💪', hint: 'Kekentalan & tekstur' },
    { key: 'aroma',      label: 'Aroma',       icon: '👃', hint: 'Intensitas aroma' },
    { key: 'overall',    label: 'Overall',     icon: '⭐', hint: 'Kesan keseluruhan' },
  ],
  teh: [
    { key: 'flavourAroma', label: 'Flavour Aroma',    icon: '🌸', hint: 'Intensitas aroma rasa',   header: 'Aroma' },
    { key: 'smokyAroma',   label: 'Smoky Aroma',      icon: '💨', hint: 'Intensitas aroma asap',   header: 'Aroma' },
    { key: 'rasa',         label: 'Rasa',             icon: '👅', hint: 'Penilaian rasa teh',      header: 'Rasa' },
    { key: 'astringent',   label: 'Level Astringent', icon: '🌿', hint: 'Tingkat sepet/astringen', header: 'Level Astringent' },
  ],
};

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
      <button class="de-btn de-btn-primary" onclick="orgOpenAddModal()"
        style="display:flex;align-items:center;gap:8px;padding:10px 20px;font-size:13px;font-weight:700;white-space:nowrap;">
        ＋ Tambah Tes
      </button>
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
    if (_orgTab === 'panel') await orgRenderPanelList();
  }, 15000);
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
  if (tab === 'panel')   await orgRenderPanelList();
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
async function orgRenderPanelList() {
  const container = document.getElementById('org-panel-list');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--txt3);font-size:12px;">⏳ Memuat…</div>`;

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
  container.innerHTML = [...all].map(test => orgCardHTML(test)).join('');
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
      <span class="org-share-chip" onclick="orgCopyShareLink('${orgEsc(test._id)}', '${orgEsc(shareUrl)}')"
        title="Bagikan link ke panelis lain">
        🔗 Bagikan
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

// ── Copy share link ──────────────────────────────────────────────────
function orgCopyShareLink(id, url) {
  navigator.clipboard?.writeText(url).then(() => {
    orgShowToast('🔗 Link disalin! Bagikan ke panelis lain.', '#1e40af');
  }).catch(() => {
    prompt('Salin link ini dan bagikan ke panelis:', url);
  });
}
window.orgCopyShareLink = orgCopyShareLink;

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
            style="width:100%;box-sizing:border-box;">
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
  setTimeout(() => document.getElementById('org-add-name')?.focus(), 80);
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
  let lastHeader = null;
  attrs.forEach(attr => {
    if (attr.header && attr.header !== lastHeader) {
      lastHeader = attr.header;
      const headerIcons = { 'Aroma': '👃', 'Rasa': '👅', 'Level Astringent': '🌿' };
      html += `<div class="org-section-header">${headerIcons[attr.header] || '📋'} ${orgEsc(attr.header)}</div>`;
    }
    const btns = Array.from({ length: 10 }, (_, i) => i + 1).map(r =>
      `<button class="org-rb" id="org-rb-${attr.key}-${r}" onclick="orgSelectAttrRating('${attr.key}',${r})">${r}</button>`
    ).join('');
    html += `
    <div class="org-attr-block">
      <div class="org-attr-header">
        <span style="font-size:16px;">${attr.icon || '📋'}</span>
        <span class="org-attr-label">${orgEsc(attr.label)}</span>
        <span class="org-attr-hint">${orgEsc(attr.hint)}</span>
      </div>
      <div class="org-rating-row-compact">${btns}</div>
      <div id="org-rating-val-${attr.key}" style="font-size:10px;color:var(--txt3);text-align:center;margin-bottom:6px;min-height:14px;"></div>
      <textarea class="org-notes-input" id="org-notes-${attr.key}" placeholder="Catatan (opsional)…"></textarea>
    </div>`;
  });
  return html;
}

function orgRatingClass(r) {
  if (r <= 2) return 'sel-red';
  if (r <= 4) return 'sel-orange';
  if (r <= 5) return 'sel-yellow';
  if (r <= 7) return 'sel-green';
  if (r <= 9) return 'sel-blue';
  return 'sel-purple';
}
function orgRatingLabel(r) {
  if (r <= 2) return '😞 Sangat Buruk';
  if (r <= 4) return '😐 Kurang';
  if (r <= 5) return '🙂 Cukup';
  if (r <= 7) return '😊 Baik';
  if (r <= 9) return '🌟 Sangat Baik';
  return '🏆 Sempurna';
}

function orgSelectAttrRating(key, r) {
  if (!_orgFillRatings[key]) _orgFillRatings[key] = {};
  _orgFillRatings[key].score = r;
  for (let i = 1; i <= 10; i++) {
    const btn = document.getElementById(`org-rb-${key}-${i}`);
    if (!btn) continue;
    btn.className = 'org-rb' + (i === r ? ' ' + orgRatingClass(r) : '');
  }
  const lbl = document.getElementById(`org-rating-val-${key}`);
  if (lbl) {
    lbl.style.color = 'var(--txt2)';
    lbl.textContent = `${r}/10 — ${orgRatingLabel(r)}`;
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
// ══════════════════════════════════════════════════════════════════
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
  const me    = orgGetCurrentUser();

  // Cek apakah akun ini sudah mengisi
  if (me && orgHasFilledTest(test)) {
    const myNo = orgGetUserPanelNo(test);
    wrap.innerHTML = `
      <div class="org-empty" style="padding-top:60px;">
        <div class="org-empty-ico">🔒</div>
        <div class="org-empty-txt" style="color:#166534;">Anda sudah mengisi!</div>
        <div style="margin-top:12px;padding:14px 20px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;display:inline-block;max-width:320px;">
          <div style="font-size:13px;font-weight:700;color:#166534;">👤 ${orgEsc(orgGetCurrentUserDisplay() || me)}</div>
          <div style="font-size:11px;color:#15803d;margin-top:4px;">Panel #${myNo} untuk <b>${orgEsc(test.sampleName)}</b> sudah tersimpan.</div>
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
        <div style="margin-top:20px;">
          <div style="font-size:24px;font-weight:900;color:var(--green);">${done}/${total}</div>
          <div style="font-size:11px;color:var(--txt3);">Panelis telah mengisi</div>
        </div>
      </div>`;
    return;
  }

  // Ambil panel number berikutnya
  const filledNos = (test.assessments || []).map(a => a.panelNo);
  let panelNo = 1;
  for (let i = 1; i <= total; i++) {
    if (!filledNos.includes(i)) { panelNo = i; break; }
  }
  _orgFillTestId  = testId;
  _orgFillPanel   = panelNo;
  _orgFillRatings = {};

  const catType  = test.categoryType || orgGetCatType(test.category);
  const attrs    = ORG_ATTRS[catType] || ORG_ATTRS.kopi;
  const catLabel = orgGetCatLabel(test.category);
  const catIcon  = catType === 'kopi' ? '☕' : '🍵';
  const meName   = orgGetCurrentUserDisplay() || me || '';

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
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.4px;">Anda adalah</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);">Panel #${panelNo}</div>
          ${meName ? `<div style="font-size:11px;color:var(--txt2);margin-top:2px;">👤 ${orgEsc(meName)}</div>` : ''}
        </div>
        <span style="font-size:32px;">👤</span>
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

async function orgSubmitEntryPage(testId) {
  const sb   = document.getElementById('org-entry-sb');
  const all  = await orgGetAll();
  const test = all.find(t => String(t._id) === String(testId));
  if (!test) return;

  const me      = orgGetCurrentUser();
  const meName  = orgGetCurrentUserDisplay();
  const catType = test.categoryType || orgGetCatType(test.category);
  const attrs   = ORG_ATTRS[catType] || ORG_ATTRS.kopi;

  // Double-check lock
  if (me && orgHasFilledTest(test)) {
    orgShowSb(sb, '🔒 Akun Anda sudah mengisi sesi ini!', '#f0fdf4', '#166534');
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
    panelName:   meName || me || 'Panelis ' + _orgFillPanel,
    accountUser: me,
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
          <div style="font-size:13px;font-weight:700;color:#166534;">Penilaian Panel #${_orgFillPanel} tersimpan</div>
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
//  9. SUMMARY TAB
// ══════════════════════════════════════════════════════════════════
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

  container.innerHTML = data.map((test, idx) => {
    const done      = test.assessments.length;
    const total     = test.panelCount;
    const complete  = done >= total || test.status === 'closed';
    const catType   = test.categoryType || orgGetCatType(test.category);
    const attrs     = ORG_ATTRS[catType] || ORG_ATTRS.kopi;
    const catLabel  = orgGetCatLabel(test.category);
    const catIcon   = catType === 'kopi' ? '☕' : '🍵';
    const dateStr   = test.created_at
      ? new Date(test.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
      : (test.createdAt ? new Date(test.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—');

    const statusBadge = complete
      ? `<span style="font-size:10px;font-weight:700;background:#f0fdf4;color:#166534;padding:3px 8px;border-radius:5px;">✅ Selesai</span>`
      : `<span style="font-size:10px;font-weight:700;background:#fff7ed;color:#92400e;padding:3px 8px;border-radius:5px;">⏳ ${done}/${total}</span>`;

    // Hitung grand average

    // Histogram + notes per atribut (gabungan, tidak duplikat)
    let lastHeader = null;
    const attrSections = attrs.map(attr => {
      const scores   = test.assessments.map(a => a.ratings?.[attr.key]?.score).filter(Boolean);
      if (!scores.length) return '';
      const allNotes = test.assessments.map(a => a.ratings?.[attr.key]?.notes).filter(n => n && n.trim());

      // ── Histogram vertikal SVG ──
      const counts  = Array.from({ length: 10 }, (_, i) => scores.filter(s => s === i + 1).length);
      const maxCnt  = Math.max(...counts, 1);
      const W = 280, H = 110, padL = 28, padB = 22, padT = 10, padR = 8;
      const chartW  = W - padL - padR;
      const chartH  = H - padT - padB;
      const barW    = Math.floor(chartW / 10);
      const gap     = 2;

      // Y-axis ticks (0 and maxCnt, plus midpoint if > 1)
      const yTicks = maxCnt === 1 ? [0, 1] : [0, Math.ceil(maxCnt / 2), maxCnt];
      const yLines = yTicks.map(v => {
        const y = padT + chartH - Math.round((v / maxCnt) * chartH);
        return `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
                <text x="${padL - 4}" y="${y + 4}" text-anchor="end" font-size="8" fill="#9ca3af">${v}</text>`;
      }).join('');

      const barsSVG = counts.map((cnt, i) => {
        const score  = i + 1;
        const bh     = Math.round((cnt / maxCnt) * chartH);
        const x      = padL + i * barW + gap;
        const y      = padT + chartH - bh;
        const colors = ['','#ef4444','#ef4444','#f97316','#f97316','#eab308','#eab308','#22c55e','#22c55e','#3b82f6','#8b5cf6'];
        const fill   = cnt > 0 ? (colors[score] || '#94a3b8') : '#f3f4f6';
        const label  = cnt > 0
          ? `<text x="${x + (barW - gap*2)/2}" y="${y - 3}" text-anchor="middle" font-size="8" font-weight="700" fill="${colors[score]}">${cnt}</text>`
          : '';
        return `
          <rect x="${x}" y="${cnt > 0 ? y : padT + chartH}" width="${barW - gap*2}" height="${cnt > 0 ? bh : 0}"
            fill="${fill}" rx="2"/>
          ${label}
          <text x="${x + (barW - gap*2)/2}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${cnt > 0 ? '#374151' : '#9ca3af'}" font-weight="${cnt > 0 ? '700' : '400'}">${score}</text>`;
      }).join('');

      const bars = `
        <div style="overflow-x:auto;">
          <svg width="${W}" height="${H}" style="display:block;margin:4px 0;">
            <!-- grid lines + y labels -->
            ${yLines}
            <!-- x axis -->
            <line x1="${padL}" x2="${W - padR}" y1="${padT + chartH}" y2="${padT + chartH}" stroke="#d1d5db" stroke-width="1.5"/>
            <!-- y axis -->
            <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT + chartH}" stroke="#d1d5db" stroke-width="1.5"/>
            <!-- bars + labels -->
            ${barsSVG}
            <!-- axis titles -->
            <text x="${padL + chartW/2}" y="${H}" text-anchor="middle" font-size="8" fill="#6b7280">Nilai (1–10)</text>
            <text x="8" y="${padT + chartH/2}" text-anchor="middle" font-size="8" fill="#6b7280" transform="rotate(-90,8,${padT + chartH/2})">Jumlah</text>
          </svg>
        </div>`;

      let headerHtml = '';
      if (attr.header && attr.header !== lastHeader) {
        lastHeader = attr.header;
        headerHtml = `<div style="font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase;padding:8px 0 4px;border-top:1px solid var(--border);margin-top:8px;">${orgEsc(attr.header)}</div>`;
      }

      return `${headerHtml}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            ${attr.icon || '📋'} ${orgEsc(attr.label)}
          </div>
          ${bars}
          ${allNotes.length ? `
            <div style="margin-top:10px;padding:8px 10px;background:var(--bg);border-radius:7px;border-left:3px solid var(--blue);">
              <div style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:.8px;margin-bottom:5px;">CATATAN PANELIS:</div>
              ${allNotes.map(n => `<div style="font-size:11px;color:var(--txt2);margin-bottom:3px;">• ${orgEsc(n)}</div>`).join('')}
            </div>` : ''}
        </div>`;
    }).join('');

    const allScores = test.assessments.flatMap(a =>
      Object.values(a.ratings || {}).map(r => r.score).filter(Boolean)
    );
    const grandAvg = allScores.length
      ? (allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(2)
      : '—';

    // Panelis list
    const panelisList = test.assessments.map(a =>
      `<span style="font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:2px 7px;">
        #${a.panelNo} ${orgEsc(a.panelName || a.accountUser || '—')}
      </span>`
    ).join('');

    const html = `
      <div class="org-sum-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:4px;">
          <div class="org-sum-title">${orgEsc(test.sampleName)}</div>
          ${statusBadge}
        </div>
        <div style="org-sum-meta">
          ${orgEsc(test.sampleNo || '')} &nbsp;·&nbsp; ${catIcon} ${orgEsc(catLabel)} &nbsp;·&nbsp;
          ${dateStr} &nbsp;·&nbsp; Rata-rata: <b>${grandAvg}/10</b>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px;">${panelisList}</div>
        
        <!-- HISTOGRAM PER ATRIBUT -->
        <div style="margin-top:8px;">
          ${attrSections}
        </div>
      </div>`;
    return html;
  }).join('');
}
window.orgRenderSummary = orgRenderSummary;

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