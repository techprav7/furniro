const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middlewares/auth");

router.get("/history", auth, paymentController.getPaymentHistory);
router.get("/methods", auth, paymentController.getPaymentMethods);
router.get("/:id", auth, paymentController.getPaymentDetail);

module.exports = router;
