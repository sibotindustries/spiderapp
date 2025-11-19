import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000); // seconds
  
  if (diff < 60) {
    return `${diff}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)}d ago`;
  } else {
    return d.toLocaleDateString();
  }
}

export function getCrimeTypeColor(crimeType: string): {
  bg: string;
  text: string;
  marker: string;
} {
  switch (crimeType) {
    case "Assault": 
      return { bg: "bg-[#e63022]/20", text: "text-[#e63022]", marker: "bg-[#e63022]" };
    case "Robbery": 
      return { bg: "bg-[#ffcc00]/20", text: "text-[#ffcc00]", marker: "bg-[#ffcc00]" };
    case "Vandalism": 
      return { bg: "bg-[#2626c9]/20", text: "text-[#2626c9]", marker: "bg-[#2626c9]" };
    case "Theft": 
      return { bg: "bg-[#00b4ff]/20", text: "text-[#00b4ff]", marker: "bg-[#00b4ff]" };
    case "Drug Activity": 
      return { bg: "bg-[#9932cc]/20", text: "text-[#9932cc]", marker: "bg-[#9932cc]" };
    case "Suspicious Activity": 
      return { bg: "bg-[#ff6f00]/20", text: "text-[#ff6f00]", marker: "bg-[#ff6f00]" };
    default: 
      return { bg: "bg-foreground/20", text: "text-foreground", marker: "bg-foreground" };
  }
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status) {
    case "Pending": 
      return { bg: "bg-foreground/10", text: "text-foreground/70" };
    case "In Progress": 
      return { bg: "bg-[#ffcc00]/20", text: "text-[#ffcc00]" };
    case "Spider-Man En Route": 
      return { bg: "bg-[#00b4ff]/20", text: "text-[#00b4ff]" };
    case "Resolved": 
      return { bg: "bg-green-500/10", text: "text-green-400" };
    case "Cancelled": 
      return { bg: "bg-destructive/10", text: "text-destructive" };
    default: 
      return { bg: "bg-foreground/10", text: "text-foreground/70" };
  }
}

export function getPriorityColor(priority: string): {
  bg: string;
  text: string;
} {
  switch (priority) {
    case "Low": 
      return { bg: "bg-green-500/10", text: "text-green-400" };
    case "Medium": 
      return { bg: "bg-[#ffcc00]/20", text: "text-[#ffcc00]" };
    case "High": 
      return { bg: "bg-[#e63022]/20", text: "text-[#e63022]" };
    default: 
      return { bg: "bg-foreground/10", text: "text-foreground/70" };
  }
}

export function generateRandomLocation() {
  // Generate random positions for NYC-like map
  const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
  const lng = -74.006 + (Math.random() - 0.5) * 0.1;
  return { lat, lng };
}
