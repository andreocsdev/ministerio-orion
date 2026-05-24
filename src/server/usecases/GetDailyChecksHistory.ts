import { prisma } from "../lib/db";

interface Dto {
  userId: string;
}

export class GetDailyChecksHistory {
  async execute(dto: Dto) {
    const history = await prisma.dailyChecks.findMany({
      where: {
        userId: dto.userId,
      },
      orderBy: {
        checkDate: "desc",
      },
    });

    return history.map((check) => ({
      ...check,
      checkDate: check.checkDate.toISOString(),
    }));
  }
}
