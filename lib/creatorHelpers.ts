import { prisma } from "@/config/prisma";
import { CreatorProfileNotFoundError } from "./errors";

/**
 * Ensures a user has a creator profile and returns it.
 * Throws an error if the profile is not found.
 * @param userId - The ID of the user to check.
 */
export async function requireCreatorProfile(userId: number) {
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: userId },
  });

  if (!creatorProfile) {
    throw new CreatorProfileNotFoundError("User does not have a creator profile.");
  }

  return creatorProfile;
}

/**
 * Generates a URL-friendly slug from a string.
 * @param text The string to slugify.
 */
export function generateSlug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}