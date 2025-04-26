// routes/product.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const History = require("../models/History");
const authMiddleware = require("../middlewares/authMiddleware");

// Create product
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const product = new Product({ ...req.body, addedBy: req.userId });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit product
router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product: updatedProduct });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete product
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const mongoose = require("mongoose");

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
          action,
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
module.exports = router;
