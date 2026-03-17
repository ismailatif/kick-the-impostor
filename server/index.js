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

// ================== Error Handling ==================

const ErrorTypes = {
    ROOM_NOT_FOUND: 'Room not found',
    GAME_IN_PROGRESS: 'Game already in progress',
    ROOM_FULL: 'Room is full',
    NOT_HOST: 'Only the host can perform this action',
    INVALID_INPUT: 'Invalid input provided',
    INSUFFICIENT_PLAYERS: 'At least 3 players are required to start the game'
};

// Validation helpers
function validatePlayerName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 20;
}

function validateRoomCode(code) {
    if (!code || typeof code !== 'string') return false;
    const trimmed = code.trim().toUpperCase();
    return /^[A-Z0-9]{4}$/.test(trimmed);
}

function validateGameData(gameData) {
    if (!gameData) return false;
    return gameData.secretWord && 
           Array.isArray(gameData.impostorIndices) && 
           gameData.category;
}

// Safe error emission
function emitError(socket, errorMessage, errorCode = null) {
    console.error(`[Error] ${errorMessage}`);
    socket.emit('error', {
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
    });
}

// Safe room update broadcast
function broadcastRoomUpdate(code, room) {
    try {
        io.to(code).emit('room-updated', room);
    } catch (error) {
        console.error(`Failed to broadcast room update for ${code}:`, error);
    }
}

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

    // ================== Create Room ==================
    socket.on('create-room', ({ playerName }) => {
        try {
            // Validate input
            if (!validatePlayerName(playerName)) {
                return emitError(socket, ErrorTypes.INVALID_INPUT, 'INVALID_PLAYER_NAME');
            }

            let code = generateRoomCode();
            while (rooms.has(code)) {
                code = generateRoomCode();
            }

            const roomData = {
                code,
                hostId: socket.id,
                players: [{ id: socket.id, name: playerName.trim(), ready: false }],
                settings: {
                    impostorCount: 1,
                    hasTimer: true,
                    impostorHint: true,
                    chaosMode: false,
                    categories: []
                },
                status: 'lobby',
                gameData: null,
                createdAt: new Date().toISOString()
            };

            rooms.set(code, roomData);
            socket.join(code);
            socket.emit('room-created', roomData);
            console.log(`Room created: ${code}`);
        } catch (error) {
            console.error('Error in create-room:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Join Room ==================
    socket.on('join-room', ({ code, playerName }) => {
        try {
            // Validate input
            if (!validateRoomCode(code)) {
                return emitError(socket, 'Invalid room code format', 'INVALID_ROOM_CODE');
            }

            if (!validatePlayerName(playerName)) {
                return emitError(socket, ErrorTypes.INVALID_INPUT, 'INVALID_PLAYER_NAME');
            }

            const room = rooms.get(code.toUpperCase());
            
            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.status === 'playing') {
                return emitError(socket, ErrorTypes.GAME_IN_PROGRESS, 'GAME_IN_PROGRESS');
            }

            if (room.players.length >= 20) {
                return emitError(socket, ErrorTypes.ROOM_FULL, 'ROOM_FULL');
            }

            // Check for duplicate player names
            if (room.players.some(p => p.name === playerName.trim())) {
                return emitError(socket, 'Player name already taken', 'DUPLICATE_NAME');
            }

            room.players.push({ id: socket.id, name: playerName.trim(), ready: false });
            socket.join(code);
            broadcastRoomUpdate(code, room);
            console.log(`Player ${playerName} joined room ${code}`);
        } catch (error) {
            console.error('Error in join-room:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Update Settings ==================
    socket.on('update-settings', ({ code, settings }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.hostId !== socket.id) {
                return emitError(socket, ErrorTypes.NOT_HOST, 'NOT_HOST');
            }

            // Validate settings
            if (settings.impostorCount && (settings.impostorCount < 1 || settings.impostorCount > 2)) {
                return emitError(socket, 'Invalid impostor count', 'INVALID_SETTINGS');
            }

            room.settings = { ...room.settings, ...settings };
            broadcastRoomUpdate(code, room);
            console.log(`Settings updated for room ${code}`);
        } catch (error) {
            console.error('Error in update-settings:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Set Ready ==================
    socket.on('set-ready', ({ code, ready }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            const player = room.players.find(p => p.id === socket.id);

            if (!player) {
                return emitError(socket, 'Player not in room', 'PLAYER_NOT_FOUND');
            }

            player.ready = Boolean(ready);
            broadcastRoomUpdate(code, room);
        } catch (error) {
            console.error('Error in set-ready:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Start Game ==================
    socket.on('start-game', ({ code, gameData }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.hostId !== socket.id) {
                return emitError(socket, ErrorTypes.NOT_HOST, 'NOT_HOST');
            }

            if (room.players.length < 3) {
                return emitError(socket, ErrorTypes.INSUFFICIENT_PLAYERS, 'INSUFFICIENT_PLAYERS');
            }

            if (!room.players.every(p => p.ready || p.id === room.hostId)) {
                return emitError(socket, 'Not all players are ready', 'NOT_ALL_READY');
            }

            if (!validateGameData(gameData)) {
                return emitError(socket, ErrorTypes.INVALID_INPUT, 'INVALID_GAME_DATA');
            }

            room.status = 'playing';
            room.gameData = gameData;
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

            console.log(`Game started in room ${code}`);
        } catch (error) {
            console.error('Error in start-game:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Reset Game ==================
    socket.on('reset-game', ({ code }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.hostId !== socket.id) {
                return emitError(socket, ErrorTypes.NOT_HOST, 'NOT_HOST');
            }

            room.status = 'lobby';
            room.gameData = null;
            room.votes = {};
            room.players.forEach(p => p.ready = false);

            broadcastRoomUpdate(code, room);
            io.to(code).emit('game-reset');
            console.log(`Game reset to lobby for room ${code}`);
        } catch (error) {
            console.error('Error in reset-game:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Sync Phase ==================
    socket.on('sync-phase', ({ code, phase }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.hostId !== socket.id) {
                return emitError(socket, ErrorTypes.NOT_HOST, 'NOT_HOST');
            }

            io.to(code).emit('phase-updated', phase);
        } catch (error) {
            console.error('Error in sync-phase:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Sync Timer ==================
    socket.on('update-timer', ({ code, timeLeft }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.hostId !== socket.id) {
                return emitError(socket, ErrorTypes.NOT_HOST, 'NOT_HOST');
            }

            io.to(code).emit('timer-updated', timeLeft);
        } catch (error) {
            console.error('Error in update-timer:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Submit Vote ==================
    socket.on('submit-vote', ({ code, votedIndex }) => {
        try {
            const room = rooms.get(code);

            if (!room) {
                return emitError(socket, ErrorTypes.ROOM_NOT_FOUND, 'ROOM_NOT_FOUND');
            }

            if (room.status !== 'playing') {
                return emitError(socket, 'Game is not in progress', 'GAME_NOT_PLAYING');
            }

            // Validate vote index
            if (typeof votedIndex !== 'number' || votedIndex < 0 || votedIndex >= room.players.length) {
                return emitError(socket, 'Invalid vote index', 'INVALID_VOTE_INDEX');
            }

            // Check if already voted
            if (room.votes && room.votes[socket.id] !== undefined) {
                return emitError(socket, 'You have already voted', 'ALREADY_VOTED');
            }

            if (!room.votes) {
                room.votes = {};
            }

            // Record the vote
            room.votes[socket.id] = votedIndex;

            const totalPlayers = room.players.length;
            const votesCount = Object.keys(room.votes).length;

            // Broadcast that this player's vote was recorded
            io.to(code).emit('vote-recorded', { playerId: socket.id, votedIndex });

            // If everyone has voted, calculate results
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
                console.log(`Vote results for room ${code}:`, resultPayload);
            }
        } catch (error) {
            console.error('Error in submit-vote:', error);
            emitError(socket, ErrorTypes.INVALID_INPUT);
        }
    });

    // ================== Disconnect ==================
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const playerName = room.players[playerIndex].name;
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    rooms.delete(code);
                    console.log(`Room ${code} deleted (empty)`);
                } else {
                    if (room.hostId === socket.id) {
                        room.hostId = room.players[0].id;
                        console.log(`New host for room ${code}: ${room.players[0].name}`);
                    }
                    broadcastRoomUpdate(code, room);
                }
                console.log(`Player ${playerName} left room ${code}`);
                break;
            }
        }
    });

    // ================== Error Handler ==================
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
