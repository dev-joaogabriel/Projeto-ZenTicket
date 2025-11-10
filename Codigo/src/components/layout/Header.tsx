import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Bell, User, Settings, LogOut, Home, HelpCircle, AlertCircle, Clock, CheckCircle, Moon, Sun } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/hooks/use-auth-hook";

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/novo-ticket': 'Novo Ticket',
  '/meus-tickets': 'Meus Tickets',
  '/todos-chamados': 'Todos Chamados',
  '/relatorios': 'Relatórios',
  '/faq': 'FAQ',
  '/usuarios': 'Usuários',
  '/perfil': 'Perfil',
  '/configuracoes': 'Configurações'
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [storedNotifications, setStoredNotifications] = useLocalStorage(
    "notifications",
    [
      {
        id: 1,
        title: "Novo ticket criado",
        message: "Ticket #1234 foi criado por João Silva",
        time: "2 min atrás",
        read: false,
        type: "new",
        priority: "high"
      },
      {
        id: 2,
        title: "Ticket atualizado",
        message: "Status do ticket #1230 alterado para Em Andamento",
        time: "15 min atrás",
        read: false,
        type: "update",
        priority: "medium"
      },
      {
        id: 3,
        title: "Ticket crítico aguardando",
        message: "Ticket #1235 de prioridade crítica aguarda atendimento há 1 hora",
        time: "1 hora atrás",
        read: false,
        type: "critical",
        priority: "critical"
      },
      {
        id: 4,
        title: "Ticket finalizado",
        message: "Ticket #1225 foi finalizado com sucesso",
        time: "2 horas atrás",
        read: true,
        type: "completed",
        priority: "low"
      }
    ]
  )
  const [notifications, setNotifications] = useState(storedNotifications)

  // keep local state in sync with storage changes (e.g. across tabs)
  useEffect(() => {
    setNotifications(storedNotifications)
  }, [storedNotifications])

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalNotifications = notifications.filter(n => n.priority === 'critical' && !n.read);
  const currentRouteName = routeNames[location.pathname] || 'Página não encontrada';

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/dashboard' }];

    if (pathSegments.length > 0 && location.pathname !== '/dashboard') {
      breadcrumbs.push({ name: currentRouteName, path: location.pathname });
    }

    return breadcrumbs;
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
      setStoredNotifications(updated)
      return updated
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }))
      setStoredNotifications(updated)
      return updated
    });
  };

  const getInitials = (nameOrEmail?: string) => {
    if (!nameOrEmail) return "US";
    if (nameOrEmail.includes("@")) return nameOrEmail.split("@")[0].slice(0, 2).toUpperCase();
    const parts = nameOrEmail.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema com segurança.",
    });
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <header className="h-12 md:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 header-safe">
        <div className="flex h-full items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-semibold text-primary text-sm md:text-base truncate">Sistema HelpDesk</div>
              <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">v1.0</div>
            </div>

            {/* Breadcrumb Navigation - Heurística 1: Visibilidade do status do sistema */}
            <Breadcrumb className="hidden lg:flex ml-4">
              <BreadcrumbList>
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === getBreadcrumbs().length - 1 ? (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          onClick={() => navigate(crumb.path)}
                          className="cursor-pointer hover:text-primary"
                        >
                          {crumb.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 md:h-10 md:w-10"
                  aria-label="Alternar tema"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alternar tema</p>
              </TooltipContent>
            </Tooltip>
            {/* Help Button - Heurística 10: Ajuda e documentação */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/faq')}
                  className="hidden sm:flex h-8 w-8 md:h-10 md:w-10"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajuda e FAQ</p>
              </TooltipContent>
            </Tooltip>

            {/* Critical Alert Indicator */}
            {criticalNotifications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive animate-pulse h-8 w-8 md:h-10 md:w-10">
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{criticalNotifications.length} ticket(s) crítico(s) aguardando</p>
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs flex items-center justify-center animate-pulse"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notificações ({unreadCount} não lidas)</p>
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 md:w-80 bg-popover backdrop-blur z-50 border shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={markAllAsRead}
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer transition-colors ${!notification.read ? 'bg-muted/50' : ''
                          } ${notification.priority === 'critical' ? 'border-l-2 border-destructive' : ''
                          }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-1">
                            {notification.type === 'new' && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                            {notification.type === 'update' && (
                              <Clock className="h-4 w-4 text-orange-500" />
                            )}
                            {notification.type === 'critical' && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            {notification.type === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate ${notification.priority === 'critical' ? 'font-semibold text-destructive' : 'font-medium'
                                }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Menu do usuário">
                  <Avatar className="h-8 w-8">
                    {/* If you add avatar URL to user later, render <AvatarImage src={user.avatarUrl} alt={user.name} /> */}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user?.name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover backdrop-blur z-50 border shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || (user?.email?.split("@")[0] ?? "Usuário")}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email ?? "sem-email"}
                    </p>
                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                      Logado
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/perfil')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/configuracoes')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}