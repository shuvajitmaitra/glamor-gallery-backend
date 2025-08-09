const User = require("../models/User"); // Assuming User model is in models folder

const adminCheck = async (req, res, next) => {
  try {
    // Extract userId from headers
    const userId = req.headers.userid;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required in headers",
      });
    }

    // Find user in database
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user is admin
    if (user.role === "admin") {
      req.user = user; // Optional: attach user to request object for downstream use
      return next();
    }

    // User is not admin
    return res.status(403).json({
      success: false,
      error: "Unauthorized: Admin access required",
    });
  } catch (error) {
    console.error("Admin check middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = adminCheck;
