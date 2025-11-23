import { prisma } from "@/config/prisma";

export async function getCreatorProfile(userId: string) {
  return prisma.creatorProfile.findUnique({ where: { userId } });
}