const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    image: {
      type: String,
      required: [true, "Blog image is required"],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      default: "Admin",
      trim: true,
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ title: "text", excerpt: "text", content: "text" });
blogSchema.index({ category: 1 });
blogSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
