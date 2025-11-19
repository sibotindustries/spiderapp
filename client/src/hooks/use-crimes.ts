import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Crime, type InsertCrime, type UpdateCrime } from "@shared/schema";

export function useCrimes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const allCrimes = useQuery<Crime[]>({
    queryKey: ['/api/crimes'],
    staleTime: 10000, // 10 seconds
  });

  const myCrimes = useQuery<Crime[]>({
    queryKey: ['/api/my-crimes'],
    staleTime: 10000, // 10 seconds
    retry: false,
  });

  const createCrime = useMutation({
    mutationFn: async (crimeData: InsertCrime) => {
      const res = await apiRequest("POST", "/api/crimes", crimeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crimes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-crimes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Crime reported!",
        description: "Your report has been submitted successfully. Spider-Man is on the case!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error reporting crime",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const updateCrime = useMutation({
    mutationFn: async (crimeData: UpdateCrime) => {
      const res = await apiRequest("PATCH", `/api/crimes/${crimeData.id}`, crimeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crimes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-crimes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Crime updated",
        description: "The crime report has been successfully updated",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating crime",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const getCrimesByType = (crimes: Crime[] | undefined) => {
    if (!crimes) return {};
    
    return crimes.reduce<Record<string, Crime[]>>((acc, crime) => {
      if (!acc[crime.crimeType]) {
        acc[crime.crimeType] = [];
      }
      
      acc[crime.crimeType].push(crime);
      return acc;
    }, {});
  };

  const getCrimesByStatus = (crimes: Crime[] | undefined) => {
    if (!crimes) return {};
    
    return crimes.reduce<Record<string, Crime[]>>((acc, crime) => {
      if (!acc[crime.status]) {
        acc[crime.status] = [];
      }
      
      acc[crime.status].push(crime);
      return acc;
    }, {});
  };

  return {
    allCrimes,
    myCrimes,
    createCrime,
    updateCrime,
    getCrimesByType,
    getCrimesByStatus,
  };
}
