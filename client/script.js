const socket = io('http://localhost:3000');

// Select Elements
const priceElement = document.getElementById('price');
const buyPriceElement = document.getElementById('buy-price');
const stockElement = document.getElementById('stock-count');
const buyButton = document.getElementById('btn-buy');
const statusElement = document.getElementById('connection-status');
const ctx = document.getElementById('priceChart').getContext('2d');

// --- CHART SETUP ---
const gradient = ctx.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

const priceChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Market Price',
            data: [],
            borderColor: '#4ade80',
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.1)' } } }
    }
});

// --- SOCKET EVENTS ---

socket.on('connect', () => {
    statusElement.innerText = "🟢 Market Open";
    statusElement.style.color = "#4ade80";
    socket.emit('view_product');
});

// NEW: Listen for Stock Updates
socket.on('product_update', (data) => {
    console.log("📦 Update:", data);
    
    // 1. Update Price
    priceElement.innerText = `$${data.current_price.toFixed(2)}`;
    buyPriceElement.innerText = data.current_price.toFixed(2);
    
    // 2. Update Stock
    stockElement.innerText = data.stock;
    
    // 3. Handle "Sold Out"
    if (data.stock <= 0) {
        buyButton.disabled = true;
        buyButton.innerText = "🚫 SOLD OUT";
        stockElement.innerText = "0 (Out of Stock)";
        stockElement.style.color = "red";
    } else {
        buyButton.disabled = false;
        buyButton.innerText = `💳 BUY NOW ($${data.current_price.toFixed(2)})`;
        stockElement.style.color = "#ffcc00";
    }

    // 4. Update Chart
    const timeNow = new Date().toLocaleTimeString();
    priceChart.data.labels.push(timeNow);
    priceChart.data.datasets[0].data.push(data.current_price);
    if (priceChart.data.labels.length > 20) {
        priceChart.data.labels.shift();
        priceChart.data.datasets[0].data.shift();
    }
    priceChart.update();
});

// --- USER ACTIONS ---

function buyProduct() {
    // Play sound or animation here if you want!
    socket.emit('buy_product');
}

function simulateTraffic() {
    for(let i=0; i<10; i++) setTimeout(() => socket.emit('view_product'), i * 100);
}

function resetData() {
    if(confirm("Reset Stock to 50 and Price to $100?")) {
        socket.emit('reset_product');
    }
}