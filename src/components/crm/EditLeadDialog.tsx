import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { statusLabels } from "./statusConfig";
import { Save, Trash2 } from "lucide-react";
import LeadPayments from "./LeadPayments";

interface EditLeadDialogProps {
  lead: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditLeadDialog = ({ lead, open, onOpenChange, onSaved }: EditLeadDialogProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    status: "mql",
    revenue_potential: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        notes: lead.notes || "",
        status: lead.status || "mql",
        revenue_potential: String(lead.revenue_potential || 0),
      });
    }
  }, [lead]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        notes: form.notes || null,
        status: form.status as any,
        revenue_potential: parseFloat(form.revenue_potential) || 0,
      })
      .eq("id", lead.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead atualizado" });
      onOpenChange(false);
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead excluído" });
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Nome *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Empresa"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}
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
            value={form.revenue_potential}
            onChange={(e) => setForm({ ...form, revenue_potential: e.target.value })}
          />
          <Textarea
            placeholder="Observações"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
