const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";

import SchoolCard from "@/components/schools/SchoolCard";
import SchoolFilters from "@/components/schools/SchoolFilters";
import { useSearchStore } from "@/lib/store";
import { distanceToSchool, requestOrigin } from "@/lib/geo";
import { useToast } from "@/components/ui/use-toast";
import { SAMPLE_SCHOOLS } from "@/lib/sampleSchools";
import { CURRICULA } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function Schools() {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { origin, radiusKm, setOrigin, setRadiusKm } = useSearchStore();
  const [schools, setSchools] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [filters, setFilters] = useState({
    q: params.get("q") || "",
    curriculum: params.get("curriculum") || "Any",
    maxTuition: 0,
    radiusKm: radiusKm || 25,
    sort: "recommended",
    scholarshipsOnly: false,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.School.filter({ status: "published" }, { sort: "name", limit: 200 })
      .then((page) => {
        if (!active) return;
        const items = page.items && page.items.length > 0 ? page.items : SAMPLE_SCHOOLS;
        setSchools(items);
      })
      .catch(() => {
        if (active) setSchools(SAMPLE_SCHOOLS);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setRadiusKm(filters.radiusKm);
  }, [filters.radiusKm, setRadiusKm]);

  useEffect(() => {
    if (!origin) return;
    const map = {};
    schools.forEach((school) => {
      map[school.id] = distanceToSchool(school, origin);
    });
    setLocations(map);
  }, [origin, schools]);

  const useLocation = async () => {
    setLocating(true);
    try {
      const coords = await requestOrigin();
      setOrigin(coords);
      toast({ title: "Location set", description: "Distances and radius filtering are now active." });
    } catch (error) {
      toast({ title: "Location unavailable", description: error.message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let list = schools.filter((school) => {
      if (filters.curriculum !== "Any" && school.curriculum_type !== filters.curriculum) return false;
      if (filters.maxTuition > 0 && Number(school.tuition_min) > filters.maxTuition) return false;
      if (filters.scholarshipsOnly && !school.scholarship_available) return false;
      if (origin && filters.radiusKm) {
        const km = locations[school.id];
        if (typeof km === "number" && km > filters.radiusKm) return false;
      }
      if (q) {
        const haystack = [
          school.name,
          school.city,
          school.country,
          school.tagline,
          school.curriculum_type,
          ...(school.programs || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (filters.sort === "distance" && origin) {
      list = [...list].sort((a, b) => (locations[a.id] ?? 1e9) - (locations[b.id] ?? 1e9));
    } else if (filters.sort === "tuition_low") {
      list = [...list].sort((a, b) => (a.tuition_min || 0) - (b.tuition_min || 0));
    } else if (filters.sort === "tuition_high") {
      list = [...list].sort((a, b) => (b.tuition_max || 0) - (a.tuition_max || 0));
    } else if (filters.sort === "rating") {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [schools, filters, origin, locations]);

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">School directory</h1>
        <p className="mt-2 text-muted-foreground">
          Compare curricula, tuition and distance before you commit. Up to four schools side by side.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Curriculum:</span>
        <button
          onClick={() => setFilters((prev) => ({ ...prev, curriculum: "Any" }))}
          className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
            filters.curriculum === "Any"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          All Curricula
        </button>
        {CURRICULA.map((c) => (
          <button
            key={c}
            onClick={() => setFilters((prev) => ({ ...prev, curriculum: c }))}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
              filters.curriculum === c
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <SchoolFilters
          filters={filters}
          onChange={setFilters}
          onUseLocation={useLocation}
          onClearLocation={() => {
            setOrigin(null);
            setLocations({});
          }}
          locating={locating}
          hasLocation={Boolean(origin)}
          resultCount={results.length}
        />
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No schools match those filters</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try widening the tuition range, clearing the radius, or searching a different curriculum.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((school) => (
            <SchoolCard key={school.id} school={school} distanceKm={locations[school.id]} />
          ))}
        </div>
      )}
    </div>
  );
}