const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const {pool}    = require('../db');

// ═══════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// ═══════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const result = await pool.query(
      `SELECT id, email, password_hash, role FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const user = result.rows[0];

    // Check password against stored hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    // Success — send user info back
    res.json({
      success: true,
      message: 'Login successful!',
      user_id: user.id,
      email:   user.email,
      role:    user.role,       // ← needed for access control in Dashboard
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════
// CHANGE PASSWORD
// POST /api/auth/change-password
// ═══════════════════════════════════════════════
router.post('/change-password', async (req, res) => {
  try {
    const { user_id, old_password, new_password } = req.body;

    if (!user_id || !old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const result = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordMatches = await bcrypt.compare(old_password, result.rows[0].password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [newHash, user_id]
    );

    res.json({ success: true, message: 'Password changed successfully!' });

  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════
// REGISTER
// POST /api/auth/register
// ═══════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate role — semua role yang diizinkan sistem
    const allowedRoles = ['admin', 'superadmin', 'scientist', 'utility', 'limbah', 'PPIC', 'Produksi'];
    const userRole = allowedRoles.includes(role) ? role : 'utility';

    // Check if email already exists
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password and insert user
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
      [email, hash, userRole]
    );

    res.json({
      success: true,
      message: 'Registration successful!',
      user_id: result.rows[0].id,
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;