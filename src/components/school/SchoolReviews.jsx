import React, { useEffect, useState } from "react";
import { Trash2, ThumbsUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import StarRating from "@/components/reviews/StarRating";

export default function SchoolReviews({ school }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!school?.id) return;
    setLoading(true);
    base44.entities.Review.filter({ school_id: school.id }, { sort: "-created_date", limit: 100 })
      .then((page) => setReviews(page.items || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [school?.id]);

  const remove = async (review) => {
    try {
      await base44.entities.Review.delete(review.id);
      setReviews((current) => current.filter((r) => r.id !== review.id));
      toast({ title: "Review removed" });
    } catch (error) {
      toast({ title: "Could not remove review", description: error.message, variant: "destructive" });
    }
  };

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
    : 0;

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-secondary" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Family reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What families say publicly about {school.name}.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold">{average ? average.toFixed(1) : "—"}</p>
          <p className="text-xs text-muted-foreground">
            {reviews.length} review{reviews.length === 1 ? "" : "s"} ·{" "}
            {reviews.filter((r) => r.would_recommend).length} recommend
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Families can review your school from the public profile.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border/70">
          {reviews.map((review) => (
            <li key={review.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{review.student_name || review.student_email}</p>
                  {review.relationship && (
                    <Badge variant="secondary" className="text-[10px]">{review.relationship}</Badge>
                  )}
                  {review.would_recommend && <ThumbsUp className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating value={review.rating} size="sm" />
                  {review.created_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
                {review.body && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {review.body}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(review)}
                aria-label="Remove review"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}