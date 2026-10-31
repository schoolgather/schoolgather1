import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Sparkles,
  FileCheck2,
  MessagesSquare,
  CalendarCheck,
  ShieldCheck,
  Calculator,
  Building2,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SchoolCard from "@/components/schools/SchoolCard";
import { CURRICULA } from "@/lib/constants";

const STEPS = [
  { icon: Search, title: "Discover", copy: "Filter by curriculum, tuition and travel time from home." },
  { icon: Sparkles, title: "Match", copy: "A five-step quiz scores every school against your child." },
  { icon: FileCheck2, title: "Apply", copy: "One profile, private documents, reusable across schools." },
  { icon: CalendarCheck, title: "Track", copy: "Follow each stage from review to interview to offer." },
];

const SUITE = [
  { icon: Sparkles, title: "Compatibility matcher", copy: "Learning style, budget, interests and radius weighted into one score." },
  { icon: MessagesSquare, title: "Admissions messaging", copy: "Rate-limited, school-scoped threads with verified officers." },
  { icon: CalendarCheck, title: "Tour reservations", copy: "Reserve campus or virtual visits and keep them in one calendar." },
  { icon: Calculator, title: "Aid estimator", copy: "Model net tuition from income, household size and merit bands." },
  { icon: ShieldCheck, title: "Private documents", copy: "Transcripts stay behind signed access, visible only to that school." },
  { icon: Building2, title: "School analytics", copy: "Views, applications and pipeline exports for admissions teams." },
];

export default function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    base44.entities.School.filter({ status: "published" }, { sort: "-rating", limit: 3 })
      .then((page) => setSchools(page.items || []))
      .catch(() => setSchools([]));
    base44.entities.School.count({ status: "published" })
      .then(setTotal)
      .catch(() => setTotal(0));
  }, []);

  const search = (event) => {
    event.preventDefault();
    navigate(term.trim() ? `/schools?q=${encodeURIComponent(term.trim())}` : "/schools");
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/40">
        <div className="surface-grid absolute inset-0 opacity-40" />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-5 border-primary/15 bg-primary/10 text-primary hover:bg-primary/10">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Verified schools · secure documents
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Find the right school.
              <span className="block text-primary">Apply once.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              EduRoute brings the directory, the campus tours, the admissions conversation and the
              application pipeline into a single family account.
            </p>

            <form onSubmit={search} className="mt-7 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search schools, cities or programmes"
                  className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Search <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <strong className="font-semibold text-foreground">{total}</strong> published schools
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Multi-tenant admissions workspaces
              </span>
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Aid estimates before you apply
              </span>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80"
                alt="Students on a university campus"
                className="h-72 w-full object-cover sm:h-80"
              />
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                  { label: "Matched", value: "94%" },
                  { label: "Documents", value: "Private" },
                  { label: "Applications", value: "1 hub" },
                ].map((item) => (
                  <div key={item.label} className="px-4 py-4 text-center">
                    <p className="font-display text-xl font-semibold">{item.value}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -left-4 bottom-10 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-chart-3/15 text-chart-3">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Interview scheduled</p>
                  <p className="text-[11px] text-muted-foreground">Northbridge · 14 Nov, 10:00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Browse by curriculum</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every framework, one directory.</p>
          </div>
          <Link to="/schools" className="text-sm font-medium text-primary hover:underline">
            View all schools
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CURRICULA.map((c) => (
            <Link
              key={c}
              to={`/schools?curriculum=${encodeURIComponent(c)}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-card">
        <div className="container-page grid gap-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Step {index + 1}
              </span>
              <step.icon className="mt-3 h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="max-w-2xl text-2xl font-semibold sm:text-3xl">
          Everything an admissions journey needs — for families and for schools.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUITE.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <item.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-primary p-8 text-primary-foreground">
            <h3 className="font-display text-2xl font-semibold">For families</h3>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
              Build one student profile, then apply, message and book tours without re-entering a thing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/match">Take the matching quiz</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/schools">Explore the directory</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-secondary/60 p-8">
            <h3 className="font-display text-2xl font-semibold">For admissions teams</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Manage your school's profile, pipeline, interviews and announcements inside an isolated
              tenant workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/dashboard/school">Open school console</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin">Platform administration</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}