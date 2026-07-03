let peer: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

export function getPeerConnection() { //CREATE PEER CONNECTION
  if (peer) return peer;

  peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302", // Google STUN server.
      },
    ],
  });

  return peer;
}

export function closePeerConnection() { //CLOSE PEER CONNECTION
  dataChannel?.close();

  peer?.close();

  dataChannel = null;
  peer = null;
}

export function createDataChannel() { //CREATE DATA CHANNEL
  const peer = getPeerConnection();

  if (dataChannel) return dataChannel;

  dataChannel = peer.createDataChannel("file-transfer");

  return dataChannel;
}

export function getDataChannel() { //GET DATA CHANNEL
  return dataChannel;
}

export function setDataChannel(channel: RTCDataChannel) { //SET DATA CHANNEL
  dataChannel = channel;
}

