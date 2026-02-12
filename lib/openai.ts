import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIFeedback {
  confidenceScore: number
  parasiteWords: { word: string; count: number; suggestion: string }[]
  tips: string[]
  summary: string
}

export async function transcribeAudio(audioFile: File, language = "en"): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language,
  })
  return transcription.text
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  kz: "Kazakh",
  kk: "Kazakh",
}

export async function analyzeTranscript(
  transcript: string,
  topic: string,
  uiLang = "en"
): Promise<AIFeedback> {
  const responseLang = LANG_NAMES[uiLang] ?? "English"

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional speech coach. Analyze the given speech transcript and provide structured feedback. Always respond with valid JSON only, no markdown. Write all text values (summary, tips) in ${responseLang}.`,
      },
      {
        role: "user",
        content: `Analyze this speech about the topic: "${topic}"

Transcript: "${transcript}"

Provide feedback in this exact JSON format (all text values in ${responseLang}):
{
  "confidenceScore": <number 1-10 based on clarity, vocabulary, and overall delivery>,
  "parasiteWords": [{"word": "<filler word as it appears in transcript>", "count": <exact occurrences>, "suggestion": "<a short, concrete alternative phrase the speaker should use instead>"}],
  "tips": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>", "<specific tip 4>"],
  "summary": "<2-3 sentence overall assessment of the speech>"
}

Rules:
- Only include parasite words that ACTUALLY appear in the transcript — count them precisely.
- Common filler words by language — English: "um", "uh", "like", "you know", "so", "basically", "literally"; Russian: "ну", "это", "как бы", "вот", "значит", "типа"; Kazakh: "ну", "яғни", "сонда", "деген", "бірақ".
- For each parasite word, the "suggestion" must be a concrete replacement: e.g., for "um" → "a brief pause", for "like" → "such as / for example", for "ну" → "краткая пауза", for "яғни" → "демек".
- If no filler words are detected, return an empty array for parasiteWords.`,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  })

  const content = completion.choices[0].message.content
  if (!content) throw new Error("No response from OpenAI")
  return JSON.parse(content) as AIFeedback
}

export default openai
