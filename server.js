import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Add endpoint
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("User connected");
  // when disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  // When send message
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit('chat message', msg);
  });
});

server.listen(3000, () =>
  console.log(`Server is running at http://localhost:3000`)
);
