import { SiteHeader } from "@/components/site-header";
import { SearchStep } from "@/components/search-step";

export default function SearchPage() {
  return (
    <>
      <SiteHeader step="Step 1 of 3" />
      <SearchStep />
    </>
  );
}
