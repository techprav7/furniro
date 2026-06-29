const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const sizeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const colorSchema = new mongoose.Schema({
  hex: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: true,
      enum: ["Living Room", "Bedroom", "Dining", "Office", "Outdoor"],
      trim: true,
    },
    image: {
      type: String,
      required: false,
      set: function (key) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dqtw7ofz2";
        if (!cloudName || !key) return key;
        if (key.startsWith("http://") || key.startsWith("https://")) return key;
        const cleanKey = key.startsWith("/") ? key.substring(1) : key;
        if (cleanKey.startsWith("images/") || cleanKey.startsWith("src/assets/")) {
          return key;
        }
        return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanKey}`;
      }
    },
    images: {
      type: [String],
      set: function (keys) {
        if (!keys || !Array.isArray(keys)) return keys;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dqtw7ofz2";
        if (!cloudName) return keys;
        return keys.map(key => {
          if (!key) return key;
          if (key.startsWith("http://") || key.startsWith("https://")) return key;
          const cleanKey = key.startsWith("/") ? key.substring(1) : key;
          if (cleanKey.startsWith("images/") || cleanKey.startsWith("src/assets/")) {
            return key;
          }
          return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanKey}`;
        });
      }
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizes: [sizeSchema],
    colors: [colorSchema],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Recalculate rating and reviewCount from reviews array
productSchema.methods.recalculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
  } else {
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
};

// Index for search and filtering
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

// Pre-validate hook to clean up empty arrays and set blank unique fields to undefined
productSchema.pre("validate", function (next) {
  // Clean up sizes array
  if (this.sizes && Array.isArray(this.sizes)) {
    this.sizes = this.sizes.filter(
      (item) => item && typeof item.label === "string" && item.label.trim() !== ""
    );
  }

  // Clean up colors array
  if (this.colors && Array.isArray(this.colors)) {
    this.colors = this.colors.filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        typeof item.hex === "string" &&
        item.hex.trim() !== ""
    );
  }

  // Clean up tags array
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags.filter((t) => typeof t === "string" && t.trim() !== "");
  }

  // Clean up images array
  if (this.images && Array.isArray(this.images)) {
    this.images = this.images.filter((img) => typeof img === "string" && img.trim() !== "");
  }

  // Handle blank sku to prevent duplicate key errors with sparse unique index
  if (this.sku === "" || (typeof this.sku === "string" && this.sku.trim() === "")) {
    this.sku = undefined;
  }

  next();
});


module.exports = mongoose.model("Product", productSchema);
