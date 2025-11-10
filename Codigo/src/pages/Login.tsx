import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-hook";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetName, setResetName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const ok = await login(email, password);
    if (ok) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Sistema HelpDesk",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Falha ao entrar",
        description: "Verifique suas credenciais",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Simular envio de email de reset
    setResetSent(true);

    // Resetar formulário após 3 segundos
    setTimeout(() => {
      setResetSent(false);
      setShowForgotPassword(false);
      setResetName("");
      setResetEmail("");
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-3 md:p-4">
      <Card className="w-full max-w-sm md:max-w-md">
        <CardHeader className="text-center space-y-4 p-4 md:p-6">
          <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold">Sistema HelpDesk</CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              Faça login para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {!showForgotPassword ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Entrar
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Esqueci a senha
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {!resetSent ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Redefinir Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Preencha os campos abaixo para receber o link de redefinição
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-name">Nome</Label>
                      <Input
                        id="reset-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={resetName}
                        onChange={(e) => setResetName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                    >
                      Enviar
                    </Button>
                  </form>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Voltar ao login
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Email Enviado!</h3>
                  <p className="text-sm text-muted-foreground">
                    O link para redefinição de senha foi enviado para seu email
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-muted-foreground">
            <p>Sistema de Gerenciamento de Tickets</p>
            <p className="text-xs mt-1">v1.0 - Acesso Administrativo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}