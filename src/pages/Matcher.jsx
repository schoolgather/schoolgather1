import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, LocateFixed, Sparkles, RotateCcw, Scale } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CURRICULA, GRADES, INTERESTS, LEARNING_STYLES } from "@/lib/constants";
import { rankSchools } from "@/lib/scoring";
import { requestOrigin, formatMoney, formatDistance, tuitionRange } from "@/lib/geo";
import { useCompareStore } from "@/lib/store";
import { useSession } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Learning style", "Interests", "Budget & distance", "Matches"];

function ScoreRing({ score }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={radius} className="stroke-secondary" strokeWidth="7" fill="none" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="stroke-primary transition-all duration-700"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold">{score}%</span>
    </div>
  );
}

function ToggleChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition",
        active ? "border-primary bg-primary/5 font-medium text-primary" : "border-border hover:border-primary/40"
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 place-items-center rounded-full border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
        )}
      >
        {active && <Check className="h-2.5 w-2.5" />}
      </span>
      {children}
    </button>
  );
}

export default function Matcher() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { email, isAuthenticated } = useSession();
  const toggleCompare = useCompareStore((s) => s.toggle);
  const [schools, setSchools] = useState([]);
  const [step, setStep] = useState(0);
  const [locating, setLocating] = useState(false);
  const [answers, setAnswers] = useState({
    curriculum: "Any",
    grade: "",
    learningStyles: [],
    interests: [],
    budget: 20000,
    radiusKm: 25,
    origin: null,
  });

  useEffect(() => {
    base44.entities.School.filter({ status: "published" }, { limit: 200 })
      .then((page) => setSchools(page.items || []))
      .catch(() => setSchools([]));
  }, []);

  const ranked = useMemo(() => (step === 4 ? rankSchools(schools, answers).slice(0, 6) : []), [step, schools, answers]);

  const patch = (data) => setAnswers((prev) => ({ ...prev, ...data }));

  const toggleList = (key, value, max) => {
    const list = answers[key];
    if (list.includes(value)) return patch({ [key]: list.filter((v) => v !== value) });
    if (list.length >= max) {
      toast({ title: `Pick up to ${max}`, description: "Deselect one to choose another.", variant: "destructive" });
      return;
    }
    patch({ [key]: [...list, value] });
  };

  const useLocation = async () => {
    setLocating(true);
    try {
      const coords = await requestOrigin();
      patch({ origin: coords });
      toast({ title: "Location added", description: "Distance now counts towards every match score." });
    } catch (error) {
      toast({ title: "Location unavailable", description: error.message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const finish = async () => {
    setStep(4);
    const results = rankSchools(schools, answers).slice(0, 10);
    if (isAuthenticated && email) {
      try {
        await base44.entities.MatchProfile.create({
          user_email: email,
          answers,
          results: results.map((r) => ({ school_id: r.schoolId, score: r.score })),
        });
      } catch {
        // non-blocking: results are still shown
      }
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({
      curriculum: "Any",
      grade: "",
      learningStyles: [],
      interests: [],
      budget: 20000,
      radiusKm: 25,
      origin: null,
    });
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <Badge className="border-primary/15 bg-primary/10 text-primary hover:bg-primary/10">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> School matcher
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Find the schools that fit your child</h1>
        <p className="mt-2 text-muted-foreground">
          Four short questions, then a compatibility score for every published school — with the reasoning
          behind each number.
        </p>

        <div className="mt-7 flex items-center gap-1.5">
          {STEPS.map((label, index) => (
            <div key={label} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition",
                  index <= step ? "bg-primary" : "bg-secondary"
                )}
              />
              <p className={cn("mt-1.5 text-[10px] uppercase tracking-wider", index === step ? "text-primary" : "text-muted-foreground")}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Who are we matching?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Pick a starting grade and preferred framework.</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Year group</p>
                    <div className="flex flex-wrap gap-2">
                      {GRADES.map((grade) => (
                        <ToggleChip key={grade} active={answers.grade === grade} onClick={() => patch({ grade })}>
                          {grade}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Curriculum preference</p>
                    <div className="flex flex-wrap gap-2">
                      {["Any", ...CURRICULA].map((c) => (
                        <ToggleChip key={c} active={answers.curriculum === c} onClick={() => patch({ curriculum: c })}>
                          {c === "Any" ? "Open to any" : c}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">How does your child learn best?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Choose up to three environments.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LEARNING_STYLES.map((style) => (
                      <ToggleChip
                        key={style}
                        active={answers.learningStyles.includes(style)}
                        onClick={() => toggleList("learningStyles", style, 3)}
                      >
                        {style}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">What do they love doing?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Choose up to four interests.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERESTS.map((interest) => (
                      <ToggleChip
                        key={interest}
                        active={answers.interests.includes(interest)}
                        onClick={() => toggleList("interests", interest, 4)}
                      >
                        {interest}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Budget and travel</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Rough numbers are enough — this only weights the ranking.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium">
                      Annual tuition budget · {formatMoney(answers.budget)}
                    </p>
                    <input
                      type="range"
                      min={2000}
                      max={45000}
                      step={500}
                      value={answers.budget}
                      onChange={(e) => patch({ budget: Number(e.target.value) })}
                      className="h-2 w-full accent-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium">
                      Maximum journey · {answers.radiusKm} km
                      {!answers.origin && <span className="text-muted-foreground"> (add location to score travel)</span>}
                    </p>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={answers.radiusKm}
                      onChange={(e) => patch({ radiusKm: Number(e.target.value) })}
                      className="h-2 w-full accent-[hsl(var(--primary))]"
                    />
                    <Button
                      variant={answers.origin ? "secondary" : "outline"}
                      size="sm"
                      className="mt-3"
                      onClick={useLocation}
                      disabled={locating}
                    >
                      <LocateFixed className="mr-1.5 h-4 w-4" />
                      {answers.origin ? "Location added — update" : locating ? "Locating…" : "Use my location"}
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Your best-fit schools</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ranked across {schools.length} schools using curriculum, budget, travel, learning style and interests.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Start over
                    </Button>
                  </div>

                  {ranked.length === 0 ? (
                    <p className="rounded-xl bg-secondary/60 p-6 text-center text-sm text-muted-foreground">
                      No published schools to match yet. Check back soon.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {ranked.map((result, index) => (
                        <li key={result.schoolId} className="rounded-xl border border-border p-4">
                          <div className="flex items-start gap-4">
                            <ScoreRing score={result.score} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                                <Link to={`/schools/${result.schoolId}`} className="font-semibold hover:text-primary">
                                  {result.school.name}
                                </Link>
                                <Badge variant="secondary" className="text-[10px]">{result.school.curriculum_type}</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {result.school.city} · {tuitionRange(result.school)}
                                {result.distanceKm !== null && ` · ${formatDistance(result.distanceKm)}`}
                              </p>
                              <ul className="mt-2 space-y-1">
                                {result.reasons.map((reason) => (
                                  <li key={reason} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-chart-3" /> {reason}
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button asChild size="sm" className="h-8">
                                  <Link to={`/schools/${result.schoolId}`}>View</Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => {
                                    const res = toggleCompare(result.school);
                                    if (res?.full) {
                                      toast({ title: "Comparison is full", description: "Remove a school first.", variant: "destructive" });
                                    } else {
                                      toast({ title: res?.added ? "Added to comparison" : "Removed from comparison" });
                                    }
                                  }}
                                >
                                  <Scale className="mr-1 h-3.5 w-3.5" /> Compare
                                </Button>
                                <Button asChild size="sm" variant="secondary" className="h-8">
                                  <Link to={`/apply/${result.schoolId}`}>Apply</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-5 gap-2">
                            {result.breakdown.map((item) => (
                              <div key={item.label}>
                                <div className="h-1.5 rounded-full bg-secondary">
                                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                                </div>
                                <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.label}</p>
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => (step === 0 ? navigate("/schools") : setStep(step - 1))}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {step === 0 ? "Browse instead" : "Back"}
              </Button>
              <Button onClick={() => (step === 3 ? finish() : setStep(step + 1))}>
                {step === 3 ? "See my matches" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}