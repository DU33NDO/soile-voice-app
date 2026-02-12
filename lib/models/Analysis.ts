import mongoose, { Document, Model } from "mongoose"

export interface IAnalysis extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  topic: string
  transcript: string
  speechLang: string // whisper lang code: en | ru | kk
  confidenceScore: number
  parasiteWords: { word: string; count: number; suggestion: string }[]
  tips: string[]
  summary: string
  createdAt: Date
}

const analysisSchema = new mongoose.Schema<IAnalysis>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    transcript: { type: String, required: true },
    speechLang: { type: String, default: "en" },
    confidenceScore: { type: Number, required: true, min: 1, max: 10 },
    parasiteWords: [
      {
        word: { type: String, required: true },
        count: { type: Number, required: true },
        suggestion: { type: String, default: "" },
      },
    ],
    tips: [{ type: String }],
    summary: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
)

analysisSchema.index({ userId: 1, createdAt: -1 })

const Analysis: Model<IAnalysis> =
  (mongoose.models.Analysis as Model<IAnalysis>) ||
  mongoose.model<IAnalysis>("Analysis", analysisSchema)

export default Analysis
