export class FileAssembler {
  private chunks: BlobPart[] = [];

  addChunk(chunk: BlobPart) {
    // console.log("Adding chunk:", chunk);
    this.chunks.push(chunk);
  }

  buildFile(mimeType: string) {
    return new Blob(this.chunks, {
      type: mimeType,
    });
  }

  clear() {
    this.chunks = [];
  }
}