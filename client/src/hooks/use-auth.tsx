import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: {
    mutate: (credentials: { username: string; password: string }) => void;
    isPending: boolean;
    error: Error | null;
  };
  register: {
    mutate: (userData: any) => void;
    isPending: boolean;
    error: Error | null;
  };
  logout: {
    mutate: () => void;
    isPending: boolean;
    error: Error | null;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get current user
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: Infinity,
  });

  // Login mutation
  const {
    mutate: loginMutate,
    isPending: loginIsPending,
    error: loginError
  } = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return await res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo de volta, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const {
    mutate: registerMutate,
    isPending: registerIsPending,
    error: registerError
  } = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      return await res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const {
    mutate: logoutMutate,
    isPending: logoutIsPending,
    error: logoutError
  } = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao fazer logout",
        description: error.message || "Ocorreu um erro ao fazer logout",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login: {
          mutate: loginMutate,
          isPending: loginIsPending,
          error: loginError,
        },
        register: {
          mutate: registerMutate,
          isPending: registerIsPending,
          error: registerError,
        },
        logout: {
          mutate: logoutMutate,
          isPending: logoutIsPending,
          error: logoutError,
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}