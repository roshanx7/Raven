import { sendFileTransfer } from "./sender";
import { handleIncomingMessage } from "./receiver";
import type {
  SendTransferCallbacks,
  ReceiveTransferCallbacks,
} from "./transferCallbacks";

export class TransferManager {
  async send(
  channel: RTCDataChannel,
  file: File,
  callbacks?: SendTransferCallbacks,
) {
  await sendFileTransfer(channel, file, callbacks);
}

receive(
  event: MessageEvent,
  callbacks?: ReceiveTransferCallbacks,
) {
  handleIncomingMessage(event, callbacks);
}
}

export const transferManager = new TransferManager();