const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

// Helper to generate room code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', ({ playerName }) => {
        let code = generateRoomCode();
        while (rooms.has(code)) {
            code = generateRoomCode();
        }

        const roomData = {
            code,
            hostId: socket.id,
            players: [{ id: socket.id, name: playerName, ready: false }],
            settings: {
                impostorCount: 1,
                hasTimer: true,
                impostorHint: true,
                chaosMode: false,
                categories: []
            },
            status: 'lobby', // lobby, playing, result
            gameData: null
        };

        rooms.set(code, roomData);
        socket.join(code);
        socket.emit('room-created', roomData);
    });

    socket.on('join-room', ({ code, playerName }) => {
        const room = rooms.get(code.toUpperCase());
        if (!room) {
            return socket.emit('error', 'Room not found');
        }
        if (room.status !== 'lobby') {
            return socket.emit('error', 'Game already in progress');
        }
        if (room.players.length >= 20) {
            return socket.emit('error', 'Room is full');
        }

        room.players.push({ id: socket.id, name: playerName, ready: false });
        socket.join(code);
        io.to(code).emit('room-updated', room);
    });

    socket.on('update-settings', ({ code, settings }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
            room.settings = settings;
            io.to(code).emit('room-updated', room);
        }
    });

    socket.on('set-ready', ({ code, ready }) => {
        const room = rooms.get(code);
        if (room) {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.ready = ready;
                io.to(code).emit('room-updated', room);
            }
        }
    });

    socket.on('start-game', ({ code, gameData }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
            room.status = 'playing';
            room.gameData = gameData; // { secretWord, impostorIndices, category }
            room.votes = {};

            // Send individual roles privately
            room.players.forEach((player, index) => {
                const isImpostor = gameData.impostorIndices.includes(index);
                io.to(player.id).emit('game-started', {
                    role: isImpostor ? 'impostor' : 'citizen',
                    secretWord: isImpostor ? null : gameData.secretWord,
                    category: gameData.category,
                    players: room.players.map(p => p.name)
                });
            });
        }
    });

    socket.on('sync-phase', ({ code, phase }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
            io.to(code).emit('phase-updated', phase);
        }
    });

    socket.on('submit-vote', ({ code, votedIndex }) => {
        const room = rooms.get(code);
        if (room && room.status === 'playing') {
            if (!room.votes) {
                room.votes = {};
            }

            // Record the vote by socket id (one vote per player)
            room.votes[socket.id] = votedIndex;

            const totalPlayers = room.players.length;
            const votesCount = Object.keys(room.votes).length;

            // Broadcast that this player's vote was recorded
            io.to(code).emit('vote-recorded', { playerId: socket.id, votedIndex });

            // If everyone has voted, calculate results and broadcast them
            if (votesCount === totalPlayers && room.gameData) {
                const tally = {};
                Object.values(room.votes).forEach((idx) => {
                    if (typeof idx === 'number') {
                        tally[idx] = (tally[idx] || 0) + 1;
                    }
                });

                const impostorIndices = room.gameData.impostorIndices || [];
                const impostorNames = impostorIndices
                    .map((i) => room.players[i]?.name)
                    .filter(Boolean);

                let maxVotes = 0;
                let mostVotedIndices = [];
                Object.entries(tally).forEach(([idx, count]) => {
                    const countNum = Number(count);
                    const idxNum = Number(idx);
                    if (countNum > maxVotes) {
                        maxVotes = countNum;
                        mostVotedIndices = [idxNum];
                    } else if (countNum === maxVotes) {
                        mostVotedIndices.push(idxNum);
                    }
                });

                const impostorCaught = mostVotedIndices.some((idx) =>
                    impostorIndices.includes(idx)
                );

                room.status = 'result';

                const resultPayload = {
                    tally,
                    mostVotedIndices,
                    impostorIndices,
                    impostorNames,
                    impostorCaught,
                    players: room.players.map((p) => p.name),
                    secretWord: room.gameData.secretWord,
                    category: room.gameData.category,
                };

                io.to(code).emit('vote-results', resultPayload);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms.delete(code);
                } else {
                    if (room.hostId === socket.id) {
                        room.hostId = room.players[0].id;
                    }
                    io.to(code).emit('room-updated', room);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
