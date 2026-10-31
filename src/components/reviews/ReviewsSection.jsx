import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/reviews/StarRating";
import ReviewDialog from "@/components/reviews/ReviewDialog";
import { initialsOf } from "@/lib/permissions";

function DistributionBar({ stars, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="w-3 tabular-nums">{stars}</span>
      <Star className="h-3 w-3 fill-accent text-accent" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function ReviewsSection({ school, reviews = [], loading, onChanged, isAuthenticated, email, user, signIn }) {
  const [open, setOpen] = useState(false);

  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total : 0;
  const recommendPct = total
    ? Math.round((reviews.filter((r) => r.would_recommend).length / total) * 100)
    : 0;
  const myReview = email ? reviews.find((r) => String(r.student_email).toLowerCase() === email) : null;
  const ordered = [...reviews].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));

  const startWriting = () => {
    if (!isAuthenticated) return signIn();
    setOpen(true);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Family reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Honest perspectives from families who know {school.name}.
          </p>
        </div>
        <Button variant={myReview ? "outline" : "default"} onClick={startWriting}>
          <MessageSquarePlus className="mr-1.5 h-4 w-4" />
          {myReview ? "Edit your review" : "Write a review"}
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-xl bg-secondary" />
      ) : total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-8 text-center">
          <Star className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAuthenticated
              ? "Be the first family to share an experience with this school."
              : "Sign in to be the first to review this school."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 rounded-xl bg-secondary/50 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6">
              <p className="font-display text-4xl font-semibold">{average.toFixed(1)}</p>
              <StarRating value={average} className="mt-1 justify-center" />
              <p className="mt-1 text-xs text-muted-foreground">
                {total} review{total === 1 ? "" : "s"}
              </p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => (
                <DistributionBar
                  key={stars}
                  stars={stars}
                  count={reviews.filter((r) => Math.round(Number(r.rating)) === stars).length}
                  total={total}
                />
              ))}
              <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                {recommendPct}% of families would recommend this school
              </p>
            </div>
          </div>

          <ul className="mt-5 divide-y divide-border/70">
            {ordered.map((review) => (
              <li key={review.id} className="py-5 first:pt-0">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initialsOf(review.student_name, review.student_email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{review.student_name || "Family"}</p>
                      {review.relationship && (
                        <Badge variant="secondary" className="text-[10px] font-medium">{review.relationship}</Badge>
                      )}
                      {review.would_recommend && (
                        <span className="flex items-center gap-1 text-[11px] text-primary">
                          <ThumbsUp className="h-3 w-3" /> Recommends
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating value={review.rating} size="sm" />
                      {review.created_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_date).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
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
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!isAuthenticated && total > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          <Link to="/login" className="font-medium text-primary underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to add your own review.
        </p>
      )}

      <ReviewDialog
        school={school}
        open={open}
        onOpenChange={setOpen}
        existing={myReview}
        user={user}
        email={email}
        onSaved={onChanged}
      />
    </section>
  );
}