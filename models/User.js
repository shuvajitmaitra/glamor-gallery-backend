const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {
    name: { type: String,
      trim: true,
      unique: true,
      required: true
},
    email: { type: String, required: true, unique: true, trim: true, lowercase: true  },
    password: { type: String, required: true, trim: true,  },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
