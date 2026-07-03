const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generatePin(length = 6): string {
  let pin = "";

  for (let i = 0; i < length; i++) {
    pin += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return pin;
}