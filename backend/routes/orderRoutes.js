const express = require("express");
const Food = require("../models/Food");
const Order = require("../models/Order");
const { protect, optionalAuth } = require("../middleware/auth");
const {
  ACTIVE_STATUSES,
  buildQueueSnapshot,
  estimatePrepMinutes
} = require("../utils/queue");

const router = express.Router();

function createOrderNumber() {
  return `FF-${Math.floor(100000 + Math.random() * 900000)}`;
}

function createQueueNumber() {
  return `Q-${Math.floor(20 + Math.random() * 80)}`;
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  return {
    subtotal,
    deliveryFee,
    tax,
    total: subtotal + deliveryFee + tax
  };
}

router.get("/", protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    const activeOrders = await Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 });
    res.json(orders.map(order => ({
      ...order.toObject(),
      queue: buildQueueSnapshot(order, activeOrders)
    })));
  } catch (error) {
    next(error);
  }
});

router.get("/:orderNumber", async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const activeOrders = await Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 });
    const queue = buildQueueSnapshot(order, activeOrders);

    if (order.status !== queue.status || order.progress !== queue.progress || order.estimatedMinutes !== queue.estimatedMinutes) {
      order.status = queue.status;
      order.progress = queue.progress;
      order.estimatedMinutes = queue.estimatedMinutes;
      await order.save();
    }

    res.json({
      ...order.toObject(),
      queue
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { cartItems, deliveryAddress, paymentMethod } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    const slugs = cartItems.map(item => item.id);
    const foods = await Food.find({ slug: { $in: slugs }, isAvailable: true });
    const foodMap = new Map(foods.map(food => [food.slug, food]));

    const items = cartItems.map(item => {
      const food = foodMap.get(item.id);
      if (!food) throw Object.assign(new Error(`Food unavailable: ${item.id}`), { statusCode: 400 });
      return {
        food: food._id,
        name: food.name,
        price: food.price,
        quantity: Math.max(1, Number(item.qty || item.quantity || 1)),
        imageUrl: food.imageUrl
      };
    });

    const totals = calculateTotals(items);
    const prepMinutes = estimatePrepMinutes(items);
    const order = await Order.create({
      user: req.user?._id || null,
      orderNumber: createOrderNumber(),
      queueNumber: createQueueNumber(),
      items,
      ...totals,
      paymentMethod: paymentMethod || "UPI on delivery",
      deliveryAddress,
      prepMinutes,
      estimatedMinutes: prepMinutes,
      progress: 5
    });

    const activeOrders = await Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 });
    const queue = buildQueueSnapshot(order, activeOrders);
    order.status = queue.status;
    order.progress = queue.progress;
    order.estimatedMinutes = queue.estimatedMinutes;
    await order.save();

    res.status(201).json({
      ...order.toObject(),
      queue,
      userLinked: Boolean(req.user)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
