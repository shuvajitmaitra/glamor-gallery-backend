// routes/product.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const History = require("../models/History");
const authMiddleware = require("../middlewares/authMiddleware");
const mongoose = require("mongoose");

// Create product
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { productImage, ...otherFields } = req.body;

    // Parse productImage if it's a stringified array
    let parsedProductImage = productImage;
    if (typeof productImage === "string") {
      try {
        parsedProductImage = JSON.parse(productImage);
        if (!Array.isArray(parsedProductImage)) {
          throw new Error("productImage must be an array");
        }
        // Ensure each element is a string
        if (!parsedProductImage.every((item) => typeof item === "string")) {
          throw new Error("All productImage entries must be strings");
        }
      } catch (parseError) {
        return res.status(400).json({ success: false, error: "Invalid productImage format" });
      }
    } else if (productImage && !Array.isArray(productImage)) {
      return res.status(400).json({ success: false, error: "productImage must be an array" });
    }

    // Create product with parsed data
    const product = new Product({
      ...otherFields,
      productImage: parsedProductImage || [], // Default to empty array if undefined
      addedBy: req.userId,
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get product by ID
router.get("/product/details/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit product
router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    // Update product with validation
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    // Check if product exists
    if (!updatedProduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Send success response
    res.status(200).json({ success: true, product: updatedProduct });
  } catch (err) {
    // Log error for debugging
    console.error("Error updating product:", err);

    // Send detailed error response
    res.status(400).json({ success: false, error: err.message || "Failed to update product" });
  }
});

// Delete product
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Use a transaction to delete product and update history
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Delete the product
        await Product.findByIdAndDelete(req.params.id, { session });

        // Update history records to set productId to null and productCode to ""
        await History.updateMany({ productId: req.params.id }, { $set: { productId: null, productCode: "" } }, { session });
      });

      res.json({ success: true, message: "Product deleted and history references updated" });
    } finally {
      session.endSession();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update stock
router.put("/stock/:id", authMiddleware, async (req, res) => {
  try {
    const { action, quantity, note } = req.body;

    // Validate request body
    if (!["in", "out"].includes(action)) {
      return res.status(400).json({ success: false, error: "Action must be 'in' or 'out'" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
    }
    if (note && typeof note !== "string") {
      return res.status(400).json({ success: false, error: "Note must be a string" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Calculate new stock
    const stockChange = action === "in" ? quantity : -quantity;
    const newStock = product.stock + stockChange;

    // Prevent negative stock
    if (newStock < 0) {
      return res.status(400).json({ success: false, error: "Insufficient stock" });
    }

    // Update product and create history in a transaction
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Update product stock
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { $inc: { stock: stockChange } }, { new: true, session });

        // Create history record
        const history = new History({
          productId: req.params.id,
          productCode: updatedProduct.productCode,
          type: action,
          userId: req.userId,
          quantity,
          note: note || "", // Use provided note or default to empty string
          currentStock: updatedProduct.stock,
        });
        await history.save({ session });
      });

      // Fetch updated product to return
      const updatedProduct = await Product.findById(req.params.id).session(null);
      res.json({ success: true, product: updatedProduct });
    } finally {
      session.endSession();
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await History.find().populate("userId", "name").sort({ createdAt: -1 });

    // Group history by type
    const stockIn = history.filter((item) => item.type === "in");
    const stockOut = history.filter((item) => item.type === "out");

    res.json({
      success: true,
      data: {
        stockIn,
        stockOut,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/history/delete/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the history record
    const history = await History.findById(id);
    if (!history) {
      return res.status(404).json({ success: false, error: "History record not found" });
    }

    // Find the corresponding product
    const product = await Product.findById(history.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Update product stock based on history type
    if (history.type === "in") {
      // Subtract quantity for "in" type
      if (product.stock < history.quantity) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete: Insufficient stock to subtract",
        });
      }
      product.stock -= history.quantity;
    } else if (history.type === "out") {
      // Add quantity for "out" type
      product.stock += history.quantity;
    }

    // Save the updated product
    await product.save();

    // Delete the history record
    await History.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "History record deleted and product stock updated",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
