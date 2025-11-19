import { useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useLocation, useParams } from 'wouter';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const crimeId = params && params.crimeId ? parseInt(params.crimeId) : undefined;
  const isMobile = useIsMobile();
  
  const { 
    messages, 
    isLoading, 
    message, 
    setMessage, 
    sendMessage, 
    isSending, 
    crime, 
    isChatAvailable,
    chatUnavailableReason,
    clearActiveChat
  } = useChat(crimeId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rola para o final da lista de mensagens quando novas mensagens são adicionadas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'py-0.5 px-2' : 'py-4'}`}>
        <CardTitle className={`${isMobile ? 'text-base' : 'text-xl'} flex ${isMobile ? 'flex-col items-start' : 'items-center'}`}>
          <div className="flex items-center">
            <MessageCircle className={`mr-2 ${isMobile ? 'h-1em w-1em' : 'h-5 w-5'}`} />
            {user?.isAdmin ? 'Chat com Cidadãos' : 'Contato com Spider-Man'}
          </div>
          
          {crime && (
            <span className={`${isMobile ? 'mt-0.5 ml-0' : 'ml-2'} ${isMobile ? 'text-xs' : 'text-sm'} opacity-70 ${isMobile && 'text-wrap break-words max-w-[85%]'}`}>
              {isMobile ? `Crime: ${crime.title}` : `- Crime: ${crime.title}`}
            </span>
          )}
        </CardTitle>
        
        <Link to={user?.isAdmin ? "/admin" : "/"}>
          <Button variant="ghost" size="icon" className={isMobile ? 'h-8 w-8 p-1' : ''}>
            <ArrowLeft className={isMobile ? 'h-0.75rem w-0.75rem' : 'h-4 w-4'} />
          </Button>
        </Link>
      </CardHeader>
      
      <Separator />
      
      <CardContent className={`flex-1 overflow-y-auto ${isMobile ? 'p-0.5rem' : 'p-4'}`}>
        {!isChatAvailable && chatUnavailableReason && (
          <Alert variant="destructive" className="mb-0.75rem text-sm">
            <AlertCircle className={isMobile ? 'h-0.75rem w-0.75rem' : 'h-4 w-4'} />
            <AlertTitle className={isMobile ? 'text-xs' : 'text-base'}>Chat não disponível</AlertTitle>
            <AlertDescription className={isMobile ? 'text-2xs' : 'text-sm'}>
              {chatUnavailableReason}
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-0.75rem">
            <MessageCircle className={`${isMobile ? 'h-1.5rem w-1.5rem mb-0.5rem' : 'h-10 w-10 mb-4'} text-muted-foreground`} />
            <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium`}>Nenhuma mensagem ainda</h3>
            <p className={`${isMobile ? 'text-2xs' : 'text-sm'} text-muted-foreground mt-0.5rem`}>
              {user?.isAdmin 
                ? 'Envie uma mensagem ao cidadão sobre este crime.'
                : 'Envie uma mensagem para o Spider-Man e aguarde uma resposta.'}
            </p>
          </div>
        ) : (
          <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
            {Array.isArray(messages) && messages.map((msg) => {
              // Compatibilidade com ambos os formatos de mensagem (antigo e novo)
              // O formato antigo usa isFromSpiderman, o novo usa fromUserId
              let isFromMe: boolean;
              let avatarName: string;
              
              const isAdmin = user?.isAdmin === true;
              
              if ('fromUserId' in msg) {
                // Novo formato - baseado em ID de usuário
                isFromMe = msg.fromUserId === user?.id;
                
                // Define o avatar baseado em quem enviou a mensagem
                avatarName = isAdmin 
                  ? (isFromMe ? 'SM' : 'C')  // Se for admin: SM para Spider-Man, C para Cidadão
                  : (isFromMe ? 'C' : 'SM'); // Se for cidadão: C para Cidadão, SM para Spider-Man
              } else {
                // Formato antigo - baseado em flag isFromSpiderman
                isFromMe = isAdmin ? msg.isFromSpiderman : !msg.isFromSpiderman;
                avatarName = msg.isFromSpiderman ? 'SM' : 'C';
              }
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className={`${isMobile ? 'h-1.25rem w-1.25rem' : 'h-8 w-8'} ${isFromMe ? 'ml-0.5rem' : 'mr-0.5rem'}`}>
                      <AvatarFallback className={avatarName === 'SM' ? 'bg-red-600 text-white text-xs' : 'text-xs'}>
                        {avatarName}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div 
                        className={`rounded-lg ${isMobile ? 'px-0.5rem py-0.25rem' : 'px-4 py-2'} ${
                          isFromMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary'
                        }`}
                      >
                        <p className={isMobile ? 'text-xs' : ''}>{msg.message}</p>
                      </div>
                      <p className={`${isMobile ? 'text-2xs' : 'text-xs'} text-muted-foreground mt-0.25rem ${isFromMe ? 'text-right' : ''}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { 
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <Separator />
      
      <CardFooter className={isMobile ? 'p-0.5rem' : 'p-4'}>
        <div className="flex w-full items-center space-x-1">
          <Input
            placeholder={isMobile ? "Mensagem..." : "Digite sua mensagem..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || !isChatAvailable}
            className={`flex-1 ${isMobile ? 'text-xs h-7 py-0.5' : ''}`}
          />
          <Button 
            type="submit" 
            onClick={sendMessage} 
            disabled={isSending || !message.trim() || !isChatAvailable}
            className={isMobile ? 'h-7 min-w-7 px-1.5' : ''}
          >
            {isSending ? 
              <Spinner className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} /> : 
              <Send className={isMobile ? 'h-0.75rem w-0.75rem' : 'h-4 w-4'} />
            }
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}