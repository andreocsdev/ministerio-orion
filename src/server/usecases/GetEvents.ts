import { prisma } from "../lib/db";

export class GetEvents {
  async execute() {
    let events;
    try {
      events = await prisma.eventos.findMany({
      include: {
        grupo: {
          select: {
            name: true,
            users: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
      });
    } catch (err) {
      return [];
    }

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      location: event.location,
      grupoId: event.grupoId,
      responsibleGroup: event.grupo?.name ?? null,
      responsibleMembers:
        event.grupo?.users.map((user) => ({
          name: user.name,
          image: user.image ?? null,
        })) ?? [],
      date: event.date.toISOString(),
    }));
  }
}
