const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, trim: true },
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }], // Store refresh tokens
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
