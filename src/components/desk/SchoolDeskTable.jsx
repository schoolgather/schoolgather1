import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const teamLabel = (school) => {
  const count = (school.admin_emails || []).length;
  if (!count) return "Assign team";
  return `${count} officer${count === 1 ? "" : "s"}`;
};

export default function SchoolDeskTable({ schools, onTogglePublish, onEditTeam, onRequestDelete }) {
  return (
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
          {schools.map((school) => {
            const published = school.status === "published";
            return (
              <tr key={school.id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{school.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[school.city, school.country].filter(Boolean).join(", ")}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{school.curriculum_type}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-left text-xs text-primary hover:underline"
                    onClick={() => onEditTeam(school)}
                  >
                    {teamLabel(school)}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge className={published ? "border-0 bg-chart-3/15 text-chart-3" : "border-0 bg-muted text-muted-foreground"}>
                    {published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onTogglePublish(school)}>
                      {published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${school.name}`}
                      onClick={() => onRequestDelete(school)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
