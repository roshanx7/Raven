import { chunkFile } from "./chunker";
import { MessageType, type MetadataMessage } from "./protocol";
import { waitForBuffer } from "./flowControl";
import type { SendTransferCallbacks } from "./transferCallbacks";

//sends metadata.
async function sendMetadata(channel: RTCDataChannel, file: File) {
  const message: MetadataMessage = {
    type: MessageType.METADATA,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };

  channel.send(JSON.stringify(message));
}

// //sends chunks.
// async function sendChunk(channel: RTCDataChannel, chunk: Blob) {
//   const buffer = await chunk.arrayBuffer();
//   channel.send(buffer);
// }

//sends end of file message.

function sendEndOfFile(channel: RTCDataChannel) {
  channel.send(
    JSON.stringify({
      type: MessageType.END_OF_FILE,
    }),
  );
}

export async function sendFileTransfer(
  channel: RTCDataChannel,
  file: File,
  callbacks?: SendTransferCallbacks,
) {
  callbacks?.onStart?.(file);
  let bytesTransferred = 0;
  // 1. Tell receiver what file is coming
  await sendMetadata(channel, file);

  const start = performance.now(); //to measure file transfer time.
  // 2. Send every chunk

  for await (const chunk of chunkFile(file)) {
    // await waitForBuffer(channel);
    // await sendChunk(channel, chunk);
    const buffer = await chunk.arrayBuffer();

    await waitForBuffer(channel);

    channel.send(buffer);

    bytesTransferred += buffer.byteLength;

    const elapsedSeconds = (performance.now() - start) / 1000;

    const bytesPerSecond = bytesTransferred / elapsedSeconds;

    callbacks?.onProgress?.(bytesTransferred, bytesPerSecond);
  }

  // 3. Tell receiver we're done
  sendEndOfFile(channel);

  const end = performance.now();
  console.log(
    `Transfer completed in ${((end - start) / 1000).toFixed(2)} seconds`,
  );
  callbacks?.onComplete?.();
}
