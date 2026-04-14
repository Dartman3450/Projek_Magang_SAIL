// ═══════════════════════════════════════════════════
// projects.route.js
// Mount in server.js with:
//   const projectsRoute = require('./routes/projects.route');
//   app.use('/api/projects', projectsRoute);
// ═══════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { poolIoT: pool } = require('../db');

router.use(express.json());

// ── GET /api/projects?type=ongoing|completed  ────────
router.get('/', async (req, res) => {
  const { type } = req.query;
  const allowed = ['ongoing', 'completed'];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing type. Use: ongoing, completed' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE type = $1 ORDER BY created_at DESC`,
      [type]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/projects error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ── POST /api/projects  ──────────────────────────────
router.post('/', async (req, res) => {
  const { type, name, start_date, end_date, materials, tools, progress, notes } = req.body;
  if (!type || !name) {
    return res.status(400).json({ success: false, error: 'type and name are required' });
  }
  const allowed = ['ongoing', 'completed'];
  if (!allowed.includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid type. Use: ongoing, completed' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO projects (type, name, start_date, end_date, materials, tools, progress, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [type, name, start_date || null, end_date || null, materials || '', tools || '', progress || 0, notes || '']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/projects error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/projects/:id  ─────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, materials, tools, progress, notes, locked } = req.body;
  try {
    // Block edits on locked projects (unless this request IS the lock)
    if (!locked) {
      const check = await pool.query(
        `SELECT locked FROM projects WHERE id=$1`, [id]
      );
      if (check.rows[0]?.locked) {
        return res.status(403).json({ success: false, error: 'This project is completed and locked.' });
      }
    }
    const result = await pool.query(
      `UPDATE projects
       SET name       = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date   = COALESCE($3, end_date),
           materials  = COALESCE($4, materials),
           tools      = COALESCE($5, tools),
           progress   = COALESCE($6, progress),
           notes      = COALESCE($7, notes),
           locked     = COALESCE($8, locked),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name || null, start_date || null, end_date || null,
       materials !== undefined ? materials : null,
       tools     !== undefined ? tools     : null,
       progress  !== undefined ? progress  : null,
       notes     !== undefined ? notes     : null,
       locked    !== undefined ? locked    : null,
       id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PATCH /api/projects error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/projects/:id  ────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`, [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('DELETE /api/projects error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;