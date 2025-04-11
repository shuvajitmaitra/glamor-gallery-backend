// // index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/product");

dotenv.config();
const app = express();

// Add CORS middleware before other middleware and routes
app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    credentials: true,
  })
);

app.use(express.json());

// // Health Check Route
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     status: "OK",
//     message: "Server is running",
//     timestamp: new Date().toISOString(),
//   });
// });

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/product", productRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => res.send("Hello from Vercel!"));
module.exports = app;
