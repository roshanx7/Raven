import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { registerSocket } from "./socket/signaling";

const app = express();
const PORT = Number(process.env.PORT) || 5717;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.0.107:5173",
      "https://raven-nu.vercel.app",
    ],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.0.107:5173",
      "https://raven-nu.vercel.app",
    ],
    credentials: true,
  },
});

registerSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});