// index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");

dotenv.config();
const app = express();

// Add CORS middleware before other middleware and routes
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5174", // Replace with your frontend URL
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);

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

// const data = {
//   available: boolean,
//   availableSize: ["data1", "data2"], // array of string
//   productName: string,
//   productImage: ["image1", "image2"], // array of string
//   buyPrice: number,
//   askingPrice: number,
//   sellingPrice: number,
//   stock: number,
//   category: string,
// };
