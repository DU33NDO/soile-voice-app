"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { en, type Translations } from "./translations/en"
import { ru } from "./translations/ru"
import { kz } from "./translations/kz"

export type Lang = "en" | "ru" | "kz"

// Whisper API uses ISO 639-1 codes; Kazakh is "kk" not "kz"
export const WHISPER_LANG: Record<Lang, string> = {
  en: "en",
  ru: "ru",
  kz: "kk",
}

const translations: Record<Lang, Translations> = { en, ru, kz }

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    const saved = localStorage.getItem("soile-lang") as Lang | null
    if (saved && saved in translations) {
      setLangState(saved)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem("soile-lang", l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLanguage() {
  return useContext(I18nContext)
}
