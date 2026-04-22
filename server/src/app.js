import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isOriginAllowed } from "./config/env.js";
import { getRoomSnapshot } from "./services/roomSessionService.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin denied"));
      },
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok"
    });
  });

  app.get("/api/rooms/:roomId", async (req, res, next) => {
    try {
      const room = await getRoomSnapshot(req.params.roomId);
      res.json({ room });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error?.message === "CORS origin denied") {
      return res.status(403).json({
        message: "Origin not allowed"
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Internal server error"
    });
  });

  return app;
};
