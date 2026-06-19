const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const reviewController = require("../controllers/reviewController");
const auth = require("../middlewares/auth");

// Public endpoints
router.get("/", productController.getProducts);
router.get("/categories", productController.getCategories);
router.get("/:id", productController.getProduct);

// Review endpoints
router.get("/:id/reviews", reviewController.getReviews);
router.post("/:id/reviews", auth, reviewController.addReview);

// Admin-ready endpoints (requires authentication)
router.post("/", auth, productController.createProduct);
router.put("/:id", auth, productController.updateProduct);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
