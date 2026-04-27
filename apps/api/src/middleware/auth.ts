import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, _req, res) => {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  },
});
