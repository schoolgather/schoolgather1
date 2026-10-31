import { db } from "@/lib/db";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { CURRICULA } from "@/lib/constants";

const listToText = (list) => (list || []).join(", ");
const textToList = (text) =>
  String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function SchoolProfileEditor({ school, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: school.name || "",
    tagline: school.tagline || "",
    description: school.description || "",
    curriculum_type: school.curriculum_type || "IB",
    city: school.city || "",
    country: school.country || "",
    tuition_min: school.tuition_min || 0,
    tuition_max: school.tuition_max || 0,
    age_range: school.age_range || "",
    student_teacher_ratio: school.student_teacher_ratio || "",
    accreditation_details: school.accreditation_details || "",
    contact_email: school.contact_email || "",
    phone: school.phone || "",
    website: school.website || "",
    scholarship_available: Boolean(school.scholarship_available),
    merit_scholarship_pct: school.merit_scholarship_pct || 0,
    capacity: school.capacity || 0,
    programs: listToText(school.programs),
    facilities: listToText(school.facilities),
    extracurriculars: listToText(school.extracurriculars),
    learning_styles: listToText(school.learning_styles),
    languages: listToText(school.languages),
    cover_image_url: school.cover_image_url || "",
  });

  const patch = (data) => setForm((prev) => ({ ...prev, ...data }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tuition_min: Number(form.tuition_min) || 0,
        tuition_max: Number(form.tuition_max) || 0,
        merit_scholarship_pct: Number(form.merit_scholarship_pct) || 0,
        capacity: Number(form.capacity) || 0,
        programs: textToList(form.programs),
        facilities: textToList(form.facilities),
        extracurriculars: textToList(form.extracurriculars),
        learning_styles: textToList(form.learning_styles),
        languages: textToList(form.languages),
      };
      const updated = await db.entities.School.update(school.id, payload);
      toast({ title: "Profile updated", description: "Your public profile is live." });
      onSaved?.(updated);
    } catch (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="font-semibold">Public profile</h3>
        <p className="text-xs text-muted-foreground">This content appears in the directory and on your profile page.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">School name</Label>
          <Input id="name" value={form.name} onChange={(e) => patch({ name: e.target.value })} className="mt-1.5" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} className="mt-1.5" maxLength={140} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">About</Label>
          <Textarea id="description" rows={5} value={form.description} onChange={(e) => patch({ description: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="curriculum">Curriculum</Label>
          <select
            id="curriculum"
            value={form.curriculum_type}
            onChange={(e) => patch({ curriculum_type: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {CURRICULA.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="ratio">Class ratio</Label>
          <Input id="ratio" value={form.student_teacher_ratio} onChange={(e) => patch({ student_teacher_ratio: e.target.value })} className="mt-1.5" placeholder="1:12" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={(e) => patch({ city: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={form.country} onChange={(e) => patch({ country: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tuition_min">Tuition from</Label>
          <Input id="tuition_min" type="number" value={form.tuition_min} onChange={(e) => patch({ tuition_min: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tuition_max">Tuition to</Label>
          <Input id="tuition_max" type="number" value={form.tuition_max} onChange={(e) => patch({ tuition_max: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ages">Age range</Label>
          <Input id="ages" value={form.age_range} onChange={(e) => patch({ age_range: e.target.value })} className="mt-1.5" placeholder="4–18" />
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" value={form.capacity} onChange={(e) => patch({ capacity: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="accreditation">Accreditation</Label>
          <Textarea id="accreditation" rows={2} value={form.accreditation_details} onChange={(e) => patch({ accreditation_details: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="contact_email">Admissions email</Label>
          <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => patch({ contact_email: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={(e) => patch({ website: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cover">Cover image URL</Label>
          <Input id="cover" value={form.cover_image_url} onChange={(e) => patch({ cover_image_url: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="programs">Programmes (comma separated)</Label>
          <Input id="programs" value={form.programs} onChange={(e) => patch({ programs: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="facilities">Facilities (comma separated)</Label>
          <Input id="facilities" value={form.facilities} onChange={(e) => patch({ facilities: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="extracurriculars">Extracurriculars (comma separated)</Label>
          <Input id="extracurriculars" value={form.extracurriculars} onChange={(e) => patch({ extracurriculars: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="styles">Learning styles (comma separated)</Label>
          <Input id="styles" value={form.learning_styles} onChange={(e) => patch({ learning_styles: e.target.value })} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="languages">Languages (comma separated)</Label>
          <Input id="languages" value={form.languages} onChange={(e) => patch({ languages: e.target.value })} className="mt-1.5" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium">Offer scholarships</p>
            <p className="text-xs text-muted-foreground">Shown as a badge in the directory.</p>
          </div>
          <Switch checked={form.scholarship_available} onCheckedChange={(v) => patch({ scholarship_available: v })} />
        </div>
        {form.scholarship_available && (
          <div className="sm:col-span-2">
            <Label htmlFor="merit">Typical merit award · {form.merit_scholarship_pct}%</Label>
            <input
              id="merit"
              type="range"
              min={0}
              max={60}
              step={5}
              value={form.merit_scholarship_pct}
              onChange={(e) => patch({ merit_scholarship_pct: Number(e.target.value) })}
              className="mt-2 h-2 w-full accent-[hsl(var(--primary))]"
            />
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}