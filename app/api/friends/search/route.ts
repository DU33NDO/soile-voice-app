import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import Friendship from "@/lib/models/Friendship"
import { getAuthUserId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const query = new URL(req.url).searchParams.get("q")?.trim()
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    await connectDB()

    const userObjId = new mongoose.Types.ObjectId(userId)

    const users = await User.find({
      _id: { $ne: userObjId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(10)

    if (users.length === 0) return NextResponse.json({ users: [] })

    const userIds = users.map((u) => u._id)
    const friendships = await Friendship.find({
      $or: [
        { requester: userObjId, recipient: { $in: userIds } },
        { recipient: userObjId, requester: { $in: userIds } },
      ],
    })

    const statusMap = new Map<string, string>()
    friendships.forEach((f) => {
      const otherId =
        f.requester.toString() === userId
          ? f.recipient.toString()
          : f.requester.toString()
      statusMap.set(otherId, f.status)
    })

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        avatar: u.avatar,
        score: u.score,
        sessions: u.sessions,
        friendshipStatus: statusMap.get(u._id.toString()) ?? "none",
      })),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
