import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import SenderCard from "./SenderCard";
import ReceiverCard from "./ReceiverCard";
import { useWebRTC } from "../hooks/useWebRTC";

export default function Landing() {
  const connected = useSocket();
  const [activePin, setActivePin] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<
    "idle" | "sender" | "receiver"
  >("idle");

  const {
    createOffer,
    setSessionPin,
    connectionState,
    dataChannelReady,
    sendFile,
    transfer,
  } = useWebRTC(activePin || "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-4 relative">
      {/* Dynamic Global Socket Status Bar */}
      {/* <div className="absolute top-6 right-6 flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-medium">
        <span
          className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}
        />
        <span className={connected ? "text-zinc-300" : "text-rose-400"}>
          {connected ? "Signaling Connected" : "Signaling Offline"}
        </span>
      </div> */}

      {/* Heading */}
      <div className="w-full max-w-6xl">
        <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
          Raven
        </h1>

        <p className="mt-4 text-xl text-zinc-400">
          Direct peer-to-peer file sharing.
        </p>

        <p className="text-zinc-500 text-sm mt-1">
          No login • No uploads • End-to-end encrypted
        </p>

        {/* Prevent actions if signaling backend is dead */}
        {!connected ? (
          <div className="mt-14 p-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-center max-w-2xl mx-auto">
            <p className="text-zinc-400">
              Establishing a secure connection to the signaling server...
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {/* Render cards selectively or pass handlers to lock user mode */}
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
                setActivePin(pin);
                setSessionMode("sender");
              }}
            />

            <ReceiverCard
              disabled={sessionMode === "sender"}
              connectionState={connectionState}
              setSessionPin={setSessionPin}
              transfer={transfer}
              sessionMode={sessionMode}
              onSessionJoin={(pin) => {
                setActivePin(pin);
                setSessionMode("receiver");
              }}
            />
          </div>
        )}

        {/* Debug UI/Session Status Overlay at bottom */}
        {activePin && (
          <div className="mt-8 text-center text-xs text-zinc-500">
            Active Room Session:{" "}
            <span className="text-zinc-300 font-mono font-bold bg-zinc-900 px-2 py-1 rounded">
              {activePin}
            </span>{" "}
            ({sessionMode.toUpperCase()})
          </div>
        )}
      </div>
    </div>
  );
}
