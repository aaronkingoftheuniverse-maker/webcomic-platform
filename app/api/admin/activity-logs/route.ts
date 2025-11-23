import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

/**
 * GET /api/admin/activity-logs
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
      prisma.apiAccessLog.findMany({
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
      prisma.apiAccessLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,               // flatter key
      total,              // total count
      page,               // current page
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
};
