import { QueryClient, QueryClientConfig } from "@tanstack/react-query";

// Função para obter dados da API
async function defaultQueryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  const endpoint = queryKey[0] as string;
  
  try {
    const response = await fetch(endpoint, {
      credentials: 'include' // Importante para cookies de autenticação
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null; // Usuário não autenticado
      }
      
      throw new Error(response.statusText || "Erro ao buscar dados");
    }
    
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
}

// Opções do queryClient
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

// Cria o queryClient
export const queryClient = new QueryClient(queryClientConfig);

// Tipos para manipulação de erros
interface ApiError extends Error {
  status?: number;
}

// Interface do fetcher
interface GetQueryFnOptions {
  on401?: "throw" | "returnNull";
}

// Função para fazer requisições de API
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  customHeaders: HeadersInit = {}
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    const error: ApiError = new Error(
      response.statusText || "Ocorreu um erro na requisição"
    );
    error.status = response.status;
    throw error;
  }

  return response;
}

// Função para gerar query functions
export function getQueryFn({ on401 = "throw" }: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const endpoint = queryKey[0] as string;
    
    try {
      const response = await apiRequest("GET", endpoint);
      
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      const apiError = error as ApiError;
      
      if (apiError.status === 401 && on401 === "returnNull") {
        return null;
      }
      
      throw error;
    }
  };
}