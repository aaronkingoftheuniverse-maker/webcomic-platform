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
 *  - Subscriptions between users, comics, and creators
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
  // First, break the self-referencing foreign key constraint by setting parentId to null
  // This is necessary because of the `onDelete: NoAction` in the schema.
  await prisma.episode.updateMany({ data: { parentId: null } });
  // Now it's safe to delete all episodes.
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

  // Define dates for publish statuses
  const now = new Date();
  const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

  const comic = await prisma.comic.create({
    data: {
      title: "Star Drift",
      slug: "star-drift",
      description: "A sci-fi adventure through drifting galaxies.",
      coverImage: "uploads/comics/covers/star-drift-seed.png",
      creatorProfileId: creatorProfile.id,
      episodes: {
        create: [
          // --- Episode 1 ---
          {
            episodeNumber: 1,
            title: "Book 1: The Anomaly",
            slug: "book-1-the-anomaly",
            description: "The journey begins as the crew encounters a strange gravitational anomaly.",
            thumbnailUrl: "uploads/episodes/thumbnails/book-1-seed.png",
            publishedAt: pastDate, // PUBLISHED
            posts: {
              create: {
                postNumber: 1,
                title: "Chapter 1: Into the Drift",
                slug: "into-the-drift", // Used for comment target
                description: "Our hero takes the first step beyond the stars.",
                images: {
                  // prettier-ignore
                  create: Array.from({ length: 4 }).map((_, i) => ({ // Using static names for seed
                    filename: `uploads/posts/images/drift-p${i + 1}-seed.png`,
                    order: i + 1,
                    storageProvider: "local",
                  })),
                },
              }, // End of posts.create
            }, // End of posts object
          },
          // --- Episode 2 ---
          {
            episodeNumber: 3, // Note: non-sequential to allow for nested episodes
            title: "Book 2: Echoes",
            slug: "book-2-echoes",
            description: "A mysterious signal leads the crew to an ancient derelict ship.",
            thumbnailUrl: "uploads/episodes/thumbnails/book-2-seed.png",
            publishedAt: futureDate, // SCHEDULED
            posts: {
              create: {
                postNumber: 1,
                title: "Chapter 2: Collision",
                slug: "collision",
                description: "An encounter with a rogue asteroid tests the crew.",
                publishedAt: futureDate, // SCHEDULED
                images: {
                  create: Array.from({ length: 4 }).map((_, i) => ({ // Using static names for seed
                    filename: `uploads/posts/images/collision-p${i + 1}-seed.png`,
                    order: i + 1,
                    storageProvider: "local",
                  })),
                },
              },
            },
          },
          // --- Episode 3 (Draft) ---
          {
            episodeNumber: 4,
            title: "Book 3: The Void (Draft)",
            slug: "book-3-the-void-draft",
            description: "A new adventure is being written.",
            thumbnailUrl: "uploads/episodes/thumbnails/book-3-seed.png",
            // `publishedAt` is omitted, making this a DRAFT
            posts: {
              create: {
                postNumber: 1,
                title: "Chapter 3: First Contact (Draft)",
                slug: "first-contact-draft",
                description: "The crew makes a startling discovery.",
                // `publishedAt` is omitted, making this a DRAFT
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
        thumbnailUrl: "uploads/episodes/thumbnails/book-1-5-seed.png",
        comicId: comic.id, // Explicitly set the comicId
        parentId: parentEpisode.id, // Explicitly set the parentId
        // `publishedAt` is omitted, making this a DRAFT
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

  // ------------------------------------------
  // SUBSCRIPTIONS
  // ------------------------------------------
  console.log("💌 Seeding subscriptions...");

  // RegularUser subscribes to the Star Drift comic
  await prisma.user.update({
    where: { id: regularUser.id },
    data: {
      subscribedComics: {
        connect: { id: comic.id },
      },
    },
  });

  // RegularUser and Admin subscribe to the CreatorUser's profile
  await prisma.creatorProfile.update({
    where: { id: creatorProfile.id },
    data: {
      subscribers: {
        connect: [{ id: regularUser.id }, { id: admin.id }],
      },
    },
  });

  console.log(
    "✅ Subscriptions seeded: RegularUser and Admin now subscribe to the creator, and RegularUser subscribes to the comic."
  );

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
