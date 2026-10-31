import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { APPLICATION_STATUSES, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ApplicationsBoard({ applications, onOpen }) {
  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No applications yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Find a school and your progress will appear here.</p>
        <Link to="/schools" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Browse the directory
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {APPLICATION_STATUSES.map((status) => {
          const items = applications.filter((a) => a.status === status);
          const meta = STATUS_META[status];
          return (
            <div key={status} className="w-[248px] shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <span className="rounded-full bg-secondary px-1.5 text-[11px] font-semibold">{items.length}</span>
              </div>
              <div className="min-h-[120px] space-y-2 rounded-xl bg-secondary/40 p-2">
                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">Empty</p>
                )}
                {items.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onOpen(app)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40"
                  >
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{app.school_name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {app.grade_applying || "Year group TBC"} · {app.academic_year}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Updated {new Date(app.updated_date).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}