import { prisma } from "../lib/db";

interface Dto {
  userId: string;
  read_bible?: boolean;
  read_lesson?: boolean;
}

export class UpdateDailyChecks {
  async execute(dto: Dto) {
    if (dto.read_bible === undefined && dto.read_lesson === undefined) {
      throw new Error("At least one field must be provided");
    }

    const today = new Date();
    const checkDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const result = await prisma.dailyChecks.update({
      where: {
        userId_checkDate: {
          userId: dto.userId,
          checkDate,
        },
      },
      data: {
        ...(dto.read_bible !== undefined && { read_bible: dto.read_bible }),
        ...(dto.read_lesson !== undefined && { read_lesson: dto.read_lesson }),
      },
    });

    return {
      ...result,
      checkDate: result.checkDate.toISOString(),
    };
  }
}
