"use client"

import { useMemo } from "react"
import { Trophy, TrendingUp, Flame } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { friends } from "@/lib/mock-data"

export function LeaderboardPage() {
  const { user } = useAuth()

  const leaderboard = useMemo(() => {
    const allUsers = [
      ...(user
        ? [
            {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              score: user.score,
              sessions: user.sessions,
              isMe: true,
            },
          ]
        : []),
      ...friends.map((f) => ({
        id: f.id,
        name: f.name,
        avatar: f.avatar,
        score: f.score,
        sessions: f.sessions,
        isMe: false,
      })),
    ].sort((a, b) => b.score - a.score)

    return allUsers
  }, [user])

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Leaderboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          See how you rank among your friends
        </p>
      </div>

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
              } ${entry.isMe ? "ring-1 ring-primary/50" : ""}`}
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                {rank === 1 ? (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                ) : rank === 2 ? (
                  <span className="text-xs font-bold text-muted-foreground">
                    2
                  </span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    3
                  </span>
                )}
              </div>
              <Avatar className="h-12 w-12 mb-2">
                <AvatarFallback
                  className={`text-sm font-medium ${
                    entry.isMe
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {entry.avatar}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-foreground text-center truncate w-full">
                {entry.isMe ? "You" : entry.name.split(" ")[0]}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {entry.score}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {entry.sessions} sessions
              </p>
            </div>
          )
        })}
      </div>

      {/* Rest of the leaderboard */}
      <div className="flex flex-col gap-2">
        {rest.map((entry, i) => {
          const rank = i + 4
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 ${
                entry.isMe ? "ring-1 ring-primary/50" : ""
              }`}
            >
              <span className="w-6 text-center text-sm font-mono text-muted-foreground">
                {rank}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  className={`text-sm ${
                    entry.isMe
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {entry.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {entry.isMe ? `${entry.name} (You)` : entry.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.sessions} sessions
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {entry.score}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {leaderboard.length}
          </p>
          <p className="text-xs text-muted-foreground">Total Members</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {(
              leaderboard.reduce((acc, u) => acc + u.score, 0) /
              leaderboard.length
            ).toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Average Score</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card p-4 text-center md:col-span-1">
          <p className="text-2xl font-bold text-foreground">
            {leaderboard.reduce((acc, u) => acc + u.sessions, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Total Sessions</p>
        </div>
      </div>
    </div>
  )
}
