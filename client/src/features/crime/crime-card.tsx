import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Crime, statusTypes } from "@shared/schema";
import { formatDate, getCrimeTypeColor, getStatusColor, getPriorityColor } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { useCrimes } from "@/hooks/use-crimes";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";

interface CrimeCardProps {
  crime: Crime;
  expanded?: boolean;
  onExpand?: (crime: Crime) => void;
}

export function CrimeCard({ crime, expanded = false, onExpand }: CrimeCardProps) {
  const { updateCrime } = useCrimes();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  
  const typeColors = getCrimeTypeColor(crime.crimeType);
  const statusColors = getStatusColor(crime.status);
  const priorityColors = getPriorityColor(crime.priorityLevel);
  
  const handleStatusChange = (newStatus: string) => {
    if (!isAdmin) return;
    
    updateCrime.mutate({
      id: crime.id,
      status: newStatus as any
    });
  };

  // Importamos o hook para usar na navegação para o chat
  const { setActiveCrime } = useChat();

  const handleGoChatClick = () => {
    // Quando o Spider-Man decidir atender o crime, alterar o status e preparar o chat
    if (isAdmin && expanded && crime.status !== "Spider-Man En Route") {
      updateCrime.mutate({
        id: crime.id,
        status: "Spider-Man En Route"
      }, {
        onSuccess: () => {
          // Após atualizar o status, configurar o crime como ativo no chat
          setActiveCrime(crime.id, crime.reportedById);
        }
      });
    }
  };

  return (
    <div className={`crime-report bg-gradient-to-r from-card/80 to-card/60 rounded-lg ${isMobile ? 'p-3 mb-2' : 'p-4 mb-4'} border ${expanded ? 'border-primary/40' : 'border-primary/20'}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className={`inline-block px-2 py-1 ${typeColors.bg} ${typeColors.text} ${isMobile ? 'text-2xs' : 'text-xs'} rounded ${isMobile ? 'mb-1' : 'mb-2'}`}>
            <i className="fas fa-exclamation-circle mr-1"></i> {crime.crimeType}
          </span>
          <h3 className={`font-rajdhani font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{crime.title}</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-foreground/70 mt-1`}>
            {isMobile && crime.description.length > 60 
              ? `${crime.description.substring(0, 60)}...` 
              : crime.description
            }
          </p>
        </div>
        <span className={`${isMobile ? 'text-2xs' : 'text-xs'} text-foreground/50`}>{formatDate(crime.createdAt)}</span>
      </div>
      
      <div className={`flex items-center ${isMobile ? 'mt-2' : 'mt-3'} ${isMobile ? 'text-xs' : 'text-sm'} text-foreground/70`}>
        <i className={`fas fa-map-marker-alt mr-1 ${typeColors.text}`}></i>
        <span>{isMobile && crime.location.length > 25 ? `${crime.location.substring(0, 25)}...` : crime.location}</span>
      </div>
      
      {expanded && (
        <div className="mt-3 flex justify-center">
          {isAdmin && crime.status !== "Spider-Man En Route" ? (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={handleGoChatClick}
            >
              <i className="fas fa-spider mr-2"></i>
              Atender este Crime
            </Button>
          ) : crime.status === "Spider-Man En Route" && (
            <Link to={`/chat/${crime.id}`} onClick={() => setActiveCrime(crime.id, crime.reportedById)}>
              <Button variant="default" size="sm" className="w-full sm:w-auto">
                <i className="fas fa-comment-dots mr-2"></i>
                {isAdmin ? "Conversar com Cidadão" : "Conversar com Spider-Man"}
              </Button>
            </Link>
          )}
        </div>
      )}
      
      <div className={`flex justify-between ${isMobile ? 'mt-2' : 'mt-4'}`}>
        <div className={`flex items-center ${isMobile ? 'space-x-1 flex-wrap' : 'space-x-2'}`}>
          {crime.priorityLevel === "High" && (
            <span className={`flex items-center px-2 py-1 bg-[#ffcc00]/20 text-[#ffcc00] ${isMobile ? 'text-2xs mb-1' : 'text-xs'} rounded-full`}>
              <i className="fas fa-bolt mr-1"></i> {isMobile ? 'High' : 'High Priority'}
            </span>
          )}
          
          <span className={`flex items-center px-2 py-1 ${statusColors.bg} ${statusColors.text} ${isMobile ? 'text-2xs mb-1' : 'text-xs'} rounded-full`}>
            {crime.status === "Spider-Man En Route" ? (
              <i className="fas fa-bolt mr-1"></i>
            ) : crime.status === "Resolved" ? (
              <i className="fas fa-check-circle mr-1"></i>
            ) : crime.status === "In Progress" ? (
              <i className="fas fa-clock mr-1"></i>
            ) : (
              <i className="fas fa-circle mr-1"></i>
            )}
            {crime.status}
          </span>
          
          {crime.photos && crime.photos.length > 0 && (
            <span className={`flex items-center px-2 py-1 bg-foreground/10 text-foreground/70 ${isMobile ? 'text-2xs mb-1' : 'text-xs'} rounded-full`}>
              <i className="fas fa-image mr-1"></i> {crime.photos.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {expanded && isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}>
                  <i className={`fas fa-cog text-foreground/70 ${isMobile ? 'text-xs' : ''}`}></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={crime.status === "Pending"} onClick={() => handleStatusChange("Pending")}>
                  Set as Pending
                </DropdownMenuItem>
                <DropdownMenuItem disabled={crime.status === "In Progress"} onClick={() => handleStatusChange("In Progress")}>
                  Set as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem disabled={crime.status === "Spider-Man En Route"} onClick={() => handleStatusChange("Spider-Man En Route")}>
                  Set as Spider-Man En Route
                </DropdownMenuItem>
                <DropdownMenuItem disabled={crime.status === "Resolved"} onClick={() => handleStatusChange("Resolved")}>
                  Set as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem disabled={crime.status === "Cancelled"} onClick={() => handleStatusChange("Cancelled")}>
                  Set as Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {!expanded && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}
              onClick={() => onExpand?.(crime)}
            >
              <i className={`fas fa-ellipsis-v text-foreground/70 ${isMobile ? 'text-xs' : ''}`}></i>
            </Button>
          )}
        </div>
      </div>
      
      {expanded && crime.photos && crime.photos.length > 0 && (
        <div className={`${isMobile ? 'mt-2' : 'mt-4'} grid grid-cols-2 ${isMobile ? 'gap-1' : 'gap-2'}`}>
          {crime.photos.map((photo, index) => (
            <div key={index} className={`rounded-md overflow-hidden ${isMobile ? 'h-16' : 'h-24'} bg-foreground/5`}>
              <img 
                src={photo} 
                alt={`Evidence for ${crime.title}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
