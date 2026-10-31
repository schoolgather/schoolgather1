import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import StarRating from "@/components/reviews/StarRating";

const RELATIONSHIPS = ["Parent", "Student", "Alumnus", "Prospective family"];

export default function ReviewDialog({ school, open, onOpenChange, existing, user, email, onSaved }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [recommend, setRecommend] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRating(existing?.rating || 0);
    setTitle(existing?.title || "");
    setBody(existing?.body || "");
    setRelationship(existing?.relationship || "Parent");
    setRecommend(existing ? Boolean(existing.would_recommend) : true);
  }, [open, existing]);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) {
      toast({ title: "Add a star rating", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        school_id: school.id,
        school_name: school.name,
        school_admin_emails: school.admin_emails || [],
        student_email: email,
        student_name: user?.full_name || email,
        rating,
        title: title.trim(),
        body: body.trim(),
        relationship,
        would_recommend: recommend,
      };
      if (existing?.id) {
        await base44.entities.Review.update(existing.id, payload);
      } else {
        await base44.entities.Review.create(payload);
      }
      toast({ title: existing ? "Review updated" : "Thanks for sharing your experience" });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast({ title: "Could not save your review", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit your review" : `Review ${school?.name || "school"}`}</DialogTitle>
          <DialogDescription>
            Share what families should know about the academics, community and admissions experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Your rating</Label>
            <StarRating value={rating} onChange={setRating} size="lg" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="review-title">Headline</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A welcoming, ambitious school"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="review-body">Your experience</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Teachers, class sizes, community, support… what stood out?"
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>I am a</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <Label htmlFor="recommend" className="text-sm">Would recommend</Label>
              <Switch id="recommend" checked={recommend} onCheckedChange={setRecommend} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Publish review"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}