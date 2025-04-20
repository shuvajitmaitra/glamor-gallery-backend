// index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
const productRoutes = require("./routes/product.js");
const historyRoutes = require("./routes/history.js");

dotenv.config();
const app = express();

// Mongoose connection utility
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Add CORS middleware before other middleware and routes
app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    credentials: true,
  })
);

app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongoConnectionState: mongoose.connection.readyState,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/history", historyRoutes);

const PORT = process.env.PORT || 5000;

// Export a function for serverless deployment
module.exports = async (req, res) => {
  await connectDB();

  // Handle the request
  if (req.method === "GET" && req.url === "/health") {
    res.status(200).json({
      status: "OK",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      mongoConnectionState: mongoose.connection.readyState,
    });
  } else {
    app(req, res);
  }
};
