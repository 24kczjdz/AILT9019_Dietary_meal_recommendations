import { MAX_DAILY_KCAL, MIN_DAILY_KCAL } from "@/lib/limits";
import type { Profile } from "@/lib/types";

const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
} as const;

export const EMPTY_PROFILE: Profile = {
  age: "",
  sex: "",
  weightKg: "",
  heightCm: "",
  activity: "light",
  allergies: [],
  diets: [],
  calorieTarget: "",
};

export type CalorieEstimate =
  | { ok: true; kcal: number }
  | { ok: false; reason: string };

/** Mifflin–St Jeor times an activity factor. A common estimate, not a prescription. */
export function estimateCalories(profile: Profile): CalorieEstimate {
  const age = Number(profile.age);
  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);

  if (!profile.age && !profile.weightKg && !profile.heightCm && !profile.sex) {
    return { ok: false, reason: "Add age, sex, weight, and height to see an estimate." };
  }

  if (!Number.isFinite(age) || age < 18 || age > 100) {
    return {
      ok: false,
      reason:
        age > 0 && age < 18
          ? "Mise does not estimate calorie needs for anyone under 18."
          : "Enter an age between 18 and 100, or leave the estimate blank.",
    };
  }

  if (!profile.sex) {
    return { ok: false, reason: "The estimate needs sex recorded as female or male. You can skip it." };
  }

  if (!Number.isFinite(weight) || weight < 35 || weight > 250) {
    return { ok: false, reason: "Enter a weight between 35 and 250 kg, or skip the estimate." };
  }

  if (!Number.isFinite(height) || height < 120 || height > 230) {
    return { ok: false, reason: "Enter a height between 120 and 230 cm, or skip the estimate." };
  }

  const bmr = 10 * weight + 6.25 * height - 5 * age + (profile.sex === "male" ? 5 : -161);
  const kcal = Math.round((bmr * ACTIVITY[profile.activity]) / 10) * 10;

  if (kcal < MIN_DAILY_KCAL || kcal > MAX_DAILY_KCAL) {
    return {
      ok: false,
      reason: `That estimate lands outside ${MIN_DAILY_KCAL.toLocaleString()}–${MAX_DAILY_KCAL.toLocaleString()} kcal, so Mise will not use it as a target.`,
    };
  }

  return { ok: true, kcal };
}
