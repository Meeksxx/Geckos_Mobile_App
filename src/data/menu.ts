export type MenuCategoryId =
  | "appetizers"
  | "ensalada"
  | "lunch-specials"
  | "local-favorites"
  | "house-specialties"
  | "american-food"
  | "fajitas"
  | "nachos"
  | "dessert"
  | "kids"
  | "quesadillas"
  | "beverage";

export type MenuCategory = {
  id: MenuCategoryId;
  title: string;
};

export type MenuItem = {
  id: string;
  categoryId: MenuCategoryId;
  name: string;
  description?: string;
  price?: number;      // simple price
  priceText?: string;  // for small/large, chicken/beef, etc.
};


export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "appetizers", title: "Appetizers" },
  { id: "ensalada", title: "Ensalada" },
  { id: "lunch-specials", title: "Lunch Specials" },
  { id: "local-favorites", title: "Local Favorites" },
  { id: "house-specialties", title: "House Specialties" },
  { id: "american-food", title: "American Food" },
  { id: "fajitas", title: "Fajitas" },
  { id: "nachos", title: "Nachos" },
  { id: "dessert", title: "Dessert" },
  { id: "kids", title: "Kids" },
  { id: "quesadillas", title: "Quesadillas" },
  { id: "beverage", title: "Beverage" },
];



export const MENU_ITEMS: MenuItem[] = [
  {
    id: "yellow-queso",
    categoryId: "appetizers",
    name: "Yellow Queso",
    priceText: "Small 2.99 | Large 4.99",
  },
  {
    id: "white-queso",
    categoryId: "appetizers",
    name: "White Queso",
    priceText: "Small 4.99 | Large 9.99",
  },
  {
    id: "guacamole",
    categoryId: "appetizers",
    name: "Guacamole",
    priceText: "Small 2.79 | Large 4.99",
  },
  {
    id: "grilled-jalapeno",
    categoryId: "appetizers",
    name: "Grilled Jalapeño",
    price: 1.0,
  },
  {
    id: "sliced-avocado",
    categoryId: "appetizers",
    name: "Sliced Avocado",
    price: 3.99,
  },
  {
    id: "chile-con-queso-bowl",
    categoryId: "appetizers",
    name: "Chile con Queso Bowl",
    price: 6.99,
  },
  {
    id: "elote",
    categoryId: "appetizers",
    name: "Elote",
    description: "Mexican corn smothered in queso fresco, crema, lime & tajín.",
    price: 6.99,
  },
  {
    id: "layer-dip",
    categoryId: "appetizers",
    name: "Layer Dip",
    description:
      "Taco meat, refried beans, guacamole, sour cream, cheese, tomatoes, olives & cilantro.",
    price: 8.99,
  },
  {
    id: "chicken-flautas",
    categoryId: "appetizers",
    name: "Chicken Flautas",
    description:
      "Chicken rolled in corn tortillas, fried and served with guacamole & sour cream. Substitute beef +1.00.",
    price: 7.99,
  },
  {
    id: "mini-tacos",
    categoryId: "appetizers",
    name: "Mini Tacos",
    description: "8 mini tacos served with yellow queso.",
    price: 7.99,
  },
  {
    id: "empanadas",
    categoryId: "appetizers",
    name: "Empanadas",
    description:
      "Chicken rojo stuffed in a fried pastry shell, served with yellow queso.",
    priceText: "4 for 8.99 | 6 for 12.99",
  },
  {
    id: "picosos",
    categoryId: "appetizers",
    name: "Picosos",
    description:
      "Stuffed chicken jalapeños with cheese, served with yellow queso.",
    price: 9.99,
  },
  {
    id: "party-platter",
    categoryId: "appetizers",
    name: "Party Platter",
    description:
      "2 chicken flautas, 2 picosos, cheese quesadilla, bean nachos & queso.",
    price: 13.99,
  },
  {
    id: "loaded-fries",
    categoryId: "appetizers",
    name: "Loaded Fries",
    description:
      "Smoked pulled pork, white queso, jalapeños & pico de gallo.",
    price: 13.99,
  },
  {
    id: "party-pork-nachos",
    categoryId: "appetizers",
    name: "Party Pork Nachos",
    description:
      "Fresh-made chips topped with smoked pork, white queso, jalapeños & pico de gallo.",
    price: 13.99,
  },
// =====================
// ENSALADA
// =====================
  {
  id: "taco-salad",
  categoryId: "ensalada",
  name: "Taco Salad",
  description:
    "Lettuce, taco meat, cheese, tomatoes & black olives in a crispy tortilla bowl.",
  price: 11.99,
},
{
  id: "chicken-fajita-salad",
  categoryId: "ensalada",
  name: "Chicken Fajita Salad",
  description:
    "Lettuce, cheese, tomatoes & black olives in a crispy tortilla bowl with guacamole & sour cream.",
  priceText: "Chicken 11.99 | Beef 13.99",
},
{
  id: "crispy-chicken-salad",
  categoryId: "ensalada",
  name: "Crispy Chicken Salad",
  description:
    "Lettuce, crispy chicken, bacon, Monterey Jack cheese & tomatoes, served with house-made ranch.",
  price: 11.99,
},
{
  id: "empanada-salad",
  categoryId: "ensalada",
  name: "Empanada Salad",
  description:
    "Lettuce, spinach, tomato, avocado & cheese topped with 3 empanadas.",
  price: 14.99,
},

// =====================
// LUNCH SPECIALS
// =====================
{
  id: "lunch-one",
  categoryId: "lunch-specials",
  name: "Lunch Special – Choose One",
  description:
    "Served with rice & refried beans. Available before 2PM.",
  priceText: "Before 2PM 6.25 | After 2PM & Sat 7.00",
},
{
  id: "lunch-two",
  categoryId: "lunch-specials",
  name: "Lunch Special – Choose Two",
  description:
    "Served with rice & refried beans. Available before 2PM.",
  priceText: "Before 2PM 7.75 | After 2PM & Sat 8.50",
},
{
  id: "lunch-three",
  categoryId: "lunch-specials",
  name: "Lunch Special – Choose Three",
  description:
    "Served with rice & refried beans. Available before 2PM.",
  priceText: "Before 2PM 9.00 | After 2PM & Sat 9.99",
},
// =====================
// HOUSE SPECIALTIES
// =====================
{
  id: "pollo-sabroso",
  categoryId: "house-specialties",
  name: "Pollo Sabroso",
  description:
    "Chicken breast with Monterey Jack cheese, sour cream sauce. Served with rice, guacamole, pico de gallo & 3 tortillas.",
  price: 14.99,
},
{
  id: "cozumel",
  categoryId: "house-specialties",
  name: "Cozumel",
  description:
    "Three flour tortillas filled with shredded chicken, pico de gallo & sliced avocado. Served with rice & charro beans.",
  price: 13.99,
},
{
  id: "dona-lola",
  categoryId: "house-specialties",
  name: "Doña Lola",
  description:
    "Chicken breast topped with cheese, sautéed mushrooms, onions, bell peppers & poblano peppers. Served with rice, charro beans & 3 tortillas.",
  price: 14.99,
},
{
  id: "lupitas",
  categoryId: "house-specialties",
  name: "Lupitas",
  description:
    "One chile relleno topped with ranchero sauce, one chicken enchilada topped with sour cream sauce, and one crispy taco. Served with rice & refried beans.",
  price: 14.99,
},
{
  id: "el-grande",
  categoryId: "house-specialties",
  name: "El Grande",
  description:
    "One cheese enchilada topped with chili, one chicken enchilada with sour cream sauce, one crispy taco & one bean tostada. Served with rice & refried beans.",
  price: 15.99,
},
{
  id: "fiesta",
  categoryId: "house-specialties",
  name: "Fiesta",
  description:
    "One chicken enchilada topped with sour cream sauce, one beef enchilada topped with queso, one cheese enchilada topped with chili, and one crispy taco. Served with rice & refried beans.",
  price: 13.99,
},
{
  id: "grilled-shrimp",
  categoryId: "house-specialties",
  name: "Grilled Shrimp",
  description:
    "Six large shrimp on a bed of onions & peppers, served with rice, salad & avocado slices.",
  price: 15.99,
},
// =====================
// LOCAL FAVORITES
// =====================
{
  id: "bowl",
  categoryId: "local-favorites",
  name: "Bowl",
  description:
    "Chicken or beef on a bed of rice, topped with queso. Substitute white queso +0.50.",
  priceText: "Chicken 11.99 | Beef 12.99",
},
{
  id: "avocado-bowl",
  categoryId: "local-favorites",
  name: "Avocado Bowl",
  description:
    "Two avocado halves filled with ground beef & rice, topped with yellow queso. Substitute white queso +0.50.",
  price: 11.99,
},
{
  id: "super-burrito",
  categoryId: "local-favorites",
  name: "Super Burrito",
  description:
    "A 12\" flour tortilla stuffed with beef or chicken fajita meat, rice, lettuce, refried beans, guacamole & sour cream. Substitute white queso +0.50.",
  priceText: "Chicken 12.99 | Beef 14.99",
},
{
  id: "cowboy-shrimp",
  categoryId: "local-favorites",
  name: "Cowboy Shrimp",
  description:
    "Grilled bacon-wrapped shrimp on a bed of onions, mushrooms, bell peppers & tomatoes. Served with rice, refried beans & guacamole. Served with 3 tortillas.",
  price: 17.99,
},
{
  id: "street-tacos",
  categoryId: "local-favorites",
  name: "Street Tacos",
  description:
    "Three soft corn tortillas filled with fajita chicken, beef or shrimp. Topped with onions & cilantro. Served with rice & charro beans.",
  priceText: "Chicken 12.99 | Beef 16.99 | Shrimp 16.99",
},
{
  id: "carnitas",
  categoryId: "local-favorites",
  name: "Carnitas",
  description:
    "Three smoked pork tacos topped with salsa verde, cilantro & onions. Served with rice & charro beans.",
  price: 13.99,
},
// =====================
// AMERICAN FOOD
// =====================
{
  id: "hamburger",
  categoryId: "american-food",
  name: "Hamburger",
  description:
    "Served with lettuce, tomatoes, onions & pickles. Served with French fries. Substitute onion rings +2.00.",
  price: 9.99,
},
{
  id: "cheeseburger",
  categoryId: "american-food",
  name: "Cheeseburger",
  description:
    "Served with cheese, lettuce, tomatoes, onions & pickles. Served with French fries. Substitute onion rings +2.00.",
  price: 10.99,
},
{
  id: "guacamole-burger",
  categoryId: "american-food",
  name: "Guacamole Burger",
  description:
    "Served with cheddar jack cheese, lettuce, tomato & guacamole. Served with French fries. Substitute onion rings +2.00.",
  price: 12.99,
},
{
  id: "bacon-burger",
  categoryId: "american-food",
  name: "Bacon Burger",
  description:
    "Served with cheddar jack cheese, lettuce, tomato & bacon. Add an egg +1.00. Served with French fries. Substitute onion rings +2.00.",
  price: 12.99,
},
{
  id: "chile-relleno-burger",
  categoryId: "american-food",
  name: "Chile Relleno Burger",
  description:
    "Beef patty topped with mayo, lettuce, tomato & house-made chile relleno. Served with French fries. Substitute onion rings +2.00.",
  price: 14.99,
},
{
  id: "quesadilla-burger",
  categoryId: "american-food",
  name: "Quesadilla Burger",
  description:
    "Quesadilla meets burger! Topped with cheddar jack cheese, lettuce & pico de gallo. Served with house-made Mexi-Ranch dressing & French fries. Substitute onion rings +2.00.",
  price: 12.99,
},
{
  id: "chicken-wrap",
  categoryId: "american-food",
  name: "Chicken Wrap",
  description:
    "12\" flour tortilla wrapped with grilled or fried chicken, lettuce, tomato & cheddar jack cheese. Served with house-made ranch & French fries.",
  price: 12.99,
},
{
  id: "chicken-strips",
  categoryId: "american-food",
  name: "Chicken Strips (4)",
  description:
    "Four chicken strips served with French fries.",
  price: 11.99,
},
{
  id: "chicken-wings",
  categoryId: "american-food",
  name: "Chicken Wings",
  description:
    "Ten chicken wings served with house-made ranch, tossed in buffalo sauce or naked.",
  price: 11.99,
},
// =====================
// FAJITAS
// =====================
{
  id: "fajitas-chicken",
  categoryId: "fajitas",
  name: "Chicken Fajitas",
  description:
    "Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 15.99 | Double 29.99",
},
{
  id: "fajitas-beef",
  categoryId: "fajitas",
  name: "Beef Fajitas",
  description:
    "Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 18.99 | Double 33.99",
},
{
  id: "fajitas-combo",
  categoryId: "fajitas",
  name: "Combo Fajitas (Beef & Chicken)",
  description:
    "Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 17.99 | Double 33.99",
},
{
  id: "fajitas-super",
  categoryId: "fajitas",
  name: "Super Fajitas",
  description:
    "Chicken, beef & shrimp fajitas served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 21.99 | Double 40.99",
},
{
  id: "fajitas-veggie",
  categoryId: "fajitas",
  name: "Veggie Fajitas",
  description:
    "Mushrooms, bell peppers, grilled onions & tomatoes served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 10.99 | Double 21.99",
},
{
  id: "fajitas-shrimp",
  categoryId: "fajitas",
  name: "Shrimp Fajitas",
  description:
    "Grilled shrimp fajitas served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.",
  priceText: "Single 17.99 | Double 33.99",
},
// =====================
// NACHOS
// =====================
{
  id: "fajita-nachos",
  categoryId: "nachos",
  name: "Fajita Nachos",
  description:
    "Beans, sour cream, chicken or beef fajita meat.",
  priceText: "Chicken 13.99 | Beef 14.99",
},
{
  id: "supreme-nachos",
  categoryId: "nachos",
  name: "Supreme Nachos",
  description:
    "Beans, ground beef, lettuce, tomatoes & sour cream.",
  price: 13.99,
},
{
  id: "chicken-nachos",
  categoryId: "nachos",
  name: "Chicken Nachos",
  description:
    "Shredded chicken & sour cream.",
  price: 10.99,
},
{
  id: "bean-nachos",
  categoryId: "nachos",
  name: "Bean Nachos",
  description:
    "Refried beans & sour cream.",
  price: 8.99,
},

// =====================
// QUESADILLAS
// =====================
{
  id: "fajita-quesadilla",
  categoryId: "quesadillas",
  name: "Fajita Quesadilla",
  description:
    "Served with guacamole, sour cream & pico de gallo.",
  priceText: "Chicken 11.99 | Beef 13.99 | Pork 11.99",
},
{
  id: "shrimp-quesadilla",
  categoryId: "quesadillas",
  name: "Shrimp Quesadilla",
  description:
    "Served with guacamole, sour cream & pico de gallo.",
  price: 13.99,
},
{
  id: "cheese-quesadilla",
  categoryId: "quesadillas",
  name: "Cheese Quesadilla",
  price: 9.99,
},
{
  id: "spinach-quesadilla",
  categoryId: "quesadillas",
  name: "Spinach Quesadilla",
  price: 10.99,
},
// =====================
// BEVERAGES
// =====================
{
  id: "soda",
  categoryId: "beverage",
  name: "Soda",
  price: 2.99,
},
{
  id: "bottled-soda",
  categoryId: "beverage",
  name: "Bottled Soda",
  price: 3.75,
},
{
  id: "iced-tea",
  categoryId: "beverage",
  name: "Iced Tea (Sweet or Unsweetened)",
  price: 2.99,
},
{
  id: "mexican-coke",
  categoryId: "beverage",
  name: "Mexican Coke",
  price: 3.99,
},
{
  id: "jarritos",
  categoryId: "beverage",
  name: "Jarritos",
  description: "Check with your server for daily flavors.",
  price: 2.75,
},
{
  id: "horchata",
  categoryId: "beverage",
  name: "Fresh Made Horchata",
  description: "Check with your server for daily flavors.",
  price: 3.99,
},
{
  id: "agua-fresca",
  categoryId: "beverage",
  name: "Agua Fresca",
  description: "Check with your server for daily flavors.",
  price: 3.99,
},

// =====================
// KIDS
// =====================
{
  id: "kids-cheese-quesadilla",
  categoryId: "kids",
  name: "Kids Cheese Quesadilla",
  description: "Served with rice & beans.",
  price: 6.99,
},
{
  id: "kids-chicken-strips",
  categoryId: "kids",
  name: "Kids Chicken Strips",
  description: "Served with fries.",
  price: 6.99,
},
{
  id: "kids-taco",
  categoryId: "kids",
  name: "Kids Taco",
  description: "Served with rice & beans.",
  price: 6.99,
},

// =====================
// DESSERT
// =====================
{
  id: "sopapilla",
  categoryId: "dessert",
  name: "Sopapilla",
  description: "Fried pastry topped with honey.",
  price: 4.99,
},
{
  id: "churros",
  categoryId: "dessert",
  name: "Churros",
  description: "Cinnamon sugar churros.",
  price: 5.99,
},

];
