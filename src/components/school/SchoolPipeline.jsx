import React, { useState } from "react";
import { Search, Megaphone, FileDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import SchoolApplicationDialog from "@/components/school/SchoolApplicationDialog";
import { APPLICATION_STATUSES, STATUS_META } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

export default function SchoolPipeline({ school, applications, onRefresh }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = applications.filter((app) => {
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const haystack = [app.student_name, app.student_email, app.guardian_name, app.grade_applying]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const broadcast = async () => {
    if (!broadcastText.trim()) return;
    setSending(true);
    const now = new Date().toISOString();
    const recipients = applications.filter((a) => a.status !== "REJECTED");
    try {
      await base44.entities.Application.bulkUpdate(
        recipients.map((app) => ({
          id: app.id,
          timeline: [
            ...(app.timeline || []),
            { status: app.status, note: broadcastText.trim(), at: now, by: "Admissions broadcast" },
          ],
        }))
      );
      toast({
        title: "Announcement sent",
        description: `${recipients.length} applicant${recipients.length === 1 ? "" : "s"} received it on their timeline.`,
      });
      setBroadcastOpen(false);
      setBroadcastText("");
      onRefresh?.();
    } catch (error) {
      toast({ title: "Could not broadcast", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `${school.slug || "school"}-pipeline.csv`,
      filtered.map((a) => ({
        student: a.student_name,
        email: a.student_email,
        grade: a.grade_applying,
        status: STATUS_META[a.status]?.label || a.status,
        interview: a.interview_at ? new Date(a.interview_at).toLocaleString() : "",
        documents: (a.documents || []).length,
      })),
      [
        { key: "student", label: "Student" },
        { key: "email", label: "Email" },
        { key: "grade", label: "Year group" },
        { key: "status", label: "Status" },
        { key: "interview", label: "Interview" },
        { key: "documents", label: "Documents" },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants"
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All stages</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <Button variant="outline" onClick={() => setBroadcastOpen(true)} disabled={!applications.length}>
          <Megaphone className="mr-1.5 h-4 w-4" /> Announce
        </Button>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <FileDown className="mr-1.5 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Applicant</th>
              <th className="px-4 py-3 font-semibold">Year group</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Interview</th>
              <th className="px-4 py-3 font-semibold">Docs</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No applications match this view.
                </td>
              </tr>
            )}
            {filtered.map((app) => (
              <tr key={app.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{app.student_name}</p>
                  <p className="text-xs text-muted-foreground">{app.student_email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{app.grade_applying || "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[app.status]?.chip)}>
                    {STATUS_META[app.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {app.interview_at ? new Date(app.interview_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{(app.documents || []).length}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(app)}>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SchoolApplicationDialog
        application={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={() => onRefresh?.()}
      />

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast to applicants</DialogTitle>
            <DialogDescription>
              Sends a note to every active applicant's timeline — useful for open days or deadline reminders.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            maxLength={500}
            placeholder="Our spring open day is on 14 March. Reserve a place from your dashboard."
          />
          <Button onClick={broadcast} disabled={!broadcastText.trim() || sending}>
            {sending ? "Sending…" : "Send announcement"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}