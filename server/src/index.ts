import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { registerSocket } from "./socket/signaling";

const app = express();
const PORT = 5717;
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: [
      "http://localhost:5173",
      "http://192.168.0.107:5173",
    ],

  },
});

registerSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});