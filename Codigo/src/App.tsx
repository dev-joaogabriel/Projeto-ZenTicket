import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "./components/layout/Layout";
import { AuthProvider } from "./hooks/use-auth";
import { useAuth } from "./hooks/use-auth-hook";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NovoTicket from "./pages/NovoTicket";
import FAQ from "./pages/FAQ";
import Relatorios from "./pages/Relatorios";
import TodosChamados from "./pages/TodosChamados";
import PesquisarTickets from "./pages/PesquisarTickets";
import EditarTicket from "./pages/EditarTicket";
import VisualizarTicket from "./pages/VisualizarTicket";
import Usuarios from "./pages/Usuarios";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const role = typeof user?.userType === "string" ? user?.userType : String(user?.userType ?? "");
  const isAdmin = role?.toString().toLowerCase() === "admin" || role === "3";
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/novo-ticket" element={
                <PrivateRoute>
                  <Layout>
                    <NovoTicket />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/meus-tickets" element={
                <PrivateRoute>
                  <Layout>
                    <PesquisarTickets />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/editar-ticket/:id" element={
                <PrivateRoute>
                  <Layout>
                    <EditarTicket />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/visualizar-ticket/:id" element={
                <PrivateRoute>
                  <Layout>
                    <VisualizarTicket />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/faq" element={
                <PrivateRoute>
                  <Layout>
                    <FAQ />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/relatorios" element={
                <PrivateRoute>
                  <Layout>
                    <Relatorios />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/todos-chamados" element={
                <PrivateRoute>
                  <Layout>
                    <TodosChamados />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/usuarios" element={
                <PrivateRoute>
                  <AdminRoute>
                    <Layout>
                      <Usuarios />
                    </Layout>
                  </AdminRoute>
                </PrivateRoute>
              } />
              <Route path="/perfil" element={
                <PrivateRoute>
                  <Layout>
                    <Perfil />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/configuracoes" element={
                <PrivateRoute>
                  <Layout>
                    <Configuracoes />
                  </Layout>
                </PrivateRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <PrivateRoute>
                  <Layout>
                    <NotFound />
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
