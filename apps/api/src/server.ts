import express from "express";
import cors from "cors";
import http from "http";
import { prisma } from "./db/prisma";
import { requireAuth } from "./middleware/auth";
import { syncUser } from "./services/user.service";
import { setupYjsWebSocket } from "./websocket/yjsServer";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ── CORS ──────────────────────────────────────────────────

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  /^https:\/\/.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => (typeof o === "string" ? o === origin : o.test(origin)))) {
        return callback(null, true);
      }
      console.warn(`Blocked by CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Health check ──────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Public routes ─────────────────────────────────────────

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── Protected routes ──────────────────────────────────────

app.post("/rooms", requireAuth, async (req: any, res: any) => {
  try {
    const dbUser = await syncUser(req.auth.user);
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Room name is required" });
    }

    const room = await prisma.room.create({
      data: {
        name,
        ownerId: dbUser.id,
        members: {
          create: {
            userId: dbUser.id,
            role: "owner",
          },
        },
      },
      include: {
        members: true,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.post("/rooms/:id/join", requireAuth, async (req: any, res: any) => {
  try {
    const dbUser = await syncUser(req.auth.user);
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const existingMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: id,
          userId: dbUser.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: "Already a member of this room" });
    }

    const member = await prisma.roomMember.create({
      data: {
        roomId: id,
        userId: dbUser.id,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

app.get("/rooms", requireAuth, async (req: any, res: any) => {
  try {
    const dbUser = await syncUser(req.auth.user);

    const memberships = await prisma.roomMember.findMany({
      where: { userId: dbUser.id },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: {
        room: {
          createdAt: "desc",
        },
      },
    });

    const rooms = memberships.map((m) => m.room);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// ── HTTP + WebSocket server ───────────────────────────────

const server = http.createServer(app);
setupYjsWebSocket(server);

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`CORS origin: ${FRONTEND_URL}`);
});
