import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CrimeMap } from "@/components/ui/map";
import { useCrimes } from "@/hooks/use-crimes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Crime } from "@shared/schema";

export default function Dashboard() {
  const { allCrimes } = useCrimes();
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-background spider-web-bg">
        <main className="flex-1 overflow-y-auto">
          {/* Map Section - Full Screen */}
          <div className="h-full w-full">
            {allCrimes.isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin mr-0.5rem">
                  <i className={`fas fa-spinner text-foreground/70 ${isMobile ? 'text-base' : 'text-2xl'}`}></i>
                </div>
                <span className={isMobile ? 'text-sm' : ''}>Loading crime map...</span>
              </div>
            ) : (
              <CrimeMap 
                crimes={allCrimes.data || []} 
                onCrimeSelect={(crime) => setSelectedCrime(crime)}
                selectedCrimeId={selectedCrime?.id}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
