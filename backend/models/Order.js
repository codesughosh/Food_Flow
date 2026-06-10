const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    default: ""
  }
}, { _id: false });

const deliveryAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  line1: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  queueNumber: {
    type: String,
    required: true
  },
  items: {
    type: [orderItemSchema],
    validate: value => value.length > 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ["UPI on delivery", "Cash on delivery", "Card on delivery"],
    default: "UPI on delivery"
  },
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: true
  },
  status: {
    type: String,
    enum: ["Preparing", "Cooking", "Ready", "Completed", "Delivered", "Cancelled"],
    default: "Preparing"
  },
  progress: {
    type: Number,
    default: 25,
    min: 0,
    max: 100
  },
  prepMinutes: {
    type: Number,
    default: 20,
    min: 1
  },
  estimatedMinutes: {
    type: Number,
    default: 20,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
