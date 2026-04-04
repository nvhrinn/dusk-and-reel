import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import FloatingDonate from "@/components/FloatingDonate";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Index from "./pages/Index";
import AboutDeveloper from "./pages/AboutDeveloper";
import SearchPage from "./pages/SearchPage";
import AnimeDetail from "./pages/AnimeDetail";
import WatchPage from "./pages/WatchPage";
import SpecialPage from "./pages/SpecialPage";
import MoviePage from "./pages/MoviePage";
import GenresPage from "./pages/GenresPage";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import JoinWhatsAppPopup from "@/components/waPopup";
import Maintenance from "./pages/Maintenance";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const isMaintenance = true;

  if (isMaintenance) {
    return <Maintenance />;
  }

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <FloatingDonate />
          <JoinWhatsAppPopup />
          <ThemeSwitcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutDeveloper />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/special" element={<SpecialPage />} />
            <Route path="/movie" element={<MoviePage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
