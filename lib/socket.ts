import type { Server as SocketIOServer } from "socket.io"

declare global {
  // eslint-disable-next-line no-var
  var _io: SocketIOServer | undefined
}

export function getIO(): SocketIOServer | null {
  return global._io ?? null
}

export function setIO(io: SocketIOServer): void {
  global._io = io
}
