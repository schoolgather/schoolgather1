import { db } from "@/lib/db";

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Trash2, Upload, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SignInPrompt from "@/components/common/SignInPrompt";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/permissions";
import { ACADEMIC_YEARS, DOCUMENT_KINDS, GRADES, STATUS_META } from "@/lib/constants";
import { SAMPLE_SCHOOLS } from "@/lib/sampleSchools";
import { cn } from "@/lib/utils";

const STEPS = ["Applicant", "Academic", "Your story", "Documents", "Review"];

const schema = z.object({
  student_name: z.string().trim().min(2, "Enter the student's full name"),
  guardian_name: z.string().trim().min(2, "Enter a parent or guardian name"),
  guardian_email: z.string().trim().email("Enter a valid email address"),
  guardian_phone: z.string().trim().min(6, "Enter a contact number"),
  grade_applying: z.string().min(1, "Choose a year group"),
  personal_statement: z.string().trim().min(60, "Write at least 60 characters so the school can assess fit"),
});

export default function Apply() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { email, user, isAuthenticated, isLoadingAuth } = useSession();

  const [school, setSchool] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadKind, setUploadKind] = useState(DOCUMENT_KINDS[0]);
  const [form, setForm] = useState({
    student_name: user?.full_name || "",
    guardian_name: "",
    guardian_email: "",
    guardian_phone: "",
    grade_applying: "",
    academic_year: ACADEMIC_YEARS[0],
    personal_statement: "",
    current_school: "",
    learning_support: "",
    achievements: "",
    documents: [],
  });

  useEffect(() => {
    let active = true;
    db.entities.School.get(schoolId)
      .then((record) => {
        if (!active) return;
        if (record && record.name) {
          setSchool(record);
        } else {
          setSchool(SAMPLE_SCHOOLS.find((s) => s.id === schoolId || s.slug === schoolId) || null);
        }
      })
      .catch(() => {
        if (active) setSchool(SAMPLE_SCHOOLS.find((s) => s.id === schoolId || s.slug === schoolId) || null);
      });
    return () => {
      active = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    db.entities.Application.filter(
      { school_id: schoolId, student_email: email },
      { sort: "-created_date", limit: 1 }
    )
      .then((page) => {
        if (!active) return;
        const existing = page.items?.[0];
        if (existing) {
          setApplication(existing);
          setForm({
            student_name: existing.student_name || user?.full_name || "",
            guardian_name: existing.guardian_name || "",
            guardian_email: existing.guardian_email || "",
            guardian_phone: existing.guardian_phone || "",
            grade_applying: existing.grade_applying || "",
            academic_year: existing.academic_year || ACADEMIC_YEARS[0],
            personal_statement: existing.personal_statement || "",
            current_school: existing.answers?.current_school || "",
            learning_support: existing.answers?.learning_support || "",
            achievements: existing.answers?.achievements || "",
            documents: existing.documents || [],
          });
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [schoolId, email, user?.full_name]);

  const patch = (data) => setForm((prev) => ({ ...prev, ...data }));

  const validate = () => {
    const result = schema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const nextErrors = {};
    result.error.issues.forEach((issue) => {
      nextErrors[issue.path[0]] = issue.message;
    });
    setErrors(nextErrors);
    setStep(nextErrors.personal_statement ? 2 : 0);
    toast({ title: "A few details need attention", description: "Check the highlighted fields.", variant: "destructive" });
    return false;
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload documents under 10 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file });
      patch({
        documents: [
          ...form.documents,
          { name: file.name, file_uri, kind: uploadKind, uploaded_at: new Date().toISOString() },
        ],
      });
      toast({ title: "Document attached", description: `${file.name} added (stored privately).` });
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const persist = async (status) => {
    setSaving(true);
    const now = new Date().toISOString();
    const entry = {
      status,
      note:
        status === "DRAFT"
          ? "Application saved as a draft"
          : status === "SUBMITTED"
            ? "Application submitted to the school"
            : "Application updated",
      at: now,
      by: email,
    };
    const payload = {
      student_email: email,
      student_name: form.student_name,
      guardian_name: form.guardian_name,
      guardian_email: form.guardian_email,
      guardian_phone: form.guardian_phone,
      school_id: school.id,
      school_name: school.name,
      school_slug: school.slug,
      admin_emails: school.admin_emails || [],
      grade_applying: form.grade_applying,
      academic_year: form.academic_year,
      status,
      personal_statement: form.personal_statement,
      answers: {
        current_school: form.current_school,
        learning_support: form.learning_support,
        achievements: form.achievements,
      },
      documents: form.documents,
      timeline: [...(application?.timeline || []), entry],
      submitted_at: status === "SUBMITTED" ? now : application?.submitted_at || null,
    };

    try {
      const record = application
        ? await db.entities.Application.update(application.id, payload)
        : await db.entities.Application.create(payload);
      setApplication(record);
      if (status === "SUBMITTED") {
        db.functions
          .invoke("notifySchoolAdmins", { type: "application", id: record.id })
          .catch(() => {});
      }
      toast({
        title: status === "SUBMITTED" ? "Application submitted" : "Draft saved",
        description:
          status === "SUBMITTED"
            ? `${school.name} has received your application.`
            : "You can come back and finish it any time.",
      });
      if (status === "SUBMITTED") {
        navigate("/dashboard");
      }
    } catch (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="container-page py-24 text-center text-muted-foreground">Loading your application…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SignInPrompt
          title="Sign in to apply"
          description="Applications are tied to a verified family account so you can track every stage."
        />
      </div>
    );
  }

  if (loading || !school) {
    return (
      <div className="container-page py-10">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const locked = application && !["DRAFT", "SUBMITTED"].includes(application.status);

  return (
    <div className="container-page py-10">
      <Link to={`/schools/${school.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to {school.name}
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Application to {school.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {school.curriculum_type} · {school.city} · {application ? "Continuing your saved application" : "New application"}
          </p>
        </div>
        {application && (
          <Badge className={cn("border-0", STATUS_META[application.status]?.chip)}>
            {STATUS_META[application.status]?.label}
          </Badge>
        )}
      </div>

      {locked ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">This application is with the school</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can follow every stage, message admissions and upload additional documents from your dashboard.
          </p>
          <Button asChild className="mt-5"><Link to="/dashboard">Open my dashboard</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  index === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-current/20 text-[10px]">
                  {index + 1}
                </span>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Applicant details</h2>
                  <div>
                    <Label htmlFor="student_name">Student full name</Label>
                    <Input id="student_name" value={form.student_name} onChange={(e) => patch({ student_name: e.target.value })} className="mt-1.5" />
                    {errors.student_name && <p className="mt-1 text-xs text-destructive">{errors.student_name}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="guardian_name">Parent / guardian</Label>
                      <Input id="guardian_name" value={form.guardian_name} onChange={(e) => patch({ guardian_name: e.target.value })} className="mt-1.5" />
                      {errors.guardian_name && <p className="mt-1 text-xs text-destructive">{errors.guardian_name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="guardian_email">Guardian email</Label>
                      <Input id="guardian_email" type="email" value={form.guardian_email} onChange={(e) => patch({ guardian_email: e.target.value })} className="mt-1.5" />
                      {errors.guardian_email && <p className="mt-1 text-xs text-destructive">{errors.guardian_email}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guardian_phone">Contact number</Label>
                    <Input id="guardian_phone" value={form.guardian_phone} onChange={(e) => patch({ guardian_phone: e.target.value })} className="mt-1.5" />
                    {errors.guardian_phone && <p className="mt-1 text-xs text-destructive">{errors.guardian_phone}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Academic placement</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="grade">Year group applying for</Label>
                      <select
                        id="grade"
                        value={form.grade_applying}
                        onChange={(e) => patch({ grade_applying: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select a year group</option>
                        {GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      {errors.grade_applying && <p className="mt-1 text-xs text-destructive">{errors.grade_applying}</p>}
                    </div>
                    <div>
                      <Label htmlFor="year">Academic year</Label>
                      <select
                        id="year"
                        value={form.academic_year}
                        onChange={(e) => patch({ academic_year: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        {ACADEMIC_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="current_school">Current school</Label>
                    <Input id="current_school" value={form.current_school} onChange={(e) => patch({ current_school: e.target.value })} className="mt-1.5" placeholder="Optional" />
                  </div>
                  <div>
                    <Label htmlFor="learning_support">Learning support needs</Label>
                    <Textarea id="learning_support" value={form.learning_support} onChange={(e) => patch({ learning_support: e.target.value })} rows={3} className="mt-1.5" placeholder="Share any support plans, so the school can plan ahead" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Tell the school about your child</h2>
                  <div>
                    <Label htmlFor="personal_statement">Personal statement</Label>
                    <Textarea
                      id="personal_statement"
                      value={form.personal_statement}
                      onChange={(e) => patch({ personal_statement: e.target.value })}
                      rows={8}
                      className="mt-1.5"
                      placeholder="Interests, strengths, what you are looking for in a school community…"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs">
                      {errors.personal_statement ? (
                        <span className="text-destructive">{errors.personal_statement}</span>
                      ) : (
                        <span className="text-muted-foreground">Aim for 150–400 words.</span>
                      )}
                      <span className="text-muted-foreground">{form.personal_statement.length} chars</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="achievements">Achievements & activities</Label>
                    <Textarea id="achievements" value={form.achievements} onChange={(e) => patch({ achievements: e.target.value })} rows={3} className="mt-1.5" placeholder="Sports, music, competitions, leadership…" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Supporting documents</h2>
                  <p className="text-sm text-muted-foreground">
                    Transcripts and certificates are stored privately (stored privately) and shared only with this
                    school's admissions team.
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[180px] flex-1">
                      <Label htmlFor="kind">Document type</Label>
                      <select
                        id="kind"
                        value={uploadKind}
                        onChange={(e) => setUploadKind(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        {DOCUMENT_KINDS.map((kind) => (
                          <option key={kind} value={kind}>{kind}</option>
                        ))}
                      </select>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-medium hover:border-primary/40">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading…" : "Upload file"}
                      <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                    </label>
                  </div>
                  {form.documents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No documents attached yet. You can also add them after submitting.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/70 rounded-xl border border-border">
                      {form.documents.map((doc, index) => (
                        <li key={`${doc.file_uri}-${index}`} className="flex items-center justify-between gap-3 p-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.kind}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => patch({ documents: form.documents.filter((_, i) => i !== index) })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Review and submit</h2>
                  <dl className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted-foreground">Student</dt><dd className="font-medium">{form.student_name || "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Year group</dt><dd className="font-medium">{form.grade_applying || "—"} · {form.academic_year}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Guardian</dt><dd className="font-medium">{form.guardian_name || "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Contact</dt><dd className="font-medium">{form.guardian_email || "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Documents</dt><dd className="font-medium">{form.documents.length} attached</dd></div>
                    <div><dt className="text-xs text-muted-foreground">School</dt><dd className="font-medium">{school.name}</dd></div>
                  </dl>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Statement</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{form.personal_statement || "—"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By submitting you confirm the information is accurate and consent to {school.name} reviewing
                    your documents for admissions purposes.
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
                <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => persist("DRAFT")} disabled={saving || uploading}>
                    Save draft
                  </Button>
                  {step < 4 ? (
                    <Button onClick={() => setStep(step + 1)}>
                      Next <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => validate() && persist("SUBMITTED")} disabled={saving || uploading}>
                      <Check className="mr-1.5 h-4 w-4" /> {saving ? "Submitting…" : "Submit application"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Applying to</p>
                <p className="mt-1 font-semibold">{school.name}</p>
                <p className="text-sm text-muted-foreground">{school.city}, {school.country}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{school.curriculum_type}</Badge>
                  <Badge variant="secondary">{school.age_range || "All ages"}</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How it works</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs">
                  <li>Submit once — your profile is reused for every school.</li>
                  <li>The school reviews and may invite you to interview.</li>
                  <li>Track offers, messages and tours in one dashboard.</li>
                </ol>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}