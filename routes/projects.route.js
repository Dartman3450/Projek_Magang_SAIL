// routes/projects.route.js
const express = require('express');
const router  = express.Router();
const { pool } = require('../db');

// ════════════════════════════════════════════════════════
// GET /api/projects?type=ongoing|completed
// ════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;

    let q = `SELECT * FROM projects WHERE 1=1`;
    const params = [];

    if (type) {
      params.push(type);
      q += ` AND type = $${params.length}`;
    }

    q += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /projects:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// POST /api/projects — buat project baru
// ════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    // Support start/end (dari frontend) dan start_date/end_date
    const start = d.start_date || d.start || null;
    const end   = d.end_date   || d.end   || null;

    const { rows } = await pool.query(`
      INSERT INTO projects (
        type, name, kategori, batch,
        start_date, end_date, materials, tools, notes,
        progress
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      d.type        || 'ongoing',
      d.name,
      d.kategori    || '',
      d.batch       || '',
      start,
      end,
      d.materials   || '',
      d.tools       || '',
      d.notes       || '',
      d.progress    || 0,
    ]);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('POST /projects:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/projects/:id — update project (field umum)
// Pakai dynamic SET agar field yang tidak dikirim tidak ter-overwrite
// ════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;

    // Support start/end (dari frontend) dan start_date/end_date
    const start = d.start_date !== undefined ? d.start_date
                : d.start      !== undefined ? d.start
                : undefined;
    const end   = d.end_date   !== undefined ? d.end_date
                : d.end        !== undefined ? d.end
                : undefined;

    const sets = [];
    const vals = [];
    const add  = (col, val) => { vals.push(val); sets.push(`${col} = $${vals.length}`); };

    if (d.name          !== undefined) add('name',            d.name);
    if (d.kategori      !== undefined) add('kategori',        d.kategori);
    if (d.batch         !== undefined) add('batch',           d.batch);
    if (start           !== undefined) add('start_date',      start);
    if (end             !== undefined) add('end_date',        end);
    if (d.materials     !== undefined) add('materials',       d.materials);
    if (d.tools         !== undefined) add('tools',           d.tools);
    if (d.notes         !== undefined) add('notes',           d.notes);
    if (d.progress      !== undefined) add('progress',        d.progress);
    if (d.type          !== undefined) add('type',            d.type);
    if (d.set_point     !== undefined) add('set_point',       JSON.stringify(d.set_point));
    if (d.cip_prod_done !== undefined) add('cip_prod_done',   d.cip_prod_done);
    if (d.cip_prod_checks !== undefined) add('cip_prod_checks', JSON.stringify(d.cip_prod_checks));
    if (d.cip_lab_done  !== undefined) add('cip_lab_done',    d.cip_lab_done);
    if (d.cip_lab_checks !== undefined) add('cip_lab_checks', JSON.stringify(d.cip_lab_checks));
    if (d.fp_done       !== undefined) add('fp_done',         d.fp_done);
    if (d.fp_entries    !== undefined) add('fp_entries',      JSON.stringify(d.fp_entries));
    if (d.locked        !== undefined) add('locked',          d.locked);

    add('updated_at', new Date());

    if (sets.length <= 1) { // hanya updated_at
      return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate' });
    }

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /projects/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// DELETE /api/projects/:id
// ════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /projects/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/projects/:id/setpoint — simpan set point
// ════════════════════════════════════════════════════════
router.put('/:id/setpoint', async (req, res) => {
  try {
    const { id } = req.params;
    const sp = req.body;
    if (!sp || typeof sp !== 'object') {
      return res.status(400).json({ success: false, error: 'Set point data required' });
    }
    const { rows } = await pool.query(`
      UPDATE projects SET
        set_point  = $1,
        updated_at = now()
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(sp), id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /projects/:id/setpoint:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/projects/:id/cip — simpan CIP status
// ════════════════════════════════════════════════════════
router.put('/:id/cip', async (req, res) => {
  try {
    const { id } = req.params;
    const { cip_prod_done, cip_prod_checks, cip_lab_done, cip_lab_checks } = req.body;
    const { rows } = await pool.query(`
      UPDATE projects SET
        cip_prod_done   = COALESCE($1, cip_prod_done),
        cip_prod_checks = COALESCE($2, cip_prod_checks),
        cip_lab_done    = COALESCE($3, cip_lab_done),
        cip_lab_checks  = COALESCE($4, cip_lab_checks),
        updated_at      = now()
      WHERE id = $5
      RETURNING *
    `, [
      cip_prod_done   != null ? cip_prod_done  : null,
      cip_prod_checks ? JSON.stringify(cip_prod_checks) : null,
      cip_lab_done    != null ? cip_lab_done   : null,
      cip_lab_checks  ? JSON.stringify(cip_lab_checks)  : null,
      id,
    ]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /projects/:id/cip:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/projects/:id/fp — simpan Final Product entries
// ════════════════════════════════════════════════════════
router.put('/:id/fp', async (req, res) => {
  try {
    const { id } = req.params;
    const { fp_done, fp_entries } = req.body;
    const { rows } = await pool.query(`
      UPDATE projects SET
        fp_done    = COALESCE($1, fp_done),
        fp_entries = COALESCE($2, fp_entries),
        updated_at = now()
      WHERE id = $3
      RETURNING *
    `, [
      fp_done    != null ? fp_done    : null,
      fp_entries ? JSON.stringify(fp_entries) : null,
      id,
    ]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /projects/:id/fp:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/projects/:id/complete — pindah ke completed
// ════════════════════════════════════════════════════════
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      UPDATE projects SET
        type       = 'completed',
        end_date   = COALESCE(end_date, CURRENT_DATE),
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /projects/:id/complete:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;