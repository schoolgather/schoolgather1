import { useMemo, useState } from "react";
import { Plus, Radio, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { useSession } from "@/lib/permissions";
import { useLiveSchools } from "@/hooks/useLiveSchools";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SignInPrompt from "@/components/common/SignInPrompt";
import SchoolDeskTable from "@/components/desk/SchoolDeskTable";
import AddSchoolDialog from "@/components/desk/AddSchoolDialog";
import AdmissionsTeamDialog from "@/components/desk/AdmissionsTeamDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { slugify } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const parseEmails = (text) =>
  text.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

const toNumber = (value) => Number(value) || 0;

export default function SchoolDesk() {
  const { email, isAuthenticated, isSuperAdmin, isLoadingAuth } = useSession();
  const { toast } = useToast();
  const { schools, loading, error } = useLiveSchools(isSuperAdmin);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [teamSchool, setTeamSchool] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visibleSchools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return schools.filter((school) => {
      if (statusFilter !== "all" && school.status !== statusFilter) return false;
      if (!needle) return true;
      return [school.name, school.city, school.country, school.curriculum_type]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [schools, query, statusFilter]);

  const audit = (action, detail, schoolId) =>
    db.entities.AuditLog.create({
      actor_email: email,
      action,
      target_type: "school",
      target_id: schoolId || "",
      school_id: schoolId || "",
      detail,
    }).catch(() => null);

  const fail = (title, error) =>
    toast({ title, description: error.message, variant: "destructive" });

  const handleAdd = async (form) => {
    const admins = parseEmails(form.admin_emails);
    try {
      const record = await db.entities.School.create({
        name: form.name,
        slug: slugify(form.name),
        tagline: "Newly added school",
        description: "This school was just added to School Gather and is still filling in its profile.",
        curriculum_type: form.curriculum_type,
        city: form.city,
        country: form.country,
        tuition_min: toNumber(form.tuition_min),
        tuition_max: toNumber(form.tuition_max),
        currency: "USD",
        contact_email: form.contact_email,
        admin_emails: admins,
        status: "published",
        learning_styles: ["Structured & academic"],
      });
      await audit("school.onboarded", `${form.name} added with ${admins.length} admissions officer(s)`, record.id);
      toast({ title: "School added", description: `${form.name} is live in the directory.` });
      return true;
    } catch (err) {
      fail("Could not add school", err);
      return false;
    }
  };

  const handleTogglePublish = async (school) => {
    const next = school.status === "published" ? "draft" : "published";
    try {
      await db.entities.School.update(school.id, { status: next });
      await audit("school.visibility", `${school.name} set to ${next}`, school.id);
      toast({ title: next === "published" ? "School published" : "School unpublished" });
    } catch (err) {
      fail("Could not change visibility", err);
    }
  };

  const handleSaveTeam = async (school, emails) => {
    const admins = parseEmails(emails);
    try {
      await db.entities.School.update(school.id, { admin_emails: admins });
      await audit("school.admins", `Admissions team updated (${admins.length})`, school.id);
      toast({ title: "Admissions team updated" });
      setTeamSchool(null);
    } catch (err) {
      fail("Could not update", err);
    }
  };

  const handleDelete = async () => {
    const school = deleteTarget;
    setDeleteTarget(null);
    try {
      await db.entities.School.delete(school.id);
      await audit("school.removed", `${school.name} removed from the platform`, school.id);
      toast({ title: "School removed" });
    } catch (err) {
      fail("Could not remove school", err);
    }
  };

  if (isLoadingAuth) {
    return <div className="container-page py-24 text-center text-muted-foreground">Checking permissions…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SignInPrompt title="School desk" description="Sign in with a platform administrator account." />
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
            <Radio className="h-3.5 w-3.5 text-chart-3" /> Live
          </p>
          <h1 className="mt-1 text-3xl font-semibold">School desk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes made by anyone on the team appear here instantly.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add school
        </Button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error.message}</div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city or curriculum"
          aria-label="Search schools"
          className="max-w-sm"
        />
        <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-xl bg-secondary p-1">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
              className={
                "rounded-lg px-3 py-1.5 text-sm transition-colors " +
                (statusFilter === option.value
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {visibleSchools.length} of {schools.length} schools
        </span>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="h-64 animate-pulse bg-secondary" />
        ) : visibleSchools.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {schools.length === 0 ? "No schools yet. Add the first one." : "No schools match these filters."}
          </p>
        ) : (
          <SchoolDeskTable
            schools={visibleSchools}
            onTogglePublish={handleTogglePublish}
            onEditTeam={setTeamSchool}
            onRequestDelete={setDeleteTarget}
          />
        )}
      </section>

      <AddSchoolDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />

      <AdmissionsTeamDialog
        school={teamSchool}
        onClose={() => setTeamSchool(null)}
        onSave={handleSaveTeam}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The school will be removed from the platform. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep school</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove school
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
