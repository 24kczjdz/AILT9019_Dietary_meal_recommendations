import { withBase } from "@/lib/base";

export function SiteHeader({ step }: { step?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <a href={withBase("/")} className="font-heading text-xl tracking-tight">
        Mise
      </a>
      {step ? <p className="text-sm text-muted-foreground">{step}</p> : <span />}
    </header>
  );
}
