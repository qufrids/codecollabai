"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { getYjsProvider, disconnectYjs } from "@/lib/yjs";

// Dynamically import MonacoEditor (no SSR)
const MonacoEditor = dynamic(
  () => import("@/components/editor/MonacoEditor"),
  { ssr: false }
);

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const roomId = params.id as string;

  const [connected, setConnected] = useState(false);
  const [usersCount, setUsersCount] = useState(1);
  const [yjsReady, setYjsReady] = useState(false);
  const [yDoc, setYDoc] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !roomId) return;

    const { doc, provider } = getYjsProvider(roomId);
    setYDoc(doc);

    provider.on("status", (event: { status: string }) => {
      setConnected(event.status === "connected");
    });

    // Track awareness (connected users)
    const awareness = provider.awareness;
    const updateUsers = () => {
      const count = awareness.getStates().size;
      setUsersCount(Math.max(count, 1));
    };

    awareness.on("change", updateUsers);
    updateUsers();

    setYjsReady(true);

    return () => {
      awareness.off("change", updateUsers);
      disconnectYjs(roomId);
    };
  }, [roomId, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400">You need to sign in to view this page.</p>
          <a href="/" className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Go Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-sm font-medium text-white">Room: {roomId}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {connected ? "Connected" : "Connecting..."} · {usersCount} user{usersCount !== 1 ? "s" : ""}
            </span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 p-4">
        {yjsReady && yDoc ? (
          <MonacoEditor yDoc={yDoc} roomId={roomId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-400">Initializing editor...</p>
          </div>
        )}
      </div>
    </main>
  );
}
