"use client"

import { useState, useCallback } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth-form"
import { AppShell, type AppTab } from "@/components/app-shell"
import { VoiceRecorder } from "@/components/voice-recorder"
import { FriendsPage } from "@/components/friends-page"
import { ChatPage } from "@/components/chat-page"
import { LeaderboardPage } from "@/components/leaderboard-page"

function AppContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AppTab>("record")
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(null)

  const handleOpenChat = useCallback((friendId: string) => {
    setSelectedChatFriend(friendId)
    setActiveTab("chat")
  }, [])

  if (!user) {
    return <AuthForm />
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "record" && <VoiceRecorder />}
      {activeTab === "friends" && <FriendsPage onOpenChat={handleOpenChat} />}
      {activeTab === "chat" && (
        <ChatPage
          selectedFriendId={selectedChatFriend}
          onSelectFriend={setSelectedChatFriend}
        />
      )}
      {activeTab === "leaderboard" && <LeaderboardPage />}
    </AppShell>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
