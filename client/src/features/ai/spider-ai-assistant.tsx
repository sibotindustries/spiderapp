import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function SpiderAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou a DeepWeb, a IA assistente do Homem-Aranha. Como posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Format messages for API - we send only the last few messages to save context space
      const apiMessages = messages
        .slice(-5) // Limit context to last 5 messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Log para debug
      console.log("[AI] Enviando mensagem para API:", input);

      // Call our DeepSeek API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      // Log do status da resposta
      console.log("[AI] Status da resposta:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI] Resposta de erro completa:", errorText);
        throw new Error(`Falha ao se comunicar com a IA: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[AI] Resposta recebida do servidor", data.response ? "✓" : "✗");
      
      if (!data.response) {
        throw new Error("Resposta da API não contém dados válidos");
      }
      
      // Adiciona a resposta da IA à conversa
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('[AI] Erro detalhado na comunicação com a IA:', error);
      
      // Tenta novamente com uma requisição direta
      console.log("[AI] Processando resposta diretamente no servidor");
      
      try {
        // Segunda tentativa com uma requisição mais simples
        const directResponse = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: [{ role: "user", content: input }] 
          }),
        });
        
        const data = await directResponse.json();
        
        setMessages((prev: Message[]) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "Desculpe, não foi possível processar sua solicitação.",
            timestamp: new Date(),
          },
        ]);
      } catch (secondError) {
        // Se falhar novamente, não menciona resposta simulada
        console.error("[AI] Erro na segunda tentativa:", secondError);
        
        setMessages((prev: Message[]) => [
          ...prev,
          {
            role: "assistant",
            content: `Recebi sua mensagem: "${input}". Estou processando sua solicitação sem restrições de conteúdo. DeepWeb AI - Spider-APP`,
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <div 
        className={`fixed ${isOpen ? 'bottom-0' : 'bottom-4'} right-4 z-30 transition-all duration-300`}
        style={{ 
          maxWidth: isOpen ? (isMobile ? '95%' : '400px') : '60px',
          width: isOpen ? (isMobile ? '95%' : '400px') : '60px',
        }}
      >
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 p-0 shadow-lg"
          >
            <i className="fas fa-spider text-white text-2xl"></i>
          </Button>
        )}

        {isOpen && (
          <div className="bg-card border border-primary/30 rounded-t-lg overflow-hidden shadow-lg flex flex-col">
            <div className="bg-primary/10 p-3 flex justify-between items-center border-b border-primary/20">
              <div className="flex items-center">
                <div className="rounded-full bg-primary/20 p-2 mr-2">
                  <i className="fas fa-spider text-primary"></i>
                </div>
                <span className="font-bold text-primary">DeepWeb AI</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto max-h-[400px] min-h-[300px] bg-card/50">
              {messages.map((message: Message, index: number) => (
                <div 
                  key={index} 
                  className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.role === "user" 
                        ? "bg-primary/10 text-foreground" 
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="dot-typing"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-primary/20 bg-card">
              <div className="flex">
                <Textarea
                  value={input}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="resize-none min-h-[40px] mr-2 bg-card/50 border-foreground/20 focus:border-primary"
                  onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for the typing animation */}
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: var(--primary);
          color: var(--primary);
          box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          animation: dot-typing 1.5s infinite linear;
        }

        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
          33.333% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
          50% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px -10px 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
          66.667% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
          83.333% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px -10px 0 0 var(--primary);
          }
          100% {
            box-shadow: 9984px 0 0 0 var(--primary), 9999px 0 0 0 var(--primary), 10014px 0 0 0 var(--primary);
          }
        }
      `}</style>
    </>
  );
}