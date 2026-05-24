import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import { prisma } from "./db";

type AppRole = "ADMIN" | "USER";

async function getSession(request: Request) {
  return auth.api.getSession({
    headers: fromNodeHeaders(Object.fromEntries(request.headers)),
  });
}

export async function requireAuth(request: Request) {
  const session = await getSession(request as unknown as Request);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user.id;
}

export function requireRole(allowedRoles: AppRole[]) {
  return async (request: Request) => {
    const session = await getSession(request as unknown as Request);

    if (!session?.user?.id) {
      throw new Error("UNAUTHORIZED");
    }

    const rows = await prisma.$queryRaw<Array<{ role: AppRole }>>`
      SELECT "role"
      FROM "user"
      WHERE "id" = ${session.user.id}
      LIMIT 1
    `;

    const role = rows[0]?.role;

    if (!role || !allowedRoles.includes(role)) {
      throw new Error("FORBIDDEN");
    }

    return session.user.id;
  };
}
