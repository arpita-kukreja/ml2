import { io } from 'socket.io-client';

// Single shared socket instance — import this everywhere, never create new ones.
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
  autoConnect: false,
});

export default socket;
