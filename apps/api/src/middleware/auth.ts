import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

export const requireAuth = ClerkExpressRequireAuth({
  onError: (err: any) => {
    console.error("Auth error:", err);
  },
});
