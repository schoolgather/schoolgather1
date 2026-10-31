import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME, BRAND_LOGO } from "@/lib/constants";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={BRAND_LOGO} alt={BRAND_NAME} className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-border" />
            <span className="font-display text-xl font-bold tracking-tight">{BRAND_NAME}</span>
          </Link>

          {Icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
