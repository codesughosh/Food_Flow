const express = require("express");
const User = require("../models/User");
const createToken = require("../utils/createToken");
const { protect } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: user.addresses
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { fullName, email, phone, password, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash: await User.hashPassword(password),
      addresses: address ? [address] : []
    });

    res.status(201).json({
      user: publicUser(user),
      token: createToken(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      user: publicUser(user),
      token: createToken(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put("/me", protect, async (req, res, next) => {
  try {
    const { fullName, phone, address, password } = req.body;

    if (fullName !== undefined) req.user.fullName = fullName;
    if (phone !== undefined) req.user.phone = phone;
    if (address) req.user.addresses = [address];
    if (password) req.user.passwordHash = await User.hashPassword(password);

    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
