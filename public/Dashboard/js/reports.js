function initReportingForm() {
  renderHarianReports();
}

async function renderHarianReports() {
    const container = document.getElementById('harian-reports-container');
    const countLabel = document.getElementById('report-count-label');
    if (!container) return;

    // Tab Laporan Harian - setiap tab baca dari tabel harian terpisah
    const tabEndpoint = {
      'lab':     '/api/dataentry/laboratorium-harian',
      'utility': '/api/dataentry/utility?tipe=harian',
      'limbah':  '/api/dataentry/limbah-harian',
    };
    const tabColors = {
      'lab':     { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8', label: 'Lab' },
      'utility': { bg: '#fef08a', border: '#eab308', text: '#713f12', label: 'Utility' },
      'limbah':  { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'Limbah' },
    };

    // Label & warna per kategori utility
    const utilKatColors = {
      'solar':     { bg: '#fff7ed', border: '#fb923c', text: '#9a3412', icon: '⛽', label: 'Solar' },
      'listrik':   { bg: '#fef9c3', border: '#facc15', text: '#713f12', icon: '⚡', label: 'Listrik' },
      'air':       { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a5f', icon: '💧', label: 'Air' },
      'air_baku':  { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a5f', icon: '💧', label: 'Air Baku' },
      'air_proses':{ bg: '#eff6ff', border: '#60a5fa', text: '#1e3a5f', icon: '💧', label: 'Air Proses' },
      'air_sibel': { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a5f', icon: '💧', label: 'Air Steam Gen' },
    };

    const endpoint = tabEndpoint[_activeReportTab];
    if (!endpoint) return;

    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--txt3)">⏳ Memuat data...</div>`;

    try {
      const dateFrom = document.getElementById('report-date-from')?.value;
      const dateTo   = document.getElementById('report-date-to')?.value;
      let url = endpoint + (endpoint.includes('?') ? '&' : '?') + 'limit=200';
      if (dateFrom) url += '&tanggal_dari=' + dateFrom;
      if (dateTo)   url += '&tanggal_sampai=' + dateTo;

      const res  = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      let data = json.data || [];
      // Data sudah difilter di endpoint (tipe=harian / harian=1)
      // Tidak perlu filter tambahan di sini
      data = [...data].sort((a, b) => {
        const dA = new Date(a.created_at || a.tanggal);
        const dB = new Date(b.created_at || b.tanggal);
        return _reportSortBy === 'oldest' ? dA - dB : dB - dA;
      });

      if (countLabel) countLabel.textContent = `${data.length} laporan`;

      if (!data.length) {
        container.innerHTML = `
          <div class="de-card" style="text-align:center;padding:60px 20px;background:var(--bg);border:1px dashed var(--border);border-radius:12px">
            <div style="font-size:48px;margin-bottom:16px;opacity:0.2">📭</div>
            <div style="font-size:14px;color:var(--txt2);font-weight:600;margin-bottom:6px">Belum ada laporan untuk ${getTabLabel(_activeReportTab)}</div>
            <div style="font-size:12px;color:var(--txt3)">Data laporan harian akan muncul di sini</div>
          </div>`;
        return;
      }

      const color = tabColors[_activeReportTab] || { bg:'#f3f4f6', border:'#9ca3af', text:'#374151', label:'Data' };
      let html = '<div class="report-grid">';
      data.forEach(entry => {
        // Normalize tanggal — bisa berupa date string atau ISO timestamp
        const rawTgl  = entry.tanggal || entry.created_at || '';
        const tgl     = rawTgl ? rawTgl.substring(0, 10) : '—';
        const proj    = entry.project_name || '—';
        const savedAt = entry.created_at ? new Date(entry.created_at).toLocaleString('id-ID') : '—';
        const notes   = entry.notes || '—';

        // Badge utama
        let badge = `<div style="background:${color.bg};color:${color.text};border:1px solid ${color.border};border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600">${color.label}</div>`;

        // Badge kategori untuk utility (Solar / Listrik / Air)
        let katBadge = '';
        if (_activeReportTab === 'utility' && entry.kategori) {
          const kat = utilKatColors[entry.kategori] || { bg:'#f3f4f6', border:'#9ca3af', text:'#374151', icon:'📊', label: entry.label || entry.kategori };
          katBadge = `<div style="background:${kat.bg};color:${kat.text};border:1px solid ${kat.border};border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;margin-left:6px">${kat.icon} ${kat.label}</div>`;
        }

        // Data nilai per tab
        let valHtml = '';

        // Utility harian: awal/akhir/total
        if (_activeReportTab === 'utility' && (entry.awal != null || entry.total != null)) {
          valHtml = '<div style="display:flex;gap:16px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">';
          if (entry.awal  != null) valHtml += '<div><span style="font-size:10px;color:var(--txt3)">AWAL</span><div style="font-size:13px;font-weight:700;color:var(--txt);font-family:DM Mono,monospace">' + entry.awal  + '</div></div>';
          if (entry.akhir != null) valHtml += '<div><span style="font-size:10px;color:var(--txt3)">AKHIR</span><div style="font-size:13px;font-weight:700;color:var(--txt);font-family:DM Mono,monospace">' + entry.akhir + '</div></div>';
          if (entry.total != null) valHtml += '<div><span style="font-size:10px;color:var(--txt3)">TOTAL</span><div style="font-size:14px;font-weight:800;color:var(--blue);font-family:DM Mono,monospace">' + entry.total + '</div></div>';
          valHtml += '</div>';
        }

        // Lab: brix + moisture preview
        if (_activeReportTab === 'lab') {
          const brix  = Array.isArray(entry.brix_entries)     ? entry.brix_entries     : [];
          const moist = Array.isArray(entry.moisture_entries) ? entry.moisture_entries : [];
          let rows = '';
          if (brix.length) {
            rows += '<div style="margin-bottom:6px"><span style="font-size:10px;color:var(--txt3);font-weight:700">BRIX (' + brix.length + ' entry)</span>'
              + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'
              + brix.slice(0,4).map(b => '<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px"><b>' + (b.brix ?? b['air-test'] ?? '—') + '</b>°Bx' + (b.location ? ' · ' + b.location : '') + '</div>').join('')
              + (brix.length > 4 ? '<span style="font-size:10px;color:var(--txt3)">+' + (brix.length-4) + ' lagi</span>' : '')
              + '</div></div>';
          }
          if (moist.length) {
            rows += '<div><span style="font-size:10px;color:var(--txt3);font-weight:700">MOISTURE (' + moist.length + ' entry)</span>'
              + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'
              + moist.slice(0,4).map(m => '<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px"><b>' + (m.mc ?? m.moisture ?? m['sampling-point'] ?? m.value ?? '—') + '</b>%' + (m.sample ? ' · ' + m.sample : '') + '</div>').join('')
              + (moist.length > 4 ? '<span style="font-size:10px;color:var(--txt3)">+' + (moist.length-4) + ' lagi</span>' : '')
              + '</div></div>';
          }
          if (rows) valHtml = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' + rows + '</div>';
        }

        // Limbah: parameter kualitas
        if (_activeReportTab === 'limbah') {
          const lFields = [
            { key:'awal',          label:'Awal',  unit:'m³'   },
            { key:'akhir',         label:'Akhir', unit:'m³'   },
            { key:'volume',        label:'Vol',   unit:'m³'   },
            { key:'cod',           label:'COD',   unit:'mg/L' },
            { key:'bod',           label:'BOD',   unit:'mg/L' },
            { key:'tss',           label:'TSS',   unit:'mg/L' },
            { key:'ph',            label:'pH',    unit:''     },
            { key:'temp_effluent', label:'Temp',  unit:'°C'   },
          ].filter(f => entry[f.key] != null);
          if (lFields.length) {
            valHtml = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">'
              + lFields.map(f => '<div style="text-align:center"><div style="font-size:9px;color:var(--txt3);font-weight:700">' + f.label + '</div>'
                + '<div style="font-size:13px;font-weight:700;color:var(--txt);font-family:DM Mono,monospace">' + entry[f.key] + (f.unit ? '<span style="font-size:9px;color:var(--txt3)"> ' + f.unit + '</span>' : '') + '</div></div>').join('')
              + '</div>';
          }
        }

        html += `
          <div class="report-card" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">📅 ${tgl} — ${proj}</div>
                <div style="font-size:11px;color:var(--txt3)">🕐 ${savedAt}</div>
              </div>
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;justify-content:flex-end">${badge}${katBadge}</div>
            </div>
            ${valHtml}
            ${notes !== '—' ? `<div style="font-size:12px;color:var(--txt2);border-top:1px solid var(--border);padding-top:8px;margin-top:8px">📝 ${notes}</div>` : ''}
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;

    } catch(err) {
      console.error('renderHarianReports error:', err);
      container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--red)">❌ Gagal memuat data: ${err.message}</div>`;
    }
}


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