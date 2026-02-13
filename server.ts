import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { setIO } from "./lib/socket"
import { connectDB } from "./lib/db"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

interface JWTPayload {
  userId: string
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Read JWT_SECRET here — AFTER app.prepare() so Next.js has loaded .env.local
  // into process.env. Reading it at the top level causes a mismatch with API routes.
  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error handling request:", err)
      res.statusCode = 500
      res.end("Internal Server Error")
    }
  })

  const io = new SocketIOServer(httpServer, {
    cors: {
      // Mirror the request origin — works for any domain (localhost, Railway, custom)
      origin: true,
      credentials: true,
    },
  })

  setIO(io)

  // Track userId -> socketId for targeted delivery
  const userSocketMap = new Map<string, string>()

  io.use((socket, next) => {
    // Read auth-token from cookie header (browser sends it automatically)
    const cookieHeader = socket.handshake.headers.cookie || ""
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=")
        return [key.trim(), val.join("=")]
      })
    )
    const token = cookies["auth-token"]

    if (!token) {
      return next(new Error("Authentication required"))
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error("Invalid token"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string
    userSocketMap.set(userId, socket.id)
    socket.join(`user:${userId}`)

    console.log(`User ${userId} connected (socket ${socket.id})`)

    // Notify others that this user came online
    socket.broadcast.emit("user-status", { userId, online: true })

    socket.on(
      "send-message",
      async (data: { receiverId: string; text: string; tempId: string }) => {
        const timestamp = new Date()

        // Persist to MongoDB so history survives page refreshes
        let savedId: string = data.tempId
        try {
          await connectDB()
          // Lazy-require the model to avoid circular import issues with Next.js
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Message = (require("./lib/models/Message").default) as {
            create: (doc: {
              senderId: mongoose.Types.ObjectId
              receiverId: mongoose.Types.ObjectId
              text: string
              timestamp: Date
            }) => Promise<{ _id: mongoose.Types.ObjectId }>
          }
          const msg = await Message.create({
            senderId: new mongoose.Types.ObjectId(userId),
            receiverId: new mongoose.Types.ObjectId(data.receiverId),
            text: data.text,
            timestamp,
          })
          savedId = msg._id.toString()
        } catch (err) {
          console.error("Failed to persist message:", err)
        }

        const messagePayload = {
          id: savedId,
          senderId: userId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: timestamp.toISOString(),
          tempId: data.tempId,
        }

        // Deliver to recipient if online
        io.to(`user:${data.receiverId}`).emit("new-message", messagePayload)

        // Confirm to sender with the real DB id
        socket.emit("message-sent", {
          ...messagePayload,
          delivered: userSocketMap.has(data.receiverId),
        })
      }
    )

    socket.on("disconnect", () => {
      userSocketMap.delete(userId)
      console.log(`User ${userId} disconnected`)
      socket.broadcast.emit("user-status", { userId, online: false })
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
