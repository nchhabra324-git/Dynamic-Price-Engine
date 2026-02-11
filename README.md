# Dynamic Pricing Engine

A real-time system that adjusts product prices based on supply and demand using **Node.js** and **Python**.

## How to Run

1. **Start Backend (Node.js)**
   ```bash
   cd server
   npm install
   # Create .env with MONGO_URI
   node server.js
   ```

2. **Start Engine (Python)**
   ```bash
   cd analysis
    pip install pymongo python-dotenv
    python price_engine.py
   ```

3. **Open Frontend Open client/index.html in your browser.**   
