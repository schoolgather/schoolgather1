import { useAuth } from "@/lib/AuthContext";

export function useSession() {
  const { user, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const email = user?.email ? String(user.email).toLowerCase() : null;
  return {
    user,
    email,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isSuperAdmin: user?.role === "admin",
    signIn: () => navigateToLogin(),
    logout,
  };
}

export function isSchoolAdmin(school, email) {
  if (!school || !email) return false;
  return (school.admin_emails || []).some((e) => String(e).toLowerCase() === email);
}

export function mySchools(schools, email) {
  return (schools || []).filter((s) => isSchoolAdmin(s, email));
}

export function initialsOf(name, email) {
  const source = name || email || "";
  const parts = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] || "E").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}