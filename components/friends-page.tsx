"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, UserPlus, Check, MessageCircle, Loader2, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/i18n/context"

interface Friend {
  id: string
  name: string
  avatar: string
  score: number
  sessions: number
  online: boolean
}

interface SearchResult {
  id: string
  name: string
  avatar: string
  score: number
  sessions: number
  friendshipStatus: "none" | "pending" | "accepted" | "declined"
}

interface Invitation {
  id: string
  from: { id: string; name: string; avatar: string; score: number; sessions: number }
  createdAt: string
}

interface FriendsPageProps {
  onOpenChat: (friendId: string) => void
}

export function FriendsPage({ onOpenChat }: FriendsPageProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [showInvitations, setShowInvitations] = useState(false)

  // Load friends list
  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => {})
      .finally(() => setLoadingFriends(false))
  }, [])

  // Load pending invitations
  useEffect(() => {
    fetch("/api/friends/invite")
      .then((r) => r.json())
      .then((d) => setInvitations(d.invitations ?? []))
      .catch(() => {})
  }, [])

  // Search debounce
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/friends/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.users ?? []))
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleInvite = useCallback(async (userId: string) => {
    setInvitingId(userId)
    try {
      await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      })
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: "pending" } : u))
      )
    } catch {
      // ignore
    } finally {
      setInvitingId(null)
    }
  }, [])

  const handleRespondInvite = useCallback(
    async (invitationId: string, action: "accept" | "decline") => {
      await fetch("/api/friends/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      })
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      if (action === "accept") {
        // Refresh friends list
        fetch("/api/friends")
          .then((r) => r.json())
          .then((d) => setFriends(d.friends ?? []))
          .catch(() => {})
      }
    },
    []
  )

  const isSearching = query.length >= 2

  const nonFriendResults = searchResults.filter(
    (u) => u.friendshipStatus !== "accepted"
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.friends.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.friends.subtitle}</p>
        </div>
        {invitations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInvitations((v) => !v)}
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            <span className="ml-1.5">{invitations.length}</span>
          </Button>
        )}
      </div>

      {/* Pending Invitations */}
      {showInvitations && invitations.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.friends.friendRequests}
          </p>
          <div className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {inv.from.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-foreground">{inv.from.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespondInvite(inv.id, "accept")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {t.friends.accept}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRespondInvite(inv.id, "decline")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t.friends.decline}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.friends.searchPlaceholder}
          className="bg-card border-border pl-10 placeholder:text-muted-foreground/50"
        />
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results (non-friends) */}
      {isSearching && nonFriendResults.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.friends.people}
          </p>
          <div className="flex flex-col gap-2">
            {nonFriendResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                </div>
                {user.friendshipStatus === "pending" ? (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Check className="h-3 w-3" />
                    {t.friends.invited}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInvite(user.id)}
                    disabled={invitingId === user.id}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    {invitingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="mr-1 h-4 w-4" />
                        {t.friends.invite}
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isSearching ? t.friends.yourFriends : t.friends.friendsCount(friends.length)}
        </p>
        {loadingFriends ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends
              .filter((f) => !isSearching || f.name.toLowerCase().includes(query.toLowerCase()))
              .map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-secondary text-foreground text-sm">
                          {friend.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {friend.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.friends.scoreLabel}: {friend.score} / {friend.sessions} {t.friends.sessions}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenChat(friend.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            {friends.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">{t.friends.noFriends}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
