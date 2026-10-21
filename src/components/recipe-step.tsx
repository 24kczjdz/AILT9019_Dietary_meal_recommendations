"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { media, photoSrc } from "@/lib/media";
import { displayedNutrition, formatAmount, scaleIngredients } from "@/lib/nutrition";
import { getRecipe } from "@/lib/recipes";
import { linesFromRecipe, mergeLines } from "@/lib/shopping";
import { loadKitchen, saveKitchen } from "@/lib/storage";

export function RecipeStep({ id }: { id: string }) {
  const params = useSearchParams();
  const back = params.get("from") || "/results";
  const recipe = getRecipe(id);
  const clip = media[id];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);
  const detail = useMemo(() => (recipe ? displayedNutrition(scaleIngredients(recipe.ingredients, 1)) : null), [recipe]);

  if (!recipe || !detail || !clip) return null;

  function addToKitchen() {
    if (!recipe) return;
    const next = mergeLines(loadKitchen(), linesFromRecipe(recipe, 1));
    saveKitchen(next);
    setAdded(true);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
      <Link href={back} className="text-sm text-primary">
        Back to plates
      </Link>
      <img src={photoSrc(recipe.id)} alt={recipe.title} className="mt-4 aspect-[16/10] w-full rounded-3xl object-cover" />
      <h1 className="mt-6 font-heading text-4xl tracking-tight sm:text-5xl">{recipe.title}</h1>
      <p className="mt-3 text-muted-foreground">{recipe.summary}</p>
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Calories", `${detail.total.calories}`],
          ["Protein", `${detail.total.protein} g`],
          ["Fat", `${detail.total.fat} g`],
          ["Carbs", `${detail.total.carbs} g`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-card px-3 py-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">
        Estimated for one serving from the ingredient list. Not medical advice.
      </p>

      <section className="mt-8">
        <h2 className="font-heading text-2xl">Watch</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {clip.youtubeTitle}. A related YouTube video. Its method and portions can differ from this page.
        </p>
        <div className="mt-3 overflow-hidden rounded-3xl bg-black">
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube-nocookie.com/embed/${clip.youtubeId}`}
            title={clip.youtubeTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="font-heading text-2xl">Ingredients</h2>
          <ul className="mt-3 space-y-3">
            {detail.lines.map((item) => {
              const lineId = `${item.key}-${item.unit}`;
              return (
                <li key={lineId} className="flex items-start gap-3">
                  <Checkbox
                    id={lineId}
                    checked={Boolean(checked[lineId])}
                    onCheckedChange={(value) => setChecked((current) => ({ ...current, [lineId]: value === true }))}
                    className="mt-1"
                  />
                  <label htmlFor={lineId} className={checked[lineId] ? "text-muted-foreground line-through" : ""}>
                    {formatAmount(item.quantity, item.unit)} {item.name}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h2 className="font-heading text-2xl">Steps</h2>
          <ol className="mt-3 space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="font-heading text-xl text-primary">{index + 1}</span>
                <p className="pt-0.5 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button className="rounded-full" onClick={addToKitchen}>
          {added ? "Added to kitchen" : "Add to kitchen list"}
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/kitchen">Open kitchen list</Link>
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{recipe.note}</p>
    </main>
  );
}
