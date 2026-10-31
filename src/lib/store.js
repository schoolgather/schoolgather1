import { create } from "zustand";

export const useCompareStore = create((set, get) => ({
  schools: [],
  toggle: (school) => {
    const { schools } = get();
    const exists = schools.some((s) => s.id === school.id);
    if (exists) {
      set({ schools: schools.filter((s) => s.id !== school.id) });
    } else {
      if (schools.length < 4) {
        set({ schools: [...schools, school] });
      }
    }
  },
  remove: (schoolId) => {
    set({ schools: get().schools.filter((s) => s.id !== schoolId) });
  },
  clear: () => set({ schools: [] }),
}));

export const useSearchStore = create((set) => ({
  origin: null,
  radiusKm: 25,
  setOrigin: (origin) => set({ origin }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
}));
