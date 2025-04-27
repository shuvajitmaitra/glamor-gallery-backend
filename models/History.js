const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false, // Changed to optional
      default: null, // Allow null to indicate no reference
    },
    productCode: {
      type: String,
      required: false, // Changed to optional
      default: "", // Allow empty string
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["in", "out"], required: true }, // Note: Consider removing as it's redundant
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    currentStock: {
      type: Number,
      required: true,
      min: [0, "Current stock cannot be negative"],
    },
  },
  { timestamps: true }
);

historySchema.index({ productId: 1 }); // Index for efficient queries

module.exports = mongoose.model("History", historySchema);
