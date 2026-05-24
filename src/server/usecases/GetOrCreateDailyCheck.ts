import { prisma } from "../lib/db";

interface Dto {
  userId: string;
}

export class GetOrCreateDailyCheck {
  async execute(dto: Dto) {
    const today = new Date();
    const checkDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const result = await prisma.dailyChecks.upsert({
      where: {
        userId_checkDate: {
          userId: dto.userId,
          checkDate,
        },
      },
      create: {
        userId: dto.userId,
        checkDate,
        read_bible: false,
        read_lesson: false,
      },
      update: {},
    });

    return {
      ...result,
      checkDate: result.checkDate.toISOString(),
    };
  }
}
