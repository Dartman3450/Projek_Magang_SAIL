// routes/suratJalan.route.js
const express = require('express');
const router = express.Router();
const {
  getAllSuratJalan,
  createSuratJalan,
  updateSuratJalan,
  deleteSuratJalan,
  getAvailableItems,
  getBatchOptions,
} = require('../controllers/suratJalan.controller');

// ⚠️ IMPORTANT: Define specific routes BEFORE parameter routes!
// Otherwise /available-items will match /:id instead

// Available items (items yang belum dipake)
router.get('/available-items', getAvailableItems);

// Get batch options untuk item
router.get('/batches/:kartu_stok_id', getBatchOptions);

// Surat Jalan CRUD (parameter routes last)
router.get('/', getAllSuratJalan);
router.post('/', createSuratJalan);
router.put('/:id', updateSuratJalan);
router.delete('/:id', deleteSuratJalan);

module.exports = router;
