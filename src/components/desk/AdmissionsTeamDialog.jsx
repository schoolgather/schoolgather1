import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdmissionsTeamDialog({ school, onClose, onSave }) {
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmails((school?.admin_emails || []).join(", "));
  }, [school]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(school, emails);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(school)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admissions team · {school?.name}</DialogTitle>
          <DialogDescription>
            These emails get access to this school's applicants, pipeline and messages, and nothing else.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="admissions@school.edu, head@school.edu"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save admissions team"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
