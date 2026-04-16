const socket = io("http://localhost:3000", {
  autoConnect: false
});
let typingTimeout;

let currentRoom = "";

function joinRoom() {

  const room = document.getElementById("roomInput").value;
  const username = document.getElementById("usernameInput").value;

  currentRoom = room;

  socket.auth = { username };

  socket.connect();

  socket.emit("join_room", room);

  document.getElementById("messages").innerHTML = ""; // clear UI

  console.log("Joined room:", room);

}

function sendMessage() {

  const messageInput = document.getElementById("messageInput");
  const usernameInput = document.getElementById("usernameInput");

  const message = messageInput.value;
  const username = usernameInput.value;

  socket.emit("chat_message", {
    room: currentRoom,
    message: message,
    username: username
  });

  messageInput.value = "";

}

socket.on("chat_message", (data) => {

  const li = document.createElement("li");

  li.textContent = `${data.username}: ${data.message}`;

  document.getElementById("messages").appendChild(li);

});

socket.on("load_messages", (messages) => {

  const messageList = document.getElementById("messages");

  messageList.innerHTML = ""; // clear old messages

  messages.forEach((msg) => {

    const li = document.createElement("li");
    li.textContent = `${msg.username}: ${msg.message}`;

    messageList.appendChild(li);

  });

});

socket.on("typing", (username) => {

  const typingDiv = document.getElementById("typingIndicator");

  typingDiv.textContent = `${username} is typing...`;

});

socket.on("stop_typing", () => {

  const typingDiv = document.getElementById("typingIndicator");

  typingDiv.textContent = "";

});

socket.on("online_users", (users) => {

  const usersDiv = document.getElementById("onlineUsers");

  const usernames = users.map(u => u.username);

  usersDiv.textContent = "Online: " + usernames.join(", ");

});

const messageInput = document.getElementById("messageInput");

messageInput.addEventListener("input", () => {

  const username = document.getElementById("usernameInput").value;

  socket.emit("typing", {
    room: currentRoom,
    username: username
  });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    socket.emit("stop_typing", {
      room: currentRoom
    });
  }, 1000);

});