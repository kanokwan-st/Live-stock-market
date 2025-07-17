const socket = io();

socket.on('stockPrice', (data) => {
    document.getElementById('price').textContent = `Price: $${data.price} at ${data.time}`;
})
