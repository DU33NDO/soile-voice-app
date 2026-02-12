import mongoose, { Document, Model } from "mongoose"

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  text: string
  timestamp: Date
  read: boolean
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
)

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 })

const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", messageSchema)

export default Message
