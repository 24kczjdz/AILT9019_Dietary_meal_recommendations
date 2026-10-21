"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/nutrition";
import { shoppingText } from "@/lib/shopping";
import { loadKitchen, saveKitchen } from "@/lib/storage";
import type { ShoppingLine } from "@/lib/types";

export default function KitchenPage() {
  const [lines, setLines] = useState<ShoppingLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(loadKitchen());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveKitchen(lines);
  }, [lines, ready]);

  const aisles = [...new Set(lines.map((line) => line.aisle))];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        <h1 className="font-heading text-4xl tracking-tight">Kitchen list</h1>
        <p className="mt-2 text-muted-foreground">Ingredients you added from a recipe, kept in this browser.</p>
        {lines.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Nothing here yet. Open a plate and add its ingredients.</p>
        ) : (
          <>
            <Button
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => navigator.clipboard.writeText(shoppingText(lines))}
            >
              Copy list
            </Button>
            <div className="mt-6 space-y-6">
              {aisles.map((aisle) => (
                <section key={aisle}>
                  <h2 className="font-heading text-2xl">{aisle}</h2>
                  <ul className="mt-3 space-y-3">
                    {lines
                      .filter((line) => line.aisle === aisle)
                      .map((line) => (
                        <li key={line.id} className="flex items-start gap-3">
                          <Checkbox
                            id={line.id}
                            checked={line.checked}
                            onCheckedChange={(value) =>
                              setLines((current) =>
                                current.map((item) => (item.id === line.id ? { ...item, checked: value === true } : item)),
                              )
                            }
                            className="mt-1"
                          />
                          <label htmlFor={line.id} className={line.checked ? "text-muted-foreground line-through" : ""}>
                            {formatAmount(line.quantity, line.unit)} {line.name}
                          </label>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
