import { prisma } from "../lib/db";

interface Dto {
  userId: string;
}

export class GetEventsByUserGroup {
  async execute(dto: Dto) {
    const user = await prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
      select: {
        groupId: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.groupId) {
      throw new Error("User is not assigned to a group");
    }

    const events = await prisma.eventos.findMany({
      where: {
        grupoId: user.groupId,
      },
      orderBy: {
        date: "asc",
      },
    });

    return events.map((event) => ({
      ...event,
      date: event.date.toISOString(),
    }));
  }
}
