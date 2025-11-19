import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CrimeCard } from "@/components/crime-card";
import { useCrimes } from "@/hooks/use-crimes";
import { Crime } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MyReports() {
  const { myCrimes } = useCrimes();
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkIfMobile();
    
    // Adicionar listener para redimensionamento de tela
    window.addEventListener('resize', checkIfMobile);
    
    // Limpar o listener quando o componente for desmontado
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const pendingCrimes = myCrimes.data?.filter(crime => 
    crime.status === "Pending" || crime.status === "In Progress"
  ) || [];
  
  const resolvedCrimes = myCrimes.data?.filter(crime => 
    crime.status === "Resolved"
  ) || [];
  
  const cancelledCrimes = myCrimes.data?.filter(crime => 
    crime.status === "Cancelled"
  ) || [];
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-background spider-web-bg relative">
        <Header title="My Reports" subtitle="Track your submitted crime reports" />
        
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto p-4">
            <Tabs defaultValue="all">
              <TabsList className={`grid ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-4'} mb-6 ${isMobile ? 'flex-wrap' : ''}`}>
                <TabsTrigger value="all" className="z-0 relative">All Reports</TabsTrigger>
                <TabsTrigger value="pending" className="z-0 relative">Pending</TabsTrigger>
                <TabsTrigger value="resolved" className="z-0 relative">Resolved</TabsTrigger>
                <TabsTrigger value="cancelled" className="z-0 relative">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {myCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading your reports...</span>
                  </div>
                ) : myCrimes.data?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-foreground/20 rounded-lg">
                    <div className="w-16 h-16 mx-auto bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-clipboard text-foreground/30 text-2xl"></i>
                    </div>
                    <h3 className="font-rajdhani font-bold text-xl mb-2">No Reports Yet</h3>
                    <p className="text-foreground/70 max-w-md mx-auto">
                      You haven't submitted any crime reports yet. Use the "Report Crime" button to report criminal activity in your area.
                    </p>
                  </div>
                ) : (
                  myCrimes.data?.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="space-y-4">
                {myCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading pending reports...</span>
                  </div>
                ) : pendingCrimes.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-clock text-foreground/30 text-3xl mb-2"></i>
                    <p>No pending reports</p>
                  </div>
                ) : (
                  pendingCrimes.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="resolved" className="space-y-4">
                {myCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading resolved reports...</span>
                  </div>
                ) : resolvedCrimes.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-check-circle text-foreground/30 text-3xl mb-2"></i>
                    <p>No resolved reports yet</p>
                  </div>
                ) : (
                  resolvedCrimes.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="cancelled" className="space-y-4">
                {myCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading cancelled reports...</span>
                  </div>
                ) : cancelledCrimes.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-ban text-foreground/30 text-3xl mb-2"></i>
                    <p>No cancelled reports</p>
                  </div>
                ) : (
                  cancelledCrimes.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Bottom Activity Bar */}
        <div className="bg-gradient-to-r from-card to-card/90 border-t border-secondary/20 py-2 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-foreground/70">System online</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#00b4ff] rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-foreground/70">NYPD Connected</span>
              </div>
            </div>
            <div className="text-xs text-foreground/50">
              Miles Morales © Spider-App v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
