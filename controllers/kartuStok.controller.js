// controllers/kartuStok.controller.js
const { pool } = require('../db');

// ══ PRODUCTS ════════════════════════════════════════════════════

// GET /api/kartu-stok — semua produk + transaksinya
// GET /api/kartu-stok — Mengambil semua produk beserta riwayat transaksinya
async function getAllProducts(req, res) {
  try {
    // 1. Log untuk memantau akses (Sangat berguna untuk multiuser test)
    console.log(`[${new Date().toLocaleString()}] 📥 Request data kartu stok dari: ${req.ip}`);

    // 2. Ambil semua data produk utama
    // Menggunakan ORDER BY agar data terbaru/yang sedang aktif muncul paling atas
    const products = await pool.query(
      `SELECT * FROM kartu_stok ORDER BY created_at DESC`
    );

    // 3. Ambil transaksi untuk setiap produk secara paralel
    const result = await Promise.all(products.rows.map(async (p) => {
      const txn = await pool.query(
        `SELECT * FROM kartu_stok_transaksi
         WHERE kartu_stok_id = $1
         ORDER BY tanggal ASC, created_at ASC`,
        [p.id]
      );

      // 4. Logika perhitungan Saldo Berjalan (Running Balance)
      // Ini penting agar saldo dihitung otomatis berdasarkan history transaksi
      let saldo = 0;
      const transaksi = txn.rows.map(t => {
        const masuk = parseFloat(t.debit) || 0;
        const keluar = parseFloat(t.kredit) || 0;
        saldo += (masuk - keluar);
        
        return { 
          ...t, 
          saldo: parseFloat(saldo.toFixed(3)) // Batasi 3 angka di belakang koma
        };
      });

      return { 
        ...p, 
        transaksi,
        // Tambahkan saldo akhir ke object produk utama agar mudah dibaca di frontend
        total_stok: parseFloat(saldo.toFixed(3)) 
      };
    }));

    // 5. Kirim data ke Frontend
    console.log(`[${new Date().toLocaleString()}] 📤 Berhasil mengirim ${result.length} data produk.`);
    res.json({ success: true, data: result });

  } catch (err) {
    // Jika ada error (misal tabel tidak ketemu), akan muncul di terminal Ubuntu Anda
    console.error('❌ getAllProducts Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Gagal mengambil data kartu stok: ' + err.message 
    });
  }
}

// POST /api/kartu-stok — tambah produk baru
async function createProduct(req, res) {
  try {
    const { 
      nama_barang, kode_barang, satuan, 
      stok_minimum, stok_maksimum, lokasi, 
      penanggung_jawab, notes 
    } = req.body;

    if (!nama_barang) return res.status(400).json({ success: false, error: 'Nama barang wajib diisi' });

    const r = await pool.query(
      `INSERT INTO kartu_stok (
        nama_barang, kode_barang, satuan, 
        stok_minimum, stok_maksimum, lokasi, 
        penanggung_jawab, notes, jumlah, finished, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now()) RETURNING *`,
      [
        nama_barang, 
        kode_barang || null, 
        satuan || null,
        parseFloat(stok_minimum) || 0, 
        parseFloat(stok_maksimum) || 0, 
        lokasi || null, 
        penanggung_jawab || null,
        notes || null,
        0,      // jumlah awal diset 0 agar tidak error NOT NULL
        false   // finished default false
      ]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('❌ createProduct error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/kartu-stok/:id — edit produk
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { nama_barang, kode_barang, satuan, stok_minimum, stok_maksimum, lokasi, penanggung_jawab } = req.body;

    const r = await pool.query(
      `UPDATE kartu_stok
       SET nama_barang=$1, kode_barang=$2, satuan=$3,
           stok_minimum=$4, stok_maksimum=$5, lokasi=$6,
           penanggung_jawab=$7, updated_at=now()
       WHERE id=$8 RETURNING *`,
      [nama_barang, kode_barang||null, satuan||null,
       parseFloat(stok_minimum)||0, parseFloat(stok_maksimum)||0,
       lokasi||null, penanggung_jawab||null, id]
    );
    if (!r.rows.length) return res.status(404).json({ success:false, error:'Produk tidak ditemukan' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/kartu-stok/:id — hapus produk + semua transaksinya
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM kartu_stok_transaksi WHERE kartu_stok_id = $1`, [id]);
    await pool.query(`DELETE FROM kartu_stok WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Produk dan transaksi dihapus' });
  } catch (err) {
    console.error('deleteProduct error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ══ TRANSAKSI ════════════════════════════════════════════════════

// POST /api/kartu-stok/:id/transaksi — tambah transaksi
async function createTxn(req, res) {
  try {
    const { id } = req.params;
    const { tanggal, debit, kredit, no_seal, keterangan } = req.body;
    if (!tanggal) return res.status(400).json({ success: false, error: 'Tanggal wajib diisi' });

    const r = await pool.query(
      `INSERT INTO kartu_stok_transaksi
         (kartu_stok_id, tanggal, debit, kredit, no_seal, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, tanggal,
       parseFloat(debit)  || 0,
       parseFloat(kredit) || 0,
       no_seal    || null,
       keterangan || null]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('createTxn error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/kartu-stok/:id/transaksi/:txnId — edit transaksi
async function updateTxn(req, res) {
  try {
    const { txnId } = req.params;
    const { tanggal, debit, kredit, no_seal, keterangan } = req.body;

    const r = await pool.query(
      `UPDATE kartu_stok_transaksi
       SET tanggal=$1, debit=$2, kredit=$3, no_seal=$4, keterangan=$5, updated_at=now()
       WHERE id=$6 RETURNING *`,
      [tanggal, parseFloat(debit)||0, parseFloat(kredit)||0,
       no_seal||null, keterangan||null, txnId]
    );
    if (!r.rows.length) return res.status(404).json({ success:false, error:'Transaksi tidak ditemukan' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('updateTxn error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/kartu-stok/:id/transaksi/:txnId — hapus transaksi
async function deleteTxn(req, res) {
  try {
    const { txnId } = req.params;
    await pool.query(`DELETE FROM kartu_stok_transaksi WHERE id = $1`, [txnId]);
    res.json({ success: true, message: 'Transaksi dihapus' });
  } catch (err) {
    console.error('deleteTxn error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/kartu-stok/:id/toggle-finished — toggle status selesai
async function toggleFinished(req, res) {
  try {
    const { id } = req.params;
    
    // Get current finished status
    const current = await pool.query(
      `SELECT finished FROM kartu_stok WHERE id = $1`,
      [id]
    );
    
    if (!current.rows.length) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }
    
    const isCurrentlyFinished = current.rows[0].finished || false;
    const newStatus = !isCurrentlyFinished;
    
    // Update finished status
    const r = await pool.query(
      `UPDATE kartu_stok
       SET finished = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );
    
    res.json({ 
      success: true, 
      data: r.rows[0],
      message: newStatus ? '✅ Kartu stok ditandai selesai!' : '↩️ Kartu stok dibuka kembali.'
    });
  } catch (err) {
    console.error('toggleFinished error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ══ LOCATIONS ════════════════════════════════════════════════════

// GET /api/kartu-stok/locations — Ambil semua custom locations
async function getAllLocations(req, res) {
  try {
    const result = await pool.query(
      `SELECT nama_lokasi FROM stock_locations ORDER BY created_at ASC`
    );
    const locations = result.rows.map(r => r.nama_lokasi);
    res.json({ success: true, data: locations });
  } catch (err) {
    console.error('getAllLocations error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/kartu-stok/locations — Tambah lokasi baru
async function createLocation(req, res) {
  try {
    const { nama_lokasi } = req.body;
    
    if (!nama_lokasi || !nama_lokasi.trim()) {
      return res.status(400).json({ success: false, error: 'Nama lokasi wajib diisi' });
    }
    
    // Cek duplikat
    const existing = await pool.query(
      `SELECT id FROM stock_locations WHERE LOWER(nama_lokasi) = LOWER($1)`,
      [nama_lokasi.trim()]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Lokasi ini sudah ada' });
    }
    
    // Insert
    const result = await pool.query(
      `INSERT INTO stock_locations (nama_lokasi, created_at, updated_at) 
       VALUES ($1, now(), now()) 
       RETURNING nama_lokasi`,
      [nama_lokasi.trim()]
    );
    
    res.json({ success: true, data: result.rows[0].nama_lokasi });
  } catch (err) {
    console.error('createLocation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/kartu-stok/locations/:nama_lokasi — Hapus lokasi
async function deleteLocation(req, res) {
  try {
    const { nama_lokasi } = req.params;
    
    // Cek apakah lokasi masih digunakan
    const inUse = await pool.query(
      `SELECT COUNT(*) as count FROM kartu_stok WHERE lokasi = $1`,
      [nama_lokasi]
    );
    
    if (inUse.rows[0].count > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Lokasi "${nama_lokasi}" masih digunakan oleh ${inUse.rows[0].count} produk. Hapus produk terlebih dahulu.`
      });
    }
    
    // Delete
    const result = await pool.query(
      `DELETE FROM stock_locations WHERE nama_lokasi = $1 RETURNING nama_lokasi`,
      [nama_lokasi]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lokasi tidak ditemukan' });
    }
    
    res.json({ success: true, message: `Lokasi "${nama_lokasi}" berhasil dihapus` });
  } catch (err) {
    console.error('deleteLocation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  createTxn, updateTxn, deleteTxn,
  toggleFinished,
  getAllLocations, createLocation, deleteLocation,
};
