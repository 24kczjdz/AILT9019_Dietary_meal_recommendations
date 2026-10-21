import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RecipeStep } from "@/components/recipe-step";
import { getRecipe, recipes } from "@/lib/recipes";

export function generateStaticParams() {
  return recipes.map((recipe) => ({ id: recipe.id }));
}

async function RecipeBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();
  return <RecipeStep id={id} />;
}

export default function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader step="Step 3 of 3" />
      <Suspense fallback={<p className="px-6 text-muted-foreground">Opening the recipe…</p>}>
        <RecipeBody params={params} />
      </Suspense>
    </>
  );
}
