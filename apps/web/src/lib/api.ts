/**
 * Base URL for the backend API.
 * Set NEXT_PUBLIC_API_URL to your deployed Render backend URL (e.g. https://your-app.onrender.com).
 * Falls back to localhost:4000 for local development.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  getRooms: () => fetchWithAuth("/rooms"),

  createRoom: (name: string) =>
    fetchWithAuth("/rooms", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  joinRoom: (id: string) =>
    fetchWithAuth(`/rooms/${id}/join`, {
      method: "POST",
    }),
};
