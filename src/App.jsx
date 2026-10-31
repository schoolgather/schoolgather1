import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import AppShell from '@/components/layout/AppShell';
import Home from '@/pages/Home';
import Schools from '@/pages/Schools';
import SchoolProfile from '@/pages/SchoolProfile';
import Compare from '@/pages/Compare';
import Matcher from '@/pages/Matcher';
import Apply from '@/pages/Apply';
import StudentDashboard from '@/pages/StudentDashboard';
import SchoolDashboard from '@/pages/SchoolDashboard';
import AdminConsole from '@/pages/AdminConsole';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/schools/:id" element={<SchoolProfile />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/match" element={<Matcher />} />
        <Route path="/apply/:schoolId" element={<Apply />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/dashboard/school" element={<SchoolDashboard />} />
        <Route path="/admin" element={<AdminConsole />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App