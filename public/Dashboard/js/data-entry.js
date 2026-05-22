function getDataEntryProduction(key,title,sub,icon){
  // Ambil semua project ongoing untuk bisa mulai set point dari project baru atau ongoing
  const projs = gPJ('ongoing');
  const projOpts = projs.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');
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
        <div class="input-group"><input class="de-input" type="number" id="${key}-awal" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">m³</span></div>
      </div>
      <div class="de-field" id="${key}-akhir-wrap" style="display:none;"><label class="de-label" style="color:#111;">Akhir</label>
        <div class="input-group"><input class="de-input" type="number" id="${key}-akhir" placeholder="0" oninput="calcLimbahTotal('${key}')"><span class="group-unit">m³</span></div>
      </div>
      <div class="de-field"><label class="de-label" style="color:#111;">Total Volume</label>
        <div class="input-group"><input class="de-input" type="number" id="${key}-vol" placeholder="Input manual..." style="background:#fff; color:var(--blue); font-weight:700;"><span class="group-unit">m³</span></div>
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
    
    // RESTORE: Jika sebelumnya user input data untuk "harian", restore-nya
    const volEl_input = document.getElementById(key + '-vol');
    if (volEl_input && savedState.proj === '' && savedState.vol) {
      volEl_input.value = savedState.vol;
    }
    
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
    
    // RESTORE: Jika user pernah input data untuk project INI, restore-nya!
    const projIdx = sel.value;
    if (savedState.proj == projIdx) {
      // Sama dengan project yang sebelumnya — restore semua data
      const restoreField = (fieldName, value) => {
        const el = document.getElementById(key + '-' + fieldName);
        if (el && value) el.value = value;
      };
      restoreField('awal',  savedState.awal);
      restoreField('akhir', savedState.akhir);
      restoreField('cod',   savedState.cod);
      restoreField('bod',   savedState.bod);
      restoreField('tss',   savedState.tss);
      restoreField('ph',    savedState.ph);
      restoreField('notes', savedState.notes);
      
      // Hitung total volume
      calcLimbahTotal(key);
      
      console.log('✅ Data di-restore untuk project yang sama');
    } else {
      // Project berbeda — clear dan siap input baru
      ['awal', 'akhir', 'vol', 'cod', 'bod', 'tss', 'ph', 'notes'].forEach(f => {
        const el = document.getElementById(key + '-' + f);
        if (el) el.value = '';
      });
      // Update state dengan project baru tapi field kosong
      window._limbahState = { proj: projIdx };
      console.log('🔄 Project berganti — form di-clear untuk input baru');
    }
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
  // Clear semua field yang sesuai dengan limbah
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
  
  // Simpan state kosong
  window._limbahState = {};
  
  // Hide status bar
  const sbEl = document.getElementById(key + '-sb');
  if (sbEl) sbEl.style.display = 'none';
  
  console.log('🔄 Form ' + key + ' di-reset');
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
            <div>PAC</div>
            <div>Dozing PAC</div>
            <div>Polimer</div>
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
      <span class="group-unit">ml</span>
    </div>

    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pac" id="doz-pac-${uid}" readonly style="padding-right:45px;" placeholder="0">
      <button onclick="toggleJarRowMode('${uid}', 'pac')" id="btn-pac-${uid}" data-mode="auto" style="position:absolute; right:46px; top:50%; transform:translateY(-50%); font-size:8px; padding:3px 6px; border:1px solid var(--blue); background:#ebf2fd; color:var(--blue); border-radius:4px; cursor:pointer; font-weight:700;">AUTO</button>
      <span class="group-unit">L/h</span>
    </div>
    
    <div class="input-group">
      <input class="de-input jar-pol" id="pol-input-${uid}" type="number" placeholder="0" oninput="calcJarRowDosing('${uid}', 'pol')">
      <span class="group-unit">ml</span>
    </div>

    <div class="input-group" style="position:relative">
      <input class="de-input jar-doz-pol" id="doz-pol-${uid}" readonly style="padding-right:45px;" placeholder="0">
      <button onclick="toggleJarRowMode('${uid}', 'pol')" id="btn-pol-${uid}" data-mode="auto" style="position:absolute; right:46px; top:50%; transform:translateY(-50%); font-size:8px; padding:3px 6px; border:1px solid var(--blue); background:#ebf2fd; color:var(--blue); border-radius:4px; cursor:pointer; font-weight:700;">AUTO</button>
      <span class="group-unit">L/h</span>
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