import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Edit, Trash2, Shield, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createUser, listUsers, ApiUser } from "@/lib/users";

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
  const [usuarios, setUsuarios] = useState<UiUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UiUsuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    status: "Ativo" as "Ativo" | "Inativo",
    tipo: "Usuário" as "Admin" | "Usuário" | "Suporte",
    // Campos condicionais
    department: "",
    specialization: "",
    level: 1,
    isAvailable: true,
  });

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
      const res = await listUsers({ page: 1, pageSize: 50, q });
      setUsuarios(res.items.map(mapApiUser));
      setTotal(res.total);
    } catch (err: any) {
      toast.error("Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce busca no servidor
  useEffect(() => {
    const h = setTimeout(() => {
      const q = searchTerm.trim();
      fetchUsers(q.length > 0 ? q : undefined);
    }, 400);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredUsuarios = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.id).toLowerCase().includes(q)
    );
  }, [usuarios, searchTerm]);

  const handleCreateUser = async () => {
    try {
      const userType = formData.tipo === "Admin" ? "Admin" : formData.tipo === "Suporte" ? "Agent" : "Customer";
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType,
        isActive: formData.status === "Ativo",
      };
      if (userType === "Customer") payload.department = formData.department || undefined;
      if (userType === "Agent") {
        payload.specialization = formData.specialization || undefined;
        payload.level = formData.level || 1;
        payload.isAvailable = formData.isAvailable;
      }

      const created = await createUser(payload);
      setUsuarios((prev) => [...prev, mapApiUser(created)]);
      setIsDialogOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        status: "Ativo",
        tipo: "Usuário",
        department: "",
        specialization: "",
        level: 1,
        isAvailable: true,
      });
      toast.success(`Usuário ${created.fullName} foi criado com sucesso.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Falha ao criar usuário";
      toast.error(msg);
    }
  };

  const handleEditUser = (user: UiUsuario) => {
    setEditingUser(user);
    setIsDialogOpen(true);
    toast.info("Edição de usuário será adicionada em breve.");
  };

  const handleDeleteUser = (id: number, userName: string) => {
    toast.info("Remoção/desativação será adicionada em breve.");
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      status: "Ativo",
      tipo: "Usuário",
      department: "",
      specialization: "",
      level: 1,
      isAvailable: true,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Criar Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Atualize as informações do usuário abaixo."
                  : "Preencha as informações para criar um novo usuário."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Digite o nome" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Digite o sobrenome" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email"
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Defina uma senha" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value: "Admin" | "Usuário" | "Suporte") => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Usuário">Usuário</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "Usuário" && (
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Digite o departamento" />
                </div>
              )}

              {formData.tipo === "Suporte" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Especialização</Label>
                    <Input id="specialization" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="Ex: Redes" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Nível</Label>
                    <Input id="level" type="number" min={1} max={5} value={formData.level} onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponível</Label>
                    <Select value={formData.isAvailable ? "true" : "false"} onValueChange={(v: "true" | "false") => setFormData({ ...formData, isAvailable: v === "true" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: "Ativo" | "Inativo") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingUser ? () => toast.info("Atualização em breve") : handleCreateUser}>
                {editingUser ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            {loading ? "Carregando..." : `Total de ${total} usuário(s) cadastrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email, departamento ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
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
                      {usuario.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[usuario.status]}>
                      {usuario.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usuario.ultimoAcesso !== "-" && typeof usuario.ultimoAcesso === "string"
                      ? new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR')
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(usuario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Delete with confirmation - Heurística 5: Prevenção de erros */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
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
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(usuario.id, usuario.nome)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
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

          {filteredUsuarios.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}