"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/context"

interface ParasiteWord {
  word: string
  count: number
  suggestion: string
}

interface Session {
  id: string
  topic: string
  transcript: string
  speechLang: string
  confidenceScore: number
  parasiteWords: ParasiteWord[]
  tips: string[]
  summary: string
  createdAt: string
}

interface HistoryPageProps {
  onPracticeAgain: (topic: string) => void
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "text-green-600 bg-green-50 border-green-200"
      : score >= 5
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-red-600 bg-red-50 border-red-200"
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded-full border px-2.5 py-0.5 text-sm font-bold ${color}`}
    >
      {score}
      <span className="text-xs font-normal opacity-60">/10</span>
    </span>
  )
}

function SessionCard({
  session,
  onPracticeAgain,
}: {
  session: Session
  onPracticeAgain: (topic: string) => void
}) {
  const { t } = useLanguage()
  const [showTranscript, setShowTranscript] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <button
        className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {session.topic}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreBadge score={session.confidenceScore} />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {/* Score row */}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {t.history.score}
            </span>
            <ScoreBadge score={session.confidenceScore} />
          </div>

          {/* Filler words */}
          {session.parasiteWords.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.history.fillerWords}
                </p>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                  {session.parasiteWords.reduce((s, w) => s + w.count, 0)} total
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {session.parasiteWords.map((w) => (
                  <div
                    key={w.word}
                    className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                  >
                    <span className="text-xs font-medium text-foreground shrink-0">&ldquo;{w.word}&rdquo;</span>
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive shrink-0">
                      {w.count}×
                    </span>
                    {w.suggestion && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        → {w.suggestion}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {t.history.summary}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{session.summary}</p>
          </div>

          {/* Tips */}
          {session.tips.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                {t.history.tips}
              </p>
              <ul className="flex flex-col gap-2">
                {session.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript toggle */}
          {session.transcript && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showTranscript ? t.history.hideTranscript : t.history.showTranscript}
                {showTranscript ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showTranscript && (
                <p className="mt-3 rounded-lg bg-secondary p-3 text-xs text-muted-foreground leading-relaxed">
                  {session.transcript}
                </p>
              )}
            </div>
          )}

          {/* Practice Again */}
          <div className="px-5 py-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPracticeAgain(session.topic)}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.history.practiceAgain}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function groupByDate(
  sessions: Session[],
  todayLabel: string,
  yesterdayLabel: string
): { label: string; items: Session[] }[] {
  const groups: Map<string, Session[]> = new Map()
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  for (const s of sessions) {
    const d = new Date(s.createdAt)
    let label: string
    if (d.toDateString() === todayStr) label = todayLabel
    else if (d.toDateString() === yesterdayStr) label = yesterdayLabel
    else
      label = d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(s)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

export function HistoryPage({ onPracticeAgain }: HistoryPageProps) {
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const fetchSessions = useCallback(
    async (off: number, append = false) => {
      if (off === 0) setIsLoading(true)
      else setIsLoadingMore(true)
      try {
        const res = await fetch(`/api/history?limit=${LIMIT}&offset=${off}`)
        const data = await res.json()
        if (res.ok) {
          setSessions((prev) => (append ? [...prev, ...data.sessions] : data.sessions))
          setTotal(data.total)
          setOffset(off + data.sessions.length)
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchSessions(0)
  }, [fetchSessions])

  const grouped = groupByDate(sessions, t.history.today, t.history.yesterday)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t.history.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.history.subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{t.history.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-3">
                {group.items.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onPracticeAgain={onPracticeAgain}
                  />
                ))}
              </div>
            </div>
          ))}

          {sessions.length < total && (
            <Button
              variant="outline"
              onClick={() => fetchSessions(offset, true)}
              disabled={isLoadingMore}
              className="w-full"
            >
              {isLoadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.history.loadMore}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
