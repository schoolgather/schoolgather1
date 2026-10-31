import { useEffect, useState } from "react";

import { db } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";

const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""));

const applyChange = (current, payload) => {
  if (payload.eventType === "DELETE") {
    return current.filter((school) => school.id !== payload.old.id);
  }
  const next = payload.new;
  const exists = current.some((school) => school.id === next.id);
  const merged = exists
    ? current.map((school) => (school.id === next.id ? next : school))
    : [...current, next];
  return merged.sort(byName);
};

export function useLiveSchools(enabled) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const channel = supabase
      .channel("school-desk-schools")
      .on("postgres_changes", { event: "*", schema: "public", table: "schools" }, (payload) => {
        if (active) setSchools((current) => applyChange(current, payload));
      })
      .subscribe((status) => {
        if (active && status === "CHANNEL_ERROR") {
          setError(new Error("Live updates are unavailable. Refresh the page to try again."));
        }
      });

    db.entities.School.list({ sort: "name", limit: 500 })
      .then(({ items }) => {
        if (active) setSchools(items.slice().sort(byName));
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return { schools, loading, error };
}
