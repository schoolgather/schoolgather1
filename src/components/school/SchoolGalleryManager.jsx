import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { removeSchoolImage, schoolImageUrl, uploadSchoolImage } from "@/lib/schoolImages";

export const MAX_GALLERY_PHOTOS = 12;

export default function SchoolGalleryManager({ school }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.SchoolPhoto.filter({ school_id: school.id }, { sort: "sort_order", limit: MAX_GALLERY_PHOTOS })
      .then((page) => {
        if (active) setPhotos(page.items || []);
      })
      .catch(() => {
        if (active) toast({ title: "Could not load the gallery", variant: "destructive" });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [school.id]);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const room = MAX_GALLERY_PHOTOS - photos.length;
    if (!files.length) return;
    if (room <= 0) {
      toast({ title: "Gallery is full", description: `You can add up to ${MAX_GALLERY_PHOTOS} photos.`, variant: "destructive" });
      return;
    }

    setBusy(true);
    const added = [];
    try {
      for (const file of files.slice(0, room)) {
        const path = await uploadSchoolImage(school.id, file, "gallery");
        added.push(
          await db.entities.SchoolPhoto.create({
            school_id: school.id,
            storage_path: path,
            sort_order: photos.length + added.length,
          }),
        );
      }
      toast({ title: "Photos added", description: "They are now live on your public profile." });
    } catch (error) {
      toast({ title: "Some photos could not be added", description: error.message, variant: "destructive" });
    } finally {
      setPhotos((prev) => [...prev, ...added]);
      setBusy(false);
    }
  };

  const handleRemove = async (photo) => {
    setBusy(true);
    try {
      await db.entities.SchoolPhoto.delete(photo.id);
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      await removeSchoolImage(photo.storage_path);
    } catch (error) {
      toast({ title: "Could not remove the photo", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const canAdd = photos.length < MAX_GALLERY_PHOTOS;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Campus gallery</h3>
          <p className="text-xs text-muted-foreground">
            Up to {MAX_GALLERY_PHOTOS} photos shown on your public profile. {photos.length} of {MAX_GALLERY_PHOTOS} used.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={busy || !canAdd} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {busy ? "Working…" : "Add photos"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
          No gallery photos yet. Add a few to show families your campus.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <img src={schoolImageUrl(photo.storage_path)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(photo)}
                disabled={busy}
                aria-label="Remove photo"
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </section>
  );
}
