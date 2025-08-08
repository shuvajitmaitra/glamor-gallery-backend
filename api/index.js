const { app, connectDB } = require("../index");

// Connect to MongoDB before handling requests
module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
