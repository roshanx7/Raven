import { useEffect, useRef, useState } from "react";

import { socketActions } from "../services/socketActions";
import { socketEvents } from "../services/socketEvents";
import { Upload, File, Copy } from "lucide-react";
import toast from "react-hot-toast";


import type { TransferState } from "../services/transfer/TransferState";

// 1. Declare the props interface to satisfy Landing.tsx type rules

interface SenderCardProps {
  disabled: boolean;
  onSessionStart: (pin: string) => void;

  createOffer: (sessionPin?: string) => Promise<void>;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  sendFile: (file: File) => Promise<void>;
  transfer: TransferState;
}

export default function SenderCard({
  disabled,
  onSessionStart,
  createOffer,
  connectionState,
  dataChannelReady,
  sendFile,
  transfer,
}: SenderCardProps) {
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(
    null,
  );
  const [pin, setPin] = useState("------");
  const [status, setStatus] = useState("Choose a file to start sharing");
  const pinRef = useRef(pin);

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  //only for testing purposes, to send metadata when the data channel is ready and a file is selected
  useEffect(() => {
    if (!dataChannelReady || !selectedFile) return;

    sendFile(selectedFile);
  }, [dataChannelReady, selectedFile]);

  useEffect(() => {
    // Fired when the backend returns a unique PIN for this session
    const cleanupSessionCreated = socketEvents.onSessionCreated(({ pin }) => {
      pinRef.current = pin;
      setPin(pin);
      setStatus("Waiting for receiver...");
      onSessionStart(pin); // Notify parent component of the new session
    });

    // Fired when the receiver types PIN and joins the session.
    const cleanupReceiverJoined = socketEvents.onReceiverJoined(() => {
      setStatus("Receiver connected! Initializing peer pipeline...");
      createOffer(pinRef.current);
    });

    // Fired when the receiver disconnects from the session.
    const cleanupPeerDisconnected = socketEvents.onPeerDisconnected(
      ({ peerId }) => {
        if (peerId === pin) {
          setStatus("Receiver disconnected! Session ended.");
        }
      },
    );

    return () => {
      cleanupSessionCreated();
      cleanupReceiverJoined();
      cleanupPeerDisconnected();
    };
  }, [onSessionStart, createOffer]);

  // Mirror WebRTC native connection states back into the human-readable UI status block
  useEffect(() => {
    if (connectionState === "connecting") {
      setStatus("Establishing encrypted P2P bridge...");
    } else if (connectionState === "connected") {
      setStatus("Securely connected! Stream channel ready.");
    } else if (connectionState === "failed") {
      setStatus("Connection dropped. Please re-select file to retry.");
    }
  }, [connectionState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    // Note: We use globalThis.File to clearly differentiate between JavaScript's native
    // File binary object and Lucide's <File /> icon component.
    const file = e.target.files[0];

    setSelectedFile(file);

    // (async () => {
    //   for await (const chunk of chunkFile(file)) {
    //     console.log(chunk.size);
    //   }
    // })();

    setStatus("Creating session...");

    socketActions.createSession();
  };

  return (
    <div
      className={`rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-lg transition-all duration-300
        ${disabled ? "opacity-30 pointer-events-none scale-95" : "hover:border-white/20 hover:-translate-y-1"}
      `}
    >
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Upload className="h-7 w-7 text-blue-500" />
        Send
      </h2>

      {!selectedFile ? (
        <>
          <label
            htmlFor="file"
            className="mt-6 flex h-44 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 transition hover:border-blue-500"
          >
            <div className="text-center">
              <Upload className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
              <p className="text-lg font-medium">Choose a file</p>
              <p className="mt-2 text-sm text-zinc-400">Click here to browse</p>
            </div>
          </label>

          <input
            id="file"
            type="file"
            className="hidden"
            disabled={disabled}
            onChange={handleFileChange}
          />
        </>
      ) : (
        <>
          <div className="mt-6 rounded-xl bg-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <File className="h-6 w-6 text-blue-400" />
              <div>
                <p className="font-medium break-all">{selectedFile.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Share this PIN</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-3xl font-bold tracking-[0.4em]">{pin}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pin);
                  toast.custom(() => (
                    <div className="rounded-xl border border-slate-700 bg-zinc-900 px-4 py-3 shadow-lg">
                      <p className="font-medium text-white">
                        PIN copied to clipboard!
                      </p>
                    </div>
                  ));
                }}
                className="rounded-lg bg-white p-2 text-black transition hover:bg-zinc-200"
                title="Click to copy pin to clipboard"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Status</p>
            <p
              className={`mt-2 font-medium ${connectionState === "connected" ? "text-emerald-400" : "text-blue-400"}`}
            >
              {status}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
