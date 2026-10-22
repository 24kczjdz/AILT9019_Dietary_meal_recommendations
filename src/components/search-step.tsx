"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { withBase } from "@/lib/base";

const POINTS = [
  { label: "High protein", text: "high protein" },
  { label: "Low fat", text: "low fat" },
  { label: "Vegetarian", text: "vegetarian" },
  { label: "Vegan", text: "vegan" },
  { label: "Gluten-free", text: "gluten-free" },
  { label: "Under 600 kcal", text: "less than 600 kcal" },
  { label: "Breakfast", text: "breakfast" },
  { label: "Dinner", text: "dinner" },
];

export function SearchStep() {
  const [query, setQuery] = useState("");

  function toggle(text: string) {
    const parts = query
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const exists = parts.some((part) => part.toLowerCase() === text.toLowerCase());
    const next = exists ? parts.filter((part) => part.toLowerCase() !== text.toLowerCase()) : [...parts, text];
    setQuery(next.join(", "));
  }

  function selected(text: string) {
    return query
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .includes(text.toLowerCase());
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-16">
      <h1 className="font-heading text-4xl tracking-tight">What should the meal do?</h1>
      <p className="mt-3 text-muted-foreground">Type a goal, or tap a few points below. See meals opens the photo list.</p>
      <form action={withBase("/results/")} method="get" className="mt-8">
        <label htmlFor="meal-search" className="sr-only">
          Dietary goal
        </label>
        <input
          id="meal-search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Low fat, high protein, vegetarian"
          className="h-14 w-full rounded-full border bg-card px-5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <p className="mt-6 text-sm text-muted-foreground">Suggested points</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {POINTS.map((point) => {
            const on = selected(point.text);
            return (
              <button
                key={point.label}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(point.text)}
                className={`rounded-full border px-3 py-2 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
              >
                {point.label}
              </button>
            );
          })}
        </div>
        <Button type="submit" className="mt-8 h-12 rounded-full px-8 text-base">
          See meals
        </Button>
      </form>
    </main>
  );
}
