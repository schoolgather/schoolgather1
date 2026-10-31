import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Plus, Scale, Minus } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompareStore } from "@/lib/store";
import { formatMoney, tuitionRange } from "@/lib/geo";

function Row({ label, schools, render }) {
  return (
    <tr className="border-b border-border/70 last:border-0">
      <th className="sticky left-0 z-10 min-w-[150px] bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </th>
      {schools.map((school) => (
        <td key={school.id} className="min-w-[200px] px-4 py-3 align-top text-sm">
          {render(school)}
        </td>
      ))}
    </tr>
  );
}

export default function Compare() {
  const schools = useCompareStore((s) => s.schools);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const toggle = useCompareStore((s) => s.toggle);
  const [baseline, setBaseline] = React.useState(null);

  if (!schools.length) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <Scale className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold">Nothing to compare yet</h1>
          <p className="mt-2 text-muted-foreground">
            Add up to four schools from the directory and their curricula, tuition and support will line
            up here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/schools">Browse schools <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const setBaselineFor = (school) => setBaseline(baseline === school.id ? null : school.id);
  const lowestTuition = Math.min(...schools.map((s) => Number(s.tuition_min) || Infinity));

  return (
    <div className="container-page py-10 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Side by side</h1>
          <p className="mt-2 text-muted-foreground">
            Comparing {schools.length} of 4 schools. {schools.length < 4 && "Add another from the directory."}
          </p>
        </div>
        <div className="flex gap-2">
          {schools.length < 4 && (
            <Button asChild variant="outline" size="sm">
              <Link to="/schools"><Plus className="mr-1.5 h-4 w-4" /> Add school</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clear}>Clear all</Button>
        </div>
      </div>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[150px] bg-card" />
              {schools.map((school) => (
                <th key={school.id} className="min-w-[200px] border-b border-l border-border/70 p-4 text-left align-top">
                  <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-lg bg-secondary">
                    <Image src={school.cover_image_url} alt={school.name} className="h-full w-full object-cover" />
                  </div>
                  <Link to={`/schools/${school.id}`} className="text-base font-semibold hover:text-primary">
                    {school.name}
                  </Link>
                  <p className="mt-0.5 text-xs font-normal text-muted-foreground">{school.city}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="h-8">
                      <Link to={`/apply/${school.id}`}>Apply</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => remove(school.id)}
                    >
                      <Minus className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row
              label="Curriculum"
              schools={schools}
              render={(s) => <Badge variant="secondary">{s.curriculum_type}</Badge>}
            />
            <Row label="Location" schools={schools} render={(s) => `${s.city}, ${s.country}`} />
            <Row
              label="Tuition"
              schools={schools}
              render={(s) => (
                <span className="flex items-center gap-2 font-medium">
                  {tuitionRange(s)}
                  {Number(s.tuition_min) === lowestTuition && (
                    <Badge className="border-0 bg-chart-3/15 text-[10px] text-chart-3">Lowest</Badge>
                  )}
                </span>
              )}
            />
            <Row label="Ages" schools={schools} render={(s) => s.age_range || "—"} />
            <Row label="Class ratio" schools={schools} render={(s) => s.student_teacher_ratio || "—"} />
            <Row
              label="Languages"
              schools={schools}
              render={(s) => (s.languages || []).join(", ") || "—"}
            />
            <Row
              label="Accreditation"
              schools={schools}
              render={(s) => s.accreditation_details || "—"}
            />
            <Row
              label="Scholarships"
              schools={schools}
              render={(s) =>
                s.scholarship_available ? (
                  <span className="flex items-center gap-1.5 text-chart-3">
                    <Check className="h-4 w-4" /> Up to {s.merit_scholarship_pct || 0}% merit
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not advertised</span>
                )
              }
            />
            <Row
              label="Rating"
              schools={schools}
              render={(s) => (Number(s.rating) ? `${Number(s.rating).toFixed(1)} / 5` : "—")}
            />
            <Row
              label="Programmes"
              schools={schools}
              render={(s) => (s.programs || []).slice(0, 3).join(" · ") || "—"}
            />
            <Row
              label="Facilities"
              schools={schools}
              render={(s) => (s.facilities || []).slice(0, 3).join(" · ") || "—"}
            />
            <Row
              label="Extracurriculars"
              schools={schools}
              render={(s) => (s.extracurriculars || []).slice(0, 3).join(" · ") || "—"}
            />
            <Row
              label="Capacity"
              schools={schools}
              render={(s) => (s.capacity ? `${s.capacity} students` : "—")}
            />
            <Row
              label="Benchmark"
              schools={schools}
              render={(s) => (
                <Button
                  size="sm"
                  variant={baseline === s.id ? "secondary" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setBaselineFor(s)}
                >
                  {baseline === s.id ? "Benchmarked" : "Benchmark this"}
                </Button>
              )}
            />
          </tbody>
        </table>
      </div>

      {baseline && (
        <p className="mt-4 text-sm text-muted-foreground">
          Benchmarking against{" "}
          <strong className="text-foreground">{schools.find((s) => s.id === baseline)?.name}</strong> —
          tuition difference vs. that school:{" "}
          {schools
            .filter((s) => s.id !== baseline)
            .map((s) => {
              const base = schools.find((b) => b.id === baseline);
              const diff = (Number(s.tuition_min) || 0) - (Number(base.tuition_min) || 0);
              return `${s.name}: ${diff >= 0 ? "+" : ""}${formatMoney(diff, s.currency)}`;
            })
            .join(" · ")}
        </p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {schools.map((school) => (
          <Button key={school.id} variant="outline" onClick={() => toggle(school)} className="justify-start">
            <Scale className="mr-2 h-4 w-4" /> Add {school.name} back to directory picks
          </Button>
        ))}
      </div>
    </div>
  );
}