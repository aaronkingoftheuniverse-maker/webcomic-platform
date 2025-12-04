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
  await prisma.episode.deleteMany({});
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
  console.log("📚 Seeding comics, episodes, posts, and images...");

  const comic = await prisma.comic.create({
    data: {
      title: "Star Drift",
      slug: "star-drift",
      description: "A sci-fi adventure through drifting galaxies.",
      coverImage: "/covers/star-drift.png",
      creatorProfileId: creatorProfile.id,
      episodes: {
        create: [
          // --- Episode 1 ---
          {
            episodeNumber: 1,
            title: "Book 1: The Anomaly",
            slug: "book-1-the-anomaly",
            description: "The journey begins as the crew encounters a strange gravitational anomaly.",
            thumbnailUrl: "/covers/book-1.png",
            posts: {
              create: {
                postNumber: 1,
                title: "Chapter 1: Into the Drift",
                slug: "into-the-drift", // Used for comment target
                description: "Our hero takes the first step beyond the stars.",
                images: {
                  create: Array.from({ length: 4 }).map((_, i) => ({
                    filename: `drift-p${i + 1}.png`,
                    order: i + 1,
                    storagePath: `public/uploads/posts/drift-p${i + 1}.png`,
                    storageProvider: "local",
                  })),
                },
              },
            },
          },
          // --- Episode 2 ---
          {
            episodeNumber: 3, // Note: non-sequential to allow for nested episodes
            title: "Book 2: Echoes",
            slug: "book-2-echoes",
            description: "A mysterious signal leads the crew to an ancient derelict ship.",
            thumbnailUrl: "/covers/book-2.png",
            posts: {
              create: {
                postNumber: 1,
                title: "Chapter 2: Collision",
                slug: "collision",
                description: "An encounter with a rogue asteroid tests the crew.",
                images: {
                  create: Array.from({ length: 4 }).map((_, i) => ({
                    filename: `collision-p${i + 1}.png`,
                    order: i + 1,
                    storagePath: `public/uploads/posts/collision-p${i + 1}.png`,
                    storageProvider: "local",
                  })),
                },
              },
            },
          },
        ],
      },
    },
    include: {
      episodes: { include: { posts: { include: { images: true } } } },
    },
  });

  console.log("✅ Comic created:", comic.title);

  // --- Create Nested Episode (must be done separately) ---
  const parentEpisode = comic.episodes.find(
    (ep) => ep.slug === "book-1-the-anomaly"
  );

  if (parentEpisode) {
    await prisma.episode.create({
      data: {
        episodeNumber: 2,
        title: "Book 1.5: Lost Signal",
        slug: "book-1-lost-signal",
        description: "A short story between books.",
        thumbnailUrl: "/covers/book-1-5.png",
        comicId: comic.id, // Explicitly set the comicId
        parentId: parentEpisode.id, // Explicitly set the parentId
      },
    });
    console.log("✅ Nested episode created.");
  }

  // ------------------------------------------
  // SET POST THUMBNAILS
  // ------------------------------------------
  console.log("🖼️  Setting post thumbnails...");
  const postsToUpdate = comic.episodes.flatMap((ep) => ep.posts);

  for (const post of postsToUpdate) {
    if (post.images.length > 0) {
      await prisma.post.update({
        where: { id: post.id },
        data: { thumbnailImageId: post.images[0].id },
      });
    }
  }
  console.log(`✅ Thumbnails set for ${postsToUpdate.length} posts.`);

  // ------------------------------------------
  // COMMENTS
  // ------------------------------------------
  console.log("💬 Seeding comment...");

  const targetPost = await prisma.post.findUnique({
    where: { slug: "into-the-drift" },
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
