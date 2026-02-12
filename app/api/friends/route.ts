import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import Friendship from "@/lib/models/Friendship"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userObjId = new mongoose.Types.ObjectId(userId)

    const friendships = await Friendship.find({
      $or: [{ requester: userObjId }, { recipient: userObjId }],
      status: "accepted",
    })

    const friendIds = friendships.map((f) =>
      f.requester.toString() === userId ? f.recipient : f.requester
    )

    const friends = await User.find({ _id: { $in: friendIds } }).select("-password")

    return NextResponse.json({
      friends: friends.map((f) => ({
        id: f._id.toString(),
        name: f.name,
        avatar: f.avatar,
        score: f.score,
        sessions: f.sessions,
        online: false,
      })),
    })
  } catch (error) {
    console.error("Friends list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
