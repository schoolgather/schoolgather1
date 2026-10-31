import React, { useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateAid } from "@/lib/aid";
import { formatMoney } from "@/lib/geo";

export default function AidCalculator({ school }) {
  const baseTuition = Number(school?.tuition_max || school?.tuition_min || 0);
  const [income, setIncome] = useState(60000);
  const [size, setSize] = useState(4);
  const [merit, setMerit] = useState(school?.merit_scholarship_pct || 0);

  const result = estimateAid({
    tuition: baseTuition,
    householdIncome: income,
    householdSize: size,
    meritPct: merit,
    scholarshipAvailable: school?.scholarship_available !== false,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-foreground">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">Financial aid estimator</h3>
          <p className="text-sm text-muted-foreground">
            An indicative net-tuition figure based on household income, family size and merit bands.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="aid-income" className="text-xs text-muted-foreground">
            Household income / yr
          </Label>
          <Input
            id="aid-income"
            type="number"
            min={0}
            step={1000}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="aid-size" className="text-xs text-muted-foreground">
            People in household
          </Label>
          <Input
            id="aid-size"
            type="number"
            min={1}
            max={12}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="aid-merit" className="text-xs text-muted-foreground">
            Merit award band · {merit}%
          </Label>
          <input
            id="aid-merit"
            type="range"
            min={0}
            max={60}
            step={5}
            value={merit}
            onChange={(e) => setMerit(Number(e.target.value))}
            className="mt-2 h-2 w-full accent-[hsl(var(--primary))]"
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/70 bg-secondary/50 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated net tuition</p>
            <p className="font-display text-3xl font-semibold">{formatMoney(result.netTuition, school?.currency)}</p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatMoney(result.monthly, school?.currency)} / month · {result.band.label}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Aid awarded</p>
            <p className="text-base font-semibold text-chart-3">{result.totalAidPct}%</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-xs">
          <div>
            <dt className="text-muted-foreground">List tuition</dt>
            <dd className="font-medium">{formatMoney(result.annual, school?.currency)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Family contribution</dt>
            <dd className="font-medium">{formatMoney(result.contribution, school?.currency)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Needs-based award</dt>
            <dd className="font-medium">{formatMoney(result.needAward, school?.currency)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Merit award</dt>
            <dd className="font-medium">{formatMoney(result.meritAward, school?.currency)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Estimates only. Final awards are decided by the school's admissions and finance committee after review.
      </p>
    </div>
  );
}