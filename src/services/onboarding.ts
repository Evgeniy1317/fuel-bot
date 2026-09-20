import { expandWatchGroups } from "../config/constants";
import { userRepo } from "../repositories/user.repo";
import { vehicleRepo } from "../repositories/vehicle.repo";
import type { OnboardingDraft } from "../types";

export const onboardingService = {
  isComplete(draft: OnboardingDraft) {
    return (
      Boolean(draft.locale) &&
      Boolean(draft.country) &&
      Boolean(draft.city) &&
      Boolean(draft.propulsion) &&
      Boolean(draft.fillGrade) &&
      (draft.watchGroups?.length ?? 0) > 0
    );
  },

  async persist(
    telegramId: string,
    profile: { username?: string; firstName?: string },
    draft: OnboardingDraft,
  ) {
    if (!this.isComplete(draft)) {
      throw new Error("onboarding incomplete");
    }

    const user = await userRepo.upsertFromTelegram({
      telegramId,
      username: profile.username,
      firstName: profile.firstName,
      locale: draft.locale,
    });

    await userRepo.completeOnboarding({
      telegramId,
      locale: draft.locale!,
      country: draft.country!,
      city: draft.city!,
      dailyKm: draft.dailyKm ?? null,
      watchFuels: expandWatchGroups(draft.watchGroups!),
    });

    await vehicleRepo.upsertForUser(user.id, {
      brand: draft.brand ?? null,
      model: draft.model ?? null,
      litersPer100km: draft.litersPer100km ?? null,
      propulsion: draft.propulsion!,
      fillGrade: draft.fillGrade!,
    });

    return user;
  },
};
