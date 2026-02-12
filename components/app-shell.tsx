"use client"

import { type ReactNode, useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage, type Lang } from "@/lib/i18n/context"
import { Mic, Users, MessageCircle, Trophy, Clock, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type AppTab = "record" | "friends" | "chat" | "leaderboard" | "history"

const NAV_ICONS: Record<AppTab, typeof Mic> = {
  record: Mic,
  friends: Users,
  chat: MessageCircle,
  leaderboard: Trophy,
  history: Clock,
}

const LANGS: Lang[] = ["en", "ru", "kz"]

interface AppShellProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleTabChange = (tab: AppTab) => {
    onTabChange(tab)
    setIsMenuOpen(false)
  }

  // Close on ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const navItems: { id: AppTab; label: string }[] = [
    { id: "record", label: t.nav.record },
    { id: "friends", label: t.nav.friends },
    { id: "chat", label: t.nav.chat },
    { id: "leaderboard", label: t.nav.leaderboard },
    { id: "history", label: t.nav.history },
  ]

  // Shared sidebar content used in both desktop sidebar and mobile drawer
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Mic className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">{t.app.name}</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.id]
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom: language + user + logout */}
      <div className="flex flex-col gap-3 px-3 pb-6">
        {/* Language switcher */}
        <div className="flex gap-1 px-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                lang === l
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={l}
            >
              {t.lang[l]}
            </button>
          ))}
        </div>

        {/* User card + logout */}
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user?.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{user?.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t.nav.logout}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar (≥ lg = 1024px) ────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* ── Mobile / tablet top bar (< lg) ──────────────────── */}
      <header className="lg:hidden fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Mic className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">{t.app.name}</span>
        </div>

        {/* Active tab label */}
        <span className="text-sm font-medium text-muted-foreground">
          {navItems.find((n) => n.id === activeTab)?.label}
        </span>

        {/* Hamburger / close */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel — slides in from left */}
          <aside className="animate-slide-in-left absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card shadow-2xl">
            {/* Close button inside drawer */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute right-3 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      {/* pt-14: clears the mobile top bar; lg:pt-0 + lg:ml-56: desktop layout */}
      <main className="pt-14 lg:ml-56 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
