// routes/kartuStok.route.js
const express = require('express');
const router  = express.Router();
const {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  createTxn, updateTxn, deleteTxn,
} = require('../controllers/kartuStok.controller');

// Products
router.get('/',           getAllProducts);
router.post('/',          createProduct);
router.put('/:id',        updateProduct);
router.delete('/:id',     deleteProduct);

// Transaksi per produk
router.post('/:id/transaksi',              createTxn);
router.put('/:id/transaksi/:txnId',        updateTxn);
router.delete('/:id/transaksi/:txnId',     deleteTxn);

module.exports = router;
