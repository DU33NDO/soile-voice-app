import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import Friendship from "@/lib/models/Friendship"
import { getAuthUserId } from "@/lib/auth"

// GET — list pending invitations received by the current user
export async function GET() {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const invitations = await Friendship.find({
      recipient: new mongoose.Types.ObjectId(userId),
      status: "pending",
    }).populate("requester", "name avatar score sessions")

    return NextResponse.json({
      invitations: invitations.map((inv) => {
        const requester = inv.requester as unknown as {
          _id: mongoose.Types.ObjectId
          name: string
          avatar: string
          score: number
          sessions: number
        }
        return {
          id: inv._id.toString(),
          from: {
            id: requester._id.toString(),
            name: requester.name,
            avatar: requester.avatar,
            score: requester.score,
            sessions: requester.sessions,
          },
          createdAt: inv.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — send a friend invitation
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId } = await req.json()
    if (!recipientId) {
      return NextResponse.json({ error: "recipientId is required" }, { status: 400 })
    }

    if (recipientId === userId) {
      return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 })
    }

    await connectDB()

    const recipientExists = await User.exists({ _id: recipientId })
    if (!recipientExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const requesterObjId = new mongoose.Types.ObjectId(userId)
    const recipientObjId = new mongoose.Types.ObjectId(recipientId)

    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterObjId, recipient: recipientObjId },
        { requester: recipientObjId, recipient: requesterObjId },
      ],
    })

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 409 })
      }
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Invitation already sent" }, { status: 409 })
      }
      // Re-invite after decline
      existing.status = "pending"
      existing.requester = requesterObjId
      existing.recipient = recipientObjId
      await existing.save()
      return NextResponse.json({ message: "Invitation sent" })
    }

    await Friendship.create({
      requester: requesterObjId,
      recipient: recipientObjId,
    })

    return NextResponse.json({ message: "Invitation sent" }, { status: 201 })
  } catch (error) {
    console.error("Send invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH — accept or decline an invitation
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invitationId, action } = await req.json()
    if (!invitationId || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "invitationId and action (accept|decline) are required" },
        { status: 400 }
      )
    }

    await connectDB()

    const invitation = await Friendship.findOne({
      _id: invitationId,
      recipient: new mongoose.Types.ObjectId(userId),
      status: "pending",
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    invitation.status = action === "accept" ? "accepted" : "declined"
    await invitation.save()

    return NextResponse.json({ message: `Invitation ${invitation.status}` })
  } catch (error) {
    console.error("Respond invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
