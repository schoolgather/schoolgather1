import { db } from "@/lib/db";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  DollarSign,
  Heart,
  RotateCcw,
  Scale,
  MapPin,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCompareStore } from "@/lib/store";
import { useSession } from "@/lib/permissions";
import { CURRICULA, GRADES, LEARNING_STYLES, INTERESTS } from "@/lib/constants";
import { formatMoney, tuitionRange } from "@/lib/geo";
import { scoreSchool, explainMatch } from "@/lib/scoring";
import { SAMPLE_SCHOOLS } from "@/lib/sampleSchools";
import SchoolCard from "@/components/schools/SchoolCard";

const STEPS = [
  { id: 1, title: "Grade Level", desc: "What year or grade is your child entering?" },
  { id: 2, title: "Curriculum", desc: "Which educational framework do you prefer?" },
  { id: 3, title: "Learning Style", desc: "How does your child learn and thrive best?" },
  { id: 4, title: "Interests & Passions", desc: "What activities make them light up?" },
  { id: 5, title: "Budget & Aid", desc: "What is your target investment for tuition?" },
];

export default function Matcher() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, email, isAuthenticated } = useSession();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [answers, setAnswers] = useState({
    grade: "P6",
    curriculum: "Any",
    learningStyles: ["Creative & project-based"],
    interests: ["STEM & robotics", "Competitive sports"],
    maxTuition: 30000,
    needsScholarship: false,
  });

  useEffect(() => {
    let active = true;
    db.entities.School.filter({ status: "published" }, { limit: 100 })
      .then((page) => {
        if (!active) return;
        const items = page.items && page.items.length > 0 ? page.items : SAMPLE_SCHOOLS;
        setSchools(items);
      })
      .catch(() => {
        if (active) setSchools(SAMPLE_SCHOOLS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleArrayItem = (key, item) => {
    setAnswers((prev) => {
      const list = prev[key] || [];
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
      return { ...prev, [key]: next };
    });
  };

  const rankedSchools = useMemo(() => {
    return schools
      .map((school) => {
        const score = scoreSchool(school, answers);
        const reasons = explainMatch(school, answers);
        return { school, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  }, [schools, answers]);

  const handleFinish = async () => {
    setCompleted(true);
    if (isAuthenticated && email) {
      setSaving(true);
      try {
        await db.entities.MatchProfile.create({
          user_email: email,
          answers,
          results: rankedSchools.slice(0, 10).map((r) => ({
            school_id: r.school.id,
            score: r.score,
          })),
        });
        toast({ title: "Results saved", description: "Your match preferences have been saved to your profile." });
      } catch (e) {
        // Silent save error fallback
      } finally {
        setSaving(false);
      }
    }
  };

  const resetQuiz = () => {
    setCompleted(false);
    setStep(0);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary/30 py-10">
      <div className="container-page max-w-4xl">
        {!completed ? (
          <div>
            {/* Header info */}
            <div className="mb-8 text-center">
              <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 2-Minute Matcher
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Find the School That Fits Your Child
              </h1>
              <p className="mt-2 text-muted-foreground">
                Answer 5 simple questions to get personalized compatibility scores for every school.
              </p>

              {/* Progress Steps */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(idx)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      step === idx
                        ? "bg-primary text-primary-foreground shadow"
                        : idx < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step {step + 1} of 5
                </span>
                <h2 className="mt-1 text-2xl font-bold text-foreground">{STEPS[step].title}</h2>
                <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
              </div>

              <div className="min-h-[260px]">
                {/* Step 1: Grade Level */}
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                    {GRADES.map((g) => {
                      const selected = answers.grade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setAnswers({ ...answers, grade: g })}
                          className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40"
                          }`}
                        >
                          <span>{g}</span>
                          {selected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 2: Curriculum */}
                {step === 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "Any", title: "Open to Any Framework", desc: "Show best matches across IB, British, American, and more." },
                      { key: "IB", title: "International Baccalaureate (IB)", desc: "Inquiry-led, globally recognised PYP, MYP, and DP." },
                      { key: "British", title: "British Curriculum (IGCSE & A-Levels)", desc: "Structured academic rigour, deep subject mastery." },
                      { key: "American", title: "American Curriculum & AP", desc: "Broad holistic education with Advanced Placement courses." },
                      { key: "French", title: "French Curriculum (Baccalauréat)", desc: "Bilingual immersion, strong analytical & philosophical foundation." },
                      { key: "National", title: "National & Regional Diplomas", desc: "Top-tier national standard diplomas & state accreditations." },
                    ].map((c) => {
                      const selected = answers.curriculum === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setAnswers({ ...answers, curriculum: c.key })}
                          className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{c.title}</span>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground">{c.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Learning Style */}
                {step === 2 && (
                  <div>
                    <p className="mb-4 text-xs font-medium text-muted-foreground">Select all that apply:</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {LEARNING_STYLES.map((style) => {
                        const selected = answers.learningStyles.includes(style);
                        return (
                          <button
                            key={style}
                            type="button"
                            onClick={() => toggleArrayItem("learningStyles", style)}
                            className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition ${
                              selected
                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40"
                            }`}
                          >
                            <span>{style}</span>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Interests & Extracurriculars */}
                {step === 3 && (
                  <div>
                    <p className="mb-4 text-xs font-medium text-muted-foreground">Pick activities your child loves:</p>
                    <div className="flex flex-wrap gap-2.5">
                      {INTERESTS.map((interest) => {
                        const selected = answers.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleArrayItem("interests", interest)}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground shadow"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                            }`}
                          >
                            <span>{interest}</span>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Budget & Aid */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold">Maximum Target Annual Tuition</label>
                        <span className="font-display text-lg font-bold text-primary">
                          {answers.maxTuition ? formatMoney(answers.maxTuition) : "No limit"} / yr
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50000}
                        step={2500}
                        value={answers.maxTuition}
                        onChange={(e) => setAnswers({ ...answers, maxTuition: Number(e.target.value) })}
                        className="mt-3 w-full accent-primary"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>Under \$10k</span>
                        <span>\$25,000</span>
                        <span>\$50,000+</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers.needsScholarship}
                          onChange={(e) => setAnswers({ ...answers, needsScholarship: e.target.checked })}
                          className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary"
                        />
                        <div>
                          <span className="block text-sm font-semibold text-foreground">
                            Prioritize schools offering scholarships or financial aid
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            We will boost schools that offer merit awards, need-based bursaries, or tuition assistance.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                {step > 0 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Button variant="ghost" asChild>
                    <Link to="/schools">Skip to all schools</Link>
                  </Button>
                )}

                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)}>
                    Next question <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} className="bg-primary text-primary-foreground">
                    <Sparkles className="mr-1.5 h-4 w-4" /> View My Matches
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge className="mb-2 bg-chart-3/15 text-chart-3">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Match Complete
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Top Recommended Schools for Your Child
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Ranked by curriculum fit, budget compatibility, and learning style synergy.
                </p>
              </div>
              <Button variant="outline" onClick={resetQuiz} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> Retake Quiz
              </Button>
            </div>

            {/* Results Grid / List */}
            <div className="space-y-4">
              {rankedSchools.map(({ school, score, reasons }, index) => (
                <div
                  key={school.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-36">
                      <img
                        src={school.cover_image_url}
                        alt={school.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute left-2 top-2">
                        <Badge className="border-0 bg-background/90 text-[10px] font-bold text-foreground">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/schools/${school.id}`}>
                          <h3 className="text-lg font-bold leading-snug hover:text-primary">
                            {school.name}
                          </h3>
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          {school.curriculum_type}
                        </Badge>
                        {school.scholarship_available && (
                          <Badge className="bg-accent text-accent-foreground text-[10px]">
                            Scholarship
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{school.city}{school.country ? `, ${school.country}` : ""}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">{tuitionRange(school)}</span>
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {reasons.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            <Check className="h-3 w-3 text-primary" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex shrink-0 items-center justify-between border-t border-border pt-4 md:mt-0 md:flex-col md:items-end md:border-t-0 md:pt-0">
                    <div className="flex items-center gap-2 md:text-right">
                      <div className="text-right">
                        <div className="font-display text-2xl font-bold text-primary">{score}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Match Score
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/schools/${school.id}`}>View School</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link to={`/apply/${school.id}`}>
                          Apply Now <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Footer */}
            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
              <h3 className="text-lg font-semibold text-foreground">
                Want to compare all these schools side by side?
              </h3>
              <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
                You can add up to 4 schools to your compare tray to see fees, curricula, and facilities side-by-side.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild>
                  <Link to="/schools">Browse All Schools</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/compare">Go to Compare Tool</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
