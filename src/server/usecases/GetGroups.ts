import { prisma } from "../lib/db";

export class GetGroups {
  async execute() {
    try {
      const groups = await prisma.grupos.findMany({
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        eventos: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            date: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      });

      return groups;
    } catch (err) {
      return [];
    }
  }
}
