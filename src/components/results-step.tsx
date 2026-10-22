"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { withBase } from "@/lib/base";
import { searchMeals, type MealSearch } from "@/lib/match";
import { photoSrc } from "@/lib/media";
import { loadProfile } from "@/lib/storage";

export function ResultsStep() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MealSearch>(() => searchMeals(""));

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    const profile = loadProfile();
    const hasProfile = profile.diets.length > 0 || profile.allergies.length > 0 || profile.calorieTarget.trim() !== "";
    setQuery(q);
    setResult(searchMeals(q, [], [], hasProfile ? profile : undefined));
  }, []);

  const back = query ? withBase(`/results/?q=${encodeURIComponent(query)}`) : withBase("/results/");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl tracking-tight">Plates</h1>
          <p className="mt-2 text-muted-foreground">
            {query ? query : "Every plate in the library."} · {result.matches.length} meals
          </p>
        </div>
        <a href={withBase("/search/")} className="text-sm text-primary">
          Change search
        </a>
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
              <a
                href={`${withBase(`/recipe/${hit.recipe.id}/`)}?from=${encodeURIComponent(back)}`}
                className="block overflow-hidden rounded-3xl border bg-card"
              >
                <img
                  src={photoSrc(hit.recipe.id)}
                  alt={hit.recipe.title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-end justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-heading text-2xl tracking-tight">{hit.recipe.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hit.nutrition.calories} kcal · {hit.nutrition.protein} g protein · {hit.recipe.minutes} min
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-primary">Open</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
