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
    cip_prod_done:       p.cip_prod_done       || false,
    cip_prod_checks:     p.cip_prod_checks     || {},
    cip_prod_timestamps: p.cip_prod_timestamps || {},
    cip_lab_done:        p.cip_lab_done        || false,
    cip_lab_checks:      p.cip_lab_checks      || {},
    cip_lab_timestamps:  p.cip_lab_timestamps  || {},
    extraction_done:        p.extraction_done        || false,
    extraction_checks:      p.extraction_checks      || {},
    extraction_timestamps:  p.extraction_timestamps  || {},
    prod_stages:    p.prod_stages      || {},
    fp_done:        p.fp_done         || false,
    fp_entries:     p.fp_entries      || [],
    allowed_roles:  p.allowed_roles   || null,
    cipProdDone:    p.cip_prod_done   || false,
    cipLabDone:     p.cip_lab_done    || false,
    cipLabEntries:  p.cip_lab_entries || [],   // ← Fix: load dari DB
    cipLabChecks:   p.cip_lab_checks  || {},   // ← Fix: load dari DB
    cipProdChecks:  p.cip_prod_checks || {},
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

  const allPs = gPJ(type); // array asli — index ini yang dipakai semua fungsi (endProd, openEditPJ, dll)
  let ps = [...allPs];

  // Filter berdasarkan role: admin lihat semua, role lain hanya lihat
  // project yang allowed_roles-nya null (semua) atau mengandung role mereka
  if (!isAdmin) {
    ps = ps.filter(p => {
      if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
      return p.allowed_roles.includes(currentRole);
    });
  }

  if (q) ps = ps.filter(p=>p.name.toLowerCase().includes(q));
  if(cnt) cnt.textContent=ps.length+' project'+(ps.length!==1?'s':'');
  if(!ps.length){list.innerHTML=`<div class="proj-empty"><div class="proj-empty-ico">📂</div>${q?'No projects match.':'No projects yet — click ＋ to add one!'}</div>`;return;}
  const col={ongoing:'var(--blue)',recent:'var(--orange)',completed:'var(--green)'};
  const isOngoing = type === 'ongoing';
  const isCompleted = type === 'completed';

  list.innerHTML=ps.map((p)=>{
    // Pakai index dari array ASLI agar endProd/openEditPJ/openSP tidak salah project
    const i = allPs.indexOf(p);
    const updCount = (p.updates||[]).length;
    const hasSetPoint = p.setPoint && Object.keys(p.setPoint).length > 0;
    const hasCIPProd = p.cipProdDone === true || p.cip_prod_done === true;
    const hasCIPLab  = p.cipLabDone  === true || p.cip_lab_done  === true;
    const hasCIP     = hasCIPProd && hasCIPLab;
    const hasFP      = p.fpDone === true || p.fp_done === true;
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
    const pjInfo  = receipt.proj_info || {};
    const spData  = receipt.sp_data   || {};
    // tools/materials/notes/kategori bisa ada di proj_info ATAU flat di sp_data
    const tools     = pjInfo.tools     || spData.tools     || '';
    const materials = pjInfo.materials || spData.materials || '';
    const notes     = pjInfo.notes     || spData.notes     || '';
    const kategori  = pjInfo.kategori  || spData.kategori  || receipt.kategori || '';

    if (kategori && pfCatSel) { pfCatSel.value = kategori; onProjCatChange(type, 'pf'); }
    if (materials) document.getElementById('pf-mat-'+type).value = materials;
    if (notes)     document.getElementById('pf-nt-'+type).value  = notes;
    if (tools) {
      const toolArr = tools.split(', ').filter(Boolean);
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
// Receipt cache (synced from API)
let _receiptsCache = null;

function getReceipts() {
  if (_receiptsCache !== null) return _receiptsCache;
  try { return JSON.parse(localStorage.getItem('sail_receipts') || '[]'); } catch { return []; }
}

function saveReceipts(list) {
  _receiptsCache = list;
  localStorage.setItem('sail_receipts', JSON.stringify(list));
}

async function loadReceiptsFromAPI() {
  try {
    const res  = await fetch('/api/receipts');
    const json = await res.json();
    if (json.success) {
      _receiptsCache = json.data || [];
      localStorage.setItem('sail_receipts', JSON.stringify(_receiptsCache));
      return _receiptsCache;
    }
  } catch(err) {
    console.warn('loadReceiptsFromAPI fallback:', err.message);
  }
  try { _receiptsCache = JSON.parse(localStorage.getItem('sail_receipts') || '[]'); } catch { _receiptsCache = []; }
  return _receiptsCache;
}

async function apiSaveReceipt(entry, id = null) {
  const method = id ? 'PUT' : 'POST';
  const url    = id ? '/api/receipts/' + id : '/api/receipts';
  const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });
  return await res.json();
}

async function apiDeleteReceipt(id) {
  const res = await fetch('/api/receipts/' + id, { method: 'DELETE' });
  return await res.json();
}

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

  const existingId = editIdx >= 0 ? receipts[editIdx]?.id : null;

  if (editIdx >= 0) {
    receipts[editIdx] = { ...entry, id: existingId };
  } else {
    receipts.unshift(entry);
  }
  saveReceipts(receipts);

  document.getElementById('receipt-add-overlay')?.remove();
  showQuickToast(`✅ Receipt "${name}" ${editIdx >= 0 ? 'diupdate' : 'disimpan'}!`);

  // Kirim ke API (async, non-blocking)
  apiSaveReceipt(entry, existingId).then(json => {
    if (json.success && json.data?.id && editIdx < 0) {
      // Tandai ID dari database untuk operasi berikutnya
      const list = getReceipts();
      const idx  = list.findIndex(r => r.name === name && r.updated_at === entry.updated_at);
      if (idx >= 0) { list[idx].id = json.data.id; saveReceipts(list); }
    }
  }).catch(err => console.warn('apiSaveReceipt error:', err.message));

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
  const entry    = receipts[receiptIdx];
  const name     = entry?.name || '';
  const id       = entry?.id   || null;
  receipts.splice(receiptIdx, 1);
  saveReceipts(receipts);
  if (id) apiDeleteReceipt(id).catch(err => console.warn('apiDeleteReceipt error:', err.message));
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

  const entry = {
    name: name.trim(),
    kategori: '',
    sp_data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const receipts = getReceipts();
  receipts.unshift(entry);
  saveReceipts(receipts);
  showQuickToast(`✅ Receipt "${name.trim()}" disimpan dari Set Point saat ini!`);
  apiSaveReceipt(entry).catch(err => console.warn('apiSaveReceipt error:', err.message));
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
  </div>
  <div class="de-card" id="receipt-page-card">
    <div id="receipt-page-list" style="padding:4px 0;">
      <div style="text-align:center;padding:48px;color:var(--txt3);font-size:13px;">⏳ Memuat...</div>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;padding:16px 0;gap:12px;">
    <button class="de-btn de-btn-primary" onclick="openAddReceiptStandalone()">＋ Tambah Receipt</button>
  </div>
</div>`;
}

function initReceiptPage() {
  // Load dari API dulu, lalu render
  const list = document.getElementById('receipt-page-list');
  if (list) list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--txt3)">⏳ Memuat receipt...</div>';
  loadReceiptsFromAPI().then(() => renderReceiptPage());
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
  const entry    = receipts[ri];
  const name     = entry?.name || '';
  const id       = entry?.id   || null;
  receipts.splice(ri, 1);
  saveReceipts(receipts);
  renderReceiptPage();
  showQuickToast(`🗑️ Receipt "${name}" dihapus.`);
  if (id) apiDeleteReceipt(id).catch(err => console.warn('apiDeleteReceipt error:', err.message));
}
window.deleteReceiptFromPage = deleteReceiptFromPage;

// Buka modal add receipt dari halaman Receipt (standalone, tanpa context project)
function openAddReceiptStandalone(editIdx = -1) {
  document.getElementById('receipt-standalone-overlay')?.remove();
  const receipts  = getReceipts();
  const isEdit    = editIdx >= 0;
  const existing  = isEdit ? receipts[editIdx] : null;
  const sp_prefill = existing?.sp_data || {};
  // proj_info bisa ada di existing.proj_info ATAU flat di sp_data (dari API)
  const pj_prefill = existing?.proj_info || {};
  // tools bisa ada di proj_info.tools ATAU sp_data.tools (hasil merge saat save)
  const savedToolsStr = pj_prefill.tools || sp_prefill.tools || '';
  const today     = new Date().toISOString().split('T')[0];

  const deletedCats = JSON.parse(localStorage.getItem('deleted_default_categories') || '[]');
  const customCats  = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  const DEFAULT_CATEGORIES = [
    { value:'teh-hijau', label:'🍵 Teh Hijau' },{ value:'oolong', label:'🍵 Oolong' },
    { value:'black-tea', label:'☕ Black Tea' },{ value:'roasted-jasmine', label:'🌸 Roasted Green Tea Jasmine' },
    { value:'robusta', label:'☕ Kopi Robusta' },{ value:'arabika', label:'☕ Kopi Arabika' },
  ];
  const prefillKategori = pj_prefill.kategori || sp_prefill.kategori || existing?.kategori || '';
  let catOpts = '<option value="">-- Pilih kategori --</option>';
  DEFAULT_CATEGORIES.forEach(c => { if (!deletedCats.includes(c.value)) catOpts += `<option value="${c.value}" ${prefillKategori===c.value?'selected':''}>${c.label}</option>`; });
  customCats.forEach(c => { catOpts += `<option value="${c.value}" ${prefillKategori===c.value?'selected':''}>📌 ${c.label}</option>`; });

  const completedProjs = gPJ('completed').filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
  const projOpts = completedProjs.length === 0
    ? '<option value="">— Tidak ada project selesai dengan Set Point —</option>'
    : '<option value="">— Isi manual —</option>' +
      completedProjs.map((p,i) => `<option value="${i}">${p.name}${p.kategori?' · '+p.kategori:''}</option>`).join('');

  const spFieldsHTML = buildReceiptSPForm(sp_prefill);

  const savedTools = savedToolsStr.split(', ').filter(Boolean);
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
  // Auto-hitung field calculated saat page 2 pertama ditampilkan
  if (typeof calcReceiptSP === 'function') setTimeout(calcReceiptSP, 50);
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
          <label class="de-label" style="color:#111;">
            ${f.label}
            ${f.calculated ? '<span style="font-size:9px;font-weight:700;color:#0284c7;background:#ebf2fd;border:1px solid #bae6fd;border-radius:4px;padding:1px 5px;margin-left:4px;vertical-align:middle">AUTO</span>' : ''}
          </label>
          <div class="de-input-wrap">
            <input class="de-input" id="rcpt-sp-${f.id}" type="${f.type}" step="0.1"
              value="${val}" placeholder="—"
              ${f.calculated ? 'readonly style="background:#ebf2fd;color:#0284c7;font-weight:700;border-color:#bae6fd;"' : 'oninput="calcReceiptSP()"'}>
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


// ── Auto-hitung field calculated di form Receipt SP ───────────────────────────
// Formula sama persis dengan calculateSetpointField() di laboratory.js
function calcReceiptSP() {
  const g = id => {
    const el = document.getElementById('rcpt-sp-' + id);
    return el ? parseFloat(el.value) || 0 : 0;
  };
  const set = (id, val) => {
    const el = document.getElementById('rcpt-sp-' + id);
    if (!el) return;
    el.value = (isNaN(val) || !isFinite(val)) ? '' : parseFloat(val.toFixed(2)) + '';
  };

  const feed     = g('sp-feed');
  const extRate  = g('sp-ext');        // External Strip Rate %
  const condRate = g('sp-cond-rate'); // Condenser #1 %
  const offset   = g('sp-offset');    // Offset °C
  const topCol   = g('sp-temp-top'); // Top of Column °C

  // Aroma Flowrate = ext% / 100 × Feed   ← dibagi 100!
  const aroma = extRate * feed / 100;
  set('sp-aroma', aroma);

  // Stripping Steam = Aroma + 0.0933 × TopCol - 2.3333 + |Offset| × Feed × 0.0018
  const steam = aroma + (0.0933 * topCol) - 2.3333 + (Math.abs(offset) * feed * 0.0018);
  set('sp-steam', steam);

  // Condensate #1 = condRate% / 100 × Feed
  const cond1 = condRate * feed / 100;
  set('sp-cond1', cond1);

  // Condensate #2 = (extRate% - condRate%) / 100 × Feed
  const cond2 = (extRate - condRate) * feed / 100;
  set('sp-cond2', cond2);

  // Internal Strip Rate = 100 × Steam / Feed
  const intRate = feed !== 0 ? (100 * steam / feed) : 0;
  set('sp-int', intRate);

  // Product Heater = Top of Column + Offset
  const heater = topCol + offset;
  set('sp-temp-heater', heater);
}
window.calcReceiptSP = calcReceiptSP;

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

  const existingId = editIdx >= 0 ? receipts[editIdx]?.id : null;

  // Simpan ke API dulu — sp_data gabungkan dengan proj_info agar checkbox tersimpan
  const apiPayload = {
    name,
    kategori: proj_info.kategori,
    sp_data: { ...sp_data, ...proj_info },  // gabung: sp fields + tools/materials/notes
    created_by: null,
  };

  apiSaveReceipt(apiPayload, existingId).then(async json => {
    if (!json.success) { showQuickToast('❌ Gagal simpan: ' + (json.error || '')); return; }
    showQuickToast(`✅ Receipt "${name}" ${editIdx >= 0 ? 'diupdate' : 'disimpan'}!`);
    await loadReceiptsFromAPI();
    renderReceiptPage();
  }).catch(err => {
    console.warn('apiSaveReceipt error:', err.message);
    showQuickToast('❌ Gagal simpan receipt');
  });

  document.getElementById('receipt-standalone-overlay')?.remove();
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
      <label class="de-label">Brix <span style="font-weight:400;color:var(--txt3)"></span></label>
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
      // Combine aroma (items1) and product (items2) into fp_entries
      const aromaEntries = (items1 || []).map(e => ({ ...e, type: 'aroma' }));
      const productEntries = (items2 || []).map(e => ({ ...e, type: 'product' }));
      const fp_entries = [...aromaEntries, ...productEntries];
      await fetch('/api/projects/'+proj._id+'/fp', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fp_done: allFilled, fp_entries: fp_entries }) });
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

// ═══════════════════════════════════════════════════════════
// LAPORAN PROJECT — Mengambil data dari Completed Projects
// ═══════════════════════════════════════════════════════════

async function initProjectReportPage() {
  const wrap = document.getElementById('project-report-wrap');
  if (!wrap) return;

  wrap.innerHTML = getProjectReportPageHTML();

  const list = document.getElementById('proj-report-list');
  if (list) list.innerHTML = '<div style="padding:48px;text-align:center;color:var(--txt3)">⏳ Memuat laporan...</div>';

  await loadPJ('completed');
  renderProjectReportList();

  document.getElementById('pr-search')?.addEventListener('input', renderProjectReportList);
  document.getElementById('pr-sort')?.addEventListener('change', renderProjectReportList);
  document.getElementById('pr-date-from')?.addEventListener('change', renderProjectReportList);
  document.getElementById('pr-date-to')?.addEventListener('change', renderProjectReportList);
  document.getElementById('pr-clear')?.addEventListener('click', () => {
    const s = document.getElementById('pr-search');
    const df = document.getElementById('pr-date-from');
    const dt = document.getElementById('pr-date-to');
    if (s) s.value = '';
    if (df) df.value = '';
    if (dt) dt.value = '';
    renderProjectReportList();
  });
}
window.initProjectReportPage = initProjectReportPage;

function getProjectReportPageHTML() {
  return `
<div style="padding:0 0 32px 0;">

  <div style="margin-bottom:24px;">
    <div style="font-size:22px;font-weight:800;color:var(--txt);letter-spacing:-0.3px;">📁 Laporan Project</div>
    <div style="font-size:13px;color:var(--txt3);margin-top:4px;">SAIL / Reporting</div>
  </div>

  <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
    <input id="pr-search" type="text" placeholder="🔍 Cari nama project..."
      style="flex:1;min-width:160px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg);color:var(--txt);outline:none;">
    <select id="pr-sort"
      style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg);color:var(--txt);cursor:pointer;">
      <option value="newest">Terbaru</option>
      <option value="oldest">Terlama</option>
      <option value="name">Nama A–Z</option>
    </select>
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--txt2);">
      <span>Dari:</span>
      <input id="pr-date-from" type="date"
        style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg);color:var(--txt);">
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--txt2);">
      <span>Sampai:</span>
      <input id="pr-date-to" type="date"
        style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg);color:var(--txt);">
    </div>
    <button id="pr-clear"
      style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg);color:var(--txt3);cursor:pointer;">
      ✕ Clear
    </button>
    <span id="pr-count" style="margin-left:auto;font-size:12px;color:var(--txt3);font-weight:600;"></span>
  </div>

  <div id="proj-report-list"></div>
</div>`;
}

function renderProjectReportList() {
  const list    = document.getElementById('proj-report-list');
  const countEl = document.getElementById('pr-count');
  if (!list) return;

  const q        = (document.getElementById('pr-search')?.value || '').toLowerCase();
  const sort     = document.getElementById('pr-sort')?.value || 'newest';
  const dateFrom = document.getElementById('pr-date-from')?.value || '';
  const dateTo   = document.getElementById('pr-date-to')?.value   || '';

  let ps = [...gPJ('completed')];

  if (q)        ps = ps.filter(p => p.name.toLowerCase().includes(q));
  if (dateFrom) ps = ps.filter(p => p.start && p.start >= dateFrom);
  if (dateTo)   ps = ps.filter(p => p.start && p.start <= dateTo);

  if (sort === 'newest') ps.sort((a, b) => (b.end || b.start || '').localeCompare(a.end || a.start || ''));
  if (sort === 'oldest') ps.sort((a, b) => (a.end || a.start || '').localeCompare(b.end || b.start || ''));
  if (sort === 'name')   ps.sort((a, b) => a.name.localeCompare(b.name));

  if (countEl) countEl.textContent = ps.length + ' laporan';

  if (!ps.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:40px;margin-bottom:14px;">📂</div>
        <div style="font-size:15px;font-weight:700;color:var(--txt);margin-bottom:6px;">
          ${q || dateFrom || dateTo ? 'Tidak ada hasil yang cocok.' : 'Belum ada project selesai.'}
        </div>
        <div style="font-size:13px;color:var(--txt3);">
          ${q || dateFrom || dateTo ? 'Coba ubah filter atau kata kunci pencarian.' : 'Project yang sudah di-End akan muncul di sini.'}
        </div>
      </div>`;
    return;
  }

  const allCompleted = gPJ('completed');

  list.innerHTML = ps.map(p => {
    const i          = allCompleted.indexOf(p);
    const fpEntries  = p.fp_entries || p.fpItems2 || p.fpItems || [];
    const totalBerat = fpEntries.reduce((sum, e) => sum + (parseFloat(e.berat) || 0), 0);
    const prodCount  = fpEntries.length;
    const durasiLabel = _calcDurasi(p.start, p.end);
    const catLabel   = p.kategori ? getCatLabel(p.kategori) : '';

    return `
      <div class="proj-card" style="--acc:var(--green);margin-bottom:14px;cursor:default;">
        <div style="display:flex;align-items:flex-start;gap:14px;width:100%;">
          <div style="width:44px;height:44px;border-radius:12px;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
            📁
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:800;font-size:15px;color:var(--txt);margin-bottom:4px;">${p.name}</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;color:var(--txt3);">📅 <strong>Mulai:</strong> ${_fmtDate(p.start)}</span>
              <span style="font-size:12px;color:var(--txt3);">🏁 <strong>Selesai:</strong> ${_fmtDate(p.end)}</span>
              ${durasiLabel ? `<span style="font-size:11px;padding:2px 8px;background:#f3f4f6;border-radius:100px;color:#6b7280;border:1px solid #e5e7eb;">⏱️ ${durasiLabel}</span>` : ''}
              ${p.batch ? `<span style="font-size:11px;font-family:'DM Mono',monospace;font-weight:700;color:#6b7280;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:2px 8px;">${p.batch}</span>` : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
              ${catLabel ? `<span style="font-size:11px;padding:2px 8px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:100px;font-weight:600;">🏷️ ${catLabel}</span>` : ''}
              ${prodCount > 0 ? `<span style="font-size:11px;padding:2px 8px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:100px;font-weight:600;">📦 ${prodCount} produk</span>` : ''}
              ${totalBerat > 0 ? `<span style="font-size:11px;padding:2px 8px;background:#faf5ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:100px;font-weight:600;">⚖️ ${totalBerat.toFixed(1)} kg</span>` : ''}
              <span style="font-size:11px;padding:2px 8px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:100px;font-weight:700;">✅ SELESAI</span>
            </div>
          </div>
          <div style="flex-shrink:0;display:flex;align-items:center;">
            <button onclick="openSummModal('completed',${i})"
              style="padding:8px 16px;font-size:12px;font-weight:700;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;white-space:nowrap;"
              onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
              📊 Detail
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}
window.renderProjectReportList = renderProjectReportList;

function _calcDurasi(start, end) {
  if (!start || !end) return '';
  try {
    const ms   = new Date(end) - new Date(start);
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    if (days < 0) return '';
    if (days === 0) return '< 1 hari';
    return days + ' hari';
  } catch { return ''; }
}

function openSummModal(type, idx) {
  const p = gPJ(type)?.[idx];
  if (!p) return;

  document.getElementById('summ-modal-overlay')?.remove();

  const fpEntries   = p.fp_entries || p.fpItems2 || p.fpItems || [];
  const totalBerat  = fpEntries.reduce((sum, e) => sum + (parseFloat(e.berat) || 0), 0);
  const catLabel    = p.kategori ? getCatLabel(p.kategori) : '—';
  const durasiLabel = _calcDurasi(p.start, p.end);
  const cipProd     = p.cip_prod_done || p.cipProdDone;
  const cipLab      = p.cip_lab_done  || p.cipLabDone;

  const spRows = p.setPoint && Object.keys(p.setPoint).length > 0
    ? Object.entries(p.setPoint)
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([k, v]) => {
          const field = (typeof SP_FIELDS !== 'undefined' ? SP_FIELDS : []).find(f => f.id === k);
          const label = field ? field.label : k;
          const unit  = field?.unit || '';
          return `<tr>
            <td style="padding:7px 10px;font-size:12px;color:var(--txt2);border-bottom:1px solid var(--border);">${label}</td>
            <td style="padding:7px 10px;font-size:12px;font-weight:700;color:var(--txt);border-bottom:1px solid var(--border);text-align:right;">${v}${unit ? ' <span style="font-weight:400;color:var(--txt3);font-size:11px;">'+unit+'</span>' : ''}</td>
          </tr>`;
        }).join('')
    : `<tr><td colspan="2" style="padding:16px;text-align:center;color:var(--txt3);font-size:12px;">Tidak ada data Set Point</td></tr>`;

  const fpRows = fpEntries.length > 0
    ? fpEntries.map((e, i) => `
        <tr>
          <td style="padding:7px 10px;font-size:12px;color:var(--txt2);border-bottom:1px solid var(--border);">${i+1}</td>
          <td style="padding:7px 10px;font-size:12px;color:var(--txt);border-bottom:1px solid var(--border);">${e.name || '—'}</td>
          <td style="padding:7px 10px;font-size:12px;color:var(--txt2);border-bottom:1px solid var(--border);">${e.code || '—'}</td>
          <td style="padding:7px 10px;font-size:12px;color:var(--txt2);border-bottom:1px solid var(--border);">${e.brix || '—'}</td>
          <td style="padding:7px 10px;font-size:12px;font-weight:700;color:var(--txt);border-bottom:1px solid var(--border);text-align:right;">${e.berat ? e.berat + ' kg' : '—'}</td>
          <td style="padding:7px 10px;font-size:12px;color:var(--txt3);border-bottom:1px solid var(--border);">${e.date || '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="6" style="padding:16px;text-align:center;color:var(--txt3);font-size:12px;">Tidak ada data produksi</td></tr>`;

  const overlay = document.createElement('div');
  overlay.id = 'summ-modal-overlay';
  overlay.className = 'proj-modal-overlay show';
  overlay.innerHTML = `
    <div class="proj-modal" style="max-width:720px;width:95vw;max-height:90vh;display:flex;flex-direction:column;">
      <div class="proj-modal-head" style="flex-shrink:0;">
        <div>
          <div class="proj-modal-title" style="font-size:16px;">📊 Summary Project</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:3px;font-weight:600;">${p.name}${p.batch ? ' &nbsp;·&nbsp; ' + p.batch : ''}</div>
        </div>
        <button class="proj-modal-close" onclick="document.getElementById('summ-modal-overlay').remove()">✕</button>
      </div>
      <div class="proj-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;">

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:22px;">
          ${_summCard('📅 Tanggal Mulai', _fmtDate(p.start))}
          ${_summCard('🏁 Tanggal Selesai', _fmtDate(p.end))}
          ${_summCard('⏱️ Durasi', durasiLabel || '—')}
          ${_summCard('🏷️ Kategori', catLabel)}
          ${_summCard('⚖️ Total Produksi', totalBerat > 0 ? totalBerat.toFixed(1) + ' kg' : '—')}
          ${_summCard('📦 Jumlah Produk', fpEntries.length > 0 ? fpEntries.length + ' item' : '—')}
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">
          <span style="font-size:11px;padding:4px 12px;border-radius:100px;font-weight:700;${cipProd?'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;':'background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;'}">
            ${cipProd ? '✅' : '⏳'} CIP Produksi
          </span>
          <span style="font-size:11px;padding:4px 12px;border-radius:100px;font-weight:700;${cipLab?'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;':'background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;'}">
            ${cipLab ? '✅' : '⏳'} CIP Lab
          </span>
          <span style="font-size:11px;padding:4px 12px;border-radius:100px;font-weight:700;${(p.fpDone||p.fp_done)?'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;':'background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;'}">
            ${(p.fpDone||p.fp_done) ? '✅' : '⏳'} Finish Production
          </span>
        </div>

        ${p.notes ? `
        <div style="margin-bottom:22px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--txt3);margin-bottom:8px;">📝 Catatan</div>
          <div style="font-size:13px;color:var(--txt2);background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px 14px;line-height:1.6;">${p.notes}</div>
        </div>` : ''}

        <div style="margin-bottom:22px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--txt3);margin-bottom:10px;">📦 Hasil Produksi (Finish Production)</div>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border);">
            <table style="width:100%;border-collapse:collapse;min-width:460px;">
              <thead>
                <tr style="background:var(--bg);">
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">#</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">Produk</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">Kode</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">Brix</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:right;font-weight:700;border-bottom:1px solid var(--border);">Berat</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">Tanggal</th>
                </tr>
              </thead>
              <tbody>${fpRows}</tbody>
              ${totalBerat > 0 ? `
              <tfoot>
                <tr style="background:var(--bg);">
                  <td colspan="4" style="padding:8px 10px;font-size:12px;font-weight:700;color:var(--txt);">TOTAL</td>
                  <td style="padding:8px 10px;font-size:13px;font-weight:800;color:#16a34a;text-align:right;">${totalBerat.toFixed(1)} kg</td>
                  <td></td>
                </tr>
              </tfoot>` : ''}
            </table>
          </div>
        </div>

        ${p.setPoint && Object.keys(p.setPoint).length > 0 ? `
        <div style="margin-bottom:8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--txt3);margin-bottom:10px;">⚙️ Set Point</div>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border);">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:var(--bg);">
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:left;font-weight:700;border-bottom:1px solid var(--border);">Parameter</th>
                  <th style="padding:8px 10px;font-size:11px;color:var(--txt3);text-align:right;font-weight:700;border-bottom:1px solid var(--border);">Nilai</th>
                </tr>
              </thead>
              <tbody>${spRows}</tbody>
            </table>
          </div>
        </div>` : ''}

      </div>
      <div style="flex-shrink:0;padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:10px;">
        <button onclick="exportProjectSummaryPDF()"
          style="padding:9px 20px;font-size:13px;font-weight:700;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;color:#1d4ed8;cursor:pointer;">
          📄 Download PDF
        </button>
        <button onclick="document.getElementById('summ-modal-overlay').remove()"
          style="padding:9px 20px;font-size:13px;font-weight:700;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--txt);cursor:pointer;">
          Tutup
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
window.openSummModal = openSummModal;

function exportProjectSummaryPDF() {
  const modal = document.querySelector('#summ-modal-overlay .proj-modal');
  if (!modal) {
    alert('Summary project belum terbuka.');
    return;
  }

  const cssFiles = [
    '/Dashboard/css/01-base.css',
    '/Dashboard/css/05-forms.css',
    '/Dashboard/css/06-modals-drawers.css',
    '/Dashboard/css/09-v2-additions.css'
  ];
  const headLinks = cssFiles.map(h => `<link rel="stylesheet" href="${h}">`).join('\n');

  const win = window.open('', '_blank', 'noopener');
  if (!win) {
    alert('Popup diblokir. Izinkan popup untuk download PDF.');
    return;
  }

  const printedHTML = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan Project</title>${headLinks}<style>body{padding:16px;background:#fff}.proj-modal{max-width:none!important;width:100%!important;max-height:none!important;border:none!important;box-shadow:none!important}.proj-modal-close{display:none!important}</style></head><body>${modal.outerHTML}</body></html>`;
  win.document.open();
  win.document.write(printedHTML);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}
window.exportProjectSummaryPDF = exportProjectSummaryPDF;

function _summCard(label, value) {
  return `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px 14px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--txt3);margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;font-weight:800;color:var(--txt);">${value}</div>
    </div>`;
}
window._summCard = _summCard;

function _fmtDate(val) {
  if (!val) return '—';
  const d = val.substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return val;
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
window._fmtDate = _fmtDate;