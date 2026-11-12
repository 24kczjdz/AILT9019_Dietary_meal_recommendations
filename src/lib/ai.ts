/** Cloudflare Worker that holds the model key. The browser sends plates or a tag list; the key stays on the worker. */
export const AI_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_URL || "https://mise-ai.mealmate-3036588333.workers.dev/ai";

export type AiScore = { score: number; reason: string };

export type AiPlate = {
  id: string;
  title: string;
  summary: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  libraryScore: number;
  reasons: string[];
};

export type AiRanking = {
  recommendation: string;
  scores: Record<string, AiScore>;
};

const STORAGE_KEY = "mise-ai-scores";
const TAG_KEY = "mise-ai-tags";

type StoredRanking = AiRanking & { query: string };
type StoredTags = { query: string; phrase: string; tags: string[] };

const TAG_INSTRUCTION =
  "The recommendation field must be exactly: a 3 to 6 word search phrase, then a semicolon, then 4 to 8 tags copied from the word list that best find this request in a recipe library. No other sentences.";

function readStored(): StoredRanking | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRanking;
    if (!parsed || typeof parsed.query !== "string" || !parsed.scores) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function rememberRanking(query: string, ranking: AiRanking, options?: { keepRecommendation?: boolean }) {
  if (typeof sessionStorage === "undefined") return;
  const previous = readStored();
  const sameQuery = previous?.query === query;
  const recommendation =
    options?.keepRecommendation && sameQuery && previous.recommendation
      ? previous.recommendation
      : ranking.recommendation || (sameQuery ? previous.recommendation : "") || "";
  const next: StoredRanking = {
    query,
    recommendation,
    scores: { ...(sameQuery ? previous.scores : {}), ...ranking.scores },
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function readScore(id: string, query: string): AiScore | null {
  const stored = readStored();
  if (!stored || stored.query !== query) return null;
  return stored.scores[id] ?? null;
}

export function rememberSearchTags(query: string, phrase: string, tags: string[]) {
  if (typeof sessionStorage === "undefined") return;
  const next: StoredTags = { query, phrase, tags };
  sessionStorage.setItem(TAG_KEY, JSON.stringify(next));
}

export function readSearchTags(query: string): { phrase: string; tags: string[] } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(TAG_KEY) || "") as StoredTags;
    if (!parsed || parsed.query !== query || !Array.isArray(parsed.tags)) return null;
    return { phrase: String(parsed.phrase || ""), tags: parsed.tags.map((tag) => String(tag)) };
  } catch {
    return null;
  }
}

async function postAi(query: string, plates: AiPlate[]) {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query || "a suitable meal",
      plates: plates.slice(0, 24),
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    recommendation?: string;
    scores?: { id?: string; score?: number; reason?: string }[];
  };
  if (!response.ok) throw new Error(payload.error || "The model did not answer.");
  return payload;
}

/** Ask for a short phrase and library tags. The vocabulary is one plate so the worker's 24-plate cap still sees every word. */
export async function askLibraryTags(query: string, vocabulary: string[]): Promise<string> {
  const payload = await postAi(`${query.trim()}. ${TAG_INSTRUCTION}`, [
    {
      id: "words",
      title: "Allowed tags",
      summary: vocabulary.join(", "),
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      libraryScore: 0,
      reasons: ["Choose tags only from this summary"],
    },
  ]);
  return String(payload.recommendation || "");
}

export async function rankPlates(
  query: string,
  plates: AiPlate[],
  options?: { modelQuery?: string },
): Promise<AiRanking> {
  const payload = await postAi(options?.modelQuery || query, plates);
  const allowed = new Set(plates.map((plate) => plate.id));
  const scores: Record<string, AiScore> = {};
  for (const item of payload.scores ?? []) {
    const id = String(item.id);
    if (!allowed.has(id)) continue;
    scores[id] = {
      score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
      reason: String(item.reason || ""),
    };
  }
  const ranking = { recommendation: String(payload.recommendation || ""), scores };
  rememberRanking(query, ranking, { keepRecommendation: plates.length === 1 });
  return ranking;
}
