export interface Session {
  pin: string;
  senderSocketId: string;
  receiverSocketId?: string;
  createdAt: number;
}

class SessionManager {
  private sessions = new Map<string, Session>();

  create(pin: string, senderSocketId: string): void {
    this.sessions.set(pin, {
      pin,
      senderSocketId,
      createdAt: Date.now(),
    });
  }

  get(pin: string): Session | undefined {
    return this.sessions.get(pin);
  }

  join(pin: string, receiverSocketId: string): "SUCCESS" | "INVALID_PIN" | "ROOM_FULL" {
    const session = this.sessions.get(pin);

    if (!session) return "INVALID_PIN";
    
    // Prevent a third party from highjacking an established session
    if (session.receiverSocketId) return "ROOM_FULL";

    session.receiverSocketId = receiverSocketId;
    return "SUCCESS";
  }

  delete(pin: string): boolean {
    return this.sessions.delete(pin);
  }

  /**
   * Sweeps the data store and removes any sessions tied to a disconnected socket ID.
   * Returns information about the closed session so the server can alert the remaining peer.
   */
  handleDisconnect(socketId: string): Session | null {
    for (const [pin, session] of this.sessions.entries()) {
      if (session.senderSocketId === socketId || session.receiverSocketId === socketId) {
        this.sessions.delete(pin);
        return session; // Return details so we can alert the survivor
      }
    }
    return null;
  }

  getAll(): Session[] {
    return [...this.sessions.values()];
  }
}

export default new SessionManager();