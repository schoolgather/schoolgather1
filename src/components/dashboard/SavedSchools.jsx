const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Link } from "react-router-dom";
import { BookmarkX, MapPin, ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { tuitionRange } from "@/lib/geo";

import { useToast } from "@/components/ui/use-toast";

export default function SavedSchools({ bookmarks, onChange }) {
  const { toast } = useToast();

  const remove = async (id) => {
    await db.entities.Bookmark.delete(id);
    toast({ title: "Removed from saved schools" });
    onChange?.();
  };

  if (!bookmarks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-semibold">Nothing saved yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap “Save” on any school profile to keep it here for later.
        </p>
        <Button asChild className="mt-4"><Link to="/schools">Browse schools</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative aspect-[16/9] bg-secondary">
            {bookmark.logo_url ? (
              <Image src={bookmark.logo_url} alt={bookmark.school_name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm font-semibold text-muted-foreground">
                {bookmark.school_name}
              </div>
            )}
          </div>
          <div className="p-4">
            <Link to={`/schools/${bookmark.school_id}`} className="font-semibold hover:text-primary">
              {bookmark.school_name}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {bookmark.city} · {bookmark.curriculum_type}
            </p>
            <p className="mt-2 text-sm font-medium">
              {tuitionRange({ tuition_min: bookmark.tuition_min, tuition_max: bookmark.tuition_max })}
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link to={`/schools/${bookmark.school_id}`}>
                  Open <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(bookmark.id)}>
                <BookmarkX className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}