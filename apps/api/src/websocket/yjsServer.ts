import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";

// Track connections per room
const connections = new Map<string, Set<WebSocket>>();

export function setupYjsWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const roomId = url.searchParams.get("roomId");

    if (!roomId) {
      ws.close(4000, "roomId query parameter required");
      return;
    }

    // Get or create Yjs document for this room
    let doc = docs.get(roomId);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(roomId, doc);
    }

    // Track connected clients for this room
    if (!connections.has(roomId)) {
      connections.set(roomId, new Set());
    }
    connections.get(roomId)!.add(ws);

    // Send current document state to new client (sync step 1)
    const initialState = Y.encodeStateAsUpdate(doc);
    const syncMessage = Buffer.concat([
      Buffer.from("0", "utf-8"), // sync step 1 prefix
      initialState,
    ]);
    ws.send(syncMessage);

    // Handle incoming updates
    ws.on("message", (data: Buffer) => {
      try {
        Y.applyUpdate(doc, data);

        // Broadcast to all other clients in the same room
        const roomConnections = connections.get(roomId);
        if (roomConnections) {
          for (const client of roomConnections) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
          }
        }
      } catch (err) {
        console.error("Error applying Yjs update:", err);
      }
    });

    ws.on("close", () => {
      const roomConnections = connections.get(roomId);
      if (roomConnections) {
        roomConnections.delete(ws);
        if (roomConnections.size === 0) {
          // Cleanup empty rooms after a delay
          setTimeout(() => {
            const stillActive = connections.get(roomId);
            if (stillActive && stillActive.size === 0) {
              connections.delete(roomId);
              docs.delete(roomId);
            }
          }, 60000);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  console.log("Yjs WebSocket server attached at /ws");
}

// Track Yjs documents per room
const docs = new Map<string, Y.Doc>();
