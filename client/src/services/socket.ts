import { io } from "socket.io-client";

const API_URL = "http://192.168.0.107:5717";

export const socket = io(API_URL, {
  autoConnect: false,
});