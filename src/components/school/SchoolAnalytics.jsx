import React, { useEffect, useState } from "react";
import { Eye, FileDown, ClipboardList, Percent, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, STATUS_META } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

export default function SchoolAnalytics({ school, applications }) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.ProfileView.filter({ school_id: school.id }, { limit: 500 })
      .then((page) => active && setViews((page.items || []).length))
      .catch(() => active && setViews(0));
    return () => {
      active = false;
    };
  }, [school.id]);

  const total = applications.length;
  const offers = applications.filter((a) => ["ACCEPTED", "ENROLLED"].includes(a.status)).length;
  const conversion = views ? Math.round((total / views) * 100) : 0;

  const counts = APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((a) => a.status === status).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  const exportCsv = () => {
    downloadCsv(
      `${school.slug || "school"}-applications.csv`,
      applications.map((a) => ({
        student: a.student_name,
        email: a.student_email,
        guardian: a.guardian_name,
        guardian_email: a.guardian_email,
        phone: a.guardian_phone,
        grade: a.grade_applying,
        year: a.academic_year,
        status: STATUS_META[a.status]?.label || a.status,
        submitted: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "",
        documents: (a.documents || []).length,
      })),
      [
        { key: "student", label: "Student" },
        { key: "email", label: "Student email" },
        { key: "guardian", label: "Guardian" },
        { key: "guardian_email", label: "Guardian email" },
        { key: "phone", label: "Phone" },
        { key: "grade", label: "Year group" },
        { key: "year", label: "Academic year" },
        { key: "status", label: "Status" },
        { key: "submitted", label: "Submitted" },
        { key: "documents", label: "Documents" },
      ]
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Eye, label: "Profile views", value: views === null ? "…" : views },
          { icon: ClipboardList, label: "Applications", value: total },
          { icon: Percent, label: "View → apply", value: `${conversion}%` },
          { icon: Trophy, label: "Offers issued", value: offers },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Pipeline distribution</h3>
            <p className="text-xs text-muted-foreground">Where your applicants sit right now.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!applications.length}>
            <FileDown className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>
        <div className="mt-4 space-y-2.5">
          {counts.map((item) => (
            <div key={item.status} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{STATUS_META[item.status].label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", STATUS_META[item.status].dot)}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}