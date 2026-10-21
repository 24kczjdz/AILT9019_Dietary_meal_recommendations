"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ALLERGEN_LABEL, KNOWN_ALLERGENS } from "@/lib/limits";
import { EMPTY_PROFILE, estimateCalories } from "@/lib/profile";
import type { Allergen, DietTag, Profile } from "@/lib/types";

const DIETS: { id: DietTag; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "dairy-free", label: "Dairy-free" },
  { id: "nut-free", label: "Nut-free" },
];

const ACTIVITIES: { id: Profile["activity"]; label: string }[] = [
  { id: "sedentary", label: "Desk" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "active", label: "Active" },
];

export function ProfileSheet({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const estimate = estimateCalories(profile);

  function toggleDiet(id: DietTag) {
    const diets = profile.diets.includes(id) ? profile.diets.filter((diet) => diet !== id) : [...profile.diets, id];
    onChange({ ...profile, diets });
  }

  function toggleAllergy(id: Allergen) {
    const allergies = profile.allergies.includes(id)
      ? profile.allergies.filter((allergy) => allergy !== id)
      : [...profile.allergies, id];
    onChange({ ...profile, allergies });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full">
          Preferences
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">Saved on this device</SheetTitle>
          <SheetDescription>
            Diet tags and allergies are applied to later searches. A calorie target is used only for meal plans. Nothing
            is uploaded, and a diagnosis is never asked for.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" value={profile.age} onChange={(age) => onChange({ ...profile, age })} />
            <div>
              <Label>Sex, for the estimate</Label>
              <div className="mt-2 flex gap-2">
                {(["female", "male"] as const).map((sex) => (
                  <button
                    key={sex}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-sm capitalize ${profile.sex === sex ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => onChange({ ...profile, sex: profile.sex === sex ? "" : sex })}
                  >
                    {sex}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Weight, kg" value={profile.weightKg} onChange={(weightKg) => onChange({ ...profile, weightKg })} />
            <Field label="Height, cm" value={profile.heightCm} onChange={(heightCm) => onChange({ ...profile, heightCm })} />
          </div>
          <div>
            <Label>Activity</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIVITIES.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm ${profile.activity === activity.id ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => onChange({ ...profile, activity: activity.id })}
                >
                  {activity.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-background p-3 text-sm leading-relaxed">
            {estimate.ok ? (
              <>
                <p>A common estimate is about {estimate.kcal.toLocaleString()} kcal a day. It is not a prescription.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 rounded-full"
                  onClick={() => onChange({ ...profile, calorieTarget: String(estimate.kcal) })}
                >
                  Use {estimate.kcal.toLocaleString()} kcal for plans
                </Button>
              </>
            ) : (
              <p>{estimate.reason}</p>
            )}
          </div>
          <Field
            label="Plan calorie target"
            value={profile.calorieTarget}
            onChange={(calorieTarget) => onChange({ ...profile, calorieTarget })}
          />
          <div>
            <Label>Diet tags</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIETS.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm ${profile.diets.includes(diet.id) ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => toggleDiet(diet.id)}
                >
                  {diet.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Allergies to hard-filter</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {KNOWN_ALLERGENS.map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm ${profile.allergies.includes(allergy) ? "bg-foreground text-background" : ""}`}
                  onClick={() => toggleAllergy(allergy)}
                >
                  {ALLERGEN_LABEL[allergy]}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onChange(EMPTY_PROFILE)}>
            Clear saved preferences
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-2 h-10" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
