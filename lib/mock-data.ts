export interface Friend {
  id: string
  name: string
  avatar: string
  score: number
  sessions: number
  online: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  text: string
  timestamp: Date
}

export interface SearchUser {
  id: string
  name: string
  avatar: string
  isFriend: boolean
}

export const friends: Friend[] = [
  { id: "f1", name: "Alex Chen", avatar: "A", score: 8.5, sessions: 32, online: true },
  { id: "f2", name: "Maria Garcia", avatar: "M", score: 7.8, sessions: 28, online: false },
  { id: "f3", name: "James Wilson", avatar: "J", score: 9.1, sessions: 45, online: true },
  { id: "f4", name: "Sarah Kim", avatar: "S", score: 6.9, sessions: 19, online: false },
  { id: "f5", name: "David Brown", avatar: "D", score: 7.4, sessions: 22, online: true },
  { id: "f6", name: "Emma Taylor", avatar: "E", score: 8.2, sessions: 37, online: false },
  { id: "f7", name: "Lucas Miller", avatar: "L", score: 5.6, sessions: 11, online: true },
]

export const searchUsers: SearchUser[] = [
  { id: "s1", name: "Oliver Martin", avatar: "O", isFriend: false },
  { id: "s2", name: "Sophia Johnson", avatar: "S", isFriend: false },
  { id: "s3", name: "Noah Davis", avatar: "N", isFriend: false },
  { id: "s4", name: "Isabella Anderson", avatar: "I", isFriend: false },
  { id: "s5", name: "Liam Thomas", avatar: "L", isFriend: false },
  { id: "f1", name: "Alex Chen", avatar: "A", isFriend: true },
  { id: "f2", name: "Maria Garcia", avatar: "M", isFriend: true },
  { id: "f3", name: "James Wilson", avatar: "J", isFriend: true },
]

export const chatMessages: Record<string, ChatMessage[]> = {
  f1: [
    { id: "m1", senderId: "f1", text: "Hey! How was your last speech session?", timestamp: new Date(Date.now() - 3600000) },
    { id: "m2", senderId: "user-1", text: "Pretty good! Got an 8.1 on confidence this time.", timestamp: new Date(Date.now() - 3500000) },
    { id: "m3", senderId: "f1", text: "Nice improvement! I noticed fewer filler words too.", timestamp: new Date(Date.now() - 3400000) },
    { id: "m4", senderId: "user-1", text: "Thanks! The AI feedback really helps.", timestamp: new Date(Date.now() - 3300000) },
  ],
  f3: [
    { id: "m5", senderId: "f3", text: "Want to practice together tomorrow?", timestamp: new Date(Date.now() - 7200000) },
    { id: "m6", senderId: "user-1", text: "Sure! What topic should we try?", timestamp: new Date(Date.now() - 7100000) },
    { id: "m7", senderId: "f3", text: "How about tech presentations? That's where I struggle most.", timestamp: new Date(Date.now() - 7000000) },
  ],
  f5: [
    { id: "m8", senderId: "f5", text: "Just hit a 9.0 score!", timestamp: new Date(Date.now() - 86400000) },
    { id: "m9", senderId: "user-1", text: "That's amazing, congratulations!", timestamp: new Date(Date.now() - 86300000) },
  ],
}

export const speechTopics = [
  "Describe a moment that changed your perspective on life",
  "Explain the importance of renewable energy",
  "Tell us about the future of artificial intelligence",
  "Discuss the value of continuous learning",
  "Present your vision for an ideal workplace",
  "Explain why remote work is here to stay",
  "Discuss the impact of social media on communication",
  "Describe a challenge you overcame and what you learned",
]

export function getRandomTopic(): string {
  return speechTopics[Math.floor(Math.random() * speechTopics.length)]
}
