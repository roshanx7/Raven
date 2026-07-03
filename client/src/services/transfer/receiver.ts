import { MessageType, type TransferMessage } from "./protocol";
import { IncomingTransfer } from "./IncomingTransfer";

let currentTransfer: IncomingTransfer | null = null;
export function handleIncomingMessage(event: MessageEvent) {
  if (event.data instanceof ArrayBuffer) {
    if (!currentTransfer) {
      console.error("No active transfer.");
      return;
    }

    currentTransfer.assembler.addChunk(event.data);

    // console.log("Received binary chunk:", event.data.byteLength);

    return;
  }

  const message: TransferMessage = JSON.parse(event.data);

  switch (message.type) {
    case MessageType.METADATA:
      console.log("Incoming file:");
      currentTransfer = new IncomingTransfer(
        message.name,
        message.size,
        message.mimeType,
      );

      console.log("Incoming file:");
      console.log(currentTransfer);

      break;

    case MessageType.END_OF_FILE: {
      if (!currentTransfer) return;

      
      console.log("Transfer finished.");
        console.log(currentTransfer);
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
      

    //   setTimeout(() => URL.revokeObjectURL(url), 1000);
    URL.revokeObjectURL(url);

      currentTransfer.assembler.clear();
      currentTransfer = null;

      break;
    }
  }
}
