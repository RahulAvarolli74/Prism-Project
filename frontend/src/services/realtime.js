import { io } from 'socket.io-client'

export function createRealtimeClient() {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })
}