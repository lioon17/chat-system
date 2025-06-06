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

  // 🚀 Existing: handle direct message
  socket.on('send_message', (data) => {
    const { conversationId } = data;
    socket.to(conversationId).emit('receive_message', data);

    // ✅ ALSO broadcast to admins: conversation updated
    io.emit('update_conversation', { conversationId, preview: data.message, timestamp: data.timestamp });
  });

  // 🆕 Emit when new conversation is created
  socket.on('new_conversation', (conversationData) => {
    io.emit('new_conversation', conversationData);
  });

  // 🆕 Emit when a conversation is marked as read
  socket.on('conversation_read', ({ conversationId }) => {
    io.emit('conversation_read', { conversationId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
