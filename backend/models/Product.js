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

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  size: {
    type: String,
    trim: true,
  },
  fabric: {
    type: String,
    trim: true,
  },
  material: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  image: {
    type: String,
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
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
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, default: "cm" },
    },
    material: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    weightUnit: {
      type: String,
      default: "kg",
    },
    sizes: [sizeSchema],
    colors: [colorSchema],
    variants: [variantSchema],
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
    autoHideWhenOutOfStock: {
      type: Boolean,
      default: false,
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoKeywords: [String],
    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      unique: true,
      trim: true,
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
productSchema.index({ name: "text", description: "text", seoTitle: "text" });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });

// Pre-validate hook to clean up empty arrays, auto-generate slug if missing, and set blank unique fields
productSchema.pre("validate", function (next) {
  // Auto-generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${Math.random().toString(36).substring(2, 7)}`;
  }

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

  // Clean up variants array
  if (this.variants && Array.isArray(this.variants)) {
    this.variants = this.variants.filter(
      (item) => item && (item.sku || item.title || item.color || item.size)
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

  // Clean up seoKeywords array
  if (this.seoKeywords && Array.isArray(this.seoKeywords)) {
    this.seoKeywords = this.seoKeywords.filter((k) => typeof k === "string" && k.trim() !== "");
  }

  // Handle blank sku to prevent duplicate key errors with sparse unique index
  if (this.sku === "" || (typeof this.sku === "string" && this.sku.trim() === "")) {
    this.sku = undefined;
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);
