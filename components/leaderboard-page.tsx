"use client"

import { useState, useEffect } from "react"
import { Trophy, TrendingUp, Flame, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/i18n/context"

interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  score: number
  sessions: number
  isCurrentUser: boolean
}

export function LeaderboardPage() {
  const { t } = useLanguage()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.leaderboard.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.leaderboard.subtitle}</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t.leaderboard.noFriends}</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[1, 0, 2].map((index) => {
              const entry = topThree[index]
              if (!entry) return <div key={index} />
              const rank = index + 1
              const isFirst = rank === 1
              return (
                <div
                  key={entry.id}
                  className={`flex flex-col items-center rounded-xl border border-border bg-card p-4 ${
                    isFirst ? "md:-mt-4" : ""
                  } ${entry.isCurrentUser ? "ring-1 ring-primary/50" : ""}`}
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    {rank === 1 ? (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                    )}
                  </div>
                  <Avatar className="h-12 w-12 mb-2">
                    <AvatarFallback
                      className={`text-sm font-medium ${
                        entry.isCurrentUser
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {entry.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-foreground text-center truncate w-full">
                    {entry.isCurrentUser ? t.leaderboard.you : entry.name.split(" ")[0]}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-lg font-bold text-primary">{entry.score}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{entry.sessions} {t.leaderboard.sessions}</p>
                </div>
              )
            })}
          </div>

          {/* Rest of the leaderboard */}
          <div className="flex flex-col gap-2">
            {rest.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 ${
                  entry.isCurrentUser ? "ring-1 ring-primary/50" : ""
                }`}
              >
                <span className="w-6 text-center text-sm font-mono text-muted-foreground">
                  {i + 4}
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={`text-sm ${
                      entry.isCurrentUser
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {entry.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {entry.isCurrentUser ? `${entry.name} (${t.leaderboard.you})` : entry.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.sessions} {t.leaderboard.sessions}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-foreground">{entry.score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{leaderboard.length}</p>
              <p className="text-xs text-muted-foreground">{t.leaderboard.totalMembers}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {leaderboard.length > 0
                  ? (
                      leaderboard.reduce((acc, u) => acc + u.score, 0) / leaderboard.length
                    ).toFixed(1)
                  : "0"}
              </p>
              <p className="text-xs text-muted-foreground">{t.leaderboard.avgScore}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-card p-4 text-center md:col-span-1">
              <p className="text-2xl font-bold text-foreground">
                {leaderboard.reduce((acc, u) => acc + u.sessions, 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t.leaderboard.totalSessions}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
