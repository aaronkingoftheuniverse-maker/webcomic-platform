// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body ?? {};

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: "USER" },
    });

    // Optionally: do not create creatorProfile until user publishes first comic

    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email } }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
