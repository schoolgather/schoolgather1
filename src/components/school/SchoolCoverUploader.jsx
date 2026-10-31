import React, { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { schoolImageUrl, uploadSchoolImage } from "@/lib/schoolImages";

export default function SchoolCoverUploader({ schoolId, value, onChange }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadSchoolImage(schoolId, file, "cover");
      onChange(schoolImageUrl(path));
      toast({ title: "Photo uploaded", description: "Save the profile to publish it." });
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {value ? (
          <img src={value} alt="School cover preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            No cover photo yet
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
