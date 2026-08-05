const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const games = {};

io.on('connection', (socket) => {
  // Vytvorenie miestnosti
  socket.on('createGame', () => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    games[roomId] = { players: [socket.id] };
    
    socket.join(roomId);
    socket.emit('gameCreated', { roomId, color: 'white' });
  });

  // Pripojenie cez odkaz
  socket.on('joinGame', (roomId) => {
    const room = games[roomId];

    if (!room) {
      socket.emit('errorMsg', 'Miestnosť neexistuje alebo vypršala!');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('errorMsg', 'V tejto miestnosti už hrajú dvaja hráči!');
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);
    
    socket.emit('gameJoined', { roomId, color: 'black' });
    io.to(roomId).emit('startGame');
  });

  // Posielanie ťahov
  socket.on('makeMove', ({ roomId, move }) => {
    socket.to(roomId).emit('opponentMove', move);
  });

  socket.on('disconnect', () => {
    // Čistenie pri odpojení
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server beží na portu ${PORT}`);
});