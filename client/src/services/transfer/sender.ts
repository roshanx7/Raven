import { chunkFile } from "./chunker";
import { MessageType, type MetadataMessage } from "./protocol";
import { waitForBuffer } from "./flowControl";

async function sendMetadata(channel: RTCDataChannel, file: File) {
  const message: MetadataMessage = {
    type: MessageType.METADATA,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };

  channel.send(JSON.stringify(message));
}

async function sendChunk(channel: RTCDataChannel, chunk: Blob) {
  const buffer = await chunk.arrayBuffer();
  channel.send(buffer);
}

function sendEndOfFile(channel: RTCDataChannel) {
  channel.send(
    JSON.stringify({
      type: MessageType.END_OF_FILE,
    }),
  );
}

export async function sendFileTransfer(channel: RTCDataChannel, file: File) {
  // 1. Tell receiver what file is coming
  await sendMetadata(channel, file);

  const start = performance.now();
  // 2. Send every chunk
  let chunkCount = 0;
  for await (const chunk of chunkFile(file)) {
    await waitForBuffer(channel);
    await sendChunk(channel, chunk);

    chunkCount++;

    if (chunkCount % 100 === 0) {
      console.log(
        `Chunk ${chunkCount}, bufferedAmount = ${channel.bufferedAmount}`,
      );
    }
  }

  // 3. Tell receiver we're done
  sendEndOfFile(channel);

  const end = performance.now();
  console.log(
    `Transfer completed in ${((end - start) / 1000).toFixed(2)} seconds`,
  );
}
