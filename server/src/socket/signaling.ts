import { Server, Socket } from "socket.io";
import sessionManager from "../sessions/SessionManager";
import { generatePin } from "../utils/generatePin";

export function registerSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Connected:", socket.id);

    // 1. Session Creation (Sender side)
    socket.on("create-session", () => {
      const pin = generatePin();
      sessionManager.create(pin, socket.id); // Create the session.
      
      socket.emit("session-created", { pin }); // Send to the client.
      console.log("Active Sessions after creation:", sessionManager.getAll());
    });

    // 2. Session Joining (Receiver side)
    socket.on("join-session", ({ pin }) => {
      const joinResult = sessionManager.join(pin, socket.id);

      if (joinResult === "INVALID_PIN") {
        socket.emit("session-error", { message: "Invalid PIN" }); // Send to the client.
        return;
      }

      if (joinResult === "ROOM_FULL") {
        socket.emit("session-error", { message: "This session is already full" }); // Send to the client.
        return;
      }

      // Safe to fetch session now that validation passed
      const session = sessionManager.get(pin)!;

      // Notify the sender that a receiver joined so the sender can call createOffer()
      io.to(session.senderSocketId).emit("receiver-joined"); // Send to the sender
      socket.emit("joined"); // Send to the receiver

      console.log("Active Sessions after receiver join:", sessionManager.getAll());
    });

    // 3. Forward SDP Offer from Sender to Receiver
    socket.on("offer", ({ pin, offer }) => {
      const session = sessionManager.get(pin); // Get the session.
      if (session && session.receiverSocketId) {
        io.to(session.receiverSocketId).emit("offer", { offer }); // Send to the receiver.
      }
    });

    // 4. Forward SDP Answer from Receiver back to Sender
    socket.on("answer", ({ pin, answer }) => {
      console.log("Forwarding answer to room:", pin);
      console.log({
  pin,
  answer,
});
      const session = sessionManager.get(pin);
      if (session && session.senderSocketId) {
        io.to(session.senderSocketId).emit("answer", { answer }); // Send to the sender.
      }
    });

    // 5. Forward ICE Candidates to the opposite peer
    socket.on("ice-candidate", ({ pin, candidate }) => {
      const session = sessionManager.get(pin);
      if (!session) return;

      // Figure out who sent it, then forward to the other person
      const targetSocketId = 
        socket.id === session.senderSocketId 
          ? session.receiverSocketId 
          : session.senderSocketId;

      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", { candidate }); // Send to the opposite peer.
      }
    });

    // 6. Handle Cleanup when a user disconnects
    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
      
      // Clean up the session in memory automatically
      const closedSession = sessionManager.handleDisconnect(socket.id);
      
      if (closedSession) {
        // Determine if there is an active remaining peer left in the room
        const remainingPeerSocketId = 
          socket.id === closedSession.senderSocketId 
            ? closedSession.receiverSocketId 
            : closedSession.senderSocketId;
            
        if (remainingPeerSocketId) {
          // Tell the remaining peer's UI that their partner disconnected
          io.to(remainingPeerSocketId).emit("peer-disconnected", {
            peerId: socket.id,
          }); // Send to the remaining peer.
        }
      }
      
      console.log("Active Sessions after disconnect sweep:", sessionManager.getAll());
    });
  });
}