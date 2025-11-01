import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, User, Calendar, Tag, AlertTriangle } from "lucide-react";
import { useTickets, Ticket as StoreTicket } from "@/hooks/use-tickets";
import { getTicketByNumber } from "@/lib/tickets";

type Ticket = StoreTicket;

const statusColors = {
  "Aberto": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  "Em Andamento": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  "Resolvido": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  "Fechado": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
};

const priorityColors = {
  "Crítica": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  "Alta": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  "Média": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  "Baixa": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
};

export default function VisualizarTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, upsertTicketDetail } = useTickets();
  const [remoteTicket, setRemoteTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const localTicket = useMemo(() => (id ? tickets.find(t => t.id === id) ?? null : null), [tickets, id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) { setLoading(false); return; }
      if (localTicket?.hasFullDetail) {
        setLoading(false);
        return; // já temos detalhe persistido
      }
      setLoading(true);
      setError(null);
      try {
        const t = await getTicketByNumber(id, (full) => {
          upsertTicketDetail({
            id: full.id,
            descricao: full.descricao,
            titulo: full.titulo,
            prioridade: full.prioridade,
            status: full.status,
            usuario: full.usuario,
            departamento: full.departamento,
            dataCriacao: full.dataCriacao,
            dataAtualizacao: full.dataAtualizacao,
            slaVencimento: full.slaVencimento,
            hasFullDetail: true,
          });
        });
        if (!ignore) setRemoteTicket(t);
      } catch (e) {
        if (!ignore) setError("Falha ao carregar chamado do servidor");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, localTicket?.hasFullDetail, upsertTicketDetail]);

  const ticket = remoteTicket ?? localTicket;

  // Fallback: if we have a local ticket without descricao (list mapping), merge remote description once loaded
  if (ticket && remoteTicket && !localTicket?.descricao && remoteTicket.descricao) {
    ticket.descricao = remoteTicket.descricao;
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 space-y-6" aria-busy="true" aria-labelledby="ticket-heading">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-md bg-muted" />
          <div className="space-y-2 w-full max-w-md">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-5 bg-muted rounded w-48" />
                <div className="h-3 bg-muted rounded w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-9 bg-muted rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-5 bg-muted rounded w-56" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-3 bg-muted rounded w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-40" />
                  <div className="h-9 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-semibold mb-2">Chamado não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              {error ?? "O chamado solicitado não existe ou foi removido."}
            </p>
            <Button onClick={() => navigate("/meus-tickets")}>
              Voltar para Meus Chamados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 space-y-6" aria-labelledby="ticket-heading">
      {/* Header / Back */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/meus-tickets")}
            className="shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Voltar para lista de chamados"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Voltar</span>
          </Button>
          <div>
            <h1 id="ticket-heading" className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Visualizar Chamado <span className="text-primary break-all">{ticket.id}</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">Detalhes completos do chamado</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <section className="lg:col-span-2 space-y-6" aria-label="Conteúdo principal do chamado">
          <Card role="region" aria-labelledby="info-title">
            <CardHeader>
              <CardTitle id="info-title">Informações do Chamado</CardTitle>
              <CardDescription>
                Detalhes completos do chamado (somente leitura)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={ticket.titulo}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  data-testid="ticket-descricao"
                  value={ticket.descricao || "(Sem descrição)"}
                  readOnly
                  rows={6}
                  className="bg-muted cursor-not-allowed resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={ticket.departamento}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label id="prioridade-label">Prioridade</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted" aria-labelledby="prioridade-label">
                    <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>
                      {ticket.prioridade}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataCriacao">Data de Criação</Label>
                  <Input
                    id="dataCriacao"
                    value={new Date(ticket.dataCriacao).toLocaleDateString('pt-BR')}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAtualizacao">Última Atualização</Label>
                  <Input
                    id="dataAtualizacao"
                    value={new Date(ticket.dataAtualizacao).toLocaleDateString('pt-BR')}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="historico-title">
            <CardHeader>
              <CardTitle id="historico-title" className="flex items-center gap-2">
                <Clock className="h-5 w-5" aria-hidden="true" />
                Histórico de Comentários
              </CardTitle>
              <CardDescription>
                Acompanhe todas as atualizações do chamado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Comentários não são mantidos na store atual. Se necessário, podemos adicionar depois. */}
                <p className="text-sm text-muted-foreground">Sem comentários.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6" aria-label="Painel lateral de status e informações">
          <Card role="region" aria-labelledby="status-title">
            <CardHeader>
              <CardTitle id="status-title" className="flex items-center gap-2">
                <Tag className="h-5 w-5" aria-hidden="true" />
                Status do Chamado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label id="status-label">Status Atual</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted" aria-labelledby="status-label">
                  <Badge variant="secondary" className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label id="prioridade-side-label">Prioridade</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted" aria-labelledby="prioridade-side-label">
                  <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>
                    {ticket.prioridade}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="solicitante-title">
            <CardHeader>
              <CardTitle id="solicitante-title" className="flex items-center gap-2">
                <User className="h-5 w-5" aria-hidden="true" />
                Informações do Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  value={ticket.usuario}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idChamado">ID do Chamado</Label>
                <Input
                  id="idChamado"
                  value={ticket.id}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50" role="note" aria-label="Modo visualização">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Modo Visualização
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Este chamado está sendo exibido apenas para consulta.
                    Nenhuma alteração pode ser feita.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}