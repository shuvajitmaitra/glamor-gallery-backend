const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productCode: { type: String, required: true },
    action: { type: String, enum: ["in", "out"], required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      min: [0, "Current stock cannot be negative"], // Optional: Add validation
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);
