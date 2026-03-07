const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* Create HTTP server */
const server = http.createServer(app);

/* Attach Socket.IO to server */
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* Test route */
app.get("/", (req, res) => {
  res.send("Realtime chat server running");
});

/* WebSocket connection */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* Start server */
server.listen(3000, () => {
  console.log("Server running on port 3000");
});