import os
import time
from pymongo import MongoClient
from dotenv import load_dotenv

# Path setup
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '..', 'server', '.env')
load_dotenv(env_path)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['dynamic_price_engine']
collection = db['products']

print("🧠 Smart Pricing Engine Active (Monitoring Views & Stock)...")

while True:
    product = collection.find_one()
    
    if product:
        base_price = product.get('base_price', 100)
        current_price = product.get('current_price', 100)
        views = product.get('views', 0)
        stock = product.get('stock', 50)
        
        # --- THE ALGORITHM ---
        
        # Factor 1: Popularity (Views)
        # Every 50 views adds 50% to price
        view_multiplier = 1 + (views / 100)
        
        # Factor 2: Scarcity (Stock)
        # If stock is low, price goes UP
        scarcity_multiplier = 1.0
        
        if stock < 20:
            scarcity_multiplier = 1.2  # 20% Markup
        if stock < 10:
            scarcity_multiplier = 1.5  # 50% Markup
        if stock < 5:
            scarcity_multiplier = 2.0  # Double Price!

        # Calculate Final Price
        new_price = base_price * view_multiplier * scarcity_multiplier
        new_price = round(new_price, 2)
        
        # Logic: Price shouldn't drop below base, and shouldn't change if stock is 0
        if stock == 0:
            print("🚫 Out of Stock. Holding price.")
        elif new_price != current_price:
            collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"current_price": new_price}}
            )
            print(f"💰 Adjusting: Stock {stock} | Views {views} | Price ${new_price}")
            
    time.sleep(1)