const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/uploadController");

// Use multer memory storage to keep files in memory as buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST /api/upload - uploads an image
router.post("/", upload.single("file"), uploadController.uploadImage);

// DELETE /api/upload - deletes an image
router.delete("/", uploadController.deleteImage);

module.exports = router;
