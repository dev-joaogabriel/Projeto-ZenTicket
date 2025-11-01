import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ResponsiveSelect from "@/components/ui/responsive-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Ticket as TicketIcon,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTickets } from "@/hooks/use-tickets";
import { listTickets } from "@/lib/tickets";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusColors = {
  "Aberto": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Em Andamento": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Resolvido": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Fechado": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const priorityColors = {
  "Crítica": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Alta": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Média": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Baixa": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
};

const slaColors = {
  "Normal": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Crítico": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Vencido": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

export default function TodosChamados() {
  const navigate = useNavigate();
  const { tickets, replaceAll } = useTickets();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todas");
  const [departmentFilter, setDepartmentFilter] = useState<string>("todos");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await listTickets({ page: 1, pageSize: 100 });
        if (!ignore) replaceAll(res.items);
      } catch {
        if (!ignore) setError("Falha ao carregar chamados");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [replaceAll]);

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticket.prioridade === priorityFilter;
    const matchesDepartment = departmentFilter === "todos" || ticket.departamento === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  }), [tickets, searchTerm, statusFilter, priorityFilter, departmentFilter]);

  const handleViewTicket = (ticketId: string) => {
    navigate(`/visualizar-ticket/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    navigate(`/editar-ticket/${ticketId}`);
  };

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedId) || null, [tickets, selectedId]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    if (openDetail) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [openDetail, isMobile]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Todos os Chamados</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos os Chamados</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os chamados do sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Pesquisa
          </CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar chamados específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título, descrição, usuário ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ResponsiveSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status"
              title="Selecionar status"
              triggerClassName="lg:w-[200px]"
              options={[
                { value: "todos", label: "Todos os Status" },
                { value: "Aberto", label: "Aberto" },
                { value: "Em Andamento", label: "Em Andamento" },
                { value: "Resolvido", label: "Resolvido" },
                { value: "Fechado", label: "Fechado" },
              ]}
            />
            <ResponsiveSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              placeholder="Prioridade"
              title="Selecionar prioridade"
              triggerClassName="lg:w-[200px]"
              options={[
                { value: "todas", label: "Todas as Prioridades" },
                { value: "Crítica", label: "Crítica" },
                { value: "Alta", label: "Alta" },
                { value: "Média", label: "Média" },
                { value: "Baixa", label: "Baixa" },
              ]}
            />
            <ResponsiveSelect
              value={departmentFilter}
              onChange={setDepartmentFilter}
              placeholder="Departamento"
              title="Selecionar departamento"
              triggerClassName="lg:w-[200px]"
              options={[
                { value: "todos", label: "Todos os Departamentos" },
                { value: "TI", label: "TI" },
                { value: "Financeiro", label: "Financeiro" },
                { value: "RH", label: "RH" },
                { value: "Operações", label: "Operações" },
                { value: "Marketing", label: "Marketing" },
                { value: "Vendas", label: "Vendas" },
              ]}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? "Carregando chamados..." : (
              <>Exibindo {filteredTickets.length} de {tickets.length} chamados</>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista para Mobile: cards + drawer de detalhes */}
      <div className="md:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Lista de Chamados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Carregando chamados..." : "Nenhum chamado encontrado com os filtros aplicados"}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="border" role="button" aria-label={`Abrir detalhes do chamado ${ticket.id}`} onClick={() => { setSelectedId(ticket.id); setOpenDetail(true); }}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-mono text-xs text-muted-foreground">{ticket.id}</div>
                        <Badge variant="secondary" className={statusColors[ticket.status]}>{ticket.status}</Badge>
                      </div>
                      <div className="font-medium leading-snug">{ticket.titulo}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> {ticket.usuario}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{ticket.departamento}</span>
                        <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>{ticket.prioridade}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Drawer open={openDetail} onOpenChange={setOpenDetail} shouldScaleBackground>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Detalhes do Chamado</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pt-0 space-y-4">
              {!selectedTicket ? (
                <div className="text-muted-foreground">Selecione um chamado</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{selectedTicket.id}</span>
                    <Badge variant="secondary" className={statusColors[selectedTicket.status]}>{selectedTicket.status}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Título</div>
                    <div className="font-medium">{selectedTicket.titulo}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => { if (selectedTicket) handleViewTicket(selectedTicket.id); }}>Ver</Button>
                    <Button className="flex-1" onClick={() => { if (selectedTicket) handleEditTicket(selectedTicket.id); }}>Editar</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Usuário</div>
                      <div className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> {selectedTicket.usuario}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Departamento</div>
                      <div className="text-sm">{selectedTicket.departamento}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Prioridade</div>
                      <Badge variant="secondary" className={priorityColors[selectedTicket.prioridade]}>{selectedTicket.prioridade}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Data Abertura</div>
                      <div className="text-sm flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(selectedTicket.dataCriacao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  {!!selectedTicket.descricao?.trim() && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Descrição</div>
                      <ScrollArea className="max-h-40 rounded-md border bg-muted/30 p-3">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed pr-2">{selectedTicket.descricao}</div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2">
                <DrawerClose asChild>
                  <Button variant="secondary" className="w-full">Fechar</Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Tabela para Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Lista de Chamados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Data Abertura</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <TicketIcon className="h-8 w-8" />
                        <p>{loading ? "Carregando chamados..." : "Nenhum chamado encontrado com os filtros aplicados"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="truncate font-medium">{ticket.titulo}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.categoria} {ticket.subcategoria ? `- ${ticket.subcategoria}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {ticket.usuario}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.departamento}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[ticket.status]}>{ticket.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>{ticket.prioridade}</Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const now = new Date();
                          const slaDeadline = ticket.slaVencimento ? new Date(ticket.slaVencimento) : undefined;
                          const hoursUntil = slaDeadline ? (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
                          const state = hoursUntil < 0 ? "Vencido" : hoursUntil < 2 ? "Crítico" : "Normal";
                          const colors = {
                            Normal: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                            Crítico: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
                            Vencido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                          } as const;
                          return (
                            <Badge variant="secondary" className={colors[state]}>
                              <div className="flex items-center gap-1">
                                {state === "Normal" && <CheckCircle className="h-3 w-3" />}
                                {state === "Crítico" && <Clock className="h-3 w-3" />}
                                {state === "Vencido" && <AlertCircle className="h-3 w-3" />}
                                {state}
                              </div>
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(ticket.dataCriacao).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditTicket(ticket.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}