// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Create socket server
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ Replace with specific frontend domain in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join a conversation-specific room
  socket.on('join_room', (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 Socket ${socket.id} joined room: ${conversationId}`);
  });

    // Handle message send and broadcast
  socket.on('send_message', (data) => {
    const { conversationId } = data;

    // Send to all *other* clients in the room
    socket.to(conversationId).emit('receive_message', data);

    // Echo back to sender (admin or user)
    socket.emit('receive_message', data);

    // Update conversation list UI
    io.emit('update_conversation', { conversationId });

    if (data.newConversation) {
      io.emit('new_conversation', data);
    }
  });


  // Admin marks conversation as read
  socket.on('conversation_read', ({ conversationId }) => {
    // Notify clients in the room
    io.to(conversationId).emit('conversation_read', { conversationId });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});
