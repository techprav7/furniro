const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// We need raw body parsing for Clerk webhooks verification
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  webhookController.handleClerkWebhook
);

// We need raw body parsing for Razorpay webhooks verification
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  webhookController.handleRazorpayWebhook
);

module.exports = router;
