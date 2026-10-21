import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">Mise</p>
      <h1 className="mt-4 font-heading text-5xl leading-[0.95] tracking-tight sm:text-6xl">
        Find a meal that fits.
      </h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
        Three short steps. Search a goal, choose a plate, then cook with the recipe and a video.
      </p>
      <ol className="mt-8 space-y-2 text-sm text-muted-foreground">
        <li>1 · Search</li>
        <li>2 · Choose a plate</li>
        <li>3 · Cook</li>
      </ol>
      <Button asChild className="mt-10 h-12 w-fit rounded-full px-8 text-base">
        <Link href="/search">Get started</Link>
      </Button>
    </main>
  );
}
