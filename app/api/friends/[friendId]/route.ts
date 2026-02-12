import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import Friendship from "@/lib/models/Friendship"
import { getAuthUserId } from "@/lib/auth"

// DELETE — remove a friend
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { friendId } = await params

    await connectDB()

    const userObjId = new mongoose.Types.ObjectId(userId)
    const friendObjId = new mongoose.Types.ObjectId(friendId)

    const result = await Friendship.findOneAndDelete({
      $or: [
        { requester: userObjId, recipient: friendObjId },
        { requester: friendObjId, recipient: userObjId },
      ],
      status: "accepted",
    })

    if (!result) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Friend removed" })
  } catch (error) {
    console.error("Remove friend error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
