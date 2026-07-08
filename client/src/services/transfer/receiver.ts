import { MessageType, type TransferMessage } from "./protocol";
import { IncomingTransfer } from "./IncomingTransfer";
import type { ReceiveTransferCallbacks } from "./transferCallbacks";

let currentTransfer: IncomingTransfer | null = null;
let bytesReceived = 0;
let startTime = 0;

export function handleIncomingMessage(
  event: MessageEvent,
  callbacks?: ReceiveTransferCallbacks,
) {
  // Binary chunk received
  if (event.data instanceof ArrayBuffer) {
    if (!currentTransfer) {
      console.error("No active transfer.");
      return;
    }

    currentTransfer.assembler.addChunk(event.data);

    bytesReceived += event.data.byteLength;

    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const bytesPerSecond = bytesReceived / elapsedSeconds;

    callbacks?.onProgress?.(bytesReceived, bytesPerSecond);

    return;
  }

  const message: TransferMessage = JSON.parse(event.data);

  switch (message.type) {
    case MessageType.METADATA:
      bytesReceived = 0;
      startTime = performance.now();

      currentTransfer = new IncomingTransfer(
        message.name,
        message.size,
        message.mimeType,
      );

      callbacks?.onMetadata?.(message.name, message.size, message.mimeType);

      break;

    case MessageType.END_OF_FILE: {
      if (!currentTransfer) return;

      console.log("Transfer finished.");

      const blob = currentTransfer.assembler.buildFile(
        currentTransfer.mimeType,
      );

      console.log("Blob size:", blob.size);

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = currentTransfer.name;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      callbacks?.onComplete?.();

      currentTransfer.assembler.clear();
      currentTransfer = null;
      bytesReceived = 0;
      startTime = 0;

      break;
    }
  }
}
