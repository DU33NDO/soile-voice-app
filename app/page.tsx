"use client"

import { useState, useCallback } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/i18n/context"
import { AuthForm } from "@/components/auth-form"
import { AppShell, type AppTab } from "@/components/app-shell"
import { VoiceRecorder } from "@/components/voice-recorder"
import { FriendsPage } from "@/components/friends-page"
import { ChatPage } from "@/components/chat-page"
import { LeaderboardPage } from "@/components/leaderboard-page"
import { HistoryPage } from "@/components/history-page"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<AppTab>("record")
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(null)
  const [practiceTopicOverride, setPracticeTopicOverride] = useState<string | undefined>()

  const handleOpenChat = useCallback((friendId: string) => {
    setSelectedChatFriend(friendId)
    setActiveTab("chat")
  }, [])

  const handlePracticeAgain = useCallback((topic: string) => {
    setPracticeTopicOverride(topic)
    setActiveTab("record")
  }, [])

  const handleTabChange = useCallback((tab: AppTab) => {
    if (tab !== "record") setPracticeTopicOverride(undefined)
    setActiveTab(tab)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "record" && <VoiceRecorder initialTopic={practiceTopicOverride} />}
      {activeTab === "friends" && <FriendsPage onOpenChat={handleOpenChat} />}
      {activeTab === "chat" && (
        <ChatPage
          selectedFriendId={selectedChatFriend}
          onSelectFriend={setSelectedChatFriend}
        />
      )}
      {activeTab === "leaderboard" && <LeaderboardPage />}
      {activeTab === "history" && <HistoryPage onPracticeAgain={handlePracticeAgain} />}
    </AppShell>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  )
}
