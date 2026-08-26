// iotController.js
const { poolIoT } = require('../db');

const LIMIT = 100;

// ════════════════════════════════════════════════════
//  GET /api/iot/dashboard/summary
// ════════════════════════════════════════════════════
async function getSummary(req, res) {
  try {
    const [wlRes, wfRes, envRes, patTotalRes, patListRes, fuelRes] = await Promise.all([
      poolIoT.query(`
        SELECT
          MAX(s1_cm)  FILTER (WHERE s1_cm  IS NOT NULL) AS s1_cm,
          MAX(s2_cm)  FILTER (WHERE s2_cm  IS NOT NULL) AS s2_cm,
          MAX(s3_cm)  FILTER (WHERE s3_cm  IS NOT NULL) AS s3_cm,
          MAX(s4_cm)  FILTER (WHERE s4_cm  IS NOT NULL) AS s4_cm,
          MAX(s5_cm)  FILTER (WHERE s5_cm  IS NOT NULL) AS s5_cm,
          MAX(s6_cm)  FILTER (WHERE s6_cm  IS NOT NULL) AS s6_cm,
          MAX(s7_cm)  FILTER (WHERE s7_cm  IS NOT NULL) AS s7_cm,
          MAX(s8_cm)  FILTER (WHERE s8_cm  IS NOT NULL) AS s8_cm,
          MAX(s9_cm)  FILTER (WHERE s9_cm  IS NOT NULL) AS s9_cm,
          MAX(s10_cm) FILTER (WHERE s10_cm IS NOT NULL) AS s10_cm,
          MAX(s11_cm) FILTER (WHERE s11_cm IS NOT NULL) AS s11_cm,
          MAX(p1)     FILTER (WHERE p1     IS NOT NULL) AS p1,
          MAX(p2)     FILTER (WHERE p2     IS NOT NULL) AS p2,
          MAX(created_at) AS created_at
        FROM (
          SELECT * FROM laporan_water_level
          ORDER BY created_at DESC LIMIT 10
        ) recent
      `),
      poolIoT.query('SELECT id, rate, total, created_at FROM laporan_water_flow ORDER BY created_at DESC LIMIT 1'),
      poolIoT.query('SELECT id, t, h, raw, stat, created_at FROM laporan_lingkungan ORDER BY created_at DESC LIMIT 1'),
      poolIoT.query("SELECT COUNT(*) AS total FROM laporan_patroli WHERE created_at >= CURRENT_DATE"),
      poolIoT.query(
        `SELECT DISTINCT ON (pos) id, pos, status, created_at
         FROM laporan_patroli
         WHERE created_at >= CURRENT_DATE
         ORDER BY pos, created_at DESC`
      ),
      poolIoT.query('SELECT id, percent, liters, created_at FROM laporan_fuel_level ORDER BY created_at DESC LIMIT 1'),
    ]);

    res.json({
      success: true,
      data: {
        water_level: wlRes.rows[0]  || null,
        water_flow:  wfRes.rows[0]  || null,
        lingkungan:  envRes.rows[0] || null,
        fuel_level:  fuelRes.rows[0] || null,
        patroli: {
          total_hari_ini: parseInt(patTotalRes.rows[0]?.total ?? 0),
          pos_list: patListRes.rows,
        },
      },
    });
  } catch (err) {
    console.error('getSummary error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/water-level
// ════════════════════════════════════════════════════
async function getWaterLevel(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, s1_cm, s2_cm, s3_cm, s4_cm, s5_cm, s6_cm, s7_cm, s8_cm, s9_cm, s10_cm, s11_cm, p1, p2, created_at FROM laporan_water_level ORDER BY created_at DESC LIMIT $1',
      [LIMIT]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getWaterLevel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/water-level/latest
// ════════════════════════════════════════════════════
async function getLatestWaterLevel(req, res) {
  try {
    const { rows } = await poolIoT.query(`
      SELECT
        MAX(s1_cm)  FILTER (WHERE s1_cm  IS NOT NULL) AS s1_cm,
        MAX(s2_cm)  FILTER (WHERE s2_cm  IS NOT NULL) AS s2_cm,
        MAX(s3_cm)  FILTER (WHERE s3_cm  IS NOT NULL) AS s3_cm,
        MAX(s4_cm)  FILTER (WHERE s4_cm  IS NOT NULL) AS s4_cm,
        MAX(s5_cm)  FILTER (WHERE s5_cm  IS NOT NULL) AS s5_cm,
        MAX(s6_cm)  FILTER (WHERE s6_cm  IS NOT NULL) AS s6_cm,
        MAX(s7_cm)  FILTER (WHERE s7_cm  IS NOT NULL) AS s7_cm,
        MAX(s8_cm)  FILTER (WHERE s8_cm  IS NOT NULL) AS s8_cm,
        MAX(s9_cm)  FILTER (WHERE s9_cm  IS NOT NULL) AS s9_cm,
        MAX(s10_cm) FILTER (WHERE s10_cm IS NOT NULL) AS s10_cm,
        MAX(s11_cm) FILTER (WHERE s11_cm IS NOT NULL) AS s11_cm,
        MAX(p1)     FILTER (WHERE p1     IS NOT NULL) AS p1,
        MAX(p2)     FILTER (WHERE p2     IS NOT NULL) AS p2,
        MAX(created_at) AS created_at
      FROM (
        SELECT * FROM laporan_water_level
        ORDER BY created_at DESC LIMIT 10
      ) recent
    `);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getLatestWaterLevel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/water-flow
// ════════════════════════════════════════════════════
async function getWaterFlow(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, rate, total, created_at FROM laporan_water_flow ORDER BY created_at DESC LIMIT $1',
      [LIMIT]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getWaterFlow error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/water-flow/latest
// ════════════════════════════════════════════════════
async function getLatestWaterFlow(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, rate, total, created_at FROM laporan_water_flow ORDER BY created_at DESC LIMIT 1'
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getLatestWaterFlow error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/lingkungan
// ════════════════════════════════════════════════════
async function getLingkungan(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, t, h, raw, stat, created_at FROM laporan_lingkungan ORDER BY created_at DESC LIMIT $1',
      [LIMIT]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getLingkungan error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/lingkungan/latest
// ════════════════════════════════════════════════════
async function getLatestLingkungan(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, t, h, raw, stat, created_at FROM laporan_lingkungan ORDER BY created_at DESC LIMIT 1'
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getLatestLingkungan error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/fuel-level
//  History genset fuel (s12) — tabel terpisah, satuan %/liter
// ════════════════════════════════════════════════════
async function getFuelLevel(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || LIMIT, 500);
    const { rows } = await poolIoT.query(
      'SELECT id, percent, liters, created_at FROM laporan_fuel_level ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getFuelLevel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/fuel-level/latest
// ════════════════════════════════════════════════════
async function getLatestFuelLevel(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, percent, liters, created_at FROM laporan_fuel_level ORDER BY created_at DESC LIMIT 1'
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getLatestFuelLevel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/patroli
// ════════════════════════════════════════════════════
async function getPatroli(req, res) {
  try {
    const { rows } = await poolIoT.query(
      'SELECT id, pos, status, created_at FROM laporan_patroli ORDER BY created_at DESC LIMIT $1',
      [LIMIT]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPatroli error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ════════════════════════════════════════════════════
//  GET /api/iot/sensor-settings
//  Load all sensor settings from database
//  Used by frontend to sync settings across devices
// ════════════════════════════════════════════════════
async function getSensorSettings(req, res) {
  try {
    const { rows } = await poolIoT.query(
      `SELECT id, fixed_id, key, name, shape, orientasi, tinggi, panjang, lebar, diameter,
              sensor_zero_cm, warn_pct, crit_pct, notes, is_active, settings_data,
              created_at, updated_at
       FROM sensor_settings
       WHERE is_active = TRUE
       ORDER BY fixed_id ASC`
    );
    
    res.json({
      success: true,
      data: rows,
      message: `${rows.length} sensor settings loaded`
    });
  } catch (err) {
    // Graceful fallback: table doesn't exist yet, return empty array
    // Frontend will use localStorage or default FIXED_TANK_SLOTS
    if (err.code === '42P01') {  // PostgreSQL undefined_table error
      console.warn('⚠️ sensor_settings table not found, using fallback (empty data)');
      return res.json({
        success: true,
        data: [],
        message: 'No sensor settings in database (table not created yet)'
      });
    }
    console.error('getSensorSettings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}

// ════════════════════════════════════════════════════
//  POST /api/iot/sensor-settings
//  Save/update sensor settings to database
//  Called when user changes tank dimensions in settings modal
// ════════════════════════════════════════════════════
async function saveSensorSettings(req, res) {
  try {
    const { sensors } = req.body;
    
    if (!Array.isArray(sensors)) {
      return res.status(400).json({
        success: false,
        message: 'Sensors harus berupa array'
      });
    }

    if (sensors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 sensor harus dikirim'
      });
    }

    // Process each sensor
    let saved = 0;
    let errors = [];

    for (const sensor of sensors) {
      try {
        const {
          id,
          fixedId,
          name,
          key,
          shape = 'persegi',
          orientasi = 'vertikal',
          tinggi,
          panjang,
          lebar,
          diameter,
          sensorZeroCm = 0,
          warnPct = 40,
          critPct = 15,
          note = '',
          settingsData = null
        } = sensor;

        // Use fixedId or id as unique identifier
        const uniqueId = fixedId || id;
        
        if (!uniqueId || !name) {
          errors.push(`Sensor ${name || '?'} missing ID atau name`);
          continue;
        }

        // UPSERT: insert or update
        const result = await poolIoT.query(
          `INSERT INTO sensor_settings
           (fixed_id, key, name, shape, orientasi, tinggi, panjang, lebar, diameter,
            sensor_zero_cm, warn_pct, crit_pct, notes, is_active, settings_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (fixed_id) DO UPDATE SET
             key = EXCLUDED.key,
             name = EXCLUDED.name,
             shape = EXCLUDED.shape,
             orientasi = EXCLUDED.orientasi,
             tinggi = EXCLUDED.tinggi,
             panjang = EXCLUDED.panjang,
             lebar = EXCLUDED.lebar,
             diameter = EXCLUDED.diameter,
             sensor_zero_cm = EXCLUDED.sensor_zero_cm,
             warn_pct = EXCLUDED.warn_pct,
             crit_pct = EXCLUDED.crit_pct,
             notes = EXCLUDED.notes,
             settings_data = EXCLUDED.settings_data,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id, fixed_id, name, tinggi, panjang, lebar`,
          [
            uniqueId, key, name, shape, orientasi, tinggi, panjang, lebar, diameter,
            sensorZeroCm, warnPct, critPct, note, true, settingsData ? JSON.stringify(settingsData) : null
          ]
        );

        if (result.rows.length > 0) {
          saved++;
          console.log(`✅ Sensor "${name}" saved to DB (ID: ${result.rows[0].fixed_id})`);
        }

      } catch (err) {
        errors.push(`Error saving sensor: ${err.message}`);
        console.error('Error saving individual sensor:', err.message);
      }
    }

    res.json({
      success: true,
      message: `✅ ${saved}/${sensors.length} sensor settings tersimpan ke database`,
      saved,
      total: sensors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    // Graceful fallback: if table doesn't exist, just return success
    // Frontend uses localStorage as fallback anyway
    if (err.code === '42P01') {
      console.warn('⚠️ sensor_settings table not found, skipping DB save (localStorage is fallback)');
      return res.json({
        success: true,
        message: '⚠️ Database table not ready, settings saved to localStorage only',
        saved: 0,
        total: 0,
        info: 'Database migration pending'
      });
    }
    console.error('saveSensorSettings error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
}

// ════════════════════════════════════════════════════════════
//  POST /api/iot/setup-default-sensors
//  Setup default sensor configurations (s1-s11) for CROSS-DEVICE SYNC
//  Call this once during initial setup
// ════════════════════════════════════════════════════════════
async function setupDefaultSensors(req, res) {
  try {
    const defaultSensors = [
      { fixedId: 'air_proses', key: 's1', name: 'Air Proses', shape: 'persegi', orientasi: 'vertikal', tinggi: 1.0, panjang: 3.0, lebar: 2.0, sensorZeroCm: 20, warnPct: 40, critPct: 15, note: 'Process Water Tank' },
      { fixedId: 'feed_slury', key: 's2', name: 'Feed Slurry Water', shape: 'persegi', orientasi: 'vertikal', tinggi: 1.5, panjang: 6.0, lebar: 2.0, sensorZeroCm: 20, warnPct: 40, critPct: 15, note: 'Feed Slurry Tank' },
      { fixedId: 'tanu_edi', key: 's4', name: 'Chiller In', shape: 'persegi', orientasi: 'vertikal', tinggi: 1.22, panjang: 1.0, lebar: 0.8, sensorZeroCm: 20, warnPct: 40, critPct: 15, note: 'Chiller Inlet' },
      { fixedId: 'feed_edi', key: 's5', name: 'Chiller Out', shape: 'persegi', orientasi: 'vertikal', tinggi: 1.22, panjang: 1.0, lebar: 0.8, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'Chiller Outlet / Feed Aroma' },
      { fixedId: 'solar', key: 's3', name: 'Tangki Solar', shape: 'silinder', orientasi: 'horizontal', tinggi: 1.48, panjang: 4.23, diameter: 1.48, sensorZeroCm: 20, warnPct: 40, critPct: 15, note: 'Diesel Tank - Horizontal Cylinder' },
      { fixedId: 'boiler_fw', key: 's6', name: 'Tank Aroma', shape: 'persegi', orientasi: 'vertikal', tinggi: 0.445, panjang: 3.65, lebar: 0.745, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'Aroma Tank' },
      { fixedId: 'slury_1', key: 's7', name: 'Slurry 1', shape: 'silinder', orientasi: 'vertikal', tinggi: 2.13, diameter: 0.97, sensorZeroCm: 20, warnPct: 40, critPct: 15, note: 'Slurry Tank 1 - Vertical Cylinder' },
      { fixedId: 'slury_2', key: 's8', name: 'Slurry 2', shape: 'silinder', orientasi: 'vertikal', tinggi: 2.13, diameter: 0.97, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'Slurry Tank 2 - Vertical Cylinder' },
      { fixedId: 'ground_tank_a', key: 's9', name: 'Ground Tank A', shape: 'persegi', orientasi: 'vertikal', tinggi: 2.0, panjang: 12.0, lebar: 3.0, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'Ground Storage Tank A' },
      { fixedId: 'ground_tank_b', key: 's10', name: 'Ground Tank B', shape: 'persegi', orientasi: 'vertikal', tinggi: 1.2, panjang: 1.0, lebar: 1.0, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'Ground Storage Tank B' },
      { fixedId: 'edi_cadangan', key: 's11', name: 'EDI Cadangan', shape: 'silinder', orientasi: 'vertikal', tinggi: 1.0, diameter: 1.0, sensorZeroCm: 0, warnPct: 40, critPct: 15, note: 'EDI Cadangan (Tabung) - dimensi TBD, sesuaikan setelah diukur' }
    ];

    let count = 0;
    for (const sensor of defaultSensors) {
      try {
        await poolIoT.query(
          `INSERT INTO sensor_settings
           (fixed_id, key, name, shape, orientasi, tinggi, panjang, lebar, diameter,
            sensor_zero_cm, warn_pct, crit_pct, notes, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
           ON CONFLICT (fixed_id) DO UPDATE SET
             key = EXCLUDED.key, name = EXCLUDED.name, shape = EXCLUDED.shape,
             orientasi = EXCLUDED.orientasi, tinggi = EXCLUDED.tinggi, panjang = EXCLUDED.panjang,
             lebar = EXCLUDED.lebar, diameter = EXCLUDED.diameter, sensor_zero_cm = EXCLUDED.sensor_zero_cm,
             warn_pct = EXCLUDED.warn_pct, crit_pct = EXCLUDED.crit_pct, notes = EXCLUDED.notes,
             updated_at = CURRENT_TIMESTAMP`,
          [
            sensor.fixedId,
            sensor.key,
            sensor.name,
            sensor.shape,
            sensor.orientasi,
            sensor.tinggi || null,
            sensor.panjang || null,
            sensor.lebar || null,
            sensor.diameter || null,
            sensor.sensorZeroCm,
            sensor.warnPct,
            sensor.critPct,
            sensor.note
          ]
        );
        count++;
      } catch (err) {
        console.error(`Error inserting ${sensor.fixedId}:`, err.message);
      }
    }

    console.log(`✅ Setup complete: ${count}/${defaultSensors.length} sensors configured for cross-device sync`);
    res.json({
      success: true,
      message: `✅ Setup complete: ${count}/${defaultSensors.length} sensors configured`,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('setupDefaultSensors error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Setup error: ' + err.message
    });
  }
}

// ✅ All functions exported with correct names matching iotRoutes.js
async function getLatest(req, res) {
  return getSummary(req, res);
}

module.exports = {
  getDashboardSummary: getSummary,
  getLatest,
  getWaterLevel,
  getLatestWaterLevel,
  getWaterFlow,
  getLatestWaterFlow,
  getLingkungan,
  getLatestLingkungan,
  getFuelLevel,
  getLatestFuelLevel,
  getPatroli,
  getSensorSettings,
  saveSensorSettings,
  setupDefaultSensors,
};