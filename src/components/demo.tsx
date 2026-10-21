"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plate } from "@/components/plate";
import { formatAmount } from "@/lib/nutrition";
import { searchMeals, type Hit, type MealSearch } from "@/lib/match";
import { scaleIngredients } from "@/lib/nutrition";
import { displayedNutrition } from "@/lib/nutrition";
import type { Recipe } from "@/lib/types";

const PRESETS = [
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["gluten-free", "Gluten-free"],
  ["dairy-free", "Dairy-free"],
  ["high-protein", "High protein"],
  ["low-fat", "Low fat"],
  ["low-carb", "Low carb"],
  ["under-600", "Under 600 kcal"],
  ["breakfast", "Breakfast"],
  ["dinner", "Dinner"],
  ["budget", "Budget"],
] as const;

const PANTRY = ["chicken", "tofu", "eggs", "yogurt", "beans", "rice", "spinach", "salmon"];

const EXAMPLES = [
  "Low fat, high protein, vegetarian",
  "At least 35 g protein and less than 20 g fat",
  "Three meals per day, approximately 1,800 kcal",
  "High-protein meal plan for five days",
  "500 calories and 100 g protein",
  "200 calories per day",
];

function recipeText(recipe: Recipe, scale = 1) {
  const ingredients = scaleIngredients(recipe.ingredients, scale);
  const { total } = displayedNutrition(ingredients);
  return [
    recipe.title,
    `${total.calories} kcal · ${total.protein} g protein · ${total.fat} g fat · ${total.carbs} g carbs`,
    "",
    "Ingredients",
    ...ingredients.map((item) => `- ${formatAmount(item.quantity, item.unit)} ${item.name}`),
    "",
    "Steps",
    ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Estimates from the ingredient table. Not medical advice.",
  ].join("\n");
}

export function Demo() {
  const [text, setText] = useState("Low fat, high protein, vegetarian");
  const [presets, setPresets] = useState<string[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);
  const [result, setResult] = useState<MealSearch | null>(null);
  const [selected, setSelected] = useState<Hit | null>(null);
  const [scale, setScale] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [cookStep, setCookStep] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const detail = useMemo(() => {
    if (!selected) return null;
    const ingredients = scaleIngredients(selected.recipe.ingredients, scale);
    return displayedNutrition(ingredients);
  }, [selected, scale]);

  function toggle(list: string[], id: string, setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  function run(nextText = text, nextPresets = presets, nextPantry = pantry) {
    setText(nextText);
    setPresets(nextPresets);
    setPantry(nextPantry);
    setResult(searchMeals(nextText, nextPresets, nextPantry));
    setSelected(null);
    setCookStep(null);
    setScale(1);
    setChecked({});
  }

  function openHit(hit: Hit, serving = 1) {
    setSelected(hit);
    setScale(serving);
    setCookStep(null);
    setChecked({});
    setCopied(false);
  }

  async function copyRecipe() {
    if (!selected) return;
    await navigator.clipboard.writeText(recipeText(selected.recipe, scale));
    setCopied(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <a href="#ask" className="font-heading text-2xl tracking-tight">
          Mise
        </a>
        <p className="hidden text-sm text-muted-foreground sm:block">
          A dietary goal, turned into a plate you can cook.
        </p>
      </header>

      <section className="mt-10 grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Demo library · 24 plates</p>
          <h1 className="mt-3 max-w-xl text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">
            Tell it the goal. Cook the plate that fits.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Type a requirement in plain language. Mise reads it as constraints, shortlists meals from a local
            recipe library, and shows the recipe, the shopping list, and nutrition that adds up. It is not a
            dietitian.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Plate art={{ cloth: "#7a2e24", a: "#c4492a", b: "#e0b15a", c: "#3f6b45" }} className="rounded-3xl" />
          <Plate art={{ cloth: "#2f4a3c", a: "#efe6d4", b: "#7d9a4a", c: "#d08a3a" }} className="mt-8 rounded-3xl" />
        </div>
      </section>

      <section id="ask" className="mt-10 rounded-[2rem] border bg-card p-4 shadow-sm sm:p-6">
        <label htmlFor="goal" className="font-heading text-2xl tracking-tight">
          What should this meal do?
        </label>
        <Textarea
          id="goal"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-4 min-h-28 rounded-2xl border-border bg-background px-4 py-3 text-base md:text-base"
          placeholder="Low fat, high protein, vegetarian"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map(([id, label]) => {
            const on = presets.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(presets, id, setPresets)}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">Already in the kitchen</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PANTRY.map((id) => {
            const on = pantry.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(pantry, id, setPantry)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${on ? "border-foreground bg-foreground text-background" : "bg-background"}`}
              >
                {id}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="h-12 rounded-full px-6 text-base" onClick={() => run()}>
            Find meals
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full px-6 text-base"
            onClick={() => run(text || "Three meals per day, about 1,800 kcal")}
          >
            Use this wording
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="text-left text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => run(example, [], [])}
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <section className="mt-8" aria-live="polite">
          <ConstraintRow result={result} />
          {result.warnings.map((warning) => (
            <aside key={warning.title} className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="font-medium">{warning.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{warning.message}</p>
            </aside>
          ))}
          {result.refusal ? (
            <RefusalCard
              title={result.refusal.title}
              message={result.refusal.message}
              suggestion={result.refusal.suggestion}
              onTry={
                result.refusal.suggestedText
                  ? () => run(result.refusal?.suggestedText ?? "", [], [])
                  : undefined
              }
              tryLabel={result.refusal.suggestedText}
            />
          ) : (
            <>
              {result.plan && (
                <div className="mt-6">
                  <h2 className="font-heading text-3xl tracking-tight">A plan from the plates that fit</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Portions stay between one and two servings. Repeats wait until the matching plates run out.
                    {result.constraints.dailyCalories
                      ? ` Each day is aiming near ${result.constraints.dailyCalories.toLocaleString()} kcal, with a 10% band.`
                      : " No daily calorie target was set, so each plate stays at one serving."}
                  </p>
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {result.plan.map((day) => (
                      <article key={day.day} className="min-w-[260px] flex-1 rounded-3xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Day {day.day}</p>
                        <p className="mt-1 font-medium">
                          {day.total.calories} kcal · {day.total.protein} g protein
                        </p>
                        {day.within != null && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {day.within ? "Inside the 10% calorie band." : "Outside the 10% band at these portion caps."}
                          </p>
                        )}
                        <ul className="mt-3 space-y-2">
                          {day.meals.map((meal) => (
                            <li key={`${day.day}-${meal.label}-${meal.hit.recipe.id}`}>
                              <button
                                type="button"
                                className="w-full rounded-2xl bg-background px-3 py-2 text-left hover:bg-secondary"
                                onClick={() => openHit(meal.hit, meal.scale)}
                              >
                                <span className="block text-xs text-muted-foreground">
                                  {meal.label}
                                  {meal.scale !== 1 ? ` · ${meal.scale}×` : ""}
                                </span>
                                <span className="font-medium">{meal.hit.recipe.title}</span>
                                <span className="block text-sm text-muted-foreground">
                                  {meal.nutrition.calories} kcal · {meal.nutrition.protein} g protein
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-end justify-between gap-4">
                <h2 className="font-heading text-3xl tracking-tight">
                  {result.matches.length > 0 ? "Shortlist" : "No plate cleared every rule"}
                </h2>
                <p className="text-sm text-muted-foreground">{result.pool} in the library</p>
              </div>
              {result.matches.length === 0 && (
                <div className="mt-3">
                  <p className="max-w-2xl text-muted-foreground">
                    The filters removed everything. Loosen one rule instead of forcing a plate that misses it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.constraints.lowFat && (
                      <Button variant="outline" className="rounded-full" onClick={() => run(text.replace(/low[- ]fat|lean/gi, ""), presets.filter((id) => id !== "low-fat"), pantry)}>
                        Drop low fat
                      </Button>
                    )}
                    {result.constraints.highProtein && (
                      <Button variant="outline" className="rounded-full" onClick={() => run("vegetarian dinner", [], pantry)}>
                        Try a simpler ask
                      </Button>
                    )}
                    <Button variant="outline" className="rounded-full" onClick={() => run("high protein", [], [])}>
                      High protein only
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-4">
                {result.matches.map((hit) => (
                  <MealCard key={hit.recipe.id} hit={hit} onOpen={() => openHit(hit)} />
                ))}
              </div>
              {result.near.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-heading text-2xl">Closest plates that miss one rule</h3>
                  <div className="mt-3 grid gap-4">
                    {result.near.map((hit) => (
                      <MealCard key={hit.recipe.id} hit={hit} muted onOpen={() => openHit(hit)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {selected && detail && (
        <section className="mt-8 rounded-[2rem] border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <button type="button" className="text-sm text-primary" onClick={() => setSelected(null)}>
                Back to the shortlist
              </button>
              <h2 className="mt-2 font-heading text-4xl tracking-tight">{selected.recipe.title}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">{selected.recipe.summary}</p>
            </div>
            <Plate art={selected.recipe.art} className="h-36 w-48 rounded-3xl" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Calories", `${detail.total.calories}`],
              ["Protein", `${detail.total.protein} g`],
              ["Fat", `${detail.total.fat} g`],
              ["Carbs", `${detail.total.carbs} g`],
              ["Fiber", `${detail.total.fiber} g`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-background px-3 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-medium">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Estimated for {scale === 1 ? "1 serving" : `${scale} servings`} from the ingredient lines below. Brands and
            cooking losses change the real plate. Not a medical nutrition plan.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setScale((value) => Math.max(1, Math.round((value - 0.5) * 10) / 10))}>
              Less
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setScale((value) => Math.min(4, Math.round((value + 0.5) * 10) / 10))}>
              More food
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setCookStep(cookStep == null ? 0 : null)}>
              {cookStep == null ? "Cook mode" : "Show the whole recipe"}
            </Button>
            <Button className="rounded-full" onClick={copyRecipe}>
              {copied ? "Copied" : "Copy recipe"}
            </Button>
          </div>

          {cookStep != null ? (
            <div className="mt-6 rounded-3xl bg-foreground px-5 py-8 text-background">
              <p className="text-sm opacity-80">
                Step {cookStep + 1} of {selected.recipe.steps.length}
              </p>
              <p className="mt-4 font-heading text-3xl leading-snug sm:text-5xl">{selected.recipe.steps[cookStep]}</p>
              <div className="mt-8 flex gap-2">
                <Button variant="secondary" className="h-12 rounded-full px-5" disabled={cookStep === 0} onClick={() => setCookStep(cookStep - 1)}>
                  Back
                </Button>
                <Button
                  className="h-12 rounded-full px-5"
                  disabled={cookStep === selected.recipe.steps.length - 1}
                  onClick={() => setCookStep(cookStep + 1)}
                >
                  Next step
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-heading text-2xl">Shopping list</h3>
                <ul className="mt-3 space-y-3">
                  {detail.lines.map((item) => {
                    const id = `${item.key}-${item.unit}`;
                    return (
                      <li key={id} className="flex items-start gap-3">
                        <Checkbox
                          id={id}
                          checked={Boolean(checked[id])}
                          onCheckedChange={(value) => setChecked((current) => ({ ...current, [id]: value === true }))}
                          className="mt-1"
                        />
                        <label htmlFor={id} className={checked[id] ? "text-muted-foreground line-through" : ""}>
                          {formatAmount(item.quantity, item.unit)} {item.name}
                          <span className="block text-xs text-muted-foreground">{item.aisle}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-2xl">Method</h3>
                <ol className="mt-3 space-y-4">
                  {selected.recipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-heading text-2xl text-primary">{index + 1}</span>
                      <p className="pt-1 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-muted-foreground">{selected.recipe.note}</p>
              </div>
            </div>
          )}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium">Show the nutrition addition</summary>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Ingredient</th>
                  <th className="py-1 font-medium">kcal</th>
                  <th className="py-1 font-medium">P</th>
                  <th className="py-1 font-medium">F</th>
                  <th className="py-1 font-medium">C</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((item) => (
                  <tr key={`${item.key}-math`} className="border-t">
                    <td className="py-1.5">{item.name}</td>
                    <td>{item.calories}</td>
                    <td>{item.protein}</td>
                    <td>{item.fat}</td>
                    <td>{item.carbs}</td>
                  </tr>
                ))}
                <tr className="border-t font-medium">
                  <td className="py-1.5">Total</td>
                  <td>{detail.total.calories}</td>
                  <td>{detail.total.protein}</td>
                  <td>{detail.total.fat}</td>
                  <td>{detail.total.carbs}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </section>
      )}

      <footer className="mt-12 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        Mise does not diagnose, prescribe, or replace a doctor or dietitian. Nutrition values are estimates from this
        demo’s ingredient table. Allergies are “not found on the ingredient line,” not a guarantee. Extreme daily
        targets under 1,200 kcal are refused. Photo and barcode lookup are not in this slice — use the kitchen chips.
        Nothing you type is sent to a model; the library lives in the page.
      </footer>
    </div>
  );
}

function ConstraintRow({ result }: { result: MealSearch }) {
  if (result.constraints.chips.length === 0 && !result.refusal) {
    return (
      <p className="text-sm text-muted-foreground">
        No specific food rule was detected. The shortlist is the library, unsorted by a diet tag.
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground">Rules read from that request</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {result.constraints.chips.map((chip) => (
          <Badge
            key={chip.id}
            variant={chip.tone === "warn" ? "destructive" : chip.tone === "hard" ? "default" : "secondary"}
            className="h-auto px-2 py-1 whitespace-normal"
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RefusalCard({
  title,
  message,
  suggestion,
  onTry,
  tryLabel,
}: {
  title: string;
  message: string;
  suggestion?: string;
  onTry?: () => void;
  tryLabel?: string;
}) {
  return (
    <div className="mt-4 rounded-[2rem] border bg-card p-6">
      <h2 className="font-heading text-3xl tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed">{message}</p>
      {suggestion && <p className="mt-3 max-w-2xl text-muted-foreground">{suggestion}</p>}
      {onTry && tryLabel && (
        <Button className="mt-5 h-11 rounded-full px-5" onClick={onTry}>
          Try “{tryLabel}”
        </Button>
      )}
    </div>
  );
}

function MealCard({ hit, onOpen, muted = false }: { hit: Hit; onOpen: () => void; muted?: boolean }) {
  return (
    <article className="grid gap-4 rounded-[1.6rem] border bg-card p-3 sm:grid-cols-[180px_1fr] sm:p-4">
      <Plate art={hit.recipe.art} className="h-36 w-full rounded-2xl sm:h-full" />
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-2xl tracking-tight">{hit.recipe.title}</h3>
          <span className="text-sm text-muted-foreground">{muted ? "Miss" : `Fit ${hit.score}`}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{hit.recipe.summary}</p>
        <p className="mt-3 text-sm">
          {hit.nutrition.calories} kcal · {hit.nutrition.protein} g protein · {hit.nutrition.fat} g fat ·{" "}
          {hit.recipe.minutes} min
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {muted ? hit.misses.join(" ") : hit.reasons.join(" · ")}
        </p>
        <div className="mt-4">
          <Button variant={muted ? "outline" : "default"} className="rounded-full" onClick={onOpen}>
            {muted ? "Look anyway" : "Open recipe"}
          </Button>
        </div>
      </div>
    </article>
  );
}
