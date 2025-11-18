// lib/withAuthorization.ts
import { prisma } from "@/config/prisma";
import { authorizeApi } from "./authorizeApi";
import type { AuthorizeResult } from "./authorizeApi";
import { NextResponse } from "next/server";

/**
 * helper to write one API access log row safely.
 */
async function logApiAccess({
  userId,
  endpoint,
  method,
  ipAddress,
  userAgent,
  success,
  statusCode,
}: {
  userId: number | null;
  endpoint: string;
  method: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  statusCode: number;
}) {
  try {
    await prisma.apiAccessLog.create({
      data: {
        userId: userId ?? null,
        endpoint,
        method,
        ipAddress: ipAddress ?? "unknown",
        userAgent: userAgent ?? "unknown",
        success,
        statusCode,
      },
    });
  } catch (err) {
    // Logging should never crash the request pipeline.
    console.error("logApiAccess error:", err);
  }
}

/**
 * withAuth middleware for API routes.
 * handler receives (req, user) where user = { id, role, username?, email? }
 */export function withAuth(
  allowedRoles: string[],
  handler: (req: Request, user: AppUser, ctx?: any) => Promise<Response>
) {
  return async (req: Request, ctx?: any) => {
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded") ||
      null;

    const userAgent = req.headers.get("user-agent") || null;

    // 1) Authorize
    const authResult: AuthorizeResult = await authorizeApi(req, {
      allowed: allowedRoles as any,
    });

    if (!authResult.authorized) {
      const denial = authResult.denial;
      const status = (denial as any)?.status ?? 403;
      const userId =
        "userId" in authResult ? authResult.userId ?? null : null;

      await logApiAccess({
        userId,
        endpoint,
        method,
        ipAddress,
        userAgent,
        success: false,
        statusCode: status,
      });

      return denial;
    }

    // Authorized → build user object
    const user: AppUser = {
      id: authResult.userId ?? null,
      role: authResult.role ?? "USER",
      username: authResult.username ?? null,
      email: authResult.email ?? null,
    };

    // 2) Run handler
    let response: Response;
    try {
      response = await handler(req, user, ctx);
    } catch (err) {
      console.error("API handler error:", err);

      await logApiAccess({
        userId: user.id ?? null,
        endpoint,
        method,
        ipAddress,
        userAgent,
        success: false,
        statusCode: 500,
      });

      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3) Log success
    try {
      const status =
        response && typeof (response as any).status === "number"
          ? (response as any).status
          : 200;
      const success =
        response && typeof (response as any).ok === "boolean"
          ? (response as any).ok
          : status >= 200 && status < 300;

      await logApiAccess({
        userId: user.id ?? null,
        endpoint,
        method,
        ipAddress,
        userAgent,
        success,
        statusCode: status,
      });
    } catch (err) {
      console.error("Failed to log API access after handler:", err);
    }

    return response;
  };
}
