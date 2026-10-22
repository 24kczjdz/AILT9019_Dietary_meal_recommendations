"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { withBase } from "@/lib/base";
import { media, photoSrc } from "@/lib/media";
import { displayedNutrition, formatAmount, scaleIngredients } from "@/lib/nutrition";
import { getRecipe } from "@/lib/recipes";
import { linesFromRecipe, mergeLines } from "@/lib/shopping";
import { loadFavorites, loadKitchen, saveFavorites, saveKitchen } from "@/lib/storage";

export function RecipeStep({ id }: { id: string }) {
  const [back, setBack] = useState(withBase("/results/"));
  const recipe = getRecipe(id);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && from.startsWith("/") && !from.startsWith("//")) setBack(from);
  }, []);
  const clip = media[id];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(loadFavorites().includes(id));
  }, [id]);
  const detail = useMemo(() => (recipe ? displayedNutrition(scaleIngredients(recipe.ingredients, 1)) : null), [recipe]);

  if (!recipe || !detail || !clip) return null;

  function addToKitchen() {
    if (!recipe) return;
    const next = mergeLines(loadKitchen(), linesFromRecipe(recipe, 1));
    saveKitchen(next);
    setAdded(true);
  }

  function toggleSaved() {
    const current = loadFavorites();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    saveFavorites(next);
    setSaved(next.includes(id));
  }

  return (
    <main id="recipe-sheet" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
      <a href={back} className="no-print text-sm text-primary">
        Back to plates
      </a>
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
        Estimated for one serving from the ingredient list. The rows below use the same rounded figures as the totals. Not medical advice.
      </p>
      <div className="mt-4 overflow-x-auto rounded-3xl border bg-card">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Ingredient</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              <th className="px-3 py-3 font-medium">kcal</th>
              <th className="px-3 py-3 font-medium">Protein</th>
              <th className="px-3 py-3 font-medium">Fat</th>
              <th className="px-3 py-3 font-medium">Carbs</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((item) => (
              <tr key={`${item.key}-${item.unit}`} className="border-t">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{formatAmount(item.quantity, item.unit)}</td>
                <td className="px-3 py-2">{item.calories}</td>
                <td className="px-3 py-2">{item.protein} g</td>
                <td className="px-3 py-2">{item.fat} g</td>
                <td className="px-3 py-2">{item.carbs} g</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="px-3 py-3">Total</td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3">{detail.total.calories}</td>
              <td className="px-3 py-3">{detail.total.protein} g</td>
              <td className="px-3 py-3">{detail.total.fat} g</td>
              <td className="px-3 py-3">{detail.total.carbs} g</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section className="no-print mt-8">
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

      <div className="no-print mt-8 flex flex-wrap gap-2">
        <Button className="rounded-full" onClick={addToKitchen}>
          {added ? "Added to kitchen" : "Add to kitchen list"}
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <a href={withBase("/kitchen/")}>Open kitchen list</a>
        </Button>
        <Button variant="outline" className="rounded-full" onClick={toggleSaved}>
          {saved ? "Saved" : "Save meal"}
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{recipe.note}</p>
    </main>
  );
}
