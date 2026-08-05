const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], restartVotes: 0 };
        }
        
        rooms[roomId].players.push(socket.id);

        if (rooms[roomId].players.length === 1) {
            socket.emit('init', { color: 'w' });
        } else if (rooms[roomId].players.length === 2) {
            socket.emit('init', { color: 'b' });
            io.to(roomId).emit('startGame');
        } else {
            socket.emit('init', { color: 'spectator' });
        }

        socket.on('move', (moveData) => {
            socket.to(roomId).emit('move', moveData);
        });

        // Spracovanie požiadavky na novú hru
        socket.on('restartGame', () => {
            if (rooms[roomId]) {
                rooms[roomId].restartVotes++;
                if (rooms[roomId].restartVotes >= 2) {
                    rooms[roomId].restartVotes = 0;
                    io.to(roomId).emit('resetBoard');
                } else {
                    socket.to(roomId).emit('playerWantsRestart');
                }
            }
        });

        socket.on('disconnect', () => {
            if (rooms[roomId]) {
                rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));
