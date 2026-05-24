import { prisma } from "../lib/db";

interface Dto {
  groupId: string;
  userIds: string[];
}

export class AddUserToGroup {
  async execute(dto: Dto) {
    const userIds = [
      ...new Set(dto.userIds.map((id) => id.trim()).filter(Boolean)),
    ];

    if (userIds.length === 0) {
      throw new Error("At least one user must be provided");
    }

    const group = await prisma.grupos.findUnique({
      where: {
        id: dto.groupId,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        groupId: dto.groupId,
      },
    });

    const updatedGroup = await prisma.grupos.findUniqueOrThrow({
      where: {
        id: dto.groupId,
      },
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedGroup;
  }
}
