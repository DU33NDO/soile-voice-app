"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Shuffle } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

interface TopicPickerProps {
  selectedTopic: string
  onTopicChange: (topic: string) => void
}

export function TopicPicker({ selectedTopic, onTopicChange }: TopicPickerProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState(
    t.voice.topicCategories[0]?.id ?? ""
  )

  const allTopics = t.voice.topicCategories.flatMap((c) => c.topics)

  const pickRandom = () => {
    const random = allTopics[Math.floor(Math.random() * allTopics.length)]
    onTopicChange(random)
    setIsOpen(false)
  }

  const activeCategory = t.voice.topicCategories.find((c) => c.id === activeCategoryId)

  return (
    <div className="mb-6 rounded-xl border border-border bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between p-5">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {t.voice.yourTopic}
          </p>
          <p className="text-base font-medium text-foreground leading-snug line-clamp-2">
            {selectedTopic}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={pickRandom}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            title={t.voice.randomTopic}
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.voice.randomTopic}</span>
          </button>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {t.voice.chooseTopic}
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable picker */}
      {isOpen && (
        <div className="border-t border-border">
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
            {t.voice.topicCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategoryId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Topics grid */}
          <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
            {activeCategory?.topics.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  onTopicChange(topic)
                  setIsOpen(false)
                }}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selectedTopic === topic
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
