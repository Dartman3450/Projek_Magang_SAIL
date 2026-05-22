// controllers/dataentry.controller.js
const { pool } = require('../db');

// ── Helpers ──────────────────────────────────────────────────
function parseNum(v)    { if (v === '' || v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n; }
function parseIntVal(v) { if (v === '' || v == null) return null; const n = parseInt(v);   return isNaN(n) ? null : n; }

// ── History helpers ───────────────────────────────────────────
// Kolom set point yang ingin direkam ke history
const SP_HISTORY_COLS = [
  'sp_slurry','sp_hopper','sp_density','sp_feed','sp_aroma','sp_steam',
  'sp_prod_out','sp_cond1','sp_cond2','sp_ext','sp_int','sp_cond_rate',
  'sp_offset','sp_temp_feed','sp_temp_heater','sp_temp_top','sp_vacuum',
  'sp_temp_bot','sp_temp_out','sp_chill','sp_cond_water','sp_press_sys',
  'sp_press_steam','vacuum_status','notes',
];

/**
 * Bandingkan snapshot lama vs baru, kembalikan objek perubahan.
 * Format: { sp_slurry: { old: 12, new: 24 }, ... }
 * Hanya field yang benar-benar berubah yang dimasukkan.
 */
function diffSnapshot(oldRow, newValues) {
  const changes = {};
  for (const col of SP_HISTORY_COLS) {
    const oldVal = oldRow ? (oldRow[col] ?? null) : null;
    const newVal = newValues[col] ?? null;
    // Bandingkan sebagai string agar angka desimal tidak misleading
    const oldStr = oldVal === null ? null : String(oldVal);
    const newStr = newVal === null ? null : String(newVal);
    if (oldStr !== newStr) {
      changes[col] = { old: oldVal, new: newVal };
    }
  }
  return changes;
}

/**
 * Insert satu baris ke de_production_history.
 * Dipanggil setelah setiap INSERT maupun UPDATE pada de_production.
 *
 * @param {object} productionRow  – baris terbaru dari de_production (RETURNING *)
 * @param {string} action         – 'insert' | 'update'
 * @param {object|null} oldRow    – baris lama sebelum UPDATE (null untuk INSERT)
 */
async function insertProductionHistory(productionRow, action, oldRow = null) {
  try {
    const r = productionRow;
    const changedFields = diffSnapshot(oldRow, r);

    // project_name di history adalah NOT NULL — fallback ke string kosong kalau null
    const projectName = r.project_name || '';

    await pool.query(`
      INSERT INTO de_production_history (
        production_id, project_name, tanggal, action,
        sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
        sp_prod_out, sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate, sp_offset,
        sp_temp_feed, sp_temp_heater, sp_temp_top, sp_vacuum, sp_temp_bot,
        sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam,
        vacuum_status, notes, changed_fields
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,
        $28,$29,$30
      )
    `, [
      r.id, projectName, r.tanggal, action,
      r.sp_slurry, r.sp_hopper, r.sp_density, r.sp_feed, r.sp_aroma, r.sp_steam,
      r.sp_prod_out, r.sp_cond1, r.sp_cond2, r.sp_ext, r.sp_int, r.sp_cond_rate, r.sp_offset,
      r.sp_temp_feed, r.sp_temp_heater, r.sp_temp_top, r.sp_vacuum, r.sp_temp_bot,
      r.sp_temp_out, r.sp_chill, r.sp_cond_water, r.sp_press_sys, r.sp_press_steam,
      r.vacuum_status, r.notes,
      Object.keys(changedFields).length > 0 ? JSON.stringify(changedFields) : null,
    ]);
  } catch (histErr) {
    // Jangan lempar error — history gagal tidak boleh menggagalkan response utama
    console.error('⚠️  insertProductionHistory failed (non-fatal):', histErr.message);
  }
}

// ═══════════════════════════════════════════════════════════
// PRODUCTION
// Strategi: cek apakah hari ini sudah ada record untuk project ini.
//   - Sudah ada → UPDATE dengan COALESCE (field kosong tidak menimpa)
//   - Belum ada → INSERT baru
// ═══════════════════════════════════════════════════════════
async function saveProduction(req, res) {
  try {
    const d = req.body;
    if (!d) return res.status(400).json({ success: false, error: 'Body kosong' });

    let projectId = null;
    if (d.project_name) {
      const pRes = await pool.query(
        `SELECT id FROM projects WHERE name = $1 LIMIT 1`, [d.project_name]
      );
      if (pRes.rows.length > 0) projectId = pRes.rows[0].id;
    }

    // Fetch baris yang sudah ada hari ini (SELECT * agar bisa diff untuk history)
    const existing = await pool.query(
      `SELECT * FROM de_production
       WHERE project_name = $1 AND tanggal = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`,
      [d.project_name || '']
    );

    let resultId;

    if (existing.rows.length > 0) {
      // ── UPDATE — COALESCE: hanya timpa kalau nilai baru tidak null ──
      const upd = await pool.query(`
        UPDATE de_production SET
          sp_slurry      = COALESCE($1,  sp_slurry),
          sp_hopper      = COALESCE($2,  sp_hopper),
          sp_density     = COALESCE($3,  sp_density),
          sp_feed        = COALESCE($4,  sp_feed),
          sp_aroma       = COALESCE($5,  sp_aroma),
          sp_steam       = COALESCE($6,  sp_steam),
          sp_prod_out    = COALESCE($7,  sp_prod_out),
          sp_cond1       = COALESCE($8,  sp_cond1),
          sp_cond2       = COALESCE($9,  sp_cond2),
          sp_ext         = COALESCE($10, sp_ext),
          sp_int         = COALESCE($11, sp_int),
          sp_cond_rate   = COALESCE($12, sp_cond_rate),
          sp_offset      = COALESCE($13, sp_offset),
          sp_temp_feed   = COALESCE($14, sp_temp_feed),
          sp_temp_heater = COALESCE($15, sp_temp_heater),
          sp_temp_top    = COALESCE($16, sp_temp_top),
          sp_vacuum      = COALESCE($17, sp_vacuum),
          sp_temp_bot    = COALESCE($18, sp_temp_bot),
          sp_temp_out    = COALESCE($19, sp_temp_out),
          sp_chill       = COALESCE($20, sp_chill),
          sp_cond_water  = COALESCE($21, sp_cond_water),
          sp_press_sys   = COALESCE($22, sp_press_sys),
          sp_press_steam = COALESCE($23, sp_press_steam),
          vacuum_status  = COALESCE($24, vacuum_status),
          cip_prod_done  = COALESCE($25, cip_prod_done),
          cip_prod_checks= COALESCE($26, cip_prod_checks),
          cip_lab_done   = COALESCE($27, cip_lab_done),
          cip_lab_checks = COALESCE($28, cip_lab_checks),
          fp_entries     = COALESCE($29, fp_entries),
          notes          = COALESCE($30, notes),
          foto_urls      = COALESCE($31, foto_urls),
          updated_at     = now()
        WHERE id = $32
        RETURNING *
      `, [
        parseNum(d['sp-slurry']),
        d['sp-hopper']       || null,
        parseNum(d['sp-density']),
        parseNum(d['sp-feed']),
        parseNum(d['sp-aroma']),
        parseNum(d['sp-steam']),
        parseNum(d['sp-prod-out']),
        parseNum(d['sp-cond1']),
        parseNum(d['sp-cond2']),
        parseNum(d['sp-ext']),
        d['sp-int']          || null,
        parseNum(d['sp-cond-rate']),
        parseNum(d['sp-offset']),
        parseNum(d['sp-temp-feed']),
        parseNum(d['sp-temp-heater']),
        parseNum(d['sp-temp-top']),
        parseNum(d['sp-vacuum']),
        parseNum(d['sp-temp-bot']),
        parseNum(d['sp-temp-out']),
        parseNum(d['sp-chill']),
        parseNum(d['sp-cond-water']),
        parseNum(d['sp-press-sys']),
        parseNum(d['sp-press-steam']),
        d.vacuum_status      || null,
        d.cip_prod_done === true ? true : null,
        d.cip_prod_checks    ? JSON.stringify(d.cip_prod_checks) : null,
        d.cip_lab_done === true  ? true : null,
        d.cip_lab_checks     ? JSON.stringify(d.cip_lab_checks)  : null,
        d.fp_entries?.length ? JSON.stringify(d.fp_entries)      : null,
        d.notes              || null,
        d.foto_urls?.length  ? JSON.stringify(d.foto_urls)       : null,
        existing.rows[0].id,
      ]);
      const updatedRow = upd.rows[0];
      resultId = updatedRow?.id;

      // ── Catat ke history (fire-and-forget, non-blocking) ──
      insertProductionHistory(updatedRow, 'update', existing.rows[0]);

    } else {
      // ── INSERT baru ──
      const ins = await pool.query(`
        INSERT INTO de_production (
          project_id, project_name, tanggal,
          sp_slurry, sp_hopper, sp_density, sp_feed, sp_aroma, sp_steam,
          sp_prod_out, sp_cond1, sp_cond2, sp_ext, sp_int, sp_cond_rate, sp_offset,
          sp_temp_feed, sp_temp_heater, sp_temp_top, sp_vacuum, sp_temp_bot,
          sp_temp_out, sp_chill, sp_cond_water, sp_press_sys, sp_press_steam,
          vacuum_status,
          cip_prod_done, cip_prod_checks,
          cip_lab_done,  cip_lab_checks,
          fp_entries, notes, foto_urls
        ) VALUES (
          $1,$2,CURRENT_DATE,
          $3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,
          $26,
          $27,$28,
          $29,$30,
          $31,$32,$33
        ) RETURNING *
      `, [
        projectId, d.project_name || null,
        parseNum(d['sp-slurry']),
        d['sp-hopper']       || null,
        parseNum(d['sp-density']),
        parseNum(d['sp-feed']),
        parseNum(d['sp-aroma']),
        parseNum(d['sp-steam']),
        parseNum(d['sp-prod-out']),
        parseNum(d['sp-cond1']),
        parseNum(d['sp-cond2']),
        parseNum(d['sp-ext']),
        d['sp-int']          || null,
        parseNum(d['sp-cond-rate']),
        parseNum(d['sp-offset']),
        parseNum(d['sp-temp-feed']),
        parseNum(d['sp-temp-heater']),
        parseNum(d['sp-temp-top']),
        parseNum(d['sp-vacuum']),
        parseNum(d['sp-temp-bot']),
        parseNum(d['sp-temp-out']),
        parseNum(d['sp-chill']),
        parseNum(d['sp-cond-water']),
        parseNum(d['sp-press-sys']),
        parseNum(d['sp-press-steam']),
        d.vacuum_status      || null,
        d.cip_prod_done === true,
        JSON.stringify(d.cip_prod_checks || {}),
        d.cip_lab_done  === true,
        JSON.stringify(d.cip_lab_checks  || {}),
        JSON.stringify(d.fp_entries      || []),
        d.notes              || null,
        JSON.stringify(d.foto_urls       || []),
      ]);
      const insertedRow = ins.rows[0];
      resultId = insertedRow?.id;

      // ── Catat ke history sebagai snapshot awal (tidak ada old row) ──
      insertProductionHistory(insertedRow, 'insert', null);
    }

    res.json({ success: true, id: resultId, action: existing.rows.length > 0 ? 'updated' : 'inserted' });
  } catch (err) {
    console.error('❌ saveProduction:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getProduction(req, res) {
  try {
    const { project_name, tanggal } = req.query;
    let q = `SELECT * FROM de_production WHERE 1=1`;
    const params = [];
    if (project_name) { params.push(project_name); q += ` AND project_name = $${params.length}`; }
    if (tanggal)      { params.push(tanggal);       q += ` AND tanggal = $${params.length}`; }
    q += ` ORDER BY created_at DESC LIMIT 50`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ─── History: ambil semua revisi untuk project + rentang tanggal ──
async function getProductionHistory(req, res) {
  try {
    const { project_name, tanggal, tanggal_dari, tanggal_sampai, limit } = req.query;
    const params = [];
    let q = `SELECT * FROM de_production_history WHERE 1=1`;

    if (project_name)   { params.push(project_name);   q += ` AND project_name = $${params.length}`; }
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }

    const maxRows = Math.min(parseInt(limit) || 200, 500);
    q += ` ORDER BY tanggal DESC, recorded_at DESC LIMIT ${maxRows}`;

    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


// ═══════════════════════════════════════════════════════════
// UTILITY HARIAN — INSERT ke tabel de_utility_harian (Solar/Listrik/Air)
// UTILITY PROJECT — UPSERT ke tabel de_utility (Boiler/Chiller)
// ═══════════════════════════════════════════════════════════
async function saveUtility(req, res) {
  try {
    const d = req.body;
    if (!d) return res.status(400).json({ success: false, error: 'Body kosong' });

    // ── Flatten nested boiler/chiller payload dari frontend ──
    // Frontend kirim: { boiler: { b1, b2, ... }, chiller: { c1, c2, ... } }
    if (d.boiler && typeof d.boiler === 'object') {
      Object.assign(d, d.boiler);
    }
    if (d.chiller && typeof d.chiller === 'object') {
      const { notes: chillerNotes, ...chillerFields } = d.chiller;
      Object.assign(d, chillerFields);
      if (chillerNotes) d.chiller_notes = chillerNotes;
    }

    // ── Data Harian (Solar / Listrik / Air) → tabel de_utility_harian ──
    if (d.tipe === 'harian') {
      const ins = await pool.query(`
        INSERT INTO de_utility_harian (
          tanggal, kategori, label, awal, akhir, total, notes, foto_urls
        ) VALUES (
          COALESCE($1::date, CURRENT_DATE),
          $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id
      `, [
        d.tanggal      || null,
        d.kategori     || null,
        d.label        || null,
        d.awal  != null ? parseFloat(d.awal)  : null,
        d.akhir != null ? parseFloat(d.akhir) : null,
        d.total != null ? parseFloat(d.total) : null,
        d.notes        || null,
        JSON.stringify(d.foto_urls || []),
      ]);
      return res.json({ success: true, id: ins.rows[0]?.id, action: 'inserted' });
    }

    // ── Data Project (Boiler/Chiller) → tabel de_utility ──
    let projectId = null;
    if (d.project_name) {
      const pRes = await pool.query(
        `SELECT id FROM projects WHERE name = $1 LIMIT 1`, [d.project_name]
      );
      if (pRes.rows.length > 0) projectId = pRes.rows[0].id;
    }

    const existing = await pool.query(
      `SELECT id FROM de_utility
       WHERE project_name = $1 AND tanggal = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`,
      [d.project_name || '']
    );

    let resultId;

    if (existing.rows.length > 0) {
      const upd = await pool.query(`
        UPDATE de_utility SET
          b1_steam_press      = COALESCE($1,  b1_steam_press),
          b2_fg_temp          = COALESCE($2,  b2_fg_temp),
          b3_fw_temp          = COALESCE($3,  b3_fw_temp),
          b4_scale_temp       = COALESCE($4,  b4_scale_temp),
          b5_overheat_temp    = COALESCE($5,  b5_overheat_temp),
          b6_next_blowdown    = COALESCE($6,  b6_next_blowdown),
          b7_conductivity     = COALESCE($7,  b7_conductivity),
          b8_air_press        = COALESCE($8,  b8_air_press),
          b9_ignition_count   = COALESCE($9,  b9_ignition_count),
          b10_oil_lfire_time  = COALESCE($10, b10_oil_lfire_time),
          b11_oil_hfire_time  = COALESCE($11, b11_oil_hfire_time),
          b12_flue_lfire_temp = COALESCE($12, b12_flue_lfire_temp),
          b13_flue_hfire_temp = COALESCE($13, b13_flue_hfire_temp),
          b14_fw_avg_temp     = COALESCE($14, b14_fw_avg_temp),
          b15_oil_efficiency  = COALESCE($15, b15_oil_efficiency),
          b16_oil_fuel_cons   = COALESCE($16, b16_oil_fuel_cons),
          b17_steam_output    = COALESCE($17, b17_steam_output),
          b18_surface_bd      = COALESCE($18, b18_surface_bd),
          c1_set_point        = COALESCE($19, c1_set_point),
          c2_water_in_temp    = COALESCE($20, c2_water_in_temp),
          c3_water_out_temp   = COALESCE($21, c3_water_out_temp),
          c4_cap              = COALESCE($22, c4_cap),
          c5_discharge_a      = COALESCE($23, c5_discharge_a),
          c6_suction_a        = COALESCE($24, c6_suction_a),
          c7_discharge_b      = COALESCE($25, c7_discharge_b),
          c8_suction_b        = COALESCE($26, c8_suction_b),
          c9_unit_capacity    = COALESCE($27, c9_unit_capacity),
          c10_cir_a_capacity  = COALESCE($28, c10_cir_a_capacity),
          c11_cir_b_capacity  = COALESCE($29, c11_cir_b_capacity),
          notes               = COALESCE($30, notes),
          foto_urls           = COALESCE($31, foto_urls),
          updated_at          = now()
        WHERE id = $32 RETURNING id
      `, [
        parseNum(d.b1), parseNum(d.b2), parseNum(d.b3), parseNum(d.b4), parseNum(d.b5),
        d.b6 || null, parseNum(d.b7), parseNum(d.b8), parseIntVal(d.b9),
        d.b10 || null, d.b11 || null,
        parseNum(d.b12), parseNum(d.b13), parseNum(d.b14), parseNum(d.b15),
        parseNum(d.b16), parseNum(d.b17), parseNum(d.b18),
        parseNum(d.c1), parseNum(d.c2), parseNum(d.c3), parseNum(d.c4),
        parseNum(d.c5), parseNum(d.c6), parseNum(d.c7), parseNum(d.c8),
        parseNum(d.c9), parseNum(d.c10), parseNum(d.c11),
        d.notes    || null,
        d.foto_urls?.length ? JSON.stringify(d.foto_urls) : null,
        existing.rows[0].id,
      ]);
      resultId = upd.rows[0]?.id;

    } else {
      const ins = await pool.query(`
        INSERT INTO de_utility (
          project_id, project_name, tanggal,
          b1_steam_press, b2_fg_temp, b3_fw_temp, b4_scale_temp, b5_overheat_temp,
          b6_next_blowdown, b7_conductivity, b8_air_press, b9_ignition_count,
          b10_oil_lfire_time, b11_oil_hfire_time,
          b12_flue_lfire_temp, b13_flue_hfire_temp, b14_fw_avg_temp,
          b15_oil_efficiency, b16_oil_fuel_cons, b17_steam_output, b18_surface_bd,
          c1_set_point, c2_water_in_temp, c3_water_out_temp, c4_cap,
          c5_discharge_a, c6_suction_a, c7_discharge_b, c8_suction_b,
          c9_unit_capacity, c10_cir_a_capacity, c11_cir_b_capacity,
          notes, chiller_notes, foto_urls
        ) VALUES (
          $1,$2,$3,
          $4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
        ) RETURNING id
      `, [
        projectId,
        d.project_name || null,
        d.tanggal || new Date().toISOString().split('T')[0],
        parseNum(d.b1), parseNum(d.b2), parseNum(d.b3), parseNum(d.b4), parseNum(d.b5),
        d.b6 || null, parseNum(d.b7), parseNum(d.b8), parseIntVal(d.b9),
        d.b10 || null, d.b11 || null,
        parseNum(d.b12), parseNum(d.b13), parseNum(d.b14), parseNum(d.b15),
        parseNum(d.b16), parseNum(d.b17), parseNum(d.b18),
        parseNum(d.c1), parseNum(d.c2), parseNum(d.c3), parseNum(d.c4),
        parseNum(d.c5), parseNum(d.c6), parseNum(d.c7), parseNum(d.c8),
        parseNum(d.c9), parseNum(d.c10), parseNum(d.c11),
        d.notes         || null,
        d.chiller_notes || null,
        JSON.stringify(d.foto_urls || []),
      ]);
      resultId = ins.rows[0]?.id;
    }

    res.json({ success: true, id: resultId, action: existing.rows.length > 0 ? 'updated' : 'inserted' });
  } catch (err) {
    console.error('❌ saveUtility:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getUtility(req, res) {
  try {
    const { project_name, tanggal, tanggal_dari, tanggal_sampai, tipe, kategori, limit } = req.query;
    const maxRows = Math.min(parseInt(limit) || 200, 500);

    // ── Query harian → de_utility_harian ──
    if (tipe === 'harian') {
      let q = `SELECT *, 'harian' AS tipe FROM de_utility_harian WHERE 1=1`;
      const params = [];
      if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
      if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
      if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
      if (kategori)       { params.push(kategori);        q += ` AND kategori = $${params.length}`; }
      q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
      const result = await pool.query(q, params);
      return res.json({ success: true, data: result.rows });
    }

    // ── Query project → de_utility ──
    let q = `SELECT *, 'project' AS tipe FROM de_utility WHERE 1=1`;
    const params = [];
    if (project_name)   { params.push(project_name);   q += ` AND project_name = $${params.length}`; }
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
    q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


// ═══════════════════════════════════════════════════════════
// LABORATORIUM — UPSERT per project + tanggal
// Payload: project_name, brix_entries[], moisture_entries[],
//          cip_lab_done, cip_lab_checks{}, cip_lab_entries[], notes, foto_urls[]
// ═══════════════════════════════════════════════════════════
async function saveLaboratorium(req, res) {
  try {
    const d = req.body;
    if (!d) return res.status(400).json({ success: false, error: 'Body kosong' });

    let projectId = null;
    if (d.project_name) {
      const pRes = await pool.query(
        `SELECT id FROM projects WHERE name = $1 LIMIT 1`, [d.project_name]
      );
      if (pRes.rows.length > 0) projectId = pRes.rows[0].id;
    }

    const existing = await pool.query(
      `SELECT id FROM de_laboratorium
       WHERE project_name = $1 AND tanggal = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`,
      [d.project_name || '']
    );

    const brixJSON   = d.brix_entries?.length    ? JSON.stringify(d.brix_entries)    : null;
    const moistJSON  = d.moisture_entries?.length ? JSON.stringify(d.moisture_entries): null;
    const cipEntJSON = d.cip_lab_entries?.length  ? JSON.stringify(d.cip_lab_entries) : null;
    const cipChkJSON = d.cip_lab_checks           ? JSON.stringify(d.cip_lab_checks)  : null;
    const fotoJSON   = d.foto_urls?.length        ? JSON.stringify(d.foto_urls)       : null;
    const cipDone    = d.cip_lab_done === true ? true : null;

    let resultId;

    if (existing.rows.length > 0) {
      const upd = await pool.query(`
        UPDATE de_laboratorium SET
          -- append entry baru agar history input hari yang sama tidak tertimpa
          brix_entries     = CASE
            WHEN $1::jsonb IS NULL THEN brix_entries
            ELSE COALESCE(brix_entries, '[]'::jsonb) || $1::jsonb
          END,
          moisture_entries = CASE
            WHEN $2::jsonb IS NULL THEN moisture_entries
            ELSE COALESCE(moisture_entries, '[]'::jsonb) || $2::jsonb
          END,
          cip_lab_done     = COALESCE($3, cip_lab_done),
          cip_lab_checks   = COALESCE($4, cip_lab_checks),
          cip_lab_entries  = COALESCE($5, cip_lab_entries),
          notes            = COALESCE($6, notes),
          foto_urls        = COALESCE($7, foto_urls),
          updated_at       = now()
        WHERE id = $8 RETURNING id
      `, [brixJSON, moistJSON, cipDone, cipChkJSON, cipEntJSON, d.notes||null, fotoJSON, existing.rows[0].id]);
      resultId = upd.rows[0]?.id;

    } else {
      const ins = await pool.query(`
        INSERT INTO de_laboratorium (
          project_id, project_name, tanggal,
          brix_entries, moisture_entries,
          cip_lab_done, cip_lab_checks, cip_lab_entries,
          notes, foto_urls
        ) VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9) RETURNING id
      `, [
        projectId, d.project_name||null,
        brixJSON??'[]', moistJSON??'[]',
        d.cip_lab_done===true,
        cipChkJSON??'{}', cipEntJSON??'[]',
        d.notes||null, fotoJSON??'[]',
      ]);
      resultId = ins.rows[0]?.id;
    }

    res.json({ success: true, id: resultId, action: existing.rows.length > 0 ? 'updated' : 'inserted' });
  } catch (err) {
    console.error('❌ saveLaboratorium:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
async function getLaboratorium(req, res) {
  try {
    const { project_name, tanggal, tanggal_dari, tanggal_sampai, limit, harian } = req.query;
    let q = `SELECT * FROM de_laboratorium WHERE 1=1`;
    const params = [];
    // harian=1 → hanya data entry harian (tanpa project)
    if (harian === '1') { q += ` AND (project_name IS NULL OR project_name = '')`; }
    if (project_name)   { params.push(project_name);   q += ` AND project_name = $${params.length}`; }
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
    const maxRows = Math.min(parseInt(limit) || 200, 500);
    q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
    const result = await pool.query(q, params);
    // Parse JSON fields agar frontend tidak perlu JSON.parse
    const rows = result.rows.map(r => ({
      ...r,
      brix_entries:     typeof r.brix_entries     === 'string' ? JSON.parse(r.brix_entries     || '[]') : (r.brix_entries     || []),
      moisture_entries: typeof r.moisture_entries === 'string' ? JSON.parse(r.moisture_entries || '[]') : (r.moisture_entries || []),
      cip_lab_entries:  typeof r.cip_lab_entries  === 'string' ? JSON.parse(r.cip_lab_entries  || '[]') : (r.cip_lab_entries  || []),
    }));
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


// ═══════════════════════════════════════════════════════════
// LIMBAH — tiap submit = record baru (tidak upsert)
// ═══════════════════════════════════════════════════════════
async function saveLimbah(req, res) {
  try {
    const d = req.body;
    if (!d) return res.status(400).json({ success: false, error: 'Body kosong' });

    // Validasi tanggal minimal
    const tanggal = d.tanggal || new Date().toISOString().split('T')[0];
    if (!tanggal) return res.status(400).json({ success: false, error: 'Tanggal tidak valid' });

    const result = await pool.query(`
      INSERT INTO de_limbah (
        tanggal, project_name, tipe,
        awal, akhir, volume,
        cod, bod, tss, ph, temp_effluent,
        notes, foto_urls
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [
      tanggal,
      d.project_name || null,
      d.tipe         || 'harian',
      parseNum(d.awal),
      parseNum(d.akhir),
      parseNum(d.vol_m3 ?? d.vol),
      parseNum(d.cod),
      parseNum(d.bod),
      parseNum(d.tss),
      parseNum(d.ph),
      parseNum(d.temp_effluent ?? d.temp) || null,
      d.notes   || null,
      JSON.stringify(d.foto_urls || []),
    ]);

    if (!result.rows[0]) {
      return res.status(500).json({ success: false, error: 'Data tidak tersimpan, coba lagi' });
    }

    console.log('✅ saveLimbah SUCCESS:', result.rows[0].id);
    res.json({ 
      success: true, 
      id: result.rows[0].id, 
      data: result.rows[0],
      message: 'Data limbah berhasil disimpan' 
    });
  } catch (err) {
    console.error('❌ saveLimbah ERROR:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getLimbah(req, res) {
  try {
    const { tanggal, tanggal_dari, tanggal_sampai, project_name, limit } = req.query;
    let q = `SELECT * FROM de_limbah WHERE 1=1`;
    const params = [];
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
    if (project_name)   { params.push(project_name);   q += ` AND project_name = $${params.length}`; }
    const maxRows = Math.min(parseInt(limit) || 200, 500);
    q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


// ═══════════════════════════════════════════════════════════
// LAPORAN HARIAN
// ═══════════════════════════════════════════════════════════
async function saveLaporan(req, res) {
  try {
    const d = req.body;
    if (!d) return res.status(400).json({ success: false, error: 'Body kosong' });

    const result = await pool.query(`
      INSERT INTO laporan_harian (title, nama, shift, kategori, prioritas, lokasi, deskripsi, aksi)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    `, [
      d.title     || null,
      d.nama      || null,
      d.shift     || null,
      d.kategori  || null,
      d.prioritas || null,
      d.lokasi    || null,
      d.deskripsi || null,
      d.aksi      || null,
    ]);

    res.json({ success: true, id: result.rows[0]?.id });
  } catch (err) {
    console.error('❌ saveLaporan:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getLaporan(req, res) {
  try {
    const limit  = parseInt(req.query.limit) || 100;
    const result = await pool.query(
      `SELECT * FROM laporan_harian ORDER BY created_at DESC LIMIT $1`, [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}



// ═══════════════════════════════════════════════════════════
// LABORATORIUM HARIAN — tabel de_laboratorium_harian
// ═══════════════════════════════════════════════════════════
async function saveLaboratoriumHarian(req, res) {
  try {
    const d       = req.body;
    const tgl     = d.tanggal || new Date().toISOString().split('T')[0];
    const section = d.section || null; // 'tw1' | 'tw2' | 'filter'
    const a       = d.analisa || {};

    // Build notes string (backward compat)
    let notesVal = d.notes || null;
    if (d.analisa && typeof d.analisa === 'object') {
      const parts = [];
      if (section)    parts.push('[' + section.toUpperCase() + ']');
      if (a.sample)   parts.push('Sample: ' + a.sample);
      if (a.ph)       parts.push('pH: ' + a.ph);
      if (a.tds)      parts.push('TDS: ' + a.tds + ' mg/L');
      if (a.hardness) parts.push('Hardness: ' + a.hardness + ' mg/L');
      if (a.alkali)   parts.push('Alkali: ' + a.alkali + ' mg/L');
      if (parts.length) notesVal = parts.join(' | ') + (d.notes ? '\n' + d.notes : '');
    }

    const brixJSON   = d.brix_entries?.length     ? JSON.stringify(d.brix_entries)     : null;
    const moistJSON  = d.moisture_entries?.length ? JSON.stringify(d.moisture_entries) : null;
    const cipEntJSON = d.cip_lab_entries?.length  ? JSON.stringify(d.cip_lab_entries)  : null;
    const cipChkJSON = d.cip_lab_checks           ? JSON.stringify(d.cip_lab_checks)   : null;
    const fotoJSON   = d.foto_urls?.length        ? JSON.stringify(d.foto_urls)        : null;

    // Cek apakah baris tanggal hari ini sudah ada
    const existing = await pool.query(
      `SELECT id, notes, water_quality FROM de_laboratorium_harian WHERE tanggal = $1 ORDER BY created_at DESC LIMIT 1`,
      [tgl]
    );

    if (section && existing.rows.length > 0) {
      // ── UPDATE: PUSH entry baru ke array section (tidak overwrite) ──
      const row   = existing.rows[0];
      const oldWQ = row.water_quality || {};

      // Pastikan section adalah array — migrate dari format object lama jika perlu
      const existingEntries = Array.isArray(oldWQ[section])
        ? oldWQ[section]
        : (oldWQ[section] && typeof oldWQ[section] === 'object' ? [oldWQ[section]] : []);

      const newEntry = {
        tds:         a.tds      ? parseFloat(a.tds)      : null,
        hardness:    a.hardness ? parseFloat(a.hardness) : null,
        ph:          a.ph       ? parseFloat(a.ph)       : null,
        alkaline:    a.alkali   ? parseFloat(a.alkali)   : null,
        sample:      a.sample   || null,
        recorded_at: new Date().toISOString(),
      };

      const newWQ = {
        ...oldWQ,
        [section]: [...existingEntries, newEntry],
      };

      const oldNotes     = row.notes || '';
      const updatedNotes = oldNotes + (oldNotes ? '\n' : '') + notesVal;

      await pool.query(
        `UPDATE de_laboratorium_harian
         SET water_quality = $1, notes = $2, updated_at = now()
         WHERE id = $3`,
        [JSON.stringify(newWQ), updatedNotes, row.id]
      );
      return res.json({ success: true, id: row.id, action: 'updated', entries: newWQ[section].length });
    }

    // ── INSERT: baris baru untuk tanggal ini (atau entry non-analisa) ──
    const wqInit = (section && a) ? {
      [section]: [{
        tds:         a.tds      ? parseFloat(a.tds)      : null,
        hardness:    a.hardness ? parseFloat(a.hardness) : null,
        ph:          a.ph       ? parseFloat(a.ph)       : null,
        alkaline:    a.alkali   ? parseFloat(a.alkali)   : null,
        sample:      a.sample   || null,
        recorded_at: new Date().toISOString(),
      }]
    } : {};

    const result = await pool.query(`
      INSERT INTO de_laboratorium_harian (
        tanggal, brix_entries, moisture_entries,
        cip_lab_done, cip_lab_checks, cip_lab_entries,
        notes, foto_urls, water_quality
      ) VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      tgl,
      brixJSON   || '[]',
      moistJSON  || '[]',
      d.cip_lab_done === true,
      cipChkJSON || '{}',
      cipEntJSON || '[]',
      notesVal,
      fotoJSON   || '[]',
      JSON.stringify(wqInit),
    ]);
    res.json({ success: true, id: result.rows[0]?.id, action: 'inserted' });
  } catch (err) {
    console.error('❌ saveLaboratoriumHarian:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getLaboratoriumHarian(req, res) {
  try {
    const { tanggal, tanggal_dari, tanggal_sampai, limit } = req.query;
    let q = `SELECT *, 'harian' AS tipe FROM de_laboratorium_harian WHERE 1=1`;
    const params = [];
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
    const maxRows = Math.min(parseInt(limit) || 200, 500);
    q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// LIMBAH HARIAN — tabel de_limbah_harian
// ═══════════════════════════════════════════════════════════
async function saveLimbahHarian(req, res) {
  try {
    const d = req.body;
    const result = await pool.query(`
      INSERT INTO de_limbah_harian (
        tanggal, awal, akhir, volume,
        cod, bod, tss, ph, temp_effluent,
        jar_alum, jar_total, notes, foto_urls
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id
    `, [
      d.tanggal || new Date().toISOString().split('T')[0],
      parseNum(d.awal),
      parseNum(d.akhir),
      parseNum(d.vol_m3 ?? d.vol ?? d.volume),
      parseNum(d.cod),
      parseNum(d.bod),
      parseNum(d.tss),
      parseNum(d.ph),
      parseNum(d.temp ?? d.temp_effluent),
      parseNum(d.jar_alum),
      parseNum(d.jar_total),
      d.notes || null,
      JSON.stringify(d.foto_urls || []),
    ]);
    res.json({ success: true, id: result.rows[0]?.id, action: 'inserted' });
  } catch (err) {
    console.error('❌ saveLimbahHarian:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getLimbahHarian(req, res) {
  try {
    const { tanggal, tanggal_dari, tanggal_sampai, limit } = req.query;
    let q = `SELECT *, 'harian' AS tipe FROM de_limbah_harian WHERE 1=1`;
    const params = [];
    if (tanggal)        { params.push(tanggal);         q += ` AND tanggal = $${params.length}`; }
    if (tanggal_dari)   { params.push(tanggal_dari);   q += ` AND tanggal >= $${params.length}`; }
    if (tanggal_sampai) { params.push(tanggal_sampai); q += ` AND tanggal <= $${params.length}`; }
    const maxRows = Math.min(parseInt(limit) || 200, 500);
    q += ` ORDER BY created_at DESC LIMIT ${maxRows}`;
    const result = await pool.query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── Lab Samples ──────────────────────────────────────────────
async function getLabSamples(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name FROM lab_samples ORDER BY name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function createLabSample(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nama sample wajib diisi' });
    }
    const result = await pool.query(
      `INSERT INTO lab_samples (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name.trim()]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteLabSample(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nama sample wajib diisi' });
    }
    await pool.query(`DELETE FROM lab_samples WHERE name = $1`, [name.trim()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  saveProduction,         getProduction,         getProductionHistory,
  saveUtility,            getUtility,
  saveLaboratorium,       getLaboratorium,
  saveLaboratoriumHarian, getLaboratoriumHarian,
  saveLimbah,             getLimbah,
  saveLimbahHarian,       getLimbahHarian,
  saveLaporan,            getLaporan,
  getLabSamples, createLabSample, deleteLabSample,
};