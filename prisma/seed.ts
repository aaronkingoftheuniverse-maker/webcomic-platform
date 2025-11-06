/**
 * Prisma Seed Script for Webcomic Platform MVP
 * --------------------------------------------
 * Creates:
 *  - Admin and User accounts
 *  - A sample Comic with Posts and layered Images
 *  - A Comment linked safely by post slug
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");
// development-only: wipe tables so seed is idempotent
await prisma.comment.deleteMany({});
await prisma.image.deleteMany({});
await prisma.post.deleteMany({});
await prisma.comic.deleteMany({});
await prisma.setting.deleteMany({});
await prisma.user.deleteMany({});

  // ------------------------
  // USERS
  // ------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      username: "AdminUser",
      email: "admin@example.com",
      password: "hashed_admin_password", // hash in production
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {},
    create: {
      username: "ReaderUser",
      email: "reader@example.com",
      password: "hashed_password",
      role: "USER",
    },
  });

  console.log("✅ Users seeded");

  // ------------------------
  // COMICS + POSTS + IMAGES
  // ------------------------
  await prisma.$transaction([
    prisma.comic.create({
      data: {
        title: "Star Drift",
        slug: "star-drift",
        description: "A sci-fi adventure through drifting galaxies.",
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
                    filename: "drift_layer1.png",
                    order: 1,
                    storagePath: "uploads/drift_layer1.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "drift_layer2.png",
                    order: 2,
                    storagePath: "uploads/drift_layer2.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "drift_layer3.png",
                    order: 3,
                    storagePath: "uploads/drift_layer3.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "drift_layer4.png",
                    order: 4,
                    storagePath: "uploads/drift_layer4.png",
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
                    filename: "collision_layer1.png",
                    order: 1,
                    storagePath: "uploads/collision_layer1.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "collision_layer2.png",
                    order: 2,
                    storagePath: "uploads/collision_layer2.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "collision_layer3.png",
                    order: 3,
                    storagePath: "uploads/collision_layer3.png",
                    storageProvider: "local",
                  },
                  {
                    filename: "collision_layer4.png",
                    order: 4,
                    storagePath: "uploads/collision_layer4.png",
                    storageProvider: "local",
                  },
                ],
              },
            },
          ],
        },
      },
    }),
  ]);

  console.log("✅ Comics, posts, and images seeded");

  // ------------------------
  // COMMENTS (linked by slug)
  // ------------------------
  const targetPost = await prisma.post.findUnique({
    where: { slug: "drift" },
  });

  if (!targetPost) {
    throw new Error("Expected seeded post with slug 'drift' not found.");
  }

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

// ------------------------
// EXECUTION WRAPPER
// ------------------------
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
