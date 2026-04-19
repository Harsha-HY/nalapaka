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
      staleTime: 5 * 60 * 1000, // 5 minutes — avoid refetching on every tab switch
      refetchOnWindowFocus: false, // prevent re-fetch when switching tabs
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Manager-only route
function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'manager') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

// Server-only route
function ServerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'server') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

// Kitchen-only route
function KitchenRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'kitchen') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user && role) {
    if (role === 'super_admin') return <Navigate to="/dining-hub" replace />;
    if (role === 'manager') return <Navigate to="/manager" replace />;
    if (role === 'server') return <Navigate to="/server" replace />;
    if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
    return <Navigate to="/menu" replace />;
  }
  
  return <>{children}</>;
}

// Super admin only route
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, roleLoading } = useAuth();
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'super_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <>
    <Routes>
      <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/guest" element={<GuestEntry />} />
      <Route path="/guest/:hotelSlug" element={<GuestEntry />} />
      <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/order-status" element={<ProtectedRoute><OrderStatusPage /></ProtectedRoute>} />
      <Route path="/order-history" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
      <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
      <Route path="/server" element={<ServerRoute><ServerDashboard /></ServerRoute>} />
      <Route path="/kitchen" element={<KitchenRoute><KitchenDashboard /></KitchenRoute>} />
      <Route path="/dining-hub" element={<SuperAdminRoute><DiningHubDashboard /></SuperAdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
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
