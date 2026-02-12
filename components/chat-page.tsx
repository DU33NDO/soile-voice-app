"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { ArrowLeft, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { friends, chatMessages, type ChatMessage } from "@/lib/mock-data"

interface ChatPageProps {
  selectedFriendId: string | null
  onSelectFriend: (id: string | null) => void
}

export function ChatPage({ selectedFriendId, onSelectFriend }: ChatPageProps) {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(chatMessages)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedFriend = useMemo(
    () => friends.find((f) => f.id === selectedFriendId),
    [selectedFriendId]
  )

  const currentMessages = useMemo(
    () => (selectedFriendId ? messages[selectedFriendId] || [] : []),
    [selectedFriendId, messages]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedFriendId) return

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "user-1",
      text: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => ({
      ...prev,
      [selectedFriendId]: [...(prev[selectedFriendId] || []), newMessage],
    }))
    setInput("")

    // Simulate a reply after a delay (websocket simulation)
    setTimeout(() => {
      const replies = [
        "That sounds great!",
        "I totally agree with you.",
        "Keep up the good work!",
        "Interesting point!",
        "Let's practice together soon.",
      ]
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderId: selectedFriendId,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date(),
      }
      setMessages((prev) => ({
        ...prev,
        [selectedFriendId]: [...(prev[selectedFriendId] || []), reply],
      }))
    }, 1500)
  }, [input, selectedFriendId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Conversation list
  if (!selectedFriendId) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Messages
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with your friends in real-time
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {friends
            .filter((f) => messages[f.id] && messages[f.id].length > 0)
            .map((friend) => {
              const lastMsg = messages[friend.id][messages[friend.id].length - 1]
              return (
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
                    {friend.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {friend.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(lastMsg.timestamp)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {lastMsg.senderId === "user-1" ? "You: " : ""}
                      {lastMsg.text}
                    </p>
                  </div>
                </button>
              )
            })}
          {friends.filter((f) => messages[f.id] && messages[f.id].length > 0)
            .length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No conversations yet. Find friends to start chatting!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chat view
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelectFriend(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {selectedFriend?.avatar}
            </AvatarFallback>
          </Avatar>
          {selectedFriend?.online && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {selectedFriend?.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {selectedFriend?.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        <div className="flex flex-col gap-3 pb-4">
          {currentMessages.map((msg) => {
            const isMe = msg.senderId === "user-1"
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
                      isMe
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
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
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-card border-border placeholder:text-muted-foreground/50"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim()}
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
