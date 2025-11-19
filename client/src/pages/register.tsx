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
import { useAuth } from "@/hooks/use-auth";

// Função para validar a idade mínima de 12 anos
const validateMinAge = (birthdate: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age >= 12;
};

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  birthdate: z.string()
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: "Data de nascimento inválida"
    })
    .refine(val => {
      const date = new Date(val);
      return validateMinAge(date);
    }, {
      message: "Você deve ter no mínimo 12 anos para usar o SpiderAPP"
    }),
  location: z.string().optional(),
});

export default function Register() {
  const { register, registerError } = useAuth();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      birthdate: "",
      location: "São Paulo, Brasil",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate(values);
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
          <p className="text-foreground/70 text-sm text-center">Cadastre-se para reportar crimes e ajudar o Homem-Aranha</p>
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
                        placeholder="Escolha um nome de usuário" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Digite seu email" 
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
                        placeholder="Crie uma senha" 
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
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        placeholder="DD/MM/AAAA" 
                        {...field} 
                        className="bg-card/50 border-foreground/20"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Você deve ter pelo menos 12 anos para usar este aplicativo
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Sua localização em São Paulo" 
                        {...field} 
                        className="bg-card/50 border-foreground/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {registerError && (
                <div className="text-destructive text-sm font-medium">{registerError}</div>
              )}
              
              <Button 
                type="submit" 
                className="w-full font-rajdhani bg-primary hover:bg-primary/90"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Cadastrando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i> Cadastrar
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-center text-sm text-foreground/70">
            Já tem uma conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
