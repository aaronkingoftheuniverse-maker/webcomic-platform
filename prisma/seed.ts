/**
 * Prisma Seed Script (Hybrid Role Model)
 * --------------------------------------
 * Creates:
 *  - Admin user (role: ADMIN)
 *  - Regular user (role: USER)
 *  - User who becomes a Creator once they publish (has CreatorProfile)
 *  - A CreatorProfile linked to creatorUser
 *  - Comic + Posts + Images tied to creatorProfile
 *  - A Comment from the regular User
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ------------------------------------------
  // DEVELOPMENT-ONLY: wipe tables for idempotent seeds
  // ------------------------------------------
  console.log("🧹 Clearing existing data...");
  await prisma.comment.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.comic.deleteMany({});
  await prisma.creatorProfile.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.loginLog.deleteMany({});
  await prisma.apiAccessLog.deleteMany({});
  await prisma.user.deleteMany({});

  // ------------------------------------------
  // USERS
  // ------------------------------------------
  console.log("👤 Seeding users...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("password123", 10);
  const creatorPassword = await bcrypt.hash("password123", 10);

  const [admin, regularUser, creatorUser] = await Promise.all([
    prisma.user.create({
      data: {
        username: "AdminUser",
        email: "admin@example.com",
        passwordHash: adminPassword,
        role: "ADMIN",
      },
    }),

    prisma.user.create({
      data: {
        username: "RegularUser",
        email: "regular@example.com",
        passwordHash: userPassword,
        role: "USER",
      },
    }),

    prisma.user.create({
      data: {
        username: "CreatorUser",
        email: "creator@example.com",
        passwordHash: creatorPassword,
        role: "USER", // IMPORTANT: creator is now just a user
      },
    }),
  ]);

  console.log("✅ Users created:", {
    admin: admin.email,
    regular: regularUser.email,
    creator: creatorUser.email,
  });

  // ------------------------------------------
  // CREATOR PROFILE (hybrid method)
  // ------------------------------------------
  console.log("🧑‍🎨 Creating creator profile...");

  const creatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: creatorUser.id,
      bio: "Sci-fi webcomic creator.",
      website: "https://example.com/star-drift",
      avatarUrl: "/avatars/creator.png",
    },
  });

  console.log("✅ Creator profile created for:", creatorUser.username);

  // ------------------------------------------
  // COMICS + POSTS + IMAGES
  // ------------------------------------------
  console.log("📚 Seeding comics, posts, and images...");

  const comic = await prisma.comic.create({
    data: {
      title: "Star Drift",
      slug: "star-drift",
      description: "A sci-fi adventure through drifting galaxies.",
      creatorProfileId: creatorProfile.id,
      posts: {
        create: [
          {
            postNumber: 1,
            title: "Pilot: Into the Drift",
            slug: "drift",
            description: "Our hero takes the first step beyond the stars.",
            images: {
              create: Array.from({ length: 4 }).map((_, i) => ({
                filename: "first.png",
                order: i + 1,
                storagePath: "public/uploads/posts/first.png",
                storageProvider: "local",
              })),
            },
          },
          {
            postNumber: 2,
            title: "Episode 2: Collision",
            slug: "collision",
            description: "An encounter with a rogue asteroid tests the crew.",
            images: {
              create: Array.from({ length: 4 }).map((_, i) => ({
                filename: "first.png",
                order: i + 1,
                storagePath: "public/uploads/posts/first.png",
                storageProvider: "local",
              })),
            },
          },
        ],
      },
    },
  });

  console.log("✅ Comic created:", comic.title);

  // ------------------------------------------
  // COMMENTS
  // ------------------------------------------
  console.log("💬 Seeding comment...");

  const targetPost = await prisma.post.findUnique({
    where: { slug: "drift" },
  });

  if (!targetPost) {
    throw new Error("Expected seeded post with slug 'drift' not found.");
  }

  await prisma.comment.create({
    data: {
      content: "Amazing start! Can't wait for more.",
      userId: regularUser.id,
      postId: targetPost.id,
    },
  });

  console.log("✅ Comment seeded");
  console.log("🌱 Seeding complete!");
}

// ------------------------------------------
// EXECUTION WRAPPER
// ------------------------------------------
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
