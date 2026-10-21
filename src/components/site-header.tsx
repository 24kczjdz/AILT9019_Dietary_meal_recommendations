import Link from "next/link";

export function SiteHeader({ step }: { step?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="font-heading text-xl tracking-tight">
        Mise
      </Link>
      {step ? <p className="text-sm text-muted-foreground">{step}</p> : <span />}
    </header>
  );
}
