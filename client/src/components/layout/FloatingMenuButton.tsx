import { useState } from 'react';
import { Menu, X, Home, Shield, MessageSquare, User, LogOut, Beaker, BellRing } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export const FloatingMenuButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const handleLogout = () => {
    logout.mutate();
    closeMenu();
  };

  // Classes para indicar item de menu ativo
  const activeClass = "bg-primary/20 border-l-4 border-primary text-primary";
  const normalClass = "hover:bg-primary/10 border-l-4 border-transparent";

  return (
    <>
      {/* Botão flutuante para abrir o menu */}
      <button 
        className="fixed top-3 left-3 z-[9990] p-3 bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center"
        onClick={toggleMenu}
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6 mr-2" />
        <span className="font-medium">Menu</span>
      </button>
      
      {/* Overlay para fechar o menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9995]"
          onClick={closeMenu}
        />
      )}
      
      {/* Menu lateral */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[300px] bg-background z-[9999] shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground font-rajdhani">
              <span className="text-primary">SPIDER</span>APP
            </h2>
            <p className="text-xs text-muted-foreground">
              {user ? `Olá, ${user.username}` : 'Bem-vindo!'}
            </p>
          </div>
          <button 
            onClick={closeMenu}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Menu de navegação */}
        <nav className="py-4">
          <ul className="space-y-1 px-2">
            {user && (
              <>
                {/* Itens de menu para usuários logados */}
                <li>
                  <Link href="/">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/' ? activeClass : normalClass}`}>
                      <Home className="mr-3 h-5 w-5" />
                      Dashboard
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/my-reports">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/my-reports' ? activeClass : normalClass}`}>
                      <Shield className="mr-3 h-5 w-5" />
                      Meus Relatórios
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/chat">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/chat' ? activeClass : normalClass}`}>
                      <MessageSquare className="mr-3 h-5 w-5" />
                      Chat
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/profile">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/profile' ? activeClass : normalClass}`}>
                      <User className="mr-3 h-5 w-5" />
                      Perfil
                    </div>
                  </Link>
                </li>
                
                {/* Itens especiais para admin e Spider-Man */}
                {user.isAdmin && (
                  <li>
                    <Link href="/admin">
                      <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/admin' ? activeClass : normalClass}`}>
                        <BellRing className="mr-3 h-5 w-5" />
                        Admin
                      </div>
                    </Link>
                  </li>
                )}
                
                {user.username === 'spiderman' && (
                  <li>
                    <Link href="/spider-lab">
                      <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/spider-lab' ? activeClass : normalClass}`}>
                        <Beaker className="mr-3 h-5 w-5" />
                        Spider Lab
                      </div>
                    </Link>
                  </li>
                )}
              </>
            )}
            
            {/* Itens de menu para usuários não logados */}
            {!user && (
              <>
                <li>
                  <Link href="/login">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/login' ? activeClass : normalClass}`}>
                      <User className="mr-3 h-5 w-5" />
                      Login
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/register">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === '/register' ? activeClass : normalClass}`}>
                      <Shield className="mr-3 h-5 w-5" />
                      Registrar
                    </div>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        
        {/* Rodapé para usuários logados */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sair
            </button>
          </div>
        )}
      </div>
    </>
  );
};