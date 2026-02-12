import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import Analysis from "@/lib/models/Analysis"
import { getAuthUserId } from "@/lib/auth"
import { transcribeAudio, analyzeTranscript } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const topic = formData.get("topic") as string | null
    // "lang" is the Whisper ISO code (en / ru / kk), "uiLang" is en / ru / kz
    const lang = (formData.get("lang") as string | null) ?? "en"
    const uiLang = (formData.get("uiLang") as string | null) ?? "en"

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    // Transcribe audio with OpenAI Whisper (language-aware)
    const transcript = await transcribeAudio(audioFile, lang)

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "Could not transcribe audio. Please speak clearly and try again." },
        { status: 422 }
      )
    }

    // Analyze transcript with GPT (respond in user's UI language)
    const feedback = await analyzeTranscript(transcript, topic, uiLang)

    await connectDB()

    // Persist the analysis
    const analysis = await Analysis.create({
      userId,
      topic,
      transcript,
      speechLang: lang,
      confidenceScore: feedback.confidenceScore,
      parasiteWords: feedback.parasiteWords,
      tips: feedback.tips,
      summary: feedback.summary,
    })

    // Update user score (rolling average) and session count
    const user = await User.findById(userId)
    if (user) {
      const newSessions = user.sessions + 1
      const newScore =
        ((user.score * user.sessions) + feedback.confidenceScore) / newSessions
      await User.findByIdAndUpdate(userId, {
        sessions: newSessions,
        score: Math.round(newScore * 10) / 10,
      })
    }

    return NextResponse.json({
      analysisId: analysis._id.toString(),
      transcript,
      ...feedback,
    })
  } catch (error) {
    console.error("Voice analyze error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
