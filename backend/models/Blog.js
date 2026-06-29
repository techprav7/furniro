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
