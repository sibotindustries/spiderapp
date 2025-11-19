import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type Notification } from "@shared/schema";
import { useMediaQuery } from "@/hooks/use-media-query";
import SidebarMobile from "@/components/SidebarMobile";

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    staleTime: 10000,
  });
  
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;
  
  // Verifica se o usuário é o Homem-Aranha
  const isSpiderman = user && user.username === 'spiderman';

  // Renderiza a versão móvel com sidebar deslizante
  if (isMobile) {
    return <SidebarMobile />;
  }

  // Versão desktop mantém o comportamento original
  return (
    <div className="w-full md:w-16 lg:w-64 bg-card border-r border-primary/20 flex flex-col">
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-center md:justify-start border-b border-primary/20">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <i className="fas fa-spider text-white"></i>
        </div>
        <h1 className="hidden lg:block ml-3 font-rajdhani font-bold text-2xl text-primary">SPIDER-APP</h1>
      </div>

      {/* Navigation Items */}
      <div className="flex md:flex-col flex-row overflow-x-auto md:overflow-x-visible">
        <Link 
          href="/" 
          className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
            location === "/" 
              ? "border-b md:border-b-0 md:border-l-4 border-primary" 
              : "border-b md:border-b-0 md:border-l-0 border-card"
          )}
        >
          <i className={cn("fas fa-map-marked-alt text-xl", location === "/" ? "text-primary" : "text-foreground/70")}></i>
          <span className="hidden lg:block ml-3">Crime Map</span>
        </Link>
        
        <Link 
          href="/my-reports" 
          className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
            location === "/my-reports" 
              ? "border-b md:border-b-0 md:border-l-4 border-primary" 
              : "border-b md:border-b-0 md:border-l-0 border-card"
          )}
        >
          <i className={cn("fas fa-tasks text-xl", location === "/my-reports" ? "text-primary" : "text-foreground/70")}></i>
          <span className="hidden lg:block ml-3">My Reports</span>
        </Link>
        
        {isAdmin && (
          <Link 
            href="/admin" 
            className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
              location === "/admin" 
                ? "border-b md:border-b-0 md:border-l-4 border-primary" 
                : "border-b md:border-b-0 md:border-l-0 border-card"
            )}
          >
            <i className={cn("fas fa-shield-alt text-xl", location === "/admin" ? "text-primary" : "text-foreground/70")}></i>
            <span className="hidden lg:block ml-3">Admin Console</span>
          </Link>
        )}
        
        {isSpiderman && (
          <Link 
            href="/spider-lab" 
            className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
              location === "/spider-lab" 
                ? "border-b md:border-b-0 md:border-l-4 border-primary" 
                : "border-b md:border-b-0 md:border-l-0 border-card"
            )}
          >
            <i className={cn("fas fa-flask text-xl", location === "/spider-lab" ? "text-primary" : "text-foreground/70")}></i>
            <span className="hidden lg:block ml-3">Laboratório</span>
          </Link>
        )}
        
        <button className="p-4 flex items-center justify-center md:justify-start hover:bg-primary/10 border-b md:border-b-0 md:border-l-0 border-card relative">
          <i className="fas fa-bell text-xl text-foreground/70"></i>
          <span className="hidden lg:block ml-3">Notifications</span>
          {unreadNotifications > 0 && (
            <span className="lg:flex hidden ml-auto bg-primary rounded-full w-5 h-5 items-center justify-center text-xs">
              {unreadNotifications}
            </span>
          )}
          {unreadNotifications > 0 && (
            <span className="absolute top-3 right-3 lg:hidden bg-primary w-2 h-2 rounded-full"></span>
          )}
        </button>
        
        <Link 
          href="/chat" 
          className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
            location === "/chat" 
              ? "border-b md:border-b-0 md:border-l-4 border-primary" 
              : "border-b md:border-b-0 md:border-l-0 border-card"
          )}
        >
          <i className={cn("fas fa-comment-alt text-xl", location === "/chat" ? "text-primary" : "text-foreground/70")}></i>
          <span className="hidden lg:block ml-3">Chat</span>
        </Link>
        
        <Link 
          href="/profile" 
          className={cn("p-4 flex items-center justify-center md:justify-start hover:bg-primary/10",
            location === "/profile" 
              ? "border-b md:border-b-0 md:border-l-4 border-primary" 
              : "border-b md:border-b-0 md:border-l-0 border-card"
          )}
        >
          <i className={cn("fas fa-user-cog text-xl", location === "/profile" ? "text-primary" : "text-foreground/70")}></i>
          <span className="hidden lg:block ml-3">Profile</span>
        </Link>
      </div>

      <div className="mt-auto">
        <div className="hidden lg:block p-4 mx-2 my-4 rounded-lg bg-gradient-to-r from-secondary/20 to-primary/20 border border-foreground/10">
          <p className="text-sm font-medium text-foreground/80">Spider-Man response time:</p>
          <div className="mt-2 w-full bg-card rounded-full h-2">
            <div className="bg-gradient-to-r from-secondary to-primary h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
          </div>
          <p className="text-sm mt-1 text-[#ffcc00]">
            <i className="fas fa-bolt"></i> Estimated: 8 minutes
          </p>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-primary/20 flex items-center">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Link href="/profile">
              <i className="fas fa-user text-foreground/70 hover:text-primary"></i>
            </Link>
          </div>
          <div className="hidden lg:block ml-3">
            <Link href="/profile" className="hover:text-primary">
              <p className="font-medium">{user?.username || 'Guest'}</p>
              <p className="text-xs text-foreground/50">{user?.location || 'New York, NY'}</p>
            </Link>
          </div>
          <button 
            onClick={() => logout.mutate()}
            className="hidden lg:block ml-auto text-foreground/50 hover:text-foreground"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
