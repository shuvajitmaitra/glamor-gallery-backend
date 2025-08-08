const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, unique: true, trim: true },
    available: { type: Boolean, default: true },
    availableSize: [{ type: String, trim: true }],
    productName: { type: String, required: true, trim: true },
    productImage: [
      {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            // Allow empty strings or valid URLs
            return value === "" || /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(value);
          },
          message: "Invalid image URL at path {PATH}",
        },
      },
    ],
    ownerBuyPrice: { type: Number, required: true, min: 0 },
    b2bPrice: { type: Number, min: 0 },
    b2cPrice: { type: Number, min: 0 },
    maxSellingPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true },
    description: { type: String, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

productSchema.index({ productCode: 1 }); // Index for efficient queries

module.exports = mongoose.model("Product", productSchema);
