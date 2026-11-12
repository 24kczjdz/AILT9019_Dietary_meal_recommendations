"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileControl } from "@/components/profile-control";
import { askLibraryTags, rankPlates, rememberSearchTags, type AiRanking, type AiScore } from "@/lib/ai";
import { withBase } from "@/lib/base";
import { hardMisses, searchMeals, type MealSearch, type Hit } from "@/lib/match";
import { photoSrc } from "@/lib/media";
import { formatAmount } from "@/lib/nutrition";
import { linesFromRecipe, mergeLines } from "@/lib/shopping";
import { loadKitchen, loadProfile, saveKitchen } from "@/lib/storage";
import { closestExcluded, foodVocabulary, orderByTags, parseTagRecommendation, rankingQuery } from "@/lib/tags";
import type { Profile, ShoppingLine } from "@/lib/types";

function resultsHref(query: string, presets: string[], pantry: string[]) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  for (const preset of presets) params.append("preset", preset);
  for (const item of pantry) params.append("pantry", item);
  const search = params.toString();
  return withBase(`/results/${search ? `?${search}` : ""}`);
}

function ScoreMark({ ai, pending }: { ai?: AiScore; pending: boolean }) {
  if (!ai && !pending) return null;
  return (
    <span className="absolute top-3 left-3 rounded-full bg-background px-3 py-1 text-sm font-medium shadow-sm">
      {ai ? `AI Score ${ai.score}` : "AI Score …"}
    </span>
  );
}

function PlateCard({ hit, href, ai, pending }: { hit: Hit; href: string; ai?: AiScore; pending: boolean }) {
  return (
    <a href={href} className="block overflow-hidden rounded-3xl border bg-card">
      <div className="relative">
        <img src={photoSrc(hit.recipe.id)} alt={hit.recipe.title} className="aspect-[4/3] w-full object-cover" />
        <ScoreMark ai={ai} pending={pending} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">{hit.recipe.title}</h2>
          <span className="shrink-0 text-sm text-primary">Open</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{hit.recipe.summary}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {hit.nutrition.calories} kcal · {hit.nutrition.protein} g protein · {hit.recipe.minutes} min
        </p>
        <p className="mt-2 text-sm">Fit {hit.score}{ai ? ` · AI Score ${ai.score}` : pending ? " · scoring" : ""}</p>
        {ai?.reason && <p className="mt-1 text-sm">{ai.reason}</p>}
        {hit.reasons.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{hit.reasons.join(" · ")}</p>}
        {hit.misses.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{hit.misses.join(" · ")}</p>}
      </div>
    </a>
  );
}

type TagState = {
  query: string;
  phrase: string;
  tags: string[];
  status: "idle" | "loading" | "ready" | "error";
};

export function ResultsStep() {
  const [query, setQuery] = useState("");
  const [presets, setPresets] = useState<string[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [booted, setBooted] = useState(false);
  const [addedPlan, setAddedPlan] = useState(false);
  const [ai, setAi] = useState<AiRanking | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [tagState, setTagState] = useState<TagState>({ query: "", phrase: "", tags: [], status: "idle" });
  const vocabulary = useMemo(() => foodVocabulary(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    setPresets(params.getAll("preset"));
    setPantry(params.getAll("pantry"));
    setProfile(loadProfile());
    setBooted(true);
  }, []);

  const result: MealSearch = useMemo(
    () => (booted ? searchMeals(query, presets, pantry, profile) : searchMeals("")),
    [booted, query, presets, pantry, profile],
  );

  const needsTags = booted && query.trim().length > 0 && !result.refusal;
  const tagsReady =
    !needsTags || (tagState.query === query && (tagState.status === "ready" || tagState.status === "error"));
  const activeTags = tagsReady && tagState.status === "ready" && tagState.query === query ? tagState.tags : [];
  const phrase = tagsReady && tagState.query === query ? tagState.phrase : "";

  const ordered = useMemo(() => {
    const grouped = orderByTags(result.matches, activeTags, ai?.scores);
    return {
      ...grouped,
      leftOut: closestExcluded(result.blocked, activeTags),
    };
  }, [activeTags, ai?.scores, result.blocked, result.matches]);

  const mainList = ordered.primary.length > 0 || activeTags.length === 0 ? ordered.primary : ordered.other;
  const otherList = ordered.primary.length > 0 ? ordered.other : [];

  const back = resultsHref(query, presets, pantry);
  const planLines = useMemo(() => {
    if (!result.plan) return [];
    return result.plan.reduce<ShoppingLine[]>(
      (lines, day) => day.meals.reduce((acc, meal) => mergeLines(acc, linesFromRecipe(meal.hit.recipe, meal.scale)), lines),
      [],
    );
  }, [result.plan]);

  const aiRequest = useMemo(() => {
    if (!booted || !tagsReady || result.refusal || result.matches.length === 0) return null;
    const hits = [...result.matches, ...result.near].slice(0, 24);
    return {
      key: `${query}|${activeTags.join(",")}|${hits.map((hit) => `${hit.recipe.id}:${hit.score}`).join(",")}`,
      query,
      modelQuery: rankingQuery(query, phrase, activeTags),
      plates: hits.map((hit) => ({
        id: hit.recipe.id,
        title: hit.recipe.title,
        summary: hit.recipe.summary,
        calories: hit.nutrition.calories,
        protein: hit.nutrition.protein,
        fat: hit.nutrition.fat,
        carbs: hit.nutrition.carbs,
        libraryScore: hit.score,
        reasons: hit.reasons,
      })),
    };
  }, [activeTags, booted, phrase, query, result, tagsReady]);

  const aiRequestRef = useRef(aiRequest);
  aiRequestRef.current = aiRequest;

  useEffect(() => {
    if (!needsTags) return;
    let ignore = false;
    setTagState({ query, phrase: "", tags: [], status: "loading" });
    askLibraryTags(query, vocabulary)
      .then((recommendation) => {
        if (ignore) return;
        const parsed = parseTagRecommendation(recommendation, vocabulary);
        rememberSearchTags(query, parsed.phrase, parsed.tags);
        setTagState({ query, phrase: parsed.phrase, tags: parsed.tags, status: "ready" });
      })
      .catch(() => {
        if (!ignore) setTagState({ query, phrase: "", tags: [], status: "error" });
      });
    return () => {
      ignore = true;
    };
  }, [needsTags, query, vocabulary]);

  useEffect(() => {
    const current = aiRequestRef.current;
    if (!current) {
      setAi(null);
      setAiBusy(false);
      return;
    }
    let ignore = false;
    setAi(null);
    setAiBusy(true);
    setAiError("");
    rankPlates(current.query, current.plates, { modelQuery: current.modelQuery })
      .then((ranking) => {
        if (!ignore) setAi(ranking);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setAi(null);
        const message = error instanceof Error ? error.message : "";
        setAiError(message && message !== "Failed to fetch" ? message : "The scoring service did not answer. Try again in a moment.");
      })
      .finally(() => {
        if (!ignore) setAiBusy(false);
      });
    return () => {
      ignore = true;
    };
  }, [aiRequest?.key]);

  function addPlan() {
    saveKitchen(mergeLines(loadKitchen(), planLines));
    setAddedPlan(true);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl tracking-tight">Plates</h1>
          <p className="mt-2 text-muted-foreground">
            {booted ? `${query ? query : "Every plate in the library."} · ${result.matches.length} meals` : "Loading plates…"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProfileControl onChange={setProfile} />
          <a href={withBase("/search/")} className="text-sm text-primary">
            Change search
          </a>
        </div>
      </div>

      {booted && result.constraints.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {result.constraints.chips.map((chip) => (
            <Badge key={chip.id} variant={chip.tone === "warn" ? "destructive" : "secondary"} className="h-auto px-2 py-1 whitespace-normal">
              {chip.label}
            </Badge>
          ))}
        </div>
      )}

      {booted && result.warnings.map((warning) => (
        <p key={warning.title} className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {warning.title}. {warning.message}
        </p>
      ))}

      {booted && !result.refusal && (needsTags || result.matches.length > 0) && (
        <section className="mt-6 max-w-3xl rounded-3xl border bg-card p-5">
          <h2 className="font-heading text-2xl">{needsTags ? "Search tags" : "AI recommend and score"}</h2>
          {needsTags && !tagsReady && <p className="mt-2 text-sm text-muted-foreground">Asking for a short phrase and search tags…</p>}
          {needsTags && tagsReady && (phrase || activeTags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {phrase && (
                <Badge className="h-auto px-2 py-1 whitespace-normal">{phrase}</Badge>
              )}
              {activeTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="h-auto px-2 py-1 whitespace-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {needsTags && tagsReady && tagState.status === "error" && (
            <p className="mt-2 text-sm text-muted-foreground">Search tags did not come back. Plates stay in fit order.</p>
          )}
          {needsTags && tagsReady && tagState.status === "ready" && activeTags.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No library tags matched that request. Plates stay in fit order.</p>
          )}
          {result.matches.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              The model only scores plates that already pass your rules. It does not invent dishes or nutrition. Calories stay the ingredient totals.
            </p>
          )}
          {tagsReady && aiBusy && <p className="mt-3 text-sm text-muted-foreground">Scoring every plate…</p>}
          {aiError && <p className="mt-3 text-sm text-muted-foreground">{aiError}</p>}
          {ai?.recommendation && <p className="mt-3 leading-relaxed">{ai.recommendation}</p>}
        </section>
      )}

      {!booted ? (
        <p className="mt-8 text-muted-foreground">Loading plates…</p>
      ) : needsTags && !tagsReady ? null : result.refusal ? (
        <section className="mt-8 max-w-xl rounded-3xl border bg-card p-6">
          <h2 className="font-heading text-3xl tracking-tight">{result.refusal.title}</h2>
          <p className="mt-3 leading-relaxed">{result.refusal.message}</p>
          {result.refusal.suggestion && <p className="mt-3 text-muted-foreground">{result.refusal.suggestion}</p>}
          {result.refusal.suggestedText && (
            <a
              href={withBase(`/results/?q=${encodeURIComponent(result.refusal.suggestedText)}`)}
              className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm text-primary-foreground"
            >
              Try this instead
            </a>
          )}
        </section>
      ) : result.matches.length === 0 ? (
        <section className="mt-8 max-w-xl">
          <p className="text-muted-foreground">Nothing in the library clears every rule.</p>
          <a href={withBase("/search/")} className="mt-4 inline-block text-sm text-primary">
            Relax the search
          </a>
        </section>
      ) : (
        <>
          {activeTags.length > 0 && ordered.primary.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">No plate that passes your rules uses these tags. The list below still follows the saved rules.</p>
          )}
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mainList.map((hit) => (
              <li key={hit.recipe.id}>
                <PlateCard
                  hit={hit}
                  href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`}
                  ai={ai?.scores[hit.recipe.id]}
                  pending={aiBusy}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {tagsReady && ordered.leftOut.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-3xl tracking-tight">Left out by a saved rule</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These are close to the search tags. A saved diet or allergy keeps them off the safe list.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {ordered.leftOut.map((hit) => (
              <li key={hit.recipe.id} className="rounded-3xl border bg-card p-4">
                <p className="font-heading text-2xl tracking-tight">{hit.recipe.title}</p>
                <p className="mt-2 text-sm">{hardMisses(hit).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tagsReady && otherList.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-3xl tracking-tight">Other plates that pass your rules</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ordered.primary.length === 0
              ? "No plate that passes your rules uses these tags. These still follow the saved rules."
              : "These clear the saved rules and do not use the search tags."}
          </p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {otherList.map((hit) => (
              <li key={hit.recipe.id}>
                <PlateCard
                  hit={hit}
                  href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`}
                  ai={ai?.scores[hit.recipe.id]}
                  pending={aiBusy}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {booted && tagsReady && result.near.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-3xl tracking-tight">Close, one rule off</h2>
          <p className="mt-2 text-sm text-muted-foreground">These miss exactly one soft rule. Hard rules, such as an allergy, stay off this list.</p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.near.map((hit) => (
              <li key={hit.recipe.id}>
                <PlateCard
                  hit={hit}
                  href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`}
                  ai={ai?.scores[hit.recipe.id]}
                  pending={aiBusy}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {booted && tagsReady && result.plan && (
        <section className="mt-12">
          <h2 className="font-heading text-3xl tracking-tight">The plan</h2>
          <div className="mt-5 grid gap-4">
            {result.plan.map((day) => (
              <article key={day.day} className="rounded-3xl border bg-card p-4">
                <h3 className="font-heading text-2xl">Day {day.day}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {day.total.calories} kcal · {day.total.protein} g protein
                  {day.within == null ? "" : day.within ? " · inside the daily band" : " · outside the daily band"}
                </p>
                <ul className="mt-3 space-y-2">
                  {day.meals.map((meal) => (
                    <li key={`${day.day}-${meal.label}`}>
                      <a className="text-sm text-primary" href={withBase(`/recipe/${meal.hit.recipe.id}/`)}>
                        {meal.label}: {meal.hit.recipe.title}
                      </a>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        · {meal.nutrition.calories} kcal
                        {meal.scale !== 1 ? ` · ${meal.scale}×` : ""}
                        {ai?.scores[meal.hit.recipe.id] ? ` · AI Score ${ai.scores[meal.hit.recipe.id].score}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border bg-card p-4">
            <h3 className="font-heading text-2xl">One list for the plan</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {planLines.map((line) => (
                <li key={line.id}>
                  {formatAmount(line.quantity, line.unit)} {line.name}
                  {line.recipes.length > 1 ? ` · ${line.recipes.length} plates` : ""}
                </li>
              ))}
            </ul>
            <Button className="mt-4 rounded-full" onClick={addPlan}>
              {addedPlan ? "Added to kitchen" : "Add plan to kitchen list"}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
