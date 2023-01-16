const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
app.use(cors());
require("dotenv").config();

const harperSaveMessage = require("./database/harper-save-message");
const harperGetMessages = require("./database/harper-get-message");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST", "DELETE"],
  },
});

//we are listening to the event with this id.
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    // const { message, room, author, time } = data;
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);

    harperGetMessages(data)
      .then((last100Messages) => {
        console.log("latest messages", last100Messages);
        socket.emit("last_100_messages", last100Messages);
      })
      .catch((err) => console.log(err));
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
    const { message, author, room, time } = data;
    harperSaveMessage(message, author, room, time) // Save message in db
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });

});

server.listen(3001, () => {
  console.log("server running");
});
