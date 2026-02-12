"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, Square, Upload, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRandomTopic } from "@/lib/mock-data"

interface AIFeedback {
  confidenceScore: number
  parasiteWords: { word: string; count: number }[]
  tips: string[]
  summary: string
}

export function VoiceRecorder() {
  const [topic, setTopic] = useState(getRandomTopic)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch {
      console.error("Microphone access denied")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioBlob(file)
      setFeedback(null)
    }
  }, [])

  const analyzeAudio = useCallback(async () => {
    if (!audioBlob) return
    setIsAnalyzing(true)
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setFeedback({
      confidenceScore: Math.round((Math.random() * 3 + 6.5) * 10) / 10,
      parasiteWords: [
        { word: "um", count: Math.floor(Math.random() * 8) + 1 },
        { word: "like", count: Math.floor(Math.random() * 6) + 1 },
        { word: "you know", count: Math.floor(Math.random() * 4) },
        { word: "so", count: Math.floor(Math.random() * 5) + 1 },
        { word: "basically", count: Math.floor(Math.random() * 3) },
      ].filter((w) => w.count > 0),
      tips: [
        "Try pausing instead of using filler words",
        "Vary your tone to emphasize key points",
        "Slow down slightly at transitions between ideas",
        "Your opening was strong - maintain that energy throughout",
      ],
      summary:
        "Good effort! Your speech had a clear structure and the main points came through well. Focus on reducing filler words during transitions and you'll see a significant improvement in perceived confidence.",
    })
    setIsAnalyzing(false)
  }, [audioBlob])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setFeedback(null)
    setRecordingTime(0)
    setTopic(getRandomTopic())
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Voice Analysis
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record your speech or upload an audio file for AI feedback
        </p>
      </div>

      {/* Topic Card */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your Topic
          </p>
          <button
            onClick={() => setTopic(getRandomTopic())}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            New topic
          </button>
        </div>
        <p className="mt-2 text-lg font-medium text-foreground leading-relaxed">
          {topic}
        </p>
      </div>

      {/* Recording Area */}
      {!feedback && (
        <div className="mb-6 flex flex-col items-center rounded-xl border border-border bg-card p-8">
          {!audioBlob ? (
            <>
              <div className="relative mb-6">
                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                    <div className="absolute inset-[-8px] rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                  </>
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </button>
              </div>

              {isRecording ? (
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {formatTime(recordingTime)}
                  </p>
                  <p className="mt-1 text-sm text-destructive">Recording...</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Tap to start recording
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-3 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload audio file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload audio file"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Mic className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Audio ready for analysis
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {recordingTime > 0 ? `${formatTime(recordingTime)} recorded` : "File uploaded"}
              </p>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" onClick={reset} className="border-border text-muted-foreground hover:text-foreground">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Re-record
                </Button>
                <Button
                  onClick={analyzeAudio}
                  disabled={isAnalyzing}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze with AI"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confidence Score
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-primary">
                    {feedback.confidenceScore}
                  </span>
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/30">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${feedback.confidenceScore * 10}%, hsl(var(--secondary)) 0%)`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
                    <span className="text-sm font-bold text-foreground">
                      {Math.round(feedback.confidenceScore * 10)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parasite Words */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Filler Words Detected
            </p>
            <div className="flex flex-wrap gap-2">
              {feedback.parasiteWords.map((w) => (
                <div
                  key={w.word}
                  className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {`"${w.word}"`}
                  </span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {w.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              AI Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {feedback.summary}
            </p>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Tips for Improvement
            </p>
            <ul className="flex flex-col gap-3">
              {feedback.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={reset}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Start New Session
          </Button>
        </div>
      )}
    </div>
  )
}
