import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import AuthPage from "./pages/AuthPage";
import GuestEntry from "./pages/GuestEntry";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderStatusPage from "./pages/OrderStatusPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import ServerDashboard from "./pages/ServerDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import DiningHubDashboard from "./pages/DiningHubDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Manager-only route
function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) return <SpinnerScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'manager') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ServerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) return <SpinnerScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'server') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function KitchenRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) return <SpinnerScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'kitchen') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) return <SpinnerScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'super_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Auth landing — only redirect logged-in STAFF; guests stay public
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) return <SpinnerScreen />;

  if (user && role) {
    if (role === 'super_admin') return <Navigate to="/dining-hub" replace />;
    if (role === 'manager') return <Navigate to="/manager" replace />;
    if (role === 'server') return <Navigate to="/server" replace />;
    if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
    // 'customer' role just falls through to the auth page (or could go to /menu)
  }
  return <>{children}</>;
}

function SpinnerScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

const AppRoutes = () => (
  <Routes>
    {/* Staff login */}
    <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />

    {/* Customer flow — fully public, no auth required */}
    <Route path="/guest" element={<GuestEntry />} />
    <Route path="/guest/:hotelSlug" element={<GuestEntry />} />
    <Route path="/menu" element={<MenuPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/order-status" element={<OrderStatusPage />} />
    <Route path="/order-history" element={<OrderHistoryPage />} />

    {/* Staff dashboards */}
    <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
    <Route path="/server" element={<ServerRoute><ServerDashboard /></ServerRoute>} />
    <Route path="/kitchen" element={<KitchenRoute><KitchenDashboard /></KitchenRoute>} />
    <Route path="/dining-hub" element={<SuperAdminRoute><DiningHubDashboard /></SuperAdminRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
