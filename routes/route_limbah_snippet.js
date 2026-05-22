// ═══════════════════════════════════════════════════════════════════════
// SNIPPET: Backend route untuk /api/dataentry/limbah
// Paste ke file routes yang sudah ada (sesuaikan nama tabel & pool)
// ═══════════════════════════════════════════════════════════════════════

// POST /api/dataentry/limbah
router.post('/api/dataentry/limbah', async (req, res) => {
  try {
    const {
      tanggal, volume, cod, bod, tss, ph, notes, foto_urls,
      // Kolom baru (pastikan sudah ALTER TABLE)
      project_name, tipe, awal, akhir, jar_alum, jar_total
    } = req.body;

    const result = await pool.query(`
      INSERT INTO de_limbah
        (tanggal, volume, cod, bod, tss, ph, notes, foto_urls,
         project_name, tipe, awal, akhir, jar_alum, jar_total)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      tanggal   || new Date().toISOString().split('T')[0],
      volume    || null,
      cod       || null,
      bod       || null,
      tss       || null,
      ph        || null,
      notes     || null,
      JSON.stringify(foto_urls || []),
      project_name || null,
      tipe      || 'harian',
      awal      || null,
      akhir     || null,
      jar_alum  || null,
      jar_total || null,
    ]);

    res.json({ success: true, id: result.rows[0].id, action: 'inserted' });
  } catch (err) {
    console.error('POST /api/dataentry/limbah error:', err);
    res.json({ success: false, error: err.message });
  }
});

// GET /api/dataentry/limbah?project_name=xxx&limit=50
router.get('/api/dataentry/limbah', async (req, res) => {
  try {
    const { project_name, limit = 50 } = req.query;

    let query = `SELECT * FROM de_limbah`;
    const params = [];

    if (project_name) {
      query += ` WHERE project_name = $1`;
      params.push(project_name);
    }

    query += ` ORDER BY tanggal ASC, created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/dataentry/limbah error:', err);
    res.json({ success: false, error: err.message });
  }
});
