import { prisma } from "../lib/db";

interface Dto {
  name: string;
  date: string;
  location: string;
  grupoId?: string;
}

export class CreateEvent {
  async execute(dto: Dto) {
    const dateObj = new Date(dto.date);
    try {
      const existingEvent = await prisma.eventos.findFirst({
        where: {
          date: dateObj,
        },
      });
      if (existingEvent) {
        throw new Error("Event with this date already exists");
      }
      const result = await prisma.eventos.create({
        data: {
          name: dto.name,
          date: dateObj,
          location: dto.location,
          grupoId: dto.grupoId ?? null,
        },
      });

      return {
        ...result,
        date: result.date.toISOString(),
      };
    } catch (err) {
      throw new Error(
        "Database error or not configured: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }
}
