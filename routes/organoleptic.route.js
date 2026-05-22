// routes/organoleptic.route.js  — v3.0
// Perubahan: assessments menyimpan accountUser (username akun) untuk lock per akun
// DB schema: tidak ada perubahan — accountUser disimpan di dalam JSONB assessments[]
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { pool } = require('../db');

// Helper parse JSON field
const parseJ = v => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

// ── GET /api/organoleptic — semua test ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM organoleptic ORDER BY created_at DESC`
    );
    const data = rows.map(r => ({
      ...r,
      _id:          r.id,
      sampleName:   r.sample_name,
      sampleNo:     r.sample_no,
      panelCount:   r.panel_count,
      categoryType: r.category_type,
      createdAt:    r.created_at,
      completedAt:  r.completed_at,
      assessments:  parseJ(r.assessments),
    }));
    res.json(data);
  } catch (err) {
    console.error('GET /organoleptic:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/organoleptic/:id ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM organoleptic WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      ...r,
      _id:          r.id,
      sampleName:   r.sample_name,
      sampleNo:     r.sample_no,
      panelCount:   r.panel_count,
      categoryType: r.category_type,
      createdAt:    r.created_at,
      completedAt:  r.completed_at,
      assessments:  parseJ(r.assessments),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/organoleptic — buat test baru ───────────────────────────
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const sampleNo    = d.sampleNo    || d.sample_no    || null;
    const sampleName  = d.sampleName  || d.sample_name  || null;
    const category    = d.category    || null;
    const categoryType= d.categoryType|| d.category_type|| 'teh';
    const panelCount  = d.panelCount  || d.panel_count  || 4;
    const createdBy   = d.createdBy   || d.created_by   || null;

    const { rows } = await pool.query(`
      INSERT INTO organoleptic
        (sample_no, sample_name, category, category_type, panel_count, status, assessments, created_by)
      VALUES ($1, $2, $3, $4, $5, 'open', '[]', $6)
      RETURNING *
    `, [sampleNo, sampleName, category, categoryType, panelCount, createdBy]);

    const r = rows[0];
    res.json({
      ...r,
      _id:          r.id,
      sampleName:   r.sample_name,
      sampleNo:     r.sample_no,
      panelCount:   r.panel_count,
      categoryType: r.category_type,
      createdAt:    r.created_at,
      assessments:  [],
    });
  } catch (err) {
    console.error('POST /organoleptic:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/organoleptic/:id — update assessments, status, dll ───────
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    // Validasi: cegah 1 accountUser mengisi 2x (server-side guard)
    if (d.assessments) {
      // Cek duplicate accountUser di dalam array assessments baru
      const accounts = d.assessments
        .map(a => a.accountUser)
        .filter(Boolean);
      const unique = new Set(accounts);
      if (unique.size < accounts.length) {
        return res.status(409).json({
          error: 'Satu akun hanya boleh mengisi 1 kali per sesi.'
        });
      }
    }

    const assessmentsJson = d.assessments != null
      ? JSON.stringify(d.assessments)
      : null;

    const { rows } = await pool.query(`
      UPDATE organoleptic SET
        sample_name   = COALESCE($1, sample_name),
        sample_no     = COALESCE($2, sample_no),
        category      = COALESCE($3, category),
        category_type = COALESCE($4, category_type),
        panel_count   = COALESCE($5, panel_count),
        status        = COALESCE($6, status),
        assessments   = COALESCE($7::jsonb, assessments),
        completed_at  = COALESCE($8, completed_at),
        updated_at    = now()
      WHERE id = $9
      RETURNING *
    `, [
      d.sampleName  || d.sample_name  || null,
      d.sampleNo    || d.sample_no    || null,
      d.category    || null,
      d.categoryType|| d.category_type|| null,
      d.panelCount  || d.panel_count  || null,
      d.status      || null,
      assessmentsJson,
      d.completedAt || d.completed_at || null,
      req.params.id,
    ]);

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      ...r,
      _id:          r.id,
      sampleName:   r.sample_name,
      sampleNo:     r.sample_no,
      panelCount:   r.panel_count,
      categoryType: r.category_type,
      createdAt:    r.created_at,
      completedAt:  r.completed_at,
      assessments:  parseJ(r.assessments),
    });
  } catch (err) {
    console.error('PUT /organoleptic/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/organoleptic/:id ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM organoleptic WHERE id = $1`, [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;