const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, GraduationCap, MessagesSquare } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SignInPrompt from "@/components/common/SignInPrompt";
import SchoolAnalytics from "@/components/school/SchoolAnalytics";
import SchoolPipeline from "@/components/school/SchoolPipeline";
import SchoolSlots from "@/components/school/SchoolSlots";
import SchoolProfileEditor from "@/components/school/SchoolProfileEditor";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import { useSession, mySchools } from "@/lib/permissions";

export default function SchoolDashboard() {
  const { email, isAuthenticated, isSuperAdmin, isLoadingAuth } = useSession();
  const [schools, setSchools] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSchools = () => {
    db.entities.School.list({ sort: "name", limit: 200 })
      .then((page) => {
        const items = page.items || [];
        setSchools(items);
        const mine = mySchools(items, email);
        const pool = isSuperAdmin ? items : mine;
        setActiveId((current) => current || pool[0]?.id || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    loadSchools();
  }, [email, isSuperAdmin]);

  const adminSchools = useMemo(() => {
    const mine = mySchools(schools, email);
    return isSuperAdmin ? schools : mine;
  }, [schools, email, isSuperAdmin]);

  const school = adminSchools.find((s) => s.id === activeId) || null;

  const loadSchoolData = () => {
    if (!school) return;
    db.entities.Application.filter({ school_id: school.id }, { sort: "-created_date", limit: 200 })
      .then((page) => setApplications(page.items || []))
      .catch(() => setApplications([]));
    db.entities.TourSlot.filter({ school_id: school.id }, { sort: "date", limit: 50 })
      .then((page) => setSlots(page.items || []))
      .catch(() => setSlots([]));
  };

  useEffect(loadSchoolData, [school?.id]);

  if (isLoadingAuth) {
    return <div className="container-page py-24 text-center text-muted-foreground">Loading school workspace…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SignInPrompt
          title="School admissions console"
          description="Sign in with the email your school registered as an admissions officer."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="container-page py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!adminSchools.length) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-xl font-semibold">No school assigned yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is not linked to a school. Ask the platform administrator to add{" "}
            <strong className="text-foreground">{email}</strong> to a school's admissions team.
          </p>
          <Button asChild variant="outline" className="mt-5"><Link to="/schools">Browse the directory</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admissions console</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold">
            <GraduationCap className="h-7 w-7 text-primary" />
            {school?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Isolated tenant workspace · you only see data for this school.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {adminSchools.length > 1 && (
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {adminSchools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {school && (
            <Button asChild variant="outline">
              <Link to={`/schools/${school.id}`}>View public profile</Link>
            </Button>
          )}
        </div>
      </div>

      {school && (
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            { label: "New applications", value: applications.filter((a) => a.status === "SUBMITTED").length },
            { label: "In review", value: applications.filter((a) => a.status === "UNDER_REVIEW").length },
            { label: "Interviews", value: applications.filter((a) => a.status === "INTERVIEW").length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <p className="font-display text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-secondary/60 p-1 sm:w-auto">
          <TabsTrigger value="overview">Analytics</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tours">Tours</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="messages"><MessagesSquare className="mr-1.5 h-3.5 w-3.5" />Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          {school && <SchoolAnalytics school={school} applications={applications} />}
        </TabsContent>
        <TabsContent value="pipeline" className="mt-5">
          {school && (
            <SchoolPipeline school={school} applications={applications} onRefresh={loadSchoolData} />
          )}
        </TabsContent>
        <TabsContent value="tours" className="mt-5">
          {school && <SchoolSlots school={school} slots={slots} onRefresh={loadSchoolData} />}
        </TabsContent>
        <TabsContent value="profile" className="mt-5">
          {school && <SchoolProfileEditor school={school} onSaved={loadSchools} />}
        </TabsContent>
        <TabsContent value="messages" className="mt-5">
          <MessagesPanel role="school_admin" />
        </TabsContent>
      </Tabs>
    </div>
  );
}