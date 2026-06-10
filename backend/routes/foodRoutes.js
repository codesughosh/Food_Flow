const express = require("express");
const Food = require("../models/Food");
const Category = require("../models/Category");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function toClientFood(food) {
  return {
    id: food.slug,
    _id: food._id,
    name: food.name,
    category: food.category?.name || "",
    categoryId: food.category?._id,
    price: food.price,
    rating: food.rating,
    tag: food.tag,
    image: food.imageUrl,
    imageUrl: food.imageUrl,
    desc: food.description,
    description: food.description,
    nutrition: food.nutrition,
    ingredients: food.ingredients,
    isAvailable: food.isAvailable
  };
}

router.get("/", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.available !== "false") query.isAvailable = true;

    if (req.query.category) {
      const category = await Category.findOne({ name: req.query.category });
      if (category) query.category = category._id;
    }

    const foods = await Food.find(query).populate("category").sort({ createdAt: -1 });
    res.json(foods.map(toClientFood));
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const food = await Food.findOne({ slug: req.params.slug }).populate("category");
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json(toClientFood(food));
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, adminOnly, async (req, res, next) => {
  try {
    const food = await Food.create(req.body);
    const populated = await food.populate("category");
    res.status(201).json(toClientFood(populated));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate("category");
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json(toClientFood(food));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json({ message: "Food archived" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
