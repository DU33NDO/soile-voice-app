import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import Message from "@/lib/models/Message"
import Friendship from "@/lib/models/Friendship"
import { getAuthUserId } from "@/lib/auth"

async function verifyFriendship(
  userObjId: mongoose.Types.ObjectId,
  friendObjId: mongoose.Types.ObjectId
) {
  return Friendship.findOne({
    $or: [
      { requester: userObjId, recipient: friendObjId },
      { requester: friendObjId, recipient: userObjId },
    ],
    status: "accepted",
  })
}

// GET — fetch message history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { friendId } = await params
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const before = searchParams.get("before")

    await connectDB()

    const userObjId = new mongoose.Types.ObjectId(userId)
    const friendObjId = new mongoose.Types.ObjectId(friendId)

    const friendship = await verifyFriendship(userObjId, friendObjId)
    if (!friendship) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 })
    }

    const query: Record<string, unknown> = {
      $or: [
        { senderId: userObjId, receiverId: friendObjId },
        { senderId: friendObjId, receiverId: userObjId },
      ],
    }

    if (before) {
      query.timestamp = { $lt: new Date(before) }
    }

    const messages = await Message.find(query).sort({ timestamp: -1 }).limit(limit)

    // Mark messages from friend as read
    await Message.updateMany(
      { senderId: friendObjId, receiverId: userObjId, read: false },
      { read: true }
    )

    return NextResponse.json({
      messages: messages.reverse().map((m) => ({
        id: m._id.toString(),
        senderId: m.senderId.toString(),
        receiverId: m.receiverId.toString(),
        text: m.text,
        timestamp: m.timestamp,
        read: m.read,
      })),
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — send a message (REST fallback; prefer Socket.IO for real-time)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { friendId } = await params
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 })
    }

    await connectDB()

    const userObjId = new mongoose.Types.ObjectId(userId)
    const friendObjId = new mongoose.Types.ObjectId(friendId)

    const friendship = await verifyFriendship(userObjId, friendObjId)
    if (!friendship) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 })
    }

    const message = await Message.create({
      senderId: userObjId,
      receiverId: friendObjId,
      text: text.trim(),
    })

    return NextResponse.json(
      {
        message: {
          id: message._id.toString(),
          senderId: userId,
          receiverId: friendId,
          text: message.text,
          timestamp: message.timestamp,
          read: false,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
