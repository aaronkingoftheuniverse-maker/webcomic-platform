// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma"; // shared singleton

// NOTE: keep the provider list small; credentials provider example below
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const identifier = credentials.identifier.trim();
        const isEmail = identifier.includes("@");

        const ip = (req?.headers?.["x-forwarded-for"] as string) || "unknown";
        const userAgent = (req?.headers?.["user-agent"] as string) || "unknown";

        // Find user
        const user = await prisma.user.findUnique({
          where: isEmail ? { email: identifier } : { username: identifier },
        });

        if (!user) {
          // Log failed attempt (no user)
          await prisma.loginLog.create({
            data: { success: false, ipAddress: String(ip), userAgent },
          });
          throw new Error("User not found");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          await prisma.loginLog.create({
            data: { userId: user.id, success: false, ipAddress: String(ip), userAgent },
          });
          throw new Error("Invalid password");
        }

        // Log successful attempt
        await prisma.loginLog.create({
          data: { userId: user.id, success: true, ipAddress: String(ip), userAgent },
        });

        // Determine whether this account has a CreatorProfile (creator tools)
        const creatorProfile = await prisma.creatorProfile.findUnique({
          where: { userId: user.id },
        });
        const hasCreatorProfile = Boolean(creatorProfile);

        // Return shape that will be embedded into the JWT (via jwt callback)
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role, // "USER" or "ADMIN"
          hasCreatorProfile,
        } as any; // NextAuth will merge into JWT
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` exists (from authorize). persist to token.
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.email = (user as any).email;
        token.hasCreatorProfile = (user as any).hasCreatorProfile ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      // copy useful fields into session.user
      if (token) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role;
        (session.user as any).username = (token as any).username ?? null;
        (session.user as any).email = (token as any).email ?? null;
        (session.user as any).hasCreatorProfile = (token as any).hasCreatorProfile ?? false;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
