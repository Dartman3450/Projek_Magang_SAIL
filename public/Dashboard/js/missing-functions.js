// ── Helper: set value with grey style (placeholder-like) ──────
function _greyFill(el, val) {
  if (!el || val == null || val === '') return;
  el.value = String(val);
  el.style.color = '#999';
  el.dataset.prevValue = String(val);

  // Reset flag agar listener selalu dipasang ulang (fix: nilai baru setelah Save/Reset tidak mau terganti)
  el.dataset.greyFillBound = '';

  if (!el.dataset.greyFillBound) {
    el.dataset.greyFillBound = '1';
    el.addEventListener('focus', function() {
      // Kosongkan saat focus agar langsung bisa ketik tanpa backspace
      if (this.value === this.dataset.prevValue) {
        this._savedVal = this.value;
        this.value = '';
        this.style.color = 'var(--txt, #111)';
      }
    });
    el.addEventListener('blur', function() {
      if (this.value === '' && this.dataset.prevValue) {
        // Tidak ada perubahan → kembalikan nilai abu
        this.value = this.dataset.prevValue;
        this.style.color = '#999';
      } else if (this.value !== '') {
        // Ada perubahan → simpan sebagai prevValue baru, warna normal
        this.style.color = 'var(--txt, #111)';
        this.dataset.prevValue = this.value;
      }
    });
  }
}

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
function switchReportTab(tab) {
  window._activeReportTab = tab;
  window._rHarianTab      = tab;
  window._rHarianUtilSub  = null;
  window._rHarianMonth    = null;
  renderHarianReports();
  // Update tab active styles
  requestAnimationFrame(() => {
    ['lab','utility','limbah'].forEach(id => {
      const btn = document.getElementById('htab-' + id);
      if (!btn) return;
      btn.classList.toggle('active', id === tab);
    });
  });
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
// 3. FUNGSI UNTUK surat-jalan.js — editSuratJalan
// ─────────────────────────────────────────────────────────────
function editSuratJalan(idx) {
  openSuratJalanForm(idx);
}
window.editSuratJalan = editSuratJalan;

// ⚠️  deleteSuratJalan TIDAK didefinisikan di sini.
// Versi yang benar (pakai API DELETE /api/surat-jalan/:id) ada di surat-jalan.js.
// Jangan definisikan ulang di sini — akan menimpa versi yang benar.


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
    // ── HELPER: baca/tulis state ke sessionStorage agar survive refresh ──
    const SS_KEY = 'limbah_form_state';
    const _readSS  = () => { try { return JSON.parse(sessionStorage.getItem(SS_KEY) || 'null') || {}; } catch { return {}; } };
    const _writeSS = (st) => { try { sessionStorage.setItem(SS_KEY, JSON.stringify(st)); } catch {} };
    // Inisialisasi window._limbahState dari sessionStorage kalau belum ada
    if (!window._limbahState || Object.keys(window._limbahState).length === 0) {
      window._limbahState = _readSS();
    }

    const sel = document.getElementById('limbah-proj-sel');
    if (sel) {
      sel.disabled = true;
      sel.innerHTML = '<option value="">⏳ Memuat project...</option>';

      const _populateLimbahDropdown = (allProjs) => {
        // Bangun mapping index → nama (name-based, bukan index-based)
        window._limbahProjMap = {};
        sel.innerHTML = '<option value="">-- Tidak ditautkan ke project (Simpan ke Laporan Harian) --</option>';
        allProjs
          .filter(p => p.setPoint && Object.keys(p.setPoint).length > 0)
          .forEach((p, i) => {
            const realIdx = allProjs.indexOf(p);
            window._limbahProjMap[String(realIdx)] = p.name;
            sel.innerHTML += `<option value="${realIdx}">${p.name}</option>`;
          });
        sel.disabled = false;

        // Baca state terbaru (mungkin sudah di-update dari sessionStorage)
        const st = window._limbahState || {};

        // Restore project — validasi nama supaya tidak salah index
        if (st.projName) {
          const matchIdx = allProjs.findIndex(p => p.name === st.projName);
          if (matchIdx >= 0) {
            sel.value = String(matchIdx);
          } else {
            sel.value = '';
            window._limbahState = { ...st, proj: '', projName: '' };
            _writeSS(window._limbahState);
          }
        } else if (st.proj === '') {
          sel.value = '';
        }

        // Restore semua nilai field
        const sv = (id, val) => {
          const el = document.getElementById(id);
          if (id.endsWith('-date') || id.endsWith('-notes')) {
            if (el && val != null && val !== '') el.value = val;
          } else {
            _greyFill(el, val);
          }
        };
        
        // Special handling untuk tanggal — pastikan format YYYY-MM-DD
        const dateTgl = st.date || new Date().toISOString().split('T')[0];
        const dateFormatted = (() => {
          if (dateTgl.includes('T')) {
            return dateTgl.split('T')[0];
          }
          return dateTgl;
        })();
        sv(key+'-date',  dateFormatted);
        
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

        // onchange: Load data limbah terakhir dari database untuk project yang dipilih
        sel.onchange = async () => {
          const selectedProj     = sel.value;
          const selectedProjName = selectedProj !== '' ? (allProjs[+selectedProj]?.name || '') : '';
          
          // Simpan state project baru
          window._limbahState = {
            proj:     selectedProj,
            projName: selectedProjName,
          };
          _writeSS(window._limbahState);
          
          // Trigger display toggle (awal/akhir visible untuk project, hidden untuk harian)
          toggleLimbahVolumeMode(key);
          
          // STEP 1: Clear form dulu
          ['date', 'awal', 'akhir', 'vol', 'cod', 'bod', 'tss', 'ph', 'notes'].forEach(f => {
            const el = document.getElementById(key + '-' + f);
            if (el) el.value = '';
          });
          
          // STEP 2: Load data limbah terakhir dari DB jika project dipilih
          if (selectedProj !== '') {
            try {
              const res = await fetch(`/api/dataentry/limbah?project_name=${encodeURIComponent(selectedProjName)}&limit=1`);
              const json = await res.json();
              
              if (json.success && json.data && json.data.length > 0) {
                const lastRecord = json.data[0];
                console.log('📥 Loaded last limbah record dari DB:', lastRecord);
                
                // Populate form dengan data terakhir dari DB
                const populate = (fieldName, dbColumnName) => {
                  const el = document.getElementById(key + '-' + fieldName);
                  let val = lastRecord[dbColumnName];
                  if (el && val !== null && val !== undefined && val !== '') {
                    if (fieldName === 'date' && val) {
                      const dateObj = new Date(val);
                      if (!isNaN(dateObj.getTime())) {
                        val = dateObj.toISOString().split('T')[0];
                      }
                    }
                    el.value = val;
                  }
                };
                
                populate('date',  'tanggal');
                populate('awal',  'awal');
                populate('akhir', 'akhir');
                populate('cod',   'cod');
                populate('bod',   'bod');
                populate('tss',   'tss');
                populate('ph',    'ph');
                populate('notes', 'notes');
                
                // ✅ RESTORE JAR TEST DATA — cari record yang punya jar data
                // (tidak harus record terakhir, karena bisa saja record terakhir tidak punya jar data)
                const jarRecord = json.data.find(r => r.jar_alum !== null || r.jar_total !== null || 
                  (r.jar_entries && r.jar_entries !== '[]' && r.jar_entries !== null));
                if (jarRecord) {
                  let jarEntriesData = [];
                  try {
                    if (Array.isArray(jarRecord.jar_entries)) jarEntriesData = jarRecord.jar_entries;
                    else if (typeof jarRecord.jar_entries === 'string' && jarRecord.jar_entries) {
                      jarEntriesData = JSON.parse(jarRecord.jar_entries);
                    }
                  } catch {}
                  window._jarTestData = {
                    saved_at: new Date().toISOString(),
                    tanggal: jarRecord.tanggal,
                    jar_alum: jarRecord.jar_alum,
                    jar_total: jarRecord.jar_total,
                    jar_entries: jarEntriesData,
                    entries: jarEntriesData,
                  };
                  console.log('🏺 Jar Test data restored dari DB:', window._jarTestData);
                  const jarStatusEl = document.getElementById('jar-status-' + key);
                  if (jarStatusEl) {
                    jarStatusEl.style.display = 'flex';
                    jarStatusEl.innerHTML = `✅ Jar: ${jarRecord.jar_alum || '—'} L/h PAC, ${jarRecord.jar_total || '—'} L/h Polimer`;
                  }
                } else {
                  window._jarTestData = null;
                  const jarStatusEl = document.getElementById('jar-status-' + key);
                  if (jarStatusEl) jarStatusEl.style.display = 'none';
                }
                
                // Hitung total volume
                calcLimbahTotal(key);
                
                // Update state dengan field data dari DB — pastikan tanggal dalam format YYYY-MM-DD
                const dbTanggal = lastRecord.tanggal;
                let stateTanggal = '';
                if (dbTanggal) {
                  const dateObj = new Date(dbTanggal);
                  if (!isNaN(dateObj.getTime())) {
                    stateTanggal = dateObj.toISOString().split('T')[0];
                  } else {
                    stateTanggal = dbTanggal;
                  }
                }
                
                window._limbahState = {
                  proj:     selectedProj,
                  projName: selectedProjName,
                  date:     stateTanggal,
                  awal:     lastRecord.awal || '',
                  akhir:    lastRecord.akhir || '',
                  vol:      lastRecord.volume || '',
                  cod:      lastRecord.cod || '',
                  bod:      lastRecord.bod || '',
                  tss:      lastRecord.tss || '',
                  ph:       lastRecord.ph || '',
                  notes:    lastRecord.notes || '',
                };
                _writeSS(window._limbahState);
                
                console.log('✅ Form di-populate dari data terakhir di DB, tanggal:', stateTanggal);
              } else {
                // Tidak ada data sebelumnya untuk project ini — set tanggal ke hari ini
                const todayDate = new Date().toISOString().split('T')[0];
                const dateEl = document.getElementById(key + '-date');
                if (dateEl) {
                  dateEl.value = todayDate;
                }
                
                window._limbahState = {
                  proj:     selectedProj,
                  projName: selectedProjName,
                  date:     todayDate,
                  awal:     '',
                  akhir:    '',
                  vol:      '',
                  cod:      '',
                  bod:      '',
                  tss:      '',
                  ph:       '',
                  notes:    '',
                };
                _writeSS(window._limbahState);
                
                console.log('ℹ️ Tidak ada data limbah sebelumnya, form reset dengan tanggal hari ini:', todayDate);
              }
            } catch (err) {
              console.error('❌ Gagal load data limbah dari DB:', err.message);
            }
          }
        };

        // saveState: tulis ke window DAN sessionStorage saja (tidak perlu localStorage)
        const saveState = () => {
          const currentProj = sel.value;
          const newSt = {
            proj:     currentProj,
            projName: currentProj !== '' ? (allProjs[+currentProj]?.name || '') : '',
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
          window._limbahState = newSt;
          _writeSS(newSt);
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
        sel.addEventListener('change', saveState);

        // ── BLOKIR _loadLastLimbahFromDB jika state sudah ada ──────────
        // Jangan auto-fill dari DB kalau user sudah punya data di form
        const hasExistingState = st.awal || st.akhir || st.vol || st.cod || st.bod || st.tss || st.ph || st.notes;
        if (!hasExistingState) {
          // Form kosong — boleh load dari DB sebagai referensi
          // tapi hanya jika projName cocok persis
          window._limbahAutoFillAllowed = true;
        } else {
          // Ada data di state → jangan auto-fill
          window._limbahAutoFillAllowed = false;
        }
      };

      // Load fresh dari API — bukan cache
      (typeof loadPJ === 'function' ? loadPJ('ongoing') : Promise.resolve(gPJ('ongoing')))
        .then(_populateLimbahDropdown)
        .catch(() => {
          // Fallback ke cache kalau API gagal
          _populateLimbahDropdown(gPJ('ongoing'));
        });
    }
  } else {
    // Non-limbah (production, utility, laboratorium): populate dropdown saja, JANGAN auto-select
    const sel = document.getElementById('dep-proj-sel-'+key);
    if (sel) {
      // Reset form & stage panel dulu agar tidak ada sisa dari sesi sebelumnya
      window._currentDEProj = null;
      const formWrap = document.getElementById('dep-form-'+key);
      if (formWrap) formWrap.innerHTML = '';
      const floatWrap = document.getElementById('dep-stage-float-'+key);
      if (floatWrap) floatWrap.innerHTML = '';
      const spacer = document.getElementById('dep-stage-spacer-'+key);
      if (spacer) spacer.style.height = '0';
      const reopen = document.getElementById('dep-stage-reopen-'+key);
      if (reopen) reopen.style.display = 'none';

      // Load fresh dari API (dengan filter role) — JANGAN pakai cache gPJ
      loadPJ('ongoing').then(allProjs => {
        const currentRole = localStorage.getItem('role') || '';
        const isAdmin = ['admin','superadmin'].includes(currentRole);
        const roleFiltered = isAdmin ? allProjs : allProjs.filter(p => {
          if (!p.allowed_roles || p.allowed_roles.length === 0) return true;
          return p.allowed_roles.includes(currentRole);
        });
        const visibleProjs = roleFiltered.filter(p => p.setPoint && Object.keys(p.setPoint).length > 0);
        sel.innerHTML = '<option value="">-- Pilih project ongoing --</option>';
        visibleProjs.forEach(p => {
          const realIdx = allProjs.indexOf(p);
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
      // TIDAK ada auto-select — user harus pilih project sendiri
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
  // ── GUARD: jangan auto-fill kalau user sudah punya data di form ──
  // Flag ini di-set oleh initDataEntryForm setelah cek state
  if (window._limbahAutoFillAllowed === false) {
    console.log('⛔ _loadLastLimbahFromDB diblokir — form sudah ada data');
    return;
  }

  try {
    const dateEl  = document.getElementById(key + '-date');
    const today   = dateEl?.value || new Date().toISOString().split('T')[0];

    const sel      = document.getElementById('limbah-proj-sel');
    const projIdx  = sel?.value ?? '';

    // Ambil projName dari map (name-based) — bukan dari gPJ cache yang bisa beda index
    const projName = projIdx !== ''
      ? ((window._limbahProjMap || {})[projIdx] || window._limbahState?.projName || null)
      : null;

    let url = `/api/dataentry/limbah?tanggal=${today}&limit=5`;
    if (projName) {
      url += `&project_name=${encodeURIComponent(projName)}`;
    }

    const res  = await fetch(url);
    const json = await res.json();
    if (!json.success || !json.data?.length) return;

    // ── FILTER KETAT: harus cocok project_name persis ──────────────
    const rows = json.data.filter(r => {
      if (projName) {
        // Hanya ambil row yang project_name-nya SAMA PERSIS
        return r.project_name === projName;
      }
      // Mode harian: hanya row tanpa project
      return r.project_name === null || r.project_name === '' || r.tipe === 'harian';
    });
    if (!rows.length) return;

    const last = rows[0];

    const fill = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val == null || val === '') return;
      if (id.endsWith('-date') || id.endsWith('-notes')) {
        // Hanya isi kalau field masih kosong (tanggal & notes tidak perlu override)
        if (el.value === '') el.value = val;
      } else {
        // Untuk field numerik: selalu update _greyFill (termasuk setelah Save/Reset)
        _greyFill(el, val);
      }
    };
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
    } else if (last.vol_m3 != null) {
      const volEl = document.getElementById(key + '-vol');
      if (volEl && volEl.value === '') { volEl.removeAttribute('readonly'); volEl.value = last.vol_m3; }
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
  let date    = g(key + '-date');
  const awal    = g(key + '-awal');
  const akhir   = g(key + '-akhir');
  const vol     = g(key + '-vol');
  const cod     = g(key + '-cod');
  const bod     = g(key + '-bod');
  const tss     = g(key + '-tss');
  const ph      = g(key + '-ph');
  const notes   = g(key + '-notes');

  // Validasi dan fix format tanggal — pastikan YYYY-MM-DD
  if (date) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      // Convert ke YYYY-MM-DD format untuk consistency
      date = dateObj.toISOString().split('T')[0];
    }
  }

  const projSel  = document.getElementById('limbah-proj-sel');
  const projIdx  = projSel?.value ?? '';

  // ── FIX 3: Ambil projName dari _limbahProjMap (name-based) ──────
  // Sebelumnya: gPJ('ongoing')[+projIdx]?.name — bisa salah kalau index cache ≠ API
  // Sekarang: pakai map yang sudah dibangun saat dropdown di-populate dari API
  let projName = null;
  if (projIdx !== '') {
    projName = (window._limbahProjMap || {})[projIdx] || null;
    if (!projName) {
      // Fallback — ambil dari state kalau map belum ready
      projName = window._limbahState?.projName || null;
    }
    if (!projName) {
      showDESt(key, 'error', '❌ Project tidak valid — coba reload halaman lalu pilih project lagi.');
      return;
    }
  }

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
  
  // Izinkan submit kalau ada jar test data meski field lain kosong
  const hasJarData = !!(window._jarTestData?.jar_alum || window._jarTestData?.jar_total ||
                        (window._jarTestData?.entries || []).length > 0);

  if (!hasData && !hasJarData) {
    showDESt(key, 'error', '⚠️ Isi minimal satu field data atau tambahkan data Jar Test terlebih dahulu!');
    return;
  }

  // SIMPAN STATE sebelum submit (untuk recovery jika error)
  window._limbahState = { proj: projIdx, projName: projName || '', date, awal, akhir, vol, cod, bod, tss, ph, notes };
  try { sessionStorage.setItem('limbah_form_state', JSON.stringify(window._limbahState)); } catch {}

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
      jar_alum:     null,
      jar_total:    null,
    };

    // Include jar test data jika tersedia
    let jarEntries = [];
    // Coba baca dari _jarTestData (global, diset oleh submitJarTestModal)
    let _jarData = window._jarTestData || null;

    // FIX: kalau projName kosong (dropdown form limbah hanya tampil ongoing),
    // cek apakah _jarTestData punya proj_name sendiri (mis. completed project
    // yang di-link langsung dari modal jar test) dan pakai itu sebagai projName.
    let _effectiveProjName = projName;
    if (!_effectiveProjName && _jarData?.proj_name) {
      _effectiveProjName = _jarData.proj_name;
      // Juga update body agar data tersimpan ke project yang benar di DB
      body.project_name = _effectiveProjName;
      body.tipe = 'project';
    }

    // Juga coba dari _jarByProj dengan key project name (lebih spesifik)
    if (_effectiveProjName) {
      const _jKey = 'jartest__' + _effectiveProjName;
      const _jFromProj = (window._jarByProj||{})[_jKey] || null;
      const _jFromLS = (() => { try { return JSON.parse(localStorage.getItem(_jKey)||'null'); } catch { return null; } })();
      _jarData = _jFromProj || _jFromLS || _jarData;
    } else {
      // Mode harian — baca dari key harian
      const _jFromHarian = (window._jarByProj||{})['jartest__harian'] || null;
      const _jFromLS = (() => { try { return JSON.parse(localStorage.getItem('jartest__harian')||'null'); } catch { return null; } })();
      _jarData = _jarData || _jFromHarian || _jFromLS;
    }

    if (_jarData) {
      body.jar_alum  = _jarData.jar_alum  || null;
      body.jar_total = _jarData.jar_total || null;
      jarEntries     = _jarData.jar_entries || _jarData.entries || [];
      console.log('📦 Jar Test data included:', { jar_alum: body.jar_alum, jar_total: body.jar_total, entries: jarEntries.length });
    } else {
      console.log('⚠️  No jar test data available');
    }
    body.jar_entries = jarEntries;

    // ✅ FIX: pilih endpoint sesuai mode.
    // Pakai _effectiveProjName (bisa dari dropdown ATAU dari _jarTestData.proj_name)
    // supaya completed project yang di-link via modal jar test juga ke endpoint yang benar.
    const apiUrl = _effectiveProjName
      ? '/api/dataentry/limbah'
      : '/api/dataentry/limbah-harian';

    console.log('📤 Sending to ' + apiUrl + ':', body);

    const fetchRes = await fetch(apiUrl, {
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
      ? `✅ Data limbah berhasil disimpan!`
      : `✅ Data limbah berhasil disimpan!`;
    
    showDESt(key, 'success', successMsg);
    console.log('✅ Submit limbah SUKSES, ID:', json.id);

    // Setelah sukses: hapus sessionStorage
    try { sessionStorage.removeItem('limbah_form_state'); } catch {}
    window._limbahState = {};
    window._limbahAutoFillAllowed = true;

    // ✅ Refill field dengan abu agar user bisa langsung klik untuk ubah
    const fieldsToRefill = ['awal','akhir','cod','bod','tss','ph'];
    fieldsToRefill.forEach(f => {
      const el = document.getElementById(key + '-' + f);
      if (el && el.value !== '') {
        el.dataset.prevValue = el.value;
        el.style.color = '#999';
      }
    });
    
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
// ═══════════════════════════════════════════════════════════════
// JAR TEST MODAL — PAC & Polimer dosing input
// openJarTestModal, closeJarTestModal, submitJarTestModal
// → Sudah ada di data-entry.js, dihapus dari sini agar tidak override


// ═══════════════════════════════════════════════════════════════
// JAR TEST BUTTON INJECTOR
// Inject tombol "🧪 Jar Test" ke form limbah setelah DOM ready
// ═══════════════════════════════════════════════════════════════
function injectJarTestButton(key) {
  // Cek apakah tombol sudah ada
  if (document.getElementById('jar-test-btn-' + key)) return;

  // Cari container yang tepat — setelah field notes atau sebelum submit
  const notesEl = document.getElementById(key + '-notes');
  if (!notesEl) return;

  // Buat wrapper jar test
  const jarWrap = document.createElement('div');
  jarWrap.style.cssText = 'margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
  jarWrap.innerHTML = `
    <button id="jar-test-btn-${key}" type="button"
      onclick="openJarTestModal('${key}')"
    </button>
    <div id="jar-status-${key}" style="display:none;font-size:11px;
      color:var(--blue,#3b82f6);font-weight:600;padding:6px 10px;
      background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;"></div>
  `;

  // Insert setelah parent dari notesEl
  const notesParent = notesEl.closest('.de-field') || notesEl.parentElement;
  if (notesParent?.parentElement) {
    notesParent.parentElement.insertBefore(jarWrap, notesParent.nextSibling);
  }

  // Restore badge kalau ada data jar
  if (window._jarTestData) {
    const jarStatusEl = document.getElementById('jar-status-' + key);
    if (jarStatusEl) {
      jarStatusEl.style.display = 'flex';
      jarStatusEl.innerHTML = `✅ Jar: ${window._jarTestData.jar_alum ?? '—'} L/h PAC, ${window._jarTestData.jar_total ?? '—'} L/h Polimer`;
    }
  }
}
window.injectJarTestButton = injectJarTestButton;

// Auto-inject saat halaman limbah dimuat
document.addEventListener('DOMContentLoaded', () => {
  // Observer untuk inject tombol saat form limbah muncul di DOM
  const observer = new MutationObserver(() => {
    const notesEl = document.getElementById('limbah-notes');
    if (notesEl && !document.getElementById('jar-test-btn-limbah')) {
      injectJarTestButton('limbah');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
// ═══════════════════════════════════════════════════════════════
// MODAL OPEN → BLUR FIXED ELEMENTS
// Blur semua elemen fixed/sticky di luar modal saat modal terbuka.
// ═══════════════════════════════════════════════════════════════
(function watchModalsAndBlurFixed() {
  let _blurred = [];

  function _isAnyModalOpen() {
    // sp-overlay pakai inline style display:flex
    const spOpen = !!document.querySelector('.proj-modal-overlay[id^="sp-overlay-"][style*="flex"]');
    // summ-overlay pakai class .show
    const summOpen = !!document.querySelector('[id^="summ-overlay-"].show, [id^="summ-drawer-"].show');
    // modal lain
    const otherOpen = !!document.querySelector(
      '.proj-modal-overlay[id^="pmo-"][style*="flex"],' +
      '.proj-modal-overlay[id^="edit-overlay-"][style*="flex"],' +
      '#extraction-modal-overlay[style*="flex"],' +
      '#cip-modal-overlay[style*="flex"],' +
      '[id^="upd-overlay-"].show,' +
      '[id^="pdo-"].show'
    );
    return spOpen || summOpen || otherOpen;
  }

  function _getModalContainers() {
    return [
      ...document.querySelectorAll('.proj-modal-overlay, .proj-modal, #extraction-modal, #cip-modal, [id^="summ-drawer-"], [id^="pdd-"]')
    ];
  }

  function _applyBlur() {
    if (_blurred.length) return;
    const modalEls = _getModalContainers();

    document.querySelectorAll('*').forEach(el => {
      // Skip kalau el ini adalah/dalam modal
      if (modalEls.some(m => m === el || m.contains(el) || el.contains(m))) return;

      // Skip alert-banner-strip — elemen ini sudah dikelola manual oleh
      // openSumm()/closeSumm() di production-ops.js. Kalau ikut di-blur di sini,
      // dua mekanisme akan rebutan kontrol filter/opacity dan banner bisa
      // tersangkut blur permanen setelah modal ditutup.
      if (el.id === 'alert-banner-strip' || el.closest?.('#alert-banner-strip')) return;

      const cs = window.getComputedStyle(el);
      const isFixed   = cs.position === 'fixed';
      const isSticky  = cs.position === 'sticky';
      const isTopBar  = isFixed && parseInt(cs.top || '99') < 10;

      if (!isFixed && !isSticky) return;

      // Hanya blur elemen yang benar-benar visible
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

      _blurred.push({
        el,
        filter:        el.style.filter,
        pointerEvents: el.style.pointerEvents,
        zIndex:        el.style.zIndex,
        opacity:       el.style.opacity,
      });
      el.style.filter        = 'blur(4px)';
      el.style.pointerEvents = 'none';
    });
  }

  function _removeBlur() {
    _blurred.forEach(({ el, filter, pointerEvents, zIndex, opacity }) => {
      el.style.filter        = filter;
      el.style.pointerEvents = pointerEvents;
      el.style.zIndex        = zIndex;
      el.style.opacity       = opacity;
    });
    _blurred = [];
  }

  let _ticking = false;
  const observer = new MutationObserver(() => {
    if (_ticking) return;
    _ticking = true;
    requestAnimationFrame(() => {
      _ticking = false;
      if (_isAnyModalOpen()) {
        _applyBlur();
      } else {
        _removeBlur();
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList:       true,
      subtree:         true,
      attributes:      true,
      attributeFilter: ['style', 'class'],
    });
  });
})();