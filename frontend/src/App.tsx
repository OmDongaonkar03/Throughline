import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CheckIns from "./pages/CheckIns";
import Posts from "./pages/Posts";
import SamplePosts from "./pages/Samples";
import Tone from "./pages/Tone";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyMail";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

import AuthCallback from './components/AuthCallback';

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Public Pages */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            
            {/* Onboarding Route */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/check-ins"
              element={
                <ProtectedRoute>
                  <CheckIns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/posts"
              element={
                <ProtectedRoute>
                  <Posts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tone"
              element={
                <ProtectedRoute>
                  <Tone />
                </ProtectedRoute>
              }
            />
            <Route
              path="/samples"
              element={
                <ProtectedRoute>
                  <SamplePosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;