import http from "node:http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env, isOriginAllowed } from "./config/env.js";
import { connectDatabase } from "./db/connectDatabase.js";
import { registerConferenceGateway } from "./sockets/conferenceGateway.js";

const app = createApp();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Socket origin denied"), false);
    },
    credentials: true
  }
});

registerConferenceGateway(io);

const startServer = async () => {
  await connectDatabase();

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
};

const shutdown = async () => {
  io.close();
  await mongoose.connection.close();
  httpServer.close(() => {
    process.exit(0);
  });
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    void shutdown();
  });
});

void startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
