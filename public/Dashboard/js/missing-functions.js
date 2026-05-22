// ═══════════════════════════════════════════════════════════════
// MISSING FUNCTIONS — tambahkan ke file yang sesuai
// Semua fungsi ini hilang dan menyebabkan ReferenceError
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 1. FUNGSI UNTUK nav.js — setActive
// ─────────────────────────────────────────────────────────────
function setActive(el) {
  document.querySelectorAll('.nav-item, .nav-sub-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
}
window.setActive = setActive;

// ─────────────────────────────────────────────────────────────
// 2. FUNGSI UNTUK reports.js — switchReportTab, changeReportSort,
//    clearDateFilters, getTabLabel
// ─────────────────────────────────────────────────────────────
function switchReportTab(tab, el) {
  _activeReportTab = tab;
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderHarianReports();
}
window.switchReportTab = switchReportTab;

function changeReportSort(val) {
  _reportSortBy = val;
  renderHarianReports();
}
window.changeReportSort = changeReportSort;

function clearDateFilters() {
  const from = document.getElementById('report-date-from');
  const to   = document.getElementById('report-date-to');
  if (from) from.value = '';
  if (to)   to.value   = '';
  renderHarianReports();
}
window.clearDateFilters = clearDateFilters;

function getTabLabel(tab) {
  const labels = { lab: 'Laboratorium', utility: 'Utility', limbah: 'Limbah' };
  return labels[tab] || tab;
}
window.getTabLabel = getTabLabel;

// ─────────────────────────────────────────────────────────────
// 3. FUNGSI UNTUK surat-jalan.js — editSuratJalan, deleteSuratJalan
// ─────────────────────────────────────────────────────────────
function editSuratJalan(idx) {
  openSuratJalanForm(idx);
}
window.editSuratJalan = editSuratJalan;

function deleteSuratJalan(idx) {
  if (!confirm('Hapus surat jalan ini?')) return;
  const data = gSJ();

  // Hapus auto-debit kartu stok jika ada
  if (typeof gSCTxn === 'function' && typeof sSCTxn === 'function') {
    const sj = data[idx];
    const autoIds = sj?._autoDebitIds || [];
    if (autoIds.length) {
      const txns = gSCTxn().filter(t => !autoIds.includes(t.id));
      sSCTxn(txns);
    }
  }

  data.splice(idx, 1);
  sSJ(data);
  renderSuratJalan();
}
window.deleteSuratJalan = deleteSuratJalan;

// ─────────────────────────────────────────────────────────────
// 4. FUNGSI UNTUK surat-jalan.js — checkVacuum, handlePhotoUpload
//    (placeholder — di-assign ke window tapi tidak pernah dibuat)
// ─────────────────────────────────────────────────────────────
function checkVacuum() {
  // placeholder — belum diimplementasi
}
window.checkVacuum = checkVacuum;

function handlePhotoUpload(input, key) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById(key + '-photo-preview');
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}
window.handlePhotoUpload = handlePhotoUpload;

// ─────────────────────────────────────────────────────────────
// 5. FUNGSI UNTUK data-entry.js — initDataEntryForm, submitLimbah,
//    buildPhotoUpload, showQuickToast
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// 6. OVERRIDE calcLimbahTotal — fix readOnly tidak mau diisi
// ─────────────────────────────────────────────────────────────
function calcLimbahTotal(key) {
  const volEl   = document.getElementById(key + '-vol');
  const awalEl  = document.getElementById(key + '-awal');
  const akhirEl = document.getElementById(key + '-akhir');
  if (!volEl || !awalEl || !akhirEl) return;

  const awalStr  = awalEl.value  || '';
  const akhirStr = akhirEl.value || '';

  if (awalStr !== '' || akhirStr !== '') {
    const awal  = parseFloat(awalStr)  || 0;
    const akhir = parseFloat(akhirStr) || 0;
    const total = akhir - awal;
    // Force override readOnly dan semua CSS inline
    volEl.removeAttribute('readonly');
    volEl.value = total.toFixed(2);
    volEl.setAttribute('readonly', 'true');
    volEl.style.cssText = 'background:#f0f7ff !important;color:var(--blue);font-weight:700;border-color:#bae6fd;cursor:not-allowed;';
  } else {
    volEl.removeAttribute('readonly');
    volEl.value = '';
    volEl.setAttribute('readonly', 'true');
    volEl.style.cssText = 'background:#f3f4f6;color:var(--txt3);font-weight:normal;';
  }
}
window.calcLimbahTotal = calcLimbahTotal;

// ─────────────────────────────────────────────────────────────
// 7. OVERRIDE submitLimbah — setelah save, awal/akhir/vol TIDAK dihapus
// ─────────────────────────────────────────────────────────────
function resetDEAfterSave(key) {
  // Setelah save TIDAK perlu reset apapun — nilai tetap di form
  // User bisa klik Reset manual kalau mau input baru
}
window.resetDEAfterSave = resetDEAfterSave;

function initDataEntryForm(key) {
  const dtEl = document.getElementById('de-dt-' + key);
  if (dtEl) dtEl.textContent = new Date().toLocaleString('id-ID');

  if (key === 'limbah') {
    const sel = document.getElementById('limbah-proj-sel');
    if (sel) {
      const projs = gPJ('ongoing');

      // Simpan state yang sudah ada (kalau form sudah pernah diisi)
      const st = window._limbahState || {};

      sel.innerHTML = '<option value="">-- Tidak ditautkan ke project (Simpan ke Laporan Harian) --</option>';
      projs.forEach((p, i) => {
        sel.innerHTML += `<option value="${i}">${p.name}</option>`;
      });

      // Restore project pilihan
      if (st.proj) sel.value = st.proj;

      // Restore semua nilai field
      const sv = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') el.value = val;
      };
      sv(key+'-date',  st.date  || new Date().toISOString().split('T')[0]);
      sv(key+'-awal',  st.awal);
      sv(key+'-akhir', st.akhir);
      sv(key+'-cod',   st.cod);
      sv(key+'-bod',   st.bod);
      sv(key+'-tss',   st.tss);
      sv(key+'-ph',    st.ph);
      sv(key+'-notes', st.notes);

      // Toggle display awal/akhir/vol
      const awalWrap  = document.getElementById(key+'-awal-wrap');
      const akhirWrap = document.getElementById(key+'-akhir-wrap');
      const volEl     = document.getElementById(key+'-vol');
      if (sel.value !== '') {
        if (awalWrap)  awalWrap.style.display  = '';
        if (akhirWrap) akhirWrap.style.display = '';
        if (volEl) { volEl.readOnly = true; volEl.style.background = '#f3f4f6'; volEl.placeholder = 'Auto (Akhir - Awal)'; }
        calcLimbahTotal(key);
      } else {
        if (awalWrap)  awalWrap.style.display  = 'none';
        if (akhirWrap) akhirWrap.style.display = 'none';
        if (volEl) { volEl.readOnly = false; volEl.style.background = '#fff'; volEl.placeholder = 'Input manual...'; }
        sv(key+'-vol', st.vol);
      }

      // Saat ganti project → JANGAN langsung clear, biarkan toggleLimbahVolumeMode yang handle
      sel.onchange = () => {
        // Update state dengan project baru
        window._limbahState = { proj: sel.value };
        // Trigger toggle untuk restore/clear data sesuai project yang dipilih
        toggleLimbahVolumeMode(key);
      };

      // Simpan state ke window setiap kali ada perubahan
      const saveState = () => {
        window._limbahState = {
          proj:  sel.value,
          date:  document.getElementById(key+'-date')?.value  || '',
          awal:  document.getElementById(key+'-awal')?.value  || '',
          akhir: document.getElementById(key+'-akhir')?.value || '',
          vol:   document.getElementById(key+'-vol')?.value   || '',
          cod:   document.getElementById(key+'-cod')?.value   || '',
          bod:   document.getElementById(key+'-bod')?.value   || '',
          tss:   document.getElementById(key+'-tss')?.value   || '',
          ph:    document.getElementById(key+'-ph')?.value    || '',
          notes: document.getElementById(key+'-notes')?.value || '',
        };
        console.log('💾 State saved:', window._limbahState);
      };
      const fields = ['date','awal','akhir','vol','cod','bod','tss','ph','notes'];
      fields.forEach(f => {
        const el = document.getElementById(key+'-'+f);
        if (el) {
          el.addEventListener('input',  saveState);
          el.addEventListener('change', saveState);
          el.addEventListener('blur',   saveState);
        }
      });
      // Simpan juga saat project dropdown berubah
      sel.addEventListener('change', saveState);
    }
  } else {
    // Non-limbah (production, utility, laboratorium): auto-load first project
    const sel = document.getElementById('dep-proj-sel-'+key);
    if (sel) {
      const projs = gPJ('ongoing');
      const projOpts = projs.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');
      sel.innerHTML = `<option value="">-- Pilih project ongoing --</option>${projOpts}`;
      
      // Auto-load project pertama jika ada
      if (projs.length > 0) {
        sel.value = '0';
        // Trigger loadDEProjForm untuk load form data
        setTimeout(() => {
          if (typeof loadDEProjForm === 'function') {
            loadDEProjForm(key);
          }
        }, 100);
      }
    }
    
    // Set date kalau kosong
    const dateEl = document.getElementById(key+'-date');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
  }
}
window.initDataEntryForm = initDataEntryForm;

// Load data limbah terakhir dari DB dan pre-fill form
// mode: 'full' = isi semua field, 'minimal' = hanya awal/akhir/vol/project
async function _loadLastLimbahFromDB(key, mode = 'full') {
  try {
    // Gunakan tanggal yang ada di form, bukan selalu hari ini
    const dateEl  = document.getElementById(key + '-date');
    const today   = dateEl?.value || new Date().toISOString().split('T')[0];

    const sel      = document.getElementById('limbah-proj-sel');
    const projIdx  = sel?.value ?? '';
    const projs    = gPJ('ongoing');
    const projName = projIdx !== '' ? (projs[+projIdx]?.name || null) : null;

    let url = `/api/dataentry/limbah?tanggal=${today}&limit=5`;
    if (projName) {
      url += `&project_name=${encodeURIComponent(projName)}`;
    }

    const res  = await fetch(url);
    const json = await res.json();
    if (!json.success || !json.data?.length) return;

    const rows = json.data.filter(r => {
      if (projName) return r.project_name === projName;
      return !r.project_name || r.tipe === 'harian';
    });
    if (!rows.length) return;

    const last = rows[0];

    const fill = (id, val) => {
      const el = document.getElementById(id);
      // Hanya fill kalau field masih kosong
      if (el && val != null && val !== '' && el.value === '') el.value = val;
    };
    // Tanggal: selalu format YYYY-MM-DD
    const tgl = last.tanggal ? last.tanggal.substring(0, 10) : '';
    fill(key + '-date',  tgl);
    fill(key + '-awal',  last.awal);
    fill(key + '-akhir', last.akhir);

    if (mode === 'full') {
      fill(key + '-cod',   last.cod);
      fill(key + '-bod',   last.bod);
      fill(key + '-tss',   last.tss);
      fill(key + '-ph',    last.ph);
      fill(key + '-notes', last.notes);
    }

    // Tampilkan field awal/akhir dan hitung total
    if (last.awal != null || last.akhir != null) {
      const awalWrap  = document.getElementById(key + '-awal-wrap');
      const akhirWrap = document.getElementById(key + '-akhir-wrap');
      if (awalWrap)  awalWrap.style.display  = '';
      if (akhirWrap) akhirWrap.style.display = '';
      calcLimbahTotal(key);
    } else if (last.volume != null) {
      const volEl = document.getElementById(key + '-vol');
      if (volEl) { volEl.removeAttribute('readonly'); volEl.value = last.volume; }
    }

    if (mode === 'full') {
      showDESt(key, 'success', `✅ Data terakhir dimuat: ${last.tanggal}${projName ? ' — ' + projName : ''}`);
      setTimeout(() => {
        const bar = document.getElementById(key + '-sb');
        if (bar) bar.style.display = 'none';
      }, 2000);
    }

  } catch (err) {
    console.warn('_loadLastLimbahFromDB:', err.message);
  }
}
window._loadLastLimbahFromDB = _loadLastLimbahFromDB;

async function submitLimbah(key) {
  const g = id => document.getElementById(id)?.value?.trim() ?? '';
  const date    = g(key + '-date');
  const awal    = g(key + '-awal');
  const akhir   = g(key + '-akhir');
  const vol     = g(key + '-vol');
  const cod     = g(key + '-cod');
  const bod     = g(key + '-bod');
  const tss     = g(key + '-tss');
  const ph      = g(key + '-ph');
  const notes   = g(key + '-notes');

  const projSel  = document.getElementById('limbah-proj-sel');
  const projIdx  = projSel?.value ?? '';
  const projs    = gPJ('ongoing');
  const projName = projIdx !== '' ? (projs[+projIdx]?.name || null) : null;

  // VALIDASI TANGGAL
  if (!date) { 
    showDESt(key, 'error', '❌ Tanggal wajib diisi!'); 
    return; 
  }

  // ✅ FIX: Cek apakah minimal ADA UNO field yang diisi (bukan kosong)
  // PENTING: jangan gunakan || karena 0 dianggap false!
  const hasAwal   = awal !== '';
  const hasAkhir  = akhir !== '';
  const hasVol    = vol !== '';
  const hasCod    = cod !== '';
  const hasBod    = bod !== '';
  const hasTss    = tss !== '';
  const hasPh     = ph !== '';
  const hasNotes  = notes !== '';
  
  const hasData = hasAwal || hasAkhir || hasVol || hasCod || hasBod || hasTss || hasPh || hasNotes;
  
  if (!hasData) {
    showDESt(key, 'error', '⚠️ Isi minimal satu field data (awal/akhir/volume/COD/BOD/TSS/pH/notes)!');
    return;
  }

  // SIMPAN STATE sebelum submit (untuk recovery jika error)
  window._limbahState = { proj: projIdx, date, awal, akhir, vol, cod, bod, tss, ph, notes };

  showDESt(key, 'loading', '⏳ Menyimpan data limbah...');

  try {
    const body = {
      tanggal:      date,
      project_name: projName || null,
      tipe:         projName ? 'project' : 'harian',
      awal:         awal  || null,
      akhir:        akhir || null,
      vol_m3:       vol   || null,
      cod:          cod   || null,
      bod:          bod   || null,
      tss:          tss   || null,
      ph:           ph    || null,
      notes:        notes || null,
    };

    console.log('📤 Sending to /api/dataentry/limbah:', body);

    const fetchRes = await fetch('/api/dataentry/limbah', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const json = await fetchRes.json();
    
    console.log('📥 Backend response:', json);
    
    if (!json.success) {
      const errMsg = json.error || 'Gagal simpan data';
      throw new Error(errMsg);
    }

    // ✅ SUKSES — Tampilkan pesan sukses dengan ID
    const successMsg = json.id 
      ? `✅ Data limbah ID #${json.id} berhasil disimpan!`
      : `✅ Data limbah berhasil disimpan!`;
    
    showDESt(key, 'success', successMsg);
    
    console.log('✅ Submit limbah SUKSES, ID:', json.id);

    // JANGAN AUTO-CLEAR — Biarkan user lihat data yang disimpan
    // User bisa manual klik tombol Reset kalau mau input baru
    
  } catch (err) {
    console.error('❌ submitLimbah ERROR:', err.message);
    
    // Tampilkan error dengan jelas
    const displayErr = err.message.length > 80 
      ? err.message.substring(0, 77) + '...'
      : err.message;
    
    showDESt(key, 'error', '❌ ' + displayErr);
    
    // JANGAN CLEAR form ketika error — simpan state untuk retry
    console.log('⚠️ Form state preserved untuk recovery:', window._limbahState);
  }
}

// ─────────────────────────────────────────────────────────────
// 8. LOGOUT & SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────
function confirmLogout() {
  if (confirm('Keluar dari dashboard? Session Anda akan ditutup.')) {
    logout();
  }
}
window.confirmLogout = confirmLogout;

function logout() {
  // Clear session data
  localStorage.removeItem('isLoggedin');
  localStorage.removeItem('user_id');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  localStorage.removeItem('login_time');
  localStorage.removeItem('currentPage');
  localStorage.removeItem('custom_stock_locations');

  // Stop any active polling/timers
  window.stopSCAutoRefresh?.();
  window.cleanupCurrentPage?.();

  // Redirect ke login page
  window.location.href = '/';
}
window.logout = logout;

window.submitLimbah = submitLimbah;

function showDESt(key, type, msg) {
  const bar = document.getElementById(key + '-sb');
  const txt = document.getElementById(key + '-sm');
  if (!bar || !txt) return;
  
  bar.style.display = 'flex';
  bar.className = 'de-status-bar de-status-' + type;
  txt.textContent = msg;
  
  // Auto-hide hanya untuk success message
  if (type === 'success') {
    setTimeout(() => { 
      bar.style.display = 'none'; 
    }, 4000);
  }
  // Untuk error & loading: user harus manual close atau klik reset
}
window.showDESt = showDESt;

function buildPhotoUpload(key) {
  return `
    <div class="de-field de-full">
      <label class="de-label" style="color:#111;">FOTO (opsional)</label>
      <input type="file" accept="image/*" class="de-input" style="padding:6px;"
        onchange="handlePhotoUpload(this, '${key}')">
      <img id="${key}-photo-preview" src="" alt="preview"
        style="display:none;margin-top:8px;max-width:200px;border-radius:8px;border:1px solid var(--border)">
    </div>`;
}
window.buildPhotoUpload = buildPhotoUpload;

function showQuickToast(msg) {
  let toast = document.getElementById('_quick_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_quick_toast';
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:99999;
      background:#1e293b;color:#fff;padding:12px 20px;
      border-radius:10px;font-size:13px;font-weight:600;
      box-shadow:0 4px 20px rgba(0,0,0,.3);
      transition:opacity .3s;pointer-events:none;`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}
window.showQuickToast = showQuickToast;