const express = require("express");
const router = express.Router();
const History = require("../models/History");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/auth"); // Assuming you have an auth middleware
const { body, validationResult } = require("express-validator");

// Create a history entry (called when stock is updated)
router.post(
  "/create",
  authMiddleware,
  [
    body("productId").isMongoId().withMessage("Invalid product ID"),
    body("type").isIn(["in", "out"]).withMessage("Type must be 'in' or 'out'"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("note").optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, type, quantity, note } = req.body;

    try {
      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Calculate new stock
      let newStock = product.stock;
      if (type === "in") {
        newStock += quantity;
      } else if (type === "out") {
        if (product.stock < quantity) {
          return res.status(400).json({ message: "Insufficient stock" });
        }
        newStock -= quantity;
      }

      // Update product stock
      product.stock = newStock;
      await product.save();

      // Create history entry
      const history = new History({
        productId,
        userId: req.user._id,
        type,
        quantity,
        note: note || "",
        currentStock: newStock,
      });

      await history.save();

      res.status(201).json({ message: "History entry created", history });
    } catch (error) {
      console.error("Error creating history entry:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get history for a specific product
router.get("/product/:productId", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.productId;
    const history = await History.find({ productId })
      .populate("productId", "productName productCode")
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all history entries (admin only)
router.get("/histories", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const history = await History.find(query)
      .populate("productId", "productName productCode")
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await History.countDocuments(query);

    res.status(200).json({
      history,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching all history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
