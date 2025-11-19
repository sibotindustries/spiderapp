import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, User, Lock, MapPin } from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, setLocation] = useState(user?.location || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLocationUpdate = async () => {
    if (!location.trim()) {
      toast({
        title: "Erro",
        description: "Localização não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync({ location });
      toast({
        title: "Sucesso",
        description: "Localização atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua localização",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync({ password });
      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso!",
      });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua senha",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Perfil do Usuário</h1>
        
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" size={24} />
                Informações Básicas
              </CardTitle>
              <CardDescription>Suas informações de conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Nome de Usuário</Label>
                  <div className="font-medium border p-2 rounded-md bg-muted">
                    {user.username}
                  </div>
                </div>
                <div>
                  <Label>Status da Conta</Label>
                  <div className="font-medium border p-2 rounded-md bg-muted flex items-center">
                    <Shield className="mr-2" size={16} />
                    {user.isAdmin ? "Administrador" : "Usuário Cidadão"}
                    {user.username === "spiderman" && " (Homem-Aranha)"}
                  </div>
                </div>
                <div>
                  <Label>Membro desde</Label>
                  <div className="font-medium border p-2 rounded-md bg-muted">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="location" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">
              <MapPin className="mr-2" size={16} />
              Localização
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="mr-2" size={16} />
              Senha
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Atualizar Localização</CardTitle>
                <CardDescription>
                  Sua localização ajuda a priorizar os crimes próximos a você
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      placeholder="Digite seu bairro/região"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleLocationUpdate} 
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? "Atualizando..." : "Atualizar Localização"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handlePasswordUpdate} 
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}