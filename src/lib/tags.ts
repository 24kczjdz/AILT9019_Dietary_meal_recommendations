import type { Hit } from "@/lib/match";
import { recipes } from "@/lib/recipes";
import type { Recipe } from "@/lib/types";

/** Words that show up in titles and summaries but do not identify a food. */
const GENERIC = new Set([
  "and",
  "with",
  "without",
  "the",
  "for",
  "from",
  "into",
  "over",
  "per",
  "plus",
  "extra",
  "some",
  "little",
  "few",
  "very",
  "low",
  "high",
  "higher",
  "lower",
  "fast",
  "cheap",
  "inexpensive",
  "quick",
  "lean",
  "light",
  "mild",
  "thick",
  "cold",
  "hot",
  "one",
  "two",
  "three",
  "not",
  "non",
  "free",
  "using",
  "uses",
  "used",
  "finished",
  "simmered",
  "roasted",
  "baked",
  "cooked",
  "drained",
  "firm",
  "shelled",
  "peeled",
  "protein",
  "proteins",
  "contains",
  "contain",
  "library",
  "plate",
  "plates",
  "meal",
  "meals",
  "bowl",
  "bowls",
  "food",
  "foods",
  "dish",
  "dishes",
  "recipe",
  "recipes",
  "serving",
  "about",
  "this",
  "that",
  "than",
  "then",
  "also",
  "just",
  "more",
  "most",
  "much",
  "many",
  "good",
  "best",
  "heavy",
  "modest",
  "mostly",
  "fiber",
  "calorie",
  "calories",
  "carb",
  "carbs",
  "fat",
  "fats",
  "oil",
  "oils",
  "sauce",
  "paste",
  "juice",
  "vinegar",
  "broth",
  "seeds",
  "seed",
  "fillet",
  "breast",
  "ground",
  "rolled",
  "dry",
  "pearled",
  "nutritional",
  "nonfat",
  "water",
  "plain",
  "typical",
  "small",
  "large",
  "bite",
  "size",
  "thread",
  "spoon",
  "spoonful",
  "pot",
  "pan",
  "tray",
  "skillet",
  "soaked",
  "crisped",
  "shredded",
  "seared",
  "crumpled",
  "filled",
  "binder",
  "strands",
  "cross",
  "contact",
  "overnight",
  "lot",
  "full",
  "its",
  "dairy",
  "gluten",
  "vegan",
  "vegetarian",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "beginner",
  "optional",
  "included",
  "including",
  "minutes",
  "minute",
  "salt",
  "taste",
  "table",
  "stir",
  "fry",
  "highest",
  "whites",
  "are",
  "was",
  "but",
  "you",
  "your",
]);

let cachedVocabulary: string[] | null = null;

function tokens(text: string): string[] {
  const words: string[] = [];
  for (const token of text.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
    for (const part of token.split("-")) {
      if (part.length >= 3) words.push(part);
    }
  }
  return words;
}

function recipeText(recipe: Recipe) {
  return [recipe.title, recipe.summary, ...recipe.ingredients.map((item) => item.name)].join(" ");
}

/** Food words that actually occur in the library titles, summaries, or ingredient names. */
export function foodVocabulary(): string[] {
  if (cachedVocabulary) return cachedVocabulary;
  const words = new Set<string>();
  for (const recipe of recipes) {
    for (const word of tokens(recipeText(recipe))) {
      if (!GENERIC.has(word)) words.add(word);
    }
  }
  cachedVocabulary = [...words].sort();
  return cachedVocabulary;
}

function sameFood(tag: string, word: string) {
  if (tag === word) return true;
  const pluralOf = (base: string, other: string) =>
    other === `${base}s` ||
    other === `${base}es` ||
    (base.endsWith("y") && base.length > 3 && other === `${base.slice(0, -1)}ies`);
  return pluralOf(tag, word) || pluralOf(word, tag);
}

export function tagsOnRecipe(recipe: Recipe, tags: string[]) {
  if (tags.length === 0) return [];
  const words = tokens(recipeText(recipe));
  return tags.filter((tag) => words.some((word) => sameFood(tag, word)));
}

export function countTagHits(recipe: Recipe, tags: string[]) {
  return tagsOnRecipe(recipe, tags).length;
}

export function parseTagRecommendation(recommendation: string, vocabulary: readonly string[]) {
  const allowed = new Set(vocabulary.map((word) => word.toLowerCase()));
  const cleaned = recommendation.replace(/；/g, ";").replace(/\s+/g, " ").trim();
  const semi = cleaned.indexOf(";");
  const phraseSource = (semi >= 0 ? cleaned.slice(0, semi) : cleaned)
    .replace(/^(search phrase|phrase)\s*:\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  const phrase = phraseSource.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
  const tags: string[] = [];
  const seen = new Set<string>();
  const tagSource = semi >= 0 ? cleaned.slice(semi + 1) : "";
  for (const chunk of tagSource.split(/[,|/]/)) {
    const raw = chunk.toLowerCase().replace(/[^a-z\s-]/g, " ");
    for (const part of raw.split(/[\s-]+/)) {
      if (!part || seen.has(part) || !allowed.has(part)) continue;
      seen.add(part);
      tags.push(part);
      if (tags.length >= 8) return { phrase, tags };
    }
  }
  return { phrase, tags };
}

export function rankingQuery(query: string, phrase: string, tags: string[]) {
  const base = query.trim() || "a suitable meal";
  if (tags.length === 0) return base;
  const phraseBit = phrase ? ` Search phrase: ${phrase}.` : "";
  return `${base}. Prefer plates that match these tags: ${tags.join(", ")}.${phraseBit}`;
}

function byTagCount(tags: string[], scores?: Record<string, { score: number }>) {
  return (a: Hit, b: Hit) => {
    const byTags = countTagHits(b.recipe, tags) - countTagHits(a.recipe, tags);
    if (byTags !== 0) return byTags;
    if (scores) {
      const byScore = (scores[b.recipe.id]?.score ?? -1) - (scores[a.recipe.id]?.score ?? -1);
      if (byScore !== 0) return byScore;
    }
    return b.score - a.score;
  };
}

export function orderByTags(matches: Hit[], tags: string[], scores?: Record<string, { score: number }>) {
  const sort = byTagCount(tags, scores);
  if (tags.length === 0) return { primary: [...matches].sort(sort), other: [] as Hit[] };
  const primary = matches.filter((hit) => countTagHits(hit.recipe, tags) > 0).sort(sort);
  const other = matches.filter((hit) => countTagHits(hit.recipe, tags) === 0).sort(sort);
  return { primary, other };
}

/** Closest plates that match the tags but fail a hard rule. They stay off the safe list. */
export function closestExcluded(blocked: Hit[], tags: string[], limit = 4) {
  if (tags.length === 0) return [];
  return blocked
    .filter((hit) => countTagHits(hit.recipe, tags) > 0)
    .sort(byTagCount(tags))
    .slice(0, limit);
}
