import { io } from "socket.io-client";

const serverUrl = (() => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:4000";
})();

if (import.meta.env.PROD && !import.meta.env.VITE_SERVER_URL) {
  console.warn("VITE_SERVER_URL is not set; using current origin as fallback signaling URL.");
}

export const createSocket = () => {
  return io(serverUrl, {
    transports: ["websocket"],
    autoConnect: true
  });
};
