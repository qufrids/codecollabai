import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const WS_URL = "ws://localhost:4000/ws";

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
