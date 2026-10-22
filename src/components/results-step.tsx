"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileControl } from "@/components/profile-control";
import { withBase } from "@/lib/base";
import { searchMeals, type MealSearch, type Hit } from "@/lib/match";
import { photoSrc } from "@/lib/media";
import { formatAmount } from "@/lib/nutrition";
import { linesFromRecipe, mergeLines } from "@/lib/shopping";
import { loadKitchen, loadProfile, saveKitchen } from "@/lib/storage";
import type { Profile, ShoppingLine } from "@/lib/types";

function resultsHref(query: string, presets: string[], pantry: string[]) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  for (const preset of presets) params.append("preset", preset);
  for (const item of pantry) params.append("pantry", item);
  const search = params.toString();
  return withBase(`/results/${search ? `?${search}` : ""}`);
}

function PlateCard({ hit, href }: { hit: Hit; href: string }) {
  return (
    <a href={href} className="block overflow-hidden rounded-3xl border bg-card">
      <img src={photoSrc(hit.recipe.id)} alt={hit.recipe.title} className="aspect-[4/3] w-full object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">{hit.recipe.title}</h2>
          <span className="shrink-0 text-sm text-primary">Open</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{hit.recipe.summary}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {hit.nutrition.calories} kcal · {hit.nutrition.protein} g protein · {hit.recipe.minutes} min
        </p>
        <p className="mt-2 text-sm">Fit {hit.score}</p>
        {hit.reasons.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{hit.reasons.join(" · ")}</p>}
        {hit.misses.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{hit.misses.join(" · ")}</p>}
      </div>
    </a>
  );
}

export function ResultsStep() {
  const [query, setQuery] = useState("");
  const [presets, setPresets] = useState<string[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [booted, setBooted] = useState(false);
  const [addedPlan, setAddedPlan] = useState(false);

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

  const back = resultsHref(query, presets, pantry);
  const planLines = useMemo(() => {
    if (!result.plan) return [];
    return result.plan.reduce<ShoppingLine[]>(
      (lines, day) => day.meals.reduce((acc, meal) => mergeLines(acc, linesFromRecipe(meal.hit.recipe, meal.scale)), lines),
      [],
    );
  }, [result.plan]);

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
            {query ? query : "Every plate in the library."} · {result.matches.length} meals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProfileControl onChange={setProfile} />
          <a href={withBase("/search/")} className="text-sm text-primary">
            Change search
          </a>
        </div>
      </div>

      {result.constraints.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {result.constraints.chips.map((chip) => (
            <Badge key={chip.id} variant={chip.tone === "warn" ? "destructive" : "secondary"} className="h-auto px-2 py-1 whitespace-normal">
              {chip.label}
            </Badge>
          ))}
        </div>
      )}

      {result.warnings.map((warning) => (
        <p key={warning.title} className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {warning.title}. {warning.message}
        </p>
      ))}

      {result.refusal ? (
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
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.matches.map((hit) => (
            <li key={hit.recipe.id}>
              <PlateCard hit={hit} href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`} />
            </li>
          ))}
        </ul>
      )}

      {result.near.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-3xl tracking-tight">Close, one rule off</h2>
          <p className="mt-2 text-sm text-muted-foreground">These miss exactly one soft rule. Hard rules, such as an allergy, stay off this list.</p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.near.map((hit) => (
              <li key={hit.recipe.id}>
                <PlateCard hit={hit} href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.plan && (
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
