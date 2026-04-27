import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * WebSocket URL for Yjs collaboration.
 * Set NEXT_PUBLIC_WS_URL to your deployed Render backend WebSocket URL (e.g. wss://your-app.onrender.com/ws).
 * Falls back to ws://localhost:4000/ws for local development.
 */
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

const docs = new Map<string, Y.Doc>();
const providers = new Map<string, WebsocketProvider>();

export function getYjsProvider(roomId: string): {
  doc: Y.Doc;
  provider: WebsocketProvider;
} {
  let doc = docs.get(roomId);
  let provider = providers.get(roomId);

  if (!doc || !provider) {
    doc = new Y.Doc();
    provider = new WebsocketProvider(WS_URL, roomId, doc, {
      connect: true,
      maxBackoffTime: 5000,
    });

    docs.set(roomId, doc);
    providers.set(roomId, provider);
  }

  return { doc, provider };
}

export function disconnectYjs(roomId: string) {
  const provider = providers.get(roomId);
  if (provider) {
    provider.disconnect();
    providers.delete(roomId);
  }
  const doc = docs.get(roomId);
  if (doc) {
    doc.destroy();
    docs.delete(roomId);
  }
}
