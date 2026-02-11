require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to DB'))
    .catch(err => console.error(err));

const productSchema = new mongoose.Schema({
    name: String,
    base_price: Number,
    current_price: Number,
    stock: Number,
    views: { type: Number, default: 0 }
});
const Product = mongoose.model('Product', productSchema);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Helper to broadcast full state
async function broadcastUpdate(product) {
    io.emit('product_update', {
        current_price: product.current_price,
        stock: product.stock,
        views: product.views
    });
}

async function initDB() {
    const count = await Product.countDocuments();
    if (count === 0) {
        await Product.create({ name: "Super Cloud Sneaker", base_price: 100, current_price: 100, stock: 50, views: 0 });
    }
}
initDB();

io.on('connection', (socket) => {
    // Send initial data on connect
    socket.on('view_product', async () => {
        const product = await Product.findOneAndUpdate({}, { $inc: { views: 1 } }, { new: true });
        if(product) broadcastUpdate(product);
    });

    // NEW: BUY EVENT
    socket.on('buy_product', async () => {
        // Only decrement if stock > 0
        const product = await Product.findOneAndUpdate(
            { stock: { $gt: 0 } }, 
            { $inc: { stock: -1, views: 5 } }, // Buying adds 5 "popularity points" (views)
            { new: true }
        );
        
        if (product) {
            console.log(`💸 Item Sold! Stock left: ${product.stock}`);
            broadcastUpdate(product);
        }
    });

    socket.on('reset_product', async () => {
        const product = await Product.findOneAndUpdate({}, { views: 0, current_price: 100, stock: 50 }, { new: true });
        if(product) broadcastUpdate(product);
    });
});

// Watch for Python Changes
Product.watch().on('change', async (change) => {
    if (change.operationType === 'update') {
        const product = await Product.findOne();
        broadcastUpdate(product);
    }
});

server.listen(3000, () => console.log("🚀 Server running on 3000"));