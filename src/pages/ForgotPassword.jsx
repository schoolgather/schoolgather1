import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { getSupabase } from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Check your email"
        subtitle={`We've sent password reset instructions to ${email}`}
        footer={
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive an email? Check your spam folder or try again with a different address.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      footer={
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10"
              autoFocus
            />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
