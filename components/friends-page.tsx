"use client"

import { useState, useMemo } from "react"
import { Search, UserPlus, Check, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { friends, searchUsers, type SearchUser } from "@/lib/mock-data"

interface FriendsPageProps {
  onOpenChat: (friendId: string) => void
}

export function FriendsPage({ onOpenChat }: FriendsPageProps) {
  const [query, setQuery] = useState("")
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())

  const isSearching = query.length > 0

  const filteredFriends = useMemo(() => {
    if (!query) return friends
    return friends.filter((f) =>
      f.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    return searchUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) && !u.isFriend
    )
  }, [query, isSearching])

  const handleInvite = (user: SearchUser) => {
    setInvitedIds((prev) => new Set(prev).add(user.id))
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Friends
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect with friends and practice together
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends or find new people..."
          className="bg-card border-border pl-10 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            People
          </p>
          <div className="flex flex-col gap-2">
            {searchResults.map((user) => (
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
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                </div>
                {invitedIds.has(user.id) ? (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Check className="h-3 w-3" />
                    Invited
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInvite(user)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    Invite
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
          {isSearching ? "Your friends" : `Friends (${friends.length})`}
        </p>
        <div className="flex flex-col gap-2">
          {filteredFriends.map((friend) => (
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
                  <p className="text-sm font-medium text-foreground">
                    {friend.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score: {friend.score} / {friend.sessions} sessions
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
          {filteredFriends.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isSearching
                  ? "No friends match your search"
                  : "No friends yet. Search to find people!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
