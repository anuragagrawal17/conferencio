import { z } from "zod";
import { markRoomJoined, markRoomLeft } from "../services/roomSessionService.js";

const joinRoomPayloadSchema = z.object({
  roomId: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().trim().min(2).max(40)
});

const forwardSignalPayloadSchema = z.object({
  targetSocketId: z.string().min(1),
  signal: z.unknown()
});

const roomDirectory = new Map();

const getRoomParticipants = (roomId) => {
  if (!roomDirectory.has(roomId)) {
    roomDirectory.set(roomId, new Map());
  }

  return roomDirectory.get(roomId);
};

const removeSocketFromRoom = async (socket) => {
  const roomId = socket.data.roomId;

  if (typeof roomId !== "string") {
    return;
  }

  const participants = roomDirectory.get(roomId);

  if (participants) {
    participants.delete(socket.id);

    if (participants.size === 0) {
      roomDirectory.delete(roomId);
    }
  }

  socket.leave(roomId);
  socket.data.roomId = undefined;
  socket.data.displayName = undefined;

  socket.to(roomId).emit("room:peer-left", {
    socketId: socket.id
  });

  await markRoomLeft(roomId);
};

export const registerConferenceGateway = (io) => {
  io.on("connection", (socket) => {
    socket.on("room:join", async (payload) => {
      const parsedPayload = joinRoomPayloadSchema.safeParse(payload);

      if (!parsedPayload.success) {
        socket.emit("room:error", {
          message: "Invalid join request"
        });
        return;
      }

      const { roomId, displayName } = parsedPayload.data;

      await removeSocketFromRoom(socket);

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.displayName = displayName;

      const participants = getRoomParticipants(roomId);
      participants.set(socket.id, displayName);

      await markRoomJoined(roomId);

      const peers = [...participants.entries()]
        .filter(([socketId]) => socketId !== socket.id)
        .map(([socketId, name]) => ({
          socketId,
          displayName: name
        }));

      socket.emit("room:state", {
        roomId,
        self: {
          socketId: socket.id,
          displayName
        },
        peers
      });

      socket.to(roomId).emit("room:peer-joined", {
        socketId: socket.id,
        displayName
      });
    });

    socket.on("signal:forward", (payload) => {
      const parsedPayload = forwardSignalPayloadSchema.safeParse(payload);

      if (!parsedPayload.success) {
        return;
      }

      const roomId = socket.data.roomId;

      if (typeof roomId !== "string") {
        return;
      }

      const participants = roomDirectory.get(roomId);

      if (!participants?.has(parsedPayload.data.targetSocketId)) {
        return;
      }

      io.to(parsedPayload.data.targetSocketId).emit("signal:incoming", {
        fromSocketId: socket.id,
        signal: parsedPayload.data.signal
      });
    });

    socket.on("room:leave", async () => {
      await removeSocketFromRoom(socket);
    });

    socket.on("disconnect", async () => {
      await removeSocketFromRoom(socket);
    });
  });
};
