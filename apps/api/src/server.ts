import express from "express";
import cors from "cors";
import { prisma } from "./db/prisma";
import { requireAuth } from "./middleware/auth";
import { syncUser } from "./services/user.service";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
