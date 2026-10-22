"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileControl } from "@/components/profile-control";
import { withBase } from "@/lib/base";
import { PANTRY_GROUPS } from "@/lib/recipes";

const PRESETS = [
  { id: "high-protein", label: "High protein" },
  { id: "low-fat", label: "Low fat" },
  { id: "low-carb", label: "Low carb" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "dairy-free", label: "Dairy-free" },
  { id: "nut-free", label: "Nut-free" },
  { id: "under-600", label: "Under 600 kcal" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "budget", label: "Budget" },
];

const PANTRY = Object.keys(PANTRY_GROUPS);

function ChipBox({
  name,
  id,
  label,
  pressed,
  onToggle,
}: {
  name: string;
  id: string;
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${pressed ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
    >
      <input className="sr-only" type="checkbox" name={name} value={id} checked={pressed} onChange={onToggle} />
      {label}
    </label>
  );
}

export function SearchStep() {
  const [query, setQuery] = useState("");
  const [presets, setPresets] = useState<string[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);

  function toggle(list: string[], id: string, setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-16">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-4xl tracking-tight">What should the meal do?</h1>
        <ProfileControl />
      </div>
      <p className="mt-3 text-muted-foreground">
        Type a goal, then tick any filters that should stay on even if you change the sentence.
      </p>
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
        <p className="mt-6 text-sm text-muted-foreground">Filters</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <ChipBox
              key={preset.id}
              name="preset"
              id={preset.id}
              label={preset.label}
              pressed={presets.includes(preset.id)}
              onToggle={() => toggle(presets, preset.id, setPresets)}
            />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Ingredients at home</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Photo and barcode lookup is not available. Tick what you already have, and matching plates rank higher.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PANTRY.map((id) => (
            <ChipBox
              key={id}
              name="pantry"
              id={id}
              label={id.charAt(0).toUpperCase() + id.slice(1)}
              pressed={pantry.includes(id)}
              onToggle={() => toggle(pantry, id, setPantry)}
            />
          ))}
        </div>
        <Button type="submit" className="mt-8 h-12 rounded-full px-8 text-base">
          See meals
        </Button>
      </form>
    </main>
  );
}
