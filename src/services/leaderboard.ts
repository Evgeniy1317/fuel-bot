import { prisma } from "../lib/prisma";
import { savingsRepo } from "../repositories/savings.repo";

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  amount: number;
  currencyCode: string;
}

export const leaderboardService = {
  async top(limit = 10): Promise<LeaderboardRow[]> {
    const grouped = await savingsRepo.ranking(limit);
    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((row) => row.userId) } },
    });
    const byId = new Map(users.map((user) => [user.id, user]));

    return grouped.map((row) => {
      const user = byId.get(row.userId);
      return {
        userId: row.userId,
        displayName: user?.firstName || user?.username || "•",
        amount: Number(row._sum.amount ?? 0),
        currencyCode: row.currencyCode,
      };
    });
  },
};
