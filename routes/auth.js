const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password, and name are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }
    // Create new user
    const user = new User({ email, password, name, role: "user" });
    await user.save();

    return res.status(201).json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || req.body.password !== user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const userData = { name: user.name, email: user.email, _id: user._id, role: user.role };
    res.json({ success: true, user: { ...userData } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: "Email and new password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const adminId = req.headers.userId; // Check query first, then body
    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required", header: req.headers.userId });
    }
    const user = await User.findById(adminId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }
    req.adminId = adminId; // Store adminId for use in routes
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all users (excluding the requesting admin)
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.headers.userId } }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user role
router.put("/users/role", isAdmin, async (req, res) => {
  const { role, userId } = req.body;
  if (!["user", "admin", "seller"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role. Must be user, admin, or seller." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.headers.userId) {
      return res.status(403).json({ success: false, message: "Cannot modify own role" });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: "User role updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete("/users/delete", isAdmin, async (req, res) => {
  const { userId } = req.body;

  try {
    if (userId === req.headers.userId) {
      return res.status(403).json({ success: false, message: "Cannot delete yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
