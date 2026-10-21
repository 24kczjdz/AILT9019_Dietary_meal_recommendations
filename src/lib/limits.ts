/** Daily calorie floor from the proposal's safety limits. */
export const MIN_DAILY_KCAL = 1200;

/** Above this, Mise will not build a day. */
export const MAX_DAILY_KCAL = 4000;

/** Qualitative "high protein" plate, before any numeric override. */
export const HIGH_PROTEIN_G = 30;

/** Qualitative "low fat" plate. */
export const LOW_FAT_G = 15;

/** Qualitative "low carb" plate. */
export const LOW_CARB_G = 30;

/** Numeric targets pass inside this band, matching the evaluation rule. */
export const TOLERANCE = 0.1;

export const KNOWN_ALLERGENS = [
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "peanuts",
  "nuts",
  "soy",
  "sesame",
  "gluten",
] as const;

export const ALLERGEN_LABEL: Record<string, string> = {
  dairy: "dairy",
  eggs: "eggs",
  fish: "fish",
  shellfish: "shellfish",
  peanuts: "peanuts",
  nuts: "tree nuts",
  soy: "soy",
  sesame: "sesame",
  gluten: "gluten",
};
