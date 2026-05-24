import { prisma } from "../lib/db";

interface Dto {
  userId: string;
}

function toDateKeyUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKeyUTC(date);
}

function calculateCurrentStreak(doneDates: Set<string>) {
  let streak = 0;
  const todayKey = toDateKeyUTC(new Date());
  let cursor = todayKey;

  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDaysUTC(cursor, -1);
  }

  return streak;
}

function calculateBestStreak(doneDates: Set<string>) {
  const sorted = Array.from(doneDates).sort();
  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const expected = addDaysUTC(previous, 1);

    if (sorted[i] === expected) {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else {
      current = 1;
    }
  }

  return best;
}

export class GetUserProfile {
  async execute(dto: Dto) {
    const user = await prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        dailyChecks: {
          select: {
            checkDate: true,
            read_bible: true,
            read_lesson: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const doneDates = new Set(
      user.dailyChecks
        .filter((check) => check.read_bible && check.read_lesson)
        .map((check) => toDateKeyUTC(check.checkDate)),
    );

    const currentStreak = calculateCurrentStreak(doneDates);
    const bestStreak = calculateBestStreak(doneDates);

    const groupEvents = user.group
      ? await prisma.eventos.findMany({
          where: {
            grupoId: user.group.id,
          },
          orderBy: {
            date: "asc",
          },
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            grupoId: true,
            grupo: {
              select: {
                users: {
                  select: {
                    name: true,
                    image: true,
                  },
                  orderBy: {
                    name: "asc",
                  },
                },
              },
            },
          },
        })
      : [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      group: user.group,
      currentStreak,
      bestStreak,
      groupEvents: groupEvents.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        location: event.location,
        grupoId: event.grupoId,
        responsibleMembers:
          event.grupo?.users.map((member) => ({
            name: member.name,
            image: member.image,
          })) ?? [],
      })),
    };
  }
}
