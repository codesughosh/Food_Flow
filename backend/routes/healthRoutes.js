const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "FoodFlow API",
    database: "MongoDB"
  });
});

module.exports = router;
