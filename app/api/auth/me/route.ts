import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { getAuthUserId, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(userId).select("-password")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        score: user.score,
        sessions: user.sessions,
      },
    })
  } catch (error) {
    console.error("Me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" })
  response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 })
  return response
}
