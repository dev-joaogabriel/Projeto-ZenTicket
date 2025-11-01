import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Send, User, AlertTriangle, CheckCircle, X, HelpCircle, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { listDepartments } from "@/lib/departments";
import { createTicket } from "@/lib/tickets";
import { useAuth } from "@/hooks/use-auth-hook";
import { analyzeTicket } from "@/lib/ai";

const categories = [
  { value: "hardware", label: "Hardware", description: "Problemas com equipamentos físicos" },
  { value: "software", label: "Software", description: "Problemas com sistemas e aplicações" },
  { value: "perifericos", label: "Periféricos", description: "Mouse, teclado, impressora, etc." },
  { value: "acessos", label: "Acessos", description: "Problemas de login e permissões" }
];

// Removido: subcategorias de Setor TI

const priorities = [
  {
    value: "critica",
    label: "Crítica",
    description: "Sistema parado, produção afetada",
    color: "bg-red-500",
    bgColor: "bg-red-50 border border-red-200 text-red-800"
  },
  {
    value: "alta",
    label: "Alta",
    description: "Funcionalidade importante não funciona",
    color: "bg-orange-500",
    bgColor: "bg-orange-50 border border-orange-200 text-orange-800"
  },
  {
    value: "media",
    label: "Média",
    description: "Problema que pode esperar algumas horas",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50 border border-yellow-200 text-yellow-800"
  },
  {
    value: "baixa",
    label: "Baixa",
    description: "Melhoria ou problema menor",
    color: "bg-green-500",
    bgColor: "bg-green-50 border border-green-200 text-green-800"
  }
];

// mockSuggestions removed in favor of AI suggestions

type Dept = { id: number; name: string };

export default function NovoTicket() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    description: "",
    user: "",
    department: "", // display name only
    email: "",

  });
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const { user: authUser } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiNextAction, setAiNextAction] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [rejectedActions, setRejectedActions] = useState<string[]>([]);

  // Auto-save draft - Heurística 3: Controle e liberdade do usuário
  useEffect(() => {
    const savedDraft = localStorage.getItem('ticket-draft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      setFormData((prev) => ({ ...prev, ...parsed }));
    }
  }, []);

  useEffect(() => {
    if (formData.title || formData.description) {
      localStorage.setItem('ticket-draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['title', 'description', 'category', 'priority', 'department'];
    const completedFields = requiredFields.filter(field => formData[field as keyof typeof formData]);
    setProgress((completedFields.length / requiredFields.length) * 100);
  }, [formData]);

  // Load departments and set user display
  useEffect(() => {
    let ignore = false;
    async function boot() {
      try {
        const list = await listDepartments();
        if (!ignore) setDepartments(list);
      } catch {
        // ignore
      }
      if (authUser && !ignore) {
        const name = authUser.fullName || authUser.email.split("@")[0];
        setFormData((prev) => ({ ...prev, user: name }));
      }
    }
    void boot();
    return () => { ignore = true; };
  }, [authUser]);

  // Validation - Heurística 5: Prevenção de erros
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    } else if (formData.title.length < 5) {
      newErrors.title = "Título deve ter pelo menos 5 caracteres";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória";
    } else if (formData.description.length < 10) {
      newErrors.description = "Descrição deve ter pelo menos 10 caracteres";
    }

    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória";
    }

    if (!formData.priority) {
      newErrors.priority = "Prioridade é obrigatória";
    }

    if (!formData.department) {
      newErrors.department = "Setor é obrigatório";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manual AI analyze triggered by button
  const analyzeNow = async () => {
    const title = formData.title.trim();
    const desc = formData.description.trim();
    if (title.length < 5 || desc.length < 20) {
      toast({ title: "Texto curto", description: "Título e descrição precisam ser mais detalhados.", variant: "destructive" });
      return;
    }
    try {
      setAiLoading(true);
      const res = await analyzeTicket({
        title,
        description: desc,
        doneActions,
        rejectedActions,
        priorSuggestions: suggestions,
      });
      setSuggestions(res.suggestions || []);
      setShowSuggestions((res.suggestions || []).length > 0);
      setAiConfidence(res.confidence ?? null);
      setAiRationale(res.rationale ?? null);
      setAiSource(res.source ?? null);
      setAiNextAction(res.nextAction ?? null);
      setAiQuestions(res.followUpQuestions ?? []);
      if (res.predictedDepartmentId && (res.confidence ?? 0) >= 0.7) {
        const id = Number(res.predictedDepartmentId);
        setDepartmentId(id);
        const name = departments.find(d => d.id === id)?.name ?? res.predictedDepartmentName ?? "";
        setFormData(prev => ({ ...prev, department: name }));
      }
      if (res.priorityHint && !formData.priority) {
        setFormData(prev => ({ ...prev, priority: res.priorityHint! }));
      }
    } catch (e) {
      toast({ title: "Falha ao analisar", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const markDone = (s: string) => {
    if (!doneActions.includes(s)) setDoneActions(prev => [...prev, s]);
    // Iterate to get next steps
    void analyzeNow();
  };
  const markRejected = (s: string) => {
    if (!rejectedActions.includes(s)) setRejectedActions(prev => [...prev, s]);
    // Iterate to avoid repetitions
    void analyzeNow();
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });
  };

  const priorityToApi: Record<string, "Urgent" | "High" | "Normal" | "Low"> = {
    critica: "Urgent",
    alta: "High",
    media: "Normal",
    baixa: "Low",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!departmentId) {
        setErrors((prev) => ({ ...prev, department: "Setor é obrigatório" }));
        setLoading(false);
        return;
      }

      // Call backend
      const created = await createTicket({
        subject: formData.title,
        description: formData.description,
        priority: priorityToApi[formData.priority],
        departmentId: departmentId,
      });

      // Clear draft on successful submission
      localStorage.removeItem('ticket-draft');

      toast({
        title: "Ticket criado com sucesso!",
        description: `Protocolo: ${created.id}. Você receberá atualizações por email.`,
        duration: 5000,
      });

      // Reset form
      setFormData({
        title: "",
        category: "",
        priority: "",
        description: "",
        user: "Admin User",
        department: "",
        email: "",

      });
      setShowSuggestions(false);
      setErrors({});

      navigate("/todos-chamados");
    } catch (error) {
      toast({
        title: "Erro ao criar ticket",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('ticket-draft');
    setFormData({
      title: "",
      category: "",
      priority: "",
      description: "",
      user: "Admin User",
      department: "",
      email: "",

    });
    setErrors({});
    setShowSuggestions(false);
    toast({
      title: "Rascunho limpo",
      description: "Todos os campos foram resetados.",
    });
  };

  const selectedPriority = priorities.find(p => p.value === formData.priority);

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Page Heading centered at the very top */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Abrir Novo Ticket</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Descreva o problema que você está enfrentando e nossa equipe irá ajudá-lo
          </p>
        </div>

        {/* Back action below heading */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Progress indicator - Heurística 1: Visibilidade do status do sistema */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Progresso do formulário</Label>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Preencha todos os campos obrigatórios para continuar
            </p>
          </CardContent>
        </Card>

        {/* Draft Alert */}
        {localStorage.getItem('ticket-draft') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Rascunho salvo automaticamente.</span>
              <Button variant="outline" size="sm" onClick={clearDraft}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Informações do Ticket
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Campos marcados com * são obrigatórios</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription className="text-sm">
                  Preencha os detalhes do problema que você está enfrentando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="user">Usuário</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formData.user}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium flex items-center gap-1">
                        Setor *
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Selecione o setor relacionado ao chamado</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select
                        value={departmentId ? String(departmentId) : ""}
                        onValueChange={(value) => {
                          const id = Number(value);
                          setDepartmentId(id);
                          const name = departments.find(d => d.id === id)?.name ?? "";
                          setFormData({ ...formData, department: name });
                        }}
                      >
                        <SelectTrigger id="department" className={`text-sm ${errors.department ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              <span className="font-medium text-sm">{dept.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-destructive">{errors.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-1">
                      Título do Problema *
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Seja específico e claro. Ex: Impressora HP LaserJet do setor financeiro não imprime</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Impressora não está funcionando"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={errors.title ? 'border-destructive' : ''}
                      required
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium flex items-center gap-1">
                        Categoria *
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Escolha a categoria que melhor descreve seu problema</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category" className={`text-sm justify-between text-left ${errors.category ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div>
                                <div className="font-medium text-sm">{category.label}</div>
                                <div className="text-xs text-muted-foreground">{category.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-1">
                        Prioridade *
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p><strong>Crítica:</strong> Sistema parado, produção afetada</p>
                              <p><strong>Alta:</strong> Funcionalidade importante não funciona</p>
                              <p><strong>Média:</strong> Problema que pode esperar algumas horas</p>
                              <p><strong>Baixa:</strong> Melhoria ou problema menor</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger id="priority" className={`text-sm justify-between text-left ${errors.priority ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${priority.color}`}></div>
                                <div>
                                  <div className="font-medium text-sm">{priority.label}</div>
                                  <div className="text-xs text-muted-foreground hidden sm:inline">
                                    {priority.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-sm text-destructive">{errors.priority}</p>
                      )}
                    </div>
                  </div>

                  {selectedPriority && (
                    <div className={`p-4 rounded-lg ${selectedPriority.bgColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${selectedPriority.color}`}></div>
                        <span className="font-medium">{selectedPriority.label}</span>
                      </div>
                      <p className="text-sm">{selectedPriority.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1">
                      Descrição do Problema *
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inclua: quando o problema começou, frequência, impacto e passos já tentados</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente o problema que você está enfrentando..."
                      value={formData.description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      rows={6}
                      className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/500 caracteres
                      </p>
                      <Button type="button" variant="secondary" size="sm" onClick={analyzeNow} disabled={aiLoading}>
                        {aiLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-muted-foreground/50 border-t-transparent rounded-full animate-spin mr-2" />
                            Analisando...
                          </>
                        ) : (
                          "Analisar com IA"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail para Contato</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/meus-tickets")}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || progress < 100}
                      className="w-full sm:w-auto order-1 sm:order-2 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Abrir Ticket
                          {progress === 100 && <CheckCircle className="h-4 w-4 ml-1 text-green-500" />}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {showSuggestions && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-warning" />
                    Sugestões IA
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {aiLoading && (
                      <>
                        <div className="w-3 h-3 border-2 border-muted-foreground/50 border-t-transparent rounded-full animate-spin" />
                        Analisando...
                      </>
                    )}
                    {!aiLoading && (
                      <>
                        Possíveis soluções baseadas na sua descrição
                        {aiConfidence !== null && (
                          <span className="text-xs text-muted-foreground">Confiança: {Math.round(aiConfidence * 100)}%</span>
                        )}
                        {aiSource && aiSource !== 'heuristic' && (
                          <span className="text-xs text-muted-foreground">Fonte: {aiSource}</span>
                        )}

                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg border border-muted flex items-start justify-between gap-3">
                        <span className="text-sm">{suggestion}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => markDone(suggestion)} title="Marcar como feito">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => markRejected(suggestion)} title="Não ajudou">
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {aiNextAction && (
                      <div className="text-sm text-muted-foreground">
                        Próximo passo sugerido: <span className="font-medium">{aiNextAction}</span>
                      </div>
                    )}
                    {aiQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium">Perguntas de diagnóstico:</div>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {aiQuestions.map((q, i) => (<li key={i}>{q}</li>))}
                        </ul>
                      </div>
                    )}
                    {aiRationale && (
                      <p className="text-xs text-muted-foreground">{aiRationale}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Dicas para um bom ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Seja específico sobre o problema</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Inclua mensagens de erro se houver</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Mencione quando o problema começou</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Descreva o que você estava fazendo</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Informe qual é o impacto no trabalho</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}