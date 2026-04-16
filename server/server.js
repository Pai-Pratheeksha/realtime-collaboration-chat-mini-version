const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");

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

  socket.on("join_room", (room) => {

    socket.join(room);

    console.log(`User ${socket.id} joined room ${room}`);

  });

  socket.on("chat_message", async (data) => {

    const { room, message } = data;

    try {
      await pool.query(
        "INSERT INTO messages (room, message) VALUES ($1, $2)",
        [room, message]
      );

      console.log("Message saved to DB");

      io.to(room).emit("chat_message", message);

    } catch (err) {
      console.error("DB insert error:", err);
    }

  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection error", err);
  } else {
    console.log("DB connected:", res.rows[0]);
  }
});

/* Start server */
server.listen(3000, () => {
  console.log("Server running on port 3000");
});