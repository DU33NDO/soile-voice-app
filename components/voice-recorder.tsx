"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, Square, Upload, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage, type Lang, WHISPER_LANG } from "@/lib/i18n/context"
import { TopicPicker } from "@/components/topic-picker"

interface AIFeedback {
  confidenceScore: number
  parasiteWords: { word: string; count: number; suggestion: string }[]
  tips: string[]
  summary: string
  transcript?: string
}

const SPEECH_LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "kz", label: "Қазақша" },
]

interface VoiceRecorderProps {
  initialTopic?: string
}

export function VoiceRecorder({ initialTopic }: VoiceRecorderProps) {
  const { t, lang } = useLanguage()

  const allTopics = t.voice.topicCategories.flatMap((c) => c.topics)

  const [topic, setTopic] = useState<string>(() => {
    if (initialTopic) return initialTopic
    return allTopics[Math.floor(Math.random() * allTopics.length)] ?? ""
  })

  // When initialTopic prop changes (practice-again flow), update topic
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic)
  }, [initialTopic])

  const [speechLang, setSpeechLang] = useState<Lang>(lang)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep speechLang in sync when UI language changes
  useEffect(() => {
    setSpeechLang(lang)
  }, [lang])

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
    try {
      const ext = audioBlob.type.includes("webm") ? "webm" : "mp3"
      const formData = new FormData()
      formData.append(
        "audio",
        new File([audioBlob], `recording.${ext}`, { type: audioBlob.type })
      )
      formData.append("topic", topic)
      formData.append("lang", WHISPER_LANG[speechLang])
      formData.append("uiLang", speechLang)

      const res = await fetch("/api/voice/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")
      setFeedback(data)
    } catch (err) {
      console.error("Analysis error:", err)
      alert(err instanceof Error ? err.message : "Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, topic, speechLang])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setFeedback(null)
    setRecordingTime(0)
    setTopic(allTopics[Math.floor(Math.random() * allTopics.length)] ?? "")
  }, [allTopics])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t.voice.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.voice.subtitle}</p>
      </div>

      {/* Topic Picker */}
      <TopicPicker selectedTopic={topic} onTopicChange={setTopic} />

      {/* Speech Language Selector */}
      {!feedback && !isAnalyzing && (
        <div className="mb-6 flex items-center gap-3">
          <p className="text-xs font-medium text-muted-foreground">{t.voice.speechLang}:</p>
          <div className="flex gap-1">
            {SPEECH_LANGS.map((l) => (
              <button
                key={l.value}
                onClick={() => setSpeechLang(l.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  speechLang === l.value
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analyzing animation */}
      {isAnalyzing && (
        <div className="mb-6 flex flex-col items-center rounded-xl border border-primary/20 bg-card p-10">
          {/* Waveform bars */}
          <div className="mb-6 flex items-end gap-1.5 h-12">
            {[0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15, 0].map((delay, i) => (
              <div
                key={i}
                className="wave-bar w-2 rounded-full bg-primary"
                style={{
                  height: "100%",
                  animationDelay: `${delay}s`,
                  opacity: 0.5 + (1 - Math.abs(i - 4) / 4) * 0.5,
                }}
              />
            ))}
          </div>

          <p className="mb-1 text-sm font-semibold text-foreground">{t.voice.analyzing}</p>
          <p className="mb-5 text-xs text-muted-foreground">{topic}</p>

          {/* Indeterminate progress bar */}
          <div className="w-full max-w-xs overflow-hidden rounded-full bg-secondary h-1.5">
            <div className="animate-progress h-full w-1/3 rounded-full bg-primary" />
          </div>
        </div>
      )}

      {/* Recording Area */}
      {!feedback && !isAnalyzing && (
        <div className="mb-6 flex flex-col items-center rounded-xl border border-border bg-card p-8">
          {!audioBlob ? (
            <>
              <div className="relative mb-6">
                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                    <div
                      className="absolute inset-[-8px] rounded-full bg-primary/10 animate-pulse-ring"
                      style={{ animationDelay: "0.5s" }}
                    />
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
                  <p className="text-sm text-muted-foreground">{t.voice.tapToRecord}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">{t.voice.or}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-3 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t.voice.uploadAudio}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label={t.voice.uploadAudio}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Mic className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{t.voice.audioReady}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {recordingTime > 0
                  ? `${formatTime(recordingTime)} ${t.voice.recorded}`
                  : t.voice.fileUploaded}
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t.voice.reRecord}
                </Button>
                <Button
                  onClick={analyzeAudio}
                  disabled={isAnalyzing}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.voice.analyzing}
                    </>
                  ) : (
                    t.voice.analyzeAI
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
                  {t.voice.confidenceScore}
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
          {feedback.parasiteWords.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.voice.fillerWords}
                </p>
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  {feedback.parasiteWords.reduce((s, w) => s + w.count, 0)} total
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {feedback.parasiteWords.map((w) => (
                  <div
                    key={w.word}
                    className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground shrink-0">
                        &ldquo;{w.word}&rdquo;
                      </span>
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive shrink-0">
                        {w.count}×
                      </span>
                      {w.suggestion && (
                        <span className="truncate text-xs text-muted-foreground">
                          → {w.suggestion}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              {t.voice.aiSummary}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{feedback.summary}</p>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              {t.voice.tipsTitle}
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
            {t.voice.newSession}
          </Button>
        </div>
      )}
    </div>
  )
}
