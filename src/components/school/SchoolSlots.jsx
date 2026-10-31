const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ToursPanel from "@/components/dashboard/ToursPanel";

export default function SchoolSlots({ school, slots, onRefresh }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    start_time: "10:00",
    duration_minutes: 45,
    capacity: 8,
    mode: "On campus",
    meeting_point: "Main reception",
  });

  const patch = (data) => setForm((prev) => ({ ...prev, ...data }));

  const create = async (event) => {
    event.preventDefault();
    if (!form.date) return;
    setSaving(true);
    try {
      await db.entities.TourSlot.create({
        school_id: school.id,
        school_name: school.name,
        school_admin_emails: school.admin_emails || [],
        date: form.date,
        start_time: form.start_time,
        duration_minutes: Number(form.duration_minutes) || 45,
        capacity: Number(form.capacity) || 8,
        booked_count: 0,
        mode: form.mode,
        meeting_point: form.meeting_point,
      });
      toast({ title: "Tour slot published", description: "It is now bookable from your public profile." });
      patch({ date: "" });
      onRefresh?.();
    } catch (error) {
      toast({ title: "Could not create slot", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slot) => {
    await db.entities.TourSlot.delete(slot.id);
    toast({ title: "Slot removed" });
    onRefresh?.();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <CalendarPlus className="h-4 w-4 text-primary" /> Publish a tour slot
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="time">Start</Label>
            <Input id="time" type="time" value={form.start_time} onChange={(e) => patch({ start_time: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="duration">Minutes</Label>
            <Input id="duration" type="number" min={15} step={15} value={form.duration_minutes} onChange={(e) => patch({ duration_minutes: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => patch({ capacity: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <select
              id="mode"
              value={form.mode}
              onChange={(e) => patch({ mode: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="On campus">On campus</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={saving || !form.date}>
          {saving ? "Publishing…" : "Publish slot"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card">
        <h3 className="border-b border-border/70 p-4 font-semibold">Published slots</h3>
        {slots.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No slots yet. Publish one above to open bookings.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {slots.map((slot) => (
              <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {slot.start_time}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {slot.mode} · {slot.duration_minutes || 45} min · {slot.booked_count || 0}/{slot.capacity || 8} booked
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(slot)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Booked visits</h3>
        <ToursPanel role="school_admin" />
      </div>
    </div>
  );
}