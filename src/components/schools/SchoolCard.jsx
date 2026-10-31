import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Check, Plus, GraduationCap, Sparkles } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/lib/store";
import { formatDistance, tuitionRange } from "@/lib/geo";
import { cn } from "@/lib/utils";

export default function SchoolCard({ school, distanceKm, matchScore }) {
  const toggle = useCompareStore((s) => s.toggle);
  const selected = useCompareStore((s) => s.schools.some((s2) => s2.id === school.id));
  const selectedCount = useCompareStore((s) => s.schools.length);
  const isFull = selectedCount >= 4 && !selected;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <Link to={`/schools/${school.id}`}>
          <Image
            src={school.cover_image_url}
            alt={school.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="border-0 bg-background text-[11px] font-semibold text-foreground">
            {school.curriculum_type}
          </Badge>
          {school.scholarship_available && (
            <Badge className="border-0 bg-accent text-[11px] font-semibold text-accent-foreground">
              Scholarships
            </Badge>
          )}
        </div>
        {typeof matchScore === "number" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow">
            <Sparkles className="h-3 w-3" /> {matchScore}% match
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/schools/${school.id}`}>
              <h3 className="truncate text-base font-semibold leading-tight hover:text-primary">{school.name}</h3>
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{school.city}{school.country ? `, ${school.country}` : ""}</span>
              {distanceKm !== null && distanceKm !== undefined && (
                <span className="shrink-0 text-foreground/60">· {formatDistance(distanceKm)}</span>
              )}
            </p>
          </div>
          {Number(school.rating) > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {Number(school.rating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {school.tagline || school.description}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between border-t border-border/70 pt-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tuition</p>
              <p className="text-sm font-semibold">{tuitionRange(school)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ages</p>
              <p className="text-sm font-semibold">{school.age_range || "All ages"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link to={`/schools/${school.id}`}>
                <GraduationCap className="mr-1.5 h-4 w-4" /> View school
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selected ? "secondary" : "outline"}
              disabled={isFull}
              onClick={() => toggle(school)}
              title={isFull ? "You can compare up to 4 schools" : "Add to comparison"}
              className={cn("shrink-0", selected && "border-primary/30 text-primary")}
            >
              {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}