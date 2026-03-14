import { useContext } from 'react';
import { SocketContext } from '@/hooks/SocketContext';

export const useSocket = () => useContext(SocketContext);
