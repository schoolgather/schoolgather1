import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarCheck, GraduationCap, Mail, Phone, Globe, Users, Languages, Trophy, Sparkles, Images } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SchoolProfileHeader from "@/components/schools/SchoolProfileHeader";
import FeeScheduleCard from "@/components/schools/FeeScheduleCard";
import AidCalculator from "@/components/schools/AidCalculator";
import TourBookingDialog from "@/components/schools/TourBookingDialog";
import MessageSchoolDialog from "@/components/schools/MessageSchoolDialog";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCompareStore } from "@/lib/store";
import { useSession } from "@/lib/permissions";
import { tuitionRange } from "@/lib/geo";

function ChipList({ items, icon: Icon }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Not published yet.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm">
          {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function SchoolProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { email, user, isAuthenticated, signIn } = useSession();
  const toggleCompare = useCompareStore((s) => s.toggle);
  const comparing = useCompareStore((s) => s.schools.some((s2) => s2.id === id));

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  const loadReviews = () => {
    setReviewsLoading(true);
    base44.entities.Review.filter({ school_id: id }, { sort: "-created_date", limit: 100 })
      .then((page) => setReviews(page.items || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  };

  useEffect(loadReviews, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    base44.entities.School.get(id)
      .then((record) => {
        if (!active) return;
        setSchool(record);
        base44.entities.ProfileView.create({
          school_id: record.id,
          school_admin_emails: record.admin_emails || [],
          page: "profile",
        }).catch(() => null);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));

    base44.entities.TourSlot.filter({ school_id: id }, { sort: "date", limit: 6 })
      .then((page) => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        setSlots((page.items || []).filter((s) => s.date >= today).slice(0, 3));
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!email || !id) return;
    let active = true;
    base44.entities.Bookmark.filter({ user_email: email, school_id: id }, { limit: 1 })
      .then((page) => {
        if (!active) return;
        const found = page.items?.[0];
        setSaved(Boolean(found));
        setBookmarkId(found?.id || null);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [email, id]);

  useEffect(() => {
    if (!notFound) return;
    const meta = document.createElement("meta");
    meta.name = "prerender-status-code";
    meta.content = "404";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [notFound]);

  const toggleSave = async () => {
    if (!isAuthenticated) return signIn();
    try {
      if (saved && bookmarkId) {
        await base44.entities.Bookmark.delete(bookmarkId);
        setSaved(false);
        setBookmarkId(null);
        toast({ title: "Removed from saved schools" });
      } else {
        const record = await base44.entities.Bookmark.create({
          user_email: email,
          school_id: school.id,
          school_name: school.name,
          school_slug: school.slug,
          city: school.city,
          curriculum_type: school.curriculum_type,
          tuition_min: school.tuition_min,
          tuition_max: school.tuition_max,
          logo_url: school.logo_url,
        });
        setBookmarkId(record.id);
        setSaved(true);
        toast({ title: "Saved", description: `${school.name} is in your dashboard.` });
      }
    } catch (error) {
      toast({ title: "Could not update saved schools", description: error.message, variant: "destructive" });
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) return signIn();
    base44.entities.ProfileView.create({
      school_id: school.id,
      school_admin_emails: school.admin_emails || [],
      page: "apply",
    }).catch(() => null);
    navigate(`/apply/${school.id}`);
  };

  const handleCompare = () => {
    const result = toggleCompare(school);
    if (result?.full) {
      toast({
        title: "Comparison is full",
        description: "You can compare up to 4 schools. Remove one to add another.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-secondary lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (notFound || !school) {
    return (
      <div className="container-page py-24 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">School not found</h1>
        <p className="mt-2 text-muted-foreground">This profile may have been unpublished.</p>
        <Button asChild className="mt-6"><Link to="/schools">Back to directory</Link></Button>
      </div>
    );
  }

  const ratingValue = reviews.length
    ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
    : Number(school.rating) || 0;
  const schoolWithRating = {
    ...school,
    rating: ratingValue,
    review_count: reviews.length || school.review_count || 0,
  };

  return (
    <div className="pb-16">
      <SchoolProfileHeader
        school={schoolWithRating}
        saved={saved}
        onToggleSave={toggleSave}
        onCompare={handleCompare}
        onApply={handleApply}
        onMessage={() => (isAuthenticated ? setDialog("message") : signIn())}
        onTour={() => (isAuthenticated ? setDialog("tour") : signIn())}
        comparing={comparing}
      />

      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">About {school.name}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {school.description || "This school has not published a description yet."}
            </p>
            {school.highlights?.length > 0 && (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {school.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Programmes</h3>
              <div className="mt-3"><ChipList items={school.programs} /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Extracurriculars</h3>
              <div className="mt-3"><ChipList items={school.extracurriculars} icon={Trophy} /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Facilities</h3>
              <div className="mt-3"><ChipList items={school.facilities} /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Learning support</h3>
              <div className="mt-3"><ChipList items={school.support_services} /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Accreditation</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {school.accreditation_details || "Accreditation details are provided during the admissions process."}
            </p>
          </section>

          {school.gallery?.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4 text-primary" />
                <h2 className="text-xl font-semibold">Campus gallery</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {school.gallery.map((src, index) => (
                  <div key={`${src}-${index}`} className="aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                    <Image src={src} alt={`${school.name} campus ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <ReviewsSection
            school={school}
            reviews={reviews}
            loading={reviewsLoading}
            onChanged={loadReviews}
            isAuthenticated={isAuthenticated}
            email={email}
            user={user}
            signIn={signIn}
          />

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Upcoming tours</h2>
            {slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No published slots. Message admissions to arrange a private visit.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border/70">
                {slots.map((slot) => (
                  <li key={slot.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot.start_time} · {slot.duration_minutes || 45} min · {slot.mode}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => (isAuthenticated ? setDialog("tour") : signIn())}>
                      <CalendarCheck className="mr-1.5 h-3.5 w-3.5" /> Reserve
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">At a glance</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4" /> Ages</dt>
                <dd className="font-medium">{school.age_range || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Class ratio</dt>
                <dd className="font-medium">{school.student_teacher_ratio || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground"><Languages className="h-4 w-4" /> Languages</dt>
                <dd className="max-w-[55%] text-right font-medium">{(school.languages || []).join(", ") || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Capacity</dt>
                <dd className="font-medium">{school.capacity || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Founded</dt>
                <dd className="font-medium">{school.founded_year || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <dt className="text-muted-foreground">Annual tuition</dt>
                <dd className="font-semibold">{tuitionRange(school)}</dd>
              </div>
            </dl>
          </div>

          <FeeScheduleCard school={school} isAuthenticated={isAuthenticated} onSignIn={signIn} />

          <AidCalculator school={school} />

          <div className="rounded-2xl border border-border bg-secondary/50 p-5">
            <h3 className="text-base font-semibold">Admissions contact</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {school.contact_email && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {school.contact_email}
                </li>
              )}
              {school.phone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {school.phone}
                </li>
              )}
              {school.website && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" /> {school.website}
                </li>
              )}
            </ul>
            <Button className="mt-4 w-full" onClick={() => (isAuthenticated ? setDialog("message") : signIn())}>
              Message admissions
            </Button>
          </div>
        </aside>
      </div>

      <TourBookingDialog school={school} open={dialog === "tour"} onOpenChange={(v) => setDialog(v ? "tour" : null)} />
      <MessageSchoolDialog school={school} open={dialog === "message"} onOpenChange={(v) => setDialog(v ? "message" : null)} />
    </div>
  );
}