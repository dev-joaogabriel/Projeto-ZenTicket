import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResponsiveSelect from "@/components/ui/responsive-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTickets, Ticket as StoreTicket, TicketStatus } from "@/hooks/use-tickets";
import { getTicketByNumber, updateTicketStatusByNumber } from "@/lib/tickets";

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

export default function EditarTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tickets, updateTicket, upsertTicketDetail } = useTickets();
  const ticket = useMemo(() => tickets.find(t => t.id === id), [tickets, id]);
  const [status, setStatus] = useState<TicketStatus | undefined>(ticket?.status);
  const [loading, setLoading] = useState(false);

  function formatDatePtBr(iso: string) {
    // Evita deslocamentos de timezone: usa apenas a parte de data (YYYY-MM-DD)
    try {
      const datePart = iso?.slice(0, 10); // YYYY-MM-DD
      if (!datePart) return iso;
      const [y, m, d] = datePart.split("-").map((v) => parseInt(v, 10));
      if (!y || !m || !d) return iso;
      const dd = String(d).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      return `${dd}/${mm}/${y}`;
    } catch {
      return iso;
    }
  }

  useEffect(() => {
    // Buscar detalhes completos se não estiver em cache ou se descrição estiver vazia
    if (id && (!ticket || !ticket.hasFullDetail || !ticket.descricao?.trim())) {
      setLoading(true);
      getTicketByNumber(id, upsertTicketDetail)
        .finally(() => setLoading(false));
    }
  }, [ticket, id, upsertTicketDetail]);

  const handleSalvar = async () => {
    if (!id || !status) return;
    try {
      setLoading(true);
      await updateTicketStatusByNumber(id, status);
      updateTicket(id, { status });
      toast({ title: "Chamado atualizado", description: "Status salvo com sucesso." });
    } catch (e) {
      toast({ title: "Falha ao atualizar", description: "Não foi possível salvar o novo status.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/meus-tickets')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Chamado {ticket?.id ?? id}
          </h1>
          <p className="text-muted-foreground mt-2">
            Altere o status e adicione comentários ao chamado
          </p>
        </div>
      </div>

      {!ticket ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{loading ? "Carregando chamado..." : "Chamado não encontrado."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Chamado</CardTitle>
                <CardDescription>
                  Visualize os detalhes do chamado (somente leitura)
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
                    value={ticket.descricao}
                    readOnly
                    rows={4}
                    className="bg-muted cursor-not-allowed resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Input
                      value={ticket.departamento}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                      <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>
                        {ticket.prioridade}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-blue-50/50 dark:bg-blue-950/50 p-3 rounded-md border-l-4 border-blue-400">
                  <p><strong>Nota:</strong> O título, descrição, departamento e prioridade não podem ser alterados após a criação do chamado. Você pode alterar apenas o status e adicionar comentários.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Chamado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status Atual</Label>
                  <ResponsiveSelect
                    value={status}
                    onChange={(v) => setStatus(v as TicketStatus)}
                    placeholder="Selecionar status"
                    title="Selecionar status do chamado"
                    options={[
                      { value: "Aberto", label: "Aberto" },
                      { value: "Em Andamento", label: "Em Andamento" },
                      { value: "Resolvido", label: "Resolvido" },
                      { value: "Fechado", label: "Fechado" },
                    ]}
                  />
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary" className={statusColors[status ?? ticket.status]}>
                    {status ?? ticket.status}
                  </Badge>
                  <Badge variant="secondary" className={priorityColors[ticket.prioridade]}>
                    {ticket.prioridade}
                  </Badge>
                </div>

                <Button onClick={handleSalvar} disabled={loading || !status} className="w-full flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">ID do Chamado</Label>
                  <p className="text-sm text-muted-foreground">{ticket.id}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Usuário</Label>
                  <p className="text-sm text-muted-foreground">{ticket.usuario}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDatePtBr(ticket.dataCriacao)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Última Atualização</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDatePtBr(ticket.dataAtualizacao)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}