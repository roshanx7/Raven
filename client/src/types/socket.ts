export interface SessionCreatedPayload {
  pin: string;
}

export interface SessionErrorPayload {
  message: string;
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
}

export interface PeerDisconnectedPayload {
  peerId: string;
}