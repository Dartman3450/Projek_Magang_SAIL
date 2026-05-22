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

    // Fetch dari API dulu supaya project list selalu fresh
    const projSel = document.getElementById('util-project-cat-' + key);
    if (projSel) {
      projSel.innerHTML = '<option value="">⏳ Memuat project...</option>';
      projSel.disabled = true;

      loadPJ('ongoing').then(allProjs => {
        const currentRole = localStorage.getItem('role') || 'utility';
        const isAdmin     = ['admin','superadmin'].includes(currentRole);
        const projs = isAdmin ? allProjs : allProjs.filter(p => {
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
        projSel.disabled = false;
        if (projs.length === 0) {
          projSel.innerHTML = '<option value="">-- Belum ada project tersedia --</option>';
        }
        // Render jika sebelumnya sudah ada project yang dipilih
        if (projSel.value !== '') utilRenderProject(key, projSel.value);
      }).catch(() => {
        projSel.innerHTML = '<option value="">-- Gagal memuat project --</option>';
        projSel.disabled = false;
      });
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

async function utilSaveHarian(uid, cat) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Utility Harian ini?')) return;

  const b = document.getElementById('util-'+uid+'-sb');
  const m = document.getElementById('util-'+uid+'-sm');
  const showSt = (type, msg) => {
    if(b&&m){ b.style.display='flex'; b.className='de-status-bar de-status-'+type; m.textContent=msg; }
  };

  showSt('loading','⏳ Menyimpan...');

  // Kumpulkan semua nilai dari form
  const tanggal = document.getElementById('util-'+uid+'-date')?.value || new Date().toISOString().split('T')[0];
  const awal    = document.getElementById('util-'+uid+'-awal')?.value  || '';
  const akhir   = document.getElementById('util-'+uid+'-akhir')?.value || '';
  const total   = document.getElementById('util-'+uid+'-total')?.value || '';
  const notes   = document.getElementById('util-'+uid+'-notes')?.value || '';

  // Tentukan jenis kategori dari uid (air_baku, air_proses, solar, listrik, dll)
  const catKey = uid.replace('utility_', '');

  const payload = {
    tanggal,
    kategori:  catKey,
    label:     cat,
    awal:      parseFloat(awal)  || null,
    akhir:     parseFloat(akhir) || null,
    total:     parseFloat(total) || null,
    notes:     notes || null,
    tipe:      'harian',
  };

  try {
    const res  = await fetch('/api/dataentry/utility', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || json.message || 'Gagal simpan');

    showSt('success', '✅ Data ' + cat + ' tersimpan ke database!');
    setTimeout(() => { if(b) b.style.display='none'; }, 3000);
  } catch(err) {
    console.error('utilSaveHarian error:', err);
    showSt('error', '❌ Gagal: ' + err.message);
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
async function utilRenderProject(key, idx) {
  const area = document.getElementById('util-form-area-'+key);
  if (!area) return;
  if (idx === '') { area.innerHTML = ''; return; }
  const proj = gPJ('ongoing')[+idx];
  if (!proj) { area.innerHTML = ''; return; }
  const uid = key + '_proj_' + idx;

  // Tampilkan loading dulu
  area.innerHTML = `<div style="padding:40px;text-align:center;color:var(--txt3)">⏳ Memuat data utility...</div>`;

  // Fetch data terbaru dari DB
  let prevData = {};
  try {
    const res  = await fetch('/api/dataentry/utility?project_name=' + encodeURIComponent(proj.name) + '&limit=1');
    const json = await res.json();
    if (json.success && json.data?.length) {
      const row = json.data[0];
      // Map DB columns ke prevData format yang dipakai form
      prevData = {
        b1: row.b1_steam_press, b2: row.b2_fg_temp, b3: row.b3_fw_temp,
        b4: row.b4_scale_temp, b5: row.b5_overheat_temp, b6: row.b6_next_blowdown,
        b7: row.b7_conductivity, b8: row.b8_air_press, b9: row.b9_ignition_count,
        b10: row.b10_oil_lfire_time, b11: row.b11_oil_hfire_time,
        b12: row.b12_flue_lfire_temp, b13: row.b13_flue_hfire_temp,
        b14: row.b14_fw_avg_temp, b15: row.b15_oil_efficiency,
        b16: row.b16_oil_fuel_cons, b17: row.b17_steam_output, b18: row.b18_surface_bd,
        c1: row.c1_set_point, c2: row.c2_water_in_temp, c3: row.c3_water_out_temp,
        c4: row.c4_cap, c5: row.c5_discharge_a, c6: row.c6_suction_a,
        c7: row.c7_discharge_b, c8: row.c8_suction_b, c9: row.c9_unit_capacity,
        c10: row.c10_cir_a_capacity, c11: row.c11_cir_b_capacity,
        notes: row.notes, cnotes: row.chiller_notes,
      };
    }
  } catch(e) {
    // Fallback ke cache lokal
    prevData = proj.utilityData?.[uid] || {};
  }

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
          <div class="de-field"><label class="de-label" style="color:#111;">Steam Press</label>${makeNumberInputWithUnit('util-'+uid+'-b1', prevData.b1, 'MPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Flue gass temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b2', prevData.b2, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Feed water temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b3', prevData.b3, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Scale monitor temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b4', prevData.b4, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Overheat sensor temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b5', prevData.b5, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">To Next Blowdown</label>${makeInputFieldWithUnit('util-'+uid+'-b6', prevData.b6, 'H')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Conductivity</label>${makeNumberInputWithUnit('util-'+uid+'-b7', prevData.b7, 'mS/m')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Air pressure</label>${makeNumberInputWithUnit('util-'+uid+'-b8', prevData.b8, 'pa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Ignition count</label>${makeNumberInputWithUnit('util-'+uid+'-b9', prevData.b9)}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil L-fire time</label>${makeInputField('util-'+uid+'-b10', prevData.b10, 'text')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil H-fire time</label>${makeInputField('util-'+uid+'-b11', prevData.b11, 'text')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Fuel Gas Temp (L-fire)</label>${makeNumberInputWithUnit('util-'+uid+'-b12', prevData.b12, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Fuel Gas Temp (H-fire)</label>${makeNumberInputWithUnit('util-'+uid+'-b13', prevData.b13, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Feed Water Avg Temperature</label>${makeNumberInputWithUnit('util-'+uid+'-b14', prevData.b14, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Oil B-Efficiency</label>${makeNumberInputWithUnit('util-'+uid+'-b15', prevData.b15, '%')}</div>
          <div class="de-field"><label class="de-label" style="color:#7e1818;background:#FFD1D1;padding:8px 12px;border-radius:6px;font-weight:600;display:inline-block;">O Fuel Consumption</label>${makeNumberInputWithUnit('util-'+uid+'-b16', prevData.b16, 'KL')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Steam output</label>${makeNumberInputWithUnit('util-'+uid+'-b17', prevData.b17, 't')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Surface blowdown</label>${makeNumberInputWithUnit('util-'+uid+'-b18', prevData.b18, 'L')}</div>
          <div class="de-field" style="grid-column: 1 / -1;"><label class="de-label" style="color:#111;">Catatan Boiler</label>${makeTextareaField('util-'+uid+'-notes', prevData.notes)}</div>
        </div>
      </div>

      <div id="util-${uid}-form-chiller" style="display:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div class="de-field"><label class="de-label" style="color:#111;">Set Point</label>${makeNumberInputWithUnit('util-'+uid+'-c1', prevData.c1 ,'°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Water in temperature</label>${makeNumberInputWithUnit('util-'+uid+'-c2', prevData.c2, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Water out temperature</label>${makeNumberInputWithUnit('util-'+uid+'-c3', prevData.c3, '°C')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">CAP</label>${makeNumberInputWithUnit('util-'+uid+'-c4', prevData.c4, '%')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Discharge Pressure A</label>${makeNumberInputWithUnit('util-'+uid+'-c5', prevData.c5,'kPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Main Suction A</label>${makeNumberInputWithUnit('util-'+uid+'-c6', prevData.c6,'kPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Discharge Pressure B</label>${makeNumberInputWithUnit('util-'+uid+'-c7', prevData.c7,'kPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Main Suction B</label>${makeNumberInputWithUnit('util-'+uid+'-c8', prevData.c8,'kPa')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Unit Total Capacity</label>${makeNumberInputWithUnit('util-'+uid+'-c9', prevData.c9,'%')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Cir A Capacity</label>${makeNumberInputWithUnit('util-'+uid+'-c10', prevData.c10,'%')}</div>
          <div class="de-field"><label class="de-label" style="color:#111;">Cir B Capacity</label>${makeNumberInputWithUnit('util-'+uid+'-c11', prevData.c11,'%')}</div>
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

async function utilSaveProject(uid, projName) {
  if (!confirm('Apakah Anda yakin ingin menyimpan data Utility Project ini?')) return;

  const projIdx = +uid.split('_').pop();
  const projs   = gPJ('ongoing');
  const proj    = projs[projIdx];
  if (!proj) return;

  const b = document.getElementById('util-'+uid+'-sb');
  const m = document.getElementById('util-'+uid+'-sm');
  const showSt = (type, msg) => {
    if(b&&m){ b.style.display='flex'; b.className='de-status-bar de-status-'+type; m.textContent=msg; }
  };
  showSt('loading','⏳ Menyimpan ke database...');

  // Kumpulkan nilai Boiler (b1-b18)
  const boilerData = {};
  for (let i = 1; i <= 18; i++) {
    const el = document.getElementById('util-'+uid+'-b'+i);
    boilerData['b' + i] = el ? (el.value || '') : '';
  }
  // Kumpulkan nilai Chiller (c1-c11)
  const chillerData = {};
  for (let i = 1; i <= 11; i++) {
    const el = document.getElementById('util-'+uid+'-c'+i);
    chillerData['c' + i] = el ? (el.value || '') : '';
  }
  boilerData.notes  = document.getElementById('util-'+uid+'-notes')?.value  || '';
  chillerData.notes = document.getElementById('util-'+uid+'-cnotes')?.value || '';

  const payload = {
    project_name: proj.name,
    tanggal:      new Date().toISOString().split('T')[0],
    tipe:         'project',
    boiler:       boilerData,
    chiller:      chillerData,
    kategori:     'boiler_chiller',
  };

  try {
    const res  = await fetch('/api/dataentry/utility', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || json.message || 'Gagal simpan');

    // Update cache lokal agar summary di completed project bisa baca
    const allProjs = gPJ('ongoing');
    const proj = allProjs[projIdx];
    if (!proj) { showSt('error', '❌ Project tidak ditemukan di cache'); return; }

    // Merge dengan data lama (jangan timpa field yang kosong di form)
    const prevStored = proj.utilityData?.[uid] || {};
    const mergedBoiler = { ...prevStored };
    const mergedChiller = { ...prevStored };
    for (let i = 1; i <= 18; i++) {
      if (boilerData['b'+i] !== '') mergedBoiler['b'+i] = boilerData['b'+i];
    }
    for (let i = 1; i <= 11; i++) {
      if (chillerData['c'+i] !== '') mergedChiller['c'+i] = chillerData['c'+i];
    }
    if (boilerData.notes  !== '') mergedBoiler.notes  = boilerData.notes;
    if (chillerData.notes !== '') mergedChiller.cnotes = chillerData.notes;

    if (!proj.utilityData) proj.utilityData = {};
    proj.utilityData[uid] = { ...prevStored, ...mergedBoiler, ...mergedChiller };

    // Build fields[] yang dibutuhkan renderSummTabContent('utility')
    const boilerLabels = {
      b1:'Steam Press (MPa)',   b2:'Flue Gas Temp (°C)',      b3:'Feed Water Temp (°C)',
      b4:'Scale Monitor (°C)',  b5:'Overheat Sensor (°C)',     b6:'To Next Blowdown (H)',
      b7:'Conductivity (mS/m)', b8:'Air Pressure (pa)',         b9:'Ignition Count',
      b10:'Oil L-fire Time',    b11:'Oil H-fire Time',          b12:'Fuel Gas Temp L-fire (°C)',
      b13:'Fuel Gas Temp H-fire (°C)', b14:'Feed Water Avg Temp (°C)', b15:'Oil B-Efficiency (%)',
      b16:'Oil Fuel Consumption (KL)', b17:'Steam Output (t)',  b18:'Surface Blowdown (L)',
    };
    const chillerLabels = {
      c1:'Chiller Set Point (°C)',  c2:'Water In Temp (°C)',    c3:'Water Out Temp (°C)',
      c4:'CAP (%)',                  c5:'Discharge Pressure A (kPa)', c6:'Main Suction A (kPa)',
      c7:'Discharge Pressure B (kPa)', c8:'Main Suction B (kPa)', c9:'Unit Total Capacity (%)',
      c10:'Cir A Capacity (%)',      c11:'Cir B Capacity (%)',
    };

    const histFields = [];
    Object.entries(boilerLabels).forEach(([k, lbl]) => {
      const newVal = boilerData[k] || '';
      const oldVal = prevStored[k] || '';
      if (newVal || oldVal) histFields.push({ label: lbl, oldVal, newVal: newVal || oldVal });
    });
    Object.entries(chillerLabels).forEach(([k, lbl]) => {
      const newVal = chillerData[k] || '';
      const oldVal = prevStored[k] || '';
      if (newVal || oldVal) histFields.push({ label: lbl, oldVal, newVal: newVal || oldVal });
    });
    // Catatan boiler & chiller
    if (boilerData.notes || prevStored.notes)
      histFields.push({ label: 'Catatan Boiler', oldVal: prevStored.notes||'', newVal: boilerData.notes || prevStored.notes || '' });
    if (chillerData.notes || prevStored.cnotes)
      histFields.push({ label: 'Catatan Chiller', oldVal: prevStored.cnotes||'', newVal: chillerData.notes || prevStored.cnotes || '' });

    if (!proj.utilityHistory) proj.utilityHistory = [];
    proj.utilityHistory.push({ saved_at: new Date().toISOString(), uid, db_id: json.id, fields: histFields });

    sPJ('ongoing', allProjs);

    showSt('success', '✅ Utility untuk "' + projName + '" tersimpan ke database!');
    setTimeout(() => { if(b) b.style.display='none'; }, 3000);
  } catch(err) {
    console.error('utilSaveProject error:', err);
    showSt('error', '❌ Gagal: ' + err.message);
  }
}
window.utilSaveProject = utilSaveProject;

