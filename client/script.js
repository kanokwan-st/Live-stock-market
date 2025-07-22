//------ Chat function ------//
const chatIcon = document.querySelector(".chat-icon-box");
const chatBox = document.querySelector(".chat-box")

chatIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  chatBox.classList.toggle('open');
})

document.addEventListener("click", (e) => {
  if (!chatBox.contains(e.target) && !chatIcon.contains(e.target)) {
    chatBox.classList.remove('open');
  }
})




//------ socket.io ------//
const socket = io();
let currentStock = 0;
let currentBalance = 50000;
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
const textColor = '#FFF';

const stockChart = new Chart(ctx, {
  type: 'scatter',
  data: {
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
      backgroundColor: '#00D25E',
      tension: 0.2,
      order: 1
    },{
      type: "bubble",
      label: "Sold",
      data: [],
      backgroundColor: '#FF4D4D',
      tension: 0.2,
      order: 1
    }]
  },
  options: {
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'pp',
          displayFormats: {
            second: 'pp'
          }
        },
        title: { display: true, text: "Time", color: textColor },
        ticks: { color: '#CCCCDD' }
      },
      y: {
        title: { display: true, text: "Price ($)", color: textColor },
        ticks: { color: '#CCCCDD' }
      },
    },
    plugins: {
      legend: { labels: {color: textColor} },
      tooltip: {
        callbacks: {
          label: function (ctx) {
          const time = new Date(ctx.parsed.x).toLocaleTimeString();
          const price = ctx.parsed.y.toFixed(2);
          return `Time: ${time}, Price: $${price}`;
        }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false, 
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
    const time = new Date(data.time);
    const localeTime = time.toLocaleTimeString();

    // Add div to history-block
    const div = document.createElement('div');
    div.textContent = `${localeTime} ${data.action === 'Bought' ? '🟢' : '🔴'} ${data.action} ${data.amount} ${data.amount > 1 ? 'stocks' : 'stock'} at $${data.currentPrice.toFixed(2)} each.`;
    const historyBlock = document.getElementById('history-block')
    historyBlock.appendChild(div);
    historyBlock.scrollTop = historyBlock.scrollHeight; // scroll the block all the way to bottom

    // Add to chart
    updateChart(data.time, null, data.currentPrice, data.action);
})

//------ Funtion Update chart ------//
function updateChart(time, price, actionPrice, action = null) {
  // Add data to chart
  if (price != null) {
    stockChart.data.datasets[0].data.push({x: new Date(time), y: price});
  }

  if (actionPrice && action === 'Bought') {
    stockChart.data.datasets[1].data.push({x: time, y: actionPrice, r: 8});
  } else if (actionPrice && action === 'Sold') {
    stockChart.data.datasets[2].data.push({x: time, y: actionPrice, r: 8});
  } else {
    stockChart.data.datasets[1].data.push({x: time, y: price, r: 0, action: null});
    stockChart.data.datasets[2].data.push({x: time, y: price, r: 0, action: null});
  }

  // Keep only latest 20 data
  if (stockChart.data.datasets[0].data.length > 20) {
      stockChart.data.datasets[0].data.shift();
      stockChart.data.datasets[1].data.shift();
      stockChart.data.datasets[2].data.shift();
  }

  stockChart.update();
}


//------ Chat Socket ------//
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");

// Send message by click button or enter
sendBtn.addEventListener('click', () => {
    sendMessage();
})

input.addEventListener('keydown', (e) => {
  if (e.key === "Enter") {
    sendMessage();
  } 
})

function sendMessage() {
  const message = input.value.trim();
  if (message) {
    socket.emit('sendMessage', message);
    input.value = '';
  }
}

// Show message
socket.on('showMessage', (message) => {
  const container = document.querySelector('.message-container');
  // Create message block
  const div = document.createElement('div');
  div.classList.add('message-block');
  div.textContent = message;
  // Put message block into container
  container.appendChild(div);

  container.scrollTop = container.scrollHeight;
})
