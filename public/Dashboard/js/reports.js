function initReportingForm() {
  renderHarianReports();
}

// Parse "YYYY-MM-DD" as LOCAL date (avoids UTC midnight timezone shift)
function _parseLocalDate(dateStr) {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  return new Date(y, m - 1, d); // month is 0-indexed
}

// Get local YYYY-MM-DD date key from an entry.
// If 'tanggal' is a plain date string (YYYY-MM-DD), use it directly.
// If 'created_at' is a UTC datetime, convert to local date before extracting.
function _localDateKey(entry) {
  const tanggal = entry.tanggal || '';
  // If tanggal looks like a plain date (10 chars, YYYY-MM-DD), use as-is
  if (tanggal && tanggal.length === 10 && tanggal[4] === '-') return tanggal;
  // Otherwise use created_at (UTC datetime) → convert to local date
  const raw = tanggal || entry.created_at || '';
  if (!raw) return '';
  const dt = new Date(raw); // parsed as UTC if ISO string
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── State ──────────────────────────────────────────────────
window._rHarianTab     = window._rHarianTab     || 'lab';   // lab | utility | limbah
window._rHarianUtilSub = window._rHarianUtilSub || null;    // listrik | solar | air
window._rHarianMonth   = window._rHarianMonth   || null;    // 'YYYY-MM'
window._rHarianSort    = window._rHarianSort    || 'newest';
// backward-compat: _activeReportTab is set directly by switchReportTab in HTML
// We read it in renderHarianReports to detect tab changes
window._activeReportTab = window._activeReportTab || 'lab';
window._reportSortBy    = window._reportSortBy    || 'newest';

// PENTING: switchReportTab adalah fungsi yang dipanggil tombol tab
// Lab/Utility/Limbah di markup HTML halaman Reporting (onclick di tombol
// tab tersebut). Didefinisikan di sini sebagai SUMBER KEBENARAN TUNGGAL
// untuk perpindahan tab — langsung men-set _rHarianTab tanpa bergantung
// pada perbandingan _activeReportTab vs _rHarianTab di renderHarianReports(),
// supaya tab tidak nyangkut di nilai lama dan _hLoadData() memanggil
// endpoint yang salah (misal tab Utility tapi tetap fetch data Lab).
window.switchReportTab = function(tab) {
  window._activeReportTab = tab;
  window._rHarianTab      = tab;
  window._rHarianUtilSub  = null;
  window._rHarianMonth    = null;
  renderHarianReports();
  // Apply tab styles setelah render
  requestAnimationFrame(() => {
    ['lab','utility','limbah'].forEach(id => {
      const btn = document.getElementById('htab-' + id);
      if (!btn) return;
      btn.classList.toggle('active', id === tab);
    });
  });
};

// ── Entry point ────────────────────────────────────────────
function renderHarianReports() {
  // switchReportTab (di atas) sudah men-set _rHarianTab langsung sebelum
  // memanggil fungsi ini. Baris di bawah ini fallback pengaman saja, kalau
  // ada kode lain yang masih mengubah _activeReportTab tanpa lewat
  // switchReportTab — supaya tetap tersinkron.
  const incoming = window._activeReportTab || 'lab';
  if (incoming !== window._rHarianTab) {
    window._rHarianTab     = incoming;
    window._rHarianUtilSub = null;
    window._rHarianMonth   = null;
  }
  // Also sync sort
  if (window._reportSortBy && window._reportSortBy !== window._rHarianSort) {
    window._rHarianSort = window._reportSortBy;
  }
  _buildHarianShell();
}

// ── Build permanent shell (tab + content area) ─────────────
function _buildHarianShell() {
  const wrap = document.getElementById('harian-reports-container');
  if (!wrap) return;

  wrap.innerHTML = `
    <div id="harian-shell" style="display:flex;flex-direction:column;gap:0;">

      <!-- Top bar: only sort (tabs are in page HTML above) -->
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-bottom:0;padding-bottom:0;">
        <div style="position:relative;">
          <button onclick="_hToggleSort()" id="harian-sort-btn"
            style="display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);font-size:12px;font-weight:600;color:var(--txt2);cursor:pointer;">
            <span id="harian-sort-label">⬇ Terbaru</span> ▾
          </button>
          <div id="harian-sort-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:99;min-width:140px;overflow:hidden;">
            <div onclick="_hSetSort('newest')" style="padding:10px 16px;font-size:13px;cursor:pointer;font-weight:600;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">⬇ Terbaru</div>
            <div onclick="_hSetSort('oldest')" style="padding:10px 16px;font-size:13px;cursor:pointer;font-weight:600;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">⬆ Terlama</div>
          </div>
        </div>
      </div>

      <!-- Step area: util sub-tab + month picker -->
      <div id="harian-step-area" style="margin-top:12px;"></div>
      <!-- Data area -->
      <div id="harian-data-area" style="margin-top:4px;"></div>

    </div>`;

  _hApplyTabStyles();
  _hRenderSteps();
}

// ── Tab selection (alias — diarahkan ke switchReportTab agar satu sumber kebenaran) ──
function _hSelectTab(tab) {
  window.switchReportTab(tab);
}

function _hApplyTabStyles() {
  const colors = {
    lab:     { bg:'#f3e8ff', border:'#a855f7', text:'#6b21a8' },
    utility: { bg:'#fef9c3', border:'#eab308', text:'#713f12' },
    limbah:  { bg:'#dcfce7', border:'#22c55e', text:'#15803d' },
  };
  ['lab','utility','limbah'].forEach(id => {
    const btn = document.getElementById('htab-' + id);
    if (!btn) return;
    if (id === window._rHarianTab) {
      const c = colors[id];
      btn.style.background    = c.bg;
      btn.style.borderColor   = c.border;
      btn.style.color         = c.text;
    } else {
      btn.style.background  = 'var(--bg)';
      btn.style.borderColor = 'var(--border)';
      btn.style.color       = 'var(--txt3)';
    }
  });
}

// ── Sort ───────────────────────────────────────────────────
function _hToggleSort() {
  const m = document.getElementById('harian-sort-menu');
  if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function _hSetSort(v) {
  window._rHarianSort  = v;
  window._reportSortBy = v;
  const lbl = document.getElementById('harian-sort-label');
  if (lbl) lbl.textContent = v === 'oldest' ? '⬆ Terlama' : '⬇ Terbaru';
  const m = document.getElementById('harian-sort-menu');
  if (m) m.style.display = 'none';
  if (window._rHarianMonth) _hLoadData();
}
document.addEventListener('click', e => {
  const btn = document.getElementById('harian-sort-btn');
  const menu = document.getElementById('harian-sort-menu');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = 'none';
});

// ── Steps renderer ─────────────────────────────────────────
function _hRenderSteps() {
  const area = document.getElementById('harian-step-area');
  if (!area) return;

  const tab = window._rHarianTab;
  let html = '';

  // ── Step 1: Util sub-tab (only for utility, before month) ──
  if (tab === 'utility' && !window._rHarianUtilSub) {
    const subs = [
      { id:'listrik', icon:'⚡', label:'Listrik', bg:'#fef9c3', border:'#eab308', text:'#713f12' },
      { id:'solar',   icon:'⛽', label:'Solar',   bg:'#fff7ed', border:'#fb923c', text:'#9a3412' },
      { id:'air',     icon:'💧', label:'Air',     bg:'#eff6ff', border:'#60a5fa', text:'#1e3a5f' },
    ];
    html += `<div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.6px;margin-bottom:8px;">PILIH KATEGORI UTILITY</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${subs.map(s => `
          <button onclick="_hSelectUtilSub('${s.id}')"
            style="padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;border:2px solid ${s.border};background:${s.bg};color:${s.text};cursor:pointer;">
            ${s.icon} ${s.label}
          </button>`).join('')}
      </div>
    </div>`;
    area.innerHTML = html;
    return;
  }

  // ── Step 2: Month picker ───────────────────────────────────
  html += _hBuildMonthPicker();
  area.innerHTML = html;
}

// ── Util sub selection ─────────────────────────────────────
function _hSelectUtilSub(sub) {
  window._rHarianUtilSub = sub;
  window._rHarianMonth   = null;
  _hRenderSteps();
  document.getElementById('harian-data-area').innerHTML = '';
}

// ── Month picker ───────────────────────────────────────────
function _hBuildMonthPicker() {
  const now       = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed

  // Show current year months; months after current are greyed out (no data yet)
  const months = [
    'JAN','FEB','MAR','APR','MAY','JUN',
    'JUL','AUG','SEP','OKT','NOV','DES'
  ];

  const subLabel = window._rHarianTab === 'utility'
    ? ` — ${window._rHarianUtilSub ? window._rHarianUtilSub.toUpperCase() : ''}`
    : '';

  let cells = months.map((m, i) => {
    const monthKey = `${thisYear}-${String(i+1).padStart(2,'0')}`;
    const isPast   = i <= thisMonth;
    const isActive = window._rHarianMonth === monthKey;

    const basePad   = 'padding:8px 0;border-radius:8px;font-size:12px;font-weight:700;min-width:54px;text-align:center;transition:all .12s;';
    let style, onclick;
    if (!isPast) {
      // Future / no data: grey, disabled
      style   = basePad + 'border:1.5px solid #e5e7eb;background:#f9fafb;color:#d1d5db;cursor:not-allowed;';
      onclick = '';
    } else if (isActive) {
      style   = basePad + 'border:2px solid var(--blue);background:var(--blue);color:#fff;cursor:pointer;';
      onclick = `onclick="_hSelectMonth('${monthKey}')"`;
    } else {
      style   = basePad + 'border:1.5px solid var(--border);background:var(--bg);color:var(--txt);cursor:pointer;';
      onclick = `onclick="_hSelectMonth('${monthKey}')"`;
    }
    return `<button ${onclick} style="${style}" ${!isPast ? 'disabled' : ''}>${m}</button>`;
  }).join('');

  return `<div style="margin-bottom:14px;">
    <div style="font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:.6px;margin-bottom:8px;">PILIH BULAN ${thisYear}${subLabel}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:320px;">
      ${cells}
    </div>
  </div>`;
}

// ── Month selection ────────────────────────────────────────
function _hSelectMonth(monthKey) {
  window._rHarianMonth = monthKey;
  // Refresh month picker to highlight selected
  const area = document.getElementById('harian-step-area');
  if (area) area.innerHTML = _hBuildMonthPicker();
  _hLoadData();
}

// ── Data loader ────────────────────────────────────────────
async function _hLoadData() {
  const dataArea = document.getElementById('harian-data-area');
  if (!dataArea) return;
  dataArea.innerHTML = '<div style="text-align:center;padding:32px;color:var(--txt3)">⏳ Memuat data...</div>';

  const tab   = window._rHarianTab;
  const month = window._rHarianMonth;
  const sub   = window._rHarianUtilSub;
  if (!month) return;

  const [year, mon] = month.split('-');
  const dateFrom = `${year}-${mon}-01`;
  const lastDay  = new Date(+year, +mon, 0).getDate();
  const dateTo   = `${year}-${mon}-${lastDay}`;

  const endpointMap = {
    'lab':     '/api/dataentry/laboratorium-harian',
    'utility': '/api/dataentry/utility?tipe=harian',
    'limbah':  '/api/dataentry/limbah-harian',
  };

  let url = endpointMap[tab] + (endpointMap[tab].includes('?') ? '&' : '?') + 'limit=200';
  url += `&tanggal_dari=${dateFrom}&tanggal_sampai=${dateTo}`;

  try {
    const res  = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    let data = [...(json.data || [])].sort((a, b) => {
      // Use created_at if available (has time info), otherwise use tanggal
      // For date-only strings (YYYY-MM-DD), append T00:00:00 to avoid UTC midnight shift
      const rawA = a.created_at || a.tanggal || '';
      const rawB = b.created_at || b.tanggal || '';
      const fixDate = s => s.length === 10 ? s + 'T00:00:00' : s;
      const dA = new Date(fixDate(rawA));
      const dB = new Date(fixDate(rawB));
      return window._rHarianSort === 'oldest' ? dA - dB : dB - dA;
    });

    // Filter utility by sub
    if (tab === 'utility' && sub) {
      const airSubs = ['air', 'air_baku', 'air_proses', 'air_sibel'];
      if (sub === 'air') {
        data = data.filter(e => airSubs.includes(e.kategori));
      } else {
        data = data.filter(e => e.kategori === sub);
      }
    }

    // Update count label if exists
    const countLabel = document.getElementById('report-count-label');
    if (countLabel) countLabel.textContent = data.length + ' laporan';

    if (!data.length) {
      dataArea.innerHTML = `<div style="text-align:center;padding:48px 20px;background:var(--bg);border:1px dashed var(--border);border-radius:12px;">
        <div style="font-size:40px;margin-bottom:12px;opacity:.2">📭</div>
        <div style="font-size:14px;color:var(--txt2);font-weight:600;">Belum ada data untuk bulan ini</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:4px;">Coba pilih bulan lain</div>
      </div>`;
      return;
    }

    // Render by type
    if (tab === 'air' || (tab === 'utility' && sub === 'air')) {
      dataArea.innerHTML = _hRenderAirGrid(data);
    } else {
      dataArea.innerHTML = _hRenderListView(data, tab, sub);
    }

  } catch(err) {
    console.error('_hLoadData error:', err);
    dataArea.innerHTML = `<div style="text-align:center;padding:32px;color:var(--red)">❌ Gagal memuat: ${err.message}</div>`;
  }
}

// ── List view: Lab / Limbah / Listrik / Solar — grouped by date ──
function _hRenderListView(data, tab, sub) {
  const utilKatMeta = {
    'solar':      { bg:'#fff7ed', border:'#fb923c', text:'#9a3412', icon:'⛽', label:'Solar'        },
    'listrik':    { bg:'#fef9c3', border:'#facc15', text:'#713f12', icon:'⚡', label:'Listrik'       },
    'air':        { bg:'#eff6ff', border:'#60a5fa', text:'#1e3a5f', icon:'💧', label:'Air'           },
    'air_baku':   { bg:'#eff6ff', border:'#60a5fa', text:'#1e3a5f', icon:'💧', label:'Air Baku'      },
    'air_proses': { bg:'#eff6ff', border:'#3b82f6', text:'#1e40af', icon:'🔵', label:'Air Proses'    },
    'air_sibel':  { bg:'#e0e7ff', border:'#6366f1', text:'#3730a3', icon:'♨️', label:'Air Steam Gen' },
  };

  // ── Determine columns by tab/sub ──
  let cols = [];
  if (tab === 'lab') {
    return _hRenderLabTable(data);
  }
  // Safety: utility data should NEVER go through lab renderer
  // even if entries happen to have brix_entries field
  if (tab === 'limbah') {
    cols = [
      { key:'awal',      label:'AWAL',    sub:'m³'   },
      { key:'akhir',     label:'AKHIR',   sub:'m³'   },
      { key:'volume',    label:'VOLUME',  sub:'m³',   color:'var(--blue)' },
      { key:'cod',       label:'COD',     sub:'mg/L' },
      { key:'bod',       label:'BOD',     sub:'mg/L' },
      { key:'tss',       label:'TSS',     sub:'mg/L' },
      { key:'ph',        label:'pH',      sub:'',    color:'var(--orange,#f97316)' },
      { key:'jar_alum',  label:'PAC AVG', sub:'L/h',  color:'#7c3aed' },
      { key:'jar_total', label:'POLIMER AVG', sub:'L/h', color:'#4f46e5' },
    ];
  }
  if (tab === 'utility') {
    // Extract satuan from label e.g. '💧 Air Steam Generator (m³)' → 'm³'
    const firstLbl = (data[0] || {}).label || '';
    const satMatch = firstLbl.match(/\(([^)]+)\)\s*$/);
    const sat = satMatch ? satMatch[1] : ((data[0] || {}).satuan || '');
    cols = [
      { key:'awal',  label:'AWAL',  sub: sat },
      { key:'akhir', label:'AKHIR', sub: sat },
      { key:'total', label:'TOTAL', sub: sat, color:'var(--blue)' },
    ];
  }

  // ── Group by date (YYYY-MM-DD) ──
  const groups = {};
  const dateOrder = [];
  data.forEach(entry => {
    const d = _localDateKey(entry);
    if (!groups[d]) { groups[d] = []; dateOrder.push(d); }
    groups[d].push(entry);
  });
  // Sort dateOrder by selected sort direction
  dateOrder.sort((a, b) =>
    window._rHarianSort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a)
  );

  // Resolve satuan from first entry
  const firstEntry = data[0] || {};
  cols = cols.map(c => ({ ...c, sub: c.sub || firstEntry.satuan || '' }));

  const thStyle = `padding:8px 10px;font-size:9px;font-weight:800;color:var(--txt3);letter-spacing:.7px;text-transform:uppercase;text-align:center;border-bottom:2px solid var(--border);white-space:nowrap;`;
  const tdStyle = `padding:9px 10px;font-size:14px;font-weight:800;font-family:'DM Mono',monospace;text-align:center;color:var(--txt);border-bottom:1px solid var(--border);`;

  // Tanggal hari ini (lokal)
  const _today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();

  let html = '<div style="display:flex;flex-direction:column;gap:14px;">';

  dateOrder.forEach(date => {
    const entries = groups[date];
    const isToday = (date === _today);
    const d = _parseLocalDate(date);
    const dayName = d.toLocaleDateString('id-ID', { weekday:'long' });
    const dateFmt = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

    html += `
    <div style="border-radius:10px;overflow:hidden;border:1px solid var(--border);">
      <!-- Date header -->
      <div style="background:#f0f0ff;border-bottom:2px solid #c7d2fe;padding:9px 14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;">📅</span>
          <span style="font-size:13px;font-weight:800;color:#3730a3;">${dayName}, ${dateFmt}</span>
        </div>
        <span style="font-size:11px;font-weight:700;color:#6366f1;background:#e0e7ff;padding:2px 10px;border-radius:99px;">${entries.length} entry</span>
      </div>
      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;background:var(--surface);">
        <thead>
          <tr style="background:var(--bg);">
            <th style="${thStyle}text-align:left;">JAM ENTRY</th>
            ${tab === 'utility' ? `<th style="${thStyle}text-align:left;">JENIS</th>` : ''}
            ${tab === 'limbah' ? `<th style="${thStyle}text-align:left;">PROJECT</th>` : ''}
            ${cols.map(c => `<th style="${thStyle}">${c.label}${c.sub ? `<br><span style="font-size:8px;font-weight:600;color:var(--txt3)">${c.sub}</span>` : ''}</th>`).join('')}
            <th style="${thStyle}">NOTES</th>
          </tr>
        </thead>
        <tbody>`;

    entries.forEach((entry, i) => {
      const isLast = i === entries.length - 1;
      const timeStr = isToday && entry.created_at
        ? new Date(entry.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(/\./g,'.')
        : '—';
      const kat = entry.kategori ? (utilKatMeta[entry.kategori] || { icon:'📊', label:entry.kategori }) : null;
      const proj = entry.project_name || '';
      const notes = entry.notes || '';

      html += `<tr style="background:${i%2===0?'var(--surface)':'var(--bg)'};">
        <td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:13px;color:var(--txt2);">
          ${timeStr === '—'
            ? `<span style="color:var(--txt3);font-size:13px;font-weight:600;">—</span>`
            : `<span style="font-size:11px;color:var(--txt3);">🕐</span> ${timeStr}`}
        </td>`;

      if (tab === 'utility') {
        // Use entry.label (cleaner than kategori code)
        const rawLbl  = entry.label || '';
        // Strip leading emoji/spaces: keep text after them
        const cleanLbl = rawLbl.replace(/^[^a-zA-Z]+/, '').trim() || (kat ? kat.label : (entry.kategori || '—'));
        html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:11px;font-weight:600;color:var(--txt2);">${cleanLbl}</td>`;
      }
      if (tab === 'limbah') {
        html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:11px;font-weight:600;color:var(--txt2);">${proj || '—'}</td>`;
      }

      cols.forEach(c => {
        const v = entry[c.key];
        const display = (v != null && v !== '') ? v : '—';
        const color = (v != null && v !== '' && c.color) ? c.color : 'var(--txt)';
        html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:${color};">${display}</td>`;
      });

      html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}font-size:11px;font-weight:400;color:var(--txt3);text-align:left;">${notes || '—'}</td>`;
      html += `</tr>`;
    });

    html += `</tbody></table>`;

    // ── Detail Jar Test per sampel (kalau ada jar_entries) ──
    if (tab === 'limbah') {
      const jarEntriesAll = entries
        .map(e => {
          let ents = [];
          try {
            if (Array.isArray(e.jar_entries)) ents = e.jar_entries;
            else if (typeof e.jar_entries === 'string' && e.jar_entries) ents = JSON.parse(e.jar_entries);
            else ents = [];
          } catch { ents = []; }
          return { entry: e, ents };
        })
        .filter(x => x.ents && x.ents.length);

      if (jarEntriesAll.length) {
        let maxSampel = 0;
        jarEntriesAll.forEach(x => { if (x.ents.length > maxSampel) maxSampel = x.ents.length; });

        const jarFields = [
          { key: 'ph',     label: 'pH'                   },
          { key: 'pac',    label: 'PAC (ml)'              },
          { key: 'dozPac', label: 'Dozing PAC (L/h)'      },
          { key: 'pol',    label: 'Polimer (ml)'          },
          { key: 'dozPol', label: 'Dozing Polimer (L/h)'  },
        ];

        let jarThead = `<tr style="background:#faf5ff;"><th style="${thStyle}text-align:left;">Sampel / Parameter</th>`;
        jarEntriesAll.forEach((x, i) => {
          const timeStr = isToday && x.entry.created_at
            ? new Date(x.entry.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })
            : '—';
          jarThead += `<th style="${thStyle}">Entry #${i+1}<br><span style="font-size:8px;font-weight:400;color:var(--txt3)">${timeStr}</span></th>`;
        });
        jarThead += `</tr>`;

        let jarTbody = '';
        for (let sIdx = 0; sIdx < maxSampel; sIdx++) {
          jarTbody += `<tr><td colspan="${jarEntriesAll.length + 1}" style="padding:6px 10px;background:#f5f3ff;font-size:10px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);">🧪 Sampel ${sIdx + 1}</td></tr>`;
          jarFields.forEach(({ key, label }, fIdx) => {
            const rowBg = fIdx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
            let rowHtml = `<td style="padding:7px 10px;padding-left:20px;border-bottom:1px solid var(--border);text-align:left;font-size:12px;color:var(--txt2);background:${rowBg};">${label}</td>`;
            jarEntriesAll.forEach(x => {
              const v = x.ents[sIdx]?.[key];
              const hasVal = v !== null && v !== undefined && String(v).trim() !== '';
              rowHtml += hasVal
                ? `<td style="padding:7px 10px;border-bottom:1px solid var(--border);text-align:center;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:#7c3aed;background:${rowBg};">${v}</td>`
                : `<td style="padding:7px 10px;border-bottom:1px solid var(--border);text-align:center;color:var(--txt3);font-size:12px;background:${rowBg};">—</td>`;
            });
            jarTbody += `<tr>${rowHtml}</tr>`;
          });
        }

        html += `
          <div style="padding:6px 14px 10px;background:#faf5ff;border-top:1px solid #e9d5ff;">
            <button onclick="_hShowJarModal('jar-modal-${date}')"
              style="font-size:12px;font-weight:700;padding:5px 16px;border-radius:8px;border:1.5px solid #7c3aed;background:#f5f3ff;color:#6d28d9;cursor:pointer;">
              🧪 Detail Jar Test
            </button>
          </div>

          <!-- Modal Jar Test untuk tanggal ${date} -->
          <div id="jar-modal-${date}" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);align-items:center;justify-content:center;">
            <div style="background:var(--surface,#fff);border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.22);width:max-content;max-width:min(95vw,680px);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">
              <div style="padding:10px 14px;background:#f5f3ff;border-bottom:1.5px solid #e9d5ff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:15px;">🧪</span>
                  <span style="font-size:13px;font-weight:800;color:#6d28d9;">DETAIL JAR TEST</span>
                  <span style="font-size:10px;font-weight:600;color:#a78bfa;background:#ede9fe;padding:2px 8px;border-radius:99px;">${dateFmt}</span>
                </div>
                <button onclick="_hCloseJarModal('jar-modal-${date}')"
                  style="font-size:20px;color:#9ca3af;background:none;border:none;cursor:pointer;line-height:1;padding:0 4px;">&times;</button>
              </div>
              <div style="overflow-y:auto;padding:10px 12px;">
                <table style="width:auto;min-width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#f5f3ff;">
                      <th style="padding:5px 8px;text-align:left;font-size:10px;font-weight:800;color:#6d28d9;border-bottom:2px solid #e9d5ff;white-space:nowrap;width:1%;">PARAMETER</th>
                      ${jarEntriesAll.map((x, i) => {
                        const t = (isToday && x.entry.created_at)
                          ? new Date(x.entry.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
                          : '—';
                        return `<th style="padding:5px 8px;text-align:center;font-size:10px;font-weight:800;color:#6d28d9;border-bottom:2px solid #e9d5ff;white-space:nowrap;">Entry #${i+1}<br><span style="font-size:8px;font-weight:500;color:#a78bfa;">${t}</span></th>`;
                      }).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${Array.from({length: maxSampel}, (_, sIdx) => {
                      const sampelRow = `<tr><td colspan="${jarEntriesAll.length+1}" style="padding:4px 8px;background:#ede9fe;font-size:10px;font-weight:800;color:#6d28d9;letter-spacing:.4px;">✦ SAMPEL ${sIdx+1}</td></tr>`;
                      const fieldRows = [
                        {key:'ph',     label:'pH'},
                        {key:'pac',    label:'PAC (ml)'},
                        {key:'dozPac', label:'Dozing PAC (L/h)'},
                        {key:'pol',    label:'Polimer (ml)'},
                        {key:'dozPol', label:'Dozing Polimer (L/h)'},
                      ].map(({key, label}, fIdx) => {
                        const bg = fIdx%2===0 ? 'var(--surface,#fff)' : '#faf5ff';
                        const cells = jarEntriesAll.map(x => {
                          const v = x.ents[sIdx]?.[key];
                          const ok = v !== null && v !== undefined && String(v).trim() !== '';
                          return ok
                            ? `<td style="padding:4px 8px;text-align:center;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:#7c3aed;border-bottom:1px solid #ede9fe;background:${bg};">${v}</td>`
                            : `<td style="padding:4px 8px;text-align:center;font-size:12px;color:#d1d5db;border-bottom:1px solid #ede9fe;background:${bg};">—</td>`;
                        }).join('');
                        return `<tr><td style="padding:4px 8px 4px 14px;font-size:11px;color:var(--txt2,#374151);border-bottom:1px solid #ede9fe;background:${bg};white-space:nowrap;width:1%;">${label}</td>${cells}</tr>`;
                      }).join('');
                      return sampelRow + fieldRows;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              <div style="padding:8px 12px;border-top:1px solid #e9d5ff;background:#faf5ff;display:flex;justify-content:flex-end;flex-shrink:0;">
                <button onclick="_hCloseJarModal('jar-modal-${date}')"
                  style="font-size:12px;font-weight:700;padding:5px 18px;border-radius:8px;border:none;background:#7c3aed;color:#fff;cursor:pointer;">Tutup</button>
              </div>
            </div>
          </div>`;
      }
    }

    html += `</div>`;
  });

  html += '</div>';
  return html;
}

// ── Lab table: grouped by date, rows per brix/moisture entry ──
function _hRenderLabTable(data) {
  // Group by date
  const groups = {};
  const dateOrder = [];
  data.forEach(entry => {
    const d = _localDateKey(entry);
    if (!groups[d]) { groups[d] = []; dateOrder.push(d); }
    groups[d].push(entry);
  });

  // Sort dateOrder by selected sort direction
  dateOrder.sort((a, b) =>
    window._rHarianSort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a)
  );

  const thStyle = `padding:8px 10px;font-size:9px;font-weight:800;color:var(--txt3);letter-spacing:.7px;text-align:center;border-bottom:2px solid var(--border);white-space:nowrap;`;
  const tdStyle = `padding:9px 10px;font-size:13px;font-weight:700;font-family:'DM Mono',monospace;text-align:center;border-bottom:1px solid var(--border);`;

  // Tanggal hari ini dalam format YYYY-MM-DD (lokal)
  const _today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  })();

  let html = '<div style="display:flex;flex-direction:column;gap:14px;">';

  dateOrder.forEach(date => {
    const dayEntries = groups[date];
    const d = _parseLocalDate(date);
    const dayName = d.toLocaleDateString('id-ID', { weekday:'long' });
    const dateFmt = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

    // Flatten all brix+moisture rows across entries for this date
    const isToday = (date === _today);
    const rows = [];
    dayEntries.forEach(entry => {
      // Kalau entry bukan hari ini → jam ditampilkan sebagai '-'
      const timeStr = isToday && entry.created_at
        ? new Date(entry.created_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(/\./g,'.')
        : '—';
      const brix  = Array.isArray(entry.brix_entries)     ? entry.brix_entries     : [];
      const moist = Array.isArray(entry.moisture_entries) ? entry.moisture_entries : [];

      if (!brix.length && !moist.length) {
        // Old format: parse notes
        const rawNotes = (entry.notes || '').trim();
        const blocks = rawNotes.split(/(?=\[)/).filter(s => s.trim());
        blocks.forEach(block => {
          const nameMatch = block.match(/^\[([^\]]+)\]/);
          const name = nameMatch ? nameMatch[1] : '—';
          const rest = block.replace(/^\[[^\]]+\]\s*\|?\s*/, '');
          const fields = rest.split('|').map(s => s.trim()).filter(Boolean);
          const fieldsMap = {};
          fields.forEach(f => {
            const [k, ...v] = f.split(':');
            if (k && v.length) fieldsMap[k.trim().toLowerCase()] = v.join(':').trim();
          });
          rows.push({ time: timeStr, type:'lab', sample: name,
            ph: fieldsMap['ph']||null, tds: fieldsMap['tds']||null,
            hardness: fieldsMap['hardness']||null, alkaline: fieldsMap['alkali']||fieldsMap['alkaline']||null,
            value: null, unit: null, notes: entry.notes ? '' : '' });
        });
        if (!blocks.length) {
          rows.push({ time: timeStr, type:'lab', sample:'—', ph:null, tds:null, hardness:null, alkaline:null, value:null, unit:null });
        }
        return;
      }

      brix.forEach(b => {
        rows.push({ time: timeStr, type:'brix', sample: b.sample||b.nama||'—',
          value: b.brix ?? b['air-test'] ?? b.nilai ?? b.value ?? '—', unit: b.unit||'°Bx',
          ph: null, tds: null, hardness: null, alkaline: null,
          location: b.location||b.lokasi||'', notes: b.notes||b.catatan||'' });
      });
      moist.forEach(m => {
        rows.push({ time: timeStr, type:'moisture', sample: m.sample||m.nama||'—',
          value: m.mc ?? m.moisture ?? m.nilai ?? m.value ?? '—', unit: m.unit||'MC%',
          ph: null, tds: null, hardness: null, alkaline: null,
          location: m.location||m.lokasi||'', notes: m.notes||m.catatan||'' });
      });
    });

    // Detect which columns have any data
    const hasBrix    = rows.some(r => r.type === 'brix');
    const hasMoist   = rows.some(r => r.type === 'moisture');
    const hasLab     = rows.some(r => r.type === 'lab');
    const hasPh      = rows.some(r => r.ph != null);
    const hasTds     = rows.some(r => r.tds != null);
    const hasHard    = rows.some(r => r.hardness != null);
    const hasAlk     = rows.some(r => r.alkaline != null);
    const hasNotes   = rows.some(r => r.notes && r.notes.trim());

    let totalEntries = dayEntries.length;

    html += `
    <div style="border-radius:10px;overflow:hidden;border:1px solid var(--border);">
      <div style="background:#f0f0ff;border-bottom:2px solid #c7d2fe;padding:9px 14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;">📅</span>
          <span style="font-size:13px;font-weight:800;color:#3730a3;">${dayName}, ${dateFmt}</span>
        </div>
        <span style="font-size:11px;font-weight:700;color:#6366f1;background:#e0e7ff;padding:2px 10px;border-radius:99px;">${rows.length} entry</span>
      </div>
      <table style="width:100%;border-collapse:collapse;background:var(--surface);">
        <thead>
          <tr style="background:var(--bg);">
            <th style="${thStyle}text-align:left;">${isToday ? 'JAM ENTRY' : 'JAM ENTRY'}</th>
            <th style="${thStyle}text-align:left;">SAMPLE</th>
            ${hasBrix||hasMoist ? `<th style="${thStyle}">TIPE</th><th style="${thStyle}">NILAI<br><span style="font-size:8px;font-weight:600;color:var(--txt3)">—</span></th>` : ''}
            ${hasPh  ? `<th style="${thStyle};color:var(--orange,#f97316);">PH</th>` : ''}
            ${hasTds ? `<th style="${thStyle}">TDS<br><span style="font-size:8px;font-weight:600">PPM</span></th>` : ''}
            ${hasHard? `<th style="${thStyle}">HARDNESS<br><span style="font-size:8px;font-weight:600">MG/L</span></th>` : ''}
            ${hasAlk ? `<th style="${thStyle}">ALKALINE<br><span style="font-size:8px;font-weight:600">MG/L</span></th>` : ''}
            ${hasNotes ? `<th style="${thStyle}text-align:left;">NOTES</th>` : ''}
          </tr>
        </thead>
        <tbody>`;

    rows.forEach((row, i) => {
      const isLast = i === rows.length - 1;
      const typeBadge = row.type === 'brix'
        ? `<span style="background:#ede9fe;color:#6d28d9;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;">BRIX</span>`
        : row.type === 'moisture'
        ? `<span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;">MOIST</span>`
        : `<span style="background:#f0f0ff;color:#3730a3;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;">LAB</span>`;

      html += `<tr style="background:${i%2===0?'var(--surface)':'var(--bg)'};">
        <td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:12px;color:var(--txt2);">
          ${row.time === '—'
            ? `<span style="color:var(--txt3);font-size:13px;font-weight:600;">—</span>`
            : `<span style="font-size:11px;color:var(--txt3);">🕐</span> ${row.time}`}
        </td>
        <td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:12px;font-weight:700;color:var(--txt);">
          ${row.sample}
          ${row.location ? `<div style="font-size:10px;font-weight:400;color:var(--txt3)">📍 ${row.location}</div>` : ''}
        </td>`;

      if (hasBrix||hasMoist) {
        html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}">${typeBadge}</td>`;
        html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--blue);">`;
        if (row.value != null) html += `${row.value} <span style="font-size:9px;color:var(--txt3)">${row.unit||''}</span>`;
        else html += `—`;
        html += `</td>`;
      }
      if (hasPh)    html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--orange,#f97316);">${row.ph??'—'}</td>`;
      if (hasTds)   html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--txt);">${row.tds??'—'}</td>`;
      if (hasHard)  html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--txt);">${row.hardness??'—'}</td>`;
      if (hasAlk)   html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--txt);">${row.alkaline??'—'}</td>`;
      if (hasNotes) html += `<td style="${tdStyle}${isLast?'border-bottom:none;':''}font-size:11px;font-weight:400;color:var(--txt3);text-align:left;">${row.notes||'—'}</td>`;

      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
  });

  html += '</div>';
  return html;
}


// ── Air: grouped-by-date table per kategori ───────────────
function _hRenderAirGrid(data) {
  // Group by kategori then by date
  const katOrder = ['air_baku','air_proses','air_sibel','air'];
  const katMeta  = {
    'air':        { icon:'💧', label:'Air',           border:'#60a5fa', bg:'#eff6ff', text:'#1e3a5f',  headerBg:'#dbeafe' },
    'air_baku':   { icon:'💧', label:'Air Baku',       border:'#60a5fa', bg:'#eff6ff', text:'#1e3a5f',  headerBg:'#dbeafe' },
    'air_proses': { icon:'🔵', label:'Air Proses',     border:'#3b82f6', bg:'#dbeafe', text:'#1e40af',  headerBg:'#bfdbfe' },
    'air_sibel':  { icon:'♨️', label:'Air Steam Gen',  border:'#6366f1', bg:'#e0e7ff', text:'#3730a3',  headerBg:'#c7d2fe' },
  };

  const byKat = {};
  data.forEach(e => {
    const k = e.kategori || 'air';
    if (!byKat[k]) byKat[k] = {};
    const d = _localDateKey(e);
    if (!byKat[k][d]) byKat[k][d] = [];
    byKat[k][d].push(e);
  });

  const thStyle = `padding:8px 10px;font-size:9px;font-weight:800;color:var(--txt3);letter-spacing:.7px;text-align:center;border-bottom:2px solid var(--border);white-space:nowrap;`;
  const tdStyle = `padding:9px 10px;font-size:14px;font-weight:800;font-family:'DM Mono',monospace;text-align:center;border-bottom:1px solid var(--border);`;

  let html = '<div style="display:flex;flex-direction:column;gap:20px;">';

  const kats = [...new Set([...katOrder, ...Object.keys(byKat)])].filter(k => byKat[k]);

  kats.forEach(kat => {
    const m = katMeta[kat] || { icon:'💧', label:kat, border:'#60a5fa', bg:'#eff6ff', text:'#1e3a5f', headerBg:'#dbeafe' };
    const dateGroups = byKat[kat];
    const sortedDates = Object.keys(dateGroups).sort((a,b) =>
      window._rHarianSort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a));

    const totalEntries = Object.values(dateGroups).reduce((s,arr)=>s+arr.length,0);

    html += `<div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:10px 14px;background:${m.bg};border-radius:10px 10px 0 0;border:1.5px solid ${m.border}50;border-bottom:2px solid ${m.border};">
        <span style="font-size:16px;">${m.icon}</span>
        <span style="font-size:13px;font-weight:800;color:${m.text};letter-spacing:.3px;">${m.label.toUpperCase()}</span>
        <span style="font-size:11px;color:var(--txt3);font-weight:600;margin-left:auto;">${totalEntries} entri</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:4px;">`;

    sortedDates.forEach(date => {
      const entries = dateGroups[date];
      const d = _parseLocalDate(date);
      const dayName = d.toLocaleDateString('id-ID', { weekday:'long' });
      const dateFmt = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
      const firstEntryLbl = entries[0]?.label || '';
      const satM = firstEntryLbl.match(/\(([^)]+)\)\s*$/);
      const sat = satM ? satM[1] : (entries[0]?.satuan || 'm³');

      html += `
      <div style="border-radius:8px;overflow:hidden;border:1px solid ${m.border}40;">
        <div style="background:${m.headerBg};border-bottom:1.5px solid ${m.border}50;padding:7px 12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:800;color:${m.text};">📅 ${dayName}, ${dateFmt}</span>
          <span style="font-size:10px;font-weight:700;color:${m.text};background:white;padding:1px 8px;border-radius:99px;">${entries.length} entry</span>
        </div>
        <table style="width:100%;border-collapse:collapse;background:var(--surface);">
          <thead>
            <tr style="background:var(--bg);">
              <th style="${thStyle}text-align:left;">JAM ENTRY</th>
              <th style="${thStyle}">AWAL<br><span style="font-size:8px;font-weight:600">${sat}</span></th>
              <th style="${thStyle}">AKHIR<br><span style="font-size:8px;font-weight:600">${sat}</span></th>
              <th style="${thStyle};color:${m.text};">TOTAL<br><span style="font-size:8px;font-weight:600">${sat}</span></th>
              <th style="${thStyle}">NOTES</th>
            </tr>
          </thead>
          <tbody>`;

      entries.forEach((entry, i) => {
        const isLast = i === entries.length - 1;
        const timeStr = entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(/\./g,'.')
          : '—';
        const loc   = entry.lokasi||entry.location||'';
        const notes = entry.notes||'';

        html += `<tr style="background:${i%2===0?'var(--surface)':'var(--bg)'};">
          <td style="${tdStyle}${isLast?'border-bottom:none;':''}text-align:left;font-size:12px;color:var(--txt2);">
            <span style="font-size:11px;color:var(--txt3);">🕐</span> ${timeStr}
            ${loc ? `<div style="font-size:10px;color:var(--txt3);">📍 ${loc}</div>` : ''}
          </td>
          <td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--txt);">${entry.awal??'—'}</td>
          <td style="${tdStyle}${isLast?'border-bottom:none;':''}color:var(--txt);">${entry.akhir??'—'}</td>
          <td style="${tdStyle}${isLast?'border-bottom:none;':''}color:${m.text};background:${m.bg};">${entry.total??'—'}</td>
          <td style="${tdStyle}${isLast?'border-bottom:none;':''}font-size:11px;font-weight:400;color:var(--txt3);text-align:left;">${notes||'—'}</td>
        </tr>`;
      });

      html += `</tbody></table></div>`;
    });

    html += `</div></div>`;
  });

  html += '</div>';
  return html;
}


// ══ REPORTING HELPERS
// ══ REPORTING HELPERS ═════════════════════════════════════════
async function submitReport() {
  const g = id => document.getElementById(id)?.value?.trim();
  const title = g('r-title'), nama = g('r-nama'), desc = g('r-deskripsi');
  if (!title || !nama || !desc) { showRpSt('error', '❌ Please fill in Title, Reporter Name, and Description!'); return; }
  showRpSt('loading', '⏳ Submitting report...');
  try {
    const res = await fetch('/api/dataentry/laporan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        nama,
        shift:     g('r-shift')     || null,
        kategori:  g('r-kategori')  || null,
        prioritas: g('r-prioritas') || null,
        lokasi:    g('r-lokasi')    || null,
        deskripsi: desc,
        aksi:      g('r-aksi')      || null,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal simpan');
    showRpSt('success', '✅ Report submitted successfully!');
    resetReport();
    loadReportHistory();
  } catch(err) {
    console.error('submitReport error:', err);
    showRpSt('error', '❌ Gagal: ' + err.message);
  }
}
function resetReport() {
  ['r-title','r-nama','r-lokasi','r-deskripsi','r-aksi'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['r-shift','r-kategori','r-prioritas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });
}
function showRpSt(type, msg) {
  const b = document.getElementById('rp-sb'), m = document.getElementById('rp-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type === 'success') setTimeout(() => { if (b) b.style.display = 'none'; }, 4000);
}
async function loadReportHistory() {
  const c = document.getElementById('rp-history'); if (!c) return;
  try {
    const res  = await fetch('/api/dataentry/laporan?limit=50');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    const hist = json.data || [];
    if (!hist.length) { c.innerHTML = '<div class="de-empty">No reports submitted yet</div>'; return; }
    const priColor = {low:'var(--green)', medium:'var(--yellow)', high:'var(--red)'};
    const priLabel = {low:'LOW', medium:'MEDIUM', high:'HIGH'};
    const catLabel = {teknis:'Technical', operasional:'Operational', keamanan:'Security', lingkungan:'Environmental', lainnya:'Other'};
    const shiftLabel = {pagi:'🌅 Morning', siang:'☀️ Afternoon', malam:'🌙 Night'};
    c.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' +
      hist.map(r => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-left:3px solid ${priColor[r.prioritas]||'var(--blue)'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">
            <div style="font-weight:700;font-size:13px;color:var(--txt)">${r.title}</div>
            ${r.prioritas ? `<div style="font-size:10px;font-weight:700;color:${priColor[r.prioritas]||'var(--blue)'};background:${priColor[r.prioritas]||'var(--blue)'}15;padding:2px 8px;border-radius:4px">${priLabel[r.prioritas]||r.prioritas}</div>` : ''}
          </div>
          <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">
            👤 ${r.nama} ${r.shift ? '• '+shiftLabel[r.shift] : ''} ${r.kategori ? '• '+catLabel[r.kategori] : ''} ${r.lokasi ? '• 📍 '+r.lokasi : ''}
          </div>
          <div style="font-size:12px;color:var(--txt2)">${r.deskripsi}</div>
          ${r.aksi ? `<div style="font-size:11px;color:var(--txt3);margin-top:6px;border-top:1px solid var(--border);padding-top:6px">⚡ ${r.aksi}</div>` : ''}
          <div style="font-size:10px;color:var(--txt3);margin-top:6px">${new Date(r.created_at).toLocaleString('id-ID')}</div>
        </div>`).join('') + '</div>';
  } catch(err) {
    c.innerHTML = `<div style="color:var(--red);font-size:12px">❌ Gagal memuat: ${err.message}</div>`;
  }
}



// ═══════════════════════════════════════════════════════════
// SENSOR MANAGER — Add / Edit / Delete sensors dynamically
// Data tersimpan di localStorage('tank_sensors')
// Dashboard membaca otomatis tanpa ubah kode
// ═══════════════════════════════════════════════════════════

const SENSOR_COL_NAMES = ['Biru','Ungu','Hijau','Oranye','Kuning','Merah'];
// ── Jar Test Modal helpers ──────────────────────────────────
function _hShowJarModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  // Tutup modal kalau klik backdrop
  el.onclick = function(e) { if (e.target === el) _hCloseJarModal(id); };
}
function _hCloseJarModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
window._hShowJarModal  = _hShowJarModal;
window._hCloseJarModal = _hCloseJarModal;