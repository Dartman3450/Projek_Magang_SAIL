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
            <label class="de-label" style="color:#111;">TANGGAL</label>
            <input class="de-input" type="date" id="lab-h-${key}-tanggal" value="${new Date().toISOString().split('T')[0]}" style="cursor:pointer;">
          </div>
          <div class="de-field de-full">
            <label class="de-label" style="color:#111;">SECTION / AREA</label>
            <select class="de-input de-select" id="lab-h-${key}-section" onchange="labHarianToggleFields('${key}')">
              <option value="">-- Pilih section --</option>
              <option value="tw1">Treat Water 1 (TW1)</option>
              <option value="tw2">Treat Water 2 (TW2)</option>
              <option value="filter">Filter Water</option>
              <option value="chiller">Chiller In &amp; Out</option>
              <option value="cooling">Cooling Water</option>
              <option value="process">Process Water</option>
              <option value="soft">Soft Water</option>
              <option value="boiler_feed">Boiler Feed Water</option>
              <option value="raw_sb1">Raw Water (SB-1)</option>
              <option value="wwtp">WWTP / Limbah</option>
              <option value="other">Lain-lain</option>
            </select>
          </div>
          <!-- Field nama khusus untuk "Lain-lain" -->
          <div id="lab-h-${key}-other-name-field" style="display:none;grid-column:1/-1;">
            <div class="de-field de-full">
              <label class="de-label" style="color:#111;">NAMA SECTION</label>
              <input class="de-input" type="text" id="lab-h-${key}-other-name" placeholder="Tulis nama section...">
            </div>
          </div>
          <!-- Fields standar: TW1/TW2/Filter/Chiller/Cooling/dll -->
          <div id="lab-h-${key}-std-fields" style="display:contents">
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
          </div>
          <!-- Fields khusus WWTP: COD/BOD/PH/TDS -->
          <div id="lab-h-${key}-wwtp-fields" style="display:none;grid-column:1/-1;display:none">
            <div class="de-grid">
              <div class="de-field">
                <label class="de-label" style="color:#111;">COD</label>
                <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-cod" placeholder="—"><span class="group-unit">ppm</span></div>
              </div>
              <div class="de-field">
                <label class="de-label" style="color:#111;">BOD</label>
                <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-bod" placeholder="—"><span class="group-unit">ppm</span></div>
              </div>
              <div class="de-field">
                <label class="de-label" style="color:#111;">pH</label>
                <input class="de-input" type="number" step="0.01" id="lab-h-${key}-wwtp-ph" placeholder="—">
              </div>
              <div class="de-field">
                <label class="de-label" style="color:#111;">TDS</label>
                <div class="input-group"><input class="de-input" type="number" step="0.01" id="lab-h-${key}-wwtp-tds" placeholder="—"><span class="group-unit">ppm</span></div>
              </div>
            </div>
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
        <select class="de-input de-select" id="lab-proj-sel-${key}" onchange="(function(){var a=document.getElementById('lab-proj-form-${key}');if(a)a.dataset.renderedUid='';labRenderProject('${key}');})()" style="margin-top:6px;">
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
  // Paksa simpan state form project sebelum switch tab
  Object.values(window._labCollectState || {}).forEach(fn => { try { fn(); } catch {} });
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

    // Load samples dari API saat pertama kali tab project dibuka
    if (!window._labSamplesCache) {
      loadLabSamplesFromAPI().catch(() => {});
    }
    // Load locations dari API (selalu fresh, terpisah dari samples)
    loadLabLocationsFromAPI().then(() => {
      // Setelah cache terisi, refresh semua location dropdown yang sudah dirender
      document.querySelectorAll('.location-dropdown').forEach(dropdown => {
        const currentVal = dropdown.value && dropdown.value !== '__ADD_LOC__' ? dropdown.value : (dropdown.dataset.prevValue || '');
        const wrapper = dropdown.closest('div.de-field') || dropdown.parentElement?.parentElement;
        if (wrapper) wrapper.innerHTML = buildLocationDropdown(dropdown.id, currentVal);
      });
    }).catch(() => {});

    // Muat daftar project ke dropdown Project
    const projSel = document.getElementById('lab-proj-sel-' + key);
    if (projSel) {
      const _fillProjDropdown = (allProjs) => {
        const currentRole = localStorage.getItem('role') || 'scientist';
        const isAdmin     = ['admin','superadmin'].includes(currentRole);
        const projs = isAdmin ? allProjs : allProjs.filter(p => {
          if (currentRole === 'scientist' || currentRole === 'utility') return true;
          if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
          return p.allowed_roles.includes(currentRole);
        });
        const savedValue = projSel.value;
        projSel.innerHTML = '<option value="">-- Pilih project --</option>';
        projs.filter(p => p.setPoint && Object.keys(p.setPoint).length > 0).forEach(p => {
          const realIdx = allProjs.indexOf(p);
          const o = document.createElement('option');
          o.value = realIdx; o.textContent = p.name;
          projSel.appendChild(o);
        });
        if (savedValue !== '') projSel.value = savedValue;
        const formArea = document.getElementById('lab-proj-form-' + key);
        const uid = key + '_proj_' + projSel.value;
        const alreadyRendered = formArea && formArea.dataset.renderedUid === uid && formArea.innerHTML.trim() !== '';
        if (projSel.value !== '' && !alreadyRendered && typeof labRenderProject === 'function') {
          labRenderProject(key);
        }
      };
      // Pakai cache kalau ada, kalau tidak fetch dari API
      const cached = gPJ('ongoing');
      if (cached && cached.length > 0) {
        _fillProjDropdown(cached);
      } else {
        projSel.innerHTML = '<option value="">⏳ Memuat project...</option>';
        fetch('/api/projects?type=ongoing')
          .then(r => r.json())
          .then(json => {
            const projs = json.data || json || [];
            if (projs.length) { sPJ('ongoing', projs); _fillProjDropdown(projs); }
            else projSel.innerHTML = '<option value="">-- Tidak ada project aktif --</option>';
          })
          .catch(() => { projSel.innerHTML = '<option value="">-- Gagal load project --</option>'; });
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
  const hasValue = (val !== undefined && val !== null && val !== '');
  const v = hasValue ? val : '';
  const style = hasValue ? 'color:#999;' : '';
  const inputHtml = `<input class="de-input" id="${id}" type="number" step="any"
    value="${v}" placeholder="0"
    data-prev-value="${v}"
    style="${style}"
    onfocus="if(this.dataset.prevValue){this.value='';this.style.color='#111';}"
    onblur="if(this.value===''&&this.dataset.prevValue!=''){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value!=''){this.style.color='#111';this.dataset.prevValue=this.value;}"
  >`;
  if (!unit) return inputHtml;
  return `<div class="input-group">${inputHtml}<span class="group-unit">${unit}</span></div>`;
}
window.makeNumberInputWithUnit = makeNumberInputWithUnit;

// Helper untuk membuat text input dengan unit (misal: To Next Blowdown + "H")
// Sama seperti makeNumberInputWithUnit tapi type="text"
function makeInputFieldWithUnit(id, value, unit='') {
  const hasValue = value && value !== '';
  const v = hasValue ? value : '';
  const prevValue = v;
  const style = hasValue ? 'color:#999;' : '';
  const inputHtml = `<input class="de-input" type="text" id="${id}" placeholder="—" value="${v}" data-prev-value="${prevValue}" style="${style}"
    onfocus="if(this.dataset.prevValue){this.value='';this.style.color='#111';}"
    onblur="if(!this.value&&this.dataset.prevValue){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value){this.style.color='#111';}"
  >`;
  if (!unit) return inputHtml;
  return `<div class="input-group">${inputHtml}<span class="group-unit">${unit}</span></div>`;
}
window.makeInputFieldWithUnit = makeInputFieldWithUnit;

// Helper untuk membuat input text field dengan styling dari nilai sebelumnya
function makeNumberInput(id, value, placeholder='—') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<input class="de-input" type="number" step="0.01" id="${id}" placeholder="${placeholder}" value="${hasValue ? value : ''}" data-prev-value="${prevValue}" style="${style}"
    onfocus="if(this.dataset.prevValue){this.value='';this.style.color='#111';}"
    onblur="if(!this.value&&this.dataset.prevValue){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value){this.style.color='#111';this.dataset.prevValue=this.value;}"
  >`;
}

// Helper untuk membuat textarea field dengan placeholder dari nilai sebelumnya
function makeTextareaField(id, value, placeholder='Catatan tambahan...') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<textarea class="de-input de-textarea" id="${id}" placeholder="${placeholder}" style="min-height:60px;${style}" data-prev-value="${prevValue}"
    onfocus="if(this.dataset.prevValue){this.value='';this.style.color='#111';}"
    onblur="if(!this.value&&this.dataset.prevValue){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value){this.style.color='#111';this.dataset.prevValue=this.value;}"
  >${hasValue ? value : ''}</textarea>`;
}

// Helper untuk membuat input field dengan placeholder dari nilai sebelumnya
function makeInputField(id, value, type='text', placeholder='—') {
  const hasValue = value && value !== '';
  const style = hasValue ? 'color:#999;' : '';
  const prevValue = value || '';
  return `<input class="de-input" type="${type}" id="${id}" placeholder="${placeholder}" value="${hasValue ? value : ''}" data-prev-value="${prevValue}" style="${style}"
    onfocus="if(this.dataset.prevValue){this.value='';this.style.color='#111';}"
    onblur="if(!this.value&&this.dataset.prevValue){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value){this.style.color='#111';this.dataset.prevValue=this.value;}"
  >`;
}

function labRenderProject(key) {
  const sel  = document.getElementById('lab-proj-sel-'+key);
  const area = document.getElementById('lab-proj-form-'+key);
  if (!area || !sel || sel.value === '') { if(area) area.innerHTML=''; return; }
  const proj = gPJ('ongoing')[+sel.value];
  if (!proj) { area.innerHTML=''; return; }

  const uid = key+'_proj_'+sel.value;

  // Jika form sudah di-render untuk project yang sama, jangan render ulang
  if (area.dataset.renderedUid === uid && area.innerHTML.trim() !== '' && !area.innerHTML.includes('⏳')) return;

  _labCIPItems[uid] = 0;

  // Load existing CIP entries kalau ada
  const existing = proj.cipLabEntries || [];

  // Tampilkan loading dulu
  area.innerHTML = `<div style="padding:40px;text-align:center;color:var(--txt3)">⏳ Memuat data lab...</div>`;

  // ── Baca state dari sessionStorage (survive navigasi antar halaman) ──
  const _ssKey     = (u) => 'lab_form_' + encodeURIComponent(u);
  const _readSS    = (u) => { try { return JSON.parse(sessionStorage.getItem(_ssKey(u)) || 'null') || null; } catch { return null; } };

  // Fetch data terbaru dari DB (untuk CIP entries)
  fetch('/api/dataentry/laboratorium?project_name=' + encodeURIComponent(proj.name) + '&limit=1')
    .then(r => r.json())
    .then(json => {
      const dbRow        = json.success && json.data?.length ? json.data[0] : null;
      const dbCipEntries = dbRow?.cip_lab_entries || null;
      if (dbCipEntries && dbCipEntries.length > 0) {
        const allProjs = gPJ('ongoing');
        const projIdx  = parseInt(uid.split('_proj_')[1]);
        if (allProjs[projIdx]) {
          allProjs[projIdx].cipLabEntries = dbCipEntries;
          sPJ('ongoing', allProjs);
        }
      }
      const cipEntries = dbCipEntries || existing;

      // Restore state: prioritas sessionStorage → DB → kosong
      const savedState = _readSS(uid);
      // DB sudah diambil dari fetch di atas (dbRow)
      const prevBrix  = savedState?.brixEntries  || dbRow?.brix_entries     || [];
      const prevMoist = savedState?.moistEntries || dbRow?.moisture_entries || [];

      _renderLabForm(area, uid, proj, key, cipEntries, prevBrix, prevMoist);
      area.dataset.renderedUid = uid;

      // Pasang auto-save ke sessionStorage setiap perubahan input
      _labAttachAutoSave(uid);
    })
    .catch(() => {
      const savedState = _readSS(uid);
      const prevBrix   = savedState?.brixEntries  || [];
      const prevMoist  = savedState?.moistEntries || [];
      _renderLabForm(area, uid, proj, key, existing, prevBrix, prevMoist);
      area.dataset.renderedUid = uid;
      _labAttachAutoSave(uid);
    });
}

// ── Auto-save form state ke sessionStorage setiap input ──────────────
function _labAttachAutoSave(uid) {
  const _ssKey   = (u) => 'lab_form_' + encodeURIComponent(u);
  const _writeSS = (u, data) => { try { sessionStorage.setItem(_ssKey(u), JSON.stringify(data)); } catch {} };

  const _collectState = () => {
    const brixEntries  = [];
    const moistEntries = [];

    const brixCont = document.getElementById('lab-'+uid+'-brix-form-entries');
    if (brixCont) {
      Array.from(brixCont.children).forEach((entryDiv, i) => {
        const entryId  = entryDiv.id || '';
        const idxMatch = entryId.match(/brix-entry-(?:new-)?(\d+)$/);
        const eIdx     = idxMatch ? idxMatch[1] : i;
        const sampleEl   = entryDiv.querySelector(`select[id$="-tlv-${eIdx}"], select[id$="-tlv-new-${eIdx}"]`);
        const kodeEl     = entryDiv.querySelector(`input[id$="-lab-code-${eIdx}"], input[id$="-lab-code-new-${eIdx}"]`);
        const brixEl     = entryDiv.querySelector(`input[id$="-air-test-${eIdx}"], input[id$="-air-test-new-${eIdx}"]`);
        const locationEl = entryDiv.querySelector(`select.location-dropdown`);
        const notesEl    = entryDiv.querySelector(`textarea[id*="-notes-brix-"]`);
        brixEntries.push({
          sample:   sampleEl?.value?.trim()   || '',
          kode:     kodeEl?.value?.trim()     || '',
          brix:     brixEl?.value?.trim()     || '',
          location: locationEl?.value?.trim() || '',
          notes:    notesEl?.value?.trim()    || '',
        });
      });
    }

    const moistCont = document.getElementById('lab-'+uid+'-moisture-form-entries');
    if (moistCont) {
      Array.from(moistCont.children).forEach((entryDiv, i) => {
        const entryId  = entryDiv.id || '';
        const idxMatch = entryId.match(/moisture-entry-(?:new-)?(\d+)$/);
        const eIdx     = idxMatch ? idxMatch[1] : i;
        const sampleEl = entryDiv.querySelector(`select[id$="-moist-tlv-${eIdx}"], select[id$="-moist-new-${eIdx}"]`);
        const mcEl     = entryDiv.querySelector(`input[id$="-sampling-point-${eIdx}"], input[id$="-sampling-point-new-${eIdx}"]`);
        const notesEl  = entryDiv.querySelector(`textarea[id*="-notes-moisture-"]`);
        moistEntries.push({
          sample: sampleEl?.value?.trim() || '',
          mc:     mcEl?.value?.trim()     || '',
          notes:  notesEl?.value?.trim()  || '',
        });
      });
    }

    // ── Hanya tulis ke sessionStorage kalau ada data yang diisi ──
    // Jangan timpa state yang sudah ada dengan state kosong
    const hasAnyData =
      brixEntries.some(e  => e.sample || e.kode || e.brix || e.location || e.notes) ||
      moistEntries.some(e => e.sample || e.mc   || e.notes);

    if (hasAnyData) {
      _writeSS(uid, { brixEntries, moistEntries });
      console.log('💾 Lab state saved:', uid, brixEntries.length, 'brix,', moistEntries.length, 'moist');
    }
    // Kalau kosong semua — tidak menulis (jaga state yang sudah ada)
  };

  // Expose agar bisa dipanggil dari luar (misal sebelum navigasi)
  window._labCollectState = window._labCollectState || {};
  window._labCollectState[uid] = _collectState;

  const _attachListeners = (cont) => {
    if (!cont) return;
    cont.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.dataset.labAutoSave) {
        el.dataset.labAutoSave = '1';
        el.addEventListener('input',  _collectState);
        el.addEventListener('change', _collectState);
      }
    });
    // MutationObserver untuk entry baru (Add Entry)
    if (!cont._labObserver) {
      cont._labObserver = new MutationObserver(() => {
        _attachListeners(cont);
        _collectState(); // simpan segera saat ada perubahan struktur
      });
      cont._labObserver.observe(cont, { childList: true, subtree: false });
    }
  };

  // Langsung pasang tanpa delay
  _attachListeners(document.getElementById('lab-'+uid+'-brix-form-entries'));
  _attachListeners(document.getElementById('lab-'+uid+'-moisture-form-entries'));
  // TIDAK memanggil _collectState() di sini — form baru render masih kosong,
  // jangan timpa state yang sudah ada di sessionStorage

  // Hook navigasi: simpan state sebelum halaman/tab diganti
  // Pakai visibilitychange (tab background) dan beforeunload (close/refresh)
  const _saveOnLeave = () => _collectState();
  if (!window._labLeaveHooked) {
    window._labLeaveHooked = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Simpan semua uid yang aktif
        Object.values(window._labCollectState || {}).forEach(fn => fn());
      }
    });
    window.addEventListener('beforeunload', () => {
      Object.values(window._labCollectState || {}).forEach(fn => fn());
    });
  }
}
window._labAttachAutoSave = _labAttachAutoSave;

function _renderLabForm(area, uid, proj, key, existing, prevBrix, prevMoist) {
  // Helper untuk pre-fill brix entries
  const brixEntryHTML = (entries) => {
    if (!entries.length) {
      return `<div id="lab-${uid}-brix-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
          <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-brix-entry-0').remove()" style="display:none;" title="Hapus entry">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-tlv-0', '', 'brix')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Kode Pile</label>${makeInputField('lab-'+uid+'-lab-code-0', '')}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Brix</label>${makeInputField('lab-'+uid+'-air-test-0', '')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Sample Location</label>${buildLocationDropdown('lab-'+uid+'-location-0', '')}</div>
        </div>
        <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label>${makeTextareaField('lab-'+uid+'-notes-brix-0', '')}</div>
      </div>`;
    }
    return entries.map((e, i) => `
      <div id="lab-${uid}-brix-entry-${i}" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#666;">Entry #${i+1}</div>
          <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-brix-entry-${i}').remove()" style="${i===0?'display:none;':''}" title="Hapus entry">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-tlv-'+i, e.sample||'')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Kode Pile</label>${makeInputField('lab-'+uid+'-lab-code-'+i, e.kode||'')}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Brix</label>${makeInputField('lab-'+uid+'-air-test-'+i, e.brix||'')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Sample Location</label>${buildLocationDropdown('lab-'+uid+'-location-'+i, e.location||'')}</div>
        </div>
        <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label>${makeTextareaField('lab-'+uid+'-notes-brix-'+i, e.notes||'')}</div>
      </div>`).join('');
  };

  const moistEntryHTML = (entries) => {
    if (!entries.length) {
      return `<div id="lab-${uid}-moisture-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
          <button class="fp-item-remove" style="display:none;" title="Hapus entry">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-moist-tlv-0', '', 'moisture')}</div>
        </div>
        <div class="de-field"><label class="de-label" style="color:#111;">MC%</label>${makeInputField('lab-'+uid+'-sampling-point-0', '')}</div>
        <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label>${makeTextareaField('lab-'+uid+'-notes-moisture-0', '')}</div>
      </div>`;
    }
    return entries.map((e, i) => `
      <div id="lab-${uid}-moisture-entry-${i}" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#666;">Entry #${i+1}</div>
          <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-moisture-entry-${i}').remove()" style="${i===0?'display:none;':''}" title="Hapus entry">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-moist-tlv-'+i, e.sample||'')}</div>
        </div>
        <div class="de-field"><label class="de-label" style="color:#111;">MC%</label>${makeInputField('lab-'+uid+'-sampling-point-'+i, e.mc||'')}</div>
        <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label>${makeTextareaField('lab-'+uid+'-notes-moisture-'+i, e.notes||'')}</div>
      </div>`).join('');
  };

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
          ${brixEntryHTML(prevBrix)}
        </div>
        <button class="de-btn de-btn-primary" style="padding:8px 16px;font-size:12px;margin-top:10px;" onclick="labAddBrixFormEntry('${uid}')">＋ Add Entry</button>
      </div>

      <!-- MOISTURE Form Content -->
      <div id="lab-${uid}-form-moisture" style="display:none;margin-bottom:20px;">
        <!-- Container untuk multiple MOISTURE entries -->
        <div id="lab-${uid}-moisture-form-entries">
          ${moistEntryHTML(prevMoist)}
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
        ${buildSampleDropdown(`lab-${uid}-tlv-new-${newIdx}`, '', 'brix')}
      </div>
      <div class="de-field">
        <label class="de-label" style="color:#111;">Kode Pile</label>
        <input class="de-input" type="text" id="lab-${uid}-lab-code-new-${newIdx}" placeholder="—">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
      <div class="de-field">
        <label class="de-label" style="color:#111;">Brix</label>
        <input class="de-input" type="text" id="lab-${uid}-air-test-new-${newIdx}" placeholder="—">
      </div>
      <div class="de-field">
        <label class="de-label" style="color:#111;">Sample Location</label>
        ${buildLocationDropdown(`lab-${uid}-location-new-${newIdx}`, '')}
      </div>
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">Catatan</label>
      <textarea class="de-input de-textarea" id="lab-${uid}-notes-brix-new-${newIdx}" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea>
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
        ${buildSampleDropdown(`lab-${uid}-moist-new-${newIdx}`, '', 'moisture')}
      </div>
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">MC%</label>
      <input class="de-input" type="text" id="lab-${uid}-sampling-point-new-${newIdx}" placeholder="—">
    </div>
    <div class="de-field">
      <label class="de-label" style="color:#111;">Catatan</label>
      <textarea class="de-input de-textarea" id="lab-${uid}-notes-moisture-new-${newIdx}" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea>
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
  // Hapus draft sessionStorage
  try { sessionStorage.removeItem('lab_form_' + encodeURIComponent(uid)); } catch {}
  // Reset BRIX: hapus semua entry, ganti dengan 1 entry kosong
  const brixCont = document.getElementById('lab-'+uid+'-brix-form-entries');
  if (brixCont) {
    brixCont.innerHTML = `<div id="lab-${uid}-brix-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
        <button class="fp-item-remove" onclick="document.getElementById('lab-${uid}-brix-entry-0').remove()" style="display:none;" title="Hapus entry">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
        <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-tlv-0', '', 'brix')}</div>
        <div class="de-field"><label class="de-label" style="color:#111;">Kode Pile</label><input class="de-input" type="text" id="lab-${uid}-lab-code-0" placeholder="—"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
        <div class="de-field"><label class="de-label" style="color:#111;">Brix</label><input class="de-input" type="text" id="lab-${uid}-air-test-0" placeholder="—"></div>
        <div class="de-field"><label class="de-label" style="color:#111;">Sample Location</label>${buildLocationDropdown('lab-'+uid+'-location-0', '')}</div>
      </div>
      <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label><textarea class="de-input de-textarea" id="lab-${uid}-notes-brix-0" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea></div>
    </div>`;
  }

  // Reset MOISTURE: hapus semua entry, ganti dengan 1 entry kosong
  const moistCont = document.getElementById('lab-'+uid+'-moisture-form-entries');
  if (moistCont) {
    moistCont.innerHTML = `<div id="lab-${uid}-moisture-entry-0" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#666;">Entry #1</div>
        <button class="fp-item-remove" style="display:none;" title="Hapus entry">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
        <div class="de-field"><label class="de-label" style="color:#111;">Nama Sample</label>${buildSampleDropdown('lab-'+uid+'-moist-tlv-0', '', 'moisture')}</div>
      </div>
      <div class="de-field"><label class="de-label" style="color:#111;">MC%</label><input class="de-input" type="text" id="lab-${uid}-sampling-point-0" placeholder="—"></div>
      <div class="de-field"><label class="de-label" style="color:#111;">Catatan</label><textarea class="de-input de-textarea" id="lab-${uid}-notes-moisture-0" style="min-height:60px;" placeholder="Catatan tambahan..."></textarea></div>
    </div>`;
  }
}
window.labResetProject = labResetProject;

// ── Save Lab Form ────────────────────────────────────
function labSaveProject(uid, projName) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Lab Project ini?')) return;
  const projIdx = +uid.split('_').pop();
  const projs = gPJ('ongoing');
  const proj = projs[projIdx];
  if (!proj) return;
  
  // Tangkap semua baris pada form BRIX — baca by ID bukan by index
  // (baca by index rentan geser karena location dropdown inject hidden input)
  const brixEntries = [];
  const brixContainer = document.getElementById('lab-'+uid+'-brix-form-entries');
  if (brixContainer) {
    Array.from(brixContainer.children).forEach((entryDiv, i) => {
      // Cari index entry dari id div (brix-entry-N atau brix-entry-new-N)
      const entryId = entryDiv.id || '';
      const idxMatch = entryId.match(/brix-entry-(?:new-)?(\d+)$/);
      const eIdx = idxMatch ? idxMatch[1] : i;

      // Baca by ID — cover pola awal (-N) dan pola new entry (-new-N)
      const sampleEl   = entryDiv.querySelector(`select[id$="-tlv-${eIdx}"], select[id$="-tlv-new-${eIdx}"]`);
      const kodeEl     = entryDiv.querySelector(`input[id$="-lab-code-${eIdx}"], input[id$="-lab-code-new-${eIdx}"]`);
      const brixEl     = entryDiv.querySelector(`input[id$="-air-test-${eIdx}"], input[id$="-air-test-new-${eIdx}"]`);
      const locationEl = entryDiv.querySelector(`select.location-dropdown`);
      const notesEl    = entryDiv.querySelector(`textarea[id*="-notes-brix-"]`);

      const _sampleRaw = sampleEl?.value?.trim() || '';
      const sample   = (_sampleRaw === '__ADD_NEW__' || _sampleRaw === '__ADD_LOC__') ? '' : _sampleRaw;
      const kode     = kodeEl?.value?.trim()     || '';
      const brix     = brixEl?.value?.trim()     || '';
      const _locRaw  = locationEl?.value?.trim() || '';
      const location = (_locRaw === '__ADD_LOC__' || _locRaw === '__ADD_NEW__') ? '' : _locRaw;
      const notes    = notesEl?.value?.trim()    || '';
      if (sample || kode || brix || location || notes) {
        brixEntries.push({ sample, kode, brix, location, notes });
      }
    });
  }

  // Tangkap semua baris pada form MOISTURE — baca by ID
  const moistEntries = [];
  const moistContainer = document.getElementById('lab-'+uid+'-moisture-form-entries');
  if (moistContainer) {
    Array.from(moistContainer.children).forEach((entryDiv, i) => {
      const entryId  = entryDiv.id || '';
      const idxMatch = entryId.match(/moisture-entry-(?:new-)?(\d+)$/);
      const eIdx = idxMatch ? idxMatch[1] : i;

      const sampleEl = entryDiv.querySelector(`select[id$="-moist-tlv-${eIdx}"], select[id$="-moist-new-${eIdx}"]`);
      const mcEl     = entryDiv.querySelector(`input[id$="-sampling-point-${eIdx}"], input[id$="-sampling-point-new-${eIdx}"]`);
      const notesEl  = entryDiv.querySelector(`textarea[id*="-notes-moisture-"]`);

      const _moistSampleRaw = sampleEl?.value?.trim() || '';
      const sample = (_moistSampleRaw === '__ADD_NEW__' || _moistSampleRaw === '__ADD_LOC__') ? '' : _moistSampleRaw;
      const mc     = mcEl?.value?.trim()     || '';
      const notes  = notesEl?.value?.trim()  || '';
      if (sample || mc || notes) {
        moistEntries.push({ sample, mc, notes });
      }
    });
  }

  // Siapkan label baru untuk diletakkan di history
  const labHistFields = [];

  brixEntries.forEach((e, i) => {
    const suffix = brixEntries.length > 1 ? ` (Baris ${i+1})` : '';
    if (e.sample || e.kode || e.brix || e.location || e.notes) {
      labHistFields.push({ label: `Nama Sample (Brix)${suffix}`, oldVal: '', newVal: e.sample });
      labHistFields.push({ label: `Kode Pile${suffix}`, oldVal: '', newVal: e.kode });
      labHistFields.push({ label: `Brix${suffix}`, oldVal: '', newVal: e.brix });
      if (e.location) labHistFields.push({ label: `Location${suffix}`, oldVal: '', newVal: e.location });
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
  const showSt = (type, msg) => { if(b&&m){b.style.display='flex';b.className='de-status-bar de-status-'+type;m.textContent=msg;} };
  showSt('loading', '⏳ Menyimpan ke database...');

  (async () => {
    try {
      const payload = {
        project_name:     projName,
        cip_lab_done:     proj.cipLabDone    || false,
        cip_lab_checks:   proj.cipLabChecks  || {},
        cip_lab_entries:  proj.cipLabEntries || [],
        brix_entries:     brixEntries,
        moisture_entries: moistEntries,
        foto_urls:        window._photoData?.['lab_'+uid] || [],
      };
      const res  = await fetch('/api/dataentry/laboratorium', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal simpan');
      showSt('success', '✅ Lab untuk "' + projName + '" tersimpan ke database!');
      // Hapus draft sessionStorage setelah save sukses — data sudah di DB
      try { sessionStorage.removeItem('lab_form_' + encodeURIComponent(uid)); } catch {}
      // Form TIDAK di-reset otomatis. User klik Reset kalau ingin input entry baru.
    } catch(err) {
      console.error('labSaveProject API error:', err);
      showSt('success', '✅ Lab tersimpan (lokal). DB: ' + err.message);
    }
    setTimeout(() => { if(b) b.style.display='none'; }, 3000);
  })();
}
window.labSaveProject = labSaveProject;

// ── Helper: build satu baris entry CIP ──────────────
function buildLabCIPRow(uid, idx, data) {
  const rowId  = uid+'-cip-row-'+idx;
  const savedTs = data?.timestamp || '';
  return `
    <div id="${rowId}" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;
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
      <div>
        <label class="de-label" style="font-size:9px;color:#111;">WAKTU</label>
        <input class="de-input" type="text" readonly
          id="${uid}-cip-ts-${idx}"
          value="${savedTs}"
          placeholder="Klik →"
          onclick="if(!this.value){const n=new Date();this.value=n.toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});this.style.color='#111';this.style.fontWeight='700';}"
          style="cursor:pointer;color:${savedTs?'#111':'#9ca3af'};font-family:monospace;font-size:11px;font-weight:${savedTs?'700':'400'};" title="Klik untuk set waktu sekarang">
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
    const ts  = document.getElementById(uid+'-cip-ts-'+idx)?.value.trim() || '';
    if (ph || ket) entries.push({ ph: ph || '', keterangan: ket || '', timestamp: ts });
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

  showLabCIPSt(uid, 'loading', '⏳ Menyimpan CIP ke database...');

  (async () => {
    try {
      const proj = allProjs[projIdx];
      const payload = {
        project_name:     proj.name,
        cip_lab_done:     true,
        cip_lab_checks:   proj.cipLabChecks || proj.cip_lab_checks || {},
        cip_lab_entries:  entries,
        brix_entries:     [],
        moisture_entries: [],
        foto_urls:        window._photoData?.['lab_'+uid] || [],
      };
      const res  = await fetch('/api/dataentry/laboratorium', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal simpan');

      // ✅ Update cip_lab_done di tabel projects supaya tombol End aktif
      if (proj._id) {
        await fetch('/api/projects/'+proj._id+'/cip', {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ cip_lab_done: true, cip_lab_checks: { entries } }),
        });
      }

      // Reload cache dari DB
      await loadPJ('ongoing');
      renderPJ('ongoing');

      showLabCIPSt(uid, 'success', '✅ CIP Lab tersimpan ke database! ' + entries.length + ' entry.');
    } catch(err) {
      console.error('labSaveCIPEntries API error:', err);
      showLabCIPSt(uid, 'error', '❌ Gagal simpan: ' + err.message);
    }
    setTimeout(() => {
      const sb = document.getElementById(uid+'-cip-sb');
      if (sb) sb.style.display = 'none';
      setTimeout(() => labToggleCIPForm(uid), 1500);
    }, 500);
  })();
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

// Toggle fields sesuai section — WWTP pakai COD/BOD, lainnya TDS/Hardness/PH/Alkali
function labHarianToggleFields(key) {
  const section         = document.getElementById('lab-h-'+key+'-section')?.value;
  const stdFields       = document.getElementById('lab-h-'+key+'-std-fields');
  const wwtpFields      = document.getElementById('lab-h-'+key+'-wwtp-fields');
  const otherNameField  = document.getElementById('lab-h-'+key+'-other-name-field');
  if (!stdFields || !wwtpFields) return;

  if (section === 'wwtp') {
    stdFields.style.display      = 'none';
    wwtpFields.style.display     = 'block';
    if (otherNameField) otherNameField.style.display = 'none';
  } else if (section === 'other') {
    stdFields.style.display      = 'contents';
    wwtpFields.style.display     = 'none';
    if (otherNameField) otherNameField.style.display = 'block';
  } else {
    stdFields.style.display      = 'contents';
    wwtpFields.style.display     = 'none';
    if (otherNameField) otherNameField.style.display = 'none';
  }
}
window.labHarianToggleFields = labHarianToggleFields;

function labResetHarian(key) {
  ['section','ph','tds','hardness','alkali','notes','cod','bod','wwtp-ph','wwtp-tds','other-name'].forEach(f => {
    const el = document.getElementById('lab-h-'+key+'-'+f); if(el) el.value='';
  });
  const tglEl = document.getElementById('lab-h-'+key+'-tanggal');
  if (tglEl) tglEl.value = new Date().toISOString().split('T')[0];
  labHarianToggleFields(key);
}
window.labResetHarian = labResetHarian;

async function labSaveHarian(key) {
  const section = document.getElementById('lab-h-'+key+'-section')?.value;
  if (!section) return alert('⚠️ Pilih section terlebih dahulu!');

  const sb = document.getElementById('lab-h-'+key+'-sb');
  const sm = document.getElementById('lab-h-'+key+'-sm');
  if (sb && sm) { sb.style.display='flex'; sb.className='de-status-bar de-status-loading'; sm.textContent='⏳ Menyimpan...'; }

  // Kumpulkan analisa sesuai section
  let analisa = {};
  if (section === 'wwtp') {
    analisa = {
      cod:    document.getElementById('lab-h-'+key+'-cod')?.value      || null,
      bod:    document.getElementById('lab-h-'+key+'-bod')?.value      || null,
      ph:     document.getElementById('lab-h-'+key+'-wwtp-ph')?.value  || null,
      tds:    document.getElementById('lab-h-'+key+'-wwtp-tds')?.value || null,
    };
  } else {
    analisa = {
      ph:       document.getElementById('lab-h-'+key+'-ph')?.value       || null,
      tds:      document.getElementById('lab-h-'+key+'-tds')?.value      || null,
      hardness: document.getElementById('lab-h-'+key+'-hardness')?.value || null,
      alkali:   document.getElementById('lab-h-'+key+'-alkali')?.value   || null,
    };
  }

  // Untuk section "other", ambil nama custom yang diisi user
  const sectionLabel = section === 'other'
    ? (document.getElementById('lab-h-'+key+'-other-name')?.value.trim() || 'Lain-lain')
    : section;

  const payload = {
    tanggal:       document.getElementById('lab-h-'+key+'-tanggal')?.value || new Date().toISOString().split('T')[0],
    section:       sectionLabel,
    analisa:       analisa,
    notes:         document.getElementById('lab-h-'+key+'-notes')?.value.trim() || '',
    entry_by:      window.SAIL_USER?.username || 'Operator'
  };

  try {
    const response = await fetch('/api/dataentry/laboratorium-harian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    if (res.success) {
      if (sb && sm) { sb.className='de-status-bar de-status-success'; sm.textContent='✅ Data tersimpan!'; setTimeout(()=>{sb.style.display='none';},3000); }
      labResetHarian(key);
      if (typeof fetchWaterQuality === 'function') fetchWaterQuality();
      if (window.loadReportingData) window.loadReportingData();
    } else {
      if (sb && sm) { sb.className='de-status-bar de-status-error'; sm.textContent='❌ Error: '+(res.error||'Gagal'); }
    }
  } catch (err) {
    if (sb && sm) { sb.className='de-status-bar de-status-error'; sm.textContent='❌ Gagal terhubung ke server'; }
  }
}

async function saveLaboratoriumHarian(req, res) {
  try {
    const d   = req.body;
    const tgl = d.tanggal || new Date().toISOString().split('T')[0];
    const section = d.section || null; // 'tw1' | 'tw2' | 'filter'
    const a   = d.analisa || {};

    // Build string notes (backward compat)
    const parts = [];
    if (section)    parts.push('[' + section.toUpperCase() + ']');
    if (a.sample)   parts.push('Sample: ' + a.sample);
    if (a.ph)       parts.push('pH: ' + a.ph);
    if (a.tds)      parts.push('TDS: ' + a.tds);
    if (a.hardness) parts.push('Hardness: ' + a.hardness);
    if (a.alkali)   parts.push('Alkali: ' + a.alkali);
    const newEntryText = parts.join(' | ');

    // Build water_quality update untuk section ini
    const wqEntry = section ? {
      tds:      a.tds      ? parseFloat(a.tds)      : null,
      hardness: a.hardness ? parseFloat(a.hardness) : null,
      ph:       a.ph       ? parseFloat(a.ph)        : null,
      alkaline: a.alkali   ? parseFloat(a.alkali)   : null,
      sample:   a.sample   || null,
      updated_at: new Date().toISOString()
    } : null;

    // Cek apakah baris tanggal ini sudah ada
    const existing = await pool.query(
      `SELECT id, notes, water_quality FROM de_laboratorium_harian WHERE tanggal = $1`,
      [tgl]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const oldNotes      = row.notes || '';
      const updatedNotes  = oldNotes + (oldNotes ? '\n' : '') + newEntryText;
      const oldWQ         = row.water_quality || {};
      const updatedWQ     = section
        ? { ...oldWQ, [section]: wqEntry }
        : oldWQ;

      await pool.query(
        `UPDATE de_laboratorium_harian
         SET notes = $1, water_quality = $2, updated_at = now()
         WHERE id = $3`,
        [updatedNotes, JSON.stringify(updatedWQ), row.id]
      );
    } else {
      const initWQ = section ? { [section]: wqEntry } : {};
      await pool.query(
        `INSERT INTO de_laboratorium_harian (tanggal, notes, water_quality, created_by)
         VALUES ($1, $2, $3, $4)`,
        [tgl, newEntryText, JSON.stringify(initWQ), d.entry_by || null]
      );
    }

    res.json({ success: true, message: 'Data analisa air tersimpan' });
  } catch (err) {
    console.error('saveLaboratoriumHarian error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}


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
    // Simpan seluruh state form sebelum rebuild
    const savedState = {
      date:  document.getElementById(key+'-date')?.value  || '',
      awal:  document.getElementById(key+'-awal')?.value  || '',
      akhir: document.getElementById(key+'-akhir')?.value || '',
      vol:   document.getElementById(key+'-vol')?.value   || '',
      cod:   document.getElementById(key+'-cod')?.value   || '',
      bod:   document.getElementById(key+'-bod')?.value   || '',
      tss:   document.getElementById(key+'-tss')?.value   || '',
      ph:    document.getElementById(key+'-ph')?.value    || '',
      notes: document.getElementById(key+'-notes')?.value || '',
      proj:  document.getElementById('limbah-proj-sel')?.value || '',
    };

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
    }

    // Restore semua nilai setelah rebuild dropdown
    const setV = (id, val) => { const el = document.getElementById(id); if(el && val !== '') el.value = val; };
    setV(key+'-date',  savedState.date  || new Date().toISOString().split('T')[0]);
    setV(key+'-awal',  savedState.awal);
    setV(key+'-akhir', savedState.akhir);
    setV(key+'-cod',   savedState.cod);
    setV(key+'-bod',   savedState.bod);
    setV(key+'-tss',   savedState.tss);
    setV(key+'-ph',    savedState.ph);
    setV(key+'-notes', savedState.notes);
    if (psel && savedState.proj !== '') psel.value = savedState.proj;

    // Hitung ulang vol dan update display
    if (savedState.awal || savedState.akhir) {
      calcLimbahTotal(key);
    } else if (savedState.vol) {
      setV(key+'-vol', savedState.vol);
    }

    // Toggle mode sesuai project yang terpilih (tanpa clear nilai)
    const projSel = document.getElementById('limbah-proj-sel');
    const awalWrap  = document.getElementById(key+'-awal-wrap');
    const akhirWrap = document.getElementById(key+'-akhir-wrap');
    const volEl     = document.getElementById(key+'-vol');
    if (projSel && awalWrap && akhirWrap && volEl) {
      if (projSel.value !== '') {
        awalWrap.style.display  = '';
        akhirWrap.style.display = '';
        volEl.readOnly = true;
        volEl.style.background = '#f3f4f6';
        volEl.placeholder = 'Auto (Akhir - Awal)';
      } else {
        awalWrap.style.display  = 'none';
        akhirWrap.style.display = 'none';
        volEl.readOnly = false;
        volEl.style.background = '#fff';
        volEl.placeholder = 'Input manual...';
      }
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
    // DOM baru saja dibuat ulang oleh loadPage — restore project + form dari sessionStorage

    // 1. Cari uid yang punya state di sessionStorage
    const savedUid = (() => {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('lab_form_')) {
          const uid = decodeURIComponent(k.replace('lab_form_', ''));
          const data = JSON.parse(sessionStorage.getItem(k) || 'null');
          // Cek apakah ada data yang tidak kosong
          const hasData = data && (
            data.brixEntries?.some(e => e.sample || e.kode || e.brix || e.location || e.notes) ||
            data.moistEntries?.some(e => e.sample || e.mc || e.notes)
          );
          if (hasData) return uid;
        }
      }
      return null;
    })();

    if (savedUid) {
      // Ada data yang belum disave — restore ke tab Project dan pilih project yang benar
      const projIdx = savedUid.split('_proj_')[1];
      const tabP = document.getElementById('lab-tab-project-' + key);
      if (tabP) tabP.click(); // switch ke tab Project

      // Tunggu dropdown project ter-populate, lalu pilih project dan render
      const _tryRestoreProject = (attempt) => {
        const sel = document.getElementById('lab-proj-sel-' + key);
        if (sel && sel.options.length > 1) {
          sel.value = projIdx;
          if (sel.value === projIdx) {
            // Trigger render — labRenderProject akan baca sessionStorage
            labRenderProject(key);
            return;
          }
        }
        if (attempt < 20) setTimeout(() => _tryRestoreProject(attempt + 1), 100);
      };
      setTimeout(() => _tryRestoreProject(0), 150);
    } else {
      // Tidak ada draft — buka tab Harian seperti biasa
      const tabH = document.getElementById('lab-tab-harian-' + key);
      if (tabH) tabH.click();
    }
    return;
  }

  // ── PRODUCTION ───────────────────────────────────────────
  const sel = document.getElementById('dep-proj-sel-'+key);
  if(!sel) return;

  // Reset form dan stage panel saat halaman dibuka ulang — user harus pilih project lagi.
  // Ini mencegah auto-load project dari sesi sebelumnya (window._currentDEProj lama).
  window._currentDEProj = null;
  const wrapReset = document.getElementById('dep-form-'+key);
  if (wrapReset) wrapReset.innerHTML = '';
  const floatReset = document.getElementById('dep-stage-float-'+key);
  if (floatReset) floatReset.innerHTML = '';
  const spacerReset = document.getElementById('dep-stage-spacer-'+key);
  if (spacerReset) spacerReset.style.height = '0';
  const reopenReset = document.getElementById('dep-stage-reopen-'+key);
  if (reopenReset) reopenReset.style.display = 'none';

  sel.innerHTML = '<option value="">⏳ Memuat project...</option>';
  sel.disabled = true;

  loadPJ('ongoing').then(allProjs => {
    const currentRole = localStorage.getItem('role') || '';
    const isAdmin     = ['admin','superadmin'].includes(currentRole);

    // Filter: tampilkan project yang:
    // 1. allowed_roles null/kosong (dibuat admin tanpa restrict) → semua role lihat
    // 2. allowed_roles berisi role user ini
    // 3. Set point sudah diisi/di-save (tidak boleh muncul kalau belum ada set point)
    const roleFiltered = isAdmin ? allProjs : allProjs.filter(p => {
      if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
      return p.allowed_roles.includes(currentRole);
    });
    const visibleProjs = roleFiltered.filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);

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

// Build hanya section Parameter CT
function buildCTSectionOnly(key, sp) {
  const fieldMap = {};
  SP_FIELDS.forEach(f => { fieldMap[f.id] = f; });
  return DE_SECTIONS
    .filter(s => (s.label || '').toLowerCase().includes('parameter ct'))
    .map(section => {
      const fieldsHTML = section.fields
        .map(id => fieldMap[id]).filter(Boolean)
        .map(f => buildSetpointField(f, key, sp[f.id] || '')).join('');
      return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;background:${section.bg};border:1px solid ${section.border};border-radius:8px;padding:9px 14px;margin-bottom:12px;">
          <span style="font-size:15px;">${section.icon}</span>
          <span style="font-size:12px;font-weight:700;color:${section.color};letter-spacing:0.5px;text-transform:uppercase;">${section.label}</span>
        </div>
        <div class="setpoint-grid">${fieldsHTML}</div>
      </div>`;
    }).join('');
}

// Build semua section KECUALI Parameter CT
function buildSetpointExcludeCT(key, sp) {
  const fieldMap = {};
  SP_FIELDS.forEach(f => { fieldMap[f.id] = f; });
  return DE_SECTIONS
    .filter(s => !(s.label || '').toLowerCase().includes('parameter ct'))
    .map(section => {
      const fieldsHTML = section.fields
        .map(id => fieldMap[id]).filter(Boolean)
        .map(f => buildSetpointField(f, key, sp[f.id] || '')).join('');
      return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;background:${section.bg};border:1px solid ${section.border};border-radius:8px;padding:9px 14px;margin-bottom:12px;">
          <span style="font-size:15px;">${section.icon}</span>
          <span style="font-size:12px;font-weight:700;color:${section.color};letter-spacing:0.5px;text-transform:uppercase;">${section.label}</span>
        </div>
        <div class="setpoint-grid">${fieldsHTML}</div>
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
          <button class="de-btn de-btn-primary" id="dep-extraction-status-${key}" style="padding:8px 16px;font-size:12px;cursor:pointer;background:#7c3aed;border-color:#7c3aed;" onclick="openExtractionModal('${key}')">⚗️ Extraction</button>
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
  // Format angka ke 2 desimal; teks biasa dibiarkan apa adanya
  const fmt2 = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') return val;
    const n = parseFloat(String(val).replace(',', '.'));
    return isNaN(n) ? val : n.toFixed(2);
  };
  const spValFmt = (f.type === 'number' && spVal !== '' && spVal !== undefined) ? fmt2(spVal) : spVal;

  const extraNote = (f.id === 'sp-temp-top')
    ? ` oninput="checkTopColumnVacuum('${key}',this.value)"`
    : '';

  const isCalc = f.calculated;
  // Jika ini adalah field kalkulasi otomatis, setting awal adalah AUTO (Terkunci)
  const calcAttrs = isCalc ? ' data-mode="auto" readonly style="background:#f3f4f6;color:var(--txt3);cursor:not-allowed;" title="Auto-calculated"' : '';
  // Non-calculated: nilai tersimpan tampil abu, klik → kosong, blur tanpa ubah → abu kembali
  const hasSpVal = !isCalc && spValFmt !== '' && spValFmt !== undefined;
  const valueAttr = hasSpVal ? ` value="${spValFmt}" data-prev-value="${spValFmt}"` : ` data-prev-value=""`;
  const baseStyle = hasSpVal ? 'width:100%;color:#999;' : 'width:100%;';
  const ghostFocus = hasSpVal
    ? `if(this.value===this.dataset.prevValue&&this.dataset.prevValue!==''){this.value='';this.style.color='#111';}`
    : ``;
  const ghostBlur = hasSpVal
    ? `if(this.value===''&&this.dataset.prevValue!==''){this.value=this.dataset.prevValue;this.style.color='#999';}else if(this.value!==''){this.style.color='#111';this.dataset.prevValue=this.value;}${extraNote}`
    : `if(this.value!==''){this.style.color='#111';this.dataset.prevValue=this.value;}${extraNote}`;
  const inputAttrs = `class="de-input" id="dep-${f.id}-${key}" type="${f.type}" step="0.1" placeholder="${hasSpVal ? '—' : (spValFmt || '—')}"${valueAttr} style="${baseStyle}" onfocus="${ghostFocus}" onblur="${ghostBlur}" ${calcAttrs}`;

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
        <input ${inputAttrs}>
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
  if (!wrap) { console.error('Wrap not found:', key); return; }

  const draft = window._spDrafts?.[key] || {};
  const sp    = { ...(proj.setPoint || proj.set_point || {}), ...draft };
  const activeTab = window[`_depTab_${key}`] || 'setpoint';

  try {
    const tabBtnBase = 'padding:12px 24px;font-size:13px;font-weight:600;background:transparent;border:none;border-bottom:3px solid transparent;cursor:pointer;color:#666;transition:all .2s;';
    const tabBtnActive = 'border-bottom:3px solid var(--blue);color:var(--blue);';

    const html = `
      <!-- Tab Switch -->
      <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="dep-tab-btn-setpoint-${key}"
          style="${tabBtnBase}${activeTab==='setpoint' ? tabBtnActive : ''}"
          onclick="depSwitchTab('${key}','setpoint')">⚙️ Set Point</button>
        <button id="dep-tab-btn-ct-${key}"
          style="${tabBtnBase}${activeTab==='ct' ? tabBtnActive : ''}"
          onclick="depSwitchTab('${key}','ct')">📝 Parameter CT <span style="font-size:10px;color:#9ca3af;font-weight:400;">(opsional)</span></button>
      </div>

      <!-- TAB: SET POINT -->
      <div id="dep-tab-setpoint-${key}" style="display:${activeTab==='setpoint'?'block':'none'};">
        <div class="de-entry-note">
          ⚙️ <strong>Set Point</strong> — Nilai set point ditampilkan sebagai placeholder. Klik kolom untuk isi nilai baru.
        </div>
        <div style="margin-bottom:18px;">
          ${buildSetpointExcludeCT(key, sp)}
        </div>
        <div class="de-field" style="margin-bottom:16px;">
          <label class="de-label" style="color:#111;display:block;">NOTES</label>
          <textarea class="de-input de-textarea" id="dep-notes-${key}" placeholder="Catatan tambahan...">${sp.notes || ''}</textarea>
          ${buildPhotoUpload(key)}
        </div>
        <div class="de-status-bar" id="dep-sb-${key}" style="display:none"><span id="dep-sm-${key}"></span></div>
        <div class="de-actions" style="justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:8px;">
            <button class="de-btn de-btn-primary" id="dep-cip-status-${key}" style="padding:8px 16px;font-size:12px;cursor:pointer;">🧼 CIP</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="de-btn de-btn-ghost" onclick="resetDEP('${key}')">🔄 Reset</button>
            <button class="de-btn de-btn-primary" onclick="submitDEP('${key}')">💾 Save Data</button>
          </div>
        </div>
      </div>

      <!-- TAB: PARAMETER CT -->
      <div id="dep-tab-ct-${key}" style="display:${activeTab==='ct'?'block':'none'};">
        <div class="de-entry-note" style="background:#f0fdf4;border-color:#86efac;">
          📝 <strong>Parameter CT</strong> — Opsional. Isi dan simpan terpisah dari Set Point.
        </div>
        <div style="margin-bottom:18px;">
          ${buildCTSectionOnly(key, sp)}
        </div>
        <div class="de-status-bar" id="dep-ct-sb-${key}" style="display:none"><span id="dep-ct-sm-${key}"></span></div>
        <div class="de-actions" style="justify-content:flex-end;">
          <button class="de-btn de-btn-ghost" onclick="resetDECT('${key}')">🔄 Reset CT</button>
          <button class="de-btn de-btn-primary" onclick="submitDECT('${key}')" style="background:#059669;border-color:#059669;">💾 Save Parameter CT</button>
        </div>
      </div>`;

    wrap.innerHTML = html;
    setTimeout(() => setupSetpointCalculations(key), 10);

    // CIP listener
    const cipButton = wrap.querySelector('#dep-cip-status-'+key);
    if (cipButton) {
      cipButton.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (cipButton.disabled) { showQuickToast('❌ CIP sudah selesai!'); return; }
        openCIPModal(key);
      });
    }
    updateCIPStatus(key, proj);

  } catch (error) {
    console.error('Error rendering setpoint page:', error);
    wrap.innerHTML = '<div style="color:red;">Error: ' + error.message + '</div>';
  }
}

// ── Tab switch untuk Data Entry Production ──────────────────
function depSwitchTab(key, tab) {
  window[`_depTab_${key}`] = tab;
  const tabs = ['setpoint', 'ct'];
  tabs.forEach(t => {
    const btn  = document.getElementById(`dep-tab-btn-${t}-${key}`);
    const pane = document.getElementById(`dep-tab-${t}-${key}`);
    const active = t === tab;
    if (btn)  {
      btn.style.borderBottom = active ? '3px solid var(--blue)' : '3px solid transparent';
      btn.style.color        = active ? 'var(--blue)' : '#666';
    }
    if (pane) pane.style.display = active ? 'block' : 'none';
  });
}
window.depSwitchTab = depSwitchTab;

// ── Reset CT fields ─────────────────────────────────────────
function resetDECT(key) {
  const ctFieldIds = DE_SECTIONS
    .filter(s => (s.label || '').toLowerCase().includes('parameter ct'))
    .flatMap(s => s.fields);
  ctFieldIds.forEach(id => {
    const el = document.getElementById('dep-'+id+'-'+key);
    if (el) { el.value = ''; el.style.color = ''; }
  });
}
window.resetDECT = resetDECT;

// ── Submit khusus Parameter CT ──────────────────────────────
async function submitDECT(key) {
  const sel = document.getElementById('dep-proj-sel-'+key);
  const sb  = document.getElementById('dep-ct-sb-'+key);
  const sm  = document.getElementById('dep-ct-sm-'+key);
  const showStatus = (type, msg) => {
    if (sb && sm) { sb.style.display='flex'; sb.className='de-status-bar de-status-'+type; sm.textContent=msg; }
  };

  if (!sel || sel.value === '') { showStatus('error','❌ Pilih project dulu!'); return; }
  const proj = gPJ('ongoing')[+sel.value];
  if (!proj) return;

  if (!confirm('Apakah Anda yakin ingin menyimpan data Parameter CT ini?')) return;

  // Kumpulkan field CT dari DOM
  const ctFields = DE_SECTIONS
    .filter(s => (s.label || '').toLowerCase().includes('parameter ct'))
    .flatMap(s => s.fields);

  const ctData = {};
  let anyFilled = false;
  ctFields.forEach(id => {
    const el = document.getElementById('dep-'+id+'-'+key);
    const v  = el ? el.value.trim() : '';
    if (v !== '') { ctData[id] = v; anyFilled = true; }
  });

  if (!anyFilled) { showStatus('error','❌ Isi minimal satu field Parameter CT!'); return; }

  showStatus('loading','⏳ Menyimpan Parameter CT...');

  try {
    const allProjs = gPJ('ongoing');
    const idx = allProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
    const mergedCT = { ...(allProjs[idx]?.setPoint || proj.setPoint || {}), ...ctData };

    // 1. POST ke production history dengan flag _ct_only = true
    //    Ini agar history CT tersimpan di de_production_history tapi
    //    production-ops.js bisa memisahkannya dari SP updates
    const spOld = Object.fromEntries(
      SP_FIELDS_PAGE1.map(f => [f.id, proj.setPoint?.[f.id] ?? ''])
    );
    await fetch('/api/dataentry/production', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        project_name: proj.name,
        foto_urls:    [],
        _ct_only:     true,   // flag untuk production-ops.js
        ...spOld,             // SP lama (tidak berubah)
        ...ctData,            // CT fields baru
      }),
    });

    // 2. PUT setpoint project agar nilai CT terbaru tersimpan
    if (proj._id) {
      await fetch('/api/projects/'+proj._id+'/setpoint', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(mergedCT),
      });
    }

    // Update cache lokal
    if (idx >= 0) {
      allProjs[idx].setPoint = mergedCT;
      sPJ('ongoing', allProjs);
    }
    showStatus('success','✅ Parameter CT tersimpan!');
  } catch(err) {
    showStatus('error','❌ Gagal: ' + err.message);
  }
}
window.submitDECT = submitDECT;

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

  // Render Production Stage Tracker untuk tab production
  if (key === 'production') {
    // Render panel setelah DOM selesai diupdate oleh renderSetpointPage
    setTimeout(() => {
      renderProdStagePanel(key);
      // Pastikan panel visible — jika sebelumnya ditutup user, buka kembali
      const fw = document.getElementById('dep-stage-float-'+key);
      if (fw && fw.style.display === 'none') {
        toggleProdStagePanelFloat(key, true);
      }
      // Sembunyikan tombol reopen karena panel sudah tampil
      const reopen = document.getElementById('dep-stage-reopen-'+key);
      if (reopen) reopen.style.display = 'none';
    }, 100);
  }
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
    statusEl.disabled = false;
    statusEl.style.cursor = 'pointer';
    statusEl.style.opacity = '1';
    statusEl.title = 'Klik untuk melihat detail CIP';
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
    if(el){
      const prev = el.dataset.prevValue || '';
      if(prev !== ''){
        el.value = prev;
        el.style.color = '#999';
      } else {
        el.value = '';
        el.style.color = '';
      }
    }
  });
  // restore placeholders from current selected project
  loadDEProjForm(key);
}

// ═══════════════════════════════════════════════════════════
// CIP MODAL SYSTEM - Clean in Place with Checklist & Timestamp
// (CIP_CHECKLISTS definition moved to top of file for proper initialization)
// ═══════════════════════════════════════════════════════════

function buildCIPChecklist(key, cipData, readOnly = false) {
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
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
      const checkId   = `cip-check-${sIdx}-${iIdx}`;
      const timeId    = `cip-time-${sIdx}-${iIdx}`;
      const uniqueKey = `${sIdx}__${item}`;
      const isChecked = checks[uniqueKey] || checks[item] || false;
      const timestamp = cipData?.timestamps?.[uniqueKey] || '';

      const rowBg  = readOnly && isChecked ? '#f0fdf4' : 'var(--bg)';
      const rowBdr = readOnly && isChecked ? '#86efac' : 'var(--border)';
      const lblClr = readOnly && isChecked ? '#15803d' : 'var(--txt2)';
      const tsClr  = readOnly && isChecked ? '#15803d' : 'var(--txt3)';

      if (readOnly) {
        checklistHTML += `
          <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 12px;background:${rowBg};border:1px solid ${rowBdr};border-radius:6px;">
            <div style="width:16px;height:16px;border-radius:3px;border:2px solid ${isChecked ? '#15803d' : '#d1d5db'};background:${isChecked ? '#15803d' : '#fff'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${isChecked ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            </div>
            <span style="font-size:13px;color:${lblClr};font-weight:${isChecked ? '600' : '400'};">
              ${item}
            </span>
            <span id="${timeId}" style="font-size:11px;color:${isChecked ? '#111' : '#9ca3af'};font-family:monospace;min-width:120px;text-align:right;font-weight:${isChecked ? '800' : '400'};">
              ${timestamp || '—'}
            </span>
          </div>
        `;
      } else {
        const activeBg  = isChecked ? '#f0fdf4' : 'var(--bg)';
        const activeBdr = isChecked ? '#86efac' : 'var(--border)';
        const activeLbl = isChecked ? '#15803d' : 'var(--txt2)';
        checklistHTML += `
          <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 12px;background:${activeBg};border:1px solid ${activeBdr};border-radius:6px;transition:background .2s,border .2s;" id="cip-row-${sIdx}-${iIdx}">
            ${isChecked
              ? `<div data-checked="true" style="width:16px;height:16px;border-radius:3px;border:2px solid #15803d;background:#15803d;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>`
              : `<input type="checkbox" id="${checkId}" data-key="${uniqueKey}"
                       onchange="handleCIPCheckbox('${checkId}', '${timeId}', '${sIdx}', '${iIdx}')"
                       style="width:16px;height:16px;cursor:pointer;accent-color:#15803d;">`
            }
            <label for="${checkId}" style="font-size:13px;color:${activeLbl};cursor:${isChecked ? 'default' : 'pointer'};user-select:none;font-weight:${isChecked ? '600' : '400'};">
              ${item}
            </label>
            <span id="${timeId}" style="font-size:11px;color:${isChecked ? '#15803d' : '#9ca3af'};font-family:monospace;min-width:120px;text-align:right;font-weight:${isChecked ? '800' : '400'};">
              ${timestamp || '—'}
            </span>
          </div>
        `;
      }
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

function handleCIPCheckbox(checkId, timeId, sIdx, iIdx) {
  const checkbox = document.getElementById(checkId);
  const timeSpan = document.getElementById(timeId);
  const row      = document.getElementById(`cip-row-${sIdx}-${iIdx}`);

  if (checkbox && checkbox.checked) {
    // Ganti native checkbox dengan custom green checkmark div
    const customCheck = document.createElement('div');
    customCheck.style.cssText = 'width:16px;height:16px;border-radius:3px;border:2px solid #15803d;background:#15803d;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    customCheck.setAttribute('data-checked', 'true');
    customCheck.innerHTML = '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    checkbox.replaceWith(customCheck);

    // Hijau saat ter-lock
    if (row) {
      row.style.background = '#f0fdf4';
      row.style.border     = '1px solid #86efac';
    }
    const label = row?.querySelector('label');
    if (label) { label.style.color = '#15803d'; label.style.fontWeight = '600'; label.style.cursor = 'default'; }

    // Set timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    timeSpan.textContent      = timestamp;
    timeSpan.style.color      = '#15803d';
    timeSpan.style.fontWeight = '800';
    timeSpan.style.fontSize   = '11px';
  }
}

window.handleCIPCheckbox = handleCIPCheckbox;
window.buildCIPChecklist = buildCIPChecklist;
window.buildCIPFields = buildCIPFields;


// ══════════════════════════════════════════════════════════
// EXTRACTION MODAL — Terpisah dari CIP Production
// Items: Start Circulasi, Start slurry, Finish Raw Product
// ══════════════════════════════════════════════════════════
function openExtractionModal(key) {
  try {
    let sel = document.getElementById('dep-proj-sel-'+key);
    if (!sel) sel = document.getElementById('lab-proj-sel-'+key);
    if (!sel || sel.value === '') { showQuickToast('❌ Pilih project dulu!'); return; }

    const allProjs = gPJ('ongoing');
    const proj = allProjs[+sel.value];
    if (!proj) { showQuickToast('❌ Project tidak ditemukan!'); return; }

    const extractionItems = ['Start Circulasi', 'Start slurry', 'Finish Raw Product'];
    const exData = {
      checks:     proj.extraction_checks     || {},
      timestamps: proj.extraction_timestamps || {},
      done:       proj.extraction_done       || false,
    };

    const now    = new Date();
    const nowStr = now.toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const isDone = exData.done;

    let itemsHTML = '';
    extractionItems.forEach((item, idx) => {
      const checkId   = `ex-check-${idx}`;
      const timeId    = `ex-time-${idx}`;
      const isChecked = exData.checks[item] || false;
      const timestamp = exData.timestamps[item] || '';
      const tsColor   = isChecked ? '#111' : '#9ca3af';
      const tsWeight  = isChecked ? '800'  : '400';

      if (isDone) {
        itemsHTML += `
          <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 14px;background:${isChecked ? '#f0fdf4' : 'var(--bg)'};border:1px solid ${isChecked ? '#86efac' : 'var(--border)'};border-radius:8px;">
            <div style="width:18px;height:18px;border-radius:4px;border:2px solid ${isChecked ? '#15803d' : '#d1d5db'};background:${isChecked ? '#15803d' : '#fff'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${isChecked ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            </div>
            <span style="font-size:13px;font-weight:${isChecked ? '700' : '400'};color:${isChecked ? '#14532d' : 'var(--txt3)'};">${item}</span>
            <span style="font-size:11px;color:${tsColor};font-family:monospace;font-weight:${tsWeight};min-width:130px;text-align:right;">${timestamp || '—'}</span>
          </div>`;
      } else {
        itemsHTML += `
          <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;">
            <input type="checkbox" id="${checkId}" ${isChecked ? 'checked' : ''}
                   onchange="handleExtractionCheckbox('${checkId}','${timeId}')"
                   style="width:18px;height:18px;cursor:pointer;accent-color:#7c3aed;">
            <label for="${checkId}" style="font-size:13px;color:var(--txt2);cursor:pointer;user-select:none;font-weight:500;">${item}</label>
            <span id="${timeId}" style="font-size:11px;color:${tsColor};font-family:monospace;font-weight:${tsWeight};min-width:130px;text-align:right;">${timestamp || '—'}</span>
          </div>`;
      }
    });

    const modalHTML = `
      <div id="extraction-modal-overlay" onclick="closeExtractionModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;"></div>
      <div id="extraction-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:0;width:min(560px,92vw);max-height:88vh;overflow:hidden;z-index:9999;box-shadow:0 25px 70px rgba(0,0,0,.3);">

        <div style="padding:20px 24px;border-bottom:1px solid var(--border);background:${isDone ? '#4c1d95' : '#3b0764'};display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;">
              ⚗️ Extraction
              ${isDone ? '<span style="font-size:11px;font-weight:600;background:#7c3aed;color:#ede9fe;padding:2px 10px;border-radius:100px;margin-left:4px;">SELESAI — View Only</span>' : ''}
            </div>
            <div style="font-size:12px;color:#c4b5fd;margin-top:3px;">${proj.name} — Production</div>
          </div>
          <button onclick="closeExtractionModal()" style="width:32px;height:32px;border-radius:8px;border:1px solid #4c1d95;background:#1e1b4b;color:#a78bfa;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <div style="padding:24px;max-height:calc(88vh - 160px);overflow-y:auto;">
          ${isDone
            ? `<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#4c1d95;display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">🔒</span>
                <div><strong>Extraction Sudah Selesai.</strong> Data ini hanya bisa dilihat.</div>
               </div>`
            : `<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#4c1d95;">
                ⚗️ <strong>Extraction Checklist:</strong> Centang setiap step yang sudah selesai. Timestamp otomatis tercatat.
               </div>`
          }

          <div style="background:#fafafa;border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:20px;">
            <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">🕐 Tanggal & Waktu</div>
            <div style="font-size:13px;font-weight:600;color:#111;" id="extraction-realtime-clock">${nowStr}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            ${itemsHTML}
          </div>
        </div>

        <div style="padding:16px 24px;border-top:1px solid var(--border);background:var(--bg);display:flex;gap:10px;justify-content:${isDone ? 'flex-end' : 'space-between'};">
          ${isDone
            ? `<button class="de-btn de-btn-primary" onclick="closeExtractionModal()" style="background:#7c3aed;border-color:#7c3aed;">✕ Tutup</button>`
            : `<button class="de-btn de-btn-ghost" onclick="closeExtractionModal()">Cancel</button>
               <div style="display:flex;gap:10px;">
                 <button class="de-btn de-btn-ghost" onclick="saveExtractionModal('${key}', false)" style="background:white;border-color:var(--border2);">💾 Save</button>
                 <button class="de-btn de-btn-primary" onclick="saveExtractionModal('${key}', true)" style="background:#7c3aed;border-color:#7c3aed;">✅ Save & Finish</button>
               </div>`
          }
        </div>
      </div>`;

    const container = document.createElement('div');
    container.id = 'extraction-modal-container';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
    document.body.style.overflow = 'hidden';

    window._extractionClockTimer = setInterval(() => {
      const el = document.getElementById('extraction-realtime-clock');
      if (!el) { clearInterval(window._extractionClockTimer); return; }
      el.textContent = new Date().toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }, 1000);

    window._currentExtractionKey = key;
  } catch (err) {
    console.error('❌ openExtractionModal:', err.message);
    showQuickToast('❌ Error membuka Extraction Modal: ' + err.message);
  }
}

function handleExtractionCheckbox(checkId, timeId) {
  const checkbox = document.getElementById(checkId);
  const timeSpan = document.getElementById(timeId);
  if (checkbox.checked) {
    const ts = new Date().toLocaleString('id-ID', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    timeSpan.textContent = ts;
    timeSpan.style.color = '#111';
    timeSpan.style.fontWeight = '800';
  } else {
    timeSpan.textContent = '—';
    timeSpan.style.color = '#9ca3af';
    timeSpan.style.fontWeight = '400';
  }
}

async function saveExtractionModal(key, isFinish) {
  if (!confirm(`Apakah Anda yakin ingin ${isFinish ? 'MENYELESAIKAN' : 'MENYIMPAN DRAF'} data Extraction ini?`)) return;

  const extractionItems = ['Start Circulasi', 'Start slurry', 'Finish Raw Product'];
  const checks = {}, timestamps = {};
  let allDone = true;

  extractionItems.forEach((item, idx) => {
    const cb = document.getElementById(`ex-check-${idx}`);
    const ts = document.getElementById(`ex-time-${idx}`);
    const val = cb ? cb.checked : false;
    checks[item] = val;
    if (val && ts && ts.textContent !== '—') timestamps[item] = ts.textContent;
    if (!val) allDone = false;
  });

  let sel = document.getElementById('dep-proj-sel-'+key) || document.getElementById('lab-proj-sel-'+key);
  const allProjs = gPJ('ongoing');
  const proj = sel && sel.value !== '' ? allProjs[+sel.value] : null;

  const isDone = isFinish || allDone;

  if (proj && proj._id) {
    try {
      const res = await fetch('/api/projects/'+proj._id+'/extraction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction_done: isDone, extraction_checks: checks, extraction_timestamps: timestamps }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await loadPJ('ongoing');
    } catch(e) {
      console.error('saveExtractionModal API error:', e);
      showQuickToast('❌ Gagal simpan Extraction: ' + e.message);
      return;
    }
  } else if (proj) {
    const realIdx = +sel.value;
    allProjs[realIdx].extraction_done       = isDone;
    allProjs[realIdx].extraction_checks     = checks;
    allProjs[realIdx].extraction_timestamps = timestamps;
    sPJ('ongoing', allProjs);
  }

  // Update button state
  const btn = document.getElementById('dep-extraction-status-'+key);
  if (btn && isDone) {
    btn.style.background = '#15803d';
    btn.style.borderColor = '#15803d';
    btn.textContent = '✅ Extraction';
  }

  closeExtractionModal();
  showQuickToast(isDone ? '✅ Extraction selesai!' : '💾 Extraction progress tersimpan.');
}

function closeExtractionModal() {
  clearInterval(window._extractionClockTimer);
  document.getElementById('extraction-modal-container')?.remove();
  document.body.style.overflow = '';
}

window.openExtractionModal   = openExtractionModal;
window.closeExtractionModal  = closeExtractionModal;
window.saveExtractionModal   = saveExtractionModal;
window.handleExtractionCheckbox = handleExtractionCheckbox;


// ══════════════════════════════════════════════════════════════
// PRODUCTION STAGE TRACKER
// 12 tahapan produksi dengan tombol START → RUN (hijau)
// Sticky panel, bisa di-hide, timestamp tersimpan ke DB
// ══════════════════════════════════════════════════════════════

const PROD_STAGES = [
  'Sirkulasi SCC',
  'Set suhu SCC',
  'Decanter start',
  'Slury (Raw)',
  'Aroma',
  'MIT',
  'To raw extract tank',
  'Centrifuge (stand by)',
  'To centrifuge',
  'Filtrasi',
  'Sirkulasi CT',
  'Evaporasi CT',
];

function renderProdStagePanel(key) {
  // Inject CSS pst-btn-locked sekali
  if (!document.getElementById('pst-locked-style')) {
    const s = document.createElement('style');
    s.id = 'pst-locked-style';
    s.textContent = `.pst-btn-locked{background:#d1d5db!important;color:#9ca3af!important;cursor:not-allowed!important;border:1px solid #e5e7eb!important;font-size:13px!important;}`;
    document.head.appendChild(s);
  }
  const floatWrap = document.getElementById('dep-stage-float-'+key);
  if (!floatWrap) return;

  let sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') {
    floatWrap.innerHTML = '';
    const sp = document.getElementById('dep-stage-spacer-'+key);
    if (sp) sp.style.height = '0';
    return;
  }

  const allProjs = gPJ('ongoing');
  const proj = allProjs[+sel.value];
  if (!proj) { floatWrap.innerHTML = ''; return; }

  // prod_stages bisa string JSON (dari DB) atau object (dari cache)
  let stages = proj.prod_stages || {};
  if (typeof stages === 'string') {
    try { stages = JSON.parse(stages); } catch { stages = {}; }
  }
  const doneCount = Object.keys(stages).length;

  let col1 = '', col2 = '', col3 = '';
  PROD_STAGES.forEach((name, idx) => {
    const ts    = stages[name] || '';
    const isRun = !!ts;
    // Cek apakah tahap sebelumnya sudah selesai (sequential lock)
    const prevDone = idx === 0 || !!stages[PROD_STAGES[idx - 1]];
    const isLocked = !isRun && !prevDone;
    // Format ulang timestamp agar selalu tampil tanggal + waktu
    let displayTs = ts;
    if (ts && ts !== '—') {
      displayTs = ts.length > 12 ? ts : ts;
    }
    const row = `
      <div class="pst-row">
        <span class="pst-name">${idx+1}. ${name}</span>
        <span id="pst-ts-${key}-${idx}" class="pst-ts ${isRun?'pst-ts-done':''}">${displayTs||'—'}</span>
        <button id="pst-btn-${key}-${idx}"
          onclick="startProdStage('${key}',${idx})"
          ${(isRun || isLocked) ? 'disabled' : ''}
          class="pst-btn ${isRun ? 'pst-btn-run' : isLocked ? 'pst-btn-locked' : 'pst-btn-start'}"
          title="${isLocked ? 'Selesaikan tahap ' + idx + ' terlebih dahulu' : ''}">
          ${isRun ? 'RUN' : isLocked ? '🔒' : 'START'}
        </button>
      </div>`;
    if      (idx < 4) col1 += row;
    else if (idx < 8) col2 += row;
    else              col3 += row;
  });

  const panel = document.createElement('div');
  panel.id = 'prod-stage-panel-'+key;
  panel.className = 'pst-float-panel';
  panel.innerHTML = `
    <div class="pst-float-header">
      <span class="pst-float-title">⚙️ Tahapan Produksi</span>
      <span id="pst-badge-${key}" class="pst-badge">${doneCount}/${PROD_STAGES.length}</span>
    </div>
    <div id="pst-body-${key}" class="pst-float-body">
      <div class="pst-grid" style="grid-template-columns:repeat(3,1fr)">
        <div>${col1}</div>
        <div>${col2}</div>
        <div>${col3}</div>
      </div>
    </div>
    <div class="pst-float-footer">
      <button class="pst-close-tab" onclick="toggleProdStagePanelFloat('${key}', false)">
        <span class="pst-close-tab-arrow">▲</span> Tutup
      </button>
    </div>`;

  floatWrap.innerHTML = '';
  floatWrap.appendChild(panel);

  // Gunakan position:fixed agar menempel tepat di bawah garis topbar
  _applyFloatWrapPosition(key);

  // Update spacer agar konten di bawah tidak tertutup panel
  requestAnimationFrame(() => {
    const spacer = document.getElementById('dep-stage-spacer-'+key);
    if (spacer) spacer.style.height = floatWrap.offsetHeight + 'px';
  });

  _setupProdStageScrollListener(key);
}

// Hitung dan pasang posisi fixed berdasarkan topbar aktual
function _applyFloatWrapPosition(key) {
  const floatWrap = document.getElementById('dep-stage-float-'+key);
  if (!floatWrap) return;
  const topbarEl  = document.querySelector('.topbar');
  const topbarBottom = topbarEl ? Math.round(topbarEl.getBoundingClientRect().bottom) : 57;
  const sidebarW  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar')) || 230;
  floatWrap.style.cssText = `
    position: fixed !important;
    left: ${sidebarW}px;
    top: ${topbarBottom}px;
    right: 0;
    z-index: 200;
    display: block;
  `;
}

// Toggle: buka / tutup floating panel
function toggleProdStagePanelFloat(key, forceOpen) {
  const floatWrap = document.getElementById('dep-stage-float-'+key);
  const reopen    = document.getElementById('dep-stage-reopen-'+key);
  const spacer    = document.getElementById('dep-stage-spacer-'+key);
  if (!floatWrap) return;

  const isHidden = floatWrap.style.display === 'none';
  const shouldOpen = forceOpen === true ? true : forceOpen === false ? false : isHidden;

  if (shouldOpen) {
    // Buka panel
    _applyFloatWrapPosition(key);
    if (reopen) reopen.style.display = 'none';
    // Update spacer
    requestAnimationFrame(() => {
      if (spacer) spacer.style.height = floatWrap.offsetHeight + 'px';
    });
    // Scroll ke atas agar panel terlihat
    const content = document.querySelector('.content');
    if (content) content.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Tutup panel
    floatWrap.style.display = 'none';
    if (spacer) spacer.style.height = '0';
    // Tampilkan tombol reopen dengan posisi fixed di tengah atas
    if (reopen) {
      const topbarEl = document.querySelector('.topbar');
      const topbarBottom = topbarEl ? Math.round(topbarEl.getBoundingClientRect().bottom) : 57;
      const sidebarW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar')) || 230;
      reopen.style.cssText = `
        display: flex;
        position: fixed;
        left: ${sidebarW}px;
        top: ${topbarBottom}px;
        right: 0;
        z-index: 199;
        justify-content: center;
        pointer-events: none;
      `;
    }
  }
}

// Alias lama agar tidak break backward compat
function toggleProdStagePanel(key) {
  toggleProdStagePanelFloat(key);
}

// Pasang scroll listener — auto-buka HANYA saat scroll NAIK ke atas
function _setupProdStageScrollListener(key) {
  const content = document.querySelector('.content');
  if (!content) return;

  if (content._prodStageListener) {
    content.removeEventListener('scroll', content._prodStageListener);
  }

  let lastScrollTop = content.scrollTop;

  content._prodStageListener = () => {
    const cur = content.scrollTop;
    lastScrollTop = cur;
    // Auto-reopen dihapus — panel hanya buka manual via tombol ▲ Tahapan Produksi
  };
  content._prodStageListenerKey = key;
  content.addEventListener('scroll', content._prodStageListener);
}

async function startProdStage(key, idx) {
  const stageName = PROD_STAGES[idx];
  if (!confirm('Start tahapan: "' + stageName + '"?')) return;

  const btn   = document.getElementById('pst-btn-'+key+'-'+idx);
  const tsEl  = document.getElementById('pst-ts-'+key+'-'+idx);
  const badge = document.getElementById('pst-badge-'+key);

  const now    = new Date();
  const tsStr  = now.toLocaleString('id-ID', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
  // Tampilkan tanggal + waktu di panel
  const displayTs = now.toLocaleString('id-ID', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit',
    hour12: false
  });
  if (btn)  { btn.textContent='RUN'; btn.style.background='#15803d'; btn.disabled=true; btn.style.cursor='default'; btn.className='pst-btn pst-btn-run'; }
  if (tsEl) { tsEl.textContent=displayTs; tsEl.style.color='#15803d'; tsEl.style.fontWeight='700'; tsEl.style.borderColor='#16a34a'; tsEl.style.background='#f0fdf4'; }

  // Unlock tahap berikutnya
  const nextBtn = document.getElementById('pst-btn-'+key+'-'+(idx+1));
  if (nextBtn && nextBtn.disabled && nextBtn.classList.contains('pst-btn-locked')) {
    nextBtn.disabled   = false;
    nextBtn.textContent = 'START';
    nextBtn.className  = 'pst-btn pst-btn-start';
    nextBtn.title      = '';
    nextBtn.style      = '';
  }

  let sel = document.getElementById('dep-proj-sel-'+key);
  if (!sel || sel.value === '') return;
  const allProjs = gPJ('ongoing');
  const realIdx  = +sel.value;
  const proj     = allProjs[realIdx];
  if (!proj) return;

  if (!allProjs[realIdx].prod_stages) allProjs[realIdx].prod_stages = {};
  // Parse kalau masih string JSON
  if (typeof allProjs[realIdx].prod_stages === 'string') {
    try { allProjs[realIdx].prod_stages = JSON.parse(allProjs[realIdx].prod_stages); }
    catch { allProjs[realIdx].prod_stages = {}; }
  }
  allProjs[realIdx].prod_stages[stageName] = tsStr;
  sPJ('ongoing', allProjs);

  const doneCount = Object.keys(allProjs[realIdx].prod_stages).length;
  if (badge) badge.textContent = doneCount + '/' + PROD_STAGES.length;

  const projId = proj.id || proj._id;
  if (projId) {
    try {
      const r = await fetch('/api/projects/'+projId+'/stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prod_stages: allProjs[realIdx].prod_stages }),
      });
      const j = await r.json();
      if (!j.success) console.warn('stages save failed:', j.error);
    } catch(e) { console.warn('startProdStage API error:', e.message); }
  } else {
    console.warn('startProdStage: proj.id tidak ditemukan', proj);
  }

  showQuickToast('✅ ' + stageName + ' — dimulai ' + tsStr);
}

window.renderProdStagePanel      = renderProdStagePanel;
window.toggleProdStagePanel      = toggleProdStagePanel;
window.toggleProdStagePanelFloat = toggleProdStagePanelFloat;
window.startProdStage            = startProdStage;
window._applyFloatWrapPosition   = _applyFloatWrapPosition;

function closeCIPModal() {
  const overlay = document.getElementById('cip-modal-overlay');
  if (overlay) overlay.remove();
  const container = document.getElementById('cip-modal-container');
  if (container) container.remove();
  if (window._cipClockTimer) { clearInterval(window._cipClockTimer); window._cipClockTimer = null; }
  window._currentCIPKey = null;
  document.body.style.overflow = '';
}

async function openCIPModal(key) {
  console.log('🔍 openCIPModal called with key:', key);
  try {
    let sel = document.getElementById('dep-proj-sel-'+key);
    if (!sel) sel = document.getElementById('lab-proj-sel-'+key);

    if (!sel || sel.value === '') {
      showQuickToast('❌ Pilih project dulu!');
      return;
    }

    // ✅ Selalu load fresh dari DB sebelum buka modal agar checks terbaru tampil
    await loadPJ('ongoing');

    const allProjs = gPJ('ongoing');
    const proj = allProjs[+sel.value];
    if (!proj) { showQuickToast('❌ Project tidak ditemukan!'); return; }

    const cipDone = key === 'production' ? proj.cipProdDone : proj.cipLabDone;

    // Load cipData dari field DB yang benar
    // Load cipData dari field DB yang benar
const cipData = key === 'production'
  ? { 
      checks: proj.cip_prod_checks || proj.cipProdChecks || {}, 
      timestamps: proj.cip_prod_timestamps || {},
      savedAt: proj.cipProdSavedAt 
    }
  : { 
      checks: proj.cip_lab_checks  || proj.cipLabChecks  || {}, 
      timestamps: proj.cip_lab_timestamps || {},
      savedAt: proj.cipLabSavedAt  
    };
    console.log('📥 CIP open - proj keys:', Object.keys(proj));
    console.log('📥 CIP open - cip_prod_checks:', JSON.stringify(proj.cip_prod_checks));
    console.log('📥 CIP open - cipData.checks:', JSON.stringify(cipData.checks));
    const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;

    const now = new Date();
    const nowStr = now.toLocaleString('id-ID', {weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const savedAtStr = cipData?.savedAt ? new Date(cipData.savedAt).toLocaleString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : null;

    // Hitung berapa item yang sudah dicentang
    const checks    = cipData?.checks || {};
    const totalItems = config.sections.reduce((acc, s) => acc + s.items.length, 0);
    const doneItems  = Object.values(checks).filter(Boolean).length;

    const modalHTML = `
      <div id="cip-modal-overlay" onclick="closeCIPModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;"></div>
      <div id="cip-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:0;width:min(700px,92vw);max-height:88vh;overflow:hidden;z-index:9999;box-shadow:0 25px 70px rgba(0,0,0,.3);">

        <div style="padding:20px 24px;border-bottom:1px solid var(--border);background:${cipDone ? '#14532d' : '#1f2937'};display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${cipDone ? '✅' : '🧼'} ${config.title}
              ${cipDone ? '<span style="font-size:11px;font-weight:600;background:#15803d;color:#bbf7d0;padding:2px 10px;border-radius:100px;margin-left:4px;" id="cip-done-badge">SELESAI — View Only</span>' : ''}
              ${cipDone && (localStorage.getItem('role')||'') === 'superadmin'
                ? '<button id="cip-edit-mode-btn" onclick="toggleCIPEditMode(\''+key+'\', false)" style="font-size:11px;font-weight:600;background:#b45309;color:#fef3c7;padding:3px 12px;border-radius:100px;border:none;cursor:pointer;margin-left:4px;">✏️ Edit Mode</button>'
                : ''}
            </div>
            <div style="font-size:12px;color:#9ca3af;margin-top:3px;">${proj.name} — ${key === 'production' ? 'Production' : 'Laboratorium'}</div>
          </div>
          <button onclick="closeCIPModal()" style="width:32px;height:32px;border-radius:8px;border:1px solid #374151;background:#111827;color:#9ca3af;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">✕</button>
        </div>

        <div style="padding:24px;max-height:calc(88vh - 180px);overflow-y:auto;">

          ${cipDone
            ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#14532d;line-height:1.5;display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">🔒</span>
                <div><strong>CIP Sudah Selesai.</strong> Data ini hanya bisa dilihat dan tidak dapat diubah lagi.<br>
                <span style="color:#15803d;font-weight:600;">${doneItems} dari ${totalItems} step selesai.</span></div>
               </div>`
            : `<div style="background:#fffbeb;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#854d0e;line-height:1.5;">
                ℹ️ <strong>CIP Checklist:</strong> Centang setiap step yang sudah selesai. Timestamp otomatis tercatat.
               </div>`
          }

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
            ${buildCIPChecklist(key, cipData, cipDone)}
          </div>

          <div id="cip-modal-msg" style="margin-top:16px;font-size:12px;text-align:center;"></div>
        </div>

        <div style="padding:16px 24px;border-top:1px solid var(--border);background:var(--bg);display:flex;gap:10px;justify-content:${cipDone ? 'flex-end' : 'space-between'};">
          ${cipDone
            ? `<div style="display:flex;gap:10px;width:100%;justify-content:space-between;align-items:center;">
                <div id="cip-edit-save-area" style="display:none;gap:10px;flex:1;">
                  <button class="de-btn de-btn-ghost" onclick="toggleCIPEditMode('${key}', true)" style="background:white;border-color:var(--border2);">✕ Batal Edit</button>
                  <button class="de-btn de-btn-primary" onclick="saveCIPModal('${key}', true)" style="background:#15803d;border-color:#15803d;">💾 Simpan Perubahan</button>
                </div>
                <button class="de-btn de-btn-primary" onclick="closeCIPModal()" style="background:#15803d;border-color:#15803d;margin-left:auto;">✕ Tutup</button>
               </div>`
            : `<button class="de-btn de-btn-ghost" onclick="closeCIPModal()">Cancel</button>
               <div style="display:flex;gap:10px;">
                 <button class="de-btn de-btn-ghost" onclick="saveCIPModal('${key}', false)" style="background:white;border-color:var(--border2);">💾 Save</button>
                 <button class="de-btn de-btn-primary" onclick="saveCIPModal('${key}', true)" style="background:#15803d;border-color:#15803d;">✅ Save & Finish</button>
               </div>`
          }
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

// ── Toggle Edit Mode CIP untuk superadmin ──────────────────────────────────
function toggleCIPEditMode(key, cancel) {
  // Guard: hanya superadmin yang boleh masuk edit mode
  if ((localStorage.getItem('role') || '') !== 'superadmin') {
    showQuickToast('❌ Hanya superadmin yang dapat mengedit CIP yang sudah selesai');
    return;
  }
  const editBtn      = document.getElementById('cip-edit-mode-btn');
  const saveArea     = document.getElementById('cip-edit-save-area');
  const doneBadge    = document.getElementById('cip-done-badge');
  const container    = document.getElementById('cip-checklist-container');
  const lockBanner   = document.querySelector('#cip-modal [style*="f0fdf4"]');

  if (cancel) {
    // Kembali ke view mode — reload checklist asli
    if (editBtn)    { editBtn.style.display = 'inline-block'; editBtn.textContent = '✏️ Edit Mode'; }
    if (saveArea)   saveArea.style.display = 'none';
    if (doneBadge)  doneBadge.style.display = 'inline-block';
    if (lockBanner) lockBanner.style.display = '';
    // Reload checklist dari data asli (readOnly=true)
    const allProjs = gPJ('ongoing');
    const sel = document.getElementById('dep-proj-sel-'+key) || document.getElementById('lab-proj-sel-'+key);
    const proj = sel ? allProjs[+sel.value] : null;
    if (proj && container) {
      const cipData = key === 'production'
        ? { checks: proj.cip_prod_checks || {}, timestamps: proj.cip_prod_timestamps || {} }
        : { checks: proj.cip_lab_checks  || {}, timestamps: proj.cip_lab_timestamps  || {} };
      container.innerHTML = buildCIPChecklist(key, cipData, true);
    }
    return;
  }

  // Masuk edit mode — render checklist dengan checkbox interaktif
  if (editBtn)    { editBtn.style.display = 'none'; }
  if (saveArea)   { saveArea.style.display = 'flex'; }
  if (doneBadge)  { doneBadge.textContent = 'EDIT MODE'; doneBadge.style.background = '#b45309'; doneBadge.style.color = '#fef3c7'; }
  if (lockBanner) { lockBanner.style.display = 'none'; }

  // Render ulang checklist dalam mode editable
  const allProjs = gPJ('ongoing');
  const sel = document.getElementById('dep-proj-sel-'+key) || document.getElementById('lab-proj-sel-'+key);
  const proj = sel ? allProjs[+sel.value] : null;
  if (proj && container) {
    const cipData = key === 'production'
      ? { checks: proj.cip_prod_checks || {}, timestamps: proj.cip_prod_timestamps || {} }
      : { checks: proj.cip_lab_checks  || {}, timestamps: proj.cip_lab_timestamps  || {} };
    // readOnly=false agar checkbox bisa diklik, termasuk uncheck
    container.innerHTML = buildCIPChecklistEditable(key, cipData);
  }
}
window.toggleCIPEditMode = toggleCIPEditMode;

// Versi editable buildCIPChecklist — semua item pakai <input type="checkbox"> (bisa uncheck)
function buildCIPChecklistEditable(key, cipData) {
  const config = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  const checks = cipData?.checks || {};
  let html = '';
  config.sections.forEach((section, sIdx) => {
    html += `<div style="margin-bottom:20px;">
      <div style="background:#b45309;color:white;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:700;margin-bottom:10px;">
        ✏️ ${section.name} — Edit Mode
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">`;
    section.items.forEach((item, iIdx) => {
      const checkId   = 'cip-check-' + sIdx + '-' + iIdx;
      const timeId    = 'cip-time-'  + sIdx + '-' + iIdx;
      const uniqueKey = sIdx + '__' + item;
      const isChecked = checks[uniqueKey] || checks[item] || false;
      const timestamp = cipData?.timestamps?.[uniqueKey] || '';
      const activeBg  = isChecked ? '#f0fdf4' : 'var(--bg)';
      const activeBdr = isChecked ? '#86efac' : 'var(--border)';
      const activeLbl = isChecked ? '#15803d' : 'var(--txt2)';
      html += `
        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 12px;background:${activeBg};border:1px solid ${activeBdr};border-radius:6px;transition:background .2s,border .2s;" id="cip-row-${sIdx}-${iIdx}">
          <input type="checkbox" id="${checkId}" data-key="${uniqueKey}" ${isChecked ? 'checked' : ''}
                 onchange="handleCIPCheckbox('${checkId}', '${timeId}', '${sIdx}', '${iIdx}')"
                 style="width:16px;height:16px;cursor:pointer;accent-color:#15803d;">
          <label for="${checkId}" style="font-size:13px;color:${activeLbl};cursor:pointer;user-select:none;font-weight:${isChecked ? '600' : '400'};">
            ${item}
          </label>
          <span id="${timeId}" style="font-size:11px;color:${isChecked ? '#15803d' : '#9ca3af'};font-family:monospace;min-width:120px;text-align:right;font-weight:${isChecked ? '800' : '400'};">
            ${timestamp || '—'}
          </span>
        </div>`;
    });
    html += `</div></div>`;
  });
  return html;
}
window.buildCIPChecklistEditable = buildCIPChecklistEditable;

async function saveCIPModal(key, isFinish) {
  const aksi = isFinish ? "MENYELESAIKAN" : "MENYIMPAN DRAF";
  if (!confirm(`Apakah Anda yakin ingin ${aksi} data CIP ${key === 'production' ? 'Produksi' : 'Laboratorium'} ini?`)) return;

  const config  = CIP_CHECKLISTS[key] || CIP_CHECKLISTS.production;
  const checks  = {};
  const timestamps = {}; // ← TAMBAHAN BARU
  let   allDone = true;

  // Kumpulkan checkbox DAN timestamp
  config.sections.forEach((sec, sIdx) => {
    sec.items.forEach((item, iIdx) => {
      const checkId   = `cip-check-${sIdx}-${iIdx}`;
      const timeId    = `cip-time-${sIdx}-${iIdx}`;
      const uniqueKey = `${sIdx}__${item}`;
      const row       = document.getElementById(`cip-row-${sIdx}-${iIdx}`);

      const el  = document.getElementById(checkId);
      // Kalau native checkbox tidak ada, cek apakah sudah diganti custom green div
      const isCustomChecked = !el && row?.querySelector('[data-checked="true"]') !== null;
      const val = el ? el.checked : isCustomChecked;
      checks[uniqueKey] = val;

      // Simpan timestamp
      const timeEl = document.getElementById(timeId);
      if (timeEl && val && timeEl.textContent !== '—') {
        timestamps[uniqueKey] = timeEl.textContent;
      }

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
        ? { 
            cip_prod_done: isFinish || allDone, 
            cip_prod_checks: checks,
            cip_prod_timestamps: timestamps,
            cipProdSavedAt: new Date().toISOString()
          }
        : { 
            cip_lab_done:  isFinish || allDone, 
            cip_lab_checks:  checks,
            cip_lab_timestamps: timestamps,
            cipLabSavedAt: new Date().toISOString()
          };
      console.log('📤 CIP save payload:', JSON.stringify(body));
      console.log('📤 checks collected:', JSON.stringify(checks));
      const res  = await fetch('/api/projects/'+proj._id+'/cip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await loadPJ('ongoing');
      // Re-render project cards agar tombol End langsung aktif
      const content = document.getElementById('content');
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
      allProjs[realIdx].cip_prod_timestamps = timestamps; // ← TAMBAHAN BARU
      allProjs[realIdx].cipProdSavedAt = new Date().toISOString(); // ← TAMBAHAN BARU
    } else {
      allProjs[realIdx].cipLabDone   = isFinish || allDone;
      allProjs[realIdx].cipLabChecks = checks;
      allProjs[realIdx].cip_lab_checks = checks;
      allProjs[realIdx].cip_lab_timestamps = timestamps; // ← TAMBAHAN BARU
      allProjs[realIdx].cipLabSavedAt = new Date().toISOString(); // ← TAMBAHAN BARU
    }
    sPJ('ongoing', allProjs);
    // Re-render cards agar tombol End langsung aktif
    const content = document.getElementById('content');
  }

  closeCIPModal(key);
  showQuickToast((isFinish || allDone) ? '✅ CIP selesai!' : '💾 CIP progress tersimpan.');
}

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
  const allProjs = gPJ('ongoing');
  const proj     = allProjs[+sel.value];
  if (!proj) return;
  const realIdx  = +sel.value;

  // Save CIP to correct field based on key
  if (key === 'production') {
    allProjs[realIdx].cipProdDone   = true;
    allProjs[realIdx].cip_prod_done = true;
    allProjs[realIdx].cipProdFields = fields;
  } else if (key === 'laboratorium') {
    allProjs[realIdx].cipLabDone   = true;
    allProjs[realIdx].cip_lab_done = true;
    allProjs[realIdx].cipLabFields = fields;
  }
  sPJ('ongoing', allProjs);

  // ✅ PUT ke API agar tersimpan ke DB (tombol End bisa aktif tanpa refresh)
  if (proj._id) {
    const cipPayload = key === 'production'
      ? { cip_prod_done: true, cip_prod_checks: fields }
      : { cip_lab_done: true,  cip_lab_checks: fields  };
    fetch('/api/projects/' + proj._id + '/cip', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cipPayload),
    }).then(() => {
      loadPJ('ongoing').then(() => renderPJ('ongoing'));
    }).catch(err => console.error('CIP save error:', err));
  } else {
    renderPJ('ongoing');
  }

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

  // isSPSave = true kalau dipanggil dari tombol 'Save Set Point'
  // isSPSave = false kalau dipanggil dari tombol 'Save Data' di data entry
  const spModal = document.getElementById('sp-modal-'+key);
  const isSPSave = spModal && (spModal.style.display !== 'none' && spModal.offsetParent !== null);

  // PAGE1 = Set Point Production, PAGE2 = Parameter CT
  // Save production hanya ambil PAGE1 — CT disave terpisah via submitDECT
  SP_FIELDS_PAGE1.forEach(f => {
    const el = document.getElementById('dep-'+f.id+'-'+key);
    // Untuk calculated fields: ambil dari DOM (hasil kalkulasi otomatis)
    // Untuk manual fields: ambil DOM → draft → setPoint lama (kalau isSPSave)
    // Untuk field dengan grey placeholder: nilai bisa kosong di DOM padahal ada di data-prev-value
    const domVal = el ? (el.value.trim() || el.dataset?.prevValue?.trim() || '') : '';
    const value = domVal !== '' ? domVal
      : (draft[f.id] || (isSPSave ? (proj.setPoint?.[f.id] || '') : ''));
    if (value !== '') {
      if (!f.calculated) anyFilled = true; // hanya manual field yang trigger anyFilled
      spData[f.id] = value;
    }
  });
  // PAGE2: Temperature fields dibaca dari DOM (user boleh ubah),
  // CT fields (sp-add1~8) diambil dari setPoint lama karena disave terpisah via submitDECT
  const CT_IDS = new Set(['sp-add1','sp-add2','sp-add3','sp-add4','sp-add5','sp-add6','sp-add7','sp-add8']);
  SP_FIELDS_PAGE2.forEach(f => {
    if (CT_IDS.has(f.id)) {
      // CT: selalu pakai nilai lama agar tidak hilang
      const existing = proj.setPoint?.[f.id];
      if (existing !== undefined && existing !== '') spData[f.id] = existing;
    } else {
      // Temperature & non-CT: baca dari DOM sama seperti PAGE1
      const el = document.getElementById('dep-'+f.id+'-'+key);
      const domVal = el ? (el.value.trim() || el.dataset?.prevValue?.trim() || '') : '';
      const value = domVal !== '' ? domVal
        : (draft[f.id] || (isSPSave ? (proj.setPoint?.[f.id] || '') : ''));
      if (value !== '') spData[f.id] = value;
    }
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
    // Simpan prod_stages dulu agar tidak hilang setelah reload
    const savedStages = allProjs[realIdx >= 0 ? realIdx : 0]?.prod_stages || {};
    setTimeout(async () => {
      if(b) b.style.display = 'none';
      await loadPJ('ongoing');
      // Pulihkan prod_stages ke cache setelah reload
      if (Object.keys(savedStages).length > 0) {
        const freshProjs = gPJ('ongoing');
        const freshIdx   = freshProjs.findIndex(p => p.name === proj.name && p.created_at === proj.created_at);
        if (freshIdx >= 0 && !freshProjs[freshIdx].prod_stages) {
          freshProjs[freshIdx].prod_stages = savedStages;
          sPJ('ongoing', freshProjs);
        }
      }
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

function limbahRenderProject(key) {
  const sel  = document.getElementById('limbah-proj-sel-'+key);
  const area = document.getElementById('limbah-proj-form-'+key);
  if (!area || !sel || sel.value === '') { if(area) area.innerHTML=''; return; }
  
  const projs = gPJ('ongoing');
  if (!projs) { if(area) area.innerHTML=''; return; }
  
  const proj = projs[+sel.value];
  if (!proj) { area.innerHTML=''; return; }

  const uid = key+'_proj_'+sel.value;
  
  // FIX 1: Pastikan objek global untuk counter item form aman (sesuaikan namanya)
  window._limbahCIPItems = window._limbahCIPItems || {};
  window._limbahCIPItems[uid] = 0;

  const existing = proj.cipLimbahEntries || [];

  area.innerHTML = `<div style="padding:40px;text-align:center;color:var(--txt3)">⏳ Memuat data limbah...</div>`;

  // FIX 2: Ambil data fallback dari localStorage khusus limbah
  const prevData = proj.limbahData?.[uid] || {};
  
  // GANTI INI dengan nama array yang dipakai di form limbah Anda (misal: phEntries, debitEntries, dll)
  const localData1 = prevData.data1Entries || []; 
  const localData2 = prevData.data2Entries || [];

  // Sesuaikan endpoint API limbah Anda
  fetch('/api/dataentry/limbah?project_name=' + encodeURIComponent(proj.name) + '&limit=1')
    .then(r => r.json())
    .then(json => {
      const dbRow = json.success && json.data?.length ? json.data[0] : null;
      
      // FIX 3: Cek apakah database punya data. Kalau kosong, panggil fallback dari local
      const finalData1 = dbRow?.data1_entries?.length ? dbRow.data1_entries : localData1;
      const finalData2 = dbRow?.data2_entries?.length ? dbRow.data2_entries : localData2;

      // Build form dengan data final
      _renderLimbahForm(area, uid, proj, key, existing, finalData1, finalData2);
    })
    .catch((err) => {
      console.warn('API Error, menggunakan fallback local storage:', err);
      // FIX 4: Jangan gunakan array kosong [], [] di sini. Gunakan localData!
      _renderLimbahForm(area, uid, proj, key, existing, localData1, localData2);
    });
}

async function submitLimbah(key) {
  // FIX: proteksi submit-ganda — double-click bisa bikin 2 row identik tersimpan
  if (window._limbahSubmitting) return;
  if (!confirm('Apakah Anda yakin ingin menyimpan data Limbah ini?')) return;
  window._limbahSubmitting = true;

  const projSel     = document.getElementById('limbah-proj-sel');
  const selectedIdx = projSel ? projSel.value : '';
  const isProject   = selectedIdx !== '';

  // ── 1. Ambil semua nilai dari form ──────────────────────────────────────
  const awalEl  = document.getElementById(key+'-awal');
  const akhirEl = document.getElementById(key+'-akhir');
  const volEl   = document.getElementById(key+'-vol');

  const awalVal  = awalEl?.value  || '';
  const akhirVal = akhirEl?.value || '';

  // Paksa hitung ulang dulu sebelum baca nilainya
  if (isProject) calcLimbahTotal(key);

  // Baca nilai vol setelah kalkulasi (override readOnly untuk baca value)
  let volVal = '';
  if (isProject && awalVal !== '' && akhirVal !== '') {
    // Hitung langsung — paling aman, tidak bergantung DOM state
    volVal = (parseFloat(akhirVal) - parseFloat(awalVal)).toFixed(2);
  } else if (isProject && (awalVal !== '' || akhirVal !== '')) {
    volVal = volEl?.value || String((parseFloat(akhirVal||'0') - parseFloat(awalVal||'0')).toFixed(2));
  } else {
    // Mode harian: manual input
    volVal = volEl?.value || '';
  }

  const codVal   = document.getElementById(key+'-cod')?.value   || '';
  const bodVal   = document.getElementById(key+'-bod')?.value   || '';
  const tssVal   = document.getElementById(key+'-tss')?.value   || '';
  const phVal    = document.getElementById(key+'-ph')?.value    || '';
  const notesVal = document.getElementById(key+'-notes')?.value || '';
  // Baca jar data KHUSUS project aktif — key sama dengan yang disimpan submitJarTestModal
  const _pOpt  = projSel?.options[projSel?.selectedIndex];
  const _pName = _pOpt && selectedIdx!=='' ? (_pOpt.textContent||'').trim() : '';
  const _jKey  = _pName ? 'jartest__'+_pName : 'jartest__harian';
  let _jData   = (window._jarByProj||{})[_jKey] || null;
  if (!_jData) { try { _jData = JSON.parse(localStorage.getItem(_jKey)||'null'); } catch {} }
  // Fallback ke window._jarTestData (diset oleh submitJarTestModal)
  if (!_jData && window._jarTestData) {
    // Pastikan jar test ini untuk konteks yang sama (harian atau project yang sama)
    const _jarProj = window._jarTestData.proj_name || null;
    if (!_pName || _jarProj === _pName || !_jarProj) {
      _jData = window._jarTestData;
    }
  }
  const jar    = _jData ? {alum:_jData.jar_alum??null,total:_jData.jar_total??null} : (window._tmpJar||null);
  console.log('🧪 jar ['+_jKey+']:', jar);

  // Ambil jar_entries (detail per sampel) juga, bukan hanya rata-rata
  const jarEntries = _jData ? (_jData.jar_entries || _jData.entries || []) : [];

  const volumeFinal = volVal !== '' ? Number(volVal) : null;

  // Validasi: minimal awal/akhir diisi (project) atau minimal satu field lain
  const hasData = isProject
    ? (awalVal !== '' || akhirVal !== '' || codVal !== '' || bodVal !== '' || tssVal !== '' || phVal !== '' || notesVal !== '')
    : (volVal !== '' || codVal !== '' || bodVal !== '' || tssVal !== '' || phVal !== '' || notesVal !== '');

  if (!hasData) {
    window._limbahSubmitting = false;
    showQuickToast('❌ Isi minimal satu field sebelum menyimpan!');
    return;
  }

  // ── 2. Status bar ────────────────────────────────────────────────────────
  const sbEl = document.getElementById(key+'-sb');
  const smEl = document.getElementById(key+'-sm');
  const showSt = (type, msg) => {
    if (sbEl && smEl) {
      sbEl.style.display = 'flex';
      sbEl.className = 'de-status-bar de-status-' + type;
      smEl.textContent = msg;
    }
  };
  showSt('loading', '⏳ Menyimpan ke database...');

  // ── 3. Bangun payload ────────────────────────────────────────────────────
  const projs   = gPJ('ongoing');
  const projObj = selectedIdx !== '' ? projs[+selectedIdx] : null;
  // Ambil tanggal dan pastikan format yyyy-MM-dd (bukan ISO full string)
  const rawTgl  = document.getElementById(key+'-date')?.value || '';
  const tanggal = rawTgl ? rawTgl.split('T')[0] : new Date().toISOString().split('T')[0];

  const payload = {
    // Kolom inti (sudah ada di DB)
    tanggal: tanggal,
    volume:  volumeFinal,
    cod:     codVal  !== '' ? Number(codVal)  : null,
    bod:     bodVal  !== '' ? Number(bodVal)  : null,
    tss:     tssVal  !== '' ? Number(tssVal)  : null,
    ph:      phVal   !== '' ? Number(phVal)   : null,
    notes:   notesVal || null,
    // Kolom tambahan
    project_name: projObj ? projObj.name : null,
    tipe:         projObj ? 'project' : 'harian',
    awal:         awalVal  !== '' ? Number(awalVal)  : null,
    akhir:        akhirVal !== '' ? Number(akhirVal) : null,
    jar_alum:     jar ? (Number(jar.alum)  || null) : null,
    jar_total:    jar ? (Number(jar.total) || null) : null,
    jar_entries:  jarEntries,   // ← detail per sampel
  };

  // ✅ FIX: pilih endpoint sesuai mode.
  // Mode "harian" (tidak link project) HARUS ke /api/dataentry/limbah-harian
  // (tabel de_limbah_harian) karena itu yang dibaca Laporan Harian.
  // Mode project tetap ke /api/dataentry/limbah (tabel de_limbah).
  const apiUrl = isProject
    ? '/api/dataentry/limbah'
    : '/api/dataentry/limbah-harian';

  try {
    // ── 4. POST ke API ───────────────────────────────────────────────────
    const res  = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal simpan ke server');

    if (projObj) {
      // ── Jalur A: linked project — update cache lokal ──────────────────
      if (!projObj.limbahHistory) projObj.limbahHistory = [];
      projObj.limbahHistory.push({
        saved_at: new Date().toISOString(),
        fields: [
          { label: 'Tanggal',          newVal: payload.tanggal  },
          { label: 'Awal (m³)',        newVal: awalVal           },
          { label: 'Akhir (m³)',       newVal: akhirVal          },
          { label: 'Volume (m³)',      newVal: volVal            },
          { label: 'COD (mg/L)',       newVal: codVal            },
          { label: 'BOD (mg/L)',       newVal: bodVal            },
          { label: 'TSS (mg/L)',       newVal: tssVal            },
          { label: 'pH',               newVal: phVal             },
          { label: 'Jar Test PAC (L/h)',    newVal: jar?.alum  != null ? jar.alum  : '' },
          { label: 'Jar Test Polimer (L/h)', newVal: jar?.total != null ? jar.total : '' },
          { label: 'Catatan',          newVal: notesVal          },
        ].filter(f => f.newVal !== '' && f.newVal !== null && f.newVal !== undefined)
      });
      sPJ('ongoing', projs);
      showSt('success', '✅ Data Limbah tersimpan ke database: ' + projObj.name);
    } else {
      // ── Jalur B: laporan harian — simpan juga ke localStorage ────────
      const harian = JSON.parse(localStorage.getItem('harian_entries') || '[]');
      harian.unshift({
        id: Date.now(), cat: 'limbah', projName: 'Limbah Harian (Umum)',
        data: {
          'Tanggal': payload.tanggal || '—', 'Volume (m³)': volVal || '—',
          'COD (mg/L)': codVal || '—', 'BOD (mg/L)': bodVal || '—',
          'TSS (mg/L)': tssVal || '—', 'pH': phVal || '—',
          'Catatan': notesVal || '—',
          ...(jar ? { 'Jar Test PAC (L/h)': jar.alum, 'Jar Test Polimer (L/h)': jar.total } : {})
        },
        saved_at: new Date().toISOString()
      });
      localStorage.setItem('harian_entries', JSON.stringify(harian));
      showSt('success', '✅ Data Limbah Harian tersimpan ke database.');
    }

    // ── 5. Tampilkan sukses, lalu fade status bar saja (TIDAK reset form) ──
    window._limbahSubmitting = false;
    setTimeout(() => {
      if (sbEl) sbEl.style.display = 'none';
      window._tmpJar = null;
      try { localStorage.removeItem(_jKey); } catch {}
      if (window._jarByProj) delete window._jarByProj[_jKey];
      const _jBadge = document.getElementById('jar-status-'+key);
      if (_jBadge) _jBadge.style.display = 'none';
      const jarBadge = document.getElementById(key+'-jar-badge');
      if (jarBadge) jarBadge.textContent = '';
    }, 2500);

  } catch (err) {
    window._limbahSubmitting = false;
    console.error('submitLimbah Error:', err);
    showSt('error', '❌ Gagal menyimpan: ' + err.message);
  }
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

    // ── Untuk water-level: transform sN_cm → ketinggian air (tinggiTangki - sensorValue) ──
    const isWL = tab === 'water-level';
    const sensorMap = {}; // key: 's1_cm' → tinggi tangki dalam cm
    if (isWL) {
      const sensors = getSensors();
      sensors.forEach(s => {
        const dbKey = s.key + '_cm'; // s1_cm, s2_cm, dst
        sensorMap[dbKey] = { tinggiCm: +(s.tinggi||1)*100, name: s.name };
      });
    }

    const transformVal = (k, v) => {
      if (isWL && sensorMap[k] && v != null) {
        const airCm = Math.max(0, sensorMap[k].tinggiCm - parseFloat(v));
        return airCm.toFixed(1);
      }
      return v;
    };
    const transformLabel = (k) => {
      if (isWL && sensorMap[k]) return sensorMap[k].name + ' (cm air)';
      return DLABELS[k] || k.replace(/_/g,' ');
    };

    // Summary cards
    let h=`<div class="detail-stat-grid">${valKeys.map(k=>`
      <div class="detail-stat">
        <div class="detail-stat-label">${transformLabel(k).toUpperCase()}</div>
        <div class="detail-stat-value">${transformVal(k, latest[k])??'—'}</div>
        <div class="detail-stat-unit">${DUNITS[k]||''}</div>
      </div>`).join('')}</div>`;
    // Timestamp
    h+=`<div class="detail-ts">🕐 Last updated: ${fmtDT(latest.created_at||latest.updated_at)}</div>`;
    // Table
    h+=`<div class="detail-tbl-title">📋 Recent Records (${rows.length})</div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--bg)">${keys.map(k=>`<th style="text-align:left;padding:9px 12px;font-size:9px;font-weight:700;color:var(--txt3);border-bottom:1px solid var(--border);text-transform:uppercase;white-space:nowrap;letter-spacing:1px">${transformLabel(k)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r,ri)=>`<tr style="background:${ri%2===0?'var(--surface)':'var(--bg)'}">
        ${keys.map(k=>{const v=r[k];
          if(k==='id') return`<td style="padding:8px 12px"><span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);background:#ebf2fd;padding:2px 7px;border-radius:5px;font-weight:600">#${v}</span></td>`;
          if(k.includes('_at')) return`<td style="padding:8px 12px;color:var(--txt3);font-size:10px;font-family:'DM Mono',monospace;white-space:nowrap">${fmtDT(v)}</td>`;
          if(k==='stat'){const s=v==='AMAN'||v==='SAFE'||v===0||v==='0';return`<td style="padding:8px 12px"><span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;border:1px solid;${s?'background:#edfaf4;color:#0e7a4a;border-color:#8edcba':'background:#fef2f2;color:#b91c1c;border-color:#f0a0a0'}">${v}</span></td>`;}
          const disp = transformVal(k, v);
          return`<td style="padding:8px 12px;color:var(--txt2);font-family:'DM Mono',monospace;font-size:12px">${disp??'—'}</td>`;
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
            <div class="de-field">
            <label class="de-label">Product Flowrate</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add1-${type}" type="text" placeholder="—">
              <span class="de-input-unit">L/H</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">Product Flow Control Valve Position</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add2-${type}" type="text" placeholder="—">
              <span class="de-input-unit">%</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">CT Steam Pressure</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add3-${type}" type="text" placeholder="—">
              <span class="de-input-unit">KPa</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">Concentrate Recirculation Flow</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add4-${type}" type="text" placeholder="—">
              <span class="de-input-unit">L/H</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">Product Cooler Temperature</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add5-${type}" type="text" placeholder="—">
              <span class="de-input-unit">°C</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">CT Discharge Level</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add6-${type}" type="text" placeholder="—">
              <span class="de-input-unit">%</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">Brix Input</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add7-${type}" type="text" placeholder="—">
              <span class="de-input-unit">%</span>
            </div>
          </div>

          <div class="de-field">
            <label class="de-label">Brix Output</label>
            <div class="de-input-wrap">
              <input class="de-input sp-field-${type}" id="sp-add8-${type}" type="text" placeholder="—">
              <span class="de-input-unit">%</span>
            </div>
          </div>
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

// ── HELPER: DROPDOWN NAMA SAMPLE DINAMIS ──
// Cache sample di memori (diisi dari API saat init)
window._labSamplesCache = window._labSamplesCache || null;

// Load samples dari API dan sync ke localStorage
window.loadLabSamplesFromAPI = async function() {
  try {
    const res  = await fetch('/api/dataentry/lab-samples');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const samples = json.data.map(r => r.name || r);
      window._labSamplesCache = samples;
      localStorage.setItem('custom_lab_samples', JSON.stringify(samples));
      return samples;
    }
  } catch (err) {
    console.warn('loadLabSamplesFromAPI fallback to localStorage:', err.message);
  }
  // Fallback ke localStorage
  const cached = JSON.parse(localStorage.getItem('custom_lab_samples') || '[]');
  window._labSamplesCache = cached;
  return cached;
};

window.buildSampleDropdown = function(id, value) {
    // Ambil dari cache memori dulu, fallback ke localStorage
    const samples = window._labSamplesCache
      || JSON.parse(localStorage.getItem('custom_lab_samples') || '["Sample A", "Sample B"]');
    let opts = '<option value="">-- Pilih Sample --</option>';
    opts += '<option value="__ADD_NEW__" style="font-weight:bold;color:var(--blue);">＋ Tambah Sample Baru...</option>';
    
    samples.forEach(s => {
        const sel = (s === value) ? 'selected' : '';
        opts += `<option value="${s}" ${sel}>${s}</option>`;
    });

    // Jika ada value lama yang tidak ada di list, tetap tampilkan
    if (value && !samples.includes(value) && value !== '__ADD_NEW__') {
        opts += `<option value="${value}" selected>${value}</option>`;
    }

    const showDel = samples.includes(value) ? 'block' : 'none';

    return `
    <div style="display:flex;flex-direction:column;gap:6px;width:100%;">
        <div style="display:flex;gap:6px;align-items:center;width:100%;">
            <select class="de-input de-select sample-dropdown" id="${id}" style="flex:1" onchange="handleSampleChange('${id}')" data-prev-value="${value || ''}">
                ${opts}
            </select>
            <button type="button" id="${id}-del" onclick="deleteSample('${id}')" style="display:${showDel};background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Hapus Sample Ini">✕</button>
        </div>
        <div id="${id}-custom-wrap" style="display:none; gap:6px; align-items:center;">
            <!-- Class 'exclude-save' sangat penting agar tidak error saat disave -->
            <input class="de-input exclude-save" id="${id}-new" type="text" placeholder="Nama sample baru..." style="flex:1;">
            <button type="button" class="de-btn de-btn-primary exclude-save" style="padding:7px 14px;font-size:11px" onclick="saveNewSample('${id}')">Simpan</button>
            <button type="button" class="exclude-save" onclick="cancelAddSample('${id}')" style="background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Batal">✕</button>
        </div>
    </div>`;
};

window.handleSampleChange = function(id) {
    const sel = document.getElementById(id);
    const delBtn = document.getElementById(id + '-del');
    const customWrap = document.getElementById(id + '-custom-wrap');
    if (!sel) return;

    if (sel.value === '__ADD_NEW__') {
        customWrap.style.display = 'flex';
        delBtn.style.display = 'none';
    } else {
        customWrap.style.display = 'none';
        const samples = JSON.parse(localStorage.getItem('custom_lab_samples') || '[]');
        delBtn.style.display = samples.includes(sel.value) ? 'block' : 'none';
    }
};

window.saveNewSample = async function(id) {
    const input  = document.getElementById(id + '-new');
    const sel    = document.getElementById(id);
    const newVal = input.value.trim();

    if (!newVal) return alert('Nama sample tidak boleh kosong!');

    // Update cache lokal dulu agar UI langsung update
    let samples = window._labSamplesCache
      || JSON.parse(localStorage.getItem('custom_lab_samples') || '[]');
    if (!samples.includes(newVal)) {
        samples = [...samples, newVal];
        window._labSamplesCache = samples;
        localStorage.setItem('custom_lab_samples', JSON.stringify(samples));

        // POST ke API agar tersimpan di DB dan sync semua device
        try {
          await fetch('/api/dataentry/lab-samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newVal })
          });
          console.log('✅ Sample tersimpan ke DB:', newVal);
        } catch (err) {
          console.warn('⚠️ Sample tersimpan lokal saja:', err.message);
        }
    }

    input.value = '';
    document.getElementById(id + '-custom-wrap').style.display = 'none';
    
    // Refresh semua dropdown — collect IDs dulu agar tidak duplikat
    const _snIds = Array.from(document.querySelectorAll('.sample-dropdown')).map(d => ({id: d.id, v: d.id === id ? newVal : d.value}));
    _snIds.forEach(({id: did, v: cv}) => {
        const el = document.getElementById(did);
        if (el) el.parentElement.outerHTML = buildSampleDropdown(did, cv);
    });
};

window.cancelAddSample = function(id) {
    const sel = document.getElementById(id);
    document.getElementById(id + '-custom-wrap').style.display = 'none';
    sel.value = sel.getAttribute('data-prev-value') || '';
    if(sel.value === '__ADD_NEW__') sel.value = '';
    handleSampleChange(id);
};

window.deleteSample = async function(id) {
    const sel = document.getElementById(id);
    const val = sel.value;
    if (!val || val === '__ADD_NEW__') return;

    if (confirm(`Hapus sample "${val}" dari daftar?`)) {
        let samples = window._labSamplesCache
          || JSON.parse(localStorage.getItem('custom_lab_samples') || '[]');
        samples = samples.filter(s => s !== val);
        window._labSamplesCache = samples;
        localStorage.setItem('custom_lab_samples', JSON.stringify(samples));

        // DELETE ke API agar sync semua device
        try {
          await fetch('/api/dataentry/lab-samples', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: val })
          });
          console.log('✅ Sample dihapus dari DB:', val);
        } catch (err) {
          console.warn('⚠️ Sample dihapus lokal saja:', err.message);
        }
        
        // Refresh & bersihkan pilihan — collect IDs dulu agar tidak duplikat
        const _sdIds = Array.from(document.querySelectorAll('.sample-dropdown')).map(d => ({id: d.id, v: d.value === val ? '' : d.value}));
        _sdIds.forEach(({id: did, v: cv}) => {
            const el = document.getElementById(did);
            if (el) el.parentElement.outerHTML = buildSampleDropdown(did, cv);
        });
    }
};

// ══ SAMPLE LOCATION DROPDOWN (dari database, pola sama dengan lab-samples) ══

window._labLocationsCache = window._labLocationsCache || null;

// Load locations dari API database
window.loadLabLocationsFromAPI = async function() {
  try {
    const res  = await fetch('/api/dataentry/lab-locations');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const locations = json.data.map(r => r.name || r);
      window._labLocationsCache = locations;
      return locations;
    }
  } catch (err) {
    console.warn('loadLabLocationsFromAPI error:', err.message);
  }
  window._labLocationsCache = window._labLocationsCache || [];
  return window._labLocationsCache;
};

window.buildLocationDropdown = function(id, value) {
    const locations = window._labLocationsCache || [];
    let opts = '<option value="">-- Pilih Lokasi --</option>';
    opts += '<option value="__ADD_LOC__" style="font-weight:bold;color:var(--blue);">＋ Tambah Lokasi Baru...</option>';
    locations.forEach(loc => {
        const sel = (loc === value) ? 'selected' : '';
        opts += `<option value="${loc}" ${sel}>${loc}</option>`;
    });
    if (value && !locations.includes(value) && value !== '__ADD_LOC__') {
        opts += `<option value="${value}" selected>${value}</option>`;
    }
    const showDel = locations.includes(value) ? 'block' : 'none';
    return `
    <div style="display:flex;flex-direction:column;gap:6px;width:100%;">
        <div style="display:flex;gap:6px;align-items:center;width:100%;">
            <select class="de-input de-select location-dropdown" id="${id}" style="flex:1" onchange="handleLabLocationChange('${id}')" data-prev-value="${value || ''}">
                ${opts}
            </select>
            <button type="button" id="${id}-del" onclick="deleteLabLocation('${id}')" style="display:${showDel};background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Hapus Lokasi Ini">✕</button>
        </div>
        <div id="${id}-custom-wrap" style="display:none;gap:6px;align-items:center;">
            <input class="de-input exclude-save" id="${id}-new" type="text" placeholder="Nama lokasi baru..." style="flex:1;">
            <button type="button" class="de-btn de-btn-primary exclude-save" style="padding:7px 14px;font-size:11px" onclick="saveNewLabLocation('${id}')">Simpan</button>
            <button type="button" class="exclude-save" onclick="cancelAddLabLocation('${id}')" style="background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Batal">✕</button>
        </div>
    </div>`;
};

window.handleLabLocationChange = function(id) {
    const sel = document.getElementById(id);
    const delBtn = document.getElementById(id + '-del');
    const customWrap = document.getElementById(id + '-custom-wrap');
    if (!sel) return;
    if (sel.value === '__ADD_LOC__') {
        customWrap.style.display = 'flex';
        delBtn.style.display = 'none';
    } else {
        customWrap.style.display = 'none';
        delBtn.style.display = sel.value ? 'block' : 'none';
        sel.dataset.prevValue = sel.value;
    }
};

window.saveNewLabLocation = async function(id) {
    const inp = document.getElementById(id + '-new');
    const val = inp ? inp.value.trim() : '';
    if (!val) { alert('Nama lokasi tidak boleh kosong!'); return; }
    const locations = window._labLocationsCache || [];
    if (locations.includes(val)) { alert('Lokasi sudah ada!'); return; }
    try {
        const res = await fetch('/api/dataentry/lab-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: val })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Gagal simpan');
    } catch(err) {
        console.warn('saveNewLocation API error:', err.message);
    }
    // Update cache dan refresh semua dropdown
    const updated = [...(window._labLocationsCache || []), val];
    window._labLocationsCache = updated;
    // Collect IDs dulu, replace hanya dropdown div (bukan de-field agar label tidak hilang)
    const _slIds = Array.from(document.querySelectorAll('.location-dropdown')).map(d => ({id: d.id, v: d.id === id ? val : d.value}));
    _slIds.forEach(({id: did, v: cv}) => {
        const el = document.getElementById(did);
        if (el) el.closest('div[style*="flex-direction:column"]').outerHTML = buildLocationDropdown(did, cv);
    });
};

window.cancelAddLabLocation = function(id) {
    const sel = document.getElementById(id);
    const customWrap = document.getElementById(id + '-custom-wrap');
    const delBtn = document.getElementById(id + '-del');
    if (customWrap) customWrap.style.display = 'none';
    if (sel) {
        sel.value = sel.dataset.prevValue || '';
        if (delBtn) delBtn.style.display = sel.value ? 'block' : 'none';
    }
};

window.deleteLabLocation = async function(id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.dataset.prevValue || sel.value;
    if (!val || val === '__ADD_LOC__') return;
    if (!confirm(`Hapus lokasi "${val}"?`)) return;
    try {
        await fetch('/api/dataentry/lab-locations', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: val })
        });
    } catch(err) {
        console.warn('deleteLocation API error:', err.message);
    }
    window._labLocationsCache = (window._labLocationsCache || []).filter(l => l !== val);
    // Collect IDs dulu, replace hanya dropdown div (bukan de-field agar label tidak hilang)
    const _dlIds = Array.from(document.querySelectorAll('.location-dropdown')).map(d => ({id: d.id, v: d.value === val ? '' : d.value}));
    _dlIds.forEach(({id: did, v: cv}) => {
        const el = document.getElementById(did);
        if (el) el.closest('div[style*="flex-direction:column"]').outerHTML = buildLocationDropdown(did, cv);
    });
};