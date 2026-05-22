// ── End Production ────────────────────────────────────────
async function endProd(type, idx) {
  const ps = gPJ(type);
  const p  = ps[idx];
  if (!p) { showQuickToast('❌ Project tidak ditemukan (idx=' + idx + ')'); return; }

  // Cek dari semua kemungkinan field — cache bisa pakai nama berbeda
  const hasCIPProd = p.cipProdDone === true || p.cip_prod_done === true;
  const hasCIPLab  = p.cipLabDone  === true || p.cip_lab_done  === true;
  const hasFP      = p.fpDone      === true || p.fp_done       === true;

  if (!hasCIPProd) { showQuickToast('❌ CIP Production belum selesai! Buka Data Entry Production → CIP.'); return; }
  if (!hasCIPLab)  { showQuickToast('❌ CIP Laboratorium belum selesai! Buka Data Entry Laboratorium → CIP.'); return; }
  if (!hasFP)      { showQuickToast('❌ Finish Production belum diisi! Klik tombol Finish Prod dulu.'); return; }
  if (!confirm(`Akhiri produksi untuk "${p.name}"?\nProyek akan dipindahkan ke Completed.`)) return;
  if (p._id) {
    try {
      await fetch('/api/projects/'+p._id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'completed', completed_at: new Date().toISOString() }) });
      await loadPJ('ongoing');
      await loadPJ('completed');
    } catch(e) { console.error('endProd API error:', e); }
  } else {
    p.completed_at = new Date().toISOString();
    const comp = gPJ('completed');
    comp.unshift(p);
    sPJ('completed', comp);
    ps.splice(idx, 1);
    sPJ(type, ps);
  }
  renderPJ(type);
  showQuickToast('✅ Produksi selesai! Proyek dipindahkan ke Completed.');
}

// ── Complete project (kept for backward compat) ───────────
function completePJ(idx) {
  endProd('ongoing', idx);
}

// ── Update modal (20 fields) ──────────────────────────────
function openUpdModal(type, idx) {
  _updPJIdx = idx; _updType = type;
  const p = gPJ(type)[idx]; if(!p) return;
  document.getElementById('upd-proj-name-'+type).textContent = '📁 '+p.name;
  const entryNum = (p.updates||[]).length + 1;
  document.getElementById('upd-entry-num-'+type).textContent = entryNum;
  // Build 20 fields (10 left, 10 right)
  const grid = document.getElementById('upd-fields-'+type);
  grid.innerHTML = UPD_FIELDS.map((label, i) => `
    <div class="upd-field">
      <label class="upd-label">Untitled${i+1} — ${label}</label>
      <input class="upd-input" id="upd-f${i}-${type}" type="text" placeholder="Isi kolom ini...">
    </div>`).join('');
  document.getElementById('upd-overlay-'+type)?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeUpdModal(type) {
  document.getElementById('upd-overlay-'+type)?.classList.remove('show');
  document.body.style.overflow = '';
}
async function saveUpdEntry(type) {
  const ps   = gPJ(type);
  const proj = ps[_updPJIdx];
  if (!proj) return;
  const note = document.getElementById('upd-note-'+type)?.value.trim();
  if (!note) { showQuickToast('❌ Catatan tidak boleh kosong!'); return; }
  const entry = { note, date: new Date().toISOString() };
  if (!proj.updates) proj.updates = [];
  proj.updates.unshift(entry);
  if (proj._id) {
    try {
      await fetch('/api/projects/'+proj._id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ notes: note }) });
      await loadPJ(type);
    } catch(e) { console.error('saveUpdEntry API error:', e); }
  } else {
    sPJ(type, ps);
  }
  closeUpdEntry(type);
  renderPJ(type);
  showQuickToast('✅ Update tersimpan!');
}
function showQuickToast(msg) {
  let t = document.getElementById('_toast');
  if(!t){t=document.createElement('div');t.id='_toast';t.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:100px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;transition:opacity .3s';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._hide);t._hide=setTimeout(()=>{t.style.opacity='0';},2500);
}

// ── Summary drawer ────────────────────────────────────────
if (!window._summState) window._summState = {}; // { type: { idx, activeTab } }

function openSumm(type, idx) {
  const p = gPJ(type)[idx]; if(!p) return;
  if (!window._summState) window._summState = {};
  window._summState[type] = { idx, activeTab: 'setpoint' };

  const nmEl = document.getElementById('summ-nm-'+type);
  const dtEl = document.getElementById('summ-dt-'+type);
  const body  = document.getElementById('summ-body-'+type);
  if (!nmEl || !dtEl || !body) {
    console.warn('openSumm: DOM elements not found for type='+type);
    return;
  }

  nmEl.textContent = p.name;
  dtEl.textContent =
    '📅 '+(p.start||'—')+' → 🏁 '+(p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—');

  const tblStyle    = 'width:100%;border-collapse:collapse;font-size:12px;';
  const thStyle     = 'text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--txt3);background:var(--bg);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;';
  const tdStyle     = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--txt2);font-size:12px;vertical-align:top;';
  const tdMonoStyle = 'padding:8px 12px;border-bottom:1px solid var(--border);color:var(--blue);font-family:\'DM Mono\',monospace;font-size:11px;font-weight:600;vertical-align:top;';

  const section = (icon, title, tableHTML) => `
    <div class="summ-section">
      <div class="summ-section-title">${icon} <span>${title}</span></div>
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:4px">
        <table style="${tblStyle}">${tableHTML}</table>
      </div>
    </div>`;

  // ── 1. Project Info ───────────────────────────────────
  let html = section('📋', 'Informasi Project', `
    <thead><tr>
      <th style="${thStyle}">Field</th>
      <th style="${thStyle}">Value</th>
    </tr></thead>
    <tbody>
      <tr><td style="${tdStyle}">Nama Project</td><td style="${tdMonoStyle}">${p.name||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Mulai</td><td style="${tdStyle}">${p.start||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tanggal Selesai</td><td style="${tdStyle}">${p.completed_at ? new Date(p.completed_at).toLocaleDateString('id-ID') : p.end||'—'}</td></tr>
      <tr><td style="${tdStyle}">Materials</td><td style="${tdStyle}">${p.materials||'—'}</td></tr>
      <tr><td style="${tdStyle}">Tools</td><td style="${tdStyle}">${p.tools||'—'}</td></tr>
      <tr><td style="${tdStyle}">Notes</td><td style="${tdStyle}">${p.notes||'—'}</td></tr>
    </tbody>`);

  // ── 2. Horizontal Tab Summary (Produksi | Lab | Utility | Limbah) ──────────
  const sectionDefs = [
    { id:'produksi', icon:'🏭', label:'Produksi'  },
    { id:'lab',      icon:'🧪', label:'Lab'       },
    { id:'utility',  icon:'⚡', label:'Utility'   },
    { id:'limbah',   icon:'♻️', label:'Limbah'    },
  ];

  html += `
    <div class="summ-section" style="padding-bottom:0">
      <div class="summ-section-title" style="margin-bottom:10px">📊 <span>Data Summary</span></div>

      <!-- Tab bar -->
      <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:0;gap:0;">
        ${sectionDefs.map((s, i) => `
          <button id="summ-tab-btn-${type}-${s.id}"
            onclick="switchSummTabUI('${type}','${s.id}')"
            style="flex:1;padding:10px 8px;background:${i===0?'var(--surface)':'var(--bg)'};border:none;border-bottom:${i===0?'2px solid var(--blue)':'2px solid transparent'};
                   color:${i===0?'var(--blue)':'var(--txt3)'};font-size:12px;font-weight:700;cursor:pointer;
                   display:flex;align-items:center;justify-content:center;gap:5px;
                   transition:all .15s;white-space:nowrap;margin-bottom:-2px;"
            onmouseover="if(this.dataset.active!=='1'){this.style.color='var(--txt)';this.style.background='var(--surface)';}"
            onmouseout="if(this.dataset.active!=='1'){this.style.color='var(--txt3)';this.style.background='var(--bg)';}"
            data-active="${i===0?'1':'0'}">
            <span>${s.icon}</span><span>${s.label}</span>
          </button>`).join('')}
      </div>

      <!-- Tab panels -->
      ${sectionDefs.map((s, i) => `
        <div id="summ-sec-${type}-${s.id}"
             style="display:${i===0?'block':'none'};padding:14px 2px 8px;">
          <div style="text-align:center;color:var(--txt3);font-size:12px;padding:8px 0;">⏳ Memuat...</div>
        </div>`).join('')}
    </div>`;

  // ── 4. CIP Data ───────────────────────────────────────
  if (p.cipDone && p.cipHistory && p.cipHistory.length) {
    // Group CIP history by type (production vs laboratorium)
    const cipTypes = {};
    p.cipHistory.forEach(entry => {
      const type = entry.type || 'production';
      if (!cipTypes[type]) cipTypes[type] = [];
      cipTypes[type].push(entry);
    });

    Object.entries(cipTypes).forEach(([cipType, entries]) => {
      const typeLabel = cipType === 'laboratorium' ? '🧪 Lab CIP' : '🏭 Production CIP';
      
      // Build thead with update columns
      let thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>`;
      entries.forEach((entry, i) => {
        const dateObj = new Date(entry.saved_at);
        const dateStr = dateObj.toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'}) + ', ' + dateObj.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
        thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}</span></th>`;
      });
      thead += `</tr>`;

      // Collect all unique parameters
      const allParams = new Set();
      entries.forEach(entry => {
        if (entry.fields) {
          Object.keys(entry.fields).forEach(key => allParams.add(key));
        }
      });

      // Build tbody
      let tbody = '';
      let rowIdx = 0;
      [...allParams].sort().forEach(param => {
        const rowBg = rowIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
        let rowHtml = `<td style="${tdStyle}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${param}</td>`;
        
        entries.forEach(entry => {
          const val = entry.fields?.[param];
          if (val !== undefined && val !== '') {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${val}</td>`;
          } else {
            rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
          }
        });
        tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
        rowIdx++;
      });

      html += `
        <div class="summ-section">
          <div class="summ-section-title">🧼 <span>${typeLabel}</span></div>
          <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:4px">
            <table style="${tblStyle}">
              <thead>${thead}</thead>
              <tbody>${tbody}</tbody>
            </table>
          </div>
        </div>`;
    });
  }

  // ── 5. Finish Production ──────────────────────────────
  if (p.fpDone) {
    // Display Aroma data (fpItems1) if exists
    if (p.fpItems1 && p.fpItems1.length) {
      const aromaRows = p.fpItems1.map((item, i) => `
        <tr>
          <td style="${tdStyle}">${i+1}</td>
          <td style="${tdStyle}">${item.date||'—'}</td>
          <td style="${tdStyle}">${item.name||'—'}</td>
          <td style="${tdStyle}">${item.code||'—'}</td>
          <td style="${tdMonoStyle}">${item.berat||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">kg</span></td>
        </tr>`).join('');
      html += section('🌸', 'Finish Production - Aroma', `
        <thead><tr>
          <th style="${thStyle}">#</th>
          <th style="${thStyle}">Tanggal</th>
          <th style="${thStyle}">Nama Produk</th>
          <th style="${thStyle}">Kode</th>
          <th style="${thStyle}">Berat</th>
        </tr></thead>
        <tbody>${aromaRows}</tbody>`);
    }

    // Display Product data (fpItems2 or fpItems for backward compatibility)
    const productItems = p.fpItems2 || p.fpItems;
    if (productItems && productItems.length) {
      const fpRows = productItems.map((item, i) => `
        <tr>
          <td style="${tdStyle}">${i+1}</td>
          <td style="${tdStyle}">${item.date||'—'}</td>
          <td style="${tdStyle}">${item.name||'—'}</td>
          <td style="${tdStyle}">${item.code||'—'}</td>
          <td style="${tdMonoStyle}">${item.brix||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">°Bx</span></td>
          <td style="${tdMonoStyle}">${item.berat||'—'} <span style="font-size:10px;color:var(--txt3);font-weight:400">kg</span></td>
        </tr>`).join('');
      html += section('🏭', 'Finish Production - Product', `
        <thead><tr>
          <th style="${thStyle}">#</th>
          <th style="${thStyle}">Tanggal</th>
          <th style="${thStyle}">Nama Produk</th>
          <th style="${thStyle}">Kode</th>
          <th style="${thStyle}">Brix</th>
          <th style="${thStyle}">Berat</th>
        </tr></thead>
        <tbody>${fpRows}</tbody>`);
    }
  }

  body.innerHTML = html;

  // Render hanya tab pertama (produksi) — tab lain dimuat saat diklik
  renderSummTabContent(type, 'produksi', p);

  document.getElementById('summ-overlay-'+type)?.classList.add('show');
  document.getElementById('summ-drawer-'+type)?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ── Horizontal tab switcher ───────────────────────────────────
function switchSummTabUI(type, tabId) {
  const sectionDefs = ['produksi','lab','utility','limbah'];

  // Update tab buttons
  sectionDefs.forEach(id => {
    const btn = document.getElementById('summ-tab-btn-'+type+'-'+id);
    if (!btn) return;
    const active = id === tabId;
    btn.style.color      = active ? 'var(--blue)' : 'var(--txt3)';
    btn.style.background = active ? 'var(--surface)' : 'var(--bg)';
    btn.style.borderBottom = active ? '2px solid var(--blue)' : '2px solid transparent';
    btn.dataset.active   = active ? '1' : '0';
  });

  // Show/hide panels
  sectionDefs.forEach(id => {
    const panel = document.getElementById('summ-sec-'+type+'-'+id);
    if (panel) panel.style.display = id === tabId ? 'block' : 'none';
  });

  // Render content if not yet loaded
  const panel = document.getElementById('summ-sec-'+type+'-'+tabId);
  const alreadyLoaded = panel && !panel.innerHTML.includes('⏳');
  if (!alreadyLoaded) {
    const st = window._summState?.[type];
    if (st) {
      const p = gPJ(type)[st.idx];
      if (p) renderSummTabContent(type, tabId, p);
    }
  }
}
window.switchSummTabUI = switchSummTabUI;

// ── Tab switcher (kept for backward compat) ───────────────
function switchSummTab(type, tabId) {
  const st = window._summState[type]; if(!st) return;
  st.activeTab = tabId;
  const p = gPJ(type)[st.idx]; if(!p) return;
  renderSummTabContent(type, tabId, p);
}
window.switchSummTab = switchSummTab;

// ── Tab content renderer ──────────────────────────────────
function renderSummTabContent(type, tabId, p) {
  const wrap = document.getElementById('summ-sec-'+type+'-'+tabId);
  if (!wrap) return;

  // Base Styles yang lebih compact/rapat
  const tblStyle = 'width:100%;border-collapse:collapse;font-size:11px;';
  const thStyle  = 'padding:6px 10px;font-size:9px;font-weight:700;color:var(--txt3);background:var(--bg);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;';
  const tdLabel  = 'padding:6px 10px;border-bottom:1px solid var(--border);color:var(--txt2);font-size:11px;vertical-align:middle;white-space:nowrap;';
  
  const emptyMsg = (msg) => `<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px;background:var(--bg);border-radius:8px;border:1px dashed var(--border)">${msg}</div>`;

  const tableHeaderUI = (title) => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">${title}</div>
      <div style="font-size:9px;color:var(--blue);background:#ebf2fd;padding:3px 8px;border-radius:4px;font-weight:600">↔ Geser kanan untuk melihat update</div>
    </div>`;

  // ─── PRODUKSI (includes Set Point) ────────────────────
  if (tabId === 'produksi') {
    wrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px">⏳ Memuat data produksi...</div>';

    (async () => {
      try {
        // Mapping SP_FIELDS id → kolom di de_production_history
        // (SP_FIELDS pakai dash, DB pakai underscore dengan nama berbeda)
        const SP_TO_DB = {
          // PAGE 1
          'sp-slurry':          'sp_slurry',
          'sp-hopper':          'sp_hopper',
          'sp-density':         'sp_density',
          'sp-feed':            'sp_feed',
          'sp-aroma':           'sp_aroma',
          'sp-steam':           'sp_steam',
          'sp-prod-out':        'sp_prod_out',
          'sp-cond1':           'sp_cond1',
          'sp-cond2':           'sp_cond2',
          'sp-ext':             'sp_ext',
          'sp-int':             'sp_int',
          'sp-cond-rate':       'sp_cond_rate',
          'sp-offset':          'sp_offset',
          'sp-chilled':         'sp_chill',
          'sp-condenser-water': 'sp_cond_water',
          'sp-system-vacuum':   'sp_vacuum',
          'sp-steam-flow':      'sp_press_steam',
          // PAGE 2
          'sp-temp-feed':       'sp_temp_feed',
          'sp-temp-heater':     'sp_temp_heater',
          'sp-temp-top':        'sp_temp_top',
          'sp-Condensate1':     'sp_cond1',
          'sp-Condensate2':     'sp_cond2',
          'sp-temp-bot':        'sp_temp_bot',
          // sp-add1~8: belum ada kolom DB → null (hanya tampil di SP Awal)
          'sp-add1': null, 'sp-add2': null, 'sp-add3': null, 'sp-add4': null,
          'sp-add5': null, 'sp-add6': null, 'sp-add7': null, 'sp-add8': null,
        };
        // Mapping SP Awal dari set_point project (keys bisa pakai dash atau underscore)
        const SP_AWAL_MAP = {
          'sp-slurry':          ['sp-slurry','sp_slurry'],
          'sp-hopper':          ['sp-hopper','sp_hopper'],
          'sp-density':         ['sp-density','sp_density'],
          'sp-feed':            ['sp-feed','sp_feed'],
          'sp-aroma':           ['sp-aroma','sp_aroma'],
          'sp-steam':           ['sp-steam','sp_steam'],
          'sp-prod-out':        ['sp-prod-out','sp_prod_out'],
          'sp-cond1':           ['sp-cond1','sp_cond1'],
          'sp-cond2':           ['sp-cond2','sp_cond2'],
          'sp-ext':             ['sp-ext','sp_ext'],
          'sp-int':             ['sp-int','sp_int'],
          'sp-cond-rate':       ['sp-cond-rate','sp_cond_rate'],
          'sp-offset':          ['sp-offset','sp_offset'],
          'sp-chilled':         ['sp-chilled','sp_chill'],
          'sp-condenser-water': ['sp-condenser-water','sp_cond_water'],
          'sp-system-vacuum':   ['sp-system-vacuum','sp_vacuum'],
          'sp-steam-flow':      ['sp-steam-flow','sp_press_steam'],
          'sp-temp-feed':       ['sp-temp-feed','sp_temp_feed'],
          'sp-temp-heater':     ['sp-temp-heater','sp_temp_heater'],
          'sp-temp-top':        ['sp-temp-top','sp_temp_top'],
          'sp-Condensate1':     ['sp-Condensate1','sp_cond1'],
          'sp-Condensate2':     ['sp-Condensate2','sp_cond2'],
          'sp-temp-bot':        ['sp-temp-bot','sp_temp_bot'],
          'sp-add1':            ['sp-add1','sp_add1'],
          'sp-add2':            ['sp-add2','sp_add2'],
          'sp-add3':            ['sp-add3','sp_add3'],
          'sp-add4':            ['sp-add4','sp_add4'],
          'sp-add5':            ['sp-add5','sp_add5'],
          'sp-add6':            ['sp-add6','sp_add6'],
          'sp-add7':            ['sp-add7','sp_add7'],
          'sp-add8':            ['sp-add8','sp_add8'],
        };

        // Fetch history dari de_production_history (tiap save = 1 row berbeda)
        const resHist = await fetch('/api/dataentry/production/history?project_name='
          + encodeURIComponent(p.name) + '&limit=50');
        const jsonHist = await resHist.json();
        const histAsc = (jsonHist.success && jsonHist.data?.length)
          ? [...jsonHist.data].reverse()
          : [];

        // Hanya kolom UPDATE yang tampil sebagai Update #1, #2, ...
        const dbRows = histAsc.filter(r => String(r.action || '').toLowerCase() === 'update');

        // Snapshot awal: prefer baris INSERT pertama, fallback ke row history paling awal, lalu project set_point
        const initialRow = histAsc.find(r => String(r.action || '').toLowerCase() === 'insert') || histAsc[0] || null;
        const spProject = p.set_point || p.setPoint || {};

        // Cek apakah ada data sama sekali
        // FIX: was `sp` (undefined) — should be `spProject` declared 3 lines above
        const hasAnySP = Object.keys(spProject).some(k => spProject[k] !== '' && spProject[k] != null);
        if (!hasAnySP && !dbRows.length) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data Set Point atau Produksi untuk project ini.');
          return;
        }

        // Build header
        let thead = `<tr>
          <th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>
          <th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">SP Awal</th>`;
        dbRows.forEach((row, i) => {
          // FIX: jangan tambah T00:00:00 kalau tanggal sudah berformat ISO (ada 'T')
          const _tglRaw = row.tanggal || row.recorded_at || null;
          const _tglDate = _tglRaw
            ? new Date(_tglRaw.includes('T') ? _tglRaw : _tglRaw + 'T00:00:00')
            : null;
          const tgl = _tglDate && !isNaN(_tglDate)
            ? _tglDate.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'2-digit'})
            : '—';
          const time = row.recorded_at
            ? (() => { const d = new Date(row.recorded_at); return isNaN(d) ? '' : d.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'}); })()
            : '';
          thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">
            Update #${i+1}<br>
            <span style="font-size:8px;font-weight:400;color:var(--txt3)">${tgl} ${time}</span>
          </th>`;
        });
        thead += `</tr>`;

        let tbody = ''; let visibleRows = 0;
        SP_FIELDS.forEach(f => {
          // Ambil SP Awal dari set_point project
          const awalKeys = SP_AWAL_MAP[f.id] || [f.id];

          // Base value dari snapshot insert/history agar tidak ikut berubah saat set_point project diupdate
          let baseVal = '';
          const dbColForBase = SP_TO_DB[f.id];
          if (initialRow && dbColForBase && initialRow[dbColForBase] !== null && initialRow[dbColForBase] !== undefined && String(initialRow[dbColForBase]).trim() !== '') {
            baseVal = initialRow[dbColForBase];
          } else {
            baseVal = awalKeys.reduce((v, k) => (v !== '' && v != null) ? v : (spProject[k] || ''), '') || '';
          }

          // Ambil nilai dari history rows pakai kolom DB yang tepat
          const dbCol   = SP_TO_DB[f.id];
          const dbCells = dbRows.map(row => {
            if (!dbCol) return null;
            const v = row[dbCol];
            return (v !== null && v !== undefined && String(v).trim() !== '') ? v : null;
          });

          const rowHasData = baseVal !== '' || dbCells.some(v => v !== null);
          if (!rowHasData) return;

          const unitHtml    = f.unit ? ` <span style="font-size:8px;color:var(--txt3);font-weight:400">${f.unit}</span>` : '';
          const baseDisplay = baseVal ? `${baseVal}${unitHtml}` : `<span style="color:var(--txt3)">—</span>`;
          const rowBg       = visibleRows % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
          visibleRows++;

          // ═══ Delta logic: hanya nilai yang BERUBAH dari kolom sebelumnya berwarna orange ═══
          // Base jadi historis (biru) jika ada minimal satu perubahan terhadap base.
          let prevVal = (baseVal !== '' && baseVal != null) ? String(baseVal) : null;
          let hasAnyChange = false;
          const cellParts = [];

          dbCells.forEach((v) => {
            // FIX: carry-forward nilai dari prevVal agar kolom yang tidak berubah
            // tetap tampil nilainya (bukan —), tapi bedakan warna: abu = tidak berubah
            let displayRaw = v;
            const isExplicit = (v !== null && v !== undefined && String(v).trim() !== '');

            if (!isExplicit) {
              // Null di DB = tidak disimpan di update ini → carry-forward untuk tampilan
              displayRaw = prevVal;
            }

            const hasDisplay = displayRaw !== null && displayRaw !== undefined && String(displayRaw).trim() !== '';
            const currentStr = hasDisplay ? String(displayRaw) : null;
            // Hanya "berubah" jika nilai EKSPLISIT disimpan DAN berbeda dari sebelumnya
            const changed = isExplicit && currentStr !== prevVal;

            if (changed) {
              hasAnyChange = true;
              prevVal = currentStr;
            }

            if (!hasDisplay) {
              cellParts.push(`<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`);
              return;
            }

            // Warna: oranye = berubah, biru = sama tapi tersimpan eksplisit, abu = carry-forward
            const color  = changed ? 'var(--orange)' : (isExplicit ? 'var(--blue)' : 'var(--txt3)');
            const weight = changed ? '700' : (isExplicit ? '600' : '400');
            const italic = isExplicit ? '' : 'font-style:italic;';
            cellParts.push(`<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:${weight};color:${color};${italic}white-space:nowrap;background:inherit;">${displayRaw}${unitHtml}</td>`);
          });

          const baseIsHistorical = hasAnyChange && baseVal !== '';
          const cells = cellParts;

          tbody += `<tr style="background:${rowBg};">
            <td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${f.label}</td>
            <td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:${baseIsHistorical ? 'var(--blue)' : 'var(--txt)'};white-space:nowrap;background:inherit;">${baseDisplay}</td>
            ${cells.join('')}
          </tr>`;
        });

        // -- Finish Production --
        // -- Finish Production --
        let fpHtml = '';
        const fpDoneFlag = p.fpDone === true || p.fp_done === true;
        if (fpDoneFlag) {
          const fpEntries = p.fp_entries || p.fpEntries || [];
          const aromaList   = fpEntries.filter(e => e.type === 'aroma').length
            ? fpEntries.filter(e => e.type === 'aroma') : (p.fpItems1 || []);
          const productList = fpEntries.filter(e => e.type !== 'aroma').length
            ? fpEntries.filter(e => e.type !== 'aroma') : (p.fpItems2 || p.fpItems || []);

          // === PRODUCT TABLE (HORIZONTAL) ===
          if (productList.length) {
            // Build header dengan nomor entry
            let thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;background:var(--bg);">Parameter</th>`;
            productList.forEach((item, i) => {
              thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;">Entry #${i+1}</th>`;
            });
            thead += `</tr>`;

            // Build rows untuk setiap parameter
            const params = [
              { label: 'Tanggal', key: 'date', unit: '' },
              { label: 'Nama Produk', key: 'name', unit: '' },
              { label: 'Kode', key: 'code', unit: '' },
              { label: 'Brix', key: 'brix', unit: '°Bx' },
              { label: 'Berat', key: 'berat', unit: 'kg' }
            ];

            let tbody = '';
            params.forEach((param, idx) => {
              const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
              tbody += `<tr style="background:${rowBg};">
                <td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;font-weight:600;">${param.label}</td>`;
              
              productList.forEach(item => {
                const value = item[param.key] || '—';
                const unitHtml = param.unit && value !== '—' ? ` <span style="font-size:9px;color:var(--txt3);">${param.unit}</span>` : '';
                const isNumeric = param.key === 'brix' || param.key === 'berat';
                const cellStyle = isNumeric 
                  ? `${tdLabel}text-align:center;font-family:'DM Mono',monospace;font-weight:700;color:var(--blue);`
                  : `${tdLabel}text-align:center;`;
                tbody += `<td style="${cellStyle}">${value}${unitHtml}</td>`;
              });
              tbody += `</tr>`;
            });

            fpHtml += `<div style="margin-bottom:16px">
              ${tableHeaderUI('🏭 Finish Production — Product')}
              <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px">
                <table style="${tblStyle}">
                  <thead>${thead}</thead>
                  <tbody>${tbody}</tbody>
                </table>
              </div>
            </div>`;
          }

          // === AROMA TABLE (HORIZONTAL) - DI BAWAH PRODUCT ===
          if (aromaList.length) {
            // Build header dengan nomor entry
            let thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;background:var(--bg);">Parameter</th>`;
            aromaList.forEach((item, i) => {
              thead += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;">Entry #${i+1}</th>`;
            });
            thead += `</tr>`;

            // Build rows untuk setiap parameter
            const params = [
              { label: 'Tanggal', key: 'date', unit: '' },
              { label: 'Nama Aroma', key: 'name', unit: '' },
              { label: 'Kode', key: 'code', unit: '' },
              { label: 'Berat', key: 'berat', unit: 'kg' }
            ];

            let tbody = '';
            params.forEach((param, idx) => {
              const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
              tbody += `<tr style="background:${rowBg};">
                <td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;font-weight:600;">${param.label}</td>`;
              
              aromaList.forEach(item => {
                const value = item[param.key] || '—';
                const unitHtml = param.unit && value !== '—' ? ` <span style="font-size:9px;color:var(--txt3);">${param.unit}</span>` : '';
                const isNumeric = param.key === 'berat';
                const cellStyle = isNumeric 
                  ? `${tdLabel}text-align:center;font-family:'DM Mono',monospace;font-weight:700;color:var(--blue);`
                  : `${tdLabel}text-align:center;`;
                tbody += `<td style="${cellStyle}">${value}${unitHtml}</td>`;
              });
              tbody += `</tr>`;
            });

            fpHtml += `<div style="margin-bottom:16px">
              ${tableHeaderUI('🌸 Finish Production — Aroma')}
              <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px">
                <table style="${tblStyle}">
                  <thead>${thead}</thead>
                  <tbody>${tbody}</tbody>
                </table>
              </div>
            </div>`;
          }
        }

        // -- Tahapan Produksi (prod_stages) --
        let tahapanHtml = '';
        const stages = p.prod_stages || p.prod_stages || {};
        if (Object.keys(stages).length > 0) {
          const PROD_STAGES_ORDER = [
            'Sirkulasi SCC','Set suhu SCC','Decanter start','Slury (Raw)',
            'Aroma','MIT','To raw extract tank','Centrifuge (stand by)',
            'To centrifuge','Filtrasi','Sirkulasi CT','Evaporasi CT',
          ];
          let stageRows = '';
          PROD_STAGES_ORDER.forEach((name, idx) => {
            const ts     = stages[name] || '';
            const isDone = !!ts;
            stageRows += `<tr style="background:${idx%2===0?'var(--surface)':'var(--bg)'}">
              <td style="${tdLabel};width:32px;text-align:center">${isDone ? '✅' : '⬜'}</td>
              <td style="${tdLabel}">${idx+1}. ${name}</td>
              <td style="${tdLabel};font-family:'DM Mono',monospace;color:${isDone?'#15803d':'var(--txt3)'};font-weight:${isDone?'600':'400'}">${ts || '—'}</td>
            </tr>`;
          });
          const doneCnt = Object.keys(stages).length;
          tahapanHtml = `<div style="margin-bottom:16px">
            ${tableHeaderUI('⚙️ Tahapan Produksi — ' + doneCnt + '/12 Selesai')}
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
              <table style="${tblStyle}">
                <thead><tr>
                  <th style="${thStyle};width:32px">✓</th>
                  <th style="${thStyle}">Tahapan</th>
                  <th style="${thStyle}">Waktu Mulai</th>
                </tr></thead>
                <tbody>${stageRows}</tbody>
              </table>
            </div>
          </div>`;
        }

        // -- CIP Production checklist --
        let cipProdHtml = '';
        if (p.cipProdDone === true || p.cip_prod_done === true) {
          const checks = p.cip_prod_checks || p.cipProdChecks || {};
          const timestamps = p.cip_prod_timestamps || p.cipProdTimestamps || {};
          const cl = CIP_CHECKLISTS.production;
          let checkRows = ''; let itemIdx = 0;
          cl.sections.forEach((sec, sIdx) => {
            if (sec.name) checkRows += `<tr><td colspan="4" style="padding:6px 10px;background:var(--bg);font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)">${sec.name}</td></tr>`;
            sec.items.forEach(item => {
              const uniqueKey = `${sIdx}__${item}`;
              const checked = checks[uniqueKey] === true || checks[item] === true;
              const checkDate = timestamps[uniqueKey] || timestamps[item] || '';
              checkRows += `<tr style="background:${itemIdx%2===0?'var(--surface)':'var(--bg)'}"><td style="${tdLabel};width:32px;text-align:center">${checked?'✅':'❌'}</td><td style="${tdLabel}">${item}</td><td style="${tdLabel};color:${checked?'var(--green)':'var(--txt3)'};font-weight:600">${checked?'Selesai':'Belum'}</td><td style="${tdLabel};font-family:'DM Mono',monospace;color:${checked?'var(--blue)':'var(--txt3)'}">${checked ? (checkDate || '—') : '—'}</td></tr>`;
              itemIdx++;
            });
          });
          // ── Hitung Total Caustic & Total Citric dari centang ──
          // Bobot per section (gram): sIdx → { caustic, citric }
          const CIP_WEIGHTS = {
            1: { causticG: 1000,  citricG: 4000,  causticItem: 'Caustic',           citricItem: 'Citric'           }, // SSC + Decanter
            2: { causticG: 800,   citricG: 3200,  causticItem: 'Caustic',           citricItem: 'Citric'           }, // Centri + Raw Tank
            3: { causticG: 7500,  citricG: 15000, causticItem: 'Caustic + Rinsing', citricItem: 'Citric + Rinsing' }, // Filter
            4: { causticG: 600,   citricG: 2400,  causticItem: 'Caustic',           citricItem: 'Citric'           }, // CT
            5: { causticG: 800,   citricG: 3200,  causticItem: 'Caustic',           citricItem: 'Citric'           }, // Clarified Tank
            6: { causticG: 700,   citricG: 2800,  causticItem: 'Caustic',           citricItem: 'Citric'           }, // Concentrate Tank
          };
          let totalCausticG = 0, totalCitricG = 0;
          Object.entries(CIP_WEIGHTS).forEach(([si, w]) => {
            const causticKey = `${si}__${w.causticItem}`;
            const citricKey  = `${si}__${w.citricItem}`;
            if (checks[causticKey] === true || checks[w.causticItem] === true) totalCausticG += w.causticG;
            if (checks[citricKey]  === true || checks[w.citricItem]  === true) totalCitricG  += w.citricG;
          });
          const fmtWt = (g) => {
            if (g === 0) return '0 Gr';
            if (g >= 1000) {
              const kg = g / 1000;
              return (Number.isInteger(kg) ? kg : kg.toFixed(1)).toString().replace('.', ',') + ' Kg';
            }
            return g + ' Gr';
          };
          const totalRow = (label, val, bg) => `
            <tr style="background:${bg}">
              <td style="${tdLabel};font-weight:700;color:var(--txt);text-transform:uppercase;letter-spacing:.5px;border-top:2px solid var(--border);" colspan="1">${label}</td>
              <td colspan="3" style="${tdLabel};font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--blue);border-top:2px solid var(--border);">${val}</td>
            </tr>`;
          const fieldRows = totalRow('🧪 Total Caustic', fmtWt(totalCausticG), 'var(--surface)') + totalRow('🍋 Total Citric', fmtWt(totalCitricG), 'var(--bg)');
          cipProdHtml = `<div style="margin-bottom:16px">${tableHeaderUI('🧼 CIP Production — Checklist')}<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden"><table style="${tblStyle}"><thead><tr><th style="${thStyle};width:32px">✓</th><th style="${thStyle}">Item</th><th style="${thStyle}">Status</th><th style="${thStyle}">Tanggal Centang</th></tr></thead><tbody>${checkRows}${fieldRows}</tbody></table></div></div>`;
        }

        wrap.innerHTML = `
          <div style="margin-bottom:16px" id="summ-section-prod-data">
            <div onclick="toggleSummSection('prod-data')" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;user-select:none;padding:8px;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
              <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">⚙️ Data & History Produksi</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="font-size:9px;color:var(--blue);background:#ebf2fd;padding:3px 8px;border-radius:4px;font-weight:600">↔ Geser kanan untuk melihat update</div>
                <svg id="summ-toggle-prod-data" width="14" height="14" viewBox="0 0 14 14" style="transition:transform .2s;transform:rotate(0deg)"><path d="M3 5 L7 9 L11 5" stroke="var(--txt3)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
            <div id="summ-content-prod-data" style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:60vh;">
              <table style="${tblStyle}">
                <thead>${thead}</thead>
                <tbody>${tbody}</tbody>
              </table>
            </div>
          </div>
          ${fpHtml ? `<div style="margin-bottom:16px" id="summ-section-fp">
            <div onclick="toggleSummSection('fp')" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;user-select:none;padding:8px;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
              <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">🏭 Finish Production</div>
              <svg id="summ-toggle-fp" width="14" height="14" viewBox="0 0 14 14" style="transition:transform .2s;transform:rotate(0deg)"><path d="M3 5 L7 9 L11 5" stroke="var(--txt3)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div id="summ-content-fp">${fpHtml}</div>
          </div>` : ''}
          ${tahapanHtml ? `<div style="margin-bottom:16px" id="summ-section-tahapan">
            <div onclick="toggleSummSection('tahapan')" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;user-select:none;padding:8px;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
              <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">⚙️ Tahapan Produksi</div>
              <svg id="summ-toggle-tahapan" width="14" height="14" viewBox="0 0 14 14" style="transition:transform .2s;transform:rotate(0deg)"><path d="M3 5 L7 9 L11 5" stroke="var(--txt3)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div id="summ-content-tahapan">${tahapanHtml}</div>
          </div>` : ''}
          ${cipProdHtml ? `<div style="margin-bottom:16px" id="summ-section-cip">
            <div onclick="toggleSummSection('cip')" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;user-select:none;padding:8px;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
              <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-transform:uppercase">🧼 CIP Production</div>
              <svg id="summ-toggle-cip" width="14" height="14" viewBox="0 0 14 14" style="transition:transform .2s;transform:rotate(0deg)"><path d="M3 5 L7 9 L11 5" stroke="var(--txt3)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div id="summ-content-cip">${cipProdHtml}</div>
          </div>` : ''}`;
      } catch(err) {
        console.error('Produksi summary error:', err);
        wrap.innerHTML = emptyMsg('❌ Gagal memuat data produksi: ' + err.message);
      }
    })();
    return;
  }

  // ─── LAB ─────────────────────────────────────────────
  if (tabId === 'lab') {
    // Tampilkan loading sementara data di-fetch dari API
    wrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px">\u23f3 Memuat data Lab...</div>';

    // Fetch data lab dari database berdasarkan project_name
    (async () => {
      try {
        const res  = await fetch('/api/dataentry/laboratorium?project_name=' + encodeURIComponent(p.name));
        const json = await res.json();
        const rows = (json.success && json.data?.length) ? json.data : [];

        // Gabungkan juga labHistory dari localStorage jika ada (legacy)
        const localHist = p.labHistory || [];

        if (!rows.length && !localHist.length) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Lab untuk project ini.');
          return;
        }

        // Bangun tabel dari data database (brix_entries & moisture_entries)
        let brixHtml = '', moistHtml = '';

        if (rows.length) {
          // Kumpulkan semua brix entries dari semua record (per tanggal)
          const allBrix = [];
          const allMoist = [];
          rows.forEach(row => {
            const tanggal = new Date(row.tanggal).toLocaleDateString('id-ID', {day:'2-digit',month:'2-digit',year:'2-digit'});
            (row.brix_entries || []).forEach(e => allBrix.push({...e, tanggal}));
            (row.moisture_entries || []).forEach(e => allMoist.push({...e, tanggal}));
          });

          if (allBrix.length) {
            const brixRows = allBrix.map((e, i) => `<tr style="background:${i%2===0?'var(--surface)':'var(--bg)'}">
              <td style="${tdLabel}">${e.tanggal||'—'}</td>
              <td style="${tdLabel}">${e.sample||'—'}</td>
              <td style="${tdLabel}">${e.kode||'—'}</td>
              <td style="${tdLabel};font-family:'DM Mono',monospace;font-weight:700;color:var(--blue)">${e.brix||'—'}</td>
              <td style="${tdLabel};color:var(--txt3)">${e.notes||'—'}</td>
            </tr>`).join('');
            brixHtml = `
              <div style="margin-bottom:16px">
                ${tableHeaderUI('Data Brix')}
                <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px">
                  <table style="${tblStyle}">
                    <thead><tr>
                      <th style="${thStyle}">Tanggal</th>
                      <th style="${thStyle}">Nama Sample</th>
                      <th style="${thStyle}">Kode Pile</th>
                      <th style="${thStyle}">Brix</th>
                      <th style="${thStyle}">Catatan</th>
                    </tr></thead>
                    <tbody>${brixRows}</tbody>
                  </table>
                </div>
              </div>`;
          }

          if (allMoist.length) {
            const moistRows = allMoist.map((e, i) => `<tr style="background:${i%2===0?'var(--surface)':'var(--bg)'}">
              <td style="${tdLabel}">${e.tanggal||'—'}</td>
              <td style="${tdLabel}">${e.sample||'—'}</td>
              <td style="${tdLabel};font-family:'DM Mono',monospace;font-weight:700;color:var(--blue)">${e.mc||'—'}</td>
              <td style="${tdLabel};color:var(--txt3)">${e.notes||'—'}</td>
            </tr>`).join('');
            moistHtml = `
              <div style="margin-bottom:16px">
                ${tableHeaderUI('💧 Data Moisture')}
                <div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px">
                  <table style="${tblStyle}">
                    <thead><tr>
                      <th style="${thStyle}">Tanggal</th>
                      <th style="${thStyle}">Nama Sample</th>
                      <th style="${thStyle}">MC%</th>
                      <th style="${thStyle}">Catatan</th>
                    </tr></thead>
                    <tbody>${moistRows}</tbody>
                  </table>
                </div>
              </div>`;
          }
        }

        // Jika tidak ada data dari DB, coba fallback ke labHistory localStorage
        if (!brixHtml && !moistHtml && localHist.length) {
          // Render dengan cara lama (labHistory) sebagai fallback
          const labHist = localHist;
          const mapLabel = (l) => { const map={'TLV':'Nama Sample (Brix)','Lab Code':'Kode Pile','Air Test':'Brix','Header Retaking':'Nama Sample (Moisture)','Sampling Point':'MC%'}; return map[l]||l; };
          const normalizedHist = labHist.map(entry => ({...entry, fields:(entry.fields||[]).map(f=>({...f,label:mapLabel(f.label)}))}));
          const uniqueBrix = [], uniqueMoist = [];
          normalizedHist.forEach(entry => (entry.fields||[]).forEach(f => {
            if (f.label.includes('Brix')||f.label.includes('Kode Pile')) { if (!uniqueBrix.includes(f.label)) uniqueBrix.push(f.label); }
            else if (f.label.includes('Moisture')||f.label.includes('MC%')) { if (!uniqueMoist.includes(f.label)) uniqueMoist.push(f.label); }
            else { if (!uniqueBrix.includes(f.label)&&!uniqueMoist.includes(f.label)) uniqueBrix.push(f.label); }
          }));
          let theadCols='';
          normalizedHist.forEach((entry,i) => {
            const d = new Date(entry.saved_at);
            const ds = d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'})+', '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
            theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${ds}</span></th>`;
          });
          const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;
          const buildTbody = (labelsArr) => { let tb=''; labelsArr.forEach((label,rIdx) => { const bg=rIdx%2===0?'var(--surface)':'var(--bg)'; let row=`<td style="${tdLabel}position:sticky;left:0;background:${bg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${label}</td>`; normalizedHist.forEach(entry => { const f=(entry.fields||[]).find(f=>f.label===label); row += f&&f.newVal!=='' ? `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);background:inherit;">${f.newVal}</td>` : `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`; }); tb+=`<tr style="background:${bg}">${row}</tr>`; }); return tb; };
          if (uniqueBrix.length) brixHtml=`<div style="margin-bottom:16px">${tableHeaderUI('�5 Data Brix')}<div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;max-height:50vh"><table style="${tblStyle}"><thead>${thead}</thead><tbody>${buildTbody(uniqueBrix)}</tbody></table></div></div>`;
          if (uniqueMoist.length) moistHtml=`<div style="margin-bottom:16px">${tableHeaderUI('💧 Data Moisture')}<div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;max-height:50vh"><table style="${tblStyle}"><thead>${thead}</thead><tbody>${buildTbody(uniqueMoist)}</tbody></table></div></div>`;
        }

        // -- CIP Lab — hanya tampilkan PH + keterangan (tanpa checklist rinse) --
        let cipLabHtml = '';
        const hasCIPLab  = p.cipLabDone === true || p.cip_lab_done === true;
        // Ambil entries dari berbagai sumber
        const cipEntries = (rows?.find(r => r.cip_lab_entries?.length)?.cip_lab_entries)
          || p.cipLabEntries || p.cip_lab_entries || [];

        if (hasCIPLab || cipEntries.length) {
          let entryRows = '';
          if (cipEntries.length) {
            entryRows = cipEntries.map((e, i) => `
              <tr style="background:${i%2===0?'var(--surface)':'var(--bg)'}">
                <td style="${tdLabel};text-align:center;width:40px;font-weight:700;color:var(--txt3)">${i+1}</td>
                <td style="${tdLabel};font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--blue)">${e.ph||'—'}</td>
                <td style="${tdLabel};color:var(--txt2)">${e.keterangan||'—'}</td>
              </tr>`).join('');
          } else {
            entryRows = `<tr><td colspan="3" style="padding:12px;text-align:center;color:var(--txt3);font-size:12px">Belum ada data PH CIP</td></tr>`;
          }

          const badgeColor = hasCIPLab ? 'var(--green)' : 'var(--orange)';
          const badgeBg    = hasCIPLab ? 'var(--green-bg)' : 'var(--orange-bg)';
          const badgeLabel = hasCIPLab ? '✅ Selesai' : '⏳ Progress';

          cipLabHtml = `
            <div style="margin-bottom:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:16px">🧼</span>
                  <span style="font-size:12px;font-weight:700;color:var(--txt);text-transform:uppercase;letter-spacing:.8px">CIP Lab — Data PH</span>
                </div>
                <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:99px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}33">${badgeLabel}</span>
              </div>
              <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
                <table style="${tblStyle}">
                  <thead>
                    <tr>
                      <th style="${thStyle};width:40px;text-align:center">#</th>
                      <th style="${thStyle}">PH</th>
                      <th style="${thStyle}">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>${entryRows}</tbody>
                </table>
              </div>
            </div>`;
        } // end if (hasCIPLab || cipEntries.length)

        if (!brixHtml && !moistHtml && !cipLabHtml) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Lab untuk project ini.');
        } else {
          wrap.innerHTML = brixHtml + moistHtml + cipLabHtml;
        }
      } catch(err) {
        console.error('Lab summary fetch error:', err);
        wrap.innerHTML = emptyMsg('❌ Gagal memuat data Lab: ' + err.message);
      }
    })();
    return;
  }

  if (tabId === 'utility') {
    // Tampilkan loading sementara fetch dari API
    wrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px">⏳ Memuat data Utility...</div>';

    (async () => {
      try {
        // ── 1. Fetch dari database ──────────────────────────────────
        const res  = await fetch('/api/dataentry/utility?project_name=' + encodeURIComponent(p.name) + '&limit=50');
        const json = await res.json();
        const dbRows = (json.success && json.data?.length) ? json.data : [];

        // ── 2. Fallback: utilityHistory dari localStorage (legacy) ──
        const localHist = p.utilityHistory || [];

        if (!dbRows.length && !localHist.length) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Utility untuk project ini.');
          return;
        }

        // ── Label mapping Boiler (b1–b18) & Chiller (c1–c11) ───────
        const boilerLabels = {
          b1:'Steam Press (MPa)',          b2:'Flue Gas Temp (°C)',
          b3:'Feed Water Temp (°C)',        b4:'Scale Monitor (°C)',
          b5:'Overheat Sensor (°C)',        b6:'To Next Blowdown (H)',
          b7:'Conductivity (mS/m)',         b8:'Air Pressure (pa)',
          b9:'Ignition Count',             b10:'Oil L-fire Time',
          b11:'Oil H-fire Time',           b12:'Fuel Gas Temp L-fire (°C)',
          b13:'Fuel Gas Temp H-fire (°C)', b14:'Feed Water Avg Temp (°C)',
          b15:'Oil B-Efficiency (%)',       b16:'Oil Fuel Consumption (KL)',
          b17:'Steam Output (t)',           b18:'Surface Blowdown (L)',
        };
        const chillerLabels = {
          c1:'Chiller Set Point (°C)',      c2:'Water In Temp (°C)',
          c3:'Water Out Temp (°C)',         c4:'CAP (%)',
          c5:'Discharge Pressure A (kPa)', c6:'Main Suction A (kPa)',
          c7:'Discharge Pressure B (kPa)', c8:'Main Suction B (kPa)',
          c9:'Unit Total Capacity (%)',    c10:'Cir A Capacity (%)',
          c11:'Cir B Capacity (%)',
        };

        // ── 3. Bangun kolom dari DB rows ────────────────────────────
        // API menyimpan kolom flat: b1_steam_press, b2_fg_temp, ..., c1_set_point, dst
        // Mapping DB column name → key boiler/chiller
        const boilerDbMap = {
          b1:'b1_steam_press',   b2:'b2_fg_temp',       b3:'b3_fw_temp',
          b4:'b4_scale_temp',    b5:'b5_overheat_temp',  b6:'b6_next_blowdown',
          b7:'b7_conductivity',  b8:'b8_air_press',      b9:'b9_ignition_count',
          b10:'b10_oil_lfire_time', b11:'b11_oil_hfire_time',
          b12:'b12_flue_lfire_temp', b13:'b13_flue_hfire_temp',
          b14:'b14_fw_avg_temp', b15:'b15_oil_efficiency',
          b16:'b16_oil_fuel_cons', b17:'b17_steam_output', b18:'b18_surface_bd',
        };
        const chillerDbMap = {
          c1:'c1_set_point',    c2:'c2_water_in_temp',  c3:'c3_water_out_temp',
          c4:'c4_cap',          c5:'c5_discharge_a',    c6:'c6_suction_a',
          c7:'c7_discharge_b',  c8:'c8_suction_b',      c9:'c9_unit_capacity',
          c10:'c10_cir_a_capacity', c11:'c11_cir_b_capacity',
        };

        // Filter hanya rows project (ada kolom boiler/chiller), urutkan lama→baru
        const projectRows = dbRows
          .filter(r => r.tipe === 'project' || r.b1_steam_press !== undefined || r.c1_set_point !== undefined)
          .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        let boilerHtml = '', chillerHtml = '';

        if (projectRows.length) {
          // Build header
          let theadCols = '';
          projectRows.forEach((row, i) => {
            // FIX: cek apakah sudah ISO string (ada 'T') sebelum tambah T00:00:00
            const _raw = row.tanggal || row.recorded_at || null;
            const _d   = _raw ? new Date(_raw.includes('T') ? _raw : _raw + 'T00:00:00') : null;
            const tgl  = (_d && !isNaN(_d))
              ? _d.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'2-digit'})
              : '—';
            const _rt  = row.recorded_at ? new Date(row.recorded_at) : null;
            const time = (_rt && !isNaN(_rt))
              ? _rt.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})
              : '';
            theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3)">${tgl} ${time}</span></th>`;
          });
          const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;

          // Build tbody — baca dari kolom flat DB
          const buildApiTbody = (labelMap, dbMap) => {
            let tbody = '';
            Object.entries(labelMap).forEach(([k, lbl], rIdx) => {
              const dbCol = dbMap[k];
              const vals = projectRows.map(row => {
                const v = row[dbCol];
                return (v !== null && v !== undefined && String(v).trim() !== '') ? v : null;
              });
              if (!vals.some(v => v !== null)) return;
              const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
              let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${lbl}</td>`;
              // Delta logic: oranye=berubah, biru=sama eksplisit, abu=carry-forward
              let prevVal = null;
              vals.forEach(v => {
                const isExplicit = v !== null;
                const displayRaw = isExplicit ? v : prevVal;
                const hasDisplay = displayRaw !== null && String(displayRaw).trim() !== '';
                const changed = isExplicit && String(v) !== (prevVal !== null ? String(prevVal) : null);
                if (changed) prevVal = v;
                else if (isExplicit) prevVal = v;

                if (!hasDisplay) {
                  rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
                  return;
                }
                const color  = changed ? 'var(--orange)' : (isExplicit ? 'var(--blue)' : 'var(--txt3)');
                const weight = changed ? '700' : (isExplicit ? '600' : '400');
                const italic = isExplicit ? '' : 'font-style:italic;';
                rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:${weight};color:${color};${italic}white-space:nowrap;background:inherit;">${displayRaw}</td>`;
              });
              tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
            });
            return tbody;
          };

          const boilerTbody  = buildApiTbody(boilerLabels,  boilerDbMap);
          const chillerTbody = buildApiTbody(chillerLabels, chillerDbMap);

          if (boilerTbody) {
            boilerHtml = `
              <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;margin-top:12px;">
                <span style="font-size:14px;">🔥</span><span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER BOILER</span>
              </div>
              <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:20px;">
                <table style="${tblStyle}"><thead>${thead}</thead><tbody>${boilerTbody}</tbody></table>
              </div>`;
          }
          if (chillerTbody) {
            chillerHtml = `
              <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
                <span style="font-size:14px;">⚙️</span><span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER CHILLER</span>
              </div>
              <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;">
                <table style="${tblStyle}"><thead>${thead}</thead><tbody>${chillerTbody}</tbody></table>
              </div>`;
          }
        }

        // ── 4. Fallback ke localStorage utilityHistory jika DB kosong ──
        if (!boilerHtml && !chillerHtml && localHist.length) {
          const boilerKeywords = ['Steam', 'Flue', 'Feed water', 'Scale', 'Overheat', 'Blowdown',
            'Conductivity', 'Air pressure', 'Ignition', 'Oil', 'Fuel', 'Efficiency', 'Surface blowdown', 'output'];
          const bLabels = [], cLabels = [];
          localHist.forEach(entry => {
            (entry.fields || []).forEach(f => {
              const isBoiler = boilerKeywords.some(kw => f.label.includes(kw));
              if (isBoiler) { if (!bLabels.includes(f.label)) bLabels.push(f.label); }
              else          { if (!cLabels.includes(f.label)) cLabels.push(f.label); }
            });
          });
          let theadCols = '';
          localHist.forEach((entry, i) => {
            const d = new Date(entry.saved_at);
            const ds = d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'})+', '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
            theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${ds}</span></th>`;
          });
          const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;
          const buildLocalTbody = (labelsArr) => {
            let tbody = '';
            labelsArr.forEach((label, rIdx) => {
              const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
              let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);">${label}</td>`;
              localHist.forEach(entry => {
                const field = (entry.fields || []).find(f => f.label === label);
                rowHtml += (field && field.newVal !== '')
                  ? `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${field.newVal}</td>`
                  : `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
              });
              tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
            });
            return tbody;
          };
          if (bLabels.length) boilerHtml = `
            <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;margin-top:12px;">
              <span style="font-size:14px;">🔥</span><span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER BOILER</span>
            </div>
            <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;margin-bottom:20px;">
              <table style="${tblStyle}"><thead>${thead}</thead><tbody>${buildLocalTbody(bLabels)}</tbody></table>
            </div>`;
          if (cLabels.length) chillerHtml = `
            <div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
              <span style="font-size:14px;">⚙️</span><span style="font-size:12px;font-weight:700;color:var(--txt);">PARAMETER CHILLER</span>
            </div>
            <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:40vh;">
              <table style="${tblStyle}"><thead>${thead}</thead><tbody>${buildLocalTbody(cLabels)}</tbody></table>
            </div>`;
        }

        if (!boilerHtml && !chillerHtml) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Utility untuk project ini.');
          return;
        }

        wrap.innerHTML = `
          <div style="margin-bottom:16px">
            ${tableHeaderUI('⚡ Data & History Utility')}
            ${boilerHtml}
            ${chillerHtml}
          </div>`;

      } catch(err) {
        console.error('Utility summary fetch error:', err);
        wrap.innerHTML = emptyMsg('❌ Gagal memuat data Utility: ' + err.message);
      }
    })();
    return;
  }

  // ─── LIMBAH ──────────────────────────────────────────
  if (tabId === 'limbah') {
    // 1. Tampilkan loading
    wrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txt3);font-size:12px">⏳ Memuat data Limbah dari database...</div>';

    (async () => {
      try {
        // 2. FETCH data dari database berdasarkan nama project
        const res = await fetch('/api/dataentry/limbah?project_name=' + encodeURIComponent(p.name));
        const json = await res.json();

        // Ambil data dari DB, jika kosong gunakan data lokal sebagai cadangan
        const dbRows = (json.success && json.data?.length)
          ? [...json.data].sort((a,b) => new Date(a.tanggal||a.created_at) - new Date(b.tanggal||b.created_at))
          : [];
        const localHist = p.limbahHistory || [];

        if (!dbRows.length && !localHist.length) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Limbah untuk project ini.');
          return;
        }

        // 3. Kolom mapping DB → label tampilan
        const colMap = [
          { col:'tanggal',   label:'Tanggal'              },
          { col:'awal',      label:'Awal (m³)'            },
          { col:'akhir',     label:'Akhir (m³)'           },
          { col:'volume',    label:'Volume (m³)'          },
          { col:'cod',       label:'COD (mg/L)'           },
          { col:'bod',       label:'BOD (mg/L)'           },
          { col:'tss',       label:'TSS (mg/L)'           },
          { col:'ph',        label:'pH'                   },
          { col:'jar_alum',  label:'Jar Test Alum (PPM)'  },
          { col:'jar_total', label:'Jar Test Total (PPM)' },
          { col:'notes',     label:'Catatan'              },
        ];

        const useApi  = dbRows.length > 0;
        const entries = useApi ? dbRows : localHist;

        // 4. Build header
        let theadCols = '';
        entries.forEach((entry, i) => {
          // FIX: jangan tambah T00:00:00 kalau tanggal sudah ISO (ada 'T')
          const _lraw = entry.tanggal || entry.saved_at || entry.recorded_at || null;
          const d = _lraw ? new Date(_lraw.includes('T') ? _lraw : _lraw + 'T00:00:00') : new Date('invalid');
          const dateStr = d.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'2-digit'});
          const timeStr = useApi ? '' : ' ' + d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
          theadCols += `<th style="${thStyle}text-align:center;position:sticky;top:0;z-index:3;box-shadow:inset 0 -1px 0 var(--border);min-width:100px;">Update #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3);text-transform:none">${dateStr}${timeStr}</span></th>`;
        });
        const thead = `<tr><th style="${thStyle}text-align:left;position:sticky;left:0;top:0;z-index:4;box-shadow:inset -1px -1px 0 var(--border);">Parameter</th>${theadCols}</tr>`;

        // 5. Build tbody
        let tbody = '';
        if (useApi) {
          colMap.forEach(({ col, label }, rIdx) => {
            const vals = dbRows.map(row => {
              const v = row[col];
              return (v !== null && v !== undefined && String(v).trim() !== '') ? v : null;
            });
            if (!vals.some(v => v !== null)) return;
            const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
            let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);font-weight:600;">${label}</td>`;
            // Delta logic: oranye=berubah, biru=sama eksplisit, abu=carry-forward
            let prevVal = null;
            vals.forEach(v => {
              const isExplicit = v !== null;
              const displayRaw = isExplicit ? v : prevVal;
              const hasDisplay = displayRaw !== null && String(displayRaw).trim() !== '';
              const changed = isExplicit && String(v) !== (prevVal !== null ? String(prevVal) : null);
              if (isExplicit) prevVal = v;

              if (!hasDisplay) {
                rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
                return;
              }
              const color  = changed ? 'var(--orange)' : (isExplicit ? 'var(--blue)' : 'var(--txt3)');
              const weight = changed ? '700' : (isExplicit ? '600' : '400');
              const italic = isExplicit ? '' : 'font-style:italic;';
              rowHtml += `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:${weight};color:${color};${italic}white-space:nowrap;background:inherit;">${displayRaw}</td>`;
            });
            tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
          });
        } else {
          // fallback localStorage
          const uniqueLabels = [];
          localHist.forEach(e => (e.fields||[]).forEach(f => { if (!uniqueLabels.includes(f.label)) uniqueLabels.push(f.label); }));
          uniqueLabels.forEach((label, rIdx) => {
            const rowBg = rIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
            let rowHtml = `<td style="${tdLabel}position:sticky;left:0;background:${rowBg};z-index:2;box-shadow:inset -1px 0 0 var(--border);font-weight:600;">${label}</td>`;
            localHist.forEach(entry => {
              const field = (entry.fields||[]).find(f => f.label === label);
              rowHtml += (field && field.newVal !== '' && field.newVal !== undefined)
                ? `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap;background:inherit;">${field.newVal}</td>`
                : `<td style="padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:11px;background:inherit;">—</td>`;
            });
            tbody += `<tr style="background:${rowBg}">${rowHtml}</tr>`;
          });
        }

        if (!tbody) {
          wrap.innerHTML = emptyMsg('📭 Belum ada data entry Limbah untuk project ini.');
          return;
        }

        wrap.innerHTML = `
          <div style="margin-bottom:16px">
            ${tableHeaderUI('♻️ Data & History Limbah')}
            <div style="overflow-x:auto;overflow-y:auto;border:1px solid var(--border);border-radius:10px;max-height:60vh;">
              <table style="${tblStyle}">
                <thead>${thead}</thead>
                <tbody>${tbody}</tbody>
              </table>
            </div>
          </div>`;

      } catch (err) {
        console.error('Limbah summary fetch error:', err);
        wrap.innerHTML = emptyMsg('❌ Gagal memuat data Limbah: ' + err.message);
      }
    })();
    return;
  }

  wrap.innerHTML = '';
}

function toggleSummSection(sectionId) {
  // Pattern baru: summ-sec-{type}-{tab} + summ-chev-{type}-{tab}
  const newContent = document.getElementById(sectionId);
  const newChevron = document.getElementById(sectionId.replace('summ-sec-', 'summ-chev-'));
  if (newContent && newChevron) {
    const isHidden = newContent.style.display === 'none';
    newContent.style.display = isHidden ? 'block' : 'none';
    newChevron.style.transform = isHidden ? '' : 'rotate(-90deg)';
    return;
  }
  // Pattern lama: summ-content-{id} + summ-toggle-{id}
  const content = document.getElementById('summ-content-' + sectionId);
  const toggle = document.getElementById('summ-toggle-' + sectionId);
  if (!content || !toggle) return;
  const isHidden = content.style.display === 'none';
  if (isHidden) {
    content.style.display = '';
    toggle.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    toggle.style.transform = 'rotate(-90deg)';
  }
}
window.toggleSummSection = toggleSummSection;

function closeSumm(type) {
  document.getElementById('summ-overlay-'+type)?.classList.remove('show');
  document.getElementById('summ-drawer-'+type)?.classList.remove('show');
  document.body.style.overflow = '';
}

// ── Detail drawer (for recent) ────────────────────────────
function openPD(type,idx){
  const p=gPJ(type)[idx];if(!p)return;
  document.getElementById('pd-nm-'+type).textContent=p.name;
  document.getElementById('pd-dt-'+type).textContent='📅 '+(p.start||'—')+' → 🏁 '+(p.end||'—');
  document.getElementById('pd-bd-'+type).innerHTML=`
    <div class="proj-info-grid">
      <div><div class="proj-info-lbl">START</div><div class="proj-info-val">${p.start||'—'}</div></div>
      <div><div class="proj-info-lbl">EXPECTED END</div><div class="proj-info-val">${p.end||'—'}</div></div>
    </div>
    <div><div class="proj-info-lbl">MATERIALS</div><div class="proj-info-val">${p.materials||'—'}</div></div>
    <div><div class="proj-info-lbl">TOOLS</div><div class="proj-info-val">${p.tools||'—'}</div></div>
    ${p.notes?`<div><div class="proj-info-lbl">NOTES</div><div class="proj-info-val">${p.notes}</div></div>`:''}
    <div><div class="proj-info-lbl">STATUS CIP</div><div class="proj-info-val">${p.cipDone?'✅ Selesai':'⏳ Belum'}</div></div>
    <div><div class="proj-info-lbl">SET POINT</div><div class="proj-info-val">${(p.setPoint&&Object.keys(p.setPoint).length)?'✅ Sudah diisi':'⏳ Belum'}</div></div>
    <div><div class="proj-info-lbl">CREATED</div><div class="proj-info-val" style="font-family:'DM Mono',monospace;font-size:11px">${new Date(p.created_at).toLocaleString('en-GB')}</div></div>
    <button class="proj-del-btn" onclick="delPJ('${type}',${idx})">🗑️ Delete Project</button>`;
  document.getElementById('pdo-'+type)?.classList.add('show');
  document.getElementById('pdd-'+type)?.classList.add('show');
  document.body.style.overflow='hidden';
}
function closePD(t) {
  document.getElementById('pdo-'+t)?.classList.remove('show');
  document.getElementById('pdd-'+t)?.classList.remove('show');
  document.body.style.overflow = '';
}
function delPJ(t, i) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  const l = gPJ(t);
  l.splice(i, 1);
  sPJ(t, l);
  closePD(t);
  renderPJ(t);
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeDetail();closeSensorModal();
    ['ongoing','recent','completed'].forEach(t=>{
      closeAPJ(t);closePD(t);closeEditPJ(t);closeUpdModal(t);closeSumm(t);
      closeSP(t);closeCIP_enh(t);closeFP(t);
    });
  }
});