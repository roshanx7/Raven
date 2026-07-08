export type TransferStatus =
  | "idle"
  | "connecting"
  | "sending"
  | "receiving"
  | "completed"
  | "cancelled"
  | "failed";

export interface TransferState {
  // File information
  fileName: string;
  fileSize: number;
  mimeType: string;

  // Progress
  bytesTransferred: number;

  // Speed
  bytesPerSecond: number;

  // Remaining time
  etaSeconds: number;

  // Current transfer state
  status: TransferStatus;
}

export const initialTransferState: TransferState = {
  fileName: "",
  fileSize: 0,
  mimeType: "",

  bytesTransferred: 0,

  bytesPerSecond: 0,

  etaSeconds: 0,

  status: "idle",
};