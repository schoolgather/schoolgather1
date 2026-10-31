import React from "react";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/permissions";

export default function SignInPrompt({ title, description, compact = false }) {
  const { signIn, isLoadingAuth } = useSession();
  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3"
          : "mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm"
      }
    >
      <div className={compact ? "flex items-center gap-3" : "flex flex-col items-center"}>
        <span className={compact ? "grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary" : "mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"}>
          <Lock className="h-5 w-5" />
        </span>
        <div className={compact ? "" : "space-y-2"}>
          <p className="font-semibold">{title || "Sign in to continue"}</p>
          <p className="text-sm text-muted-foreground">
            {description || "Create a free School Gather account to save schools, chat with admissions and apply."}
          </p>
        </div>
      </div>
      <Button size={compact ? "sm" : "default"} onClick={signIn} disabled={isLoadingAuth} className={compact ? "" : "mt-6"}>
        Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}