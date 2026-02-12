import mongoose, { Document, Model } from "mongoose"

export interface IFriendship extends Document {
  _id: mongoose.Types.ObjectId
  requester: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

const friendshipSchema = new mongoose.Schema<IFriendship>(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
)

friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true })

const Friendship: Model<IFriendship> =
  (mongoose.models.Friendship as Model<IFriendship>) ||
  mongoose.model<IFriendship>("Friendship", friendshipSchema)

export default Friendship
