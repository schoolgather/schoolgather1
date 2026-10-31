import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Clock, MapPin, Video, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/permissions";

export default function ToursPanel({ role = "student" }) {
  const { email } = useSession();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!email) return;
    setLoading(true);
    const query = role === "student" ? { student_email: email } : { school_admin_emails: email };
    base44.entities.TourBooking.filter(query, { sort: "date", limit: 60 })
      .then((page) => setBookings(page.items || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [email, role]);

  const cancel = async (booking) => {
    await base44.entities.TourBooking.update(booking.id, { status: "CANCELLED" });
    toast({ title: "Tour cancelled" });
    load();
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;

  if (!bookings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No tours booked</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "student"
            ? "Book a campus visit from any school profile."
            : "Families booking visits to your campus will show up here."}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border bg-card">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold">
              {role === "student" ? booking.school_name : booking.student_name || booking.student_email}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                {new Date(`${booking.date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {booking.start_time}</span>
              <span className="flex items-center gap-1">
                {booking.mode === "Virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {booking.mode}
              </span>
            </p>
            {booking.notes && <p className="mt-1 text-xs text-muted-foreground">“{booking.notes}”</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                booking.status === "CANCELLED"
                  ? "border-0 bg-destructive/10 text-destructive"
                  : "border-0 bg-chart-3/15 text-chart-3"
              }
            >
              {booking.status}
            </Badge>
            {booking.status === "CONFIRMED" && (
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => cancel(booking)}>
                <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
            )}
            {role === "student" && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/schools/${booking.school_id}`}>School</Link>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}