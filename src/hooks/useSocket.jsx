import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useCustomToast } from '@/hooks/useCustomToast';
import { handleSocketError, ErrorTypes } from '@/lib/errorHandler';


export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState(null);
    const [onlinePhase, setOnlinePhase] = useState(null);
    const [onlineGameData, setOnlineGameData] = useState(null);
    const [votedPlayers, setVotedPlayers] = useState([]);
    const [voteResults, setVoteResults] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const toast = useCustomToast();

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
                console.log('Room created:', roomData.code);
                setRoom(roomData);
                toast.success('Room Created', `Room code: ${roomData.code}`);
            });

            newSocket.on('room-updated', (roomData) => {
                console.log('Room updated');
                setRoom(roomData);
            });

            // Game events
            newSocket.on('game-started', (data) => {
                console.log('Game started, role:', data.role);
                setOnlineGameData(data);
                setOnlinePhase('reveal');
                toast.success('Game Started', `You are the ${data.role}!`);
            });

            newSocket.on('phase-updated', (phase) => {
                console.log('Phase updated:', phase);
                setOnlinePhase(phase);
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
                } else if (errorData?.message) {
                    // New error object format
                    console.error('Server error:', errorData);
                    toast.error(
                        'Error',
                        errorData.message || 'An unexpected error occurred'
                    );
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
            resetGame
        }}>
            {children}
        </SocketContext.Provider>
    );
};
