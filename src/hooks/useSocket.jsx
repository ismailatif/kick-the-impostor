import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext();


export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState(null);
    const [onlinePhase, setOnlinePhase] = useState(null);
    const [onlineGameData, setOnlineGameData] = useState(null);
    const [votedPlayers, setVotedPlayers] = useState([]);
    const [voteResults, setVoteResults] = useState(null);

    useEffect(() => {
        const newSocket = io("http://10.90.186.124:3001");
        setSocket(newSocket);

        newSocket.on('room-created', (roomData) => {
            setRoom(roomData);
        });

        newSocket.on('room-updated', (roomData) => {
            setRoom(roomData);
        });

        newSocket.on('game-started', (data) => {
            setOnlineGameData(data);
            setOnlinePhase('reveal');
        });

        newSocket.on('phase-updated', (phase) => {
            setOnlinePhase(phase);
        });

        newSocket.on('vote-recorded', ({ playerId }) => {
            setVotedPlayers(prev => [...prev, playerId]);
        });

        newSocket.on('vote-results', (data) => {
            setVoteResults(data);
            setOnlinePhase('result');
        });

        newSocket.on('error', (msg) => {
            toast.error(msg);
        });

        return () => newSocket.close();
    }, []);

    const createRoom = useCallback((playerName) => {
        socket?.emit('create-room', { playerName });
    }, [socket]);

    const joinRoom = useCallback((code, playerName) => {
        socket?.emit('join-room', { code, playerName });
    }, [socket]);

    const updateSettings = useCallback((code, settings) => {
        socket?.emit('update-settings', { code, settings });
    }, [socket]);

    const setReady = useCallback((code, ready) => {
        socket?.emit('set-ready', { code, ready });
    }, [socket]);

    const startGame = useCallback((code, gameData) => {
        socket?.emit('start-game', { code, gameData });
    }, [socket]);

    const syncPhase = useCallback((code, phase) => {
        socket?.emit('sync-phase', { code, phase });
    }, [socket]);

    const submitVote = useCallback((code, votedIndex) => {
        socket?.emit('submit-vote', { code, votedIndex });
    }, [socket]);

    return (
        <SocketContext.Provider value={{
            socket,
            room,
            onlinePhase,
            onlineGameData,
            votedPlayers,
            voteResults,
            createRoom,
            joinRoom,
            updateSettings,
            setReady,
            startGame,
            syncPhase,
            submitVote
        }}>
            {children}
        </SocketContext.Provider>
    );
};
