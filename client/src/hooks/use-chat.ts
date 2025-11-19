import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { ChatMessage, Crime } from '@shared/schema';
import { useAuth } from './use-auth';

// Interface para armazenar o crime ativo no localStorage
interface ActiveChatData {
  crimeId: number;
  userId: number;
}

export function useChat(activeCrimeId?: number) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [localActiveCrimeId, setLocalActiveCrimeId] = useState<number | undefined>(activeCrimeId);
  
  // Carregar os dados de chat ativo do localStorage
  useEffect(() => {
    if (!activeCrimeId) {
      const storedChatData = localStorage.getItem('activeChatData');
      if (storedChatData) {
        try {
          const parsedData: ActiveChatData = JSON.parse(storedChatData);
          setLocalActiveCrimeId(parsedData.crimeId);
        } catch (e) {
          console.error('Erro ao recuperar dados de chat do localStorage:', e);
        }
      }
    }
  }, [activeCrimeId]);
  
  // Crime ativo para contexto de chat
  const { data: crime } = useQuery<Crime>({
    queryKey: ['/api/crimes', localActiveCrimeId],
    enabled: !!localActiveCrimeId,
  });
  
  // Definir o crime ativo para chat
  const setActiveCrime = (crimeId: number, userId: number) => {
    setLocalActiveCrimeId(crimeId);
    localStorage.setItem('activeChatData', JSON.stringify({ crimeId, userId }));
  };
  
  // Limpar o crime ativo
  const clearActiveChat = () => {
    setLocalActiveCrimeId(undefined);
    localStorage.removeItem('activeChatData');
  };

  // Busca as mensagens de chat específicas para este crime
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['/api/chat', localActiveCrimeId],
    queryFn: () => {
      // Se não tiver um crime ativo, retorne lista vazia
      if (!localActiveCrimeId) return [];
      
      // Busca mensagens específicas para este crime
      return apiRequest('GET', `/api/chat?crimeId=${localActiveCrimeId}`);
    },
    enabled: !!user && !!localActiveCrimeId,
  });

  // Determinar o destinatário da mensagem
  const getRecipientUserId = (): number | undefined => {
    if (!user || !crime) return undefined;
    
    // Se for admin (Spider-Man), envia para o usuário que reportou o crime
    if (user.isAdmin) {
      return crime.reportedById;
    } 
    // Se for usuário normal, envia para Spider-Man (admin ID 1)
    else {
      return 1; // Spider-Man ID é 1
    }
  };

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: (messageText: string) => {
      const targetUserId = getRecipientUserId();
      
      if (!targetUserId) {
        throw new Error("Destinatário não identificado");
      }
      
      if (!localActiveCrimeId) {
        throw new Error("Crime não identificado");
      }
      
      const messageData = {
        message: messageText,
        toUserId: targetUserId,
        crimeId: localActiveCrimeId
      };
      
      return apiRequest(
        'POST',
        '/api/chat',
        messageData
      );
    },
    onSuccess: () => {
      // Limpa o campo de mensagem
      setMessage('');
      
      // Atualiza a lista de mensagens
      queryClient.invalidateQueries({ queryKey: ['/api/chat', localActiveCrimeId] });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const sendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }
    
    if (!localActiveCrimeId) {
      toast({
        title: "Chat não iniciado",
        description: "Selecione um crime para iniciar o chat.",
        variant: "destructive", 
      });
      return;
    }
    
    if (crime && crime.status !== "Spider-Man En Route") {
      toast({
        title: "Chat não disponível",
        description: "O chat só fica disponível quando o Spider-Man está a caminho.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(message);
  };

  // Verifica se o chat está disponível
  const isChatAvailable = !!localActiveCrimeId && crime?.status === "Spider-Man En Route";
  
  // Motivo pelo qual o chat não está disponível
  const chatUnavailableReason = !localActiveCrimeId 
    ? "Selecione um crime para iniciar o chat" 
    : crime?.status !== "Spider-Man En Route"
    ? `Chat disponível apenas quando o Spider-Man estiver a caminho. Status atual: ${crime?.status}`
    : null;

  return {
    messages: messages as ChatMessage[],
    isLoading,
    error,
    message,
    setMessage,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    activeCrimeId: localActiveCrimeId,
    setActiveCrime,
    clearActiveChat,
    crime,
    isChatAvailable,
    chatUnavailableReason
  };
}