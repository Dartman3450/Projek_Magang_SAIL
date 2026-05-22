function getTankDimensionHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div>
      <div class="de-title">Change Containers Volume</div>
      <div class="de-sub">Add, edit, or delete sensors — pilih bentuk tanki (persegi atau silinder). Dashboard otomatis menyesuaikan visualisasi.</div>
    </div>
    <div class="de-date" id="tds-dt">--</div>
  </div>

  <!-- SENSOR LIST -->
  <div class="de-card" style="margin-bottom:16px">
    <div class="de-card-title" style="justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px"><span class="de-card-ico">📡</span> Daftar Sensor Aktif</div>
      <button class="de-btn de-btn-primary" style="padding:6px 16px;font-size:12px" onclick="openAddSensor()">＋ Tambah Sensor</button>
    </div>
    <div id="sensor-list-wrap"></div>
  </div>

  <!-- STATUS -->
  <div class="de-status-bar" id="tds-sb" style="display:none"><span id="tds-sm"></span></div>

  <!-- ADD / EDIT MODAL -->
  <div id="sensor-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:16px;width:520px;max-width:95vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.22)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--surface);z-index:1">
        <div style="font-size:15px;font-weight:700;color:var(--txt)" id="sensor-modal-title">Tambah Sensor Baru</div>
        <button onclick="closeSensorModal()" style="width:30px;height:30px;border-radius:7px;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-size:13px;color:var(--txt2);display:grid;place-items:center">✕</button>
      </div>
      <div style="padding:20px 22px 22px">

        <!-- ══ SHAPE + ORIENTASI SELECTOR ══ -->
        <div style="margin-bottom:18px">
          <div class="de-label" style="margin-bottom:8px">BENTUK TANKI / WADAH *</div>
          <div style="display:flex;gap:10px;margin-bottom:10px">
            <label id="shape-btn-persegi" onclick="selectShape('persegi')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;border:2px solid var(--blue);border-radius:10px;cursor:pointer;background:#ebf2fd;transition:all .18s">
              <svg width="40" height="32" viewBox="0 0 40 32">
                <rect x="4" y="4" width="32" height="24" rx="3" fill="#bfdffa" stroke="#2b7de9" stroke-width="2"/>
                <rect x="4" y="20" width="32" height="8" rx="0 0 3 3" fill="#3b9de8" opacity=".7"/>
              </svg>
              <span style="font-size:11px;font-weight:700;color:var(--blue)">Persegi / Kotak</span>
              <span style="font-size:9px;color:var(--txt3)">Panjang × Lebar × Tinggi</span>
            </label>
            <label id="shape-btn-silinder" onclick="selectShape('silinder')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s">
              <svg width="40" height="38" viewBox="0 0 40 38">
                <ellipse cx="20" cy="8" rx="14" ry="5" fill="#d8b4fe" stroke="#7c3aed" stroke-width="1.8"/>
                <rect x="6" y="8" width="28" height="22" fill="#d8b4fe" stroke="none"/>
                <rect x="6" y="22" width="28" height="8" fill="#7c3aed" opacity=".5"/>
                <ellipse cx="20" cy="30" rx="14" ry="5" fill="#7c3aed" stroke="#7c3aed" stroke-width="1.8" opacity=".8"/>
                <line x1="6" y1="8" x2="6" y2="30" stroke="#7c3aed" stroke-width="1.8"/>
                <line x1="34" y1="8" x2="34" y2="30" stroke="#7c3aed" stroke-width="1.8"/>
              </svg>
              <span style="font-size:11px;font-weight:700;color:var(--purple)">Silinder / Tabung</span>
              <span style="font-size:9px;color:var(--txt3)">Diameter × Tinggi / Panjang</span>
            </label>
          </div>
          <input type="hidden" id="sf-shape" value="persegi">

          <!-- ── ORIENTASI ── -->
          <div class="de-label" style="margin-bottom:8px;margin-top:4px">ORIENTASI TANKI *</div>
          <div style="display:flex;gap:10px">
            <label id="ori-btn-vertikal" onclick="selectOrientasi('vertikal')" style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid var(--green);border-radius:10px;cursor:pointer;background:#edfaf4;transition:all .18s">
              <svg width="28" height="38" viewBox="0 0 28 38">
                <rect x="4" y="2" width="20" height="34" rx="4" fill="#bbf7d0" stroke="#18a96a" stroke-width="1.8"/>
                <rect x="4" y="22" width="20" height="14" rx="0 0 4 4" fill="#18a96a" opacity=".6"/>
                <line x1="14" y1="6" x2="14" y2="20" stroke="#18a96a" stroke-width="1.5" stroke-dasharray="2,2"/>
                <polygon points="10,7 14,2 18,7" fill="#18a96a"/>
              </svg>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--green)">Vertikal</div>
                <div style="font-size:9px;color:var(--txt3)">Berdiri tegak, sensor di atas</div>
                <div style="font-size:9px;color:var(--txt3)" id="ori-v-hint">Tinggi = dimensi vertikal</div>
              </div>
            </label>
            <label id="ori-btn-horizontal" onclick="selectOrientasi('horizontal')" style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid var(--border);border-radius:10px;cursor:pointer;background:var(--bg);transition:all .18s">
              <svg width="38" height="28" viewBox="0 0 38 28">
                <rect x="2" y="4" width="34" height="20" rx="4" fill="#fed7aa" stroke="#e07b2a" stroke-width="1.8"/>
                <rect x="20" y="4" width="16" height="20" rx="0 4 4 0" fill="#e07b2a" opacity=".6"/>
                <line x1="6" y1="14" x2="18" y2="14" stroke="#e07b2a" stroke-width="1.5" stroke-dasharray="2,2"/>
                <polygon points="7,10 2,14 7,18" fill="#e07b2a"/>
              </svg>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange)">Horizontal</div>
                <div style="font-size:9px;color:var(--txt3)">Rebah/tidur, sensor di atas</div>
                <div style="font-size:9px;color:var(--txt3)" id="ori-h-hint">Tinggi = diameter/lebar vertikal</div>
              </div>
            </label>
          </div>
          <input type="hidden" id="sf-orientasi" value="vertikal">

          <!-- Info box orientasi — dinamis -->
          <div id="orientasi-info" style="margin-top:8px;padding:9px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:11px;color:#92400e;line-height:1.6;display:none"></div>
        </div>

        <!-- Preview mini tank (dynamic shape) -->
        <div style="display:flex;justify-content:center;margin-bottom:20px">
          <div style="text-align:center">
            <div id="modal-tank-preview-wrap" style="margin:0 auto 6px;position:relative">
              <!-- Rendered dynamically by previewModalTank() -->
            </div>
            <div style="font-size:10px;color:var(--txt3)" id="modal-tank-vol-label">1.000 L</div>
          </div>
        </div>

        <div class="de-grid">
          <div class="de-field de-full">
            <label class="de-label">NAMA SENSOR / KOLAM *</label>
            <input class="de-input" type="text" id="sf-name" placeholder="Contoh: Kolam Utama, Tangki A...">
          </div>
          <div class="de-field">
            <label class="de-label">KUNCI DATA API *</label>
            <input class="de-input" type="text" id="sf-key" placeholder="s1, s2, s3 ...">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px">Field key dari ESP (data dalam cm: s1_cm / s2_cm)</div>
          </div>
          <div class="de-field">
            <label class="de-label">LOKASI</label>
            <input class="de-input" type="text" id="sf-loc" placeholder="Lantai 1, Area A...">
          </div>

          <!-- Persegi fields -->
          <div class="de-field sf-persegi-field">
            <label class="de-label" style="color:var(--blue)">PANJANG <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-p" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
          </div>
          <div class="de-field sf-persegi-field">
            <label class="de-label" style="color:var(--green)">LEBAR <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-l" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
          </div>

          <!-- Silinder fields -->
          <div class="de-field sf-silinder-field" style="display:none">
            <label class="de-label" style="color:var(--purple)">DIAMETER <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-d" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
            <div style="font-size:9px;color:var(--txt3);margin-top:3px" id="sf-d-hint">Diameter lingkaran silinder</div>
          </div>
          <div class="de-field sf-silinder-field sf-silinder-horiz-field" style="display:none">
            <label class="de-label" style="color:var(--orange)">PANJANG SILINDER <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-psilinder" min="0.1" step="0.1" value="2" oninput="previewModalTank()">
            <div style="font-size:9px;color:var(--txt3);margin-top:3px">Panjang sumbu tangki horizontal</div>
          </div>

          <!-- Shared: Tinggi -->
          <div class="de-field">
            <label class="de-label" style="color:var(--orange)">TINGGI TANKI <span class="de-unit">(m)</span></label>
            <input class="de-input" type="number" id="sf-t" min="0.1" step="0.1" value="1" oninput="previewModalTank()">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px" id="sf-t-hint">Tinggi vertikal tanki = air 100%</div>
          </div>

          <!-- Sensor Zero Point -->
          <div class="de-field">
            <label class="de-label" style="color:var(--blue)">TITIK NOL SENSOR <span class="de-unit">(cm)</span></label>
            <input class="de-input" type="number" id="sf-zero" min="0" step="0.5" value="0" oninput="previewModalTank()">
            <div style="font-size:10px;color:var(--txt3);margin-top:3px">Jarak sensor saat air <strong>PENUH 100%</strong> (biasanya 0–5 cm). Default: 0</div>
          </div>

          <div class="de-field de-full">
            <label class="de-label">CATATAN</label>
            <textarea class="de-input de-textarea" id="sf-note" placeholder="Keterangan tambahan..." style="min-height:60px"></textarea>
          </div>
          <!-- Batas peringatan per tanki -->
          <div class="de-field" style="grid-column:1/-1;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <label class="de-label" style="margin-bottom:8px;display:block">⚠️ BATAS PERINGATAN TANKI INI</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label style="font-size:9px;font-weight:700;color:var(--yellow);letter-spacing:1px">WARNING (%)</label>
                <input class="de-input" type="number" id="sf-warn" min="0" max="100" step="1" value="40" style="margin-top:4px">
                <div style="font-size:9px;color:var(--txt3);margin-top:2px">Alert kuning</div>
              </div>
              <div>
                <label style="font-size:9px;font-weight:700;color:var(--red);letter-spacing:1px">DANGER (%)</label>
                <input class="de-input" type="number" id="sf-crit" min="0" max="100" step="1" value="15" style="margin-top:4px">
                <div style="font-size:9px;color:var(--txt3);margin-top:2px">Alert merah</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Volume preview in modal -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
          <div><div style="font-size:9px;color:var(--txt3)">Volume</div><div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--blue)" id="modal-m3">— m³</div></div>
          <div><div style="font-size:9px;color:var(--txt3)">Kapasitas</div><div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--green)" id="modal-liter">— L</div></div>
          <div><div style="font-size:9px;color:var(--txt3)">Bentuk</div><div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:var(--orange)" id="modal-dim">—</div></div>
        </div>

        <div class="de-actions">
          <button class="de-btn de-btn-ghost" onclick="closeSensorModal()">Batal</button>
          <button class="de-btn de-btn-primary" onclick="saveSensor()">💾 Simpan Sensor</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

function selectShape(shape) {
  document.getElementById('sf-shape').value = shape;
  const btnP = document.getElementById('shape-btn-persegi');
  const btnS = document.getElementById('shape-btn-silinder');
  if (shape === 'silinder') {
    btnP.style.cssText = btnP.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--border);background:var(--bg);';
    btnS.style.cssText = btnS.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--purple);background:#f3f0ff;';
    document.querySelectorAll('.sf-persegi-field').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.sf-silinder-field').forEach(el => el.style.display = '');
  } else {
    btnP.style.cssText = btnP.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--blue);background:#ebf2fd;';
    btnS.style.cssText = btnS.style.cssText.replace(/border:[^;]+/, '').replace(/background:[^;]+/, '') + ';border:2px solid var(--border);background:var(--bg);';
    document.querySelectorAll('.sf-persegi-field').forEach(el => el.style.display = '');
    document.querySelectorAll('.sf-silinder-field').forEach(el => el.style.display = 'none');
  }
  // Re-apply orientasi to update field visibility based on new shape
  const ori = document.getElementById('sf-orientasi')?.value || 'vertikal';
  selectOrientasi(ori, true); // true = skip setvalue (already set)
  previewModalTank();
}

function selectOrientasi(ori, skipSet) {
  if (!skipSet) document.getElementById('sf-orientasi').value = ori;
  const shape = document.getElementById('sf-shape')?.value || 'persegi';
  const btnV  = document.getElementById('ori-btn-vertikal');
  const btnH  = document.getElementById('ori-btn-horizontal');
  const infoBox = document.getElementById('orientasi-info');

  if (btnV) btnV.style.cssText = btnV.style.cssText.replace(/border:[^;]+/,'').replace(/background:[^;]+/,'') +
    (ori==='vertikal' ? ';border:2px solid var(--green);background:#edfaf4;' : ';border:2px solid var(--border);background:var(--bg);');
  if (btnH) btnH.style.cssText = btnH.style.cssText.replace(/border:[^;]+/,'').replace(/background:[^;]+/,'') +
    (ori==='horizontal' ? ';border:2px solid var(--orange);background:#fff7ed;' : ';border:2px solid var(--border);background:var(--bg);');

  // Show/hide panjang silinder field (only for silinder horizontal)
  document.querySelectorAll('.sf-silinder-horiz-field').forEach(el => {
    el.style.display = (shape === 'silinder' && ori === 'horizontal') ? '' : 'none';
  });

  // Update tinggi label & hint based on shape+orientasi
  const tLabel = document.getElementById('sf-t-label');
  const tHint  = document.getElementById('sf-t-hint');
  if (shape === 'silinder' && ori === 'horizontal') {
    if (tLabel) tLabel.innerHTML = 'DIAMETER SILINDER <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi vertikal tangki rebah (= diameter penampang)';
  } else if (shape === 'silinder') {
    if (tLabel) tLabel.innerHTML = 'TINGGI SILINDER <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi silinder berdiri = air 100%';
  } else if (ori === 'horizontal') {
    if (tLabel) tLabel.innerHTML = 'TINGGI VERTIKAL <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Sisi tegak tangki rebah (sensor ukur ini)';
  } else {
    if (tLabel) tLabel.innerHTML = 'TINGGI TANKI <span class="de-unit">(m)</span>';
    if (tHint)  tHint.textContent = 'Tinggi vertikal tanki = air 100%';
  }

  // Info box
  if (infoBox) {
    if (ori === 'horizontal') {
      if (shape === 'silinder') {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `⚠️ <strong>Silinder Horizontal</strong> — Tangki rebah, sensor di atas mengukur <strong>tinggi air</strong> di penampang silinder (= berapa cm diameter yang terisi dari bawah). Volume dihitung dengan rumus <em>segmen lingkaran</em> (non-linear). 50% diameter terisi ≈ 50% volume, tapi 25% diameter terisi ≈ hanya ~9% volume. Persentase yang ditampilkan adalah <strong>volume aktual</strong>. Tampilan dashboard menunjukkan tangki rebah ↔ dengan air mengisi dari bawah.`;
      } else {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `ℹ️ <strong>Persegi Horizontal</strong> — Tangki rebah, sensor di atas mengukur <strong>tinggi air vertikal</strong>. Ketika air turun, yang berkurang adalah <strong>tinggi air</strong> (dimensi vertikal = field "Tinggi Vertikal"). Volume = Panjang × Lebar × tinggi_air. Perhitungan linear.`;
      }
    } else {
      infoBox.style.display = 'none';
    }
  }
  previewModalTank();
}

function initTankDimensionSetting() {
  if (window._tdsClock) clearInterval(window._tdsClock);
  window._tdsClock = setInterval(() => {
    const el = document.getElementById('tds-dt');
    if (!el) { clearInterval(window._tdsClock); return; }
    el.textContent = new Date().toLocaleString('id-ID');
  }, 1000);
  
  // Start syncing sensor settings dari database (shared across all accounts)
  if (typeof startSensorSettingsSync === 'function') {
    startSensorSettingsSync();
  }
  
  renderSensorList();
}

// ── Render sensor list in settings page ──────────────────
function renderSensorList() {
  const wrap = document.getElementById('sensor-list-wrap');
  if (!wrap) return;
  const sensors = getSensors();
  if (!sensors.length) {
    wrap.innerHTML = '<div class="de-empty">Belum ada sensor.</div>';
    return;
  }
  const fixed9 = sensors.slice(0, 9);
  const extras  = sensors.slice(9);

  const renderItem = (s, i) => {
    const col     = SENSOR_COLORS[i % SENSOR_COLORS.length];
    const shape   = s.shape || 'persegi';
    const liter   = Math.round(calcMaxVolumeLiter(s));
    const orientasi  = s.orientasi || 'vertikal';
    const oriIcon    = orientasi === 'horizontal' ? '↔' : '↕';
    const shapeIcon  = shape === 'silinder' ? '⬤' : '▬';
    const isFixed    = !!(s.fixedId);
    let dimStr;
    if (shape === 'silinder') {
      dimStr = orientasi === 'horizontal'
        ? `⌀${s.tinggi||1}m × L${s.panjang||2}m ↔`
        : `⌀${s.diameter||1}m × ${s.tinggi||1}m tinggi`;
    } else {
      dimStr = orientasi === 'horizontal'
        ? `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m ↔`
        : `${s.panjang||1}m × ${s.lebar||1}m × ${s.tinggi||1}m`;
    }

    let miniTank;
    if (shape === 'silinder') {
      miniTank = `
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <svg width="32" height="7" viewBox="0 0 32 7"><ellipse cx="16" cy="3.5" rx="14" ry="3.5" fill="var(--surface)" stroke="${col.label}" stroke-width="1.5"/></svg>
          <div style="width:32px;height:36px;border-left:1.5px solid ${col.label};border-right:1.5px solid ${col.label};position:relative;overflow:hidden;background:var(--surface)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:${col.water}"></div>
          </div>
          <svg width="32" height="7" viewBox="0 0 32 7"><ellipse cx="16" cy="3.5" rx="14" ry="3.5" fill="${col.label}" stroke="${col.label}" stroke-width="1.5" opacity=".8"/></svg>
        </div>`;
    } else {
      miniTank = `
        <div style="width:32px;height:44px;border:1.5px solid ${col.label};border-radius:3px 3px 5px 5px;position:relative;overflow:hidden;flex-shrink:0;background:var(--surface)">
          <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:${col.water}"></div>
        </div>`;
    }

    return `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg);border-left:4px solid ${col.label}">
      ${miniTank}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:600;color:var(--txt)">${s.name}</span>
          ${isFixed ? `<span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:100px;background:#f0fdf4;color:#15803d;border:1px solid #86efac">📌 Posisi Tetap</span>` : ''}
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${shape==='silinder'?'#f3f0ff':'#ebf2fd'};color:${shape==='silinder'?'var(--purple)':'var(--blue)'};">${shapeIcon} ${shape.charAt(0).toUpperCase()+shape.slice(1)}</span>
          <span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:100px;background:${orientasi==='horizontal'?'#fff7ed':'#f0fdf4'};color:${orientasi==='horizontal'?'var(--orange)':'var(--green)'};">${oriIcon} ${orientasi.charAt(0).toUpperCase()+orientasi.slice(1)}</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:3px">
          <span style="font-size:10px;color:var(--txt3)">🔑 Key: <strong style="color:${col.label}">${s.key}</strong></span>
          <span style="font-size:10px;color:var(--txt3)">📐 ${dimStr}</span>
          <span style="font-size:10px;color:var(--txt3)">💧 ${liter.toLocaleString('id-ID')} L</span>
          <span style="font-size:10px;color:var(--blue)">📡 Zero: <strong>${s.sensorZeroCm ?? 0}cm</strong> = 100%</span>
          ${s.loc ? `<span style="font-size:10px;color:var(--txt3)">📍 ${s.loc}</span>` : ''}
        </div>
        ${s.note ? `<div style="font-size:10px;color:var(--txt3);margin-top:2px;font-style:italic">${s.note}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="openEditSensor(${i})" style="padding:5px 10px;background:#ebf2fd;border:1px solid #c3d9fa;border-radius:7px;color:var(--blue);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">✏️ Edit</button>
        ${isFixed
          ? `<button disabled title="Tangki posisi tetap tidak bisa dihapus" style="padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--txt3);font-size:11px;cursor:not-allowed;font-family:inherit">🔒</button>`
          : (sensors.length > 1
              ? `<button onclick="deleteSensor(${i})" style="padding:5px 10px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;color:var(--red);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">🗑</button>`
              : `<button disabled style="padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--txt3);font-size:11px;cursor:not-allowed;font-family:inherit" title="Minimal 1 sensor">🗑</button>`)
        }
      </div>
    </div>`;
  };

  // Render: fixed 9 dulu (dengan header), lalu extras
  let html = `<div style="font-size:8px;font-weight:700;color:var(--txt3);letter-spacing:1.2px;margin-bottom:8px;padding:4px 0;border-bottom:1px solid var(--border)">📌 TANGKI POSISI TETAP (${fixed9.length})</div>`;
  html += fixed9.map((s, i) => renderItem(s, i)).join('');
  if (extras.length) {
    html += `<div style="font-size:8px;font-weight:700;color:var(--txt3);letter-spacing:1.2px;margin:14px 0 8px;padding:4px 0;border-bottom:1px solid var(--border)">➕ TANGKI TAMBAHAN (${extras.length})</div>`;
    html += extras.map((s, i) => renderItem(s, 9 + i)).join('');
  }
  wrap.innerHTML = html;
}

// ── Modal helpers ─────────────────────────────────────────
let _editIdx = -1;

function openAddSensor() {
  _editIdx = -1;
  document.getElementById('sensor-modal-title').textContent = '➕ Tambah Sensor Baru';
  ['sf-name','sf-key','sf-loc','sf-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('sf-p').value = 1;
  document.getElementById('sf-l').value = 1;
  document.getElementById('sf-d').value = 1;
  document.getElementById('sf-t').value = 1;
  const zf=document.getElementById('sf-zero'); if(zf) zf.value=0;
  const wf=document.getElementById('sf-warn'); if(wf) wf.value=40;
  const cf=document.getElementById('sf-crit'); if(cf) cf.value=15;
  // Reset shape to persegi + orientasi to vertikal
  selectShape('persegi');
  selectOrientasi('vertikal');
  // suggest next key
  const sensors = getSensors();
  document.getElementById('sf-key').value = 's' + (sensors.length + 1);
  document.getElementById('sf-name').value = 'Sensor ' + (sensors.length + 1);
  previewModalTank();
  const ov = document.getElementById('sensor-modal-overlay');
  ov.style.display = 'flex';
}

function openEditSensor(idx) {
  _editIdx = idx;
  const s = getSensors()[idx];
  if (!s) return;
  document.getElementById('sensor-modal-title').textContent = '✏️ Edit Sensor: ' + s.name;
  document.getElementById('sf-name').value = s.name;
  document.getElementById('sf-key').value  = s.key;
  document.getElementById('sf-loc').value  = s.loc  || '';
  document.getElementById('sf-note').value = s.note || '';
  document.getElementById('sf-t').value    = s.tinggi  || 1;
  const zfe=document.getElementById('sf-zero'); if(zfe) zfe.value = s.sensorZeroCm ?? 0;
  const wfe=document.getElementById('sf-warn'); if(wfe) wfe.value = s.warnPct ?? 40;
  const cfe=document.getElementById('sf-crit'); if(cfe) cfe.value = s.critPct ?? 15;

  const shape = s.shape || 'persegi';
  const ori   = s.orientasi || 'vertikal';
  selectShape(shape);
  selectOrientasi(ori);

  if (shape === 'silinder') {
    if (ori === 'horizontal') {
      document.getElementById('sf-psilinder').value = s.panjang || 2;
    } else {
      document.getElementById('sf-d').value = s.diameter || 1;
    }
  } else {
    document.getElementById('sf-p').value = s.panjang || 1;
    document.getElementById('sf-l').value = s.lebar   || 1;
  }

  previewModalTank();
  document.getElementById('sensor-modal-overlay').style.display = 'flex';
}

function closeSensorModal() {
  document.getElementById('sensor-modal-overlay').style.display = 'none';
}

function previewModalTank() {
  const shape   = document.getElementById('sf-shape')?.value    || 'persegi';
  const ori     = document.getElementById('sf-orientasi')?.value || 'vertikal';
  const t       = +(document.getElementById('sf-t')?.value)     || 1;
  const zeroCm  = +(document.getElementById('sf-zero')?.value)  || 0;
  const setEl   = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  let m3, liter, dimText;

  if (shape === 'silinder') {
    if (ori === 'horizontal') {
      // t = diameter, panjang = sumbu silinder
      const r  = t / 2;
      const pL = +(document.getElementById('sf-psilinder')?.value) || 2;
      m3    = +(Math.PI * r * r * pL).toFixed(3);
      liter = (Math.round(m3 * 1000 / 100) * 100);
      dimText = `⌀${t}m × L${pL}m ↔`;
    } else {
      const d  = +(document.getElementById('sf-d')?.value) || 1;
      const r  = d / 2;
      m3    = +(Math.PI * r * r * t).toFixed(3);
      liter = (Math.round(m3 * 1000 / 100) * 100);
      dimText = `⌀${d}m × ${t}m`;
    }
  } else {
    const p = +(document.getElementById('sf-p')?.value) || 1;
    const l = +(document.getElementById('sf-l')?.value) || 1;
    m3    = +(p * l * t).toFixed(3);
    liter = (Math.round(m3 * 1000 / 100) * 100);
    dimText = ori === 'horizontal' ? `${p}m × ${l}m × ${t}m ↔` : `${p}m × ${l}m × ${t}m`;
  }

  setEl('modal-m3',    m3 + ' m³');
  setEl('modal-liter', liter.toLocaleString('id-ID') + ' L');
  setEl('modal-dim',   dimText);
  setEl('modal-tank-vol-label', liter.toLocaleString('id-ID') + ' L');

  // Re-draw the mini preview
  const wrap = document.getElementById('modal-tank-preview-wrap');
  if (!wrap) return;
  const pct = 50;
  const zeroPxFromTop = zeroCm > 0 ? Math.round((zeroCm / (t * 100)) * Math.max(50, Math.min(90, t*40))) : 0;
  const zeroLine = zeroCm > 0
    ? `<div style="position:absolute;top:${zeroPxFromTop}px;left:0;right:0;height:2px;background:#2b7de9;opacity:.5;z-index:1" title="Zero = 100%"></div>`
    : '';

  if (shape === 'silinder' && ori === 'horizontal') {
    // Preview tangki silinder rebah: badan horizontal, air mengisi dari bawah cross-section (height %)
    // Ketika air turun: diameter yang terisi (height) berkurang dari atas ke bawah
    const tankW = 80, tankH = Math.max(30, Math.min(54, t * 30));
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
        <div style="font-size:9px;color:var(--txt3);font-weight:600">✅ Air turun → diameter terisi (⌀) berkurang dari atas</div>
        <div style="display:flex;align-items:center;gap:0">
          <!-- Skala diameter kiri -->
          <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0;margin-right:3px">
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀100%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀50%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">⌀0%</span>
          </div>
          <svg width="14" height="${tankH}" viewBox="0 0 14 ${tankH}" style="flex-shrink:0">
            <ellipse cx="7" cy="${tankH/2}" rx="6" ry="${tankH/2-1}" fill="var(--bg)" stroke="var(--purple)" stroke-width="1.8"/>
          </svg>
          <div style="width:${tankW}px;height:${tankH}px;border-top:2px solid var(--purple);border-bottom:2px solid var(--purple);position:relative;overflow:hidden;background:var(--bg);flex-shrink:0">
            <!-- Air mengisi dari bawah (height %) → diameter terisi berkurang saat air turun -->
            <div style="position:absolute;bottom:0;left:0;width:100%;height:${pct}%;background:linear-gradient(180deg,#d8b4fe,#7c3aed);transition:.5s">
              <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
            </div>
            <div style="position:absolute;top:2px;left:4px;font-size:8px;color:rgba(124,58,237,.7);font-weight:700;pointer-events:none">↔ ⌀${t}m</div>
          </div>
          <svg width="14" height="${tankH}" viewBox="0 0 14 ${tankH}" style="flex-shrink:0">
            <ellipse cx="7" cy="${tankH/2}" rx="6" ry="${tankH/2-1}" fill="var(--purple)" stroke="var(--purple)" stroke-width="1.8" opacity=".8"/>
          </svg>
        </div>
        <div style="font-size:8px;color:var(--txt3);font-style:italic">Tampilan cross-section: air turun = area biru berkurang dari atas</div>
      </div>`;
  } else if (shape === 'silinder') {
    const tankPxH = Math.max(50, Math.min(90, t*40));
    wrap.innerHTML = `
      <svg width="56" height="10" viewBox="0 0 56 10" style="display:block;margin-bottom:-1px">
        <ellipse cx="28" cy="5" rx="26" ry="5" fill="var(--bg)" stroke="var(--purple)" stroke-width="1.8"/>
      </svg>
      <div style="width:56px;height:${tankPxH}px;border-left:2px solid var(--purple);border-right:2px solid var(--purple);border-bottom:none;position:relative;overflow:hidden;background:var(--bg)">
        ${zeroLine}
        <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#d8b4fe,#7c3aed);transition:height .5s">
          <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
        </div>
      </div>
      <svg width="56" height="10" viewBox="0 0 56 10" style="display:block;margin-top:-1px">
        <ellipse cx="28" cy="5" rx="26" ry="5" fill="var(--purple)" stroke="var(--purple)" stroke-width="1.8" opacity=".8"/>
      </svg>`;
  } else if (ori === 'horizontal') {
    // Persegi horizontal — air mengisi dari bawah (tinggi vertikal berkurang saat air turun)
    const tankW = 80, tankH = Math.max(30, Math.min(50, t * 30));
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
        <div style="font-size:9px;color:var(--txt3);font-weight:600">✅ Air turun → tinggi vertikal air berkurang</div>
        <div style="display:flex;align-items:center;gap:3px">
          <div style="display:flex;flex-direction:column;justify-content:space-between;height:${tankH}px;padding:1px 0">
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">100%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">50%</span>
            <span style="font-size:7px;color:var(--txt3);font-family:monospace">0%</span>
          </div>
          <div style="width:${tankW}px;height:${tankH}px;border:2px solid var(--orange);border-radius:4px;position:relative;overflow:hidden;background:var(--bg)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#fed7aa,#e07b2a);transition:.5s">
              <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
            </div>
            <div style="position:absolute;top:2px;left:4px;font-size:8px;color:rgba(224,123,42,.7);font-weight:700;pointer-events:none">↔ rebah</div>
          </div>
        </div>
        <div style="font-size:8px;color:var(--txt3);font-style:italic">Tinggi vertikal = ${t}m (dimensi yang diukur sensor)</div>
      </div>`;
  } else {
    const tankPxH = Math.max(50, Math.min(90, t*40));
    wrap.innerHTML = `
      <div style="width:56px;height:${tankPxH}px;border:2px solid var(--blue);border-radius:4px 4px 8px 8px;position:relative;overflow:hidden;background:var(--bg)">
        ${zeroLine}
        <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:linear-gradient(180deg,#bfdffa,#3b9de8);transition:height .5s">
          <div style="position:absolute;top:-3px;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);border-radius:50%;animation:wsurf 3s ease-in-out infinite"></div>
        </div>
      </div>`;
  }
}

function saveSensor() {
  const name  = document.getElementById('sf-name')?.value.trim();
  const key   = document.getElementById('sf-key')?.value.trim();
  const t     = +(document.getElementById('sf-t')?.value);
  const shape = document.getElementById('sf-shape')?.value || 'persegi';
  const zeroCm = +(document.getElementById('sf-zero')?.value ?? 0);

  if (!name) { showTDSSt('error', '❌ Nama sensor wajib diisi!'); return; }
  if (!key)  { showTDSSt('error', '❌ Kunci data API wajib diisi!'); return; }
  if (!t || t <= 0) { showTDSSt('error', '❌ Tinggi tanki harus lebih dari 0!'); return; }
  if (zeroCm < 0) { showTDSSt('error', `❌ Titik nol sensor tidak boleh negatif!`); return; }

  const orientasi = document.getElementById('sf-orientasi')?.value || 'vertikal';
  let sensorObj = { shape, orientasi, tinggi: t, sensorZeroCm: zeroCm };

  if (shape === 'silinder') {
    if (orientasi === 'horizontal') {
      // horizontal: sf-t = diameter, sf-psilinder = panjang sumbu
      const pSil = +(document.getElementById('sf-psilinder')?.value);
      if (!pSil || pSil <= 0) { showTDSSt('error', '❌ Panjang silinder harus lebih dari 0!'); return; }
      sensorObj.panjang = pSil; // panjang sumbu silinder rebah
    } else {
      const d = +(document.getElementById('sf-d')?.value);
      if (!d || d <= 0) { showTDSSt('error', '❌ Diameter harus lebih dari 0!'); return; }
      sensorObj.diameter = d;
    }
  } else {
    const p = +(document.getElementById('sf-p')?.value);
    const l = +(document.getElementById('sf-l')?.value);
    if (!p || !l || p <= 0 || l <= 0) { showTDSSt('error', '❌ Panjang dan lebar harus lebih dari 0!'); return; }
    sensorObj.panjang = p;
    sensorObj.lebar   = l;
  }

  const sensors = getSensors();
  const dupIdx  = sensors.findIndex(s => s.key === key);
  if (dupIdx !== -1 && dupIdx !== _editIdx) {
    showTDSSt('error', `❌ Kunci "${key}" sudah dipakai sensor lain!`); return;
  }

  sensorObj = {
    id:   _editIdx >= 0 ? sensors[_editIdx].id : 'sensor_' + Date.now(),
    name, key,
    ...sensorObj,
    warnPct: Math.max(0, Math.min(100, +(document.getElementById('sf-warn')?.value ?? 40))),
    critPct: Math.max(0, Math.min(100, +(document.getElementById('sf-crit')?.value ?? 15))),
    loc:  document.getElementById('sf-loc')?.value.trim()  || '',
    note: document.getElementById('sf-note')?.value.trim() || '',
  };

  // Pertahankan fixedId jika ini tangki posisi tetap
  if (_editIdx >= 0 && sensors[_editIdx].fixedId) {
    sensorObj.fixedId = sensors[_editIdx].fixedId;
  }

  if (_editIdx >= 0) {
    sensors[_editIdx] = sensorObj;
  } else {
    sensors.push(sensorObj);
  }

  // Simpan ke API (yang akan otomatis disinkronisasi ke semua akun)
  saveSensorsFromDashboard(sensors).then(() => {
    closeSensorModal();
    renderSensorList();
    // Re-render tank cards on dashboard if visible
    renderTankCards();
    const liter = Math.round(calcMaxVolumeLiter(sensorObj)).toLocaleString('id-ID');
    showTDSSt('success', _editIdx >= 0
      ? `✅ Sensor "${name}" diperbarui — ${liter} L — Perubahan disinkronisasi ke semua akun`
      : `✅ Sensor "${name}" ditambahkan! — Terlihat di semua akun sekarang`);
  }).catch(err => {
    console.error('Error saving sensor:', err);
    showTDSSt('error', '⚠️ Error menyimpan ke database, coba lagi');
  });
}

function deleteSensor(idx) {
  const sensors = getSensors();
  if (sensors.length <= 1) { showTDSSt('error','❌ Minimal harus ada 1 sensor!'); return; }
  const name = sensors[idx]?.name || 'Sensor ini';
  if (!confirm(`Hapus "${name}"? Sensor akan dihapus di SEMUA akun.`)) return;
  sensors.splice(idx, 1);
  
  // Simpan perubahan ke API (fire-and-forget)
  saveSensorsFromDashboard(sensors).then(() => {
    renderSensorList();
    showTDSSt('success', '✅ Sensor dihapus dari semua akun. Dashboard otomatis diperbarui.');
  }).catch(err => {
    console.error('Error deleting sensor:', err);
    showTDSSt('error', '⚠️ Error menghapus sensor dari database');
  });
}
// Make deleteSensor & openEditSensor globally accessible for innerHTML onclick
window.deleteSensor   = deleteSensor;
window.openEditSensor = openEditSensor;
// Expose project functions used inside innerHTML
window.completePJ  = completePJ;
window.openEditPJ  = openEditPJ;
window.openUpdModal= openUpdModal;
window.openSumm    = openSumm;
window.closePD     = closePD;
window.delPJ       = delPJ;
window.openSP      = openSP;
window.closeSP     = closeSP;
window.saveSP      = saveSP;