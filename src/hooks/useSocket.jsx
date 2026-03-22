import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useCustomToast } from '@/hooks/useCustomToast';
import { handleSocketError, ErrorTypes } from '@/lib/errorHandler';
import { SocketContext } from '@/hooks/SocketContext';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState(null);
    const [onlinePhase, setOnlinePhase] = useState(null);
    const [onlineGameData, setOnlineGameData] = useState(null);
    const [votedPlayers, setVotedPlayers] = useState([]);
    const [voteResults, setVoteResults] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const toast = useCustomToast();

    // Auto-rejoin on mount
    useEffect(() => {
        const savedCode = localStorage.getItem('happy-render-room-code');
        const savedName = localStorage.getItem('happy-render-player-name');
        
        if (savedCode && savedName && socket && !room) {
            console.log('Attempting auto-rejoin for:', savedName, 'in room:', savedCode);
            socket.emit('join-room', { code: savedCode, playerName: savedName });
        }
    }, [socket, room]);

    useEffect(() => {
        try {
            const newSocket = io("https://imposter-production-a2ee.up.railway.app/", {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling']
            });

            // Connection events
            newSocket.on('connect', () => {
                console.log('Connected to server');
                setConnectionStatus('connected');
                setSocket(newSocket);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Disconnected:', reason);
                setConnectionStatus('disconnected');
                if (reason === 'io server disconnect') {
                    toast.warning('Disconnected', 'You were disconnected from the server');
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                setConnectionStatus('error');
                toast.error(
                    'Connection Error',
                    'Could not connect to the server. Retrying...'
                );
            });

            // Room events
            newSocket.on('room-created', (roomData) => {
                try {
                    console.log('Room created:', roomData.code);
                    if (!roomData || !roomData.code) {
                        throw new Error('Invalid room data received');
                    }
                    setRoom(roomData);
                    
                    // Persist for re-entry
                    const myPlayer = roomData.players.find(p => p.id === newSocket.id);
                    if (myPlayer) {
                        localStorage.setItem('happy-render-room-code', roomData.code);
                        localStorage.setItem('happy-render-player-name', myPlayer.name);
                    }

                    setTimeout(() => {
                        toast.success('Room Created', `Room code: ${roomData.code}`);
                    }, 0);
                } catch (error) {
                    console.error('Error handling room-created event:', error);
                    toast.error('Error', 'Failed to process room creation');
                }
            });

            newSocket.on('room-updated', (roomData) => {
                try {
                    console.log('Room updated');
                    if (!roomData || !roomData.code) {
                        throw new Error('Invalid room data received in update');
                    }
                    setRoom(roomData);

                    // Persist name/code if we are in the room
                    const myPlayer = roomData.players.find(p => p.id === newSocket.id);
                    if (myPlayer) {
                        localStorage.setItem('happy-render-room-code', roomData.code);
                        localStorage.setItem('happy-render-player-name', myPlayer.name);
                    }
                } catch (error) {
                    console.error('Error handling room-updated event:', error);
                }
            });

            // Game events
            newSocket.on('game-started', (data) => {
                try {
                    console.log('Game started, role:', data.role);
                    if (!data || !data.role) {
                        throw new Error('Invalid game data received');
                    }
                    setOnlineGameData(data);
                    setOnlinePhase('reveal');
                    
                    if (!data.rejoined) {
                        setTimeout(() => {
                            toast.success('Game Started', `You are the ${data.role}!`);
                        }, 0);
                    } else {
                        toast.success('Rejoined Game', `Welcome back, ${data.role}!`);
                    }
                } catch (error) {
                    console.error('Error handling game-started event:', error);
                    toast.error('Error', 'Failed to process game start');
                }
            });

            newSocket.on('phase-updated', (phase) => {
                console.log('Phase updated:', phase);
                setOnlinePhase(phase);
            });

            newSocket.on('game-reset', () => {
                console.log('Game reset triggered by host');
                resetGame();
            });

            // Vote events
            newSocket.on('vote-recorded', ({ playerId }) => {
                console.log('Vote recorded from:', playerId);
                setVotedPlayers(prev => [...new Set([...prev, playerId])]);
            });

            newSocket.on('vote-results', (data) => {
                console.log('Vote results received');
                setVoteResults(data);
                setOnlinePhase('result');

                if (data.impostorCaught) {
                    toast.success(
                        '🎉 Citizens Win!',
                        `The impostor(s) were: ${data.impostorNames.join(', ')}`
                    );
                } else {
                    toast.error(
                        '👻 Impostors Win!',
                        `The secret word was: ${data.secretWord}`
                    );
                }
            });

            // Error handling
            newSocket.on('error', (errorData) => {
                if (typeof errorData === 'string') {
                    // Legacy string errors
                    handleSocketError(errorData, toast);
                    if (errorData.includes('Room not found')) {
                        clearPersistence();
                    }
                } else if (errorData?.message) {
                    // New error object format
                    console.error('Server error:', errorData);
                    toast.error(
                        'Error',
                        errorData.message || 'An unexpected error occurred'
                    );
                    if (errorData.code === 'ROOM_NOT_FOUND') {
                        clearPersistence();
                    }
                } else {
                    handleSocketError(errorData, toast);
                }
            });

            return () => newSocket.close();
        } catch (error) {
            console.error('Socket initialization error:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clearPersistence = useCallback(() => {
        localStorage.removeItem('happy-render-room-code');
        localStorage.removeItem('happy-render-player-name');
    }, []);

    const leaveRoom = useCallback(() => {
        clearPersistence();
        setRoom(null);
        setOnlinePhase(null);
        setOnlineGameData(null);
        setVotedPlayers([]);
        setVoteResults(null);
    }, [clearPersistence]);

    // Room operations with error handling
    const createRoom = useCallback((playerName) => {
        if (!socket) return;
        try {
            if (!playerName || playerName.trim().length === 0) return;
            socket.emit('create-room', { playerName: playerName.trim() });
        } catch (error) {
            console.error('Error creating room:', error);
        }
    }, [socket]);

    const joinRoom = useCallback((code, playerName) => {
        if (!socket) return;
        try {
            const upperCode = code.toUpperCase().trim();
            if (!/^[A-Z0-9]{4}$/.test(upperCode)) return;
            if (!playerName || playerName.trim().length === 0) return;
            socket.emit('join-room', { code: upperCode, playerName: playerName.trim() });
        } catch (error) {
            console.error('Error joining room:', error);
        }
    }, [socket]);

    const updateSettings = useCallback((code, settings) => {
        if (!socket) return;
        try {
            socket.emit('update-settings', { code, settings });
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    }, [socket]);

    const setReady = useCallback((code, ready) => {
        if (!socket) return;
        try {
            socket.emit('set-ready', { code, ready });
        } catch (error) {
            console.error('Error setting ready:', error);
        }
    }, [socket]);

    const startGame = useCallback((code, gameData) => {
        if (!socket) return;
        try {
            if (!gameData || !gameData.secretWord) return;
            socket.emit('start-game', { code, gameData });
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }, [socket]);

    const syncPhase = useCallback((code, phase) => {
        if (!socket) return;
        try {
            socket.emit('sync-phase', { code, phase });
        } catch (error) {
            console.error('Error syncing phase:', error);
        }
    }, [socket]);

    const submitVote = useCallback((code, votedIndex) => {
        if (!socket) return;
        try {
            if (typeof votedIndex !== 'number' || votedIndex < 0) return;
            socket.emit('submit-vote', { code, votedIndex });
        } catch (error) {
            console.error('Error submitting vote:', error);
        }
    }, [socket]);

    const resetGame = useCallback(() => {
        setOnlinePhase(null);
        setOnlineGameData(null);
        setVotedPlayers([]);
        setVoteResults(null);
    }, []);

    const emitResetGame = useCallback((code) => {
        if (!socket) return;
        try {
            socket.emit('reset-game', { code });
        } catch (error) {
            console.error('Error emitting reset-game:', error);
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{
            socket,
            room,
            onlinePhase,
            onlineGameData,
            votedPlayers,
            voteResults,
            connectionStatus,
            createRoom,
            joinRoom,
            updateSettings,
            setReady,
            startGame,
            syncPhase,
            submitVote,
            resetGame,
            emitResetGame,
            leaveRoom
        }}>
            {children}
        </SocketContext.Provider>
    );
};
