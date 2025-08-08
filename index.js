const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
const productRoutes = require("./routes/product.js");

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in .env file");
  process.exit(1);
}

const app = express();

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins for testing (local and Vercel)
    credentials: true,
    allowedHeaders: ["Content-Type", "userId", "user-id"],
  })
);

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongoConnectionState: mongoose.connection.readyState,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);

// Export for serverless (Vercel) and local use
module.exports = { app, connectDB };

// Start server for local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 9000;
  const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  };
  startServer();
}
