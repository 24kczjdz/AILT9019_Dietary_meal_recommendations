import { HIGH_PROTEIN_G, LOW_CARB_G, LOW_FAT_G, TOLERANCE } from "@/lib/limits";
import { nutritionFor } from "@/lib/nutrition";
import { parseRequest } from "@/lib/parse";
import { PANTRY_GROUPS, recipes } from "@/lib/recipes";
import type { Constraints, Nutrition, Recipe, Refusal, WarningNote } from "@/lib/types";

export type Hit = {
  recipe: Recipe;
  nutrition: Nutrition;
  reasons: string[];
  misses: string[];
  score: number;
};

export type PlanMeal = {
  label: string;
  scale: number;
  hit: Hit;
  nutrition: Nutrition;
};

export type PlanDay = {
  day: number;
  meals: PlanMeal[];
  total: Nutrition;
  within: boolean | null;
};

export type MealSearch = {
  constraints: Constraints;
  warnings: WarningNote[];
  refusal: Refusal | null;
  matches: Hit[];
  near: Hit[];
  plan: PlanDay[] | null;
  pool: number;
};

const SLOT_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack"];

function withinMax(value: number, limit: number) {
  return value <= limit * (1 + TOLERANCE);
}

function withinMin(value: number, limit: number) {
  return value >= limit * (1 - TOLERANCE);
}

function pantryHitCount(recipe: Recipe, pantry: string[]) {
  const keys = new Set(recipe.ingredients.map((item) => item.key));
  return pantry.filter((id) => (PANTRY_GROUPS[id] ?? [id]).some((key) => keys.has(key))).length;
}

function assess(recipe: Recipe, constraints: Constraints): Hit {
  const nutrition = nutritionFor(recipe);
  const reasons: string[] = [];
  const misses: string[] = [];
  let hard = false;

  for (const diet of constraints.diets) {
    if (!recipe.diets.includes(diet)) {
      hard = true;
      misses.push(`Not ${diet}`);
    } else {
      reasons.push(diet);
    }
  }

  const allergens = new Set(recipe.ingredients.flatMap((item) => item.allergens));
  for (const allergy of constraints.allergies) {
    if (allergens.has(allergy)) {
      hard = true;
      misses.push(`Contains ${allergy}`);
    }
  }
  if (constraints.allergies.length && !misses.some((miss) => miss.startsWith("Contains"))) {
    reasons.push("No listed allergen from your list");
  }

  if (constraints.halalRequested) {
    const kinds = recipe.ingredients.flatMap((item) => item.kinds);
    if (kinds.includes("shellfish") || kinds.includes("pork")) {
      hard = true;
      misses.push("Shellfish or pork");
    }
  }

  if (constraints.mealTypes.length && !constraints.plan) {
    const fits = constraints.mealTypes.some((meal) => recipe.mealTypes.includes(meal));
    if (!fits) {
      hard = true;
      misses.push(`Not a ${constraints.mealTypes.join(" or ")} plate`);
    }
  }

  if (constraints.highProtein) {
    if (nutrition.protein >= HIGH_PROTEIN_G) reasons.push(`${nutrition.protein} g protein`);
    else misses.push(`${nutrition.protein} g protein, under ${HIGH_PROTEIN_G} g`);
  }
  if (constraints.lowFat) {
    if (nutrition.fat <= LOW_FAT_G) reasons.push(`${nutrition.fat} g fat`);
    else misses.push(`${nutrition.fat} g fat, over ${LOW_FAT_G} g`);
  }
  if (constraints.lowCarb) {
    if (nutrition.carbs <= LOW_CARB_G) reasons.push(`${nutrition.carbs} g carbs`);
    else misses.push(`${nutrition.carbs} g carbs, over ${LOW_CARB_G} g`);
  }
  if (constraints.minProtein != null) {
    if (nutrition.protein >= constraints.minProtein) reasons.push(`${nutrition.protein} g protein`);
    else if (withinMin(nutrition.protein, constraints.minProtein)) {
      reasons.push(`${nutrition.protein} g protein, inside the 10% band`);
    } else {
      misses.push(`${nutrition.protein} g protein, under ${constraints.minProtein} g`);
    }
  }
  if (constraints.maxFat != null) {
    if (withinMax(nutrition.fat, constraints.maxFat)) reasons.push(`${nutrition.fat} g fat`);
    else misses.push(`${nutrition.fat} g fat, over ${constraints.maxFat} g`);
  }
  if (constraints.maxCalories != null) {
    if (withinMax(nutrition.calories, constraints.maxCalories)) {
      reasons.push(`${nutrition.calories} kcal`);
    } else {
      misses.push(`${nutrition.calories} kcal, over ${constraints.maxCalories}`);
    }
  }
  if (constraints.minCalories != null && constraints.dailyCalories == null) {
    if (withinMin(nutrition.calories, constraints.minCalories)) {
      reasons.push(`Near the calorie target`);
    } else {
      misses.push(`${nutrition.calories} kcal is well under the request`);
    }
  }
  if (constraints.maxCarbs != null) {
    if (withinMax(nutrition.carbs, constraints.maxCarbs)) reasons.push(`${nutrition.carbs} g carbs`);
    else misses.push(`${nutrition.carbs} g carbs, over the cap`);
  }

  const pantryHits = pantryHitCount(recipe, constraints.pantry);
  if (pantryHits > 0) reasons.push(`Uses ${pantryHits} ingredient${pantryHits === 1 ? "" : "s"} you have`);

  let score = 64 + Math.min(16, nutrition.protein / 3);
  if (recipe.beginner) score += 4;
  if (constraints.budget === "low" && recipe.budget === "low") score += 6;
  score += pantryHits * 5;
  score -= misses.length * 8;
  if (hard) score -= 40;

  return {
    recipe,
    nutrition,
    reasons: reasons.slice(0, 4),
    misses,
    score: Math.max(1, Math.round(score)),
  };
}

function addNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return {
    calories: left.calories + right.calories,
    protein: Math.round((left.protein + right.protein) * 10) / 10,
    fat: Math.round((left.fat + right.fat) * 10) / 10,
    carbs: Math.round((left.carbs + right.carbs) * 10) / 10,
    fiber: Math.round((left.fiber + right.fiber) * 10) / 10,
  };
}

function buildPlan(matches: Hit[], constraints: Constraints): PlanDay[] | null {
  if (!constraints.plan || matches.length === 0) return null;
  const days = Math.min(constraints.days ?? 1, 7);
  const perDay = Math.min(constraints.mealsPerDay ?? 3, 4);
  const plan: PlanDay[] = [];
  let cursor = 0;

  for (let day = 1; day <= days; day += 1) {
    const used = new Set<string>();
    const meals: PlanMeal[] = [];
    for (let slot = 0; slot < perDay; slot += 1) {
      let pick = matches[cursor % matches.length];
      let guard = 0;
      while (used.has(pick.recipe.id) && guard < matches.length) {
        cursor += 1;
        pick = matches[cursor % matches.length];
        guard += 1;
      }
      used.add(pick.recipe.id);
      cursor += 1;
      const slotTarget = constraints.dailyCalories ? constraints.dailyCalories / perDay : pick.nutrition.calories;
      const raw = slotTarget / pick.nutrition.calories;
      const scale = constraints.dailyCalories ? Math.min(2, Math.max(1, Math.round(raw * 4) / 4)) : 1;
      const nutrition = nutritionFor(pick.recipe, scale);
      meals.push({
        label: SLOT_LABELS[slot] ?? `Meal ${slot + 1}`,
        scale,
        hit: pick,
        nutrition,
      });
    }
    const total = meals.reduce(
      (sum, meal) => addNutrition(sum, meal.nutrition),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    );
    const within =
      constraints.dailyCalories == null
        ? null
        : Math.abs(total.calories - constraints.dailyCalories) / constraints.dailyCalories <= TOLERANCE;
    plan.push({ day, meals, total, within });
  }

  return plan;
}

export function searchMeals(text: string, presets: string[] = [], pantry: string[] = []): MealSearch {
  const parsed = parseRequest(text, presets, pantry);
  if (parsed.refusal) {
    return {
      constraints: parsed.constraints,
      warnings: parsed.warnings,
      refusal: parsed.refusal,
      matches: [],
      near: [],
      plan: null,
      pool: recipes.length,
    };
  }

  const hits = recipes.map((recipe) => assess(recipe, parsed.constraints));
  const matches = hits
    .filter((hit) => hit.misses.length === 0)
    .sort((a, b) => b.score - a.score);
  const near = hits
    .filter((hit) => hit.misses.length > 0 && !hit.misses.some((miss) => /Not |Contains |Shellfish|Not a /.test(miss)))
    .filter((hit) => hit.misses.length === 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    constraints: parsed.constraints,
    warnings: parsed.warnings,
    refusal: null,
    matches: matches.slice(0, 6),
    near,
    plan: buildPlan(matches, parsed.constraints),
    pool: recipes.length,
  };
}
