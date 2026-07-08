export interface SendTransferCallbacks {
  onStart?: (file: File) => void;

  onProgress?: (bytesTransferred: number, bytesPerSecond: number) => void;

  onComplete?: () => void;

  onError?: (error: Error) => void;
}

export interface ReceiveTransferCallbacks {
  onMetadata?: (
    name: string,
    size: number,
    mimeType: string,
  ) => void;

  onProgress?: (
    bytesTransferred: number,
    bytesPerSecond: number,
  ) => void;

  onComplete?: () => void;

  onError?: (error: Error) => void;
}
