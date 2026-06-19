const Payment = require("../models/Payment");

// GET /api/payments/history — Get payment history for authenticated user
exports.getPaymentHistory = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const payments = await Payment.find({ clerkUserId })
      .sort({ createdAt: -1 })
      .populate("orderId", "razorpayOrderId status items totalAmount")
      .lean();

    res.json({ success: true, payments });
  } catch (error) {
    console.error("GetPaymentHistory error:", error);
    res.status(500).json({ message: "Server error retrieving payment history" });
  }
};

// GET /api/payments/:id — Get single payment detail
exports.getPaymentDetail = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      clerkUserId,
    })
      .populate("orderId", "razorpayOrderId status items totalAmount shippingAddress")
      .lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("GetPaymentDetail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/payments/methods — Get available payment options from Razorpay (or mock options)
exports.getPaymentMethods = async (req, res) => {
  try {
    res.json({
      success: true,
      defaultMethod: {
        id: "default_card",
        type: "card",
        name: "Visa Ending in 4321",
        cardLast4: "4321",
        expiry: "12/28",
        brand: "visa"
      },
      savedMethods: [
        {
          id: "saved_upi",
          type: "upi",
          name: "Google Pay (UPI)",
          vpa: "praveen@okaxis"
        },
        {
          id: "saved_card_2",
          type: "card",
          name: "Mastercard Ending in 5678",
          cardLast4: "5678",
          expiry: "09/30",
          brand: "mastercard"
        }
      ],
      availableOptions: {
        card: true,
        upi: true,
        netbanking: true,
        wallet: true
      }
    });
  } catch (error) {
    console.error("getPaymentMethods error:", error);
    res.status(500).json({ message: "Server error fetching payment options" });
  }
};

