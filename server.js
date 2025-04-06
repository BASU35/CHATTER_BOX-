const { log } = require('console');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);

    socket.on('offer', (data) => {
      socket.to(roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
      socket.to(roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
      socket.to(roomId).emit('ice-candidate', data);
    });

    socket.on('chat-message', (msg) => {
      socket.to(roomId).emit('chat-message', msg);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
      console.log(`user-disconnected ${socket.id}`);
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

