const express = require("express");
const Food = require("../models/Food");
const Category = require("../models/Category");
const User = require("../models/User");
const Order = require("../models/Order");
const ContactMessage = require("../models/ContactMessage");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect, adminOnly);

const STATUS_PROGRESS = {
  Preparing: 25,
  Cooking: 55,
  Ready: 85,
  Completed: 100,
  Delivered: 100,
  Cancelled: 0
};

router.get("/summary", async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [
      recentOrders,
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      customers,
      foods,
      categories,
      contacts,
      revenueRows
    ] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).limit(25),
      Order.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: start } }),
      Order.countDocuments({ status: { $in: ["Preparing", "Cooking", "Ready"] } }),
      Order.countDocuments({ status: { $in: ["Completed", "Delivered"] } }),
      User.countDocuments({ role: "customer" }),
      Food.countDocuments({ isAvailable: true }),
      Category.countDocuments({ isActive: true }),
      ContactMessage.countDocuments({ status: "new" }),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ])
    ]);

    const revenue = revenueRows[0]?.total || 0;

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        revenue,
        pendingOrders,
        completedOrders,
        customers,
        foods,
        categories,
        contacts
      },
      recentOrders,
      todayOrders: recentOrders
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!Object.prototype.hasOwnProperty.call(STATUS_PROGRESS, status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const update = {
      status,
      progress: STATUS_PROGRESS[status]
    };
    if (["Completed", "Delivered", "Cancelled"].includes(status)) update.estimatedMinutes = 0;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
