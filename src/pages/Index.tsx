import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Upload,
  Search,
  Users,
  UserPlus,
  Filter,
  DollarSign,
  LayoutGrid,
  List,
} from "lucide-react";
import LeadTable from "@/components/crm/LeadTable";
import LeadKanban from "@/components/crm/LeadKanban";
import ImportLeadsDialog from "@/components/crm/ImportLeadsDialog";
import { statusLabels, statusColors, kanbanStatuses } from "@/components/crm/statusConfig";

export { statusLabels, statusColors };

const CRM = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    status: "mql" as string,
    revenue_potential: "",
    partner_id: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus as any);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erro ao carregar leads:", error.message);
      toast({ title: "Erro ao carregar leads", description: "Tente novamente mais tarde.", variant: "destructive" });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [filterStatus, user]);

  const handleAddLead = async () => {
    if (!newLead.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("leads").insert({
      name: newLead.name,
      email: newLead.email || null,
      phone: newLead.phone || null,
      company: newLead.company || null,
      notes: newLead.notes || null,
      status: newLead.status as any,
      source: "manual" as any,
      created_by: user!.id,
      revenue_potential: parseFloat(newLead.revenue_potential) || 0,
      partner_id: newLead.partner_id || null,
    } as any);

    if (error) {
      console.error("Erro ao criar lead:", error.message);
      toast({ title: "Erro ao criar lead", description: "Tente novamente mais tarde.", variant: "destructive" });
    } else {
      toast({ title: "Lead adicionado com sucesso" });
      setNewLead({ name: "", email: "", phone: "", company: "", notes: "", status: "mql", revenue_potential: "", partner_id: "" });
      setAddOpen(false);
      fetchLeads();
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(s) ||
      lead.email?.toLowerCase().includes(s) ||
      lead.company?.toLowerCase().includes(s) ||
      lead.phone?.includes(s)
    );
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const sumRevenue = (status?: string) =>
    leads
      .filter((l) => !status || l.status === status)
      .reduce((sum, l) => sum + (parseFloat(l.revenue_potential) || 0), 0);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    navigate("/login", { replace: true });
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="orb orb-purple" />
      <div className="orb orb-blue" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pb-6 border-b border-border"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl">CRM Unificado</h1>
              <p className="text-sm text-muted-foreground">Gestão de leads e clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card/50 p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-md transition-all ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" /> Importar
                </Button>
              </DialogTrigger>
              <ImportLeadsDialog
                userId={user!.id}
                onSuccess={() => {
                  setImportOpen(false);
                  fetchLeads();
                }}
              />
            </Dialog>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Adicionar Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input
                    placeholder="Nome *"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Telefone"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Empresa"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    />
                  </div>
                  <Select
                    value={newLead.status}
                    onValueChange={(v) => setNewLead({ ...newLead, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Potencial de receita (R$)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newLead.revenue_potential}
                    onChange={(e) => setNewLead({ ...newLead, revenue_potential: e.target.value })}
                  />
                  <Input
                    placeholder="ID do Parceiro (referral)"
                    value={newLead.partner_id}
                    onChange={(e) => setNewLead({ ...newLead, partner_id: e.target.value })}
                  />
                  <Textarea
                    placeholder="Observações"
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  />
                  <Button onClick={handleAddLead} className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" /> Adicionar Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.header>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6"
        >
          {kanbanStatuses.map((status) => {
            const count = leads.filter((l) => l.status === status).length;
            const revenue = sumRevenue(status);
            const icons: Record<string, any> = { mql: UserPlus, sql: Filter, oportunidade: Users, ganho: DollarSign };
            const colors: Record<string, string> = { mql: "text-blue-light", sql: "text-purple-light", oportunidade: "text-secondary", ganho: "text-lime" };
            const Icon = icons[status];

            return (
              <div key={status} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Icon className="w-4 h-4" />
                  {statusLabels[status]}
                </div>
                <div className={`font-bold text-2xl tracking-tight ${colors[status]}`}>
                  {formatCurrency(revenue)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {count} leads
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, empresa..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View */}
        {viewMode === "kanban" ? (
          <LeadKanban leads={filteredLeads} loading={loading} onRefresh={fetchLeads} />
        ) : (
          <LeadTable leads={filteredLeads} loading={loading} onRefresh={fetchLeads} />
        )}
      </div>
    </div>
  );
};

export default CRM;
