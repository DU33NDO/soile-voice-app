import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import Analysis from "@/lib/models/Analysis"
import { getAuthUserId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    await connectDB()

    const [sessions, total] = await Promise.all([
      Analysis.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Analysis.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ])

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        topic: s.topic,
        transcript: s.transcript,
        speechLang: s.speechLang ?? "en",
        confidenceScore: s.confidenceScore,
        parasiteWords: s.parasiteWords.map((w) => ({
          word: w.word,
          count: w.count,
          suggestion: w.suggestion ?? "",
        })),
        tips: s.tips,
        summary: s.summary,
        createdAt: s.createdAt,
      })),
      total,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
