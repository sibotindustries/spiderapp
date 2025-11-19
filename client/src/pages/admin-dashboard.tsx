import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CrimeCard } from "@/components/crime-card";
import { useCrimes } from "@/hooks/use-crimes";
import { Crime } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCrimeTypeColor } from "@/lib/utils";


export default function AdminDashboard() {
  const { allCrimes, getCrimesByType, getCrimesByStatus } = useCrimes();
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  
  const crimesByType = getCrimesByType(allCrimes.data);
  const crimesByStatus = getCrimesByStatus(allCrimes.data);
  
  // Get counts by status
  const statusCounts = {
    pending: crimesByStatus["Pending"]?.length || 0,
    inProgress: crimesByStatus["In Progress"]?.length || 0,
    enRoute: crimesByStatus["Spider-Man En Route"]?.length || 0,
    resolved: crimesByStatus["Resolved"]?.length || 0,
  };
  
  // Get counts by type
  const typeCounts = Object.fromEntries(
    Object.entries(crimesByType).map(([type, crimes]) => [type, crimes.length])
  );
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-background spider-web-bg">
        <header className="bg-card border-b border-primary/20 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-rajdhani font-bold">Spider-Man Console</h2>
              <p className="text-foreground/50 text-sm">Monitor and respond to crime reports</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-primary/20 rounded-full text-primary text-sm">
                <i className="fas fa-spider mr-1"></i> Spider-Man Mode
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4">
              <h3 className="text-xs uppercase text-foreground/50 font-medium mb-1">Pending</h3>
              <div className="flex items-end">
                <span className="text-3xl font-rajdhani font-bold">{statusCounts.pending}</span>
                <span className="text-foreground/70 text-sm ml-2 mb-1">reports</span>
              </div>
              <div className="mt-2 w-full bg-background rounded-full h-1.5">
                <div className="bg-foreground/50 h-1.5 rounded-full" style={{width: `${(statusCounts.pending / (allCrimes.data?.length || 1)) * 100}%`}}></div>
              </div>
            </div>
            
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4">
              <h3 className="text-xs uppercase text-foreground/50 font-medium mb-1">In Progress</h3>
              <div className="flex items-end">
                <span className="text-3xl font-rajdhani font-bold">{statusCounts.inProgress}</span>
                <span className="text-foreground/70 text-sm ml-2 mb-1">reports</span>
              </div>
              <div className="mt-2 w-full bg-background rounded-full h-1.5">
                <div className="bg-[#ffcc00] h-1.5 rounded-full" style={{width: `${(statusCounts.inProgress / (allCrimes.data?.length || 1)) * 100}%`}}></div>
              </div>
            </div>
            
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4">
              <h3 className="text-xs uppercase text-foreground/50 font-medium mb-1">En Route</h3>
              <div className="flex items-end">
                <span className="text-3xl font-rajdhani font-bold">{statusCounts.enRoute}</span>
                <span className="text-foreground/70 text-sm ml-2 mb-1">reports</span>
              </div>
              <div className="mt-2 w-full bg-background rounded-full h-1.5">
                <div className="bg-[#00b4ff] h-1.5 rounded-full" style={{width: `${(statusCounts.enRoute / (allCrimes.data?.length || 1)) * 100}%`}}></div>
              </div>
            </div>
            
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4">
              <h3 className="text-xs uppercase text-foreground/50 font-medium mb-1">Resolved</h3>
              <div className="flex items-end">
                <span className="text-3xl font-rajdhani font-bold">{statusCounts.resolved}</span>
                <span className="text-foreground/70 text-sm ml-2 mb-1">reports</span>
              </div>
              <div className="mt-2 w-full bg-background rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${(statusCounts.resolved / (allCrimes.data?.length || 1)) * 100}%`}}></div>
              </div>
            </div>
          </div>
          
          {/* Crime Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4">
              <h3 className="font-rajdhani font-bold mb-4">Crime Type Distribution</h3>
              
              <div className="space-y-3">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{type}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div className={`${getCrimeTypeColor(type).marker} h-2 rounded-full`} style={{width: `${(count / (allCrimes.data?.length || 1)) * 100}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-card/80 border border-primary/20 rounded-lg p-4 lg:col-span-1">
              <h3 className="font-rajdhani font-bold mb-4">Spider-Response Status</h3>
              
              <div className="flex justify-center items-center h-[200px]">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-rajdhani font-bold">{(statusCounts.resolved / (allCrimes.data?.length || 1) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-foreground/70">Response Rate</div>
                    </div>
                  </div>
                  {/* Simple circular progress indicator */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      className="text-background" 
                      strokeWidth="10" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="40" 
                      cx="50" 
                      cy="50" 
                    />
                    <circle 
                      className="text-primary" 
                      strokeWidth="10" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="40" 
                      cx="50" 
                      cy="50" 
                      strokeDasharray={`${(statusCounts.resolved / (allCrimes.data?.length || 1)) * 251.2} 251.2`}
                      strokeDashoffset="0" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Anti-Hacker Security Dashboard removido conforme solicitado */}

          {/* Crimes that need attention */}
          <div className="bg-card/80 border border-primary/20 rounded-lg p-4 mb-6">
            <h3 className="font-rajdhani font-bold mb-4">
              <i className="fas fa-exclamation-triangle text-[#ffcc00] mr-2"></i>
              High Priority Reports
            </h3>
            
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="en-route">En Route</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-4">
                {allCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading crimes...</span>
                  </div>
                ) : crimesByStatus["Pending"]?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                    <p>No pending reports to handle</p>
                  </div>
                ) : (
                  crimesByStatus["Pending"]?.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="in-progress" className="space-y-4">
                {allCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading crimes...</span>
                  </div>
                ) : crimesByStatus["In Progress"]?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                    <p>No reports in progress</p>
                  </div>
                ) : (
                  crimesByStatus["In Progress"]?.map(crime => (
                    <CrimeCard
                      key={crime.id}
                      crime={crime}
                      expanded={selectedCrime?.id === crime.id}
                      onExpand={setSelectedCrime}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="en-route" className="space-y-4">
                {allCrimes.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin mr-2">
                      <i className="fas fa-spinner text-foreground/70"></i>
                    </div>
                    <span>Loading crimes...</span>
                  </div>
                ) : crimesByStatus["Spider-Man En Route"]?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-foreground/20 rounded-lg">
                    <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                    <p>You're not currently en route to any crime</p>
                  </div>
                ) : (
                  crimesByStatus["Spider-Man En Route"]?.map(crime => (
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
