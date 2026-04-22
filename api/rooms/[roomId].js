const mongoose = require("mongoose");

const roomSessionSchema = new mongoose.Schema(
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

const RoomSession = mongoose.models.RoomSession || mongoose.model("RoomSession", roomSessionSchema);

const globalMongoose = global;

if (!globalMongoose.__mongooseCache) {
  globalMongoose.__mongooseCache = {
    conn: null,
    promise: null
  };
}

const connectToDatabase = async () => {
  if (globalMongoose.__mongooseCache.conn) {
    return globalMongoose.__mongooseCache.conn;
  }

  if (!globalMongoose.__mongooseCache.promise) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required for the room API");
    }

    globalMongoose.__mongooseCache.promise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((connection) => connection);
  }

  globalMongoose.__mongooseCache.conn = await globalMongoose.__mongooseCache.promise;
  return globalMongoose.__mongooseCache.conn;
};

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.CLIENT_ORIGIN || "*";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  try {
    await connectToDatabase();

    const roomIdValue = Array.isArray(req.query.roomId) ? req.query.roomId[0] : req.query.roomId;
    const roomId = typeof roomIdValue === "string" ? roomIdValue : "";

    if (!roomId) {
      return res.status(400).json({
        message: "roomId is required"
      });
    }

    const room = await RoomSession.findOne({ roomId }).lean();

    return res.status(200).json({ room });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
