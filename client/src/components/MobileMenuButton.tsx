import { useState } from 'react';
import { Menu, X, Home, Shield, MessageSquare, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface MobileMenuButtonProps {
  className?: string;
}

const MobileMenuButton = ({ className }: MobileMenuButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { logout } = useAuth();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    logout.mutate();
    closeMenu();
  };
  
  return (
    <>
      {/* Botão do menu */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-3 bg-primary text-primary-foreground rounded-md shadow-lg flex items-center"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5 mr-2" />
        <span>Menu</span>
      </button>
      
      {/* Overlay - fundo escuro quando o menu está aberto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          onClick={closeMenu}
        />
      )}
      
      {/* Menu lateral */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-background border-r border-border shadow-xl z-[70] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold">
            <span className="text-primary">SPIDER</span>APP
          </h2>
          <button onClick={closeMenu} className="p-2 hover:bg-muted rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <Link href="/">
                <div className={`flex items-center px-4 py-3 rounded-md ${
                  location === '/' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}>
                  <Home className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/my-reports">
                <div className={`flex items-center px-4 py-3 rounded-md ${
                  location === '/my-reports' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}>
                  <Shield className="h-5 w-5 mr-3" />
                  <span>Meus Relatórios</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/chat">
                <div className={`flex items-center px-4 py-3 rounded-md ${
                  location === '/chat' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}>
                  <MessageSquare className="h-5 w-5 mr-3" />
                  <span>Chat</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/profile">
                <div className={`flex items-center px-4 py-3 rounded-md ${
                  location === '/profile' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}>
                  <User className="h-5 w-5 mr-3" />
                  <span>Perfil</span>
                </div>
              </Link>
            </li>
          </ul>
          
          <div className="absolute bottom-4 left-0 right-0 px-2">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center p-3 bg-destructive text-destructive-foreground rounded-md"
              disabled={logout.isPending}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>{logout.isPending ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileMenuButton;