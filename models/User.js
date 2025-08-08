const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin", "seller"], default: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
