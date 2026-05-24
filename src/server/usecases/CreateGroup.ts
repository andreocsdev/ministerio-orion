import { prisma } from "../lib/db";

interface Dto {
  name: string;
}

export class CreateGroup {
  async execute(dto: Dto) {
    const existingGroup = await prisma.grupos.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (existingGroup) {
      throw new Error("Group with this name already exists");
    }
    const result = await prisma.grupos.create({
      data: {
        name: dto.name,
      },
    });

    return result;
  }
}
