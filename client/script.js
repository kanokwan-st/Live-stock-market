const socket = io();
let currentStock = 0;
let currentBalance = 10000;
let currentPrice = 0;

//------ Get stock data from Finnhub.io ------//
socket.on('stockPrice', (data) => {
    // Update display
    document.getElementById('price').textContent = `$${data.price.toFixed(2)}`;
    currentPrice = data.price;

    // Add to chart
    stockChart.data.labels.push(data.time);
    stockChart.data.datasets[0].data.push(data.price);

    // Keep only latest 20 data
    if (stockChart.data.labels.length > 20) {
        stockChart.data.labels.shift();
        stockChart.data.datasets[0].data.shift();
    }

    stockChart.update();

})

//------ Stock Chart ------//
const ctx = document.getElementById('stockChart');

const stockChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Stock Price",
      data: [],
      borderColor: "rgb(75, 192, 192)",
      tension: 0.2,
    }]
  },
  options: {
    scales: {
      x: {
        title: { display: true, text: "Time" },
      },
      y: {
        title: { display: true, text: "Price ($)" },
      },
    },
    animation: {
        duration: 200,
    }
  },
});


//------ Sell Button Handle ------//
document.getElementById('sellBtn').addEventListener('click', () => {
    const input = document.getElementById('inputStock');
    const amount = parseInt(input.value);
    input.setCustomValidity('');

    // validate input
    if (!input.checkValidity()) {
        input.reportValidity();
        return;
    }
    if (amount > currentStock) {
        input.setCustomValidity(`You only have ${currentStock} ${currentStock > 1 ? 'stocks' : 'stock'}.`);
        input.reportValidity();
        return;
    }

    socket.emit('sellStock', amount)
});

//------ Buy Button Handle ------//
document.getElementById('buyBtn').addEventListener('click', () => {
    const input = document.getElementById('inputStock');
    const amount = parseInt(input.value);
    input.setCustomValidity('');

    // validate input
    if (!input.checkValidity()) {
        input.reportValidity();
        return;
    }
    if (amount * currentPrice > currentBalance) {
        input.setCustomValidity(`Not enough balance. You need $${(amount * currentPrice).toFixed(2)}`);
        input.reportValidity();
        return;
    }

    socket.emit('buyStock', amount);
});

// Clear the custom error while typing
document.getElementById('inputStock').addEventListener('input', (e) => {
    e.target.setCustomValidity('');
})

//------ Update user balance ------//
socket.on('updateUser', (data) => {
    document.getElementById('balance').textContent = `$${data.balance.toFixed(2)}`;
    document.getElementById('stock').textContent = `${data.stock}`;
    currentStock = data.stock;
    currentBalance = data.balance;
})

//------ Keep history ------//
socket.on('keepHistory', (data) => {
    const div = document.createElement('div');
    div.textContent = `${data.time} ${data.action === 'Bought' ? '🟢' : '🔴'} ${data.action} ${data.amount} ${data.amount > 1 ? 'stocks' : 'stock'} at $${data.currentPrice.toFixed(2)} each`;
    const historyBlock = document.getElementById('history-block')
    historyBlock.appendChild(div);
    historyBlock.scrollTop = historyBlock.scrollHeight; // scroll the block all the way to bottom
})


