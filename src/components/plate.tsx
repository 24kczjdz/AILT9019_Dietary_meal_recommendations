import type { Art } from "@/lib/types";

export function Plate({ art, className = "" }: { art: Art; className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
      <rect width="320" height="220" rx="28" fill={art.cloth} />
      <ellipse cx="168" cy="118" rx="112" ry="74" fill="#f6f0e6" />
      <ellipse cx="168" cy="118" rx="92" ry="58" fill="#fffaf3" />
      <ellipse cx="146" cy="116" rx="40" ry="26" fill={art.a} />
      <ellipse cx="198" cy="108" rx="30" ry="20" fill={art.b} transform="rotate(-16 198 108)" />
      <circle cx="214" cy="138" r="10" fill={art.c} />
      <path d="M118 142c24 12 48 10 70-4" fill="none" stroke={art.c} strokeWidth="7" strokeLinecap="round" />
      <circle cx="128" cy="98" r="6" fill={art.b} opacity="0.85" />
    </svg>
  );
}
