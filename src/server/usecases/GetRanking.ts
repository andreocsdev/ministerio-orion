import { prisma } from "../lib/db";

export class GetRanking {
  async execute() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        dailyChecks: {
          where: {
            checkDate: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          select: {
            read_bible: true,
            read_lesson: true,
          },
        },
      },
    });

    const ranked = users
      .map((user) => {
        const bibleCount = user.dailyChecks.filter((c) => c.read_bible).length;
        const lessonCount = user.dailyChecks.filter(
          (c) => c.read_lesson,
        ).length;
        const score = (bibleCount + lessonCount) * 20;
        return {
          id: user.id,
          name: user.name,
          image: user.image,
          bibleCount,
          lessonCount,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    return ranked;
  }
}
