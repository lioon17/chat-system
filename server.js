// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Update in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room: ${conversationId}`);
  });

  socket.on('send_message', (data) => {
    const { conversationId } = data;

    // Notify all in the room
    io.to(conversationId).emit('receive_message', data);

    // Emit to admin dashboard to refresh conversations
    io.emit('update_conversation', { conversationId });
  });

  socket.on('new_conversation', (data) => {
    io.emit('new_conversation', data);
  });

  socket.on('conversation_read', ({ conversationId }) => {
    io.to(conversationId).emit('conversation_read', { conversationId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
