const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const auth = require("../middlewares/auth");

// Public endpoints
router.get("/", blogController.getBlogs);
router.get("/categories", blogController.getCategories);
router.get("/recent", blogController.getRecentBlogs);
router.get("/:id", blogController.getBlog);

// Admin endpoints (requires authentication)
router.post("/", auth, blogController.createBlog);
router.put("/:id", auth, blogController.updateBlog);
router.delete("/:id", auth, blogController.deleteBlog);

module.exports = router;
