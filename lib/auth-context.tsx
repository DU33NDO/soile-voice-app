"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  score: number
  sessions: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setUser({
      id: "user-1",
      name: email.split("@")[0],
      email,
      avatar: email.split("@")[0].charAt(0).toUpperCase(),
      score: 7.2,
      sessions: 14,
    })
    setIsLoading(false)
  }, [])

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setUser({
      id: "user-1",
      name,
      email,
      avatar: name.charAt(0).toUpperCase(),
      score: 0,
      sessions: 0,
    })
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
