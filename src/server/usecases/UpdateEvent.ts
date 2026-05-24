import { prisma } from "../lib/db";

interface Dto {
  id: string;
  name?: string;
  date?: string;
  location?: string;
  grupoId?: string | null;
}

export class UpdateEvent {
  async execute(dto: Dto) {
    const existing = await prisma.eventos.findUnique({
      where: {
        id: dto.id,
      },
    });

    if (!existing) {
      throw new Error("Event not found");
    }

    const updated = await prisma.eventos.update({
      where: {
        id: dto.id,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.grupoId !== undefined ? { grupoId: dto.grupoId } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      date: updated.date.toISOString(),
      location: updated.location,
      grupoId: updated.grupoId,
    };
  }
}
