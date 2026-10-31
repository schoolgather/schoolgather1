import { db } from "@/lib/db";

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
  CheckCircle2,
  GraduationCap,
  Scale,
  Compass,
} from "lucide-react";

import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SchoolCard from "@/components/schools/SchoolCard";
import { CURRICULA } from "@/lib/constants";
import { SAMPLE_SCHOOLS } from "@/lib/sampleSchools";

const STEPS = [
  {
    step: "1",
    title: "Discover & Filter",
    copy: "Search verified schools by curriculum (IB, British, American), tuition, and location.",
    icon: Search,
  },
  {
    step: "2",
    title: "2-Min Match Quiz",
    copy: "Our smart compatibility quiz scores every school against your child's learning style.",
    icon: Sparkles,
  },
  {
    step: "3",
    title: "Apply in 1 Click",
    copy: "Build one student profile with private transcripts, accepted across all partner schools.",
    icon: FileCheck2,
  },
  {
    step: "4",
    title: "Track & Tour",
    copy: "Book campus visits, message admissions directly, and follow offers in real-time.",
    icon: CalendarCheck,
  },
];

const SUITE = [
  { icon: Sparkles, title: "Compatibility matcher", copy: "Learning style, budget, interests and radius weighted into one score." },
  { icon: MessagesSquare, title: "Admissions messaging", copy: "Rate-limited, school-scoped threads with verified admissions officers." },
  { icon: CalendarCheck, title: "Tour reservations", copy: "Reserve campus or virtual visits and keep them in one consolidated calendar." },
  { icon: Calculator, title: "Aid estimator", copy: "Model net tuition from income, household size and available merit bands." },
  { icon: ShieldCheck, title: "Private documents", copy: "Transcripts stay behind encrypted access, visible only to that specific school." },
  { icon: Building2, title: "School analytics", copy: "Application tracking, interview scheduling and pipeline exports for teams." },
];

export default function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [curriculum, setCurriculum] = useState("Any");
  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    db.entities.School.filter({ status: "published" }, { sort: "-rating", limit: 3 })
      .then((page) => {
        if (!active) return;
        const items = page.items && page.items.length > 0 ? page.items : SAMPLE_SCHOOLS.slice(0, 3);
        setSchools(items);
      })
      .catch(() => {
        if (active) setSchools(SAMPLE_SCHOOLS.slice(0, 3));
      });

    db.entities.School.count({ status: "published" })
      .then((count) => {
        if (!active) return;
        setTotal(count > 0 ? count : SAMPLE_SCHOOLS.length);
      })
      .catch(() => {
        if (active) setTotal(SAMPLE_SCHOOLS.length);
      });

    return () => {
      active = false;
    };
  }, []);

  const search = (event) => {
    if (event) event.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (curriculum !== "Any") params.set("curriculum", curriculum);
    navigate(`/schools${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div>
      {/* 3-Second Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-secondary">
        <div className="surface-grid absolute inset-0 opacity-40" />
        <div className="container-page relative py-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" /> 1 Unified Profile · 100% Free for Families
              </div>

              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                Find the right school.
                <span className="block text-primary">Apply in one click.</span>
              </h1>

              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Search verified international & private schools, get instant compatibility scores with a
                2-minute quiz, and submit private applications without repeating paperwork.
              </p>

              {/* Instant Search Bar with Fast Curriculum Selector */}
              <form onSubmit={search} className="mt-7 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="School name, city, or specialty..."
                    className="h-11 w-full rounded-xl bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                  />
                </div>

                <div className="sm:w-44 border-t border-border sm:border-t-0 sm:border-l sm:pl-2">
                  <select
                    value={curriculum}
                    onChange={(e) => setCurriculum(e.target.value)}
                    className="h-11 w-full rounded-xl bg-transparent px-3 text-sm font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="Any">All Curricula</option>
                    {CURRICULA.map((c) => (
                      <option key={c} value={c}>{c} Curriculum</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" size="lg" className="h-11 px-6 shadow-sm">
                  Search <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </form>

              {/* Quick Filter Shortcut Pills */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Popular:</span>
                <Link
                  to="/schools?curriculum=IB"
                  className="rounded-full bg-secondary px-2.5 py-1 transition hover:bg-primary/10 hover:text-primary"
                >
                  IB World
                </Link>
                <Link
                  to="/schools?curriculum=British"
                  className="rounded-full bg-secondary px-2.5 py-1 transition hover:bg-primary/10 hover:text-primary"
                >
                  British (IGCSE)
                </Link>
                <Link
                  to="/schools?curriculum=American"
                  className="rounded-full bg-secondary px-2.5 py-1 transition hover:bg-primary/10 hover:text-primary"
                >
                  American (AP)
                </Link>
                <Link
                  to="/match"
                  className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 font-semibold text-accent-foreground transition hover:bg-accent/30"
                >
                  <Sparkles className="h-3 w-3 text-primary" /> Take Match Quiz
                </Link>
              </div>

              {/* Instant Trust Points */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  <strong>{total}+</strong> Published Schools
                </span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  Private Transcripts
                </span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  Instant Aid Estimates
                </span>
              </div>
            </motion.div>

            {/* Visual Hero Feature Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80"
                    alt="Students collaborating on campus"
                    className="h-72 w-full object-cover sm:h-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs uppercase tracking-wider text-accent font-semibold">Live Preview</p>
                    <p className="text-lg font-bold">1 Form. Multiple Schools. Zero Hassle.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card">
                  {[
                    { label: "Match Fit", value: "98%" },
                    { label: "Transcripts", value: "Encrypted" },
                    { label: "Application", value: "1 Hub" },
                  ].map((item) => (
                    <div key={item.label} className="px-4 py-4 text-center">
                      <p className="font-display text-xl font-bold text-foreground">{item.value}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Quick Action Card */}
              <div className="absolute -left-4 -bottom-6 hidden rounded-2xl border border-border bg-card p-3.5 shadow-xl sm:flex sm:items-center sm:gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-chart-3/15 text-chart-3">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Matched 98% Compatibility</p>
                  <p className="text-[11px] text-muted-foreground">Oakwood International Academy</p>
                </div>
                <Button asChild size="sm" className="ml-2 h-8 text-xs">
                  <Link to="/match">Try Quiz</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3-Second Understanding: How It Works in 4 Simple Steps */}
      <section className="border-b border-border/70 bg-card py-14">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold sm:text-3xl">How School Gather Works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to go from researching schools to getting accepted.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-border bg-secondary/30 p-5 transition hover:border-primary/40 hover:bg-card hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {step.step}
                  </span>
                  <step.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Schools Section */}
      <section className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">Top Rated</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">Featured Schools</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore leading institutions offering IB, British, and American curricula.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/schools">View all schools <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Quick Curriculum Bar */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CURRICULA.map((c) => (
            <Link
              key={c}
              to={`/schools?curriculum=${encodeURIComponent(c)}`}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:text-primary"
            >
              {c} Curriculum
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      </section>

      {/* Feature Suite Section */}
      <section className="border-y border-border/70 bg-secondary/30 py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Everything an admissions journey needs.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Built to save families countless hours and give admissions officers qualified applicants.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUITE.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-base font-bold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Split Callout: Parents vs Admissions */}
      <section className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* For Families */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-primary p-8 text-primary-foreground shadow-lg">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                <GraduationCap className="h-3.5 w-3.5" /> For Families & Students
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold">
                Find the right school without the paperwork headache.
              </h3>
              <p className="mt-2 text-sm text-primary-foreground/80 leading-relaxed">
                Take the 2-minute quiz, compare schools side by side, and apply with a single reusable student profile.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/match">
                  <Sparkles className="mr-1.5 h-4 w-4" /> Take Match Quiz
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/schools">Explore Directory</Link>
              </Button>
            </div>
          </div>

          {/* For Admissions */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-lg">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary" /> For Admissions Teams
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                Manage inquiries, tours & applications in one workspace.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Publish your curriculum, set tour booking slots, review verified student transcripts, and export pipeline analytics.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/dashboard/school">Open School Console</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin">Platform Admin</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
