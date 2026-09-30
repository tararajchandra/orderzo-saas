import csv

categories = [
    {"name": "Beverage", "description": "Refreshing drinks", "sort_order": 1},
    {"name": "Breakfast", "description": "Morning meals", "sort_order": 2},
    {"name": "Veg Snacks", "description": "Vegetarian appetizers", "sort_order": 3},
    {"name": "Non Veg Snacks", "description": "Non-vegetarian appetizers", "sort_order": 4},
    {"name": "Soup", "description": "Hot soups", "sort_order": 5},
    {"name": "Indian Main Course (Veg)", "description": "Vegetarian main dishes", "sort_order": 6},
    {"name": "Indian Main Course (Chicken)", "description": "Chicken main dishes", "sort_order": 7},
    {"name": "Mutton", "description": "Mutton dishes", "sort_order": 8},
    {"name": "Fish", "description": "Fish dishes", "sort_order": 9},
    {"name": "Egg", "description": "Egg dishes", "sort_order": 10},
    {"name": "Chinese Main Course", "description": "Chinese dishes", "sort_order": 11},
    {"name": "Rice / Noodles", "description": "Rice and noodles", "sort_order": 12},
    {"name": "Accompaniment", "description": "Sides and salads", "sort_order": 13},
    {"name": "Thali Delight", "description": "Complete meal platters", "sort_order": 14},
    {"name": "Tandoori", "description": "Tandoor baked breads and starters", "sort_order": 15}
]

menu_items = [
    # Beverage
    {"name": "Package Drinking Water 1L", "category": "Beverage", "price": 20},
    {"name": "Package Drinking Water 500ml", "category": "Beverage", "price": 10},
    {"name": "Tea (Kulhad)", "category": "Beverage", "price": 10},
    {"name": "Special Tea (Kulhad)", "category": "Beverage", "price": 20},
    {"name": "Black Tea", "category": "Beverage", "price": 20},
    {"name": "Lemon Tea", "category": "Beverage", "price": 25},
    {"name": "Black Coffee", "category": "Beverage", "price": 25},
    {"name": "Milk Coffee", "category": "Beverage", "price": 40},
    {"name": "Cold Drinks 250ml", "category": "Beverage", "price": 25},
    {"name": "Cold Drinks 500ml", "category": "Beverage", "price": 35},
    {"name": "Fresh Lime Water", "category": "Beverage", "price": 30},
    {"name": "Fresh Lime Soda", "category": "Beverage", "price": 50},
    {"name": "Masala Cold Drinks", "category": "Beverage", "price": 50},
    {"name": "Lassi Regular", "category": "Beverage", "price": 60},
    {"name": "Lassi Special", "category": "Beverage", "price": 120},
    {"name": "Cold Coffee", "category": "Beverage", "price": 80},

    # Breakfast
    {"name": "Puri Sabzi 4pcs", "category": "Breakfast", "price": 60},
    {"name": "Alu Paratha 1pc", "category": "Breakfast", "price": 60},
    {"name": "Veg Sandwich", "category": "Breakfast", "price": 80},
    {"name": "Chicken Sandwich", "category": "Breakfast", "price": 120},
    {"name": "Grill Sandwich (Veg)", "category": "Breakfast", "price": 120},
    {"name": "Grill Sandwich (Chicken)", "category": "Breakfast", "price": 140},
    {"name": "Omelette", "category": "Breakfast", "price": 40},

    # Veg Snacks
    {"name": "Veg Pakoda 6pcs", "category": "Veg Snacks", "price": 140},
    {"name": "French Fry", "category": "Veg Snacks", "price": 120},
    {"name": "Panner Pakora 6pcs", "category": "Veg Snacks", "price": 200},
    {"name": "Chilli Panner Dry", "category": "Veg Snacks", "price": 200},
    {"name": "Crispy Chilly Babycorn", "category": "Veg Snacks", "price": 200},
    {"name": "Chilli Musroom Dry", "category": "Veg Snacks", "price": 220},
    {"name": "Mushroom Pepper Salt", "category": "Veg Snacks", "price": 200},

    # Non Veg Snacks
    {"name": "Chicken Pakoda 6pcs", "category": "Non Veg Snacks", "price": 200},
    {"name": "Chicken Lollipop 6pcs", "category": "Non Veg Snacks", "price": 200},
    {"name": "Chilli Chicken Dry", "category": "Non Veg Snacks", "price": 200},
    {"name": "Crispy Chicken", "category": "Non Veg Snacks", "price": 220},
    {"name": "Chicken 65", "category": "Non Veg Snacks", "price": 200},
    {"name": "Chicken Oil Fry", "category": "Non Veg Snacks", "price": 210},
    {"name": "Chilli Prawn Dry", "category": "Non Veg Snacks", "price": 300},
    {"name": "Drums Of Heaven", "category": "Non Veg Snacks", "price": 240},
    {"name": "Chicken Pepper Salt", "category": "Non Veg Snacks", "price": 220},
    {"name": "Fish Finger 6pcs", "category": "Non Veg Snacks", "price": 280},
    {"name": "Chilli Fish Dry", "category": "Non Veg Snacks", "price": 300},

    # Soup
    {"name": "Sweet Corn Soup Veg", "category": "Soup", "price": 120},
    {"name": "Sweet Corn Soup Chicken", "category": "Soup", "price": 150},
    {"name": "Manchow Soup Veg", "category": "Soup", "price": 120},
    {"name": "Manchow Soup Chicken", "category": "Soup", "price": 160},
    {"name": "Hot & Sour Soup Veg", "category": "Soup", "price": 120},
    {"name": "Hot & Sour Soup Chicken", "category": "Soup", "price": 160},

    # Indian Main Course (Veg)
    {"name": "Tadka Plain", "category": "Indian Main Course (Veg)", "price": 100},
    {"name": "Tadka Egg", "category": "Indian Main Course (Veg)", "price": 120},
    {"name": "Tadka Chicken", "category": "Indian Main Course (Veg)", "price": 150},
    {"name": "Dal Makhani", "category": "Indian Main Course (Veg)", "price": 140},
    {"name": "Yellow Dal Fry", "category": "Indian Main Course (Veg)", "price": 120},
    {"name": "Mix Veg", "category": "Indian Main Course (Veg)", "price": 180},
    {"name": "Chana Masala", "category": "Indian Main Course (Veg)", "price": 130},
    {"name": "Mushroom Masala", "category": "Indian Main Course (Veg)", "price": 220},
    {"name": "Panner Butter Masala", "category": "Indian Main Course (Veg)", "price": 220},
    {"name": "Kadai Panner", "category": "Indian Main Course (Veg)", "price": 250},
    {"name": "Panner Do Piyaza", "category": "Indian Main Course (Veg)", "price": 250},
    {"name": "Sahi Panner", "category": "Indian Main Course (Veg)", "price": 240},
    {"name": "Matar Panner", "category": "Indian Main Course (Veg)", "price": 250},

    # Indian Main Course (Chicken)
    {"name": "Chicken Kasha / Curry Full (8pcs)", "category": "Indian Main Course (Chicken)", "price": 380},
    {"name": "Chicken Kasha / Curry Half (4pcs)", "category": "Indian Main Course (Chicken)", "price": 200},
    {"name": "Chicken Bharta", "category": "Indian Main Course (Chicken)", "price": 210},
    {"name": "Kadhai Chicken Full (6pc)", "category": "Indian Main Course (Chicken)", "price": 360},
    {"name": "Kadhai Chicken Half (4pc)", "category": "Indian Main Course (Chicken)", "price": 250},
    {"name": "Chicken Do Piyaza Full (6pc)", "category": "Indian Main Course (Chicken)", "price": 360},
    {"name": "Chicken Do Piyaza Half (4pc)", "category": "Indian Main Course (Chicken)", "price": 250},
    {"name": "Chicken Tikka Masala (6pcs)", "category": "Indian Main Course (Chicken)", "price": 280},
    {"name": "Chicken Tikka Rashmi Butter Masala (6pcs)", "category": "Indian Main Course (Chicken)", "price": 280},
    {"name": "Champaran Chicken", "category": "Indian Main Course (Chicken)", "price": 370},
    {"name": "Butter Chicken Boneless (Mumbai Style)", "category": "Indian Main Course (Chicken)", "price": 350},
    {"name": "Butter Chicken With Bone (Kolkata Style)", "category": "Indian Main Course (Chicken)", "price": 330},

    # Mutton
    {"name": "Mutton Kasha / Curry Full (8pcs)", "category": "Mutton", "price": 580},
    {"name": "Mutton Kasha / Curry Half (4pcs)", "category": "Mutton", "price": 310},
    {"name": "Kadhai Mutton Full (8pcs)", "category": "Mutton", "price": 620},
    {"name": "Kadhai Mutton Half (4pcs)", "category": "Mutton", "price": 330},
    {"name": "Mutton Do Piyaza Full (8pcs)", "category": "Mutton", "price": 620},
    {"name": "Mutton Do Piyaza Half (4pcs)", "category": "Mutton", "price": 330},
    {"name": "Champaran Mutton 8pcs", "category": "Mutton", "price": 620},

    # Fish
    {"name": "Fish Fry (Ruhi/Katla) 1pc", "category": "Fish", "price": 60},
    {"name": "Fish Curry (Ruhi/Katla) 1pc", "category": "Fish", "price": 80},
    {"name": "Fish Curry (Ruhi/Katla) 2pc", "category": "Fish", "price": 160},
    {"name": "Pomfret Fry / Masala", "category": "Fish", "price": 200},
    {"name": "Vetki Fry 1pc", "category": "Fish", "price": 100},
    {"name": "Vetki Kassa / Curry / Masala 2pcs", "category": "Fish", "price": 210},

    # Egg
    {"name": "Omelette (Egg)", "category": "Egg", "price": 40},
    {"name": "Egg Bhurji", "category": "Egg", "price": 50},
    {"name": "Omelette Curry / Masala", "category": "Egg", "price": 80},
    {"name": "Egg Curry 2pcs", "category": "Egg", "price": 80},
    {"name": "Egg Masala 2pcs", "category": "Egg", "price": 80},

    # Chinese Main Course
    {"name": "Chilly Chicken Boneless 6pcs", "category": "Chinese Main Course", "price": 230},
    {"name": "Chicken Manchurian 6pcs", "category": "Chinese Main Course", "price": 240},
    {"name": "Panner Manchurian 6pcs", "category": "Chinese Main Course", "price": 200},
    {"name": "Garlic Chicken 6pcs", "category": "Chinese Main Course", "price": 220},
    {"name": "Chicken Sweet & Sour", "category": "Chinese Main Course", "price": 220},
    {"name": "Lemon Chicken", "category": "Chinese Main Course", "price": 220},

    # Rice / Noodles
    {"name": "Steam Rice", "category": "Rice / Noodles", "price": 60},
    {"name": "Curd Rice", "category": "Rice / Noodles", "price": 100},
    {"name": "Jeera Rice", "category": "Rice / Noodles", "price": 90},
    {"name": "Peas Polao", "category": "Rice / Noodles", "price": 100},
    {"name": "Basanti Polao", "category": "Rice / Noodles", "price": 150},
    {"name": "Fried Rice (Veg)", "category": "Rice / Noodles", "price": 120},
    {"name": "Fried Rice (Chicken)", "category": "Rice / Noodles", "price": 140},
    {"name": "Fried Rice (Mix)", "category": "Rice / Noodles", "price": 160},
    {"name": "Noodles (Veg)", "category": "Rice / Noodles", "price": 120},
    {"name": "Noodles (Chicken)", "category": "Rice / Noodles", "price": 140},
    {"name": "Noodles (Mix)", "category": "Rice / Noodles", "price": 160},

    # Accompaniment
    {"name": "Rosted Papad 1pc", "category": "Accompaniment", "price": 25},
    {"name": "Masala Papad 1pc", "category": "Accompaniment", "price": 40},
    {"name": "Green Salad", "category": "Accompaniment", "price": 60},
    {"name": "Onion Salad", "category": "Accompaniment", "price": 50},
    {"name": "Raita", "category": "Accompaniment", "price": 80},

    # Thali Delight
    {"name": "Veg Thali (2Sabzi+Dal+Curd+Papad)", "category": "Thali Delight", "price": 100},
    {"name": "Omlet Thali (Single Egg)", "category": "Thali Delight", "price": 125},
    {"name": "Fish Thali (1pc Fish)", "category": "Thali Delight", "price": 160},
    {"name": "Vetki Fish Thali (1pc)", "category": "Thali Delight", "price": 240},
    {"name": "Chicken Thali (2pcs)", "category": "Thali Delight", "price": 220},
    {"name": "Mutton Thali (2pcs)", "category": "Thali Delight", "price": 260},
    {"name": "Extra Rice", "category": "Thali Delight", "price": 10},

    # Tandoori
    {"name": "Tawa Roti (Plain)", "category": "Tandoori", "price": 10},
    {"name": "Tawa Roti (Butter)", "category": "Tandoori", "price": 15},
    {"name": "Tandoori Roti (Plain)", "category": "Tandoori", "price": 20},
    {"name": "Tandoori Roti (Butter)", "category": "Tandoori", "price": 25},
    {"name": "Naan (Plain)", "category": "Tandoori", "price": 35},
    {"name": "Naan (Butter)", "category": "Tandoori", "price": 45},
    {"name": "Garlic Naan", "category": "Tandoori", "price": 70},
    {"name": "Masala Kulcha", "category": "Tandoori", "price": 70},
    {"name": "Lacha Paratha", "category": "Tandoori", "price": 65},
    {"name": "Tandoori Chicken Full", "category": "Tandoori", "price": 400},
    {"name": "Tandoori Chicken Half", "category": "Tandoori", "price": 220},
    {"name": "Chicken Tikka 6pcs", "category": "Tandoori", "price": 230},
    {"name": "Chicken Reshmi Kabab 6pcs", "category": "Tandoori", "price": 250},
    {"name": "Chicken Malai Tikka 6pcs", "category": "Tandoori", "price": 260},
    {"name": "Chicken Hariyali Kabab 6pcs", "category": "Tandoori", "price": 250},
    {"name": "Fish Tikka 4pcs", "category": "Tandoori", "price": 280},
    {"name": "Fish Malai Tikka 4pcs", "category": "Tandoori", "price": 300}
]

with open('public/Menu_Categories.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'description', 'sort_order'])
    writer.writeheader()
    writer.writerows(categories)

with open('public/Menu_Items.csv', 'w', newline='', encoding='utf-8') as f:
    # Notice we use category_name so the backend will look up the category_id automatically
    writer = csv.DictWriter(f, fieldnames=['name', 'description', 'category_name', 'price', 'gst_rate', 'available'])
    writer.writeheader()
    for item in menu_items:
        writer.writerow({
            'name': item['name'],
            'description': '',
            'category_name': item['category'],
            'price': item['price'],
            'gst_rate': 5, # default
            'available': 'true'
        })

print("Generated Menu_Categories.csv and Menu_Items.csv")
