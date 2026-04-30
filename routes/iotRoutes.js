// // routes/iotRoutes.js
// // Query langsung ke tabel DB yang ada:
// //   laporan_water_level, laporan_water_flow, laporan_lingkungan, laporan_patroli

// const express  = require('express');
// const router   = express.Router();
// const { poolIoT } = require('../db');  // ganti dengan require('../db') kalau poolIoT tidak ada

// // ══ HELPER ══════════════════════════════════════════════════════
// // Ambil row terbaru dari sebuah tabel
// async function latest(table, cols = '*') {
//   const r = await poolIoT.query(
//     `SELECT ${cols} FROM ${table} ORDER BY created_at DESC LIMIT 1`
//   );
//   return r.rows[0] || null;
// }

// // ══ GET /api/iot/dashboard/summary ══════════════════════════════
// // Dipakai oleh fetchSummary() di app.js — harus kembalikan:
// // { success, data: { water_level, water_flow, lingkungan, total_patroli } }
// router.get('/dashboard/summary', async (req, res) => {
//   try {
//     // Ambil data terbaru dari setiap tabel
//     const [wl, wf, env] = await Promise.all([
//       latest('laporan_water_level'),
//       latest('laporan_water_flow'),
//       latest('laporan_lingkungan'),
//     ]);

//     // Patroli: ambil status terbaru per posisi (pos 1-4)
//     const patResult = await poolIoT.query(`
//       SELECT DISTINCT ON (pos)
//         pos, status, created_at
//       FROM laporan_patroli
//       ORDER BY pos, created_at DESC
//     `);
//     const patTotal = await poolIoT.query(
//       `SELECT COUNT(*) as total FROM laporan_patroli WHERE created_at > NOW() - INTERVAL '24 hours'`
//     );

//     const total_patroli = {
//       positions: patResult.rows,
//       total:     patTotal.rows[0]?.total || 0,
//     };

//     res.json({
//       success: true,
//       data: {
//         water_level:   wl,
//         water_flow:    wf,
//         lingkungan:    env,
//         total_patroli,
//       },
//     });
//   } catch (err) {
//     console.error('GET /iot/dashboard/summary error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ══ GET /api/iot/latest ══════════════════════════════════════════
// // Alias — beberapa versi app.js mungkin pakai endpoint ini
// router.get('/latest', async (req, res) => {
//   try {
//     const [wl, wf, env] = await Promise.all([
//       latest('laporan_water_level'),
//       latest('laporan_water_flow'),
//       latest('laporan_lingkungan'),
//     ]);
//     res.json({ success: true, data: { water_level: wl, water_flow: wf, lingkungan: env } });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ══ GET /api/iot/water-level ════════════════════════════════════
// // History water level — dipakai di Detail drawer & tabel
// router.get('/water-level', async (req, res) => {
//   try {
//     const limit = Math.min(parseInt(req.query.limit) || 50, 500);
//     const r = await poolIoT.query(
//       `SELECT id, s1_cm, s2_cm, p1, p2, created_at
//        FROM laporan_water_level
//        ORDER BY created_at DESC
//        LIMIT $1`,
//       [limit]
//     );
//     res.json({ success: true, data: r.rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ══ GET /api/iot/water-flow ═════════════════════════════════════
// router.get('/water-flow', async (req, res) => {
//   try {
//     const limit = Math.min(parseInt(req.query.limit) || 50, 500);
//     const r = await poolIoT.query(
//       `SELECT id, rate, total, created_at
//        FROM laporan_water_flow
//        ORDER BY created_at DESC
//        LIMIT $1`,
//       [limit]
//     );
//     res.json({ success: true, data: r.rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ══ GET /api/iot/lingkungan ══════════════════════════════════════
// router.get('/lingkungan', async (req, res) => {
//   try {
//     const limit = Math.min(parseInt(req.query.limit) || 50, 500);
//     const r = await poolIoT.query(
//       `SELECT id, t, h, raw, stat, created_at
//        FROM laporan_lingkungan
//        ORDER BY created_at DESC
//        LIMIT $1`,
//       [limit]
//     );
//     res.json({ success: true, data: r.rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ══ GET /api/iot/patroli ════════════════════════════════════════
// router.get('/patroli', async (req, res) => {
//   try {
//     const limit = Math.min(parseInt(req.query.limit) || 50, 500);
//     const r = await poolIoT.query(
//       `SELECT id, pos, status, created_at
//        FROM laporan_patroli
//        ORDER BY created_at DESC
//        LIMIT $1`,
//       [limit]
//     );
//     res.json({ success: true, data: r.rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router  = express.Router();

// ✅ Import dengan nama yang benar sesuai module.exports di iotController.js
const {
  getDashboardSummary,   // ← sesuai nama di module.exports
  getWaterLevel,
  getLatestWaterLevel,
  getWaterFlow,
  getLatestWaterFlow,
  getLingkungan,
  getLatestLingkungan,
  getPatroli,
} = require('../controllers/iotController');

// Dashboard summary (semua sensor terbaru)
router.get('/dashboard/summary', getDashboardSummary);

// Water Level
router.get('/water-level',        getWaterLevel);
router.get('/water-level/latest', getLatestWaterLevel);

// Water Flow
router.get('/water-flow',         getWaterFlow);
router.get('/water-flow/latest',  getLatestWaterFlow);

// Lingkungan (suhu, kelembapan, gas)
router.get('/lingkungan',         getLingkungan);
router.get('/lingkungan/latest',  getLatestLingkungan);

// Patroli
router.get('/patroli',            getPatroli);

module.exports = router;