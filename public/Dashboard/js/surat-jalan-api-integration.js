// ═══════════════════════════════════════════════════════════════════
// SURAT JALAN API — Frontend Integration
// ═══════════════════════════════════════════════════════════════════
// File ini harus diload SEBELUM surat-jalan.js
// Paste di surat-jalan.js, ganti bagian getter/setter + load/save functions

// ─ Cache untuk surat jalan & items ─
let _sjDataCache = [];
let _sjAvailableItems = [];

// ─ GET Surat Jalan dari cache (fallback to localStorage) ─
function gSJ() {
  return _sjDataCache;
}

// ─ SET Surat Jalan (tidak langsung save, save saat submit) ─
function sSJ(list) {
  _sjDataCache = list;
  // Optional: sync ke localStorage as backup
  localStorage.setItem('sail_surat_jalan', JSON.stringify(list));
}

// ─ Fetch semua surat jalan dari API ─
window.loadSJDataFromAPI = async function() {
  try {
    console.log('📥 Fetching surat jalan dari API...');
    const resp = await fetch('/api/surat-jalan');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const json = await resp.json();
    
    if (!json.success) {
      throw new Error(json.error || 'Unknown API error');
    }
    
    if (!Array.isArray(json.data)) {
      throw new Error('API returned non-array data');
    }
    
    // Map dari database format ke UI format
    _sjDataCache = json.data.map(row => ({
      id: row.id,
      no: row.nomor,
      date: row.tanggal ? String(row.tanggal).split('T')[0] : "",
      penerima: row.penerima,
      alamat: row.alamat,
      kendaraan: row.kendaraan,
      driver: row.pengirim, // atau sesuaikan field
      pengirim: row.pengirim,
      notes: row.catatan,
      items: row.items || []
    }));
    
    console.log('✅ Surat jalan loaded from API:', _sjDataCache.length, 'records');
    return _sjDataCache;
  } catch (err) {
    console.error('❌ Failed to load surat jalan from API:', err.message, err);
    // Fallback ke localStorage
    _sjDataCache = JSON.parse(localStorage.getItem('sail_surat_jalan') || '[]');
    console.warn('⚠️  Using localStorage fallback. Data might be outdated.');
  }
  return _sjDataCache;
};

// ─ Fetch available items (yang belum dipake di surat jalan manapun) ─
window.loadAvailableItemsFromAPI = async function() {
  try {
    console.log('📥 Fetching available items from API...');
    const resp = await fetch('/api/surat-jalan/available-items');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const json = await resp.json();
    
    if (!json.success) {
      throw new Error(json.error || 'Unknown API error');
    }
    
    if (!Array.isArray(json.data)) {
      throw new Error('API returned non-array data');
    }
    
    _sjAvailableItems = json.data;
    console.log('✅ Available items loaded:', _sjAvailableItems.length);
    return _sjAvailableItems;
  } catch (err) {
    console.error('❌ Failed to load available items:', err.message, err);
  }
  return [];
};

// ─ Fetch batch options untuk item tertentu ─
window.getSJBatchOptions = async function(kartu_stok_id) {
  try {
    console.log('📥 Fetching batch options for kartu_stok_id:', kartu_stok_id);
    const resp = await fetch(`/api/surat-jalan/batches/${kartu_stok_id}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const json = await resp.json();
    
    if (!json.success) {
      console.warn('⚠️  Batch API returned success=false:', json.error);
      return [];
    }
    
    const batches = json.data || [];
    console.log('✅ Batch options loaded:', batches.length);
    return batches;
  } catch (err) {
    console.error('❌ Error fetching batch options:', err.message, err);
    return [];
  }
};

// ─ REPLACE populateSjKartuPicker ─
window.populateSjKartuPicker = async function() {
  const picker = document.getElementById('sj-kartu-picker');
  if (!picker) {
    console.warn('⚠️  Element sj-kartu-picker not found');
    return;
  }

  // Load available items
  console.log('📦 Populating kartu picker...');
  const items = await loadAvailableItemsFromAPI();
  
  let opts = '<option value="">-- Pilih produk --</option>';
  items.forEach(item => {
    opts += `<option value="${item.kartu_stok_id}" data-name="${item.nama_barang}">${item.nama_barang} (${item.satuan || 'unit'})</option>`;
  });

  picker.innerHTML = opts;
  console.log('✅ Kartu picker populated with', items.length, 'items');
  
  // Show warning jika semua items sudah dipake
  if (items.length === 0) {
    console.warn('⚠️  No available items');
    const warn = document.querySelector('[role="alert"]');
    if (!warn) {
      const msg = document.createElement('div');
      msg.style.cssText = 'padding:8px 12px;background:#fef3cd;border:1px solid #ffeaa7;border-radius:6px;color:#856404;margin-bottom:12px;font-size:11px;';
      msg.textContent = '⚠️ Semua produk dari Kartu Stok sudah masuk daftar barang di surat jalan lain.';
      msg.setAttribute('role', 'alert');
      const container = document.querySelector('[style*="background:#eff6ff"]');
      if (container) container.parentNode.insertBefore(msg, container);
    }
  }
};

// ─ REPLACE onSjKartuChange ─
window.onSjKartuChange = async function() {
  const picker = document.getElementById('sj-kartu-picker');
  const batchPicker = document.getElementById('sj-batch-picker');
  
  if (!picker || !batchPicker) return;
  
  const kartuStokId = picker.value;
  if (!kartuStokId) {
    batchPicker.innerHTML = '<option value="">-- Pilih batch --</option>';
    return;
  }

  // Fetch batch options
  const batches = await getSJBatchOptions(kartuStokId);
  let opts = '<option value="">-- Pilih batch --</option>';
  batches.forEach(batch => {
    opts += `<option value="${batch}">${batch}</option>`;
  });
  batchPicker.innerHTML = opts;
};

window.onSjBatchChange = function() {
  // Optional: additional logic saat batch dipilih
};

// ─ REPLACE addSjItemFromKartu ─
window.addSjItemFromKartu = async function() {
  const picker = document.getElementById('sj-kartu-picker');
  const batchPicker = document.getElementById('sj-batch-picker');
  const qtyInput = document.getElementById('sj-batch-qty');
  
  if (!picker.value) return alert('Pilih produk terlebih dahulu!');
  if (!qtyInput.value || parseFloat(qtyInput.value) <= 0) return alert('Masukkan quantity!');

  const kartuStokId = picker.value;
  const selectedOption = picker.options[picker.selectedIndex];
  const produkName = selectedOption.getAttribute('data-name') || selectedOption.text;
  const batch = batchPicker.value || '—';
  const qty = parseFloat(qtyInput.value);

  // Buat object item
  const item = {
    kartu_stok_id: kartuStokId,
    name: produkName,
    seal: batch,
    qty: qty,
    desc: ''
  };

  // Tambah ke form
  addSuratJalanItem(item);

  // Reset pickers
  picker.value = '';
  batchPicker.innerHTML = '<option value="">-- Pilih batch --</option>';
  qtyInput.value = '';
};

// ─ UPDATE submitSuratJalan ─
window.submitSuratJalanOld = window.submitSuratJalan;
window.submitSuratJalan = async function() {
  const no = document.getElementById('sj-f-no').value.trim();
  const date = document.getElementById('sj-f-date').value;
  const penerima = document.getElementById('sj-f-penerima').value.trim();
  const kendaraan = document.getElementById('sj-f-kendaraan').value.trim();
  const driver = document.getElementById('sj-f-driver').value.trim();
  const pengirim = document.getElementById('sj-f-pengirim').value.trim();
  const notes = document.getElementById('sj-f-notes').value.trim();

  console.log('💾 Submitting surat jalan:', { no, date, penerima });

  if (!no || !date || !penerima) {
    return alert('Nomor, tanggal, dan penerima wajib diisi!');
  }

  // Collect items dari form
  const itemRows = document.querySelectorAll('#sj-items > div');
  const items = [];
  itemRows.forEach(row => {
    const nameEl = row.querySelector('[id*="-name"]');
    const sealEl = row.querySelector('[id*="-seal"]');
    const qtyEl = row.querySelector('[id*="-qty"]');
    const descEl = row.querySelector('[id*="-desc"]');
    const prodIdEl = row.querySelector('[id*="-prodId"]');
    const rawProdId = prodIdEl?.value?.trim() || '';
    if (nameEl?.value?.trim()) {
      items.push({
        kartu_stok_id: (rawProdId && rawProdId !== '' && !isNaN(parseInt(rawProdId, 10))) ? parseInt(rawProdId, 10) : null,
        name: nameEl.value.trim(),
        seal: sealEl?.value?.trim() || '',
        qty: parseFloat(qtyEl?.value || 0) || 0,
        desc: descEl?.value?.trim() || ''
      });
    }
  });

  if (!items.length) {
    return alert('Tambahkan minimal 1 item!');
  }

  const sb = document.getElementById('sj-sb');
  const sm = document.getElementById('sj-sm');

  try {
    const payload = {
      nomor: String(no ?? ''),
      tanggal: String(date ?? ''),
      penerima: String(penerima ?? ''),
      alamat: String(document.getElementById('sj-f-alamat')?.value?.trim() ?? ''),
      kendaraan: String(kendaraan ?? ''),
      pengirim: String(pengirim ?? ''),
      items: items,
      catatan: String(notes ?? '')
    };

    // Validasi JSON sebelum kirim
    let payloadJson;
    try {
      payloadJson = JSON.stringify(payload);
      JSON.parse(payloadJson); // dry-run test
    } catch (jsonErr) {
      console.error('❌ JSON.stringify failed:', jsonErr);
      if (sb && sm) {
        sb.style.display = 'flex';
        sb.className = 'de-status-bar de-status-error';
        sm.textContent = '❌ Gagal serialize data, cek console';
      }
      return;
    }

    let endpoint = '/api/surat-jalan';
    let method = 'POST';

    // Jika edit, gunakan PUT
    if (_sjEditIdx >= 0 && _sjDataCache[_sjEditIdx]?.id) {
      const sjId = _sjDataCache[_sjEditIdx].id;
      endpoint = `/api/surat-jalan/${sjId}`;
      method = 'PUT';
    }

    console.log(`${method} ${endpoint}`, payload);

    const resp = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: payloadJson
    });

    const json = await resp.json();
    console.log('📨 API Response:', json);

    if (!json.success) {
      if (sb && sm) {
        sb.style.display = 'flex';
        sb.className = 'de-status-bar de-status-error';
        sm.textContent = '❌ ' + (json.error || 'Gagal menyimpan');
      }
      return alert('Error: ' + (json.error || 'Unknown error'));
    }

    // Reload data dari API
    console.log('🔄 Reloading data...');
    await loadSJDataFromAPI();
    renderSuratJalan();
    closeSuratJalanForm();

    if (sb && sm) {
      sb.style.display = 'flex';
      sb.className = 'de-status-bar de-status-success';
      sm.textContent = '✅ Surat jalan disimpan!';
      setTimeout(() => { sb.style.display = 'none'; }, 3000);
    }
    
    console.log('✅ Surat jalan saved successfully');
  } catch (err) {
    console.error('❌ submitSuratJalan error:', err);
    if (sb && sm) {
      sb.style.display = 'flex';
      sb.className = 'de-status-bar de-status-error';
      sm.textContent = '❌ ' + err.message;
    }
  }
};

// ─ UPDATE deleteSuratJalan ─
window.deleteSuratJalanOld = window.deleteSuratJalan;
window.deleteSuratJalan = async function(idx) {
  const sj = gSJ()[idx];
  if (!sj) {
    console.warn('⚠️  Surat jalan not found at index', idx);
    return;
  }

  console.log('🗑️  Deleting surat jalan:', sj.no);

  if (!confirm(`Hapus surat jalan ${sj.no}?`)) return;

  try {
    const sjId = sj.id;
    if (!sjId) {
      console.error('❌ ID surat jalan tidak ditemukan');
      return alert('ID surat jalan tidak ditemukan');
    }

    console.log(`DELETE /api/surat-jalan/${sjId}`);
    const resp = await fetch(`/api/surat-jalan/${sjId}`, { method: 'DELETE' });
    const json = await resp.json();
    
    console.log('📨 API Response:', json);

    if (!json.success) {
      return alert('Error: ' + (json.error || 'Gagal menghapus'));
    }

    // Reload data
    console.log('🔄 Reloading data...');
    await loadSJDataFromAPI();
    renderSuratJalan();
    
    console.log('✅ Surat jalan deleted successfully');
  } catch (err) {
    console.error('❌ deleteSuratJalan error:', err);
    alert('Error: ' + err.message);
  }
};

// ─ UPDATE initSuratJalan untuk load dari API ─
window.initSuratJalanOld = window.initSuratJalan;
window.initSuratJalan = async function() {
  console.log('🚀 initSuratJalan called');
  console.log('📊 Loading data from API...');
  
  await loadSJDataFromAPI();
  await loadAvailableItemsFromAPI();
  
  console.log('🎨 Rendering surat jalan...');
  renderSuratJalan();
  
  console.log('✅ Surat jalan page initialized');
};

window.editSuratJalan = function(idx) {
  _sjEditIdx = idx;
  openSuratJalanForm(idx);
};