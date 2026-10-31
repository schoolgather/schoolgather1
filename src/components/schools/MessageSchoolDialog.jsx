import React, { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import SignInPrompt from "@/components/common/SignInPrompt";
import { useSession } from "@/lib/permissions";
import { startThread } from "@/lib/messaging";

export default function MessageSchoolDialog({ school, open, onOpenChange }) {
  const { user, email, isAuthenticated } = useSession();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await startThread({
        school,
        student: { email, name: user?.full_name || email },
        subject: subject.trim() || `Enquiry about ${school.name}`,
        content,
      });
      toast({
        title: "Message sent",
        description: `${school.name} admissions will reply in your dashboard.`,
      });
      setSubject("");
      setContent("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Could not send", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message admissions</DialogTitle>
          <DialogDescription>
            A private thread with the {school.name} admissions team. Replies appear in your dashboard.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <SignInPrompt
            compact
            title="Sign in to message admissions"
            description="Messaging is reserved for signed-in families."
          />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              maxLength={120}
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              maxLength={4000}
              placeholder="Introduce your child, ask about places, fees or support…"
            />
            <p className="text-xs text-muted-foreground">
              Please keep personal documents out of messages — upload them on your application instead.
            </p>
            <Button type="submit" disabled={saving || !content.trim()} className="w-full">
              <Send className="mr-2 h-4 w-4" /> {saving ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}