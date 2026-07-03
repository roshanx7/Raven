import { socket } from "./socket";
import type {
  IceCandidatePayload,
  SessionCreatedPayload,
  SessionErrorPayload,
  OfferPayload,
  AnswerPayload,
  PeerDisconnectedPayload,
} from "../types/socket";

// Helper to reduce boilerplate and guarantee cleanup safety
function createListener<T = void>(eventName: string) {
  return (callback: (payload: T) => void) => {
    socket.on(eventName, callback);
    return () => {
      socket.off(eventName, callback);
    };
  };
}

export const socketEvents = {
  onSessionCreated: createListener<SessionCreatedPayload>("session-created"),
  onReceiverJoined: createListener<void>("receiver-joined"),
  onJoined:         createListener<void>("joined"),
  onSessionError:   createListener<SessionErrorPayload>("session-error"),
  onOffer:          createListener<OfferPayload>("offer"),
  onAnswer:         createListener<AnswerPayload>("answer"),
  onIceCandidate:   createListener<IceCandidatePayload>("ice-candidate"),

  onPeerDisconnected: createListener<PeerDisconnectedPayload>("peer-disconnected"),
};

//example of listener with boilerplate code.
//
// onOffer(callback) {
//   socket.on("offer", callback);
//   return () => {
//    socket.off("offer", callback);
//   };
// },