const categories = [
  {
    name: "Biryani",
    description: "Layered rice meals, dum cooked with spices and herbs.",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "North Indian",
    description: "Creamy curries, tandoor favourites, and rich gravies.",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Vegetarian",
    description: "Paneer, dal, sabzi, and hearty vegetarian plates.",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "South Indian",
    description: "Dosa, idli, sambar, chutney, and crisp tiffin favourites.",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Street Food",
    description: "Chaat, chole, bhature, rolls, and quick Indian bites.",
    imageUrl: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Thali",
    description: "Complete Indian meals with roti, rice, curry, dal, and sweet.",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Desserts",
    description: "Classic Indian sweets and festive desserts.",
    imageUrl: "https://images.unsplash.com/photo-1605197183305-6f87a6b42536?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Beverages",
    description: "Lassi, chaas, masala chai, and coolers.",
    imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=80"
  }
];

const foods = [
  {
    slug: "hyderabadi-biryani",
    name: "Hyderabadi Dum Biryani",
    categoryName: "Biryani",
    price: 289,
    rating: 4.9,
    tag: "Best Seller",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=900&q=80",
    description: "Fragrant basmati rice layered with tender chicken, saffron, mint, fried onions, and slow-cooked dum masala.",
    nutrition: "780 kcal | 38g protein | 28g fat",
    ingredients: ["Basmati rice", "Chicken", "Saffron", "Mint", "Biryani masala"]
  },
  {
    slug: "butter-chicken",
    name: "Delhi Butter Chicken",
    categoryName: "North Indian",
    price: 329,
    rating: 4.8,
    tag: "Chef Pick",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
    description: "Tandoori chicken simmered in a creamy tomato-makhani gravy with kasuri methi and butter.",
    nutrition: "690 kcal | 42g protein | 36g fat",
    ingredients: ["Chicken tikka", "Tomato", "Butter", "Cream", "Kasuri methi"]
  },
  {
    slug: "paneer-tikka",
    name: "Paneer Tikka Masala",
    categoryName: "Vegetarian",
    price: 249,
    rating: 4.7,
    tag: "Veg Favorite",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80",
    description: "Charred paneer cubes tossed in smoky onion-tomato masala with capsicum and fresh coriander.",
    nutrition: "540 kcal | 24g protein | 30g fat",
    ingredients: ["Paneer", "Capsicum", "Tomato", "Onion", "Tikka masala"]
  },
  {
    slug: "masala-dosa",
    name: "Mysore Masala Dosa",
    categoryName: "South Indian",
    price: 149,
    rating: 4.8,
    tag: "Crispy",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
    description: "Golden dosa spread with red chutney and stuffed with spiced potato masala, served with sambar.",
    nutrition: "430 kcal | 12g protein | 14g fat",
    ingredients: ["Rice batter", "Potato", "Red chutney", "Sambar", "Coconut chutney"]
  },
  {
    slug: "chole-bhature",
    name: "Punjabi Chole Bhature",
    categoryName: "Street Food",
    price: 179,
    rating: 4.7,
    tag: "Spicy",
    imageUrl: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=900&q=80",
    description: "Slow-cooked chickpeas with fluffy bhature, pickled onions, green chilli, and tangy achar.",
    nutrition: "720 kcal | 22g protein | 26g fat",
    ingredients: ["Chickpeas", "Bhature", "Amchur", "Onion", "Green chilli"]
  },
  {
    slug: "royal-thali",
    name: "Royal Veg Thali",
    categoryName: "Thali",
    price: 349,
    rating: 4.9,
    tag: "Complete Meal",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
    description: "A generous Indian thali with dal, sabzi, paneer curry, rice, roti, raita, pickle, and sweet.",
    nutrition: "940 kcal | 30g protein | 32g fat",
    ingredients: ["Dal", "Paneer", "Seasonal sabzi", "Roti", "Rice"]
  },
  {
    slug: "gulab-jamun",
    name: "Gulab Jamun Bowl",
    categoryName: "Desserts",
    price: 99,
    rating: 4.6,
    tag: "Sweet",
    imageUrl: "https://images.unsplash.com/photo-1605197183305-6f87a6b42536?auto=format&fit=crop&w=900&q=80",
    description: "Soft khoya dumplings soaked in cardamom syrup and finished with pistachio slivers.",
    nutrition: "360 kcal | 7g protein | 16g fat",
    ingredients: ["Khoya", "Cardamom", "Sugar syrup", "Pistachio", "Ghee"]
  },
  {
    slug: "mango-lassi",
    name: "Mango Lassi",
    categoryName: "Beverages",
    price: 89,
    rating: 4.5,
    tag: "Fresh",
    imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=80",
    description: "Thick curd blended with Alphonso mango, cardamom, and a light saffron finish.",
    nutrition: "220 kcal | 8g protein | 5g fat",
    ingredients: ["Curd", "Mango", "Cardamom", "Saffron", "Honey"]
  }
];

module.exports = { categories, foods };
