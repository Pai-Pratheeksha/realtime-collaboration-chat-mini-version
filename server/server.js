const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");
const roomUsers = {};

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

  socket.on("join_room", async (room) => {

    socket.join(room);

    const username = socket.handshake.auth?.username || "Anonymous";

    // initialize room if not exists
    if (!roomUsers[room]) {
      roomUsers[room] = [];
    }

    // store user
    roomUsers[room].push({ id: socket.id, username });

    console.log(`User ${socket.id} joined room ${room}`);

    // send updated user list to room
    io.to(room).emit("online_users", roomUsers[room]);

    try {
      const result = await pool.query(
        "SELECT * FROM messages WHERE room = $1 ORDER BY created_at ASC",
        [room]
      );

      socket.emit("load_messages", result.rows);

    } catch (err) {
      console.error("Error loading messages:", err);
    }

  });

  socket.on("chat_message", async (data) => {

    const { room, message, username } = data;

    try {
      await pool.query(
        "INSERT INTO messages (room, message, username) VALUES ($1, $2, $3)",
        [room, message, username]
      );

      console.log("Message saved to DB");

      io.to(room).emit("chat_message", {
        message,
        username
      });

    } catch (err) {
      console.error("DB insert error:", err);
    }

  });

  socket.on("typing", (data) => {

    socket.to(data.room).emit("typing", data.username);

  });

  socket.on("stop_typing", (data) => {

    socket.to(data.room).emit("stop_typing");

  });

  socket.on("disconnect", () => {
    for (let room in roomUsers) {

      roomUsers[room] = roomUsers[room].filter(
        user => user.id !== socket.id
      );

      // update remaining users in room
      io.to(room).emit("online_users", roomUsers[room]);

    }

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