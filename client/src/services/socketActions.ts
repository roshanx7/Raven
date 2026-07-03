// client to server actions.
import { socket } from "./socket";

export const socketActions = {

  createSession() {
    socket.emit("create-session");
  },

  joinSession(pin: string) {
    socket.emit("join-session", { pin });
  },

  sendOffer(pin: string, offer: RTCSessionDescriptionInit) {
    socket.emit("offer", {
      pin,
      offer,
    });
  },

  sendAnswer(pin: string, answer: RTCSessionDescriptionInit) {
    socket.emit("answer", {
      pin,
      answer,
    });
  },

  sendIceCandidate(pin: string, candidate: RTCIceCandidateInit) {
    socket.emit("ice-candidate", {
      pin,
      candidate,
    });
  },

};