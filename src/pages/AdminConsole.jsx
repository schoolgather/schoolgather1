import { db } from "@/lib/db";

import React, { useEffect, useState } from "react";
import { Building2, Plus, ShieldCheck, Users, Trash2, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SignInPrompt from "@/components/common/SignInPrompt";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/permissions";
import { CURRICULA } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export default function AdminConsole() {
  const { user, email, isAuthenticated, isSuperAdmin, isLoadingAuth } = useSession();
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [adminsFor, setAdminsFor] = useState(null);
  const [adminEmails, setAdminEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    curriculum_type: "IB",
    city: "",
    country: "",
    latitude: 0,
    longitude: 0,
    tuition_min: 8000,
    tuition_max: 20000,
    contact_email: "",
    admin_emails: "",
  });

  const patch = (data) => setForm((prev) => ({ ...prev, ...data }));

  const load = async () => {
    setLoading(true);
    const [schoolPage, appPage, userList, logPage] = await Promise.all([
      db.entities.School.list({ sort: "name", limit: 200 }).catch(() => ({ items: [] })),
      db.entities.Application.list({ sort: "-created_date", limit: 200 }).catch(() => ({ items: [] })),
      db.entities.User.list().catch(() => []),
      db.entities.AuditLog.list({ sort: "-created_date", limit: 50 }).catch(() => ({ items: [] })),
    ]);
    setSchools(schoolPage.items || []);
    setApplications(appPage.items || []);
    setUsers(Array.isArray(userList) ? userList : userList?.items || []);
    setLogs(logPage.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
    else setLoading(false);
  }, [isSuperAdmin]);

  const audit = (action, detail, schoolId) =>
    db.entities.AuditLog.create({
      actor_email: email,
      action,
      target_type: "school",
      target_id: schoolId || "",
      school_id: schoolId || "",
      detail,
    }).catch(() => null);

  const onboard = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const admins = form.admin_emails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const record = await db.entities.School.create({
        name: form.name,
        slug: slugify(form.name),
        tagline: "Newly onboarded school",
        description: "This school just joined School Gather and is still filling in its profile.",
        curriculum_type: form.curriculum_type,
        city: form.city,
        country: form.country,
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        tuition_min: Number(form.tuition_min) || 0,
        tuition_max: Number(form.tuition_max) || 0,
        currency: "USD",
        contact_email: form.contact_email,
        admin_emails: admins,
        status: "published",
        cover_image_url:
          "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80",
        learning_styles: ["Structured & academic"],
      });
      await audit("school.onboarded", `${form.name} onboarded with ${admins.length} admissions officer(s)`, record.id);
      toast({ title: "School onboarded", description: `${form.name} is live in the directory.` });
      setOnboardOpen(false);
      setForm({
        name: "",
        curriculum_type: "IB",
        city: "",
        country: "",
        latitude: 0,
        longitude: 0,
        tuition_min: 8000,
        tuition_max: 20000,
        contact_email: "",
        admin_emails: "",
      });
      load();
    } catch (error) {
      toast({ title: "Could not onboard", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (school) => {
    const next = school.status === "published" ? "draft" : "published";
    await db.entities.School.update(school.id, { status: next });
    await audit("school.visibility", `${school.name} set to ${next}`, school.id);
    toast({ title: next === "published" ? "School published" : "School unpublished" });
    load();
  };

  const removeSchool = async (school) => {
    await db.entities.School.delete(school.id);
    await audit("school.removed", `${school.name} removed from the platform`, school.id);
    toast({ title: "School removed" });
    load();
  };

  const saveAdmins = async () => {
    if (!adminsFor) return;
    setSaving(true);
    try {
      const admins = adminEmails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      await db.entities.School.update(adminsFor.id, { admin_emails: admins });
      await audit("school.admins", `Admissions team updated (${admins.length})`, adminsFor.id);
      toast({ title: "Admissions team updated" });
      setAdminsFor(null);
      load();
    } catch (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="container-page py-24 text-center text-muted-foreground">Checking permissions…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SignInPrompt title="Platform administration" description="Sign in with a platform administrator account." />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-semibold">Administrator access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not hold the platform administrator role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Platform administration
          </p>
          <h1 className="mt-1 text-3xl font-semibold">School Gather control room</h1>
          <p className="mt-1 text-sm text-muted-foreground">Onboard schools, manage access and audit activity.</p>
        </div>
        <Button onClick={() => setOnboardOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Onboard school
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Building2, label: "Schools", value: schools.length },
          { icon: Users, label: "People", value: users.length },
          { icon: ScrollText, label: "Applications", value: applications.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-secondary" />
      ) : (
        <div className="mt-8 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border/70 p-4">
              <h2 className="font-semibold">Schools</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">School</th>
                    <th className="px-4 py-3 font-semibold">Curriculum</th>
                    <th className="px-4 py-3 font-semibold">Admissions team</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr key={school.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{school.name}</p>
                        <p className="text-xs text-muted-foreground">{school.city}, {school.country}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{school.curriculum_type}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left text-xs text-primary hover:underline"
                          onClick={() => {
                            setAdminsFor(school);
                            setAdminEmails((school.admin_emails || []).join(", "));
                          }}
                        >
                          {(school.admin_emails || []).length
                            ? `${school.admin_emails.length} officer${school.admin_emails.length === 1 ? "" : "s"}`
                            : "Assign team"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={school.status === "published" ? "border-0 bg-chart-3/15 text-chart-3" : "border-0 bg-muted text-muted-foreground"}>
                          {school.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(school)}>
                            {school.status === "published" ? "Unpublish" : "Publish"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeSchool(school)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">People</h2>
              <ul className="mt-3 divide-y divide-border/70">
                {users.map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.full_name || person.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                    </div>
                    <Badge variant={person.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                      {person.role}
                    </Badge>
                  </li>
                ))}
                {users.length === 0 && <li className="py-3 text-sm text-muted-foreground">No users yet.</li>}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">Audit log</h2>
              <ul className="mt-3 space-y-2.5">
                {logs.map((log) => (
                  <li key={log.id} className="text-sm">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.detail}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {log.actor_email} · {new Date(log.created_date).toLocaleString()}
                    </p>
                  </li>
                ))}
                {logs.length === 0 && <li className="text-sm text-muted-foreground">No recorded activity yet.</li>}
              </ul>
            </section>
          </div>
        </div>
      )}

      <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Onboard a school</DialogTitle>
            <DialogDescription>Creates a published profile and links its admissions officers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onboard} className="space-y-3">
            <div>
              <Label htmlFor="school-name">School name</Label>
              <Input id="school-name" value={form.name} onChange={(e) => patch({ name: e.target.value })} className="mt-1.5" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="curriculum">Curriculum</Label>
                <select
                  id="curriculum"
                  value={form.curriculum_type}
                  onChange={(e) => patch({ curriculum_type: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {CURRICULA.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="contact">Admissions email</Label>
                <Input id="contact" type="email" value={form.contact_email} onChange={(e) => patch({ contact_email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => patch({ city: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => patch({ country: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" type="number" step="0.0001" value={form.latitude} onChange={(e) => patch({ latitude: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" type="number" step="0.0001" value={form.longitude} onChange={(e) => patch({ longitude: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tmin">Tuition from</Label>
                <Input id="tmin" type="number" value={form.tuition_min} onChange={(e) => patch({ tuition_min: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tmax">Tuition to</Label>
                <Input id="tmax" type="number" value={form.tuition_max} onChange={(e) => patch({ tuition_max: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="admins">Admissions officer emails (comma separated)</Label>
              <Input
                id="admins"
                value={form.admin_emails}
                onChange={(e) => patch({ admin_emails: e.target.value })}
                className="mt-1.5"
                placeholder="admissions@school.edu"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Onboarding…" : "Onboard school"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(adminsFor)} onOpenChange={(open) => !open && setAdminsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admissions team · {adminsFor?.name}</DialogTitle>
            <DialogDescription>
              These emails get access to this school's applicants, pipeline and messages — and nothing else.
            </DialogDescription>
          </DialogHeader>
          <Input value={adminEmails} onChange={(e) => setAdminEmails(e.target.value)} placeholder="admissions@school.edu, head@school.edu" />
          <Button onClick={saveAdmins} disabled={saving}>{saving ? "Saving…" : "Save admissions team"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}