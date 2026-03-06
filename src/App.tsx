import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "@/components/Navbar";
import FloatingDonate from "@/components/FloatingDonate";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import AnimeDetail from "./pages/AnimeDetail";
import WatchPage from "./pages/WatchPage";
import ProfilePage from "./pages/ProfilePage";
import AboutDeveloper from "./pages/AboutDeveloper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const GOOGLE_CLIENT_ID = "857783188145-5nehua8s4n3ol7c8r0g0f459fu2bj6k4.apps.googleusercontent.com";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <Navbar />
            <FloatingDonate />
            <ThemeSwitcher />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/watch/:id" element={<WatchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/about" element={<AboutDeveloper />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
