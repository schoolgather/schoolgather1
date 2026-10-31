import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusTimeline from "@/components/applications/StatusTimeline";
import { STATUS_META } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ApplicationDetailDialog({ application, open, onOpenChange, onWithdrawn }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  if (!application) return null;

  const openDocument = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_uri,
        expires_in: 300,
      });
      window.open(signed_url, "_blank", "noopener");
    } catch (error) {
      toast({ title: "Could not open document", description: error.message, variant: "destructive" });
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await base44.entities.Application.delete(application.id);
      toast({ title: "Application withdrawn" });
      onOpenChange(false);
      onWithdrawn?.();
    } catch (error) {
      toast({ title: "Could not withdraw", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application.school_name}</DialogTitle>
          <DialogDescription>
            {application.grade_applying || "Year group TBC"} · {application.academic_year}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[application.status]?.chip)}>
            {STATUS_META[application.status]?.label}
          </span>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link to={`/schools/${application.school_id}`}>View school</Link>
          </Button>
        </div>

        {application.interview_at && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
            <p className="font-semibold">Interview scheduled</p>
            <p className="text-muted-foreground">{new Date(application.interview_at).toLocaleString()}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progress</h3>
          <div className="mt-3">
            <StatusTimeline timeline={application.timeline || []} currentStatus={application.status} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Documents ({application.documents?.length || 0})
          </h3>
          {application.documents?.length ? (
            <ul className="mt-2 divide-y divide-border/70 rounded-xl border border-border">
              {application.documents.map((doc, index) => (
                <li key={`${doc.file_uri}-${index}`} className="flex items-center justify-between gap-3 p-2.5">
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
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No documents attached.</p>
          )}
        </div>

        {application.personal_statement && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Statement</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{application.personal_statement}</p>
          </div>
        )}

        {application.decision_note && (
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Note from the school</p>
            <p className="mt-1 text-sm">{application.decision_note}</p>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={withdraw} disabled={busy} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Withdraw
          </Button>
          <Button asChild size="sm">
            <Link to={`/apply/${application.school_id}`}>Open application</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}