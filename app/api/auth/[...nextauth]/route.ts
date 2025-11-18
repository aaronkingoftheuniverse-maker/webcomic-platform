import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- Define NextAuth configuration separately ---
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

        // Grab IP + user agent if available
        const ip = req?.headers?.["x-forwarded-for"] || "unknown";
        const userAgent = req?.headers?.["user-agent"] || "unknown";

        let user = null;

        try {
          // Find user by email or username
          user = await prisma.user.findUnique({
            where: isEmail ? { email: identifier } : { username: identifier },
          });

          if (!user) {
            // Log failed attempt (user not found)
            await prisma.loginLog.create({
              data: {
                success: false,
                ipAddress: String(ip),
                userAgent,
              },
            });
            throw new Error("User not found");
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            // Log failed attempt (wrong password)
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                success: false,
                ipAddress: String(ip),
                userAgent,
              },
            });
            throw new Error("Invalid password");
          }

          // Log successful attempt
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              success: true,
              ipAddress: String(ip),
              userAgent,
            },
          });

console.log("✅ Authorized user returned to NextAuth:", user);
return {
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
};
        } catch (error) {
          console.error("❌ Login failed:", error);
          throw error;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id; // ✅ Add id to token
      token.role = user.role;
      token.username = user.username;
      token.email = user.email;
    }
    return token;
  },
  async session({ session, token }) {
    if (token) {
      (session.user as any).id = token.id; // ✅ Preserve id into session
      (session.user as any).role = token.role;
      (session.user as any).username = token.username;
      (session.user as any).email = token.email;
    }
    return session;
  },
},

  pages: {
    signIn: "/signin",
  },
};

// --- Pass options into NextAuth handler ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
