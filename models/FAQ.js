const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQ", faqSchema);
