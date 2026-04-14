// ═══════════════════════════════════════════════════════════
// dataentryController.js
// Controller untuk: Production, Laboratorium, Utility,
//   Limbah, Laporan Harian, Kartu Stok, Surat Jalan
// ═══════════════════════════════════════════════════════════
const { poolIoT: pool } = require('../db');

const LIMIT = 100;

// ── helpers ──────────────────────────────────────────────────
const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg, status = 500)  => res.status(status).json({ success: false, error: msg });

// ════════════════════════════════════════════════════════════
//  PRODUCTION
// ════════════════════════════════════════════════════════════
async function getProduction(req, res) {
  try {
    const { project_id, from, to, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM de_production WHERE 1=1';
    const vals = [];
    if (project_id) { vals.push(project_id); q += ` AND project_id = $${vals.length}`; }
    if (from)       { vals.push(from);        q += ` AND tanggal >= $${vals.length}`; }
    if (to)         { vals.push(to);          q += ` AND tanggal <= $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createProduction(req, res) {
  try {
    const {
      project_id, project_name, tanggal,
      sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
      sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate,
      sp_temp_feed, sp_temp_heater, sp_temp_top, sp_temp_bot,
      sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam, sp_offset,
      temp_produksi, vacuum_status,
      cip_prod_done, cip_prod_checks, cip_lab_done, cip_lab_checks,
      fp_entries, notes, foto_urls,
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO de_production (
        project_id, project_name, tanggal,
        sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
        sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate,
        sp_temp_feed, sp_temp_heater, sp_temp_top, sp_temp_bot,
        sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam, sp_offset,
        temp_produksi, vacuum_status,
        cip_prod_done, cip_prod_checks, cip_lab_done, cip_lab_checks,
        fp_entries, notes, foto_urls
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33
      ) RETURNING *`,
      [
        project_id || null, project_name || null, tanggal || null,
        sp_slurry||null, sp_hopper||null, sp_density||null, sp_feed||null,
        sp_aroma||null, sp_steam||null, sp_cond1||null, sp_cond2||null,
        sp_ext||null, sp_int||null, sp_cond_rate||null,
        sp_temp_feed||null, sp_temp_heater||null, sp_temp_top||null,
        sp_temp_bot||null, sp_temp_out||null, sp_chill||null,
        sp_cond_water||null, sp_press_sys||null, sp_press_steam||null, sp_offset||null,
        temp_produksi||null, vacuum_status||null,
        cip_prod_done||false, JSON.stringify(cip_prod_checks||{}),
        cip_lab_done||false,  JSON.stringify(cip_lab_checks||{}),
        JSON.stringify(fp_entries||[]), notes||null,
        JSON.stringify(foto_urls||[]),
      ]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function deleteProduction(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM de_production WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  LABORATORIUM
// ════════════════════════════════════════════════════════════
async function getLaboratorium(req, res) {
  try {
    const { project_id, from, to, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM de_laboratorium WHERE 1=1';
    const vals = [];
    if (project_id) { vals.push(project_id); q += ` AND project_id = $${vals.length}`; }
    if (from)       { vals.push(from);        q += ` AND tanggal >= $${vals.length}`; }
    if (to)         { vals.push(to);          q += ` AND tanggal <= $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createLaboratorium(req, res) {
  try {
    const {
      project_id, project_name, tanggal,
      sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
      sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate,
      sp_temp_feed, sp_temp_heater, sp_temp_top, sp_temp_bot,
      sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam, sp_offset,
      cip_lab_done, cip_lab_checks, notes, foto_urls,
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO de_laboratorium (
        project_id, project_name, tanggal,
        sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
        sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate,
        sp_temp_feed, sp_temp_heater, sp_temp_top, sp_temp_bot,
        sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam, sp_offset,
        cip_lab_done, cip_lab_checks, notes, foto_urls
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28
      ) RETURNING *`,
      [
        project_id||null, project_name||null, tanggal||null,
        sp_slurry||null, sp_hopper||null, sp_density||null, sp_feed||null,
        sp_aroma||null, sp_steam||null, sp_cond1||null, sp_cond2||null,
        sp_ext||null, sp_int||null, sp_cond_rate||null,
        sp_temp_feed||null, sp_temp_heater||null, sp_temp_top||null,
        sp_temp_bot||null, sp_temp_out||null, sp_chill||null,
        sp_cond_water||null, sp_press_sys||null, sp_press_steam||null, sp_offset||null,
        cip_lab_done||false, JSON.stringify(cip_lab_checks||{}),
        notes||null, JSON.stringify(foto_urls||[]),
      ]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function deleteLaboratorium(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM de_laboratorium WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  UTILITY
// ════════════════════════════════════════════════════════════
async function getUtility(req, res) {
  try {
    const { from, to, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM de_utility WHERE 1=1';
    const vals = [];
    if (from) { vals.push(from); q += ` AND tanggal >= $${vals.length}`; }
    if (to)   { vals.push(to);   q += ` AND tanggal <= $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createUtility(req, res) {
  try {
    const { tanggal, steam_press, fg_temp, fw_temp, air_press, steam_out, conductivity, surface_bd, notes, foto_urls } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO de_utility (tanggal, steam_press, fg_temp, fw_temp, air_press, steam_out, conductivity, surface_bd, notes, foto_urls)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tanggal||null, steam_press||null, fg_temp||null, fw_temp||null,
       air_press||null, steam_out||null, conductivity||null, surface_bd||null,
       notes||null, JSON.stringify(foto_urls||[])]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function deleteUtility(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM de_utility WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  LIMBAH
// ════════════════════════════════════════════════════════════
async function getLimbah(req, res) {
  try {
    const { from, to, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM de_limbah WHERE 1=1';
    const vals = [];
    if (from) { vals.push(from); q += ` AND tanggal >= $${vals.length}`; }
    if (to)   { vals.push(to);   q += ` AND tanggal <= $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createLimbah(req, res) {
  try {
    const { tanggal, volume, cod, bod, tss, ph, temp_effluent, notes, foto_urls } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO de_limbah (tanggal, volume, cod, bod, tss, ph, temp_effluent, notes, foto_urls)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tanggal||null, volume||null, cod||null, bod||null, tss||null,
       ph||null, temp_effluent||null, notes||null, JSON.stringify(foto_urls||[])]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function deleteLimbah(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM de_limbah WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  LAPORAN HARIAN
// ════════════════════════════════════════════════════════════
async function getLaporanHarian(req, res) {
  try {
    const { from, to, limit = LIMIT, prioritas, kategori } = req.query;
    let q = 'SELECT * FROM laporan_harian WHERE 1=1';
    const vals = [];
    if (from)      { vals.push(from);      q += ` AND created_at::date >= $${vals.length}`; }
    if (to)        { vals.push(to);        q += ` AND created_at::date <= $${vals.length}`; }
    if (prioritas) { vals.push(prioritas); q += ` AND prioritas = $${vals.length}`; }
    if (kategori)  { vals.push(kategori);  q += ` AND kategori = $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createLaporanHarian(req, res) {
  try {
    const { title, nama, shift, kategori, prioritas, lokasi, deskripsi, aksi } = req.body;
    if (!title || !nama || !deskripsi) return err(res, 'title, nama, dan deskripsi wajib diisi', 400);
    const { rows } = await pool.query(`
      INSERT INTO laporan_harian (title, nama, shift, kategori, prioritas, lokasi, deskripsi, aksi)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, nama, shift||null, kategori||null, prioritas||null, lokasi||null, deskripsi, aksi||null]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function deleteLaporanHarian(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM laporan_harian WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  KARTU STOK
// ════════════════════════════════════════════════════════════
async function getKartuStok(req, res) {
  try {
    const { tipe, search, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM kartu_stok WHERE 1=1';
    const vals = [];
    if (tipe)   { vals.push(tipe);        q += ` AND tipe = $${vals.length}`; }
    if (search) { vals.push(`%${search}%`); q += ` AND nama_barang ILIKE $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createKartuStok(req, res) {
  try {
    const { nama_barang, tipe, tanggal_entri, tanggal_masuk, tanggal_keluar, jumlah, satuan, keterangan } = req.body;
    if (!nama_barang || !tipe || jumlah == null) return err(res, 'nama_barang, tipe, dan jumlah wajib diisi', 400);
    if (!['in','out'].includes(tipe)) return err(res, 'tipe harus in atau out', 400);
    const { rows } = await pool.query(`
      INSERT INTO kartu_stok (nama_barang, tipe, tanggal_entri, tanggal_masuk, tanggal_keluar, jumlah, satuan, keterangan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nama_barang, tipe, tanggal_entri||null, tanggal_masuk||null,
       tanggal_keluar||null, jumlah, satuan||null, keterangan||null]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function updateKartuStok(req, res) {
  try {
    const { nama_barang, tipe, tanggal_entri, tanggal_masuk, tanggal_keluar, jumlah, satuan, keterangan } = req.body;
    const { rows } = await pool.query(`
      UPDATE kartu_stok SET
        nama_barang    = COALESCE($1, nama_barang),
        tipe           = COALESCE($2, tipe),
        tanggal_entri  = COALESCE($3, tanggal_entri),
        tanggal_masuk  = COALESCE($4, tanggal_masuk),
        tanggal_keluar = COALESCE($5, tanggal_keluar),
        jumlah         = COALESCE($6, jumlah),
        satuan         = COALESCE($7, satuan),
        keterangan     = COALESCE($8, keterangan),
        updated_at     = NOW()
      WHERE id = $9 RETURNING *`,
      [nama_barang||null, tipe||null, tanggal_entri||null, tanggal_masuk||null,
       tanggal_keluar||null, jumlah??null, satuan||null, keterangan||null, req.params.id]
    );
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, rows[0]);
  } catch (e) { err(res, e.message); }
}

async function deleteKartuStok(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM kartu_stok WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

// ════════════════════════════════════════════════════════════
//  SURAT JALAN
// ════════════════════════════════════════════════════════════
async function getSuratJalan(req, res) {
  try {
    const { from, to, limit = LIMIT } = req.query;
    let q = 'SELECT * FROM surat_jalan WHERE 1=1';
    const vals = [];
    if (from) { vals.push(from); q += ` AND tanggal >= $${vals.length}`; }
    if (to)   { vals.push(to);   q += ` AND tanggal <= $${vals.length}`; }
    vals.push(Math.min(+limit, 500));
    q += ` ORDER BY created_at DESC LIMIT $${vals.length}`;
    const { rows } = await pool.query(q, vals);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
}

async function createSuratJalan(req, res) {
  try {
    const { nomor, tanggal, penerima, alamat, pengirim, kendaraan, items, catatan } = req.body;
    if (!nomor || !penerima) return err(res, 'nomor dan penerima wajib diisi', 400);
    const { rows } = await pool.query(`
      INSERT INTO surat_jalan (nomor, tanggal, penerima, alamat, pengirim, kendaraan, items, catatan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nomor, tanggal||null, penerima, alamat||null,
       pengirim||null, kendaraan||null, JSON.stringify(items||[]), catatan||null]
    );
    ok(res, rows[0], 201);
  } catch (e) { err(res, e.message); }
}

async function updateSuratJalan(req, res) {
  try {
    const { nomor, tanggal, penerima, alamat, pengirim, kendaraan, items, catatan } = req.body;
    const { rows } = await pool.query(`
      UPDATE surat_jalan SET
        nomor      = COALESCE($1, nomor),
        tanggal    = COALESCE($2, tanggal),
        penerima   = COALESCE($3, penerima),
        alamat     = COALESCE($4, alamat),
        pengirim   = COALESCE($5, pengirim),
        kendaraan  = COALESCE($6, kendaraan),
        items      = COALESCE($7::jsonb, items),
        catatan    = COALESCE($8, catatan),
        updated_at = NOW()
      WHERE id = $9 RETURNING *`,
      [nomor||null, tanggal||null, penerima||null, alamat||null,
       pengirim||null, kendaraan||null,
       items ? JSON.stringify(items) : null,
       catatan||null, req.params.id]
    );
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, rows[0]);
  } catch (e) { err(res, e.message); }
}

async function deleteSuratJalan(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM surat_jalan WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return err(res, 'Not found', 404);
    ok(res, { deleted: rows[0].id });
  } catch (e) { err(res, e.message); }
}

module.exports = {
  // Production
  getProduction, createProduction, deleteProduction,
  // Laboratorium
  getLaboratorium, createLaboratorium, deleteLaboratorium,
  // Utility
  getUtility, createUtility, deleteUtility,
  // Limbah
  getLimbah, createLimbah, deleteLimbah,
  // Laporan Harian
  getLaporanHarian, createLaporanHarian, deleteLaporanHarian,
  // Kartu Stok
  getKartuStok, createKartuStok, updateKartuStok, deleteKartuStok,
  // Surat Jalan
  getSuratJalan, createSuratJalan, updateSuratJalan, deleteSuratJalan,
};
