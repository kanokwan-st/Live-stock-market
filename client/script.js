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
    updateChart(data.time, data.price, null);

})

//------ Stock Chart ------//
const ctx = document.getElementById('stockChart');

const stockChart = new Chart(ctx, {
  data: {
    labels: [],
    datasets: [{
      type: "line",
      label: "Stock Price",
      data: [],
      borderColor: "rgb(75, 192, 192)",
      tension: 0.2,
      spanGaps: true,
      order: 2
    },{
      type: "bubble",
      label: "Bought",
      data: [],
      backgroundColor: 'rgb(0, 210, 94)',
      tension: 0.2,
      order: 1
    },{
      type: "bubble",
      label: "Sell",
      data: [],
      backgroundColor: 'rgb(255, 77, 77)',
      tension: 0.2,
      order: 1
    }]
  },
  options: {
    scales: {
      x: {
        type: 'category',
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
    input.setCustomValidity('');
    
    // validate input
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    const amount = parseInt(input.value);
    
    // enough stock to sell?
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
    input.setCustomValidity('');
    
    // validate input
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    const amount = parseInt(input.value);

    // enough money to buy?
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

    // Add to chart
    updateChart(data.time, null, data.currentPrice, data.action);
})

//------ Funtion Update chart ------//
function updateChart(time, price, actionPrice, action = null) {
  // Add data to chart
  stockChart.data.labels.push(time);
  stockChart.data.datasets[0].data.push(price);

  if (actionPrice && action === 'Bought') {
    stockChart.data.datasets[1].data.push({x: time, y: actionPrice, r: 8, action: action});
  } else if (actionPrice && action === 'Sold') {
    stockChart.data.datasets[2].data.push({x: time, y: actionPrice, r: 8, action: action});
  } else {
    stockChart.data.datasets[1].data.push({x: time, y: price, r: 0, action: null});
    stockChart.data.datasets[2].data.push({x: time, y: price, r: 0, action: null});
  }

  // Keep only latest 20 data
  if (stockChart.data.labels.length > 20) {
      stockChart.data.labels.shift();
      stockChart.data.datasets[0].data.shift();
      stockChart.data.datasets[1].data.shift();
      stockChart.data.datasets[2].data.shift();
  }

  stockChart.update();
}


