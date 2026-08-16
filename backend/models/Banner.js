const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Banner image is required"],
      trim: true,
    },
    mobileImage: {
      type: String,
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: "/shop",
    },
    buttonText: {
      type: String,
      trim: true,
      default: "BUY NOW",
    },
    position: {
      type: String,
      enum: ["hero", "featured_collection", "middle_banner", "popup"],
      default: "hero",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ position: 1, isActive: 1, displayOrder: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
