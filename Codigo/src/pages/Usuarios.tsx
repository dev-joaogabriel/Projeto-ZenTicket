import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Edit, Trash2, Shield, User, Users, AlertTriangle, Laptop, Building2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createUser, listUsers, listCustomers, ApiUser } from "@/lib/users";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type UiUsuario = {
  id: number;
  nome: string;
  email: string;
  status: "Ativo" | "Inativo";
  tipo: "Admin" | "Usuário" | "Suporte";
  ultimoAcesso: string | "-";
};

const statusColors = {
  "Ativo": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  "Inativo": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
};

const tipoColors = {
  "Admin": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  "Suporte": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  "Usuário": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
};

export default function Usuarios() {
  const { t, setLocale, locale } = useI18n();
  const [usuarios, setUsuarios] = useState<UiUsuario[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'customers' | 'agents' | 'admins'>('all');
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'cliente' | 'agente' | 'admin'>('cliente');
  const [editingUser, setEditingUser] = useState<UiUsuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ all: number; customers: number; agents: number; admins: number }>({ all: 0, customers: 0, agents: 0, admins: 0 });

  // Form states separados por tipo
  const [clienteForm, setClienteForm] = useState({ firstName: "", lastName: "", email: "", password: "", status: "Ativo" as "Ativo" | "Inativo", department: "" });
  const [agenteForm, setAgenteForm] = useState({ firstName: "", lastName: "", email: "", password: "", status: "Ativo" as "Ativo" | "Inativo", specialization: "", level: 1, isAvailable: true });
  const [adminForm, setAdminForm] = useState({ firstName: "", lastName: "", email: "", password: "", status: "Ativo" as "Ativo" | "Inativo" });

  function mapApiUser(u: ApiUser): UiUsuario {
    const tipo: UiUsuario["tipo"] = u.userType === "Admin" ? "Admin" : u.userType === "Agent" ? "Suporte" : "Usuário";
    return {
      id: u.id,
      nome: u.fullName ?? `${u.firstName} ${u.lastName}`,
      email: u.email,
      status: u.isActive ? "Ativo" : "Inativo",
      tipo,
      ultimoAcesso: u.lastLoginAt ?? "-",
    };
  }

  async function fetchUsers(q?: string) {
    try {
      setLoading(true);
      if (viewMode === 'customers') {
        const res = await listCustomers({ page: 1, pageSize: 200, q });
        setUsuarios(res.items.map(mapApiUser));
        setTotal(res.total);
      } else if (viewMode === 'agents') {
        const res = await listUsers({ page: 1, pageSize: 200, q });
        const mapped = res.items.map(mapApiUser).filter(u => u.tipo === 'Suporte');
        setUsuarios(mapped);
        setTotal(mapped.length);
      } else if (viewMode === 'admins') {
        const res = await listUsers({ page: 1, pageSize: 200, q });
        const mapped = res.items.map(mapApiUser).filter(u => u.tipo === 'Admin');
        setUsuarios(mapped);
        setTotal(mapped.length);
      } else {
        const res = await listUsers({ page: 1, pageSize: 50, q });
        setUsuarios(res.items.map(mapApiUser));
        setTotal(res.total);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Falha ao carregar usuários");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Debounce busca
  useEffect(() => {
    const h = setTimeout(() => {
      const q = searchTerm.trim();
      fetchUsers(q.length > 0 ? q : undefined);
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Fetch counters independent of view mode
  useEffect(() => {
    const h = setTimeout(async () => {
      try {
        const q = searchTerm.trim();
        const [allRes, custRes] = await Promise.all([
          listUsers({ page: 1, pageSize: 500, q: q || undefined }),
          listCustomers({ page: 1, pageSize: 500, q: q || undefined }),
        ]);
        const mappedAll = allRes.items.map(mapApiUser);
        const agents = mappedAll.filter(u => u.tipo === 'Suporte').length;
        const admins = mappedAll.filter(u => u.tipo === 'Admin').length;
        setCounts({ all: allRes.total ?? mappedAll.length, customers: custRes.total ?? custRes.items.length, agents, admins });
      } catch {
        // ignore counters failure
      }
    }, 250);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredUsuarios = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || String(u.id).toLowerCase().includes(q));
  }, [usuarios, searchTerm]);

  const handleCreateUser = async () => {
    try {
      type CreateUserInput = Parameters<typeof createUser>[0];
      let payload: CreateUserInput;
      if (activeTab === 'cliente') {
        payload = { firstName: clienteForm.firstName, lastName: clienteForm.lastName, email: clienteForm.email, password: clienteForm.password, userType: 'Customer', isActive: clienteForm.status === 'Ativo', department: clienteForm.department || undefined };
      } else if (activeTab === 'agente') {
        payload = { firstName: agenteForm.firstName, lastName: agenteForm.lastName, email: agenteForm.email, password: agenteForm.password, userType: 'Agent', isActive: agenteForm.status === 'Ativo', specialization: agenteForm.specialization || undefined, level: agenteForm.level || 1, isAvailable: agenteForm.isAvailable };
      } else {
        payload = { firstName: adminForm.firstName, lastName: adminForm.lastName, email: adminForm.email, password: adminForm.password, userType: 'Admin', isActive: adminForm.status === 'Ativo' };
      }
      const created = await createUser(payload);
      setUsuarios((prev) => [...prev, mapApiUser(created)]);
      setClienteForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo", department: "" });
      setAgenteForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo", specialization: "", level: 1, isAvailable: true });
      setAdminForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo" });
      toast.success(`Usuário ${created.fullName} foi criado com sucesso.`);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Falha ao criar usuário");
      toast.error(msg);
    }
  };

  const handleEditUser = (user: UiUsuario) => {
    setEditingUser(user);
    toast.info("Edição de usuário será adicionada em breve.");
  };

  const handleDeleteUser = (id: number, userName: string) => {
    toast.info("Remoção/desativação será adicionada em breve.");
  };

  const resetForm = () => {
    setEditingUser(null);
    setClienteForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo", department: "" });
    setAgenteForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo", specialization: "", level: 1, isAvailable: true });
    setAdminForm({ firstName: "", lastName: "", email: "", password: "", status: "Ativo" });
    setActiveTab('cliente');
  };

  function extractErrorMessage(err: unknown, fallback = "Erro") {
    if (!err || typeof err !== 'object') return fallback;
    const maybe = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    return typeof maybe === 'string' ? maybe : fallback;
  }

  // Simple validators
  const isEmail = (v: string) => /.+@.+\..+/.test(v);
  const hasMin = (v: string, n: number) => v.trim().length >= n;
  const clienteValid = hasMin(clienteForm.firstName, 1) && hasMin(clienteForm.lastName, 1) && isEmail(clienteForm.email) && hasMin(clienteForm.password, 6);
  const agenteValid = hasMin(agenteForm.firstName, 1) && hasMin(agenteForm.lastName, 1) && isEmail(agenteForm.email) && hasMin(agenteForm.password, 6) && Number(agenteForm.level) >= 1 && Number(agenteForm.level) <= 5;
  const adminValid = hasMin(adminForm.firstName, 1) && hasMin(adminForm.lastName, 1) && isEmail(adminForm.email) && hasMin(adminForm.password, 6);
  const isCreateValid = activeTab === 'cliente' ? clienteValid : activeTab === 'agente' ? agenteValid : adminValid;

  return (
    <div className="p-6 space-y-6">
      <div className={`grid gap-6 ${showCreatePanel ? 'lg:grid-cols-2' : ''}`}>
        {showCreatePanel && (
          <Card id="create-user-panel" className="self-start animate-in fade-in-50 slide-in-from-top-2 lg:slide-in-from-left-2">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('users.create.header')}
              </CardTitle>
              <CardDescription>{t('users.create.choose')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" className="min-h-[44px]" variant={activeTab === 'cliente' ? 'default' : 'outline'} onClick={() => setActiveTab('cliente')}>{t('users.types.customer')}</Button>
                <Button size="sm" className="min-h-[44px]" variant={activeTab === 'agente' ? 'default' : 'outline'} onClick={() => setActiveTab('agente')}>{t('users.types.agent')}</Button>
                <Button size="sm" className="min-h-[44px]" variant={activeTab === 'admin' ? 'default' : 'outline'} onClick={() => setActiveTab('admin')}>{t('users.types.admin')}</Button>
              </div>
              {activeTab === 'cliente' && (
                <div className="space-y-4">
                  <div className="rounded-md border p-3 bg-muted/40 flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Clientes abrem tickets; departamento é opcional.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t('users.form.name')}</Label><Input value={clienteForm.firstName} onChange={(e)=>setClienteForm({...clienteForm, firstName:e.target.value})} placeholder="Ex: João" /></div>
                    <div className="space-y-2"><Label>{t('users.form.surname')}</Label><Input value={clienteForm.lastName} onChange={(e)=>setClienteForm({...clienteForm, lastName:e.target.value})} placeholder="Ex: Silva" /></div>
                  </div>
                  <div className="space-y-2"><Label>{t('users.form.email')}</Label><Input type="email" value={clienteForm.email} onChange={(e)=>setClienteForm({...clienteForm, email:e.target.value})} placeholder="cliente@exemplo.com" /></div>
                  <div className="space-y-2"><Label>{t('users.form.password')}</Label><Input type="password" value={clienteForm.password} onChange={(e)=>setClienteForm({...clienteForm, password:e.target.value})} placeholder="Defina uma senha" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t('users.form.status')}</Label><Select value={clienteForm.status} onValueChange={(v:'Ativo'|'Inativo')=>setClienteForm({...clienteForm,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>{t('users.form.department')}</Label><Input value={clienteForm.department} onChange={(e)=>setClienteForm({...clienteForm, department:e.target.value})} placeholder="Ex: Financeiro" /></div>
                  </div>
                </div>
              )}
              {activeTab === 'agente' && (
                <div className="space-y-4">
                  <div className="rounded-md border p-3 bg-muted/40 flex items-start gap-3">
                    <Laptop className="h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Defina especialização, nível e disponibilidade.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t('users.form.name')}</Label><Input value={agenteForm.firstName} onChange={(e)=>setAgenteForm({...agenteForm, firstName:e.target.value})} /></div>
                    <div className="space-y-2"><Label>{t('users.form.surname')}</Label><Input value={agenteForm.lastName} onChange={(e)=>setAgenteForm({...agenteForm, lastName:e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t('users.form.email')}</Label><Input type="email" value={agenteForm.email} onChange={(e)=>setAgenteForm({...agenteForm, email:e.target.value})} /></div>
                  <div className="space-y-2"><Label>{t('users.form.password')}</Label><Input type="password" value={agenteForm.password} onChange={(e)=>setAgenteForm({...agenteForm, password:e.target.value})} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>{t('users.form.status')}</Label><Select value={agenteForm.status} onValueChange={(v:'Ativo'|'Inativo')=>setAgenteForm({...agenteForm,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>{t('users.form.specialization')}</Label><Input value={agenteForm.specialization} onChange={(e)=>setAgenteForm({...agenteForm, specialization:e.target.value})} placeholder="Redes" /></div>
                    <div className="space-y-2"><Label>{t('users.form.level')}</Label><Input type="number" min={1} max={5} value={agenteForm.level} onChange={(e)=>setAgenteForm({...agenteForm, level:Number(e.target.value)})} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t('users.form.available')}</Label><Select value={agenteForm.isAvailable?'true':'false'} onValueChange={(v:'true'|'false')=>setAgenteForm({...agenteForm,isAvailable:v==='true'})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div>
                </div>
              )}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="rounded-md border p-3 bg-muted/40 flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Administradores possuem acesso total ao sistema.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t('users.form.name')}</Label><Input value={adminForm.firstName} onChange={(e)=>setAdminForm({...adminForm, firstName:e.target.value})} /></div>
                    <div className="space-y-2"><Label>{t('users.form.surname')}</Label><Input value={adminForm.lastName} onChange={(e)=>setAdminForm({...adminForm, lastName:e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t('users.form.email')}</Label><Input type="email" value={adminForm.email} onChange={(e)=>setAdminForm({...adminForm, email:e.target.value})} /></div>
                  <div className="space-y-2"><Label>{t('users.form.password')}</Label><Input type="password" value={adminForm.password} onChange={(e)=>setAdminForm({...adminForm, password:e.target.value})} /></div>
                  <div className="space-y-2"><Label>{t('users.form.status')}</Label><Select value={adminForm.status} onValueChange={(v:'Ativo'|'Inativo')=>setAdminForm({...adminForm,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select></div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button className="min-h-[44px]" variant="outline" onClick={() => { setShowCreatePanel(false); resetForm(); }}>{t('common.cancel')}</Button>
                <Button className="min-h-[44px]" disabled={!isCreateValid} aria-disabled={!isCreateValid} onClick={editingUser ? () => toast.info('Atualização em breve') : handleCreateUser}>{editingUser ? t('common.update') : t('common.create')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card role="region" aria-labelledby="lista-usuarios-title">
          <CardHeader className="sticky top-0 z-10 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <CardTitle id="lista-usuarios-title" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{t('users.list.title')}</span>
              <span className="sr-only"> – seção</span>
            </CardTitle>
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <nav aria-label="Filtros de usuários" className="min-w-0 max-w-full overflow-x-auto">
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(v) => v && setViewMode(v as typeof viewMode)}
                    className="min-w-max whitespace-nowrap flex-nowrap"
                  >
                    <ToggleGroupItem value="all" aria-label="Mostrar todos" className="px-3 py-1.5 text-sm min-h-[44px]">
                      <Users className="mr-1 h-4 w-4" /> {t('users.filters.all')} ({counts.all})
                    </ToggleGroupItem>
                    <ToggleGroupItem value="customers" aria-label="Mostrar clientes" className="px-3 py-1.5 text-sm min-h-[44px]">
                      <User className="mr-1 h-4 w-4" /> {t('users.filters.customers')} ({counts.customers})
                    </ToggleGroupItem>
                    <ToggleGroupItem value="agents" aria-label="Mostrar agentes" className="px-3 py-1.5 text-sm min-h-[44px]">
                      <Wrench className="mr-1 h-4 w-4" /> {t('users.filters.agents')} ({counts.agents})
                    </ToggleGroupItem>
                    <ToggleGroupItem value="admins" aria-label="Mostrar administradores" className="px-3 py-1.5 text-sm min-h-[44px]">
                      <Shield className="mr-1 h-4 w-4" /> {t('users.filters.admins')} ({counts.admins})
                    </ToggleGroupItem>
                  </ToggleGroup>
                </nav>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showCreatePanel ? 'secondary' : 'outline'}
                        size="sm"
                        className="ml-auto min-h-[44px]"
                        onClick={() => setShowCreatePanel(v => !v)}
                        aria-pressed={showCreatePanel}
                        aria-expanded={showCreatePanel}
                        aria-controls="create-user-panel"
                      >
                        <UserPlus className="h-4 w-4" />
                        {showCreatePanel ? t('users.actions.close') : t('users.actions.create')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent> {showCreatePanel ? t('users.actions.close') : t('users.actions.create')} </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Locale switch */}
                <div className="ml-2">
                  <Select value={locale} onValueChange={(v: 'pt' | 'en') => setLocale(v)}>
                    <SelectTrigger className="w-[96px] min-h-[44px]">
                      <SelectValue placeholder="Idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">PT</SelectItem>
                      <SelectItem value="en">EN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription role="status" aria-live="polite">
                {loading ? t('users.loading') : t('users.total', { count: total })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4" aria-busy={loading}>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input aria-label={t('users.search.placeholder')} placeholder={t('users.search.placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
            </div>
            {/* Desktop/tablet table */}
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.table.id')}</TableHead>
                  <TableHead>{t('users.table.name')}</TableHead>
                  <TableHead>{t('users.table.email')}</TableHead>
                  <TableHead>{t('users.table.type')}</TableHead>
                  <TableHead>{t('users.table.status')}</TableHead>
                  <TableHead>{t('users.table.lastAccess')}</TableHead>
                  <TableHead>{t('users.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {usuario.nome}
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={tipoColors[usuario.tipo]}>
                        <Shield className="h-3 w-3 mr-1" />
                        {usuario.tipo === 'Usuário' ? 'Cliente' : usuario.tipo === 'Suporte' ? 'Agente' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[usuario.status]}>
                        {usuario.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.ultimoAcesso !== "-" && typeof usuario.ultimoAcesso === "string" ? new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR') : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(usuario)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário <strong>{usuario.nome}</strong>?
                                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(usuario.id, usuario.nome)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden grid gap-3">
              {filteredUsuarios.map((u) => (
                <div key={u.id} className="rounded-lg border p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{u.nome}</div>
                        <div className="text-xs text-muted-foreground">#{u.id} • {u.email}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={tipoColors[u.tipo]}>
                      {u.tipo === 'Usuário' ? 'Cliente' : u.tipo === 'Suporte' ? 'Agente' : 'Admin'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary" className={statusColors[u.status]}>
                      {u.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(u)} aria-label={`Editar ${u.nome}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" aria-label={`Excluir ${u.nome}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Confirmar exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário <strong>{u.nome}</strong>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(u.id, u.nome)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Sim, excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredUsuarios.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">{t('users.empty')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}