import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import SenderCard from "./SenderCard";
import ReceiverCard from "./ReceiverCard";
import { useWebRTC } from "../hooks/useWebRTC";

export default function Landing() {
  const connected = useSocket();
  const [sessionMode, setSessionMode] = useState<
    "idle" | "sender" | "receiver"
  >("idle");

  // Destructure roomPin and setSessionPin from your single source of truth hook
  const {
    createOffer,
    setSessionPin,
    connectionState,
    dataChannelReady,
    sendFile,
    transfer,
    roomPin,
  } = useWebRTC();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-4 relative">
      <div className="w-full max-w-6xl">
        {/* Heading */}
        <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
          Raven
        </h1>

        <p className="mt-4 text-xl text-zinc-400">
          Direct peer-to-peer file sharing.
        </p>

        <p className="text-zinc-500 text-sm mt-1">
          No login • No uploads • End-to-end encrypted
        </p>

        {/* Prevent actions if signaling network layer is dead */}
        {!connected ? (
          <div className="mt-14 p-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-center max-w-2xl mx-auto">
            <p className="text-zinc-400">
              Waking up the network... Please hold on.
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2 items-start">
            {/* Sender Interface Block */}
            <SenderCard
              disabled={sessionMode === "receiver"}
              createOffer={createOffer}
              connectionState={connectionState}
              dataChannelReady={dataChannelReady}
              sendFile={sendFile}
              transfer={transfer}
              sessionMode={sessionMode}
              onSessionStart={(pin) => {
                setSessionPin(pin); 
                setSessionMode("sender");
              }}
            />

            {/* Receiver Interface Block */}
            <ReceiverCard
              disabled={sessionMode === "sender"}
              connectionState={connectionState}
              setSessionPin={setSessionPin}
              transfer={transfer}
              sessionMode={sessionMode}
              onSessionJoin={(pin) => {
                setSessionPin(pin);
                setSessionMode("receiver");
              }}
            />
          </div>
        )}

        {/* Dynamic Status Overlay at bottom */}
        {roomPin && (
          <div className="mt-8 text-center text-xs text-zinc-500">
            Active Room Session:{" "}
            <span className="text-zinc-300 font-mono font-bold bg-zinc-900 px-2 py-1 rounded">
              {roomPin}
            </span>{" "}
            ({sessionMode.toUpperCase()})
          </div>
        )}
      </div>
    </div>
  );
}