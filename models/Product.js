// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, unique: true },
    available: { type: Boolean, default: true },
    availableSize: [{ type: String }],
    productName: { type: String, required: true },
    productImage: [{ type: String }],
    buyPrice: { type: Number, required: true },
    askingPrice: { type: Number },
    sellingPrice: { type: Number },
    stock: { type: Number, default: 0 },
    category: { type: String, required: true },
    description: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
