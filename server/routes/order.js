const express = require("express");
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  getReceivedOrders,
} = require("../controllers/orderController.js");
const {
  protect,
  admin,
  seller,
  user,
} = require("../middleware/authMiddleware.js");

router.route("/").post(protect, addOrderItems).get(protect, admin, getOrders);
router.route("/myorders").get(protect, user, getMyOrders);
router.route("/receivedOrders").get(protect, seller, getReceivedOrders);
router.route("/singelorder").post(protect, getOrderById);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);

module.exports = router;
