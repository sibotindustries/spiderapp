import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportCrimeModal } from "@/components/report-crime-modal";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    staleTime: 10000,
  });
  
  const hasUnreadNotifications = notifications?.some(n => !n.read) || false;

  return (
    <header className="bg-card border-b border-primary/20 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-rajdhani font-bold">{title}</h2>
          <p className="text-foreground/50 text-sm">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative bg-card hover:bg-card/80 p-2 rounded-full border border-foreground/10">
            <i className="fas fa-bell text-foreground/70"></i>
            {hasUnreadNotifications && (
              <span className="absolute top-0 right-0 bg-primary w-2 h-2 rounded-full"></span>
            )}
          </button>
          <div className="relative">
            <Button 
              onClick={() => setIsReportModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center font-rajdhani"
            >
              <i className="fas fa-plus mr-2"></i> Report Crime
            </Button>
          </div>
        </div>
      </div>
      
      <ReportCrimeModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </header>
  );
}
