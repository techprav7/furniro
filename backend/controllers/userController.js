const User = require("../models/User");

// GET /api/users/profile
exports.getUserProfile = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    let user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      // If user isn't synced yet, create a default user record
      user = await User.findOneAndUpdate(
        { clerkId: clerkUserId },
        {
          clerkId: clerkUserId,
          email: "user@example.com",
          name: "Clerk User",
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ message: "Server error retrieving user profile" });
  }
};

// PUT /api/users/profile
exports.updateUserProfileAddress = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const { defaultAddress, defaultBillingAddress } = req.body;

    let user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      user = new User({
        clerkId: clerkUserId,
        email: "user@example.com",
        name: "Clerk User",
      });
    }

    if (defaultAddress) {
      user.defaultAddress = { ...user.defaultAddress, ...defaultAddress };
    }
    if (defaultBillingAddress) {
      user.defaultBillingAddress = { ...user.defaultBillingAddress, ...defaultBillingAddress };
    }

    await user.save();

    res.json({ success: true, message: "Address updated successfully", user });
  } catch (error) {
    console.error("updateUserProfileAddress error:", error);
    res.status(500).json({ message: "Server error updating address details" });
  }
};
