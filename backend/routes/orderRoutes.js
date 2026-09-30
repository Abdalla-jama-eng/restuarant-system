const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  settlePayment,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrderById);
router.post('/:id/pay', settlePayment);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
