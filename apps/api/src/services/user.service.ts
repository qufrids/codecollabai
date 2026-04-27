import { prisma } from "../db/prisma";
import { User } from "@clerk/clerk-sdk-node";

export async function syncUser(clerkUser: User): Promise<{
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
}> {
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) {
    return existing;
  }

  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    "";

  const name =
    clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.username || null;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      name,
    },
  });
}
