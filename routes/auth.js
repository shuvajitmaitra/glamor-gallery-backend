const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Added for password hashing

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    console.log("Incoming headers:", req.headers); // Debug log for headers
    const adminId = req.headers["userid"] || req.headers["userId"] || req.headers["UserId"];
    if (!adminId) {
      console.log("userId header missing");
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }
    // Validate MongoDB ObjectId
    if (!adminId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid Admin ID format" });
    }
    const user = await User.findById(adminId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }
    req.adminId = adminId; // Store adminId for use in routes
    next();
  } catch (error) {
    console.error("isAdmin Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Register user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password, and name are required" });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    // Validate password strength (e.g., min 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({ email, password: hashedPassword, name, role: "user" });
    await user.save();

    return res.status(201).json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const userData = { name: user.name, email: user.email, _id: user._id, role: user.role };
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: "Email and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (excluding the requesting admin)
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.adminId } }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user role
router.put("/users/role", isAdmin, async (req, res) => {
  const { role, userId } = req.body;
  if (!["user", "admin", "seller"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role. Must be user, admin, or seller." });
  }
  if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.adminId) {
      return res.status(403).json({ success: false, message: "Cannot modify own role" });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: "User role updated successfully" });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete("/users/delete", isAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: "Invalid user ID format" });
  }

  try {
    if (userId === req.adminId) {
      return res.status(403).json({ success: false, message: "Cannot delete yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
