export const MAX_BUFFERED_AMOUNT = 4 * 1024 * 1024;

export async function waitForBuffer(channel: RTCDataChannel) {
  while (channel.bufferedAmount >= MAX_BUFFERED_AMOUNT) {
    await new Promise<void>((resolve) => {
      channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT / 2;

      channel.onbufferedamountlow = () => {
        channel.onbufferedamountlow = null;
        resolve();
      };
    });
  }
}