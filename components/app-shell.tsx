"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Mic,
  Users,
  MessageCircle,
  Trophy,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type AppTab = "record" | "friends" | "chat" | "leaderboard"

interface AppShellProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  children: ReactNode
}

const navItems: { id: AppTab; label: string; icon: typeof Mic }[] = [
  { id: "record", label: "Record", icon: Mic },
  { id: "friends", label: "Friends", icon: Users },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
]

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r border-border bg-card py-6 md:w-56">
        <div className="mb-8 flex items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mic className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground md:block">
            soile
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2 w-full">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="hidden md:block">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="md:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>

        <div className="flex flex-col items-center gap-2 px-2 w-full">
          <div className="hidden w-full rounded-lg bg-secondary p-3 md:block">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user?.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-16 flex-1 md:ml-56">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
