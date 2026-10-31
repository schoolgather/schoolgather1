import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRICULA } from "@/lib/constants";

const EMPTY_FORM = {
  name: "",
  curriculum_type: "IB",
  city: "",
  country: "",
  contact_email: "",
  admin_emails: "",
  tuition_min: "",
  tuition_max: "",
};

export default function AddSchoolDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const patch = (data) => setForm((prev) => ({ ...prev, ...data }));

  const handleOpenChange = (next) => {
    if (!next) setForm(EMPTY_FORM);
    onOpenChange(next);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await onSubmit(form);
      if (saved) {
        setForm(EMPTY_FORM);
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a school</DialogTitle>
          <DialogDescription>The school appears in the directory as soon as it is published.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="desk-name">School name</Label>
            <Input id="desk-name" className="mt-1.5" required value={form.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="desk-curriculum">Curriculum</Label>
              <select
                id="desk-curriculum"
                value={form.curriculum_type}
                onChange={(e) => patch({ curriculum_type: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {CURRICULA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="desk-contact">Admissions email</Label>
              <Input id="desk-contact" type="email" className="mt-1.5" value={form.contact_email} onChange={(e) => patch({ contact_email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="desk-city">City</Label>
              <Input id="desk-city" className="mt-1.5" value={form.city} onChange={(e) => patch({ city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="desk-country">Country</Label>
              <Input id="desk-country" className="mt-1.5" value={form.country} onChange={(e) => patch({ country: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="desk-tmin">Tuition from</Label>
              <Input id="desk-tmin" type="number" min="0" className="mt-1.5" value={form.tuition_min} onChange={(e) => patch({ tuition_min: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="desk-tmax">Tuition to</Label>
              <Input id="desk-tmax" type="number" min="0" className="mt-1.5" value={form.tuition_max} onChange={(e) => patch({ tuition_max: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="desk-admins">Admissions officer emails (comma separated)</Label>
            <Input
              id="desk-admins"
              className="mt-1.5"
              placeholder="admissions@school.edu"
              value={form.admin_emails}
              onChange={(e) => patch({ admin_emails: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding school…" : "Add school"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
