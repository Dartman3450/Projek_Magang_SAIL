// ═══════════════════════════════════════════════════════════
// dataentry.route.js
// Mount di server.js:
//   const deRoute = require('./routes/dataentry.route');
//   app.use('/api/dataentry', deRoute);
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const c       = require('../controllers/dataentryController');

router.use(express.json({ limit: '20mb' })); // foto base64 bisa besar

// ── Production ──────────────────────────────────────────────
router.get   ('/production',      c.getProduction);
router.post  ('/production',      c.createProduction);
router.delete('/production/:id',  c.deleteProduction);

// ── Laboratorium ────────────────────────────────────────────
router.get   ('/laboratorium',     c.getLaboratorium);
router.post  ('/laboratorium',     c.createLaboratorium);
router.delete('/laboratorium/:id', c.deleteLaboratorium);

// ── Utility ─────────────────────────────────────────────────
router.get   ('/utility',      c.getUtility);
router.post  ('/utility',      c.createUtility);
router.delete('/utility/:id',  c.deleteUtility);

// ── Limbah ──────────────────────────────────────────────────
router.get   ('/limbah',      c.getLimbah);
router.post  ('/limbah',      c.createLimbah);
router.delete('/limbah/:id',  c.deleteLimbah);

// ── Laporan Harian ──────────────────────────────────────────
router.get   ('/laporan',      c.getLaporanHarian);
router.post  ('/laporan',      c.createLaporanHarian);
router.delete('/laporan/:id',  c.deleteLaporanHarian);

// ── Kartu Stok ──────────────────────────────────────────────
router.get   ('/kartu-stok',      c.getKartuStok);
router.post  ('/kartu-stok',      c.createKartuStok);
router.patch ('/kartu-stok/:id',  c.updateKartuStok);
router.delete('/kartu-stok/:id',  c.deleteKartuStok);

// ── Surat Jalan ─────────────────────────────────────────────
router.get   ('/surat-jalan',      c.getSuratJalan);
router.post  ('/surat-jalan',      c.createSuratJalan);
router.patch ('/surat-jalan/:id',  c.updateSuratJalan);
router.delete('/surat-jalan/:id',  c.deleteSuratJalan);

module.exports = router;
