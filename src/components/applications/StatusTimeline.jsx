import React from "react";
import { Check, Circle } from "lucide-react";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function StatusTimeline({ timeline = [], currentStatus }) {
  const entries = [...timeline].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {entries.map((entry, index) => {
        const meta = STATUS_META[entry.status] || { label: entry.status, dot: "bg-primary" };
        const isLast = index === entries.length - 1;
        return (
          <li key={`${entry.status}-${entry.at}-${index}`} className="relative">
            <span
              className={cn(
                "absolute -left-[26px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background",
                isLast ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {isLast ? <Check className="h-2.5 w-2.5" /> : <Circle className="h-1.5 w-1.5 fill-current" />}
            </span>
            <p className="text-sm font-medium">{meta.label}</p>
            {entry.note && <p className="mt-0.5 text-sm text-muted-foreground">{entry.note}</p>}
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {entry.at ? new Date(entry.at).toLocaleString() : ""}
              {entry.by ? ` · ${entry.by}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}