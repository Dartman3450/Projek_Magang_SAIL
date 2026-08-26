function gSJ()       { try { return JSON.parse(localStorage.getItem('sail_surat_jalan') || '[]'); } catch { return []; } }
function sSJ(list)   { localStorage.setItem('sail_surat_jalan', JSON.stringify(list)); }
window.gSJ = gSJ;
window.sSJ = sSJ;

function getSuratJalanHTML() {
  return `<div class="de-wrap">
  <div class="de-header">
    <div><div class="de-title">Surat Jalan</div><div class="de-sub">SAIL / Reporting / Surat Jalan</div></div>
    <button type="button" class="de-btn de-btn-primary" onclick="openSuratJalanForm()">＋ Buat Surat Jalan</button>
  </div>

  <div id="sj-list" style="display:flex;flex-direction:column;gap:12px"></div>
  <div id="sj-empty" style="display:none">
    <div class="de-card" style="text-align:center;padding:48px">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div style="font-size:13px;color:var(--txt3)">Belum ada surat jalan — klik <strong>＋ Buat Surat Jalan</strong>.</div>
    </div>
  </div>

  <div class="proj-modal-overlay" id="sj-modal-overlay" style="display:none;">
    <div class="proj-modal" style="max-width:680px">
      <div class="proj-modal-head">
        <div class="proj-modal-title" id="sj-modal-title">📋 Buat Surat Jalan</div>
        <button type="button" class="proj-modal-close" onclick="closeSuratJalanForm()">✕</button>
      </div>
      <div class="proj-modal-body">
        <div class="de-grid">
          <div class="de-field"><label class="de-label">TANGGAL</label><input class="de-input" id="sj-f-date" type="date"></div>
          <div class="de-field"><label class="de-label">NO. SURAT JALAN</label><input class="de-input" id="sj-f-no" type="text" placeholder="Otomatis atau isi manual"></div>
          <div class="de-field"><label class="de-label">NOPOL / KENDARAAN</label><input class="de-input" id="sj-f-kendaraan" type="text" placeholder="B 1234 XY / Nama ekspedisi..."></div>
          <div class="de-field"><label class="de-label">DRIVER</label><input class="de-input" id="sj-f-driver" type="text" placeholder="Nama driver..."></div>
          <div class="de-field de-full"><label class="de-label">TUJUAN *</label><input class="de-input" id="sj-f-penerima" type="text" placeholder="Nama perusahaan atau orang..."></div>
          <div class="de-field de-full"><label class="de-label">PENGIRIM (Gudang)</label><input class="de-input" id="sj-f-pengirim" type="text" placeholder="Nama pengirim dari gudang..."></div>
        </div>

        <!-- PILIH DARI KARTU STOK -->
        <div style="margin:14px 0 8px;font-size:11px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase">Daftar Barang</div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:150px">
            <div style="font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.8px;margin-bottom:4px">📦 PILIH KARTU STOK</div>
            <select class="de-input de-select" id="sj-kartu-picker" style="margin:0;font-size:11px" onchange="onSjKartuChange()">
              <option value="">-- Pilih produk --</option>
            </select>
          </div>
          <div style="flex:1;min-width:150px">
            <div style="font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.8px;margin-bottom:4px">🔖 NO. BATCH / SEAL</div>
            <select class="de-input de-select" id="sj-batch-picker" style="margin:0;font-size:11px" onchange="onSjBatchChange()">
              <option value="">-- Pilih batch --</option>
            </select>
          </div>
          <div style="width:80px">
            <div style="font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.8px;margin-bottom:4px">BERAT</div>
            <input class="de-input" id="sj-batch-qty" type="number" step="any" placeholder="0" style="margin:0;font-size:11px;text-align:center">
          </div>
          <button type="button" class="de-btn de-btn-primary" style="height:34px;font-size:11px;white-space:nowrap;flex-shrink:0" onclick="addSjItemFromKartu()">＋ Tambah</button>
        </div>

        <!-- Info stok produk terpilih -->
        <div id="sj-product-info" style="display:none;padding:8px 12px;background:#ecfdf5;border:1px solid #86efac;border-radius:6px;font-size:10px;color:#047857;margin-bottom:8px">
          <strong>📊 Stok Produk:</strong> <span id="sj-product-info-text">-</span>
        </div>

        <!-- HEADER TABEL ITEM -->
        <div style="display:grid;grid-template-columns:1.6fr 1.6fr 70px 1.4fr 30px;gap:4px;padding:6px 10px;background:#f1f5f9;border-radius:6px 6px 0 0;border:1px solid var(--border);border-bottom:none;align-items:center;">
          <div style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:.8px">KARTU STOK / PRODUK</div>
          <div style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:.8px">NO. BATCH / SEAL</div>
          <div style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:.8px;text-align:center">BERAT</div>
          <div style="font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:.8px">KETERANGAN</div>
          <div></div>
        </div>
        <div id="sj-items"></div>
        <button type="button" class="de-btn de-btn-ghost" style="width:100%;margin-bottom:14px;border-radius:0 0 6px 6px;border-top:none;font-size:12px;background:#f9fafb;" onclick="addSuratJalanItem()">＋ Tambah Manual</button>

        <div style="padding:8px 12px;background:#fefce8;border:1px solid #fde68a;border-radius:6px;font-size:10px;color:#92400e;margin-bottom:12px">
          ⚡ Saat disimpan, barang yang diambil dari Kartu Stok akan otomatis tercatat sebagai <strong>Barang Keluar (Debit)</strong> di kartu stok terkait.
        </div>

        <div class="de-field de-full"><label class="de-label">CATATAN</label><textarea class="de-input de-textarea" id="sj-f-notes" style="min-height:56px" placeholder="Catatan tambahan..."></textarea></div>
        <div class="de-status-bar" id="sj-sb" style="display:none"><span id="sj-sm"></span></div>
        <div class="de-actions" style="margin-top:16px">
          <button type="button" class="de-btn de-btn-ghost" onclick="closeSuratJalanForm()">Batal</button>
          <button type="button" class="de-btn de-btn-primary" onclick="submitSuratJalan()">💾 Simpan Surat Jalan</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}
function openSuratJalanForm(idx=-1) {
  _sjEditIdx = idx; _sjItemCount = 0;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sj-items').innerHTML = '';
  const sb = document.getElementById('sj-sb'); if(sb) sb.style.display='none';
  
  // Sembunyikan info box
  const infoBox = document.getElementById('sj-product-info');
  if (infoBox) infoBox.style.display = 'none';
  
  populateSjKartuPicker();
  // Reset picker
  const kp = document.getElementById('sj-kartu-picker');
  const bp = document.getElementById('sj-batch-picker');
  const qp = document.getElementById('sj-batch-qty');
  if(kp) kp.value=''; if(qp) qp.value='';
  if(bp) bp.innerHTML='<option value="">-- Pilih batch --</option>';

  if (idx >= 0) {
    const sj = getSJData()[idx];
    document.getElementById('sj-modal-title').textContent = '✏️ Edit Surat Jalan';
    document.getElementById('sj-f-no').value        = sj.no || '';
    document.getElementById('sj-f-date').value      = sj.date || today;
    document.getElementById('sj-f-penerima').value  = sj.penerima || '';
    document.getElementById('sj-f-kendaraan').value = sj.kendaraan || '';
    document.getElementById('sj-f-driver').value    = sj.driver || '';
    document.getElementById('sj-f-pengirim').value  = sj.pengirim || '';
    document.getElementById('sj-f-notes').value     = sj.notes || '';
    
    // Cek apakah ada item yang stoknya sudah habis
    const habisItems = (sj.items||[]).filter(it => {
      const stock = _sjGetProductStock(it.kartu_stok_id || it.productId);
      return stock <= 0;
    });
    
    if (habisItems.length > 0) {
      const habitText = habisItems.map(it => `• ${it.name}`).join('\n');
      console.warn('⚠️ Perhatian: Beberapa item dalam surat jalan ini sudah tidak memiliki stok:\n' + habitText);
    }
    
    (sj.items||[]).forEach(it => addSuratJalanItem(it));
  } else {
    document.getElementById('sj-modal-title').textContent = '📋 Buat Surat Jalan';
    document.getElementById('sj-f-no').value = genSJNo(today);
    document.getElementById('sj-f-date').value = today;
    ['sj-f-penerima','sj-f-kendaraan','sj-f-driver','sj-f-pengirim','sj-f-notes'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
    addSuratJalanItem();
  }
  const modal = document.getElementById('sj-modal-overlay');
  if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
}

function closeSuratJalanForm() {
  // 💡 FIX: Sembunyikan total dengan display none
  const modal = document.getElementById('sj-modal-overlay');
  if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
  }
  _sjEditIdx = -1;
}

function genSJNo(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const dateKey = `${dd}${mm}${yyyy}`;

  // Kunci sequence harian
  const key = 'sj_seq_' + dateKey;
  const seq = (parseInt(localStorage.getItem(key) || '0')) + 1;
  localStorage.setItem(key, seq);

  return `SJ${String(seq).padStart(3, '0')}-${dateKey}`;
}

// Cache dari API — diisi oleh loadSJFromAPI()
let _sjApiCache = null;

async function loadSJFromAPI() {
  try {
    const resp = await fetch('/api/dataentry/surat-jalan');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error);
    _sjApiCache = json.data.map(row => ({
      id:        row.id,
      no:        row.nomor,
      date:      row.tanggal ? String(row.tanggal).split('T')[0] : "",
      penerima:  row.penerima,
      alamat:    row.alamat,
      kendaraan: row.kendaraan,
      // FIX: driver dan pengirim adalah field terpisah
      driver:    row.driver   || row.pengirim || '',
      pengirim:  row.pengirim || '',
      notes:     row.catatan,
      items:     row.items || []
    }));
    sSJ(_sjApiCache);
    return _sjApiCache;
  } catch (err) {
    console.error('loadSJFromAPI error:', err.message);
    _sjApiCache = gSJ();
    return _sjApiCache;
  }
}

function getSJData() {
  // FIX: Sebelumnya memanggil dirinya sendiri saat _sjApiCache null → infinite loop
  // Sekarang fallback ke localStorage (via gSJ()) jika cache belum diisi API
  if (_sjApiCache !== null) return _sjApiCache;
  const fallback = gSJ(); // baca localStorage
  return Array.isArray(fallback) ? fallback : [];
}

async function initSuratJalan() {
  await loadSJFromAPI();
  renderSuratJalan();
}

function renderSuratJalan() {
  const list  = document.getElementById('sj-list');
  const empty = document.getElementById('sj-empty');
  if (!list) return;
  const data = getSJData();
  if (!data.length) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  list.innerHTML = data.map((sj, idx) => `
    <div class="de-card" style="padding:16px 20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">${sj.no}</div>
          <div style="font-size:14px;font-weight:700;color:var(--txt)">→ ${sj.penerima}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">📅 ${sj.date} &nbsp;•&nbsp; 🚚 ${sj.kendaraan||'—'} &nbsp;•&nbsp; 🧑 ${sj.driver||sj.pengirim||'—'}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="pj-btn" style="border-color:#dc2626;color:#dc2626;background:#fff5f5;" onclick="downloadSuratJalanPDF(${idx})">📄 PDF</button>
          <button class="pj-btn pj-btn-edit" onclick="window.editSuratJalan(${idx})">✏️ Edit</button>
          <button class="pj-btn pj-btn-end" onclick="window.deleteSuratJalan(${idx})">🗑️</button>
        </div>
      </div>
      ${sj.items?.length ? `
      <div style="margin-top:12px;overflow-x:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:var(--bg)">
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">No</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Nama Barang</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">No. Batch/Seal</th>
            <th style="padding:7px 10px;text-align:center;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">QTY</th>
            <th style="padding:7px 10px;text-align:left;color:var(--txt3);font-size:9px;text-transform:uppercase;letter-spacing:.8px">Keterangan</th>
          </tr></thead>
          <tbody>${sj.items.map((it,i) => `
            <tr style="background:${i%2===0?'white':'#f9fafb'}">
              <td style="padding:7px 10px;color:var(--txt3)">${i+1}</td>
              <td style="padding:7px 10px;color:var(--txt);font-weight:600">${it.name||'—'}</td>
              <td style="padding:7px 10px;font-size:10px;color:var(--txt3)">${it.seal||it.kode||'—'}</td>
              <td style="padding:7px 10px;text-align:center;font-family:'DM Mono',monospace;font-weight:600;color:var(--blue)">${it.qty||'—'}</td>
              <td style="padding:7px 10px;color:var(--txt2)">${it.desc||'—'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>` : ''}
      ${sj.notes ? `<div style="margin-top:10px;font-size:11px;color:var(--txt3);padding:8px 12px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">📝 ${sj.notes}</div>` : ''}
    </div>`).join('');
}
function downloadSuratJalanPDF(idx) {
  const sj = getSJData()[idx];
  if (!sj) return;

  // Format tanggal: dd MMMM yyyy (Indonesia)
  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
  };

  // Format No. SJ → SJ-dd-mm-yyyy dari tanggal dokumen
  const fmtNoSJ = (d) => {
    if (!d) return sj.no || '—';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const yyyy = dt.getFullYear();
    return `SJ-${dd}-${mm}-${yyyy}`;
  };

  // Baris barang — hanya sebanyak produk yang diisi (tidak ada padding kosong)
  const items = sj.items?.filter(it => it.name?.trim()) || [];
  const rowsHTML = items.length
    ? items.map((it, i) => `
        <tr>
          <td style="border:1px solid #555;padding:4px 7px;text-align:center;">${i+1}</td>
          <td style="border:1px solid #555;padding:4px 7px;">${it.name||''}</td>
          <td style="border:1px solid #555;padding:4px 7px;font-size:9px;color:#555">${it.seal||it.kode||''}</td>
          <td style="border:1px solid #555;padding:4px 7px;text-align:center;">${it.qty||''}</td>
          <td style="border:1px solid #555;padding:4px 7px;">${it.desc||''}</td>
        </tr>`).join('')
    : `<tr>
        <td style="border:1px solid #555;padding:4px 7px;text-align:center;">1</td>
        <td style="border:1px solid #555;padding:4px 7px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:4px 7px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:4px 7px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:4px 7px;">&nbsp;</td>
       </tr>`;

  // Satu blok form (dipakai 2x)
  const formBlock = `
    <div class="sj-form">
      <div class="header">
        <div class="logo-box">PT SILIWANGI<br>AGRO<br>INDO LESTARI</div>
        <div class="doc-title">SURAT JALAN</div>
      </div>
      <table class="info-table">
        <tr>
          <td class="lbl">Tanggal</td><td class="sep">:</td>
          <td class="val">${fmtDate(sj.date)}</td>
          <td style="width:30px"></td>
          <td class="lbl" style="text-align:right">Tujuan</td><td class="sep">:</td>
          <td class="val" style="min-width:160px;">${sj.penerima||''}</td>
        </tr>
        <tr>
          <td class="lbl">No. SJ</td><td class="sep">:</td>
          <td class="val">${fmtNoSJ(sj.date)}</td>
          <td></td><td></td><td></td><td></td>
        </tr>
        <tr>
          <td class="lbl">Nopol / Kendaraan</td><td class="sep">:</td>
          <td class="val">${sj.kendaraan||''}</td>
          <td></td><td></td><td></td><td></td>
        </tr>
        <tr>
          <td class="lbl">Driver</td><td class="sep">:</td>
          <td class="val">${sj.driver||''}</td>
          <td></td><td></td><td></td><td></td>
        </tr>
      </table>
      <div style="font-size:11px;margin-bottom:6px;">Dikirimkan barang-barang sebagai berikut :</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:32px;">No</th>
            <th>Nama Barang</th>
            <th style="width:90px;">No. Batch/Seal</th>
            <th style="width:60px;">QTY</th>
            <th style="width:180px;">Keterangan</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
      ${sj.notes ? `<div style="font-size:10px;margin-bottom:7px;">Catatan: ${sj.notes}</div>` : ''}
      <div class="sig-row">
        <div class="sig-box"><div class="sig-title">Gudang</div><div class="sig-name">${sj.pengirim||''}</div></div>
        <div class="sig-box"><div class="sig-title">Driver</div><div class="sig-name">${sj.driver||''}</div></div>
        <div class="sig-box"><div class="sig-title">Diterima Oleh</div><div class="sig-name"></div></div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Jalan ${fmtNoSJ(sj.date)}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:11px; color:#000; background:#fff; }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 8mm 12mm;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .sj-form {
      flex: 1;
      padding: 8px 0 6px 0;
      border-bottom: 2px dashed #aaa;
    }
    .sj-form:last-child { border-bottom: none; }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #333;
      padding-bottom: 7px;
      margin-bottom: 10px;
    }
    .logo-box {
      width: 62px; height: 52px;
      border: 1px solid #aaa;
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; color: #555; text-align: center; border-radius: 3px;
    }
    .doc-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; }

    .info-table { width: 100%; margin-bottom: 10px; }
    .info-table td { padding: 2px 5px; vertical-align: top; font-size: 11px; }
    .info-table td.lbl { width: 120px; font-weight: 600; }
    .info-table td.sep { width: 12px; text-align: center; }
    .info-table td.val { border-bottom: 1px solid #999; min-width: 140px; }

    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .items-table thead tr { background: #3a4a5c; color: #fff; }
    .items-table th { border: 1px solid #555; padding: 5px 7px; text-align: center; font-size: 10px; }
    .items-table td { border: 1px solid #555; padding: 4px 7px; font-size: 10px; }

    .sig-row { display: flex; border: 1px solid #555; }
    .sig-box { flex: 1; padding: 8px 12px; min-height: 60px; border-right: 1px solid #555; }
    .sig-box:last-child { border-right: none; }
    .sig-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
    .sig-name  { font-size: 10px; margin-top: 3px; min-height: 36px; }

    @media print {
      body { margin: 0; }
      .page { padding: 8mm 12mm; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">
  ${formBlock}
  ${formBlock}
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type:'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Fallback: download langsung sebagai file
    const a = document.createElement('a');
    a.href = url; a.download = `Surat_Jalan_${sj.no.replace(/\//g,'-')}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
window.downloadSuratJalanPDF = downloadSuratJalanPDF;

// ── Helpers: produk & batch dari Kartu Stok ─────────────────────────────────
function _sjProducts() {
  return typeof gSCProducts === 'function' ? gSCProducts() : [];
}
function _sjTxns() {
  return typeof gSCTxn === 'function' ? gSCTxn() : [];
}

// Helper: hitung total stok (balance) untuk sebuah produk
function _sjGetProductStock(productId) {
  const txns = _sjTxns();
  let balance = 0;
  txns.filter(t => t.productId === productId).forEach(t => {
    const masuk = parseFloat(t.credit) || 0;
    const keluar = parseFloat(t.debit) || 0;
    balance += masuk - keluar;
  });
  return balance;
}

// Isi dropdown kartu stok di picker — kartu stok aktif tetap bisa dipilih,
// walau stoknya belum punya batch / masih 0.
function populateSjKartuPicker() {
  const sel = document.getElementById('sj-kartu-picker');
  if (!sel) return;
  const products = _sjProducts();
  
  // Filter: hanya tampilkan produk yang belum selesai (finished !== true)
  const activeProducts = products.filter(p => !p.finished);
  
  sel.innerHTML = '<option value="">-- Pilih produk --</option>' +
    activeProducts.map(p => {
      const stock = _sjGetProductStock(p.id);
      const statusBadge = stock > 0
        ? ` (${stock.toLocaleString('id-ID', {maximumFractionDigits: 2})} ${p.unit || ''})`
        : ' ⚠️ STOK 0';
      return `<option value="${p.id}">${p.name}${p.code ? ' [' + p.code + ']' : ''}${statusBadge}</option>`;
    }).join('');
}

// Saat produk dipilih → isi batch picker dan tampilkan info stok
window.onSjKartuChange = function() {
  const prodId = document.getElementById('sj-kartu-picker')?.value;
  const batchSel = document.getElementById('sj-batch-picker');
  const qtyEl = document.getElementById('sj-batch-qty');
  const infoBox = document.getElementById('sj-product-info');
  const infoText = document.getElementById('sj-product-info-text');
  
  if (!batchSel) return;
  if (qtyEl) qtyEl.value = '';

  if (!prodId) {
    batchSel.innerHTML = '<option value="">-- Pilih batch --</option>';
    if (infoBox) infoBox.style.display = 'none';
    return;
  }
  
  const p    = _sjProducts().find(x => x.id === prodId);
  const unit = p?.unit || '';
  const txns = _sjTxns().filter(t => t.productId === prodId && (t.seal || t.kode));

  // Hitung total stok
  const totalStock = _sjGetProductStock(prodId);

  // Tampilkan info stok
  if (infoBox && infoText) {
    infoBox.style.display = 'block';
    if (totalStock > 0) {
      infoText.textContent = `${totalStock.toLocaleString('id-ID', {maximumFractionDigits: 2})} ${unit}`;
      infoBox.style.background = '#ecfdf5';
      infoBox.style.borderColor = '#86efac';
      infoBox.style.color = '#047857';
    } else {
      infoText.textContent = 'HABIS / Tidak Tersedia';
      infoBox.style.background = '#fef2f2';
      infoBox.style.borderColor = '#fca5a5';
      infoBox.style.color = '#991b1b';
    }
  }

  // Buat list batch unik (by seal/kode), kalkulasi qty tersisa tiap batch
  const batchMap = {};
  txns.forEach(t => {
    const bKey = t.seal || t.kode || '';
    if (!bKey) return;
    if (!batchMap[bKey]) batchMap[bKey] = { seal: bKey, qty: 0, txnId: t.id, desc: t.desc || '' };
    // qty = credit (masuk) - debit (keluar) untuk batch ini
    batchMap[bKey].qty = (parseFloat(batchMap[bKey].qty) || 0) + (parseFloat(t.credit) || 0) - (parseFloat(t.debit) || 0);
  });

  // Hanya tampilkan batch dengan qty > 0
  const batches = Object.values(batchMap).filter(b => b.qty > 0);
  if (!batches.length) {
    batchSel.innerHTML = '<option value="">-- Tidak ada batch, isi manual --</option>';
    return;
  }
  batchSel.innerHTML = '<option value="">-- Pilih batch --</option>' +
    batches.map(b => `<option value="${b.seal}" data-qty="${b.qty.toLocaleString('id-ID', {maximumFractionDigits: 2})}" data-desc="${b.desc}">${b.seal} (Stok: ${b.qty.toLocaleString('id-ID', {maximumFractionDigits: 2})} ${unit})</option>`).join('');
};

// Saat batch dipilih → isi qty dengan stok yang tersedia
window.onSjBatchChange = function() {
  const opt = document.getElementById('sj-batch-picker')?.selectedOptions[0];
  const qtyEl = document.getElementById('sj-batch-qty');
  if (!qtyEl) return;
  // Ambil data-qty (sudah terformat) dan parse, atau gunakan string langsung
  const qtyStr = opt && opt.value ? (opt.getAttribute('data-qty') || '') : '';
  qtyEl.value = qtyStr;
  qtyEl.max = qtyStr; // Set max supaya user tidak bisa input lebih dari stok tersedia
};

// Tambah item dari kartu stok picker — dengan validasi stok
window.addSjItemFromKartu = function() {
  const prodId  = document.getElementById('sj-kartu-picker')?.value;
  const batchSel = document.getElementById('sj-batch-picker');
  const batch   = batchSel?.value || '—';
  const qtyInput = document.getElementById('sj-batch-qty')?.value;
  const qtyNum = parseFloat(qtyInput) || 0;

  if (!prodId) { alert('Pilih kartu stok terlebih dahulu.'); return; }
  if (qtyNum <= 0) { alert('Qty harus lebih dari 0.'); return; }

  // Validasi: qty tidak boleh melebihi stok tersedia
  const opt = batchSel?.selectedOptions[0];
  const availableQtyStr = opt?.getAttribute('data-qty') || '0';
  // Parse balik qty yang sudah di-format
  const availableQty = parseFloat(availableQtyStr.replace(/\./g, '').replace(/,/g, '.')) || 0;
  
  if (qtyNum > availableQty) {
    alert(`⚠️ Qty tidak boleh melebihi stok tersedia!\n\nStok tersedia: ${availableQty.toLocaleString('id-ID', {maximumFractionDigits: 2})}\nAnda input: ${qtyNum.toLocaleString('id-ID', {maximumFractionDigits: 2})}`);
    return;
  }

  const p = _sjProducts().find(x => x.id === prodId);
  const desc = opt?.getAttribute('data-desc') || '';

  addSuratJalanItem({
    kartu_stok_id: prodId,
    name: p?.name || '',
    seal: batch,
    qty:  qtyNum,
    desc: desc,
    fromKartu: true,
  });

  // Reset picker
  document.getElementById('sj-batch-picker').innerHTML = '<option value="">-- Pilih batch --</option>';
  document.getElementById('sj-batch-qty').value = '';
  document.getElementById('sj-batch-qty').max = '';
  document.getElementById('sj-kartu-picker').value = '';
};

// ── Item row ─────────────────────────────────────────────────────────────────
function addSuratJalanItem(data = null) {
  const uid = ++_sjItemCount;
  const container = document.getElementById('sj-items');
  if (!container) return;
  const row = document.createElement('div');
  row.id = 'sj-item-' + uid;
  row.style.cssText = 'display:grid;grid-template-columns:1.6fr 1.6fr 70px 1.4fr 30px;gap:4px;align-items:center;padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-top:none;';

  // Support both kartu_stok_id (new) dan productId (old) untuk compatibility
  const prodId    = data?.kartu_stok_id || data?.productId || '';
  const prodName  = data?.name || '';
  const sealVal   = data?.seal || '';
  const qtyVal    = data?.qty  || '';
  const descVal   = data?.desc || '';
  const fromKartu = data?.fromKartu || false;
  const kartuBadge = fromKartu
    ? `<span style="font-size:8px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:0 4px;font-weight:700">⚡KS</span>`
    : '';

  row.innerHTML = `
    <input type="hidden" id="sj-i-prodId-${uid}" value="${prodId}">
    <input type="hidden" id="sj-i-fromKartu-${uid}" value="${fromKartu?'1':'0'}">
    <div style="display:flex;align-items:center;gap:4px">
      ${kartuBadge}
      <input class="de-input" id="sj-i-name-${uid}" value="${prodName}" placeholder="Nama produk / barang..." style="margin:0;font-size:11px;flex:1;${fromKartu?'background:#f0fdf4;color:#15803d;font-weight:600':''}" ${fromKartu?'readonly':''}>
    </div>
    <input class="de-input" id="sj-i-seal-${uid}" value="${sealVal}" placeholder="No. batch / seal / manual..." style="margin:0;font-size:11px;${fromKartu?'font-weight:600':''}" ${fromKartu?'readonly':''}>
    <input class="de-input" id="sj-i-qty-${uid}" type="number" step="any" value="${qtyVal}" placeholder="0" min="0" style="margin:0;text-align:center;font-size:11px;color:var(--blue);font-weight:700">
    <input class="de-input" id="sj-i-desc-${uid}" value="${descVal}" placeholder="Keterangan..." style="margin:0;font-size:11px">
    <button class="fp-item-remove" onclick="document.getElementById('sj-item-${uid}').remove();" title="Hapus" style="margin:0;display:flex;align-items:center;justify-content:center;height:100%;width:100%">✕</button>`;

  container.appendChild(row);
}

// ── Submit: simpan SJ + auto-debit kartu stok ─────────────────────────────────
function submitSuratJalan() {
  const penerima = document.getElementById('sj-f-penerima')?.value.trim();
  if (!penerima) { showSjSt('error', '❌ Tujuan wajib diisi!'); return; }

  const sjDate = document.getElementById('sj-f-date')?.value || new Date().toISOString().split('T')[0];
  const sjNo   = document.getElementById('sj-f-no')?.value.trim() || genSJNo(sjDate);

  const items = [];
  document.querySelectorAll('#sj-items > div[id^="sj-item-"]').forEach(row => {
    const uid = row.id.replace('sj-item-', '');
    items.push({
      kartu_stok_id: document.getElementById('sj-i-prodId-' + uid)?.value || '',
      fromKartu:     document.getElementById('sj-i-fromKartu-' + uid)?.value === '1',
      name:          document.getElementById('sj-i-name-' + uid)?.value.trim()  || '',
      seal:          document.getElementById('sj-i-seal-' + uid)?.value.trim()  || '',
      qty:           document.getElementById('sj-i-qty-' + uid)?.value  || '',
      desc:          document.getElementById('sj-i-desc-' + uid)?.value.trim()  || '',
    });
  });

  const entry = {
    id:         _sjEditIdx >= 0 ? getSJData()[_sjEditIdx].id : Date.now(),
    no:         sjNo,
    date:       sjDate,
    penerima,
    kendaraan:  document.getElementById('sj-f-kendaraan')?.value.trim() || '',
    driver:     document.getElementById('sj-f-driver')?.value.trim()    || '',
    pengirim:   document.getElementById('sj-f-pengirim')?.value.trim()  || '',
    notes:      document.getElementById('sj-f-notes')?.value.trim()     || '',
    items,
    created_at: new Date().toISOString(),
  };

  showSjSt('loading', '⏳ Menyimpan ke database...');

  // ─ SAVE TO DATABASE VIA API ─
  (async () => {
    try {
      console.log('💾 submitSuratJalan - Preparing to save:', { no: sjNo, penerima, itemCount: items.length });

      // Collect items from form dengan error handling
      console.log('📝 Collecting items from form...');
      const collectedItems = [];
      document.querySelectorAll('#sj-items > div[id^="sj-item-"]').forEach((row, idx) => {
        try {
          const uid = row.id.replace('sj-item-', '');
          console.log(`  Item ${idx}:`, { uid, id: row.id });
          
          const prodIdEl = document.getElementById('sj-i-prodId-' + uid);
          const nameEl = document.getElementById('sj-i-name-' + uid);
          const sealEl = document.getElementById('sj-i-seal-' + uid);
          const qtyEl = document.getElementById('sj-i-qty-' + uid);
          const descEl = document.getElementById('sj-i-desc-' + uid);
          
          const prodId = prodIdEl?.value?.trim() || null;
          const name = nameEl?.value?.trim() || null;
          const seal = sealEl?.value?.trim() || null;
          const qtyRaw = qtyEl?.value?.trim() || '';
          const desc = descEl?.value?.trim() || null;
          const fromKartuEl = document.getElementById('sj-i-fromKartu-' + uid);
          const fromKartu = fromKartuEl?.value === '1';
          
          console.log(`    prodId: ${prodId}, name: ${name}, qty: ${qtyRaw}, fromKartu: ${fromKartu}`);
          
          // Only add if name exists
          if (name) {
            const item = {
              kartu_stok_id: prodId ? parseInt(prodId, 10) : null,
              fromKartu:     fromKartu,
              name: name,
              seal: seal || null,
              qty: qtyRaw ? parseFloat(qtyRaw) : 0,
              desc: desc || null
            };
            console.log(`    ✓ Parsed item:`, item);
            collectedItems.push(item);
          }
        } catch (itemErr) {
          console.error(`    ❌ Error parsing item:`, itemErr.message);
        }
      });

      console.log(`📦 Total items collected: ${collectedItems.length}`);
      if (collectedItems.length === 0) {
        showSjSt('error', '❌ Tambahkan minimal 1 item!');
        return;
      }

      // FIX: Baca SEMUA field langsung dari DOM saat submit, jangan dari `entry`
      // supaya nilai terbaru di form selalu terkirim
      const payload = {
        nomor:     String(sjNo || ''),
        tanggal:   String(sjDate || ''),
        penerima:  String(penerima || ''),
        alamat:    String(document.getElementById('sj-f-alamat')?.value?.trim() || ''),
        kendaraan: String(document.getElementById('sj-f-kendaraan')?.value?.trim() || ''),
        pengirim:  String(document.getElementById('sj-f-pengirim')?.value?.trim() || ''),
        driver:    String(document.getElementById('sj-f-driver')?.value?.trim() || ''),
        items:     collectedItems,
        catatan:   String(document.getElementById('sj-f-notes')?.value?.trim() || '')
      };

      console.log('🔍 Payload object:', payload);
      console.log('📦 Attempting JSON.stringify...');
      const payloadJson = JSON.stringify(payload);
      console.log('✓ JSON.stringify succeeded');
      console.log('📦 Payload to send:', payloadJson);

      let endpoint = '/api/dataentry/surat-jalan';
      let method = 'POST';

      if (_sjEditIdx >= 0 && getSJData()[_sjEditIdx]?.id) {
        endpoint = `/api/dataentry/surat-jalan/${getSJData()[_sjEditIdx].id}`;
        method = 'PUT';
      }

      console.log(`🔌 ${method} ${endpoint}`);

      const resp = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: payloadJson
      });

      console.log(`📊 Response status: ${resp.status} ${resp.statusText}`);

      const json = await resp.json();
      console.log('📨 API Response:', json);

      if (!json.success) {
        throw new Error(json.error || 'API error');
      }

      console.log('✅ Saved to database successfully');

      // ── Auto-debit kartu stok untuk item dari Kartu Stok ──────────────────────
      const postTxnPromises = [];
      
      collectedItems.forEach(it => {
        const prodId = it.kartu_stok_id || it.productId;
        if (!it.fromKartu || !prodId || !it.qty) return;
        
        const keterangan = 'Auto: Surat Jalan ' + sjNo + (it.desc ? ' – ' + it.desc : '') + ' | Tujuan: ' + penerima;
        
        const postPromise = fetch(`/api/kartu-stok/${prodId}/transaksi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tanggal: sjDate,
            debit:   parseFloat(it.qty),
            kredit:  0,
            no_seal: it.seal || '',
            keterangan: keterangan
          })
        })
          .then(r => r.json())
          .then(res => {
            if (res.success) {
              console.log('✅ Auto-debit tersimpan:', res.data);
            } else {
              console.error('❌ Gagal auto-debit:', res.error);
            }
          })
          .catch(err => console.error('❌ Error auto-debit:', err));
        
        postTxnPromises.push(postPromise);
      });

      await Promise.all(postTxnPromises);
      if (postTxnPromises.length > 0) {
        console.log(`✅ ${postTxnPromises.length} auto-debit kartu stok selesai`);
      }

      // Reload dari API supaya semua device sync
      await loadSJFromAPI();

      showSjSt('success','✅ Surat jalan tersimpan' + (entry._autoDebitIds?.length ? ` + ${entry._autoDebitIds.length} auto-debit kartu stok` : '') + '!');
      // FIX: render dulu SEBELUM close form, supaya data terbaru langsung tampil
      // Jangan pakai setTimeout karena loadSJFromAPI sudah di-await di atas
      renderSuratJalan();
      setTimeout(() => { closeSuratJalanForm(); }, 900);

    } catch (err) {
      console.error('❌ submitSuratJalan error:', err.message, err);
      showSjSt('error', '❌ Gagal: ' + err.message);
    }
  })();
}

// ── STATUS BAR FUNCTION ──────────────────────────────────────────────────────
function showSjSt(type, msg) {
  const b = document.getElementById('sj-sb'), m = document.getElementById('sj-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; 
  b.className = 'de-status-bar de-status-' + type; 
  m.textContent = msg;
  if (type === 'success') setTimeout(() => { if (b) b.style.display = 'none'; }, 3000);
}

// ── Helpers lama (dipertahankan untuk kompatibilitas) ─────────────────────────
function getAvailableStockOptions(selectedKode = '') {
  const products = _sjProducts().filter(p => !p.finished); // Filter produk selesai
  const txns     = _sjTxns();
  let html = '<option value="" data-nama="" data-sisa="" data-masuk="">-- Pilih --</option>';
  products.forEach(p => {
    let totalMasuk = 0, balance = 0;
    txns.filter(t => t.productId === p.id).forEach(t => {
      const m = parseFloat(t.credit) || 0, k = parseFloat(t.debit) || 0;
      balance += m - k; totalMasuk += m;
    });
    const itemCode = p.code || p.id;
    const isSelected = itemCode === selectedKode ? 'selected' : '';
    const masukText = totalMasuk.toLocaleString('id-ID', {maximumFractionDigits:2});
    html += `<option value="${itemCode}" data-nama="${p.name}" data-sisa="${balance}" data-masuk="${totalMasuk}" ${isSelected}>${itemCode} (${masukText} ${p.unit||''})</option>`;
  });
  return html;
}

window.updateSjDropdownState = function() {};  // no-op, kept for compat

window.editSuratJalan = function(idx) {
  // FIX: Set _sjEditIdx SEBELUM openSuratJalanForm, karena form butuh nilai ini
  // (surat-jalan-api-integration.js juga override ini, tapi versi ini harus final)
  _sjEditIdx = idx;
  openSuratJalanForm(idx);
};

window.deleteSuratJalan = function(idx) {
  if (!confirm('Yakin ingin hapus surat jalan ini?')) return;
  const data = getSJData();
  if (idx < 0 || idx >= data.length) return;

  const sj = data[idx];

  // FIX: Guard — pastikan sj.id ada sebelum hit API
  if (!sj || !sj.id) {
    console.error('deleteSuratJalan: sj.id tidak ditemukan. Data:', sj);
    alert('❌ ID surat jalan tidak ditemukan. Coba refresh halaman lalu ulangi.');
    return;
  }

  // Hapus dari database via API
  (async () => {
    try {
      const resp = await fetch(`/api/dataentry/surat-jalan/${sj.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');

      // Hapus auto-debit transaksi jika ada
      if (typeof gSCTxn === 'function' && typeof sSCTxn === 'function') {
        const autoIds = sj._autoDebitIds || [];
        const txns = gSCTxn();
        const filtered = txns.filter(t => !autoIds.includes(t.id));
        txns.length = 0;
        filtered.forEach(t => txns.push(t));
        sSCTxn(txns);
      }

      // FIX: Reload dari API dulu supaya _sjApiCache ter-update, BARU render
      await loadSJFromAPI();
      if (typeof loadSCDataFromAPI === 'function') {
        await loadSCDataFromAPI();
      }

      renderSuratJalan();
      alert('✅ Surat jalan berhasil dihapus');
    } catch (err) {
      alert('❌ Gagal: ' + err.message);
      console.error('deleteSuratJalan error:', err);
    }
  })();
};

window.checkVacuum = function() {};
window.handlePhotoUpload = function() {};

window.addSuratJalanItem = addSuratJalanItem;
window.showSjSt = showSjSt;
window.downloadSuratJalanPDF = downloadSuratJalanPDF;
window.renderSuratJalan = renderSuratJalan;
window.initSuratJalan = initSuratJalan;

// Assign functions yang mungkin dari missing-functions.js jika ada
if (typeof switchReportTab !== 'undefined') window.switchReportTab = switchReportTab;
if (typeof changeReportSort !== 'undefined') window.changeReportSort = changeReportSort;
if (typeof clearDateFilters !== 'undefined') window.clearDateFilters = clearDateFilters;