export const MessageType = {
  METADATA: "METADATA",
  END_OF_FILE: "END_OF_FILE",
} as const;

export interface MetadataMessage {
  type: typeof MessageType.METADATA;
  name: string;
  size: number;
  mimeType: string;
}

export interface EndOfFileMessage {
  type: typeof MessageType.END_OF_FILE;
}

export type TransferMessage =
  | MetadataMessage
  | EndOfFileMessage;