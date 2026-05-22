// routes/kartuStok.route.js
const express = require('express');
const router  = express.Router();
const {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  createTxn, updateTxn, deleteTxn, toggleFinished,
  getAllLocations, createLocation, deleteLocation,
} = require('../controllers/kartuStok.controller');

// Products
router.get('/',           getAllProducts);
router.post('/',          createProduct);
router.put('/:id',        updateProduct);
router.delete('/:id',     deleteProduct);
router.put('/:id/toggle-finished', toggleFinished);

// Transaksi per produk
router.post('/:id/transaksi',              createTxn);
router.put('/:id/transaksi/:txnId',        updateTxn);
router.delete('/:id/transaksi/:txnId',     deleteTxn);

// Locations
router.get('/locations/all',         getAllLocations);
router.post('/locations/add',        createLocation);
router.delete('/locations/:nama_lokasi', deleteLocation);

module.exports = router;