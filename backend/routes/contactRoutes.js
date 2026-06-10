const express = require("express");
const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const message = await ContactMessage.create(req.body);
    res.status(201).json({
      message: "Contact message received",
      id: message._id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
