import { RoomSession } from "../models/RoomSession.js";

export const markRoomJoined = async (roomId) => {
  return RoomSession.findOneAndUpdate(
    { roomId },
    {
      $inc: { participantCount: 1 },
      $set: { lastActivityAt: new Date() }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      lean: true
    }
  );
};

export const markRoomLeft = async (roomId) => {
  const session = await RoomSession.findOneAndUpdate(
    { roomId },
    {
      $inc: { participantCount: -1 },
      $set: { lastActivityAt: new Date() }
    },
    {
      new: true
    }
  );

  if (!session) {
    return null;
  }

  if (session.participantCount <= 0) {
    await RoomSession.findOneAndDelete({ _id: session._id });
    return null;
  }

  return session.toObject();
};

export const getRoomSnapshot = async (roomId) => {
  return RoomSession.findOne({ roomId }).lean();
};
