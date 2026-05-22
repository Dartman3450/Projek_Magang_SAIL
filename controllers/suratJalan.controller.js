// controllers/suratJalan.controller.js
const { pool } = require('../db');

// ── Helper: sanitize items array → valid JSON string untuk PostgreSQL jsonb ──
function sanitizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return '[]';
  const clean = items.map(it => {
    const parsedId = parseInt(it.kartu_stok_id, 10);
    return {
      kartu_stok_id: (!isNaN(parsedId) && parsedId > 0) ? parsedId : null,
      name:  String(it.name  || ''),
      seal:  String(it.seal  || ''),
      qty:   parseFloat(it.qty) || 0,
      desc:  String(it.desc  || '')
    };
  });
  // WAJIB: kembalikan string, bukan array JS
  // pg driver akan salah serialize array JS ke format PostgreSQL array, bukan JSON array
  return JSON.stringify(clean);
}

// ══ GET SURAT JALAN ════════════════════════════════════════

async function getAllSuratJalan(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM surat_jalan ORDER BY tanggal DESC, id DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getAllSuratJalan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ══ CREATE SURAT JALAN ════════════════════════════════════

async function createSuratJalan(req, res) {
  try {
    const {
      nomor, tanggal, penerima, alamat, pengirim,
      kendaraan, items, catatan
    } = req.body;

    console.log('📥 createSuratJalan body:', JSON.stringify(req.body, null, 2));

    if (!nomor || !tanggal || !penerima) {
      return res.status(400).json({
        success: false,
        error: 'Nomor, tanggal, dan penerima wajib diisi'
      });
    }

    // Cek duplikat nomor
    const dupCheck = await pool.query(
      `SELECT id FROM surat_jalan WHERE nomor = $1`, [nomor]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Nomor surat jalan "${nomor}" sudah ada`
      });
    }

    // Sanitize items → JSON string
    const itemsJson = sanitizeItems(items);
    console.log('📦 itemsJson:', itemsJson);
    console.log('✓ JSON.parse test OK:', JSON.parse(itemsJson));

    // KUNCI: cast eksplisit ::jsonb di SQL dengan string parameter
    // Jangan pass array JS langsung — pg driver akan serialize ke format PostgreSQL array, bukan JSON
    // FIX: baca driver dari req.body
    const driver = req.body.driver || '';

    const result = await pool.query(
      `INSERT INTO surat_jalan
         (nomor, tanggal, penerima, alamat, pengirim, kendaraan, driver, items, catatan, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, now(), now())
       RETURNING *`,
      [
        nomor,
        tanggal,
        penerima,
        String(alamat   || ''),
        String(pengirim || ''),
        String(kendaraan|| ''),
        String(driver   || ''),
        itemsJson,
        String(catatan  || '')
      ]
    );

    console.log('✅ Created ID:', result.rows[0].id);
    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('❌ createSuratJalan error:', err.message);
    console.error('   code:', err.code, '| detail:', err.detail, '| where:', err.where);
    res.status(500).json({ success: false, error: err.message, detail: err.detail });
  }
}

// ══ UPDATE SURAT JALAN ════════════════════════════════════

async function updateSuratJalan(req, res) {
  try {
    const { id } = req.params;
    const {
      nomor, tanggal, penerima, alamat, pengirim,
      kendaraan, items, catatan
    } = req.body;

    console.log('📥 updateSuratJalan:', { id, nomor, penerima });

    // Sanitize items → JSON string
    const itemsJson = sanitizeItems(items);
    console.log('📦 itemsJson:', itemsJson);

    // FIX: tambah field driver ke UPDATE, baca dari req.body
    const driver = req.body.driver || '';

    const result = await pool.query(
      `UPDATE surat_jalan
       SET nomor=$1, tanggal=$2, penerima=$3, alamat=$4,
           pengirim=$5, kendaraan=$6, items=$7::jsonb, catatan=$8,
           driver=$9, updated_at=now()
       WHERE id=$10
       RETURNING *`,
      [
        nomor,
        tanggal,
        penerima,
        String(alamat   || ''),
        String(pengirim || ''),
        String(kendaraan|| ''),
        itemsJson,
        String(catatan  || ''),
        String(driver   || ''),
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Surat jalan tidak ditemukan' });
    }

    console.log('✅ Updated ID:', result.rows[0].id);
    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('❌ updateSuratJalan error:', err.message);
    console.error('   code:', err.code, '| detail:', err.detail, '| where:', err.where);
    res.status(500).json({ success: false, error: err.message, detail: err.detail });
  }
}

// ══ DELETE SURAT JALAN ════════════════════════════════════

async function deleteSuratJalan(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM surat_jalan WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Surat jalan dihapus' });
  } catch (err) {
    console.error('deleteSuratJalan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ══ GET AVAILABLE ITEMS ════════════════════════════════════

async function getAvailableItems(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        ks.id as kartu_stok_id,
        ks.nama_barang,
        ks.kode_barang,
        ks.satuan,
        ks.lokasi,
        ks.penanggung_jawab,
        COALESCE(ks.total_stok, 0) as total_stok
      FROM kartu_stok ks
      WHERE ks.finished = false
        AND NOT EXISTS (
          SELECT 1 FROM surat_jalan sj
          WHERE sj.items @> jsonb_build_array(
            jsonb_build_object('kartu_stok_id', ks.id)
          )
        )
      ORDER BY ks.nama_barang`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getAvailableItems error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ══ GET BATCH/SEAL OPTIONS ════════════════════════════════

async function getBatchOptions(req, res) {
  try {
    const { kartu_stok_id } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT no_seal as seal
       FROM kartu_stok_transaksi
       WHERE kartu_stok_id = $1
         AND no_seal IS NOT NULL
         AND no_seal != ''
       ORDER BY no_seal`,
      [kartu_stok_id]
    );
    res.json({ success: true, data: result.rows.map(r => r.seal) });
  } catch (err) {
    console.error('getBatchOptions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllSuratJalan,
  createSuratJalan,
  updateSuratJalan,
  deleteSuratJalan,
  getAvailableItems,
  getBatchOptions,
};