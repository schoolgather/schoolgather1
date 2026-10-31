import React, { useEffect, useState } from "react";
import { CalendarCheck, Clock, MapPin, Video } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import SignInPrompt from "@/components/common/SignInPrompt";
import { useSession } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export default function TourBookingDialog({ school, open, onOpenChange }) {
  const { user, email, isAuthenticated } = useSession();
  const { toast } = useToast();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    base44.entities.TourSlot.filter({ school_id: school.id }, { sort: "date", limit: 20 })
      .then((page) => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        setSlots((page.items || []).filter((s) => s.date >= today));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, school.id]);

  const reserve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await base44.entities.TourBooking.create({
        slot_id: selected.id,
        school_id: school.id,
        school_name: school.name,
        school_admin_emails: school.admin_emails || [],
        student_email: email,
        student_name: user?.full_name || email,
        date: selected.date,
        start_time: selected.start_time,
        mode: selected.mode,
        status: "CONFIRMED",
        notes,
      });
      await base44.entities.TourSlot.update(selected.id, {
        booked_count: (Number(selected.booked_count) || 0) + 1,
      }).catch(() => null);
      toast({
        title: "Tour requested",
        description: `${school.name} will confirm your ${selected.date} visit by message.`,
      });
      onOpenChange(false);
      setSelected(null);
      setNotes("");
    } catch (error) {
      toast({ title: "Could not reserve", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book a campus tour</DialogTitle>
          <DialogDescription>
            Choose a visiting slot at {school.name}. Admissions will confirm by message.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <SignInPrompt
            compact
            title="Sign in to reserve a tour"
            description="Tour bookings are tied to your student profile."
          />
        ) : loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No published tour slots right now. Message admissions to arrange a private visit.
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const active = selected?.id === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      {new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {slot.start_time} · {slot.duration_minutes || 45} min
                      </span>
                      <span className="flex items-center gap-1">
                        {slot.mode === "Virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {slot.mode}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.max(0, (Number(slot.capacity) || 6) - (Number(slot.booked_count) || 0))} places
                  </span>
                </button>
              );
            })}
            {selected && (
              <div className="pt-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Anything the admissions team should know?
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Accessibility needs, who is attending…"
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
        )}

        {isAuthenticated && slots.length > 0 && (
          <Button onClick={reserve} disabled={!selected || saving} className="w-full">
            {saving ? "Reserving…" : selected ? `Reserve ${selected.date} at ${selected.start_time}` : "Select a slot"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}