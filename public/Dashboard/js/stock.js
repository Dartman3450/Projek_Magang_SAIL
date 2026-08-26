// ── openCIP_enh / closeCIP_enh / saveCIP_enh ─────────────────
function openCIP_enh(type, idx) {
  _cipPJIdx = idx;
  const sel = document.getElementById('dep-proj-sel-' + type);
  if (sel) sel.value = idx;
  openCIPModal(type);
}
function closeCIP_enh(type) { closeCIPModal(); }
async function saveCIP_enh(type, isFinish) { await saveCIPModal(type, isFinish); }

window.openCIP_enh = openCIP_enh;
window.closeCIP_enh= closeCIP_enh;
window.saveCIP_enh = saveCIP_enh;
window.openFP      = openFP;
window.closeFP     = closeFP;
window.addFPItem   = addFPItem;
window.saveFP      = saveFP;
window.endProd     = endProd;
window.loadDEProjForm = loadDEProjForm;

function showTDSSt(type, msg) {
  const b = document.getElementById('tds-sb'), m = document.getElementById('tds-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type !== 'error') setTimeout(() => { if (b) b.style.display = 'none'; }, 4000);
}


// ═══════════════════════════════════════════════════════════
// VACUUM / TEMPERATURE NOTE
// ═══════════════════════════════════════════════════════════
function checkVacuum(key) {
  const inp  = document.getElementById('dep-temp-prod-' + key);
  const note = document.getElementById('dep-vacuum-note-' + key);
  if (!inp || !note) return;
  const val = parseFloat(inp.value);
  if (isNaN(val) || inp.value === '') { note.style.display = 'none'; return; }
  note.style.display = 'block';
  if (val <= 97) {
    note.style.background = '#eff6ff';
    note.style.border = '1px solid #bfdbfe';
    note.style.color = '#1d4ed8';
    note.innerHTML = '💧 <strong>VACUUM</strong> — Suhu ≤97°C, sistem berada dalam kondisi vakum.';
  } else {
    note.style.background = '#fff7ed';
    note.style.border = '1px solid #fed7aa';
    note.style.color = '#c2410c';
    note.innerHTML = '🌡️ <strong>NOT VACUUM</strong> — Suhu >97°C, sistem tidak dalam kondisi vakum.';
  }
}

// ═══════════════════════════════════════════════════════════
// PHOTO UPLOAD + CLIENT-SIDE COMPRESSION
// ═══════════════════════════════════════════════════════════
function handlePhotoUpload(key, input) {
  const preview = document.getElementById(key + '-photo-preview');
  if (!preview) return;
  const files = Array.from(input.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Compress via canvas
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        const sizeKB = Math.round(compressed.length * 0.75 / 1024);
        // Render thumbnail
        const uid = Date.now() + Math.random();
        const wrap = document.createElement('div');
        wrap.className = 'de-photo-thumb';
        wrap.id = 'photo-' + uid;
        wrap.innerHTML = `
          <img src="${compressed}" alt="${file.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;display:block">
          <button class="de-photo-remove" onclick="document.getElementById('photo-${uid}').remove()" title="Hapus foto">✕</button>
          <div class="de-photo-size">${sizeKB} KB</div>`;
        preview.appendChild(wrap);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  // Reset input so same file can be re-selected
  input.value = '';
}

// ═══════════════════════════════════════════════════════════
// KARTU STOK
// ═══════════════════════════════════════════════════════════
function getKartuStokHTML() {
  return `
  <div class="de-wrap">
    <div class="de-header">
      <div>
        <div class="de-title">Stock Card</div>
        <div class="de-sub">SAIL / Gudang / Stock Card — 1 Produk = 1 Kartu Stok</div>
      </div>
      <button type="button" class="de-btn de-btn-primary" style="padding:8px 18px;cursor:pointer;" onclick="openSCProductForm()">＋ Tambah Produk</button>
    </div>

    <div class="de-card" style="padding:12px 16px;margin-bottom:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <input class="de-input" id="sc-search" placeholder="🔍 Cari nama atau kode produk..." style="flex:1;min-width:200px" oninput="renderStockCards()">
    </div>

    <div id="sc-cards-container" style="display:flex;flex-direction:column;gap:16px;margin-top:4px"></div>
    <div id="sc-empty" style="display:none;padding:56px;text-align:center;color:var(--txt3)">
      <div style="font-size:44px;margin-bottom:10px">📦</div>
      <div style="font-size:13px;font-weight:600">Belum ada produk — klik <strong>＋ Tambah Produk</strong> untuk memulai.</div>
    </div>

    <!-- PRODUCT FORM MODAL -->
    <div class="proj-modal-overlay" id="sc-prod-modal" style="display:none;">
      <div class="proj-modal" style="max-width:540px">
        <div class="proj-modal-head">
          <div class="proj-modal-title" id="sc-prod-modal-title">📦 Tambah Produk</div>
          <button type="button" class="proj-modal-close" onclick="closeSCProductForm()">✕</button>
        </div>
        <div class="proj-modal-body">
          <div style="font-size:10px;font-weight:700;color:var(--txt3);letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">Informasi Produk (Header Kartu Stok)</div>
          <!-- KODE BARU UNTUK MODAL TAMBAH PRODUK -->
          <div class="de-grid">
              <div class="de-field de-full">
                  <label class="de-label">NAMA BARANG *</label>
                  <input class="de-input" id="sc-p-name" type="text" placeholder="Contoh: Teh Hijau, Golden Oolong Extract...">
              </div>
              <div class="de-field">
                  <label class="de-label">SATUAN BARANG</label>
                  <input class="de-input" id="sc-p-unit" type="text" placeholder="kg, L, pcs...">
              </div>
              
              <!-- MIN & MAX STOK DIHAPUS DARI SINI -->

              <div class="de-field">
                <label class="de-label">LOKASI / GUDANG</label>
                <div id="loc-dropdown-container"></div>
              </div>
              <div class="de-field">
                  <label class="de-label">PENANGGUNG JAWAB (PIC)</label>
                  <input class="de-input" id="sc-p-pic" type="text" placeholder="Nama PIC produk ini...">
              </div>
          </div>
          <div class="de-status-bar" id="sc-p-sb" style="display:none"><span id="sc-p-sm"></span></div>
          <div class="de-actions" style="margin-top:16px">
            <button type="button" class="de-btn de-btn-ghost" onclick="closeSCProductForm()">Batal</button>
            <button type="button" class="de-btn de-btn-primary" onclick="submitSCProduct()">💾 Simpan Produk</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TRANSACTION FORM MODAL -->
    <div class="proj-modal-overlay" id="sc-txn-modal" style="display:none;">
      <div class="proj-modal" style="max-width:520px">
        <div class="proj-modal-head">
          <div class="proj-modal-title" id="sc-txn-modal-title">➕ Tambah Transaksi</div>
          <button type="button" class="proj-modal-close" onclick="closeSCTxnForm()">✕</button>
        </div>
        <div class="proj-modal-body">
          <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:12px;padding:8px 12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe" id="sc-txn-prod-label">📦 Produk: —</div>
          <div class="de-grid">
            <div class="de-field">
              <label class="de-label">TANGGAL *</label>
              <input class="de-input" id="sc-t-date" type="date">
            </div>
            <div class="de-field">
              <label class="de-label">NO. SEAL / BATCH</label>
              <input class="de-input" id="sc-t-seal" placeholder="No. seal, kode batch...">
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#b91c1c">DEBIT — Barang Keluar (OUT)</label>
              <input class="de-input" id="sc-t-debit" type="number" min="0" step="0.001" placeholder="0  (kosongkan jika Masuk)">
            </div>
            <div class="de-field">
              <label class="de-label" style="color:#15803d">CREDIT — Barang Masuk (IN)</label>
              <input class="de-input" id="sc-t-credit" type="number" min="0" step="0.001" placeholder="0  (kosongkan jika Keluar)">
            </div>
            <div class="de-field">
              <label class="de-label">PENANGGUNG JAWAB</label>
              <input class="de-input" id="sc-t-pic" placeholder="Nama PIC transaksi ini...">
            </div>
            <div class="de-field de-full">
              <label class="de-label">DESKRIPSI</label>
              <input class="de-input" id="sc-t-desc" placeholder="Contoh: Pembelian Supplier, Penjualan ke Gudang B...">
            </div>
            <div class="de-field de-full">
              <label class="de-label">KETERANGAN / CATATAN</label>
              <textarea class="de-input de-textarea" id="sc-t-notes" placeholder="Catatan tambahan jika ada..." style="min-height:52px"></textarea>
            </div>
          </div>
          <div class="de-status-bar" id="sc-t-sb" style="display:none"><span id="sc-t-sm"></span></div>
          <div class="de-actions" style="margin-top:16px">
            <button type="button" class="de-btn de-btn-ghost" onclick="closeSCTxnForm()">Batal</button>
            <button type="button" class="de-btn de-btn-primary" onclick="submitSCTxn()">💾 Simpan Transaksi</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Storage helpers ──────────────────────────────────────────
// Cache layer for API data
let _scDataCache = { products: [], txn: [] };

function gKS()         { try { return JSON.parse(localStorage.getItem('sail_kartu_stok') || '[]'); } catch { return []; } }
function sKS(list)     { localStorage.setItem('sail_kartu_stok', JSON.stringify(list)); }
function gSCProducts() { return _scDataCache.products; }
function sSCProducts(d){ _scDataCache.products = d; localStorage.setItem('sail_sc_products', JSON.stringify(d)); }
function gSCTxn()      { return _scDataCache.txn; }
function sSCTxn(d)     { _scDataCache.txn = d; localStorage.setItem('sail_sc_txn', JSON.stringify(d)); }

// Load data from API
async function loadSCDataFromAPI() {
  try {
    const res = await fetch('/api/kartu-stok', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load data');
    
    // Flatten the data structure to match UI expectations
    const products = json.data.map(p => ({
      id: p.id.toString(),
      name: p.nama_barang,
      code: p.kode_barang,
      unit: p.satuan,
      loc: p.lokasi,
      pic: p.penanggung_jawab || p.pic,
      finished: p.finished || false,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));
    
    // Flatten transactions
    const txn = [];
    json.data.forEach(p => {
      if (p.transaksi && Array.isArray(p.transaksi)) {
        p.transaksi.forEach(t => {
          txn.push({
            id: t.id.toString(),
            productId: p.id.toString(),
            date: t.tanggal,
            debit: t.debit,
            credit: t.kredit,
            seal: t.no_seal,
            pic: t.penanggung_jawab || '',
            desc: t.keterangan
          });
        });
      }
    });
    
    _scDataCache.products = products;
    _scDataCache.txn = txn;
    sSCProducts(products);
    sSCTxn(txn);
    renderStockCards();
  } catch (err) {
    console.error('loadSCDataFromAPI error:', err);
    // Fallback to localStorage
    _scDataCache.products = JSON.parse(localStorage.getItem('sail_sc_products') || '[]');
    _scDataCache.txn = JSON.parse(localStorage.getItem('sail_sc_txn') || '[]');
  }
}

let _ksEditIdx    = -1;
let _scProdEditId = null;
let _scTxnProdId  = null;
let _scTxnEditId  = null;

function initKartuStok() {
  // Load locations dari API untuk sync antar device
  loadSCLocationsFromAPI();
  
  // Load data from API on initialization
  loadSCDataFromAPI();
}

// Pastikan fungsi ini menempel ke window agar bisa dipanggil oleh HTML
window.renderStockCards = function() {
  const q         = (document.getElementById('sc-search')?.value || '').toLowerCase();
  
  // Mengambil data dengan aman
  const products  = typeof gSCProducts === 'function' ? gSCProducts() : [];
  const txnAll    = typeof gSCTxn === 'function' ? gSCTxn() : [];
  
  const container = document.getElementById('sc-cards-container');
  const emptyEl   = document.getElementById('sc-empty');
  if (!container) return;

  const filtered = q
    ? products.filter(p => (p.name||'').toLowerCase().includes(q) || (p.code||'').toLowerCase().includes(q))
    : products;

  if (!filtered.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = filtered.map((p, prodIdx) => {
    const txns = txnAll
      .filter(t => t.productId === p.id)
      .sort((a, b) => (a.date||'').localeCompare(b.date||''));

    let runBal = 0;
    const fmt = v => v ? parseFloat(v).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3}) : '';
    
    const txnRows = txns.map((t, ti) => {
      const keluar = parseFloat(t.debit)  || 0; 
      const masuk  = parseFloat(t.credit) || 0; 
      runBal += masuk - keluar; 
      
      const balClr = runBal < 0 ? '#dc2626' : '#15803d';
      const rowBg  = ti % 2 === 0 ? '#fff' : '#f8fafc';

      const txtKeluar = keluar ? `<span style="color:#dc2626;font-weight:700;">${fmt(keluar)}</span>` : '';
      const txtMasuk  = masuk ? `<span style="color:#15803d;font-weight:700;">${fmt(masuk)}</span>` : '';

      // No. Seal / Batch dari transaksi
      const sealBatch = t.seal || '—';

      // PERBAIKAN 2: Menambahkan type="button" agar tombol tidak error karena form submit
      return `<tr style="background:${rowBg}">
        <td style="font-family:'DM Mono',monospace;font-size:11px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0;padding:5px 6px">${ti+1}</td>
        <td style="font-size:11px;white-space:nowrap;border:1px solid #e2e8f0;padding:5px 8px;text-align:center;">${t.date||'—'}</td>
        <td style="font-family:'DM Mono',monospace;font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;color:var(--blue);font-weight:600;text-align:center;">${sealBatch}</td>
        <td style="font-family:'DM Mono',monospace;font-size:12px;text-align:center;border:1px solid #e2e8f0;padding:5px 8px">${txtKeluar}</td>
        <td style="font-family:'DM Mono',monospace;font-size:12px;text-align:center;border:1px solid #e2e8f0;padding:5px 8px">${txtMasuk}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;font-weight:800;text-align:center;border:1px solid #e2e8f0;padding:5px 8px;color:${balClr}">${runBal.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3})}</td>
        <td style="font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;text-align:center">${t.pic || '—'}</td>
        <td style="font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;max-width:160px">${t.desc||'—'}</td>
        <td style="border:1px solid #e2e8f0;padding:4px 6px;text-align:center;white-space:nowrap">
          <button type="button" class="pj-btn pj-btn-edit" style="padding:3px 7px;font-size:11px;cursor:pointer;" onclick="editSCTxn('${p.id}','${t.id}')">✏️</button>
          <button type="button" class="pj-btn pj-btn-end"  style="padding:3px 7px;font-size:11px;cursor:pointer;" onclick="deleteSCTxn('${t.id}')">🗑️</button>
        </td>
      </tr>`;
    }).join('');

    const finalBal   = txns.reduce((acc, t) => acc + (parseFloat(t.credit)||0) - (parseFloat(t.debit)||0), 0);
    const balChipBg  = finalBal < 0 ? '#fee2e2' : '#dcfce7';
    const balChipClr = finalBal < 0 ? '#b91c1c' : '#15803d';
    const balChipBdr = finalBal < 0 ? '#fca5a5' : '#86efac';

    // Status selesai
    const isFinished = p.finished || false;
    const finishBtnText = isFinished ? '✅ SELESAI' : '✅ Selesai';
    const finishBtnBg = isFinished ? 'rgba(100,116,139,.2)' : 'rgba(22,163,74,.2)';
    const finishBtnColor = isFinished ? '#64748b' : '#15803d';
    const finishBtnBorder = isFinished ? 'rgba(100,116,139,.5)' : 'rgba(22,163,74,.5)';

    // PERBAIKAN 3: Memastikan string HTML aman dari syntax error yang membuat tombol unclickable
    // Disable buttons when finished using visual feedback + onclick guard
    const editBtnStyle = isFinished ? 'opacity:0.5;cursor:not-allowed;pointer-events:none;' : 'cursor:pointer;';
    const deleteBtnStyle = isFinished ? 'opacity:0.5;cursor:not-allowed;pointer-events:none;' : 'cursor:pointer;';
    const txnBtnStyle = isFinished ? 'opacity:0.5;cursor:not-allowed;pointer-events:none;' : 'cursor:pointer;';
    
    return `
    <div class="sc-card-wrapper ${isFinished ? 'finished' : ''}" style="border:2px solid #22c55e;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07);margin-bottom:20px;position:relative;">
      <div class="sc-stamp">SELESAI</div>
      
      <div style="background:#22c55e;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.3px">📋 LAPORAN KARTU STOK BARANG</div>
        <div class="sc-actions" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <div style="background:${balChipBg};border:1px solid ${balChipBdr};color:${balChipClr};padding:3px 12px;border-radius:100px;font-size:11px;font-weight:800;white-space:nowrap">
            Saldo: ${finalBal.toLocaleString('id-ID')} ${p.unit||''}
          </div>
          <button type="button" class="pj-btn" style="background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4);color:#fff;font-size:11px;padding:4px 10px;cursor:pointer;" onclick="viewSCProduct('${p.id}')" title="Lihat laporan lengkap">👁️ Lihat</button>
          <button type="button" class="pj-btn" style="background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4);color:#fff;font-size:11px;padding:4px 10px;${editBtnStyle}" ${isFinished ? '' : 'onclick="openSCProductForm(' + prodIdx + ')"'} title="${isFinished ? 'Tidak bisa diubah — kartu sudah selesai' : 'Edit informasi produk'}">✏️ Edit</button>
          <button type="button" class="pj-btn" style="background:rgba(220,38,38,.2);border-color:rgba(220,38,38,.5);color:#fca5a5;font-size:11px;padding:4px 10px;${deleteBtnStyle}" ${isFinished ? '' : 'onclick="deleteSCProduct(' + "'" + p.id + "'" + ')"'} title="${isFinished ? 'Tidak bisa dihapus — kartu sudah selesai' : 'Hapus produk'}">🗑️</button>
          <button type="button" class="pj-btn" style="background:${finishBtnBg};border-color:${finishBtnBorder};color:${finishBtnColor};font-size:11px;padding:4px 10px;cursor:${isFinished ? 'not-allowed' : 'pointer'};opacity:${isFinished ? '0.6' : '1'};" ${isFinished ? '' : 'onclick="toggleSCFinish(' + "'" + p.id + "'" + ')"'} title="${isFinished ? 'Kartu sudah selesai dan tidak bisa dibuka kembali' : 'Tandai selesai'}">${finishBtnText}</button>
          <button type="button" style="background:#15803d;color:#fff;border:none;border-radius:6px;padding:5px 13px;font-size:11px;font-weight:700;${txnBtnStyle}font-family:inherit;" ${isFinished ? '' : 'onclick="openSCTxnForm(' + "'" + p.id + "'" + ')"'} title="${isFinished ? 'Tidak bisa menambah transaksi — kartu sudah selesai' : 'Tambah transaksi baru'}">➕ Tambah Transaksi</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;background:#fff;border-bottom:2px solid #22c55e">
        <div style="padding:10px 18px;border-right:1px solid #e2e8f0">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <tr><td style="color:#64748b;padding:2px 0;width:120px;font-weight:600">Nama Barang</td><td style="padding:2px 0">: <strong>${p.name}</strong></td></tr>
            <tr><td style="color:#64748b;padding:2px 0;font-weight:600">Satuan Barang</td><td style="padding:2px 0">: ${p.unit||'—'}</td></tr>
          </table>
        </div>
        <div style="padding:10px 18px">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <tr><td style="color:#64748b;padding:2px 0;width:120px;font-weight:600">Lokasi / Gudang</td><td style="padding:2px 0">: ${p.loc||'—'}</td></tr>
            <tr><td style="color:#64748b;padding:2px 0;font-weight:600">Penanggung Jawab</td><td style="padding:2px 0">: ${p.pic||'—'}</td></tr>
          </table>
        </div>
      </div>

      <div style="overflow-x:auto;background:#fff">
        <table style="width:100%;border-collapse:collapse;min-width:900px">
          <thead>
            <tr style="background:#22c55e;color:#fff">
              <th style="border:1px solid #16a34a;padding:7px 6px;font-size:11px;text-align:center;width:36px">NO.</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap">TANGGAL</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center">NO. SEAL / BATCH</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap">BARANG KELUAR (DEBIT)</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap">BARANG MASUK (KREDIT)</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center">SISA</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap">PENANGGUNG JAWAB</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center">DESKRIPSI</th>
              <th style="border:1px solid #16a34a;padding:7px 8px;font-size:11px;text-align:center;width:68px">AKSI</th>
            </tr>
          </thead>
          <tbody>
            ${txnRows || `<tr><td colspan="9" style="text-align:center;padding:32px;color:#94a3b8;font-size:12px;border:1px solid #e2e8f0">Belum ada transaksi — klik <strong>➕ Tambah Transaksi</strong></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('');
};

function openSCProductForm(idx = -1) {
  _scProdEditId = null;
  const products = gSCProducts();
  if (idx >= 0 && idx < products.length) {
    const p = products[idx];
    _scProdEditId = p.id;
    document.getElementById('sc-prod-modal-title').textContent = '✏️ Edit Produk';
    document.getElementById('sc-p-name').value = p.name || '';
    document.getElementById('sc-p-unit').value = p.unit || '';
    document.getElementById('sc-p-pic').value  = p.pic  || '';
    
    // Injeksi dropdown dengan value lama
    document.getElementById('loc-dropdown-container').innerHTML = buildStockLocationDropdown('sc-p-loc', p.loc || '');
  } else {
    document.getElementById('sc-prod-modal-title').textContent = '📦 Tambah Produk';
    ['sc-p-name','sc-p-unit','sc-p-pic'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    // Injeksi dropdown kosong
    document.getElementById('loc-dropdown-container').innerHTML = buildStockLocationDropdown('sc-p-loc', '');
  }
  const sb = document.getElementById('sc-p-sb'); if (sb) sb.style.display = 'none';
  const m  = document.getElementById('sc-prod-modal');
  if (m) { m.style.display = 'flex'; m.classList.add('show'); }
}

function submitSCProduct() {
  const name = document.getElementById('sc-p-name')?.value.trim();
  if (!name) { showSCProdSt('error', '❌ Nama barang wajib diisi!'); return; }
  const products = gSCProducts();
  
  // Mengambil value dari ID dropdown
  const locVal = document.getElementById('sc-p-loc')?.value.trim();

  const entry = {
    id:   _scProdEditId || Date.now().toString(),
    name,
    code: '',
    unit: document.getElementById('sc-p-unit')?.value.trim() || '',
    loc:  locVal === '__ADD_NEW__' ? '' : locVal,
    pic:  document.getElementById('sc-p-pic')?.value.trim() || '',
    finished: false
  };
  
  // Prepare API payload
  const apiPayload = {
    nama_barang: entry.name,
    kode_barang: entry.code,
    satuan: entry.unit,
    lokasi: entry.loc,
    penanggung_jawab: entry.pic
  };
  
  // Save to API
  const saveToAPI = _scProdEditId 
    ? fetch(`/api/kartu-stok/${_scProdEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      })
    : fetch('/api/kartu-stok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

  saveToAPI
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        showSCProdSt('error', '❌ Gagal menyimpan: ' + (json.error || 'Unknown error'));
        return;
      }
      
      // Update local cache with API ID
      entry.id = json.data.id.toString();
      
      if (_scProdEditId) {
        const idx = products.findIndex(p => p.id === _scProdEditId);
        if (idx >= 0) products[idx] = entry; else products.push(entry);
      } else {
        products.push(entry);
      }
      sSCProducts(products);
      showSCProdSt('success', _scProdEditId ? '✅ Produk diperbarui!' : '✅ Produk ditambahkan!');
      setTimeout(() => { closeSCProductForm(); renderStockCards(); }, 700);
    })
    .catch(err => {
      console.error('submitSCProduct error:', err);
      showSCProdSt('error', '❌ Gagal menyimpan produk: ' + err.message);
    });
}

function closeSCProductForm() {
  const m = document.getElementById('sc-prod-modal');
  if (m) { m.style.display = 'none'; m.classList.remove('show'); }
  _scProdEditId = null;
}

function deleteSCProduct(id) {
  const p = gSCProducts().find(x => x.id === id);
  if (!confirm(`Delete product "${p?.name||id}" and ALL its transactions?`)) return;
  
  // Delete via API
  fetch(`/api/kartu-stok/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        showQuickToast('❌ Gagal menghapus: ' + (json.error || 'Unknown error'));
        return;
      }
      
      sSCProducts(gSCProducts().filter(x => x.id !== id));
      sSCTxn(gSCTxn().filter(t => t.productId !== id));
      renderStockCards();
      showQuickToast('🗑️ Product deleted.');
    })
    .catch(err => {
      console.error('deleteSCProduct error:', err);
      showQuickToast('❌ Gagal menghapus: ' + err.message);
    });
}

// ── FINISH / UNFINISH STOCK CARD ─────────────────────────────────
window.toggleSCFinish = function(productId) {
  const products = gSCProducts();
  const p = products.find(x => x.id === productId);
  if (!p) return;
  
  // Toggle via API
  fetch(`/api/kartu-stok/${productId}/toggle-finished`, { method: 'PUT' })
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        showQuickToast('❌ Gagal: ' + (json.error || 'Unknown error'));
        return;
      }
      
      // Update local cache
      p.finished = json.data.finished;
      sSCProducts(products);
      renderStockCards();
      showQuickToast(json.message);
    })
    .catch(err => {
      console.error('toggleSCFinish error:', err);
      showQuickToast('❌ Gagal: ' + err.message);
    });
};

// ── VIEW ONLY MODE ───────────────────────────────────────────────
window.viewSCProduct = function(productId) {
  const products = gSCProducts();
  const txnAll = gSCTxn();
  const p = products.find(x => x.id === productId);
  if (!p) return;

  const txns = txnAll
    .filter(t => t.productId === p.id)
    .sort((a, b) => (a.date||'').localeCompare(b.date||''));

  let runBal = 0;
  const fmt = v => v ? parseFloat(v).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3}) : '';
  
  const txnRows = txns.map((t, ti) => {
    const keluar = parseFloat(t.debit)  || 0; 
    const masuk  = parseFloat(t.credit) || 0; 
    runBal += masuk - keluar; 
    
    const balClr = runBal < 0 ? '#dc2626' : '#15803d';
    const rowBg  = ti % 2 === 0 ? '#fff' : '#f8fafc';

    const txtKeluar = keluar ? `<span style="color:#dc2626;font-weight:700;">${fmt(keluar)}</span>` : '';
    const txtMasuk  = masuk ? `<span style="color:#15803d;font-weight:700;">${fmt(masuk)}</span>` : '';
    const sealBatch = t.seal || '—';

    return `<tr style="background:${rowBg}">
      <td style="font-family:'DM Mono',monospace;font-size:11px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0;padding:5px 6px">${ti+1}</td>
      <td style="font-size:11px;white-space:nowrap;border:1px solid #e2e8f0;padding:5px 8px;text-align:center;">${t.date||'—'}</td>
      <td style="font-family:'DM Mono',monospace;font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;color:var(--blue);font-weight:600;text-align:center;">${sealBatch}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;text-align:center;border:1px solid #e2e8f0;padding:5px 8px">${txtKeluar}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;text-align:center;border:1px solid #e2e8f0;padding:5px 8px">${txtMasuk}</td>
      <td style="font-family:'DM Mono',monospace;font-size:13px;font-weight:800;text-align:center;border:1px solid #e2e8f0;padding:5px 8px;color:${balClr}">${runBal.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3})}</td>
      <td style="font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;text-align:center">${t.pic || '—'}</td>
      <td style="font-size:11px;border:1px solid #e2e8f0;padding:5px 8px;max-width:160px">${t.desc||'—'}</td>
    </tr>`;
  }).join('');

  const finalBal   = txns.reduce((acc, t) => acc + (parseFloat(t.credit)||0) - (parseFloat(t.debit)||0), 0);
  const balChipBg  = finalBal < 0 ? '#fee2e2' : '#dcfce7';
  const balChipClr = finalBal < 0 ? '#b91c1c' : '#15803d';
  const balChipBdr = finalBal < 0 ? '#fca5a5' : '#86efac';

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'sc-view-modal';
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.5);
    display:flex; align-items:center; justify-content:center;
    z-index:10000; padding:16px;
  `;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:12px;width:100%;max-width:900px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="background:#22c55e;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #16a34a;">
        <div style="font-size:16px;font-weight:800;color:#fff;">👁️ Lihat Kartu Stok</div>
        <button onclick="document.getElementById('sc-view-modal').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;font-size:20px;cursor:pointer;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      
      <div style="padding:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:8px;text-transform:uppercase;">Nama Barang</div>
            <div style="font-size:16px;font-weight:800;color:var(--txt);">${p.name}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:8px;text-transform:uppercase;">Satuan</div>
            <div style="font-size:16px;font-weight:800;color:var(--txt);">${p.unit||'—'}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:8px;text-transform:uppercase;">Lokasi / Gudang</div>
            <div style="font-size:14px;color:var(--txt);">${p.loc||'—'}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:8px;text-transform:uppercase;">PIC</div>
            <div style="font-size:14px;color:var(--txt);">${p.pic||'—'}</div>
          </div>
          <div style="grid-column:1/-1;">
            <div style="background:${balChipBg};border:2px solid ${balChipBdr};color:${balChipClr};padding:12px 16px;border-radius:8px;font-size:14px;font-weight:800;text-align:center;">
              Saldo Akhir: ${finalBal.toLocaleString('id-ID')} ${p.unit||''}
            </div>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:800px;">
            <thead>
              <tr style="background:#22c55e;color:#fff;">
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;width:36px;">NO.</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">TANGGAL</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">NO. SEAL / BATCH</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">KELUAR</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">MASUK</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">SISA</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">PIC</th>
                <th style="border:1px solid #16a34a;padding:8px;font-size:11px;text-align:center;">DESKRIPSI</th>
              </tr>
            </thead>
            <tbody>
              ${txnRows || `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--txt3);font-size:12px;border:1px solid var(--border);">Belum ada transaksi</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  
  document.body.appendChild(modal);
};

// ── TRANSACTION FORM ─────────────────────────────────────────
function openSCTxnForm(productId, txnId = null) {
  _scTxnProdId = productId;
  _scTxnEditId = txnId;
  const today = new Date().toISOString().split('T')[0];

  const p   = gSCProducts().find(x => x.id === productId);
  const lbl = document.getElementById('sc-txn-prod-label');
  if (lbl) lbl.textContent = p ? `📦 Product: ${p.name}` : '';

  if (txnId) {
    const t = gSCTxn().find(x => x.id === txnId);
    if (t) {
      document.getElementById('sc-txn-modal-title').textContent = '✏️ Edit Transaksi';
      document.getElementById('sc-t-date').value   = t.date   || today;
      document.getElementById('sc-t-debit').value  = t.debit  || '';
      document.getElementById('sc-t-credit').value = t.credit || '';
      document.getElementById('sc-t-seal').value   = t.seal   || '';
      document.getElementById('sc-t-pic').value    = t.pic    || '';
      document.getElementById('sc-t-desc').value   = t.desc   || '';
      document.getElementById('sc-t-notes').value  = t.notes  || '';
    }
  } else {
    document.getElementById('sc-txn-modal-title').textContent = '➕ Tambah Transaksi';
    document.getElementById('sc-t-date').value = today;
    ['sc-t-debit','sc-t-credit','sc-t-seal','sc-t-pic','sc-t-desc','sc-t-notes'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  }
  const sb = document.getElementById('sc-t-sb'); if (sb) sb.style.display = 'none';
  const m  = document.getElementById('sc-txn-modal');
  if (m) { m.style.display = 'flex'; m.classList.add('show'); }
}

function closeSCTxnForm() {
  const m = document.getElementById('sc-txn-modal');
  if (m) { m.style.display = 'none'; m.classList.remove('show'); }
  _scTxnProdId = null; _scTxnEditId = null;
}

function submitSCTxn() {
  const date   = document.getElementById('sc-t-date')?.value;
  if (!date)   { showSCTxnSt('error', '❌ Date is required!'); return; }
  const debit  = document.getElementById('sc-t-debit')?.value  || '';
  const credit = document.getElementById('sc-t-credit')?.value || '';
  if (!debit && !credit) { showSCTxnSt('error', '❌ Fill in Debit (In) or Credit (Out)!'); return; }
  
  // Prepare API payload
  const apiPayload = {
    tanggal: date,
    debit: parseFloat(debit) || 0,
    kredit: parseFloat(credit) || 0,
    no_seal: document.getElementById('sc-t-seal')?.value.trim() || null,
    keterangan: document.getElementById('sc-t-desc')?.value.trim() || null
  };

  const txnEndpoint = _scTxnEditId 
    ? `/api/kartu-stok/${_scTxnProdId}/transaksi/${_scTxnEditId}`
    : `/api/kartu-stok/${_scTxnProdId}/transaksi`;
  
  const method = _scTxnEditId ? 'PUT' : 'POST';

  fetch(txnEndpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiPayload)
  })
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        showSCTxnSt('error', '❌ Gagal menyimpan: ' + (json.error || 'Unknown error'));
        return;
      }
      
      const txns = gSCTxn();
      const entry = {
        id: json.data.id.toString(),
        productId: _scTxnProdId,
        date: json.data.tanggal,
        debit: json.data.debit,
        credit: json.data.kredit,
        seal: json.data.no_seal || '',
        pic: '',
        desc: json.data.keterangan || '',
        notes: '',
      };
      
      if (_scTxnEditId) {
        const idx = txns.findIndex(t => t.id === _scTxnEditId);
        if (idx >= 0) txns[idx] = entry; else txns.push(entry);
      } else {
        txns.push(entry);
      }
      sSCTxn(txns);
      showSCTxnSt('success', '✅ Transaction saved!');
      setTimeout(() => { closeSCTxnForm(); renderStockCards(); }, 700);
    })
    .catch(err => {
      console.error('submitSCTxn error:', err);
      showSCTxnSt('error', '❌ Gagal menyimpan: ' + err.message);
    });
}

function editSCTxn(productId, txnId) {
  openSCTxnForm(productId, txnId);
}

function deleteSCTxn(txnId) {
  if (!confirm('Delete this transaction?')) return;
  
  // Get the product ID from current transaction
  const txn = gSCTxn().find(t => t.id === txnId);
  if (!txn) return;
  
  fetch(`/api/kartu-stok/${txn.productId}/transaksi/${txnId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        showQuickToast('❌ Gagal menghapus: ' + (json.error || 'Unknown error'));
        return;
      }
      
      sSCTxn(gSCTxn().filter(t => t.id !== txnId));
      renderStockCards();
      showQuickToast('🗑️ Transaction deleted.');
    })
    .catch(err => {
      console.error('deleteSCTxn error:', err);
      showQuickToast('❌ Gagal menghapus: ' + err.message);
    });
}

function showSCProdSt(type, msg) {
  const b = document.getElementById('sc-p-sb'), m = document.getElementById('sc-p-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type === 'success') setTimeout(() => { if (b) b.style.display = 'none'; }, 3000);
}

function showSCTxnSt(type, msg) {
  const b = document.getElementById('sc-t-sb'), m = document.getElementById('sc-t-sm');
  if (!b || !m) return;
  b.style.display = 'flex'; b.className = 'de-status-bar de-status-' + type; m.textContent = msg;
  if (type === 'success') setTimeout(() => { if (b) b.style.display = 'none'; }, 3000);
}

// ── HELPER: DROPDOWN LOKASI DINAMIS ──
// ─ Cache untuk locations (fetched dari API) ─
let _scLocationsCache = ['Gudang A, Rak 1', 'Gudang B']; // Default fallback

// Fetch locations dari API
window.loadSCLocationsFromAPI = async function() {
  try {
    const resp = await fetch('/api/kartu-stok/locations/all');
    if (!resp.ok) throw new Error('Failed to fetch locations');
    const json = await resp.json();
    if (json.success && Array.isArray(json.data)) {
      _scLocationsCache = json.data;
      // Sync dengan localStorage untuk backward compat
      localStorage.setItem('custom_stock_locations', JSON.stringify(json.data));
      console.log('✅ Locations loaded from API:', _scLocationsCache);
      return json.data;
    }
  } catch (err) {
    console.warn('⚠️ Failed to load locations from API, using cache:', err.message);
    // Fallback ke localStorage jika API fail
    _scLocationsCache = JSON.parse(localStorage.getItem('custom_stock_locations') || '["Gudang A, Rak 1", "Gudang B"]');
  }
  return _scLocationsCache;
};

window.buildStockLocationDropdown = function(id, value) {
    const locations = _scLocationsCache;
    let opts = '<option value="">-- Pilih Lokasi --</option>';
    opts += '<option value="__ADD_NEW__" style="font-weight:bold;color:var(--blue);">＋ Tambah Lokasi Baru...</option>';
    
    locations.forEach(loc => {
        const sel = (loc === value) ? 'selected' : '';
        opts += `<option value="${loc}" ${sel}>${loc}</option>`;
    });

    if (value && !locations.includes(value) && value !== '__ADD_NEW__') {
        opts += `<option value="${value}" selected>${value}</option>`;
    }

    const showDel = locations.includes(value) ? 'block' : 'none';

    return `
    <div style="display:flex;flex-direction:column;gap:6px;width:100%;">
        <div style="display:flex;gap:6px;align-items:center;width:100%;">
            <select class="de-input de-select loc-dropdown" id="${id}" style="flex:1" onchange="handleLocChange('${id}')" data-prev-value="${value || ''}">
                ${opts}
            </select>
            <button type="button" id="${id}-del" onclick="deleteLocation('${id}')" style="display:${showDel};background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Hapus Lokasi Ini">✕</button>
        </div>
        <div id="${id}-custom-wrap" style="display:none; gap:6px; align-items:center;">
            <input class="de-input exclude-save" id="${id}-new" type="text" placeholder="Nama lokasi baru..." style="flex:1;">
            <button type="button" class="de-btn de-btn-primary exclude-save" style="padding:7px 14px;font-size:11px" onclick="saveNewLocation('${id}')">Simpan</button>
            <button type="button" class="exclude-save" onclick="cancelAddLocation('${id}')" style="background:none;border:none;color:var(--red);font-size:18px;font-weight:bold;cursor:pointer;padding:0 5px;" title="Batal">✕</button>
        </div>
    </div>`;
};

window.handleLocChange = function(id) {
    const sel = document.getElementById(id);
    const delBtn = document.getElementById(id + '-del');
    const customWrap = document.getElementById(id + '-custom-wrap');
    if (!sel) return;

    if (sel.value === '__ADD_NEW__') {
        customWrap.style.display = 'flex';
        delBtn.style.display = 'none';
    } else {
        customWrap.style.display = 'none';
        const locations = _scLocationsCache;
        delBtn.style.display = locations.includes(sel.value) ? 'block' : 'none';
    }
};

window.saveNewLocation = async function(id) {
    const input = document.getElementById(id + '-new');
    const newVal = input.value.trim();
    if (!newVal) return alert('Lokasi tidak boleh kosong!');

    try {
      // Save ke API
      const resp = await fetch('/api/kartu-stok/locations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_lokasi: newVal })
      });
      const json = await resp.json();
      
      if (!json.success) {
        return alert('❌ ' + (json.error || 'Gagal menambah lokasi'));
      }
      
      // Update cache
      if (!_scLocationsCache.includes(newVal)) {
        _scLocationsCache.push(newVal);
      }
      localStorage.setItem('custom_stock_locations', JSON.stringify(_scLocationsCache));
      
      console.log('✅ Lokasi ditambahkan:', newVal);
    } catch (err) {
      console.error('Error saving location:', err);
      return alert('❌ Error: ' + err.message);
    }

    document.getElementById(id + '-custom-wrap').style.display = 'none';
    document.querySelectorAll('.loc-dropdown').forEach(dropdown => {
        const currentVal = dropdown.id === id ? newVal : dropdown.value;
        dropdown.outerHTML = buildStockLocationDropdown(dropdown.id, currentVal);
    });
};

window.cancelAddLocation = function(id) {
    const sel = document.getElementById(id);
    document.getElementById(id + '-custom-wrap').style.display = 'none';
    sel.value = sel.getAttribute('data-prev-value') || '';
    if(sel.value === '__ADD_NEW__') sel.value = '';
    handleLocChange(id);
};

window.deleteLocation = async function(id) {
    const sel = document.getElementById(id);
    const val = sel.value;
    if (!val || val === '__ADD_NEW__') return;

    if (!confirm(`Hapus lokasi "${val}" dari daftar?`)) return;

    try {
      // Delete dari API
      const resp = await fetch(`/api/kartu-stok/locations/${encodeURIComponent(val)}`, {
        method: 'DELETE'
      });
      const json = await resp.json();
      
      if (!json.success) {
        return alert('❌ ' + (json.error || 'Gagal menghapus lokasi'));
      }
      
      // Update cache
      _scLocationsCache = _scLocationsCache.filter(l => l !== val);
      localStorage.setItem('custom_stock_locations', JSON.stringify(_scLocationsCache));
      
      console.log('✅ Lokasi dihapus:', val);
    } catch (err) {
      console.error('Error deleting location:', err);
      return alert('❌ Error: ' + err.message);
    }
    
    document.querySelectorAll('.loc-dropdown').forEach(dropdown => {
        const currentVal = dropdown.value === val ? '' : dropdown.value;
        dropdown.outerHTML = buildStockLocationDropdown(dropdown.id, currentVal);
    });
};

// ── Backward compat stubs ─────────────────────────────────────
function openKartuStokForm()  { openSCProductForm(); }
function closeKartuStokForm() { closeSCProductForm(); }
function submitKartuStok()    { submitSCProduct(); }
function renderKartuStok()    { renderStockCards(); }
function editKartuStok()  {}
function deleteKartuStok() {}
function showKsSt(type, msg) {}
window.editKartuStok    = editKartuStok;
window.deleteKartuStok  = deleteKartuStok;
window.openSCProductForm  = openSCProductForm;
window.closeSCProductForm = closeSCProductForm;
window.submitSCProduct    = submitSCProduct;
window.deleteSCProduct    = deleteSCProduct;
window.openSCTxnForm  = openSCTxnForm;
window.closeSCTxnForm = closeSCTxnForm;
window.submitSCTxn    = submitSCTxn;
window.editSCTxn      = editSCTxn;
window.deleteSCTxn    = deleteSCTxn;
window.renderStockCards = renderStockCards;