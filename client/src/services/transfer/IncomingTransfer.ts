import { FileAssembler } from "./assembler";

export class IncomingTransfer {
  name: string;
  size: number;
  mimeType: string;

  assembler = new FileAssembler();

  constructor(
    name: string,
    size: number,
    mimeType: string
  ) {
    this.name = name;
    this.size = size;
    this.mimeType = mimeType;
  }
}