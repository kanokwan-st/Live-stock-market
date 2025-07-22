import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const SYMBOL = process.env.SYMBOL;

const app = express();              // Create Express app
const server = createServer(app);   // Create HTTP server

// Send HTML file when visiting root URL
const __dirname = dirname(fileURLToPath(import.meta.url)); // current directory
app.use(express.static(join(__dirname, '../client')));


//-------- Socket.io Connection (server <-> client) ---------//
const io = new Server(server);
const users = {};
const allHistory = {};

io.on("connection", (socket) => {
  console.log("User connected");

  // Initialize users
  users[socket.id] = {
    balance: 50000.00,
    stock: 0
  };
  const user = users[socket.id];

  // Initialize allHistory
  allHistory[socket.id] = {
    currentPrice,
    amount: 0,
    action: "",
    time: latestTime
  };
  const history = allHistory[socket.id];

  // Sell event
  socket.on("sellStock", (amount) => {
    user.balance += (amount * currentPrice);
    user.stock -= amount;
    socket.emit('updateUser', user);

    history.currentPrice = currentPrice;
    history.amount = amount;
    history.action = "Sold";
    history.time = latestTime;
    socket.emit('keepHistory', history);
  })
  // Buy event
  socket.on("buyStock", (amount) => {
    user.balance -= (amount * currentPrice);
    user.stock += amount;
    socket.emit('updateUser', user);
    
    history.currentPrice = currentPrice;
    history.amount = amount;
    history.action = "Bought";
    history.time = latestTime;
    socket.emit('keepHistory', history);
  })

  // Show Message
  socket.on("sendMessage", (message) => {
    io.emit("showMessage", message);
  })

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});




//------------- Connect to Finnhub --------------//
const FINNHUB_SOCKET_URL = `wss://ws.finnhub.io?token=${API_KEY}`;
const finnhubSocket = new WebSocket(FINNHUB_SOCKET_URL);
let currentPrice = 0;
let latestTime;

// Connection opened -> Subscribe
finnhubSocket.on('open', () => {
  console.log('Connected to Finnhub WebSocket');
  finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol: SYMBOL }));
});

// Listen for messages
finnhubSocket.on('message', (data) => {
  const parsedData = JSON.parse(data); // convert data to obj.

  if (parsedData.type === 'trade') {
    const price = parsedData.data[0].p;
    const timestamp = new Date(parsedData.data[0].t).toISOString();
    latestTime = timestamp;

    console.log(`Price update: $${price} at ${timestamp}`);
    io.emit('stockPrice', { price, time: timestamp }); // Boardcast event for all users

    currentPrice = price;
  }
});

// Handle errors
finnhubSocket.on('error', (err) => {
  console.error('WebSocket error:', err);
});





//---------- Start server -----------//
server.listen(PORT, () =>
  console.log(`Server is running at http://localhost:${PORT}`)
);
