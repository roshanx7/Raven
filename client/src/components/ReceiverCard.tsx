import { useEffect, useState, useRef } from "react";
import { socketActions } from "../services/socketActions";
import { socketEvents } from "../services/socketEvents";
import { Download, Link2 } from "lucide-react";
import type { TransferState } from "../services/transfer/TransferState";

interface ReceiverCardProps {
  disabled: boolean;
  setSessionPin: (pin: string) => void;
  onSessionJoin: (pin: string) => void;
  connectionState: RTCPeerConnectionState;
  transfer: TransferState;
  sessionMode: "idle" | "sender" | "receiver";
}

export default function ReceiverCard({
  disabled,
  setSessionPin,
  onSessionJoin,
  connectionState,
  transfer,
  sessionMode,
}: ReceiverCardProps) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("Waiting for PIN...");
  const [isJoined, setIsJoined] = useState(false);

  const progress =
    transfer.fileSize === 0
      ? 0
      : (transfer.bytesTransferred / transfer.fileSize) * 100;

  const pinRef = useRef(pin);
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useEffect(() => {
    const cleanupJoined = socketEvents.onJoined(() => {
      setStatus("PIN accepted! Connecting to the sender...");
      setIsJoined(true);
      onSessionJoin(pinRef.current);
    });

    const cleanupError = socketEvents.onSessionError(({ message }) => {
      if (
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("invalid")
      ) {
        setStatus("That PIN doesn't match any active rooms. Please check it and try again.");
      } else {
        setStatus(message);
      }
      setIsJoined(false);
    });

    // Handle sender dropping out mid-session
    const cleanupPeerDisconnected = socketEvents.onPeerDisconnected(({ peerId }) => {
      if (peerId === pinRef.current) {
        setStatus("The sender disconnected. Transfer canceled.");
      }
    });

    return () => {
      cleanupJoined();
      cleanupError();
      cleanupPeerDisconnected();
    };
  }, [onSessionJoin]);

  useEffect(() => {
    if (!isJoined) return;

    if (connectionState === "connecting") {
      setStatus("Linking your devices securely...");
    } else if (connectionState === "connected") {
      setStatus("Connected! Ready to receive your file.");
    } else if (connectionState === "failed") {
      setStatus("Connection lost. Please check your internet connection and try again.");
    }
  }, [connectionState, isJoined]);

  const handleConnect = () => {
    if (pin.length !== 6) return;
    setStatus("Authenticating PIN...");
    setSessionPin(pin);
    onSessionJoin(pin);
    socketActions.joinSession(pin);
  };

  // Condition to check if an active failure state exists
  const isFailedOrCanceled =
    connectionState === "failed" ||
    status.includes("doesn't match") ||
    status.includes("canceled") ||
    status.includes("lost");

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

        {/* Dynamic color classing for human errors & network failure states */}
        <p
          className={`mt-2 font-medium ${
            isFailedOrCanceled
              ? "text-rose-400"
              : connectionState === "connected"
              ? "text-emerald-400"
              : "text-blue-400"
          }`}
        >
          {status}
        </p>

        {/* Only display file details and progress if things are going smoothly */}
        {sessionMode === "receiver" && transfer.fileSize > 0 && !isFailedOrCanceled && (
          <>
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Receiving
              </p>

              <p className="mt-1 break-all font-medium text-white">
                {transfer.fileName}
              </p>
            </div>

            <div className="mt-4 flex justify-between text-sm text-zinc-400">
              <span>
                {(transfer.bytesTransferred / 1024 / 1024).toFixed(2)} MB
              </span>

              <span>{(transfer.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-100"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="mt-2 text-right text-sm text-zinc-400">
              {progress.toFixed(1)}%
            </div>

            <p className="mt-2 text-sm text-zinc-400">
              {(transfer.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s
            </p>
          </>
        )}

        {/* Informative next steps printed on broken states */}
        {isFailedOrCanceled && (
          <div className="mt-4 border-t border-zinc-700/50 pt-3 text-xs text-zinc-400">
            <p>Please double-check your PIN with the sender or refresh the page to restart.</p>
          </div>
        )}
      </div>
    </div>
  );
}