// // ═══════════════════════════════════════════════════════════
// // dataentry.route.js
// // Mount di server.js:
// //   const deRoute = require('./routes/dataentry.route');
// //   app.use('/api/dataentry', deRoute);
// // ═══════════════════════════════════════════════════════════

// const express = require('express');
// const router  = express.Router();
// const c       = require('../controllers/dataentryController');

// router.use(express.json({ limit: '20mb' })); // foto base64 bisa besar

// // ── Production ──────────────────────────────────────────────
// router.get   ('/production',      c.getProduction);
// router.post  ('/production',      c.createProduction);
// router.delete('/production/:id',  c.deleteProduction);

// // ── Laboratorium ────────────────────────────────────────────
// router.get   ('/laboratorium',     c.getLaboratorium);
// router.post  ('/laboratorium',     c.createLaboratorium);
// router.delete('/laboratorium/:id', c.deleteLaboratorium);

// // ── Utility ─────────────────────────────────────────────────
// router.get   ('/utility',      c.getUtility);
// router.post  ('/utility',      c.createUtility);
// router.delete('/utility/:id',  c.deleteUtility);

// // ── Limbah ──────────────────────────────────────────────────
// router.get   ('/limbah',      c.getLimbah);
// router.post  ('/limbah',      c.createLimbah);
// router.delete('/limbah/:id',  c.deleteLimbah);

// // ── Laporan Harian ──────────────────────────────────────────
// router.get   ('/laporan',      c.getLaporanHarian);
// router.post  ('/laporan',      c.createLaporanHarian);
// router.delete('/laporan/:id',  c.deleteLaporanHarian);

// // ── Kartu Stok ──────────────────────────────────────────────
// router.get   ('/kartu-stok',      c.getKartuStok);
// router.post  ('/kartu-stok',      c.createKartuStok);
// router.patch ('/kartu-stok/:id',  c.updateKartuStok);
// router.delete('/kartu-stok/:id',  c.deleteKartuStok);

// // ── Surat Jalan ─────────────────────────────────────────────
// router.get   ('/surat-jalan',      c.getSuratJalan);
// router.post  ('/surat-jalan',      c.createSuratJalan);
// router.patch ('/surat-jalan/:id',  c.updateSuratJalan);
// router.delete('/surat-jalan/:id',  c.deleteSuratJalan);

// module.exports = router;

// routes/dataentry.route.js

// routes/dataentry.route.js

// routes/dataentry.route.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dataentry.controller');

// ── Production ──────────────────────────────────────────
router.post('/production',    ctrl.saveProduction);
router.get ('/production',    ctrl.getProduction);
router.get ('/production/history', ctrl.getProductionHistory);

// ── Utility ─────────────────────────────────────────────
router.post('/utility',       ctrl.saveUtility);
router.get ('/utility',       ctrl.getUtility);

// ── Laboratorium ─────────────────────────────────────────
router.post('/laboratorium',  ctrl.saveLaboratorium);
router.get ('/laboratorium',  ctrl.getLaboratorium);

// ── Limbah ───────────────────────────────────────────────
router.post('/limbah',        ctrl.saveLimbah);
router.get ('/limbah',        ctrl.getLimbah);

// ── Laporan Harian ───────────────────────────────────────
router.post('/laporan',       ctrl.saveLaporan);
router.get ('/laporan',       ctrl.getLaporan);

module.exports = router;