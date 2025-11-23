import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { ROLES } from "@/lib/roles";
import { apiAuth } from "@/lib/auth";

/**
 * GET /api/admin/login-logs
 *
 * Supports filters:
 * - ?failedOnly=true
 * - ?userId=123
 * - ?ip=192.168.x.x
 * - ?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  await apiAuth([ROLES.ADMIN]);

  try {
    const { searchParams } = new URL(req.url);

    const failedOnly = searchParams.get("failedOnly") === "true";
    const userId = searchParams.get("userId");
    const ip = searchParams.get("ip");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (failedOnly) where.success = false;
    if (userId) where.userId = parseInt(userId);
    if (ip) where.ipAddress = { contains: ip };

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.loginLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,               // flatter top-level property
      total,              // total number of records
      page,               // current page
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching login logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch login logs" },
      { status: 500 }
    );
  }
};
