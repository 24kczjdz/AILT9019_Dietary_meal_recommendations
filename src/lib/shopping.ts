import { scaleIngredients } from "@/lib/nutrition";
import type { Recipe, ShoppingLine } from "@/lib/types";

export function linesFromRecipe(recipe: Recipe, scale = 1): ShoppingLine[] {
  return scaleIngredients(recipe.ingredients, scale).map((item) => ({
    id: `${item.key}|${item.unit}`,
    key: item.key,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    aisle: item.aisle,
    recipes: [recipe.title],
    checked: false,
  }));
}

export function mergeLines(existing: ShoppingLine[], incoming: ShoppingLine[]): ShoppingLine[] {
  const next = existing.map((line) => ({ ...line, recipes: [...line.recipes] }));
  for (const item of incoming) {
    const found = next.find((line) => line.id === item.id);
    if (!found) {
      next.push({ ...item, recipes: [...item.recipes] });
      continue;
    }
    found.quantity += item.quantity;
    found.checked = false;
    for (const title of item.recipes) {
      if (!found.recipes.includes(title)) found.recipes.push(title);
    }
  }
  return next;
}

export function shoppingText(lines: ShoppingLine[]) {
  const aisles = [...new Set(lines.map((line) => line.aisle))];
  return aisles
    .map((aisle) => {
      const items = lines
        .filter((line) => line.aisle === aisle)
        .map((line) => {
          const amount = line.quantity >= 20 ? Math.round(line.quantity) : Math.round(line.quantity * 10) / 10;
          const reuse = line.recipes.length > 1 ? ` (used in ${line.recipes.length} plates)` : "";
          return `- ${amount} ${line.unit} ${line.name}${reuse}`;
        });
      return `${aisle}\n${items.join("\n")}`;
    })
    .join("\n\n");
}
