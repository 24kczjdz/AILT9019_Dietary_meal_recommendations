import { SiteHeader } from "@/components/site-header";
import { ResultsStep } from "@/components/results-step";

export default function ResultsPage() {
  return (
    <>
      <SiteHeader step="Step 2 of 3" />
      <ResultsStep />
    </>
  );
}
