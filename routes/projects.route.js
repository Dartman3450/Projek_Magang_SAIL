// ═══════════════════════════════════════════════════
// projects.route.js
// Mount in server.js with:
//   const projectsRoute = require('./routes/projects.route');
//   app.use('/api/projects', projectsRoute);
// ═══════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { poolIoT: pool } = require('../db');

// Ensure JSON body parsing works with the standalone router package
router.use(express.json());

// ── GET /api/projects?type=ongoing  ─────────────────
// Returns all projects of a given type, newest first
router.get('/', async (req, res) => {
  const { type } = req.query;
  const allowed = ['ongoing', 'recent', 'completed'];

  if (!type || !allowed.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing type. Use: ongoing, recent, completed' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE type = $1 ORDER BY created_at DESC`,
      [type]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/projects error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/projects  ──────────────────────────────
// Create a new project
// Body: { type, name, start_date, end_date, materials, tools, progress, notes }
router.post('/', async (req, res) => {
  const { type, name, start_date, end_date, materials, tools, progress, notes } = req.body;

  if (!type || !name) {
    return res.status(400).json({ success: false, message: 'type and name are required' });
  }

  const allowed = ['ongoing', 'recent', 'completed'];
  if (!allowed.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/projects/:id  ─────────────────────────
// Update progress (or any field) of a project
// Body: { progress, name, materials, tools, notes, ... }
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, materials, tools, progress, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects
       SET name       = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date   = COALESCE($3, end_date),
           materials  = COALESCE($4, materials),
           tools      = COALESCE($5, tools),
           progress   = COALESCE($6, progress),
           notes      = COALESCE($7, notes),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, start_date, end_date, materials, tools, progress, notes, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PATCH /api/projects error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/projects/:id  ────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('DELETE /api/projects error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;