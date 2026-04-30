// controllers/kartuStok.controller.js
const { pool } = require('../db');

// ══ PRODUCTS ════════════════════════════════════════════════════

// GET /api/kartu-stok — semua produk + transaksinya
async function getAllProducts(req, res) {
  try {
    const products = await pool.query(
      `SELECT * FROM kartu_stok ORDER BY created_at DESC`
    );

    // Untuk setiap produk, ambil transaksinya
    const result = await Promise.all(products.rows.map(async (p) => {
      const txn = await pool.query(
        `SELECT * FROM kartu_stok_transaksi
         WHERE kartu_stok_id = $1
         ORDER BY tanggal ASC, created_at ASC`,
        [p.id]
      );

      // Hitung saldo berjalan
      let saldo = 0;
      const transaksi = txn.rows.map(t => {
        saldo += (parseFloat(t.debit) || 0) - (parseFloat(t.kredit) || 0);
        return { ...t, saldo: parseFloat(saldo.toFixed(3)) };
      });

      return { ...p, transaksi };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getAllProducts error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/kartu-stok — tambah produk baru
async function createProduct(req, res) {
  try {
    const { nama_barang, kode_barang, satuan, stok_minimum, stok_maksimum, lokasi } = req.body;
    if (!nama_barang) return res.status(400).json({ success: false, error: 'Nama barang wajib diisi' });

    const r = await pool.query(
      `INSERT INTO kartu_stok (nama_barang, kode_barang, satuan, stok_minimum, stok_maksimum, lokasi)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nama_barang, kode_barang || null, satuan || null,
       parseFloat(stok_minimum) || 0, parseFloat(stok_maksimum) || 0, lokasi || null]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/kartu-stok/:id — edit produk
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { nama_barang, kode_barang, satuan, stok_minimum, stok_maksimum, lokasi } = req.body;

    const r = await pool.query(
      `UPDATE kartu_stok
       SET nama_barang=$1, kode_barang=$2, satuan=$3,
           stok_minimum=$4, stok_maksimum=$5, lokasi=$6,
           updated_at=now()
       WHERE id=$7 RETURNING *`,
      [nama_barang, kode_barang||null, satuan||null,
       parseFloat(stok_minimum)||0, parseFloat(stok_maksimum)||0,
       lokasi||null, id]
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

module.exports = {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  createTxn, updateTxn, deleteTxn,
};
