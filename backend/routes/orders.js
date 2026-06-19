const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middlewares/auth");

// Secure endpoints with auth middleware
router.post("/create", auth, orderController.createOrder);
router.post("/verify", auth, orderController.verifyOrder);
router.post("/fail", auth, orderController.failOrder);
router.get("/my-orders", auth, orderController.getMyOrders);
router.get("/:id", auth, orderController.getOrderById);
router.put("/:id/cancel", auth, orderController.cancelOrder);
router.put("/:id/return", auth, orderController.returnOrder);
router.put("/:id/exchange", auth, orderController.exchangeOrder);
router.post("/:id/reorder", auth, orderController.reorder);

module.exports = router;
