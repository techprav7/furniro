const cloudinary = require("cloudinary").v2;

// Configure Cloudinary only if the environment variables exist
let isCloudinaryConfigured = false;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
} else {
  console.warn(
    "⚠️ Warning: Cloudinary is not configured. Uploads will fail. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env"
  );
}

/**
 * Upload an image buffer to Cloudinary
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        message: "Cloudinary credentials are not configured on the server.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Optional: read public_id from body
    // If public_id is provided, Cloudinary will store it with that path/id
    const options = {
      resource_type: "auto",
    };

    if (req.body.public_id) {
      options.public_id = req.body.public_id;
      // Overwrite if it exists
      options.overwrite = true;
      options.invalidate = true;
    } else {
      // If no public_id is specified, organize under a 'furnio' folder
      options.folder = "furnio";
    }

    // Upload buffer using upload_stream
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({
            message: "Failed to upload image to Cloudinary",
            error: error.message,
          });
        }
        res.status(200).json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an image from Cloudinary
 */
exports.deleteImage = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        message: "Cloudinary credentials are not configured on the server.",
      });
    }

    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "public_id is required." });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(500).json({
        message: "Failed to delete image from Cloudinary",
        result,
      });
    }

    res.status(200).json({
      message: "Image deleted successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
};
