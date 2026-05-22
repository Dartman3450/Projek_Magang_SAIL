// routes/receipts.route.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/receipts.controller');

router.get   ('/',    ctrl.getReceipts);
router.get   ('/:id', ctrl.getReceiptById);
router.post  ('/',    ctrl.createReceipt);
router.put   ('/:id', ctrl.updateReceipt);
router.delete('/:id', ctrl.deleteReceipt);

module.exports = router;
