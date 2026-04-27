"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "@/lib/api";

interface Room {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  _count: { members: number };
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRooms();
    }
  }, [isLoaded, isSignedIn]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const data = await api.getRooms();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      setCreating(true);
      const room = await api.createRoom(roomName.trim());
      setRooms((prev) => [room, ...prev]);
      setRoomName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setCreating(false);
    }
  }

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
          <a
            href="/"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-900/50 border border-red-700 p-4 text-sm text-red-200">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-300 hover:text-red-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleCreateRoom} className="mb-8 flex gap-3">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !roomName.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Room"}
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-400">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No rooms yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4"
              >
                <div>
                  <h3 className="font-medium text-white">{room.name}</h3>
                  <p className="text-sm text-gray-500">
                    {room._count.members} member{room._count.members !== 1 ? "s" : ""}{" "}
                    · Created {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
