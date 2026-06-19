const Product = require("../models/Product");

// POST /api/products/:id/reviews — Add a review
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, userName } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (r) => r.clerkUserId === clerkUserId
    );
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    product.reviews.push({
      clerkUserId,
      userName: userName || "Anonymous",
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Recalculate rating
    product.recalculateRating();
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      rating: product.rating,
      reviewCount: product.reviewCount,
      review: product.reviews[product.reviews.length - 1],
    });
  } catch (error) {
    console.error("AddReview error:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/products/:id/reviews — Get all reviews for a product
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).select("reviews rating reviewCount").lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Sort reviews by newest first
    const sortedReviews = (product.reviews || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      reviews: sortedReviews,
      rating: product.rating,
      reviewCount: product.reviewCount,
    });
  } catch (error) {
    console.error("GetReviews error:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
