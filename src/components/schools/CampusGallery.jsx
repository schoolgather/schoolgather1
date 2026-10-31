import React, { useEffect, useState } from "react";
import { Images } from "lucide-react";
import { db } from "@/lib/db";
import { schoolImageUrl } from "@/lib/schoolImages";

export default function CampusGallery({ schoolId, schoolName }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    let active = true;
    db.entities.SchoolPhoto.filter({ school_id: schoolId }, { sort: "sort_order", limit: 12 })
      .then((page) => {
        if (active) setPhotos(page.items || []);
      })
      .catch(() => {
        if (active) setPhotos([]);
      });
    return () => {
      active = false;
    };
  }, [schoolId]);

  if (photos.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Images className="h-4 w-4 text-primary" />
        <h2 className="text-xl font-semibold">Campus gallery</h2>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <img
              src={schoolImageUrl(photo.storage_path)}
              alt={`${schoolName} campus ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
