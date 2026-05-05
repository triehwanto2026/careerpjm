import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import TestPage from "./pages/TestPage";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import ActivationCodes from "./pages/admin/ActivationCodes";
import TestInstruments from "./pages/admin/TestInstruments";
import Candidates from "./pages/admin/Candidates";
import Results from "./pages/admin/Results";
import Settings from "./pages/admin/Settings";
import QuestionBuilder from "./pages/admin/QuestionBuilder";
import AnswerKeyManager from "./pages/admin/AnswerKeyManager";
import InterpretationManager from "./pages/admin/InterpretationManager";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/activation-codes" element={<ActivationCodes />} />
            <Route path="/admin/test-instruments" element={<TestInstruments />} />
            <Route path="/admin/test-instruments/:instrumentId/questions" element={<QuestionBuilder />} />
            <Route path="/admin/answer-keys" element={<AnswerKeyManager />} />
            <Route path="/admin/interpretations" element={<InterpretationManager />} />
            <Route path="/admin/candidates" element={<Candidates />} />
            <Route path="/admin/results" element={<Results />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
