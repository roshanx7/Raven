import { useEffect, useState, useRef } from "react";
import {
  getPeerConnection,
  createDataChannel,
  getDataChannel,
  setDataChannel,
} from "../services/webrtc";
import { socketActions } from "../services/socketActions";
import { socketEvents } from "../services/socketEvents";

import { transferManager } from "../services/transfer/transferManager";

import {
  initialTransferState,
  type TransferState,
} from "../services/transfer/TransferState";

// ------IMPORTS---------

export function useWebRTC(pin: string) {
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

  const [dataChannelReady, setDataChannelReady] = useState(false);

  const [transfer, setTransfer] = useState<TransferState>(initialTransferState);

  // Always read .current at call time so async handlers never use a stale pin
  const pinRef = useRef(pin);
  pinRef.current = pin;

  function setSessionPin(newPin: string) {
    pinRef.current = newPin;
  }

  // Stores ICE candidates until remote description is available
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Get the shared peer connection
  const peer = getPeerConnection();

  // Attach listeners to the data channel
  const setupDataChannelListeners = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log("Data channel opened.");
      setDataChannelReady(true);

      // channel.send("Hello Receiver!");
    };

    channel.onclose = () => {
      console.log("Data channel closed.");
      setDataChannelReady(false);
    };

    channel.onerror = (error) => {
      console.error("Data channel error:", error);
    };

    // Will be useful when sending large files
    channel.bufferedAmountLowThreshold = 256 * 1024;

    channel.onbufferedamountlow = () => {
      console.log("Buffer has room again.");
    };

    channel.onmessage = (event) => {
      // // console.log("Data channel message received:", event.data);
      transferManager.receive(event, {
        onMetadata: (name, size, mimeType) => {
          setTransfer({
            fileName: name,
            fileSize: size,
            mimeType,

            bytesTransferred: 0,
            bytesPerSecond: 0,
            etaSeconds: 0,

            status: "receiving",
          });
        },

        onProgress: (
  bytesTransferred,
  bytesPerSecond,
) => {
  setTransfer((prev) => ({
    ...prev,
    bytesTransferred,
    bytesPerSecond,
  }));
},

        onComplete: () => {
          setTransfer((prev) => ({
            ...prev,
            status: "completed",
          }));
        },
      });
    };

    // Save the channel so other functions can use it
    setDataChannel(channel);
  };

  // Handles incoming WebRTC messages
  const handlersRef = useRef({
    handleOffer: async (offer: RTCSessionDescriptionInit) => {
      //       console.log("Received offer");
      // console.log("Before:", peer.signalingState);

      await peer.setRemoteDescription(offer);
      // console.log("After setRemoteDescription:", peer.signalingState);

      const answer = await peer.createAnswer();
      // console.log("Created answer");

      await peer.setLocalDescription(answer);
      // console.log("After setLocalDescription:", peer.signalingState);

      socketActions.sendAnswer(pinRef.current, answer);

      while (iceQueueRef.current.length > 0) {
        const candidate = iceQueueRef.current.shift();

        if (candidate) {
          await peer.addIceCandidate(candidate);
        }
      }
    },

    handleAnswer: async (answer: RTCSessionDescriptionInit) => {
      await peer.setRemoteDescription(answer);

      while (iceQueueRef.current.length > 0) {
        const candidate = iceQueueRef.current.shift();

        if (candidate) {
          await peer.addIceCandidate(candidate);
        }
      }
    },

    handleIceCandidate: async (candidate: RTCIceCandidateInit) => {
      // console.log("Received ICE candidate");
      if (!peer.remoteDescription) {
        iceQueueRef.current.push(candidate);
      } else {
        await peer.addIceCandidate(candidate);
      }
    },
  });

  // Listen to peer connection events
  useEffect(() => {
    peer.onconnectionstatechange = () => {
      // console.log("Connection:", peer.connectionState);
      setConnectionState(peer.connectionState);
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      // console.log("ICE:", peer.iceConnectionState);
      socketActions.sendIceCandidate(pinRef.current, event.candidate);
    };

    // Receiver gets the data channel here
    peer.ondatachannel = (event) => {
      setupDataChannelListeners(event.channel);
    };

    return () => {
      peer.onconnectionstatechange = null;
      peer.onicecandidate = null;
      peer.ondatachannel = null;
    };
  }, [peer]);

  // Listen to socket events
  useEffect(() => {
    const cleanupOffer = socketEvents.onOffer(async ({ offer }) => {
      // console.log("Socket received OFFER");
      await handlersRef.current.handleOffer(offer);
    });

    const cleanupAnswer = socketEvents.onAnswer(async ({ answer }) => {
      await handlersRef.current.handleAnswer(answer);
    });

    const cleanupIce = socketEvents.onIceCandidate(async ({ candidate }) => {
      await handlersRef.current.handleIceCandidate(candidate);
    });

    return () => {
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
    };
  }, []);

  // Sender creates the offer
  async function createOffer(sessionPin?: string) {
    const activeSessionPin = sessionPin ?? pinRef.current;
    if (!activeSessionPin) {
      console.error("Cannot create offer: session PIN is missing.");
      return;
    }

    const channel = createDataChannel();
    setupDataChannelListeners(channel);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketActions.sendOffer(activeSessionPin, offer);
  }

  async function sendFile(file: File) {
    const channel = getDataChannel();

    if (!channel || channel.readyState !== "open") {
      console.error("Data channel is not ready.");
      return;
    }

    // await sendFileTransfer(channel, file);
    await transferManager.send(channel, file, {
      onStart: (file) => {
        setTransfer({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,

          bytesTransferred: 0,
          bytesPerSecond: 0,
          etaSeconds: 0,

          status: "sending",
        });
      },

      onProgress: (
    bytesTransferred,
    bytesPerSecond,
) => {
    setTransfer(prev => ({
        ...prev,
        bytesTransferred,
        bytesPerSecond,
    }));
},

      onComplete: () => {
        setTransfer((prev) => ({
          ...prev,
          status: "completed",
        }));
      },
    });
  }

  return {
    createOffer,
    setSessionPin,
    connectionState,
    dataChannelReady,
    sendFile,
    transfer,
    peer,
  };
}
