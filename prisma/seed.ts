/**
 * Prisma Seed Script for Webcomic Platform MVP
 * --------------------------------------------
 * Creates:
 *  - Admin, User, and Creator accounts (with bcrypt-hashed passwords)
 *  - A CreatorProfile linked to the Creator user
 *  - A sample Comic (linked to the CreatorProfile) with Posts + Images
 *  - A Comment linked safely by post slug
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

  const [admin, user, creatorUser] = await Promise.all([
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
        username: "ReaderUser",
        email: "reader@example.com",
        passwordHash: userPassword,
        role: "USER",
      },
    }),
    prisma.user.create({
      data: {
        username: "CreatorUser",
        email: "creator@example.com",
        passwordHash: creatorPassword,
        role: "CREATOR",
      },
    }),
  ]);

  console.log("✅ Users created:", {
    admin: admin.email,
    user: user.email,
    creator: creatorUser.email,
  });

  // ------------------------------------------
  // CREATOR PROFILE
  // ------------------------------------------
  console.log("🧑‍🎨 Creating creator profile...");

  const creatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: creatorUser.id,
      bio: "Webcomic creator exploring sci-fi worlds.",
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
      creatorProfileId: creatorProfile.id, // 🔗 tie to creator
      posts: {
        create: [
          {
            postNumber: 1,
            title: "Pilot: Into the Drift",
            slug: "drift",
            description: "Our hero takes the first step beyond the stars.",
            images: {
              create: [
                {
                  filename: "first.png",
                  order: 1,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 2,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 3,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 4,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
              ],
            },
          },
          {
            postNumber: 2,
            title: "Episode 2: Collision",
            slug: "collision",
            description: "An encounter with a rogue asteroid tests the crew.",
            images: {
              create: [
                {
                  filename: "first.png",
                  order: 1,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 2,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 3,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
                {
                  filename: "first.png",
                  order: 4,
                  storagePath: "public/uploads/posts/first.png",
                  storageProvider: "local",
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("✅ Comic created:", comic.title);

  // ------------------------------------------
  // COMMENTS (linked by post slug)
  // ------------------------------------------
  console.log("💬 Seeding comment...");

  const targetPost = await prisma.post.findUnique({
    where: { slug: "drift" },
  });

  if (!targetPost) throw new Error("Expected seeded post with slug 'drift' not found.");

  await prisma.comment.create({
    data: {
      content: "This is an amazing first episode!",
      userId: user.id,
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
