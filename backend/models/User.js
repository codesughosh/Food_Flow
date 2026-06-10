const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true,
    default: "Home"
  },
  line1: {
    type: String,
    trim: true,
    default: ""
  },
  city: {
    type: String,
    trim: true,
    default: ""
  },
  pincode: {
    type: String,
    trim: true,
    default: ""
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  },
  addresses: {
    type: [addressSchema],
    default: []
  }
}, { timestamps: true });

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

module.exports = mongoose.model("User", userSchema);
