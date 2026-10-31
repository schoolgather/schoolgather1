import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X, LayoutDashboard, ShieldCheck, LogOut, Search, Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CompareBar from "@/components/schools/CompareBar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useCompareStore } from "@/lib/store";
import { initialsOf, useSession } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BRAND_LOGO, BRAND_NAME, BRAND_TAGLINE } from "@/lib/constants";

const NAV = [
  { to: "/schools", label: "Discover Schools", icon: Search },
  { to: "/match", label: "2-Min Match Quiz", icon: Sparkles, badge: "Popular" },
  { to: "/compare", label: "Compare", icon: Scale },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src={BRAND_LOGO}
        alt={BRAND_NAME}
        className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-border/60"
      />
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-tight">{BRAND_NAME}</span>
        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {BRAND_TAGLINE}
        </span>
      </span>
    </Link>
  );
}

function AccountMenu() {
  const { user, email, isAuthenticated, isSuperAdmin, signIn, logout } = useSession();
  if (!isAuthenticated) {
    return (
      <Button size="sm" variant="outline" onClick={signIn} className="hidden sm:inline-flex">
        Sign in
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-3 text-sm transition hover:border-primary/40">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {initialsOf(user?.full_name, email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate sm:block">{user?.full_name || email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" /> My applications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/school">
            <GraduationCap className="mr-2 h-4 w-4" /> School console
          </Link>
        </DropdownMenuItem>
        {isSuperAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" /> Platform admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const count = useCompareStore((s) => s.schools.length);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Brand />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "relative rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                      isActive && "bg-secondary text-secondary-foreground"
                    )
                  }
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                  {item.to === "/compare" && count > 0 && (
                    <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                      {count}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/school"
              className="hidden text-xs font-semibold text-muted-foreground transition hover:text-primary lg:inline-block px-2"
            >
              School Portal
            </Link>
            <ThemeToggle />
            <AccountMenu />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/schools">Find Schools</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-background p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    pathname === item.to ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <LayoutDashboard className="h-4 w-4" /> My applications
              </Link>
              <Link
                to="/dashboard/school"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <GraduationCap className="h-4 w-4" /> School console
              </Link>
            </nav>
            <div className="mt-6">
              <AccountMenu />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <CompareBar />

      <footer className="mt-16 border-t border-border/70 bg-secondary/40">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One family profile, every school. Search, compare, visit and apply — without repeating
              yourself at every gate.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Students</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/schools" className="hover:text-primary">Browse directory</Link></li>
              <li><Link to="/match" className="hover:text-primary">Matching quiz</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Application tracker</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schools</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/dashboard/school" className="hover:text-primary">Admissions console</Link></li>
              <li><Link to="/dashboard/school" className="hover:text-primary">Applicant pipeline</Link></li>
              <li><Link to="/admin" className="hover:text-primary">Platform administration</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trust</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Documents are stored privately and only shared with the admissions team of the school you apply to.
            </p>
          </div>
        </div>
        <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME}. Made with care for families and schools.
        </div>
      </footer>
    </div>
  );
}