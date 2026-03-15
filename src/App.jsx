import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AudioProvider } from "@/hooks/useAudio";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CustomToastContainer } from "@/components/ui/CustomToast";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SocketProvider } from "@/hooks/useSocket";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AudioProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SocketProvider>
              <TooltipProvider>
                <Toaster />
                <CustomToastContainer />
                <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </HashRouter>
              </TooltipProvider>
            </SocketProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AudioProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);
export default App;
