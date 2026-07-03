// services/transfer/chunker.ts

const DEFAULT_CHUNK_SIZE = 256 * 1024; // 256 KB

export async function* chunkFile(
  file: File,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): AsyncGenerator<Blob> {
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);

    yield chunk;

    offset += chunkSize;
  }
}

//this is a generator function that takes a file and yields chunks of the file as Blob objects. It uses the slice method of the File object to create chunks of specified size (defaulting to 256 KB) and yields them one by one until the entire file has been processed.