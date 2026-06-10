const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Category = require("../models/Category");
const Food = require("../models/Food");
const User = require("../models/User");
const { categories, foods } = require("./menuData");

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodflow";
  await mongoose.connect(uri);

  await Promise.all([
    Category.deleteMany({}),
    Food.deleteMany({}),
    User.deleteMany({})
  ]);

  const createdCategories = await Category.insertMany(categories);
  const categoryByName = new Map(createdCategories.map(category => [category.name, category._id]));

  await Food.insertMany(foods.map(food => ({
    ...food,
    category: categoryByName.get(food.categoryName),
    categoryName: undefined
  })));

  await User.create({
    fullName: "FoodFlow Admin",
    email: "admin@foodflow.in",
    phone: "+91 98765 43210",
    passwordHash: await bcrypt.hash("Admin@123", 12),
    role: "admin",
    addresses: [{
      label: "Office",
      line1: "12 Spice Street, Indiranagar",
      city: "Bengaluru",
      pincode: "560038"
    }]
  });

  console.log("Seeded MongoDB with Indian FoodFlow data");
  console.log("Admin login: admin@foodflow.in / Admin@123");
  await mongoose.disconnect();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
