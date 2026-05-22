// ═══════════════════════════════════════════════════════════════
// LAB SAMPLES — Endpoint untuk sync daftar sample antar device
// Tambahkan ke dataentry.route.js:
//   const labSamplesCtrl = require('./labSamples.controller');
//   router.get('/lab-samples',    labSamplesCtrl.getLabSamples);
//   router.post('/lab-samples',   labSamplesCtrl.addLabSample);
//   router.delete('/lab-samples', labSamplesCtrl.deleteLabSample);
// ═══════════════════════════════════════════════════════════════

// controllers/labSamples.controller.js
const { pool } = require('../db');

// Pastikan tabel lab_samples ada
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lab_samples (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(200) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

// GET /api/dataentry/lab-samples — ambil semua sample
async function getLabSamples(req, res) {
  try {
    await ensureTable();
    const { rows } = await pool.query(
      `SELECT id, name, created_at FROM lab_samples ORDER BY name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getLabSamples error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/dataentry/lab-samples — tambah sample baru
async function addLabSample(req, res) {
  try {
    await ensureTable();
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Field name wajib diisi' });
    }
    const { rows } = await pool.query(
      `INSERT INTO lab_samples (name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name.trim()]
    );
    res.json({ success: true, data: rows[0] || { name: name.trim() } });
  } catch (err) {
    console.error('addLabSample error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/dataentry/lab-samples — hapus sample by name
async function deleteLabSample(req, res) {
  try {
    await ensureTable();
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Field name wajib diisi' });
    }
    await pool.query(`DELETE FROM lab_samples WHERE name = $1`, [name.trim()]);
    res.json({ success: true, deleted: name.trim() });
  } catch (err) {
    console.error('deleteLabSample error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getLabSamples, addLabSample, deleteLabSample };
