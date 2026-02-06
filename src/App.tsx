
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
 import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "./components/ProtectedRoute";
import { I18nProvider } from "@/hooks/useI18n";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import Gallery from "./pages/Gallery";
import Videos from "./pages/Videos";
import Submit from "./pages/Submit";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CryptoTracker from "./pages/CryptoTracker";
import Utilities from "./pages/Utilities";
import Explorer from "./pages/Explorer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/story/:id" element={<StoryDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/crypto" element={<CryptoTracker />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
