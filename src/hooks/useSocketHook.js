import { useContext } from 'react';
import { SocketContext } from './useSocket';

export const useSocket = () => useContext(SocketContext);
