import { getCrimeTypeColor } from "@/lib/utils";

interface CrimeLegendProps {
  crimeTypeCounts: Record<string, number>;
}

export function CrimeLegend({ crimeTypeCounts }: CrimeLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-card/80 p-3 rounded-lg backdrop-blur-sm border border-foreground/10">
      <h3 className="font-rajdhani font-bold mb-2">Legend</h3>
      {Object.keys(crimeTypeCounts).length === 0 ? (
        <div className="text-sm text-foreground/70">No crimes reported</div>
      ) : (
        Object.entries(crimeTypeCounts).map(([type, count]) => {
          const { marker, text } = getCrimeTypeColor(type);
          return (
            <div key={type} className="flex items-center mb-1">
              <div className={`w-3 h-3 rounded-full ${marker} mr-2`}></div>
              <span className="text-sm">{type} ({count})</span>
            </div>
          );
        })
      )}
    </div>
  );
}
