import { model, Schema } from "mongoose";

const roomSessionSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    participantCount: {
      type: Number,
      required: true,
      default: 0
    },
    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const RoomSession = model("RoomSession", roomSessionSchema);
