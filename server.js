const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./backend/config/db");
const errorHandler = require("./backend/middleware/errorHandler");

const app = express();
const port = process.env.PORT || 8080;

connectDB();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/health", require("./backend/routes/healthRoutes"));
app.use("/api/categories", require("./backend/routes/categoryRoutes"));
app.use("/api/foods", require("./backend/routes/foodRoutes"));
app.use("/api/auth", require("./backend/routes/authRoutes"));
app.use("/api/orders", require("./backend/routes/orderRoutes"));
app.use("/api/contact", require("./backend/routes/contactRoutes"));
app.use("/api/admin", require("./backend/routes/adminRoutes"));

app.use(express.static(path.join(__dirname)));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`FoodFlow Node server running at http://127.0.0.1:${port}`);
});
