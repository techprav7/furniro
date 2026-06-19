const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  companyName: { type: String, trim: true },
  country: { type: String, default: "India", trim: true },
  streetAddress: { type: String, trim: true },
  townCity: { type: String, trim: true },
  province: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  email: { type: String, trim: true }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    profileImageUrl: {
      type: String,
      trim: true,
    },
    defaultAddress: {
      type: addressSchema,
      default: () => ({})
    },
    defaultBillingAddress: {
      type: addressSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

