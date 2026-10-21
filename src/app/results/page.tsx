import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ResultsStep } from "@/components/results-step";
import { searchMeals } from "@/lib/match";

async function ResultsBody({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return <ResultsStep query={q} initial={searchMeals(q)} />;
}

export default function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <>
      <SiteHeader step="Step 2 of 3" />
      <Suspense fallback={<p className="mx-auto w-full max-w-5xl px-5 text-muted-foreground">Finding meals…</p>}>
        <ResultsBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}
