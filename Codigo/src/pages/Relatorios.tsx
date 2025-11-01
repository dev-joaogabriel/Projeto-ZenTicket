import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Ticket,
  User,
  Timer
} from "lucide-react";
import { useTickets } from "@/hooks/use-tickets";

// Mock data for reports
const mockReports = {
  semanal: {
    period: "Última Semana",
    totalTickets: 32,
    resolved: 28,
    pending: 4,
    avgResolutionTime: "1.8 horas",
    departments: { "TI": 12, "Financeiro": 8, "RH": 7, "Operações": 5 },
    priorities: { "Crítica": 2, "Alta": 8, "Média": 15, "Baixa": 7 }
  },
  mensal: {
    period: "Janeiro 2024",
    totalTickets: 127,
    resolved: 104,
    pending: 23,
    avgResolutionTime: "2.5 horas",
    departments: { "TI": 45, "Financeiro": 32, "RH": 28, "Operações": 22 },
    priorities: { "Crítica": 8, "Alta": 35, "Média": 52, "Baixa": 32 }
  },
  trimestral: {
    period: "Q4 2023",
    totalTickets: 385,
    resolved: 312,
    pending: 73,
    avgResolutionTime: "3.2 horas",
    departments: { "TI": 140, "Financeiro": 95, "RH": 85, "Operações": 65 },
    priorities: { "Crítica": 25, "Alta": 98, "Média": 162, "Baixa": 100 }
  }
};

// Tickets agora vêm do store (useTickets)

// SLA Rules based on priority and department
const slaRules = {
  "Crítica": { hours: 2, color: "text-red-600" },
  "Alta": { hours: 8, color: "text-orange-600" },
  "Média": { hours: 24, color: "text-yellow-600" },
  "Baixa": { hours: 72, color: "text-green-600" }
};

const departmentColors = [
  "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)]",
  "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]",
  "bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.3)]",
  "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]",
];

const priorityColorsSoft = {
  Crítica: "bg-[hsl(var(--critical-bg))] text-[hsl(var(--critical))] border-[hsl(var(--critical))/0.3]",
  Alta: "bg-[hsl(var(--high-bg))] text-[hsl(var(--high))] border-[hsl(var(--high))/0.3]",
  Média: "bg-[hsl(var(--medium-bg))] text-[hsl(var(--medium))] border-[hsl(var(--medium))/0.3]",
  Baixa: "bg-[hsl(var(--low-bg))] text-[hsl(var(--low))] border-[hsl(var(--low))/0.3]",
} as const;

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useLocalStorage("relatorios:selectedPeriod", "mensal");
  const [selectedDepartment, setSelectedDepartment] = useLocalStorage("relatorios:selectedDepartment", "todos");
  const [activeTab, setActiveTab] = useLocalStorage("relatorios:activeTab", "relatorios");
  const { tickets } = useTickets();

  // Filter reports based on selected period and department
  const getFilteredReport = () => {
    const baseReport = mockReports[selectedPeriod as keyof typeof mockReports];

    if (selectedDepartment === "todos") {
      return baseReport;
    }

    // Filter by department
    const deptKey = selectedDepartment.charAt(0).toUpperCase() + selectedDepartment.slice(1);
    const filteredDepartments = { [deptKey]: baseReport.departments[deptKey] || 0 };
    const totalFiltered = Object.values(filteredDepartments).reduce((acc, val) => acc + val, 0);

    return {
      ...baseReport,
      totalTickets: totalFiltered,
      resolved: Math.round(totalFiltered * 0.8),
      pending: Math.round(totalFiltered * 0.2),
      departments: filteredDepartments
    };
  };

  const report = getFilteredReport();

  // Filter tickets based on department
  const getFilteredTickets = () => {
    if (selectedDepartment === "todos") return tickets;
    const map: Record<string, string> = { ti: "TI", financeiro: "Financeiro", rh: "RH", operacoes: "Operações" };
    const deptName = map[selectedDepartment as keyof typeof map];
    return tickets.filter(ticket => ticket.departamento === deptName);
  };

  // Calculate SLA status
  const getSlaStatus = (ticket: { slaVencimento?: string }) => {
    const now = new Date();
    if (!ticket.slaVencimento) {
      return {
        status: "Normal",
        color: "text-[hsl(var(--low))]",
        bgColor: "bg-card",
      };
    }
    const slaDeadline = new Date(ticket.slaVencimento);
    const hoursUntilSla = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSla < 0) {
      return {
        status: "Vencido",
        color: "text-[hsl(var(--critical))]",
        bgColor: "bg-card",
      };
    }
    if (hoursUntilSla < 2) {
      return {
        status: "Crítico",
        color: "text-[hsl(var(--high))]",
        bgColor: "bg-card",
      };
    }
    if (hoursUntilSla < 8) {
      return {
        status: "Atenção",
        color: "text-[hsl(var(--medium))]",
        bgColor: "bg-card",
      };
    }
    return {
      status: "Normal",
      color: "text-[hsl(var(--low))]",
      bgColor: "bg-card",
    };
  };

  // Get next tickets to attend based on SLA
  const getNextTickets = () => {
    return getFilteredTickets()
      .filter(ticket => ticket.status !== "Resolvido" && ticket.status !== "Fechado")
      .sort((a, b) => new Date(a.slaVencimento ?? 0).getTime() - new Date(b.slaVencimento ?? 0).getTime())
      .slice(0, 5);
  };

  const handleExportReport = () => {
    console.log("Exportando relatório...");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios e Chamados</h1>
          <p className="text-muted-foreground">
            Análise detalhada dos tickets e gestão de atendimentos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Setores</SelectItem>
              <SelectItem value="ti">TI</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="rh">RH</SelectItem>
              <SelectItem value="operacoes">Operações</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExportReport} variant="default">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="todos-chamados">Todos Chamados</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorios" className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total de Tickets</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{report.totalTickets}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
                  +12% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Resolvidos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{report.resolved}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((report.resolved / report.totalTickets) * 100)}% de resolução
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{report.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando atendimento
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Tempo Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{report.avgResolutionTime}</div>
                <p className="text-xs text-muted-foreground">
                  Resolução por ticket
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Department Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Tickets por Setor</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribuição de tickets por departamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(report.departments).map(([dept, count], index) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-foreground/30"></div>
                      <span className="font-medium text-foreground">{dept}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={departmentColors[index % departmentColors.length]}>
                        {count} tickets
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((count / report.totalTickets) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Tickets por Prioridade</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribuição por nível de criticidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(report.priorities).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColorsSoft[priority as keyof typeof priorityColorsSoft]}>
                        {count} tickets
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((count / report.totalTickets) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Opções de Exportação</CardTitle>
              <CardDescription className="text-muted-foreground">
                Exporte relatórios detalhados em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 border-border hover:bg-accent"
                  onClick={handleExportReport}
                >
                  <FileText className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium text-foreground">Relatório PDF</div>
                    <div className="text-xs text-muted-foreground">Resumo executivo</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 border-border hover:bg-accent"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium text-foreground">Planilha Excel</div>
                    <div className="text-xs text-muted-foreground">Dados detalhados</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 border-border hover:bg-accent"
                  onClick={handleExportReport}
                >
                  <Calendar className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium text-foreground">Relatório Mensal</div>
                    <div className="text-xs text-muted-foreground">Análise completa</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos-chamados" className="space-y-6 mt-6">
          {/* Next Tickets Priority */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Timer className="h-5 w-5" />
                Próximos Atendimentos (SLA)
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Chamados ordenados por prioridade de SLA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getNextTickets().map((ticket) => {
                  const sla = getSlaStatus(ticket);
                  return (
                    <div key={ticket.id} className={`p-3 rounded-lg border ${sla.bgColor} border-border`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {ticket.id}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">{ticket.titulo}</p>
                            <p className="text-sm text-muted-foreground">{ticket.usuario} • {ticket.departamento}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColorsSoft[ticket.prioridade as keyof typeof priorityColorsSoft]}>
                            {ticket.prioridade}
                          </Badge>
                          <span className={`text-sm font-medium ${sla.color}`}>
                            {sla.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* All Tickets by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {["Aberto", "Em Andamento", "Pendente", "Resolvido"].map((status) => {
              const statusTickets = getFilteredTickets().filter(ticket => ticket.status === status);
              const statusColors = {
                "Aberto": "border-border bg-card",
                "Em Andamento": "border-border bg-card",
                "Pendente": "border-border bg-card",
                "Resolvido": "border-border bg-card"
              };

              return (
                <Card key={status} className={`${statusColors[status as keyof typeof statusColors]} shadow-sm`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {status}
                    </CardTitle>
                    <CardDescription>
                      {statusTickets.length} chamados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {statusTickets.map((ticket) => (
                        <div key={ticket.id} className="p-2 bg-card rounded border border-border">
                          <div className="text-sm font-medium text-foreground">{ticket.titulo}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.usuario}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge className={priorityColorsSoft[ticket.prioridade as keyof typeof priorityColorsSoft]}>
                              {ticket.prioridade}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{ticket.id}</span>
                          </div>
                        </div>
                      ))}
                      {statusTickets.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Nenhum chamado {status.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* All Tickets Table */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Todos os Chamados</CardTitle>
              <CardDescription className="text-muted-foreground">
                Lista completa com informações de SLA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredTickets().map((ticket) => {
                      const sla = getSlaStatus(ticket);
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id}</TableCell>
                          <TableCell>{ticket.titulo}</TableCell>
                          <TableCell>{ticket.usuario}</TableCell>
                          <TableCell>{ticket.departamento}</TableCell>
                          <TableCell>
                            <Badge className={priorityColorsSoft[ticket.prioridade as keyof typeof priorityColorsSoft]}>
                              {ticket.prioridade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ticket.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${sla.color}`}>
                              {sla.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}