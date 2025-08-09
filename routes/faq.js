const express = require("express");
const router = express.Router();
const FAQ = require("../models/FAQ");
const adminCheck = require("../middlewares/adminCheck");

// Create FAQ
router.post("/create", adminCheck, async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    // Create new FAQ
    const faq = new FAQ({ title, description });
    await faq.save();

    return res.status(201).json({ success: true, message: "FAQ created successfully" });
  } catch (error) {
    console.error("FAQ creation error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get all FAQs
router.get("/all", async (req, res) => {
  try {
    const faqs = await FAQ.find();
    return res.status(200).json({ success: true, faqs });
  } catch (error) {
    console.error("FAQ retrieval error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update FAQ
router.put("/update/:id", adminCheck, async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    // Update FAQ
    const faq = await FAQ.findByIdAndUpdate(req.params.id, { title, description }, { new: true });
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    return res.status(200).json({ success: true, message: "FAQ updated successfully" });
  } catch (error) {
    console.error("FAQ update error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete FAQ
router.delete("/delete/:id", adminCheck, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    return res.status(200).json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("FAQ deletion error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
