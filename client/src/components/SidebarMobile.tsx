import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, LogOut, User, Home, MessageSquare, Shield, Beaker, BellRing } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { TouchEvent } from 'react';

interface SidebarProps {
  className?: string;
}

const SidebarMobile = ({ className = '' }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Funções para manipulação de gestos de toque
  const handleTouchStart = (e: TouchEvent) => {
    // Quando a sidebar está fechada, aceita toques em qualquer parte da borda esquerda 
    // até 50px da borda para facilitar a abertura
    if (!isOpen && e.touches[0].clientX > 50) return;
    
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging) return;
    setCurrentX(e.touches[0].clientX);
    
    const sidebar = sidebarRef.current;
    const overlay = overlayRef.current;
    if (!sidebar || !overlay) return;
    
    // Calcula o deslocamento da posição inicial
    const diff = currentX - startX;
    
    // Aplica transformação com limites
    if (isOpen) {
      // Quando aberto, permite apenas arrastar para a esquerda (fechando)
      const translateX = Math.min(0, diff);
      sidebar.style.transform = `translateX(${translateX}px)`;
      overlay.style.opacity = `${1 + translateX / 300}`;
    } else {
      // Quando fechado, permite apenas arrastar para a direita (abrindo)
      const translateX = Math.max(0, Math.min(diff, 300));
      sidebar.style.transform = `translateX(${translateX - 300}px)`;
      overlay.style.opacity = `${translateX / 300}`;
    }
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    
    // Determina se deve abrir ou fechar baseado na distância arrastada
    const diff = currentX - startX;
    
    if (isOpen) {
      // Se arrastou para a esquerda mais de 100px enquanto aberto, fecha a sidebar
      if (diff < -100) {
        closeSidebar();
      } else {
        // Volta para o estado aberto
        sidebar.style.transform = 'translateX(0)';
        if (overlayRef.current) overlayRef.current.style.opacity = '1';
      }
    } else {
      // Se arrastou para a direita mais de 70px (reduzido para facilitar abertura) enquanto fechado, abre a sidebar
      if (diff > 70) {
        openSidebar();
      } else {
        // Volta para o estado fechado
        sidebar.style.transform = 'translateX(-100%)';
        if (overlayRef.current) overlayRef.current.style.opacity = '0';
      }
    }
    
    setDragging(false);
  };

  // Funções para controlar a sidebar
  const openSidebar = () => {
    setIsOpen(true);
    document.body.classList.add('overflow-hidden');
  };

  const closeSidebar = () => {
    console.log('Tentando fechar a sidebar');
    setIsOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  // Fecha o menu quando uma rota é alterada
  useEffect(() => {
    closeSidebar();
  }, [location]);

  // Hook para detectar clique fora da sidebar para fechá-la
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manipula o logout
  const handleLogout = () => {
    logout.mutate();
    closeSidebar();
  };
  
  // Manipula o fechamento do menu pelo botão específico
  const handleCloseButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Botão de fechar clicado');
    closeSidebar();
  };

  // Classes para indicar item de menu ativo
  const activeClass = "bg-primary/20 border-l-4 border-primary text-primary";
  const normalClass = "hover:bg-primary/10 border-l-4 border-transparent";

  return (
    <>
      {/* Botão grande e destacado para abrir a sidebar - visível apenas quando está fechada */}
      {!isOpen && (
        <button 
          className="fixed top-4 left-4 z-[9999] p-3 bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center"
          onClick={openSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6 mr-2" />
          <span className="font-medium">Menu</span>
        </button>
      )}
      
      {/* Overlay que aparece atrás da sidebar */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />
      
      {/* Sidebar principal */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 w-[300px] bg-background z-[9999] shadow-xl
                   transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                   ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cabeçalho da sidebar */}
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
            onClick={handleCloseButtonClick}
            className="p-3 bg-destructive text-destructive-foreground rounded-lg shadow-lg flex items-center"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5 mr-2" />
            <span className="font-medium">Fechar</span>
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
        
        {/* Rodapé da sidebar */}
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
        
        {/* Área de arraste para dispositivos com tela sensível ao toque */}
        <div 
          className="absolute top-0 bottom-0 -right-12 w-12"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </>
  );
};

export default SidebarMobile;