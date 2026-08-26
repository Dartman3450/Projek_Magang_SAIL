function getDataEntryProduction(key,title,sub,icon){
  // JANGAN pre-populate dari cache di sini — initDataEntryForm akan load fresh dari API
  // dan populate dropdown dengan benar (termasuk filter role).
  // Pre-populate dari cache menyebabkan: jika ada 1 project di cache, langsung ke project
  // tanpa user memilih, karena initDataEntryForm me-replace options lalu nilai terpilih.
  return `<div class="de-wrap" id="de-wrap-${key}">
  <!-- Floating fixed Tahapan Produksi panel — muncul setelah project dipilih -->
  <div id="dep-stage-float-${key}" class="dep-stage-float-wrap"></div>
  <!-- Spacer: menggantikan ruang panel yang position:fixed (tidak ada di flow) -->
  <div id="dep-stage-spacer-${key}" style="height:0;transition:height .25s;flex-shrink:0;"></div>
  <!-- Tombol reopen ketika panel ditutup -->
  <div id="dep-stage-reopen-${key}" class="dep-stage-reopen-btn" style="display:none;">
    <button onclick="toggleProdStagePanelFloat('${key}', true)">⚙️ Tahapan Produksi &nbsp;▼</button>
  </div>
  <div class="de-header"><div><div class="de-title">${title}</div><div class="de-sub">${sub}</div></div></div>
  <div class="de-card">
    <div class="de-card-title"><span class="de-card-ico">${icon}</span> ${title}</div>
    <div class="de-proj-select-wrap">
      <label class="de-label" style="color:#111;">PILIH ONGOING PROJECT</label>
      <select id="dep-proj-sel-${key}" onchange="loadDEProjForm('${key}')">
        <option value="">-- Pilih project ongoing --</option>
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
        <div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-awal" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">m³</span></div>
      </div>
      <div class="de-field" id="${key}-akhir-wrap" style="display:none;"><label class="de-label" style="color:#111;">Akhir</label>
        <div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-akhir" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">m³</span></div>
      </div>
      <div class="de-field"><label class="de-label" style="color:#111;">Total Volume</label>
        <div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-vol" placeholder="Input manual..." style="background:#fff; color:var(--blue); font-weight:700;"><span class="group-unit">m³</span></div>
      </div>
      
      <div class="de-field"><label class="de-label" style="color:#111;">COD</label><div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-cod" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">BOD</label><div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-bod" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">TSS</label><div class="input-group"><input class="de-input" type="text" inputmode="decimal" id="${key}-tss" placeholder="0"><span class="group-unit">mg/L</span></div></div>
      <div class="de-field"><label class="de-label" style="color:#111;">pH</label><input class="de-input" type="text" inputmode="decimal" id="${key}-ph" placeholder="7.0" step="0.1"></div>
      <div class="de-field de-full"><label class="de-label" style="color:#111;">NOTES</label><textarea class="de-input de-textarea" id="${key}-notes" placeholder="Add notes here..."></textarea></div>
      ${buildPhotoUpload(key)}

    </div>
    <div class="de-status-bar" id="${key}-sb" style="display:none"><span id="${key}-sm"></span></div>
    
    <div class="de-actions" style="justify-content:space-between; margin-top:20px; align-items:center;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="de-btn de-btn-primary" onclick="openJarTestModal('${key}')" style="background:#0ea5e9; border-color:#0ea5e9; font-size:12px; padding:10px 18px; box-shadow:0 4px 10px rgba(14,165,233,0.3);">🧪 Buka Jar Test</button>
        <div id="jar-status-${key}" style="font-size:11px; padding:6px 10px; border-radius:6px; background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; display:none;">✅ Jar data ready</div>
      </div>
      
      <div style="display:flex; gap:10px;">
        <button class="de-btn de-btn-ghost" onclick="resetDE('${key}')">🔄 Reset</button>
        <button class="de-btn de-btn-primary" onclick="submitLimbah('${key}')">💾 Save Data</button>
      </div>
    </div>
  </div>
</div>`;
}

// 1. Fungsi Switch Tampilan & Mode — dengan restore state
function toggleLimbahVolumeMode(key) {
  const sel = document.getElementById('limbah-proj-sel');
  const awalWrap = document.getElementById(key + '-awal-wrap');
  const akhirWrap = document.getElementById(key + '-akhir-wrap');
  const volEl = document.getElementById(key + '-vol');
  
  if (!sel || !awalWrap || !akhirWrap || !volEl) return;

  // Ambil state yang tersimpan (dari input atau dari window._limbahState)
  const savedState = window._limbahState || {};

  if (sel.value === '') {
    // ═══════════════════════════════════════════════════════════
    // JIKA TIDAK DITAUTKAN (LAPORAN HARIAN)
    // ═══════════════════════════════════════════════════════════
    awalWrap.style.display = 'none';
    akhirWrap.style.display = 'none';
    volEl.readOnly = false;
    volEl.style.background = '#fff';
    volEl.placeholder = 'Input manual...';
    
  } else {
    // ═══════════════════════════════════════════════════════════
    // JIKA DITAUTKAN KE PROJECT
    // ═══════════════════════════════════════════════════════════
    awalWrap.style.display = '';
    akhirWrap.style.display = '';
    
    // Total Volume digembok (Auto-hitung Akhir - Awal)
    volEl.readOnly = true;
    volEl.style.background = '#f3f4f6';
    volEl.placeholder = 'Auto (Akhir - Awal)';
    
    // Hitung ulang total volume (data mungkin sudah di-load dari DB)
    calcLimbahTotal(key);
  }
}
window.toggleLimbahVolumeMode = toggleLimbahVolumeMode;

// 2. Fungsi Hitung (AKHIR - AWAL)
function calcLimbahTotal(key) {
  const volEl   = document.getElementById(key + '-vol');
  const awalEl  = document.getElementById(key + '-awal');
  const akhirEl = document.getElementById(key + '-akhir');
  if (!volEl || !awalEl || !akhirEl) return;

  // Selalu hitung — tidak tergantung readOnly property
  const awalStr  = awalEl.value  || '';
  const akhirStr = akhirEl.value || '';

  if (awalStr !== '' || akhirStr !== '') {
    const awal  = parseFloat(awalStr)  || 0;
    const akhir = parseFloat(akhirStr) || 0;
    const total = akhir - awal;
    // Set value langsung dengan override readOnly sementara
    const wasReadOnly = volEl.readOnly;
    volEl.readOnly = false;
    volEl.value = total.toFixed(2);
    volEl.readOnly = wasReadOnly;
    volEl.style.color      = 'var(--blue)';
    volEl.style.fontWeight = '700';
    volEl.style.background = '#f0f7ff';
  } else {
    const wasReadOnly = volEl.readOnly;
    volEl.readOnly = false;
    volEl.value = '';
    volEl.readOnly = wasReadOnly;
    volEl.style.color      = '';
    volEl.style.fontWeight = '';
    volEl.style.background = '#f3f4f6';
  }
}
window.calcLimbahTotal = calcLimbahTotal;

// 3. Ganti fungsi Reset ini agar kotak Awal, Akhir, Total juga ikut terhapus saat direset
function resetDE(key){
  // Clear semua field yang sesuai dengan limbah dan lainnya
  const fields = ['date', 'vol', 'awal', 'akhir', 'total', 'cod', 'bod', 'tss', 'ph', 'temp', 'notes'];
  fields.forEach(f => {
    const el = document.getElementById(key + '-' + f);
    if (el) {
      el.value = '';
      el.removeAttribute('readonly');
    }
  });
  
  // Reset project selector jika ada
  const projSel = document.getElementById('limbah-proj-sel');
  if (projSel) {
    projSel.value = '';
    // Trigger change event untuk update display
    projSel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Set date ke hari ini
  const dateEl = document.getElementById(key + '-date');
  if (dateEl) {
    dateEl.value = new Date().toISOString().split('T')[0];
  }
  
  // Simpan state kosong + hapus sessionStorage
  window._limbahState = {};
  window._limbahAutoFillAllowed = true;
  try { sessionStorage.removeItem('limbah_form_state'); } catch {}
  
  // ✅ Clear jar data & hide jar status indicator
  // Clear jar data hanya untuk project aktif
  const _rSel  = document.getElementById('limbah-proj-sel');
  const _rOpt  = _rSel?.options[_rSel?.selectedIndex];
  const _rName = _rOpt && _rSel?.value!=='' ? (_rOpt.textContent||'').trim() : '';
  const _rKey  = _rName ? 'jartest__'+_rName : 'jartest__harian';
  try { localStorage.removeItem(_rKey); } catch {}
  if (window._jarByProj) delete window._jarByProj[_rKey];
  const jarStatusEl = document.getElementById('jar-status-'+key);
  if (jarStatusEl) jarStatusEl.style.display = 'none';
  
  // Hide status bar
  const sbEl = document.getElementById(key + '-sb');
  if (sbEl) sbEl.style.display = 'none';
  
  console.log('🔄 Form ' + key + ' di-reset');
}

function openJarTestModal(key) {
  const today = new Date().toISOString().split('T')[0];

  // ✅ FIX: auto-sync mode & project dari form Limbah utama (#limbah-proj-sel)
  // supaya Jar Test SELALU ke-link ke project yang sedang aktif diisi di form,
  // bukan ke mode/project terakhir yang kebetulan kepilih di modal Jar Test
  // (sebelumnya modal ini punya dropdown project sendiri yang lepas total
  // dari form Limbah — itu penyebab utama data Jar Test "tidak masuk").
  let lastMode = window._jarLinkMode || 'harian';
  window._jarLinkProjName = '';
  window._jarLinkUserOverridden = false; // reset supaya auto-sync jalan lagi di sesi modal baru
  if (key === 'limbah') {
    const mainSel = document.getElementById('limbah-proj-sel');
    const mainOpt = mainSel?.options[mainSel?.selectedIndex];
    if (mainSel && mainSel.value !== '' && mainOpt) {
      // limbah-proj-sel hanya diisi dari project ongoing (lihat _populateLimbahDropdown)
      lastMode = 'ongoing';
      window._jarLinkProjName = (mainOpt.textContent || '').trim();
    } else if (window._limbahState?.projName) {
      // FIX: fallback ke state form limbah kalau dropdown belum ready tapi project sudah dipilih sebelumnya
      lastMode = 'ongoing';
      window._jarLinkProjName = window._limbahState.projName;
    } else {
      lastMode = 'harian';
    }
  }

  const modalHTML = `
    <div id="jar-modal-wrapper">
      <div id="jar-modal-overlay" onclick="closeJarTestModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;"></div>
      <div id="jar-modal" data-form-key="${key}"
        style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:12px;width:min(850px,95vw);z-index:9999;box-shadow:0 20px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;max-height:90vh;">

        <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;">
          <span style="font-weight:700;font-size:16px;color:#1e293b;">🧪 Input Jar Test Multi-Sampel</span>
          <button onclick="closeJarTestModal()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#64748b;">✕</button>
        </div>

        <div style="padding:20px;overflow-y:auto;flex:1;">
          <style>
            .de-mode-btn{padding:7px 12px;border:1.5px solid #e2e8f0;background:#fff;border-radius:8px;font-size:11px;font-weight:600;color:#64748b;cursor:pointer;transition:.15s;}
            .de-mode-btn:hover{border-color:var(--blue);color:var(--blue);}
            .de-mode-btn.active{border-color:var(--blue);background:#ebf2fd;color:var(--blue);}
          </style>
          <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:15px;margin-bottom:20px;">
            <div class="de-field">
              <label class="de-label">LINK KE PROJECT</label>
              <div id="jar-link-mode-tabs" style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
                <button type="button" class="de-mode-btn" data-mode="harian" onclick="setJarLinkMode('harian')">📅 Laporan Harian</button>
                <button type="button" class="de-mode-btn" data-mode="ongoing" onclick="setJarLinkMode('ongoing')">🚧 On Going Project</button>
                <button type="button" class="de-mode-btn" data-mode="completed" onclick="setJarLinkMode('completed')">✅ Completed Project</button>
              </div>
              <div id="jar-proj-sel-wrap" style="display:none;margin-top:8px;">
                <select class="de-input de-select" id="jar-proj-sel" style="border-color:var(--blue);background:#ebf2fd;" onchange="onJarProjChange()">
                  <option value="">-- Pilih project --</option>
                </select>
              </div>
            </div>
            <div class="de-field">
              <label class="de-label">DATE</label>
              <input class="de-input" type="date" id="jar-date" value="${today}">
            </div>
          </div>

          <div id="jar-save-banner-wrap"></div>

          <div style="display:grid;grid-template-columns:80px 1fr 1fr 1fr 1fr 40px;gap:10px;padding:0 10px 8px;border-bottom:2px solid #eee;margin-bottom:10px;font-size:11px;font-weight:700;color:var(--txt2);text-align:center;">
            <div>pH</div><div>PAC</div><div>Dozing PAC</div><div>Polimer</div><div>Dozing Polimer</div><div></div>
          </div>
          <div id="jar-row-container"></div>
          <button class="de-btn de-btn-ghost" onclick="addJarTestRow()" style="width:100%;margin-top:10px;border-style:dashed;font-size:12px;">＋ Tambah Sampel Pengujian</button>
          <div style="font-size:11px;font-style:italic;color:var(--txt3);text-align:right;margin-top:15px;">* Volume Sample = 500ml</div>
        </div>

        <div style="padding:16px 20px;border-top:1px solid #eee;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
          <button class="de-btn de-btn-ghost" onclick="resetJarModalInputs()">🔄 Clear All</button>
          <div style="display:flex;gap:10px;">
            <button class="de-btn de-btn-outline" id="jar-btn-save-summary" style="display:none;" onclick="submitJarTestModal(true)">📊 Simpan ke Summary</button>
            <button class="de-btn de-btn-primary" id="jar-btn-save-all" onclick="submitJarTestModal(window._jarLinkMode === 'ongoing')">💾 Save All Data</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.id = 'jar-modal-root';
  div.innerHTML = modalHTML;
  document.body.appendChild(div);

  // Buka dengan mode terakhir yang dipakai (default: Laporan Harian)
  setJarLinkMode(lastMode, window._jarLinkProjIdx || '');
}

// ── Fungsi Ganti Mode Link Project di dalam modal Jar Test ────
// (Laporan Harian / On Going Project / Completed Project)
function setJarLinkMode(mode, restoreValue) {
  window._jarLinkMode = mode;

  document.querySelectorAll('#jar-link-mode-tabs .de-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  // Tampilkan tombol "Simpan ke Summary" HANYA untuk completed project
  // Ongoing project langsung simpan ke DB saat klik "Save All Data"
  const saveSummaryBtn = document.getElementById('jar-btn-save-summary');
  if (saveSummaryBtn) {
    saveSummaryBtn.style.display = mode === 'completed' ? '' : 'none';
  }

  const wrap = document.getElementById('jar-proj-sel-wrap');
  const sel  = document.getElementById('jar-proj-sel');
  if (!wrap || !sel) return;

  if (mode === 'harian') {
    wrap.style.display = 'none';
    sel.innerHTML = '<option value="">-- Tidak ditautkan --</option>';
    sel.value = '';
    reloadJarModalData();
  } else {
    wrap.style.display = '';
    fillJarProjOptions(mode, restoreValue);
  }
}
window.setJarLinkMode = setJarLinkMode;

// ── Isi dropdown project di modal Jar Test sesuai mode (ongoing / completed) ──
function fillJarProjOptions(mode, restoreValue) {
  const sel = document.getElementById('jar-proj-sel');
  if (!sel) return;

  const currentRole = localStorage.getItem('role') || 'limbah';
  const isAdmin      = ['admin','superadmin'].includes(currentRole);

  const renderOpts = (allProjs) => {
    allProjs = allProjs || [];
    const projs = isAdmin ? allProjs : allProjs.filter(p => {
      if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
      return p.allowed_roles.includes(currentRole);
    });
    sel.innerHTML = '<option value="">-- Pilih project ' + (mode === 'ongoing' ? 'on going' : 'completed') + ' --</option>';
    projs.forEach(p => {
      const realIdx = allProjs.indexOf(p);
      const opt = document.createElement('option');
      opt.value = realIdx; opt.textContent = p.name;
      sel.appendChild(opt);
    });
    // ✅ FIX: prioritaskan match by NAME kalau ada sync dari #limbah-proj-sel
    // (lebih aman drpd index, karena index bisa geser antara 2 fetch project list berbeda)
    //
    // BUG SEBELUMNYA: renderOpts() dipanggil DUA KALI — sekali dari data cache
    // (gPJ), sekali lagi dari data fresh network (loadPJ, async, datang belakangan).
    // window._jarLinkProjName langsung dikosongkan setelah dipakai SEKALI di
    // render pertama, jadi render KEDUA (fresh) nggak nemu nama buat di-restore
    // dan dropdown diam-diam reset ke "-- Pilih project --" (value kosong).
    // Efeknya: data Jar Test tersimpan di key 'jartest__harian', BUKAN
    // 'jartest__<NamaProject>' — makanya nggak ketemu waktu form Limbah utama
    // (yang benar linknya ke project) belakangan mencari data itu.
    //
    // FIX: jangan clear window._jarLinkProjName di sini. Biarkan dia tetap ada
    // supaya SETIAP render (baik cache maupun fresh) re-apply match yang sama.
    // Hanya dianggap "selesai"/di-clear kalau user secara manual ganti pilihan
    // sendiri (lihat onJarProjChange / window._jarLinkUserOverridden di bawah).
    if (window._jarLinkProjName && !window._jarLinkUserOverridden) {
      const matchOpt = Array.from(sel.options).find(o => (o.textContent || '').trim() === window._jarLinkProjName);
      if (matchOpt) sel.value = matchOpt.value;
    } else if (restoreValue !== undefined && restoreValue !== '' && sel.querySelector('option[value="' + restoreValue + '"]')) {
      sel.value = restoreValue;
    }
    reloadJarModalData();
  };

  const cached = (typeof gPJ === 'function') ? gPJ(mode) : [];
  if (cached && cached.length > 0) {
    renderOpts(cached);
  } else {
    sel.innerHTML = '<option value="">⏳ Memuat project...</option>';
  }

  if (typeof loadPJ === 'function') {
    loadPJ(mode).then(fresh => { if (fresh && fresh.length) renderOpts(fresh); }).catch(() => {});
  } else {
    fetch('/api/projects?type=' + mode)
      .then(r => r.json())
      .then(json => {
        const projs = json.data || json || [];
        if (projs.length) {
          if (typeof sPJ === 'function') sPJ(mode, projs);
          renderOpts(projs);
        } else if (!cached || !cached.length) {
          sel.innerHTML = '<option value="">-- Tidak ada project ' + (mode === 'ongoing' ? 'on going' : 'completed') + ' --</option>';
        }
      })
      .catch(() => { if (!cached || !cached.length) sel.innerHTML = '<option value="">-- Gagal load project --</option>'; });
  }
}
window.fillJarProjOptions = fillJarProjOptions;

// Dipanggil saat user ganti pilihan project di dalam modal
function onJarProjChange() {
  // User sudah pilih manual — jangan biarkan auto-sync dari #limbah-proj-sel
  // menimpa pilihan ini lagi di render-render berikutnya.
  window._jarLinkUserOverridden = true;
  reloadJarModalData();
}
window.onJarProjChange = onJarProjChange;

// Ambil info link aktif saat ini (mode + project index/nama + localStorage key)
function _getJarLinkInfo() {
  const mode = window._jarLinkMode || 'harian';
  const sel  = document.getElementById('jar-proj-sel');
  const idx  = (mode !== 'harian' && sel) ? sel.value : '';
  const opt  = sel?.options[sel?.selectedIndex];
  const name = (idx !== '' && opt) ? (opt.textContent || '').trim() : '';
  const lsKey = name ? 'jartest__' + name : 'jartest__harian';
  return { mode, idx, name, lsKey };
}

// Muat ulang baris & banner sesuai project/mode yang sedang aktif di modal
function reloadJarModalData() {
  const { idx, lsKey } = _getJarLinkInfo();
  window._jarLinkProjIdx = idx;

  const container = document.getElementById('jar-row-container');
  const banner    = document.getElementById('jar-save-banner-wrap');
  if (!container) return;
  container.innerHTML = '';
  if (banner) banner.innerHTML = '';

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(lsKey) || 'null'); } catch {}

  if (saved && saved.entries && saved.entries.length > 0) {
    window._jarTestData = saved;
    saved.entries.forEach(ent => addJarTestRow(ent));
    if (banner) banner.innerHTML = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:13px;color:#166534;font-weight:600;margin-bottom:12px;">' +
      '📋 Data tersimpan — PAC avg: <b>' + (saved.jar_alum||'—') + ' L/h</b>, Polimer avg: <b>' + (saved.jar_total||'—') + ' L/h</b></div>';
  } else {
    window._jarTestData = null;
    addJarTestRow();
  }
}
window.reloadJarModalData = reloadJarModalData;

// 1. Fungsi Tambah Baris — support prefill dari entry tersimpan
function addJarTestRow(ent) {
  const container = document.getElementById('jar-row-container');
  const uid = Date.now() + Math.random().toString(36).substr(2,5);
  const vPh=ent?.ph||'', vPac=ent?.pac||'', vDozPac=ent?.dozPac||'', vPol=ent?.pol||'', vDozPol=ent?.dozPol||'';
  const pA = !vDozPac||(parseFloat(vDozPac)||0)===(parseFloat(vPac)||0)*2;
  const lA = !vDozPol||(parseFloat(vDozPol)||0)===(parseFloat(vPol)||0)*2;
  const row = document.createElement('div');
  row.className='jar-data-row'; row.id='jar-row-'+uid;
  row.style.cssText='display:grid;grid-template-columns:70px 1fr 1fr 1fr 1fr 35px;gap:12px;margin-bottom:10px;align-items:center;background:#fdfdfd;padding:8px;border-radius:8px;border:1px solid #f1f1f1;';
  row.innerHTML=`
    <input class="de-input jar-ph" type="text" inputmode="decimal" placeholder="pH" value="${vPh}">
    <div class="input-group">
      <input class="de-input jar-pac" id="pac-input-${uid}" type="text" inputmode="decimal" placeholder="PAC" value="${vPac}" oninput="calcJarRowDosing('${uid}','pac')">
      <span class="group-unit">ml</span>
    </div>
    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pac" id="doz-pac-${uid}" ${pA?'readonly':''} style="padding-right:45px;" placeholder="Doz." value="${vDozPac}">
      <button onclick="toggleJarRowMode('${uid}','pac')" id="btn-pac-${uid}" data-mode="${pA?'auto':'manual'}"
        style="position:absolute;right:46px;top:50%;transform:translateY(-50%);font-size:8px;padding:3px 6px;
          border:1px solid ${pA?'var(--blue)':'var(--orange)'};background:${pA?'#ebf2fd':'#fffbeb'};
          color:${pA?'var(--blue)':'var(--orange)'};border-radius:4px;cursor:pointer;font-weight:700;">${pA?'AUTO':'MAN'}</button>
      <span class="group-unit">L/h</span>
    </div>
    <div class="input-group">
      <input class="de-input jar-pol" id="pol-input-${uid}" type="text" inputmode="decimal" placeholder="Polimer" value="${vPol}" oninput="calcJarRowDosing('${uid}','pol')">
      <span class="group-unit">ml</span>
    </div>
    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pol" id="doz-pol-${uid}" ${lA?'readonly':''} style="padding-right:45px;" placeholder="Doz." value="${vDozPol}">
      <button onclick="toggleJarRowMode('${uid}','pol')" id="btn-pol-${uid}" data-mode="${lA?'auto':'manual'}"
        style="position:absolute;right:46px;top:50%;transform:translateY(-50%);font-size:8px;padding:3px 6px;
          border:1px solid ${lA?'var(--blue)':'var(--orange)'};background:${lA?'#ebf2fd':'#fffbeb'};
          color:${lA?'var(--blue)':'var(--orange)'};border-radius:4px;cursor:pointer;font-weight:700;">${lA?'AUTO':'MAN'}</button>
      <span class="group-unit">L/h</span>
    </div>
    <button onclick="document.getElementById('jar-row-${uid}').remove()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;">✕</button>
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
  // Kembalikan tanggal ke hari ini
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

// ─── FUNGSI SUBMIT JAR TEST ─────────────────────────────────────

function submitJarTestModal(saveToDb = false) {
  // Baca mode/project yang sedang aktif dipilih di dalam modal
  const { mode: projMode, idx: projIdx, name: projName, lsKey } = _getJarLinkInfo();
  const date = document.getElementById('jar-date')?.value ?? '';

  const allEntries = [];
  document.querySelectorAll('.jar-data-row').forEach(row => {
    const ph=row.querySelector('.jar-ph')?.value||'', pac=row.querySelector('.jar-pac')?.value||'',
          dozPac=row.querySelector('.jar-doz-pac')?.value||'', pol=row.querySelector('.jar-pol')?.value||'',
          dozPol=row.querySelector('.jar-doz-pol')?.value||'';
    if (ph||pac||pol||dozPac||dozPol) allEntries.push({ph,pac,dozPac,pol,dozPol});
  });

  if (!allEntries.length) { showQuickToast('❌ Isi minimal satu baris data!'); return; }

  const dPac=allEntries.map(e=>parseFloat(e.dozPac)||0).filter(v=>v>0);
  const dPol=allEntries.map(e=>parseFloat(e.dozPol)||0).filter(v=>v>0);
  const aPac=allEntries.map(e=>(parseFloat(e.pac)||0)*2).filter(v=>v>0);
  const aPol=allEntries.map(e=>(parseFloat(e.pol)||0)*2).filter(v=>v>0);
  const jarAlum  = dPac.length?(dPac.reduce((a,b)=>a+b,0)/dPac.length).toFixed(2):aPac.length?(aPac.reduce((a,b)=>a+b,0)/aPac.length).toFixed(2):null;
  const jarTotal = dPol.length?(dPol.reduce((a,b)=>a+b,0)/dPol.length).toFixed(2):aPol.length?(aPol.reduce((a,b)=>a+b,0)/aPol.length).toFixed(2):null;

  const dataToSave = {
    saved_at: new Date().toISOString(), entries: allEntries,
    jar_alum: jarAlum?parseFloat(jarAlum):null, jar_total: jarTotal?parseFloat(jarTotal):null,
    jar_entries: allEntries,   // ← detail per sampel untuk summary
    tanggal: date, proj_name: projName||null, mode: projMode,
  };

  // Simpan ke localStorage KEY KHUSUS project ini
  try { localStorage.setItem(lsKey, JSON.stringify(dataToSave)); } catch(e){}
  if (!window._jarByProj) window._jarByProj = {};
  window._jarByProj[lsKey] = dataToSave;

  // ✅ Set window._jarTestData agar submitLimbah (di library manapun) bisa membacanya
  window._jarTestData = dataToSave;
  // Juga set dengan key project name agar laboratory.js bisa baca via _jarByProj
  if (projName) {
    window._jarByProj['jartest__'+projName] = dataToSave;
    try { localStorage.setItem('jartest__'+projName, JSON.stringify(dataToSave)); } catch {}
  }
  console.log('💾 Jar saved ['+lsKey+'] mode='+projMode+':', dataToSave);

  // Update badge di form limbah
  const badge = document.getElementById('jar-status-limbah');
  if (badge) { badge.style.display='flex'; badge.innerHTML='✅ Jar: '+(jarAlum||'—')+' L/h PAC, '+(jarTotal||'—')+' L/h Polimer'; }

  // Simpan ke history project cache (list sesuai mode: ongoing / completed)
  if (projIdx !== '') {
    const pjType = projMode === 'completed' ? 'completed' : 'ongoing';
    const projs=gPJ(pjType); const p=projs[+projIdx];
    if (p) {
      if (!p.jarTestHistory) p.jarTestHistory=[];
      allEntries.forEach((ent,i)=>{ const s=allEntries.length>1?' (Sampel '+(i+1)+')':'';
        p.jarTestHistory.push({saved_at:new Date().toISOString(),fields:[
          {label:'pH'+s,newVal:ent.ph||'—'},{label:'Dozing PAC'+s,newVal:ent.dozPac||'0'},
          {label:'Dozing Polimer'+s,newVal:ent.dozPol||'0'}]});
      });
      sPJ(pjType, projs);
      // Jar test data sudah disimpan ke memory/_jarByProj/_jarTestData
      // Untuk ongoing project: saveToDb=true → langsung POST ke DB saat klik "Save All Data"
      // Untuk completed project: saveToDb=true → POST ke DB saat klik "Simpan ke Summary"
      if (saveToDb && p) {
        fetch('/api/dataentry/limbah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_name: p.name || projName,
            tanggal:      date,
            jar_alum:     jarAlum  ? parseFloat(jarAlum)  : null,
            jar_total:    jarTotal ? parseFloat(jarTotal) : null,
            jar_entries:  allEntries,
            notes:        'Jar Test',
            tipe:         'project',
          })
        }).then(r => r.json()).then(j => {
          if (j.success) {
            console.log('✅ Jar Test → DB limbah project:', p.name);
            // Clear jar data setelah berhasil masuk DB
            window._jarTestData = null;
            if (window._jarByProj) delete window._jarByProj['jartest__' + p.name];
            try { localStorage.removeItem('jartest__' + p.name); } catch {}

            // ✅ Tampilkan banner sukses dengan tanggal + jam setelah DB confirm
            const _now = new Date();
            const _tgl = _now.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
            const _jam = _now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
            const _mode = projMode === 'completed' ? '✅ Completed' : '🚧 On Going';
            const wrap = document.getElementById('jar-save-banner-wrap');
            if (wrap) {
              wrap.innerHTML = '<div id="jar-success-banner" style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;font-size:13px;color:#166534;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">' +
                '<div style="display:flex;flex-direction:column;gap:3px;">' +
                  '<span>✅ Data Jar Test berhasil disimpan ke summary!</span>' +
                  '<span style="font-size:11px;font-weight:400;color:#15803d;">📁 '+_mode+' — <b>'+(p.name||projName)+'</b></span>' +
                  '<span style="font-size:11px;font-weight:400;color:#15803d;">🕐 '+_tgl+', '+_jam+' &nbsp;|&nbsp; PAC avg: <b>'+(jarAlum||'—')+' L/h</b> &nbsp;|&nbsp; Polimer avg: <b>'+(jarTotal||'—')+' L/h</b></span>' +
                '</div>' +
                '<button onclick="closeJarTestModal()" style="padding:5px 14px;border:none;background:#16a34a;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;">Tutup</button>' +
              '</div>';
              // Auto-hide setelah 4 detik (tapi tidak hapus modal, hanya banner)
              setTimeout(() => {
                const b = document.getElementById('jar-success-banner');
                if (b) b.style.opacity = '0';
                setTimeout(() => { if (b) b.style.display = 'none'; }, 400);
              }, 4000);
            }
          } else {
            console.error('❌ Jar Test DB error:', j.error);
            // Tampilkan banner error
            const wrap = document.getElementById('jar-save-banner-wrap');
            if (wrap) wrap.innerHTML = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:13px;color:#991b1b;font-weight:600;margin-bottom:12px;">❌ Gagal simpan ke summary: '+(j.error||'Unknown error')+'</div>';
          }
        }).catch(e => {
          console.error('❌ Jar Test fetch error:', e);
          const wrap = document.getElementById('jar-save-banner-wrap');
          if (wrap) wrap.innerHTML = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:13px;color:#991b1b;font-weight:600;margin-bottom:12px;">❌ Koneksi gagal: '+e.message+'</div>';
        });
      }
      console.log('✅ Jar Test disimpan ke memory untuk project:', p.name);
    }
  } else {
    const har=JSON.parse(localStorage.getItem('harian_entries')||'[]');
    allEntries.forEach((ent,i)=>{ har.unshift({id:Date.now()+i,cat:'limbah',projName:'Jar Test Harian',
      data:{'Tanggal':date,'pH':ent.ph||'—','PAC (mg)':ent.pac||'—','Doz. PAC':ent.dozPac||'—','Polimer (mg)':ent.pol||'—','Doz. Polimer':ent.dozPol||'—'},
      saved_at:new Date().toISOString()}); });
    localStorage.setItem('harian_entries', JSON.stringify(har));
  }

  // Tampilkan banner sementara (sebelum DB respond) — hanya untuk non-saveToDb
  if (!saveToDb) {
    const wrap = document.getElementById('jar-save-banner-wrap');
    const _bBadge = projIdx !== '' ? (projMode === 'completed' ? '✅ Completed — ' : '🚧 On Going — ') : '';
    const _now = new Date();
    const _tgl = _now.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
    const _jam = _now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    if (wrap) wrap.innerHTML = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:13px;color:#166534;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">' +
      '<div style="display:flex;flex-direction:column;gap:3px;">' +
        '<span>✅ '+_bBadge+'<b>'+(projName||'Harian')+'</b> — data tersimpan</span>' +
        '<span style="font-size:11px;font-weight:400;color:#15803d;">🕐 '+_tgl+', '+_jam+' &nbsp;|&nbsp; PAC avg: <b>'+(jarAlum||'—')+' L/h</b> &nbsp;|&nbsp; Polimer avg: <b>'+(jarTotal||'—')+' L/h</b></span>' +
      '</div>' +
      '<button onclick="closeJarTestModal()" style="padding:5px 14px;border:none;background:#16a34a;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap">Tutup Modal</button></div>';
  }
}

function closeJarTestModal() {
  document.getElementById('jar-modal-root')?.remove();
}
window.closeJarTestModal = closeJarTestModal;