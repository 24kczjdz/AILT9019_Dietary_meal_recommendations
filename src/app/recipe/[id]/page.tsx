import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RecipeStep } from "@/components/recipe-step";
import { getRecipe, recipes } from "@/lib/recipes";

export const dynamicParams = false;

export function generateStaticParams() {
  return recipes.map((recipe) => ({ id: recipe.id }));
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();
  return (
    <>
      <SiteHeader step="Step 3 of 3" />
      <RecipeStep id={id} />
    </>
  );
}
