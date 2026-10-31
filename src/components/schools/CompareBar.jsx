import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/lib/store";

export default function CompareBar() {
  const { pathname } = useLocation();
  const schools = useCompareStore((s) => s.schools);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  if (!schools.length || pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary px-4 py-3 text-primary-foreground shadow-xl">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4" /> Compare ({schools.length}/4)
        </span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {schools.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs"
            >
              <span className="max-w-[140px] truncate">{s.name}</span>
              <button type="button" onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`}>
                <X className="h-3 w-3 opacity-70 hover:opacity-100" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={clear} className="text-xs text-primary-foreground/70 hover:text-primary-foreground">
            Clear
          </button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/compare">Compare now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}