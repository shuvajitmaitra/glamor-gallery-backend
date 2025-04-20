// routes/product.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
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

module.exports = router;
