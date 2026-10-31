import React from "react";
import { Lock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/geo";

export default function FeeScheduleCard({ school, isAuthenticated, onSignIn }) {
  const items = school.fee_items || [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Fee schedule</h3>
      </div>

      {!isAuthenticated ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 p-5 text-center">
          <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Private to signed-in families</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign in to see the itemised tuition, capital levy and payment options.
          </p>
          <Button size="sm" onClick={onSignIn} className="mt-3">Sign in to view</Button>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This school shares its itemised fees after your first enquiry. Message admissions to request them.
        </p>
      ) : (
        <dl className="mt-4 divide-y divide-border/70 text-sm">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-medium">{formatMoney(item.amount, school.currency)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}