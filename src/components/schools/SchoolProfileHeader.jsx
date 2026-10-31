import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarCheck, ClipboardList, MapPin, MessagesSquare, Scale, Star } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tuitionRange } from "@/lib/geo";

export default function SchoolProfileHeader({
  school,
  saved,
  onToggleSave,
  onCompare,
  onApply,
  onMessage,
  onTour,
  comparing,
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        <Image src={school.cover_image_url} alt={school.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/85" />
      </div>
      <div className="container-page relative py-8 text-primary-foreground sm:py-12">
        <Link
          to="/schools"
          className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 transition hover:text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All schools
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-accent text-accent-foreground">{school.curriculum_type}</Badge>
              {school.scholarship_available && (
                <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
                  Scholarships available
                </Badge>
              )}
              {Number(school.rating) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {Number(school.rating).toFixed(1)} ({school.review_count || 0})
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-primary-foreground sm:text-4xl lg:text-5xl">
              {school.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {school.city}{school.country ? `, ${school.country}` : ""}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>{tuitionRange(school)}</span>
              <span className="hidden sm:inline">·</span>
              <span>{school.age_range || "All ages"}</span>
            </p>
            {school.tagline && (
              <p className="mt-3 max-w-xl text-primary-foreground/85">{school.tagline}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onApply} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ClipboardList className="mr-1.5 h-4 w-4" /> Apply now
            </Button>
            <Button variant="outline" onClick={onTour} className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <CalendarCheck className="mr-1.5 h-4 w-4" /> Book a tour
            </Button>
            <Button variant="outline" onClick={onMessage} className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <MessagesSquare className="mr-1.5 h-4 w-4" /> Message
            </Button>
            <Button variant="outline" onClick={onToggleSave} className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              {saved ? <BookmarkCheck className="mr-1.5 h-4 w-4" /> : <Bookmark className="mr-1.5 h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={onCompare}
              className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Scale className="mr-1.5 h-4 w-4" /> {comparing ? "In compare" : "Compare"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}