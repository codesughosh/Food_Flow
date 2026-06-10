const express = require("express");
const Food = require("../models/Food");
const Category = require("../models/Category");
const User = require("../models/User");
const Order = require("../models/Order");
const ContactMessage = require("../models/ContactMessage");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/summary", async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, completedOrders, customers, foods, categories, contacts] = await Promise.all([
      Order.find({ createdAt: { $gte: start } }).sort({ createdAt: -1 }).limit(10),
      Order.countDocuments({ status: { $in: ["Preparing", "Cooking", "Ready"] } }),
      Order.countDocuments({ status: { $in: ["Completed", "Delivered"] } }),
      User.countDocuments({ role: "customer" }),
      Food.countDocuments({ isAvailable: true }),
      Category.countDocuments({ isActive: true }),
      ContactMessage.countDocuments({ status: "new" })
    ]);

    const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      stats: {
        todayOrders: todayOrders.length,
        revenue,
        pendingOrders,
        completedOrders,
        customers,
        foods,
        categories,
        contacts
      },
      todayOrders
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, progress: req.body.progress },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
