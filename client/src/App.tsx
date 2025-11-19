import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MyReports from "@/pages/my-reports";
import AdminDashboard from "@/pages/admin-dashboard";
import SpiderLab from "@/pages/spider-lab";
import Profile from "@/pages/profile";
import { ChatPage } from "@/pages/chat";
import NotFound from "@/pages/not-found";
import { SpiderAIAssistant } from "@/components/spider-ai-assistant";
import DeviceInfoDisplay from "@/components/DeviceInfoDisplay";
import MobileMenuButton from "@/components/MobileMenuButton";
import { useAuth } from "@/hooks/use-auth";
// Note: Removemos o AuthProvider pois estamos usando a versão .ts que não tem o Context
import { User } from "@shared/schema";

function AppContent() {
  const [location, setLocation] = useLocation();
  
  // Use o hook simples para gerenciar o estado do usuário
  const { user, isLoadingUser, isAdmin, isSpiderman } = useAuth();

  useEffect(() => {
    // Redirect to login if not logged in and trying to access protected routes
    if (!isLoadingUser && !user && 
        (location === '/' || 
         location === '/my-reports' || 
         location === '/profile' ||
         location === '/admin' ||
         location === '/spider-lab' ||
         location === '/chat')) {
      setLocation('/login');
    }
    
    // Redirect to dashboard if logged in and on auth pages
    if (!isLoadingUser && user && 
        (location === '/login' || 
         location === '/register')) {
      setLocation('/');
    }
    
    // Redirect to dashboard if not admin but trying to access admin page
    if (!isLoadingUser && user && !isAdmin && location === '/admin') {
      setLocation('/');
    }
    
    // Redirect to dashboard if not Spider-Man but trying to access spider lab
    if (!isLoadingUser && user && !isSpiderman && location === '/spider-lab') {
      setLocation('/');
    }
  }, [user, isLoadingUser, isAdmin, isSpiderman, location, setLocation]);
  
  return (
    <>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={Profile} />
        <Route path="/my-reports" component={MyReports} />
        <Route path="/chat/:crimeId" component={ChatPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/spider-lab" component={SpiderLab} />
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
      
      {/* Adiciona o botão de menu móvel em todas as páginas */}
      <MobileMenuButton />
      
      {/* Adiciona o assistente de IA em todas as rotas, exceto login e registro */}
      {user && location !== '/login' && location !== '/register' && (
        <SpiderAIAssistant />
      )}
      {/* DeviceInfoDisplay removido e substituído por logging no console */}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
