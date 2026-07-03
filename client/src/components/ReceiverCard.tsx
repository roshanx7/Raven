import { useEffect, useState, useRef } from "react";
import { socketActions } from "../services/socketActions";
import { socketEvents } from "../services/socketEvents";
import { Download, Link2 } from "lucide-react";

interface ReceiverCardProps {
  disabled: boolean;
  setSessionPin: (pin: string) => void;
  onSessionJoin: (pin: string) => void;
  connectionState: RTCPeerConnectionState;
}

export default function ReceiverCard({ 
  disabled,
  setSessionPin,
  onSessionJoin, 
  connectionState 
}: ReceiverCardProps) {
  
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("Waiting for PIN...");
  const [isJoined, setIsJoined] = useState(false);

  // Use a mutable ref to track the pin so the useEffect can access its latest value without adding 'pin' to the dependency array.
  const pinRef = useRef(pin);
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);


  useEffect(() => {
    // Fired when the server verifies the PIN and accepts you into the room map
    const cleanupJoined = socketEvents.onJoined(() => {
      setStatus("Connected to session! Synthesizing peer description handshake...");
      setIsJoined(true);
      onSessionJoin(pinRef.current); // Use the ref safely
    });

    // Fired when your input fails room validation boundaries on the backend
    const cleanupError = socketEvents.onSessionError(({ message }) => {
      setStatus(message);
      setIsJoined(false);
    });

    return () => {
      cleanupJoined();
      cleanupError();
    };
  }, [onSessionJoin]); // Safe: Only runs once on mount and handles re-renders beautifully

  // Keep the UI up to date with native P2P network layer status updates
  useEffect(() => {
    if (!isJoined) return;

    if (connectionState === "connecting") {
      setStatus("Exchanging structural handshake tokens...");
    } else if (connectionState === "connected") {
      setStatus("Directly connected to sender! Secure channel established.");
    } else if (connectionState === "failed") {
      setStatus("The network bridge failed. Check internet routing parameters.");
    }
  }, [connectionState, isJoined]);

  const handleConnect = () => {
    if (pin.length !== 6) return;
    setStatus("Authenticating pin room token...");
    setSessionPin(pin);
    onSessionJoin(pin);
    socketActions.joinSession(pin);
  };

  return (
    <div 
      className={`rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-lg h-full transition-all duration-300
        ${disabled ? "opacity-30 pointer-events-none scale-95" : "hover:border-white/20 hover:-translate-y-1"}
      `}
    >
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Download className="h-7 w-7 text-blue-500" />
        Receive
      </h2>

      <p className="mt-2 text-sm text-zinc-400">
        Enter the 6-character PIN shared by the sender.
      </p>

      <input
        type="text"
        value={pin}
        maxLength={6}
        disabled={disabled || isJoined}
        onChange={(e) =>
          setPin(e.target.value.toUpperCase().replace(/\s/g, ""))
        }
        placeholder="ABC123"
        className="mt-6 w-full rounded-xl bg-zinc-800 px-4 py-4 text-center text-2xl font-semibold tracking-[0.4em] outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      {!isJoined && (
        <button
          onClick={handleConnect}
          disabled={pin.length !== 6 || disabled}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white"
        >
          <Link2 className="h-5 w-5" />
          Connect
        </button>
      )}

      <div className="mt-8 rounded-xl bg-zinc-800 p-4">
        <p className="text-sm text-zinc-400">Status</p>
        <p className={`mt-2 font-medium ${connectionState === "connected" ? "text-emerald-400" : "text-blue-400"}`}>
          {status}
        </p>
      </div>
    </div>
  );
}