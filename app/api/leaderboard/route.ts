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

    const users = await User.find({
      _id: { $in: [userObjId, ...friendIds] },
    }).select("-password")

    const leaderboard = users
      .map((u) => ({
        id: u._id.toString(),
        name: u.name,
        avatar: u.avatar,
        score: u.score,
        sessions: u.sessions,
        isCurrentUser: u._id.toString() === userId,
      }))
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
