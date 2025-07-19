const socket = io();
let currentStock = 0;
let currentBalance = 100;
let currentPrice = 0;

socket.on('stockPrice', (data) => {
    document.getElementById('price').textContent = `$${data.price.toFixed(2)}`;
    currentPrice = data.price;
})

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
    div.textContent = `${data.action === 'Bought' ? '🟢' : '🔴'} ${data.action} ${data.amount} ${data.amount > 1 ? 'stocks' : 'stock'} at $${data.currentPrice.toFixed(2)} each`;
    const historyBlock = document.getElementById('history-block')
    historyBlock.appendChild(div);
    historyBlock.scrollTop = historyBlock.scrollHeight; // scroll the block all the way to bottom
})
