"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/i18n/context"
import { io, type Socket } from "socket.io-client"

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Date
  read: boolean
}

interface Friend {
  id: string
  name: string
  avatar: string
  online: boolean
}

interface Conversation {
  friend: Friend
  lastMessage: ChatMessage | null
}

interface ChatPageProps {
  selectedFriendId: string | null
  onSelectFriend: (id: string | null) => void
}

let socketInstance: Socket | null = null

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io("/", {
      withCredentials: true,
      // Connect via WebSocket first — avoids the polling→WS upgrade step
      // that triggers "WebSocket closed before connection established" in dev
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function ChatPage({ selectedFriendId, onSelectFriend }: ChatPageProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [friendInfo, setFriendInfo] = useState<Friend | null>(null)
  const [input, setInput] = useState("")
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Connect to Socket.IO once
  useEffect(() => {
    const socket = getSocket()

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connect error:", err.message)
      // Reset singleton so next mount gets a fresh socket
      if (err.message === "Authentication required" || err.message === "Invalid token") {
        socketInstance = null
      }
    })

    socket.on("new-message", (data: Omit<ChatMessage, "timestamp" | "read"> & { timestamp: string }) => {
      const msg: ChatMessage = {
        ...data,
        timestamp: new Date(data.timestamp),
        read: false,
      }
      setMessages((prev) => [...prev, msg])
      setConversations((prev) => {
        const existing = prev.find((c) => c.friend.id === data.senderId)
        if (existing) {
          return prev.map((c) =>
            c.friend.id === data.senderId ? { ...c, lastMessage: msg } : c
          )
        }
        return prev
      })
    })

    socket.on("user-status", ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        if (online) next.add(userId)
        else next.delete(userId)
        return next
      })
    })

    return () => {
      socket.off("connect_error")
      socket.off("new-message")
      socket.off("user-status")
    }
  }, [])

  // Load all friends and their last message (if any)
  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then(async (d) => {
        const friendsList: Friend[] = d.friends ?? []
        const convos: Conversation[] = await Promise.all(
          friendsList.map(async (f) => {
            try {
              const msgRes = await fetch(`/api/chat/${f.id}?limit=1`)
              if (msgRes.ok) {
                const msgData = await msgRes.json()
                if (msgData.messages?.length > 0) {
                  return {
                    friend: { ...f, online: onlineUsers.has(f.id) },
                    lastMessage: {
                      ...msgData.messages[0],
                      timestamp: new Date(msgData.messages[0].timestamp),
                    },
                  }
                }
              }
            } catch {
              // ignore per-friend errors
            }
            return { friend: { ...f, online: onlineUsers.has(f.id) }, lastMessage: null }
          })
        )
        // Sort: friends with messages first (most recent first), then the rest
        convos.sort((a, b) => {
          if (a.lastMessage && b.lastMessage)
            return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
          if (a.lastMessage) return -1
          if (b.lastMessage) return 1
          return 0
        })
        setConversations(convos)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load message history when a friend is selected
  useEffect(() => {
    if (!selectedFriendId) return
    setLoadingMessages(true)
    setMessages([])

    fetch(`/api/chat/${selectedFriendId}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(
          (d.messages ?? []).map((m: ChatMessage & { timestamp: string }) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false))

    // Fetch friend info
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        const f = (d.friends ?? []).find((fr: Friend) => fr.id === selectedFriendId)
        if (f) setFriendInfo({ ...f, online: onlineUsers.has(f.id) })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedFriendId || !user) return

    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: selectedFriendId,
      text: input.trim(),
      timestamp: new Date(),
      read: false,
    }

    setMessages((prev) => [...prev, optimistic])
    setInput("")

    const socket = getSocket()
    socket.emit("send-message", {
      receiverId: selectedFriendId,
      text: optimistic.text,
      tempId,
    })
  }, [input, selectedFriendId, user])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Conversation list view
  if (!selectedFriendId) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.chat.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.chat.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          {conversations.map(({ friend, lastMessage }) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend.id)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-foreground text-sm">
                    {friend.avatar}
                  </AvatarFallback>
                </Avatar>
                {(friend.online || onlineUsers.has(friend.id)) && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  {lastMessage && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatTime(lastMessage.timestamp)}
                    </p>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {lastMessage
                    ? `${lastMessage.senderId === user?.id ? `${t.chat.you}: ` : ""}${lastMessage.text}`
                    : "—"}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">{t.chat.noConversations}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isOnline = friendInfo?.online || onlineUsers.has(selectedFriendId)

  // Chat view
  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelectFriend(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.chat.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {friendInfo?.avatar}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{friendInfo?.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {isOnline ? t.chat.online : t.chat.offline}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.typePlaceholder}
          className="flex-1 bg-card border-border placeholder:text-muted-foreground/50"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim()}
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
          aria-label={t.chat.send}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
