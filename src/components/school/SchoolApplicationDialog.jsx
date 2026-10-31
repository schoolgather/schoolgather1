import { db } from "@/lib/db";

import React, { useState } from "react";
import { FileText, Download } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import StatusTimeline from "@/components/applications/StatusTimeline";
import { APPLICATION_STATUSES, STATUS_META } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function SchoolApplicationDialog({ application, open, onOpenChange, onUpdated }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(application?.status || "SUBMITTED");
  const [interviewAt, setInterviewAt] = useState(application?.interview_at?.slice(0, 16) || "");
  const [note, setNote] = useState(application?.decision_note || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!application) return;
    setStatus(application.status);
    setInterviewAt(application.interview_at ? application.interview_at.slice(0, 16) : "");
    setNote(application.decision_note || "");
    setMessage("");
  }, [application]);

  if (!application) return null;

  const openDocument = async (doc) => {
    try {
      const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_uri,
        expires_in: 300,
      });
      window.open(signed_url, "_blank", "noopener");
    } catch (error) {
      toast({ title: "Could not open document", description: error.message, variant: "destructive" });
    }
  };

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const changed = status !== application.status;
    const entry = {
      status,
      note:
        message.trim() ||
        (changed ? `Moved to ${STATUS_META[status]?.label || status}` : "Application updated"),
      at: now,
      by: "Admissions",
    };
    try {
      const updated = await db.entities.Application.update(application.id, {
        status,
        interview_at: interviewAt ? new Date(interviewAt).toISOString() : null,
        decision_note: note,
        timeline: [...(application.timeline || []), entry],
      });
      toast({ title: "Application updated", description: `${application.student_name} · ${STATUS_META[status]?.label}` });
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application.student_name}</DialogTitle>
          <DialogDescription>
            {application.grade_applying || "Year group TBC"} · {application.academic_year} · {application.student_email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Guardian</p>
            <p className="mt-1 font-medium">{application.guardian_name || "—"}</p>
            <p className="text-xs text-muted-foreground">{application.guardian_email}</p>
            <p className="text-xs text-muted-foreground">{application.guardian_phone}</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current status</p>
            <span className={cn("mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[application.status]?.chip)}>
              {STATUS_META[application.status]?.label}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {application.answers?.learning_support && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Learning support</p>
            <p className="mt-1 text-sm">{application.answers.learning_support}</p>
          </div>
        )}
        {application.personal_statement && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Personal statement</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{application.personal_statement}</p>
          </div>
        )}

        {application.documents?.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Documents</p>
            <ul className="mt-2 divide-y divide-border/70 rounded-xl border border-border">
              {application.documents.map((doc, index) => (
                <li key={`${doc.file_uri}-${index}`} className="flex items-center justify-between gap-2 p-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.kind}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openDocument(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">Move to stage</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="interview">Interview date & time</Label>
              <input
                id="interview"
                type="datetime-local"
                value={interviewAt}
                onChange={(e) => setInterviewAt(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="decision">Private decision note</Label>
            <Textarea id="decision" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="message">Note for the family (added to the timeline)</Label>
            <Textarea
              id="message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. We would love to meet you on campus on 14 November."
            />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Timeline</p>
          <div className="mt-2">
            <StatusTimeline timeline={application.timeline || []} currentStatus={application.status} />
          </div>
        </div>

        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Update application"}</Button>
      </DialogContent>
    </Dialog>
  );
}