import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

export const useCompareStore = create(
  persist(
    (set, get) => ({
      schools: [],
      toggle: (school) => {
        if (!school?.id) return { added: false, full: false };
        const current = get().schools;
        const exists = current.some((s) => s.id === school.id);
        if (exists) {
          set({ schools: current.filter((s) => s.id !== school.id) });
          return { added: false, full: false };
        }
        if (current.length >= MAX_COMPARE) return { added: false, full: true };
        set({ schools: [...current, school] });
        return { added: true, full: false };
      },
      remove: (id) => set({ schools: get().schools.filter((s) => s.id !== id) }),
      clear: () => set({ schools: [] }),
      has: (id) => get().schools.some((s) => s.id === id),
    }),
    { name: "eduroute-compare" }
  )
);

export const useSearchStore = create(
  persist(
    (set) => ({
      origin: null,
      radiusKm: 25,
      setOrigin: (origin) => set({ origin }),
      setRadiusKm: (radiusKm) => set({ radiusKm }),
    }),
    { name: "eduroute-search" }
  )
);

export const COMPARE_LIMIT = MAX_COMPARE;