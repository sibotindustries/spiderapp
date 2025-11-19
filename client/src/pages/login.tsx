import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { FcGoogle } from "react-icons/fc";

const loginSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Login() {
  const { login, loginError } = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate(values);
  };
  
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background spider-web-bg p-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="web-decoration top-10 left-10"></div>
        <div className="web-decoration top-[30%] right-[20%]"></div>
        <div className="web-decoration bottom-[40%] left-[25%]"></div>
        <div className="web-decoration bottom-[10%] right-[10%]"></div>
      </div>
      
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-md border border-primary/20">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-spider text-white text-2xl"></i>
          </div>
          <CardTitle className="text-2xl font-rajdhani font-bold text-center">SPIDER-APP</CardTitle>
          <p className="text-foreground/70 text-sm text-center">Entre para reportar crimes e ajudar o Homem-Aranha</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu nome de usuário" 
                        {...field} 
                        className="bg-card/50 border-foreground/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite sua senha" 
                        {...field} 
                        className="bg-card/50 border-foreground/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {loginError && (
                <div className="text-destructive text-sm font-medium">{loginError}</div>
              )}
              
              <Button 
                type="submit" 
                className="w-full font-rajdhani bg-primary hover:bg-primary/90"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Entrando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i> Entrar
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-foreground/50">
                  Ou continuar com
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 bg-white text-gray-800 border border-gray-300"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Entrar com Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center flex-col space-y-2">
          <div className="text-center text-sm text-foreground/70">
            Não tem uma conta? <Link href="/register" className="text-primary hover:underline">Cadastre-se</Link>
          </div>
          <div className="text-center text-xs text-foreground/50">
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
