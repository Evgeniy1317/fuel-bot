import { prisma } from "../lib/prisma";
import type { VehicleInput } from "../types";

export const vehicleRepo = {
  async upsertForUser(userId: string, input: VehicleInput) {
    return prisma.vehicle.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  },
};
