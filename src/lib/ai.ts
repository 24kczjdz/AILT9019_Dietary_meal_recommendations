/** Cloudflare Worker that holds the model key and ranks plates already on screen. */
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

type StoredRanking = AiRanking & { query: string };

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

export async function rankPlates(query: string, plates: AiPlate[]): Promise<AiRanking> {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query || "a suitable meal",
      plates: plates.slice(0, 24),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The model did not answer.");
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
