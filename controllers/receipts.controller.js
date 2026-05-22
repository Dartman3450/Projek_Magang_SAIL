// controllers/receipts.controller.js
// CRUD untuk tabel receipts — diakses semua perangkat via API (bukan localStorage)

const { pool } = require('../db');

// GET /api/receipts — ambil semua receipt
async function getReceipts(req, res) {
  try {
    const { kategori } = req.query;
    let q = `SELECT * FROM receipts WHERE 1=1`;
    const params = [];
    if (kategori) { params.push(kategori); q += ` AND kategori = $${params.length}`; }
    q += ` ORDER BY created_at DESC`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ getReceipts:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/receipts/:id — ambil satu receipt
async function getReceiptById(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM receipts WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Receipt tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/receipts — buat receipt baru
async function createReceipt(req, res) {
  try {
    const { name, kategori, sp_data, proj_info, created_by } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Field name wajib diisi' });

    // Gabungkan sp_data + proj_info agar tools/materials/notes tersimpan
    const mergedData = { ...(sp_data || {}), ...(proj_info || {}) };

    const result = await pool.query(`
      INSERT INTO receipts (name, kategori, sp_data, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, now(), now()) RETURNING *
    `, [
      name,
      kategori || null,
      JSON.stringify(mergedData),
      created_by || null,
    ]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ createReceipt:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/receipts/:id — update receipt
async function updateReceipt(req, res) {
  try {
    const { name, kategori, sp_data, proj_info } = req.body;
    const mergedData = sp_data || proj_info
      ? { ...(sp_data || {}), ...(proj_info || {}) }
      : null;

    const result = await pool.query(`
      UPDATE receipts SET
        name       = COALESCE($1, name),
        kategori   = COALESCE($2, kategori),
        sp_data    = COALESCE($3, sp_data),
        updated_at = now()
      WHERE id = $4 RETURNING *
    `, [
      name || null,
      kategori || null,
      mergedData ? JSON.stringify(mergedData) : null,
      req.params.id,
    ]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Receipt tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ updateReceipt:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/receipts/:id — hapus receipt
async function deleteReceipt(req, res) {
  try {
    const result = await pool.query(`DELETE FROM receipts WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Receipt tidak ditemukan' });
    res.json({ success: true, deleted: result.rows[0].id });
  } catch (err) {
    console.error('❌ deleteReceipt:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getReceipts, getReceiptById, createReceipt, updateReceipt, deleteReceipt };