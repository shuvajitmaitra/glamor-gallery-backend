// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  // console.log(first)
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  res.status(201).json({ success: true, message: "Account created successfully" });
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || req.body.password !== user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const userData = { name: user.name, email: user.email, _id: user._id };
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, user: { ...userData, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
