import type { Ingredient, Nutrition, Recipe } from "@/lib/types";

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function scaleIngredients(ingredients: Ingredient[], scale: number): Ingredient[] {
  return ingredients.map((item) => ({
    ...item,
    quantity: item.quantity * scale,
    calories: item.calories * scale,
    protein: item.protein * scale,
    fat: item.fat * scale,
    carbs: item.carbs * scale,
    fiber: item.fiber * scale,
  }));
}

/** Line items and total use the same rounded figures, so the table adds up. */
export function displayedNutrition(ingredients: Ingredient[]) {
  const lines = ingredients.map((item) => ({
    ...item,
    calories: Math.round(item.calories),
    protein: round1(item.protein),
    fat: round1(item.fat),
    carbs: round1(item.carbs),
    fiber: round1(item.fiber),
  }));

  const total: Nutrition = {
    calories: lines.reduce((sum, line) => sum + line.calories, 0),
    protein: round1(lines.reduce((sum, line) => sum + line.protein, 0)),
    fat: round1(lines.reduce((sum, line) => sum + line.fat, 0)),
    carbs: round1(lines.reduce((sum, line) => sum + line.carbs, 0)),
    fiber: round1(lines.reduce((sum, line) => sum + line.fiber, 0)),
  };

  return { lines, total };
}

export function nutritionFor(recipe: Recipe, scale = 1): Nutrition {
  return displayedNutrition(scaleIngredients(recipe.ingredients, scale)).total;
}

export function formatAmount(quantity: number, unit: string) {
  const rounded =
    quantity >= 20 ? Math.round(quantity) : Math.round(quantity * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${unit}`;
}

export function formatMacro(value: number, unit: string) {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text} ${unit}`;
}
