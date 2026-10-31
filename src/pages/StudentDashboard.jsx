import { db } from "@/lib/db";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Bookmark, MessagesSquare, CalendarCheck, Sparkles } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SignInPrompt from "@/components/common/SignInPrompt";
import ApplicationsBoard from "@/components/dashboard/ApplicationsBoard";
import ApplicationDetailDialog from "@/components/dashboard/ApplicationDetailDialog";
import SavedSchools from "@/components/dashboard/SavedSchools";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import ToursPanel from "@/components/dashboard/ToursPanel";
import { useSession } from "@/lib/permissions";

export default function StudentDashboard() {
  const { user, email, isAuthenticated, isLoadingAuth } = useSession();
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const loadApplications = () => {
    if (!email) return;
    db.entities.Application.filter({ student_email: email }, { sort: "-created_date", limit: 100 })
      .then((page) => setApplications(page.items || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  const loadBookmarks = () => {
    if (!email) return;
    db.entities.Bookmark.filter({ user_email: email }, { sort: "-created_date", limit: 60 })
      .then((page) => setBookmarks(page.items || []))
      .catch(() => setBookmarks([]));
  };

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    loadApplications();
    loadBookmarks();
  }, [email]);

  if (isLoadingAuth) {
    return <div className="container-page py-24 text-center text-muted-foreground">Loading your workspace…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SignInPrompt
          title="Your admissions workspace"
          description="Sign in to track applications, saved schools, tours and messages with admissions teams."
        />
      </div>
    );
  }

  const offers = applications.filter((a) => ["ACCEPTED", "ENROLLED"].includes(a.status)).length;
  const active = applications.filter((a) => !["REJECTED", "DRAFT"].includes(a.status)).length;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold">{user?.full_name || email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length} application{applications.length === 1 ? "" : "s"} · {active} in progress · {offers} offer{offers === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/match"><Sparkles className="mr-1.5 h-4 w-4" /> Matching quiz</Link>
          </Button>
          <Button asChild>
            <Link to="/schools">Find schools</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { icon: ClipboardList, label: "Applications", value: applications.length },
          { icon: CalendarCheck, label: "In progress", value: active },
          { icon: Bookmark, label: "Saved schools", value: bookmarks.length },
          { icon: MessagesSquare, label: "Offers", value: offers },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="applications" className="mt-8">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-secondary/60 p-1 sm:w-auto">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="tours">Tours</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-5">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
          ) : (
            <ApplicationsBoard applications={applications} onOpen={setSelected} />
          )}
        </TabsContent>
        <TabsContent value="saved" className="mt-5">
          <SavedSchools bookmarks={bookmarks} onChange={loadBookmarks} />
        </TabsContent>
        <TabsContent value="messages" className="mt-5">
          <MessagesPanel role="student" />
        </TabsContent>
        <TabsContent value="tours" className="mt-5">
          <ToursPanel role="student" />
        </TabsContent>
      </Tabs>

      <ApplicationDetailDialog
        application={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        onWithdrawn={loadApplications}
      />
    </div>
  );
}