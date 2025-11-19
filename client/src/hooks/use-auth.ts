import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type User, type InsertUser } from "@shared/schema";

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: Infinity,
    retryOnMount: false,
    onError: () => {
      // Silently fail since we're checking auth state
    }
  });

  const login = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", { username, password });
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          setLoginError(error.message);
        } else {
          setLoginError("Invalid username or password");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation("/");
      toast({
        title: "Login successful",
        description: "Welcome back to Spider-App!",
        variant: "default",
      });
    }
  });

  const register = useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/auth/register", userData);
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          setRegisterError(error.message);
        } else {
          setRegisterError("Registration failed");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You can now login to your account",
        variant: "default",
      });
      setLocation("/login");
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (updateData: { location?: string; password?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
        variant: "default",
      });
    }
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['/api/auth/me'] });
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "default",
      });
    }
  });

  return {
    user,
    isLoadingUser,
    login,
    loginError,
    register,
    registerError,
    updateProfile,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    isSpiderman: user?.username === "spiderman" || false,
  };
}
