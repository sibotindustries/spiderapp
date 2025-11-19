import { useAuth } from "@/hooks/use-auth";

export function SpidermanStatus() {
  const { isAdmin } = useAuth();
  
  if (isAdmin) {
    return (
      <div className="absolute bottom-4 right-4 bg-gradient-to-r from-secondary/80 to-primary/80 p-3 rounded-lg backdrop-blur-sm border border-foreground/10 max-w-[300px] electric-glow">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full border-2 border-foreground/50 flex items-center justify-center bg-card/50">
            <i className="fas fa-spider text-primary text-xl"></i>
          </div>
          <div className="ml-3">
            <h3 className="font-rajdhani font-bold">Spider-Man</h3>
            <p className="text-xs">You are active as Spider-Man</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-4 right-4 bg-gradient-to-r from-secondary/80 to-primary/80 p-3 rounded-lg backdrop-blur-sm border border-foreground/10 max-w-[300px] electric-glow">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full border-2 border-foreground/50 flex items-center justify-center bg-card/50">
          <i className="fas fa-spider text-primary text-xl"></i>
        </div>
        <div className="ml-3">
          <h3 className="font-rajdhani font-bold">Spider-Man</h3>
          <p className="text-xs">Currently responding to high-priority crime</p>
        </div>
      </div>
    </div>
  );
}
