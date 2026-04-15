import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  paid: boolean;
  installment_number: number | null;
}

interface LeadPaymentsProps {
  leadId: string;
}

const LeadPayments = ({ leadId }: LeadPaymentsProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [entradaAmount, setEntradaAmount] = useState("");
  const [entradaDate, setEntradaDate] = useState("");
  const [parcelaAmount, setParcelaAmount] = useState("");

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("lead_payments")
      .select("*")
      .eq("lead_id", leadId)
      .order("due_date", { ascending: true });

    if (!error && data) {
      setPayments(data as Payment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [leadId]);

  const entrada = payments.find((p) => p.type === "entrada");
  const parcelas = payments.filter((p) => p.type === "parcela").sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0));

  const getNextDate = (): string => {
    const lastPayment = parcelas.length > 0 ? parcelas[parcelas.length - 1] : entrada;
    if (lastPayment) {
      const d = new Date(lastPayment.due_date + "T12:00:00");
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split("T")[0];
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  };

  const handleAddEntrada = async () => {
    if (!entradaAmount || !entradaDate) {
      toast({ title: "Preencha valor e data da entrada", variant: "destructive" });
      return;
    }
    if (entrada) {
      const { error } = await supabase
        .from("lead_payments")
        .update({ amount: parseFloat(entradaAmount), due_date: entradaDate } as any)
        .eq("id", entrada.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        fetchPayments();
      }
    } else {
      const { error } = await supabase.from("lead_payments").insert({
        lead_id: leadId,
        type: "entrada",
        amount: parseFloat(entradaAmount),
        due_date: entradaDate,
        installment_number: 0,
      } as any);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        fetchPayments();
      }
    }
  };

  const handleAddParcela = async () => {
    if (!parcelaAmount) {
      toast({ title: "Preencha o valor da parcela", variant: "destructive" });
      return;
    }
    const nextNumber = parcelas.length + 1;
    const nextDate = getNextDate();

    const { error } = await supabase.from("lead_payments").insert({
      lead_id: leadId,
      type: "parcela",
      amount: parseFloat(parcelaAmount),
      due_date: nextDate,
      installment_number: nextNumber,
    } as any);

    if (error) {
      toast({ title: "Erro ao adicionar parcela", description: error.message, variant: "destructive" });
    } else {
      fetchPayments();
    }
  };

  const togglePaid = async (payment: Payment) => {
    await supabase
      .from("lead_payments")
      .update({ paid: !payment.paid } as any)
      .eq("id", payment.id);
    fetchPayments();
  };

  const deletePayment = async (id: string) => {
    await supabase.from("lead_payments").delete().eq("id", id);
    fetchPayments();
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold text-foreground">Pagamentos</h4>

      {/* Entrada */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Entrada</label>
        {entrada ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <button onClick={() => togglePaid(entrada)} className="shrink-0">
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${entrada.paid ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                {entrada.paid && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
            <span className={`flex-1 ${entrada.paid ? "line-through text-muted-foreground" : ""}`}>
              {formatCurrency(entrada.amount)}
            </span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(entrada.due_date)}
            </span>
            <Badge variant={entrada.paid ? "default" : "outline"} className="text-xs">
              {entrada.paid ? "Pago" : "Pendente"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePayment(entrada.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Valor (R$)"
              value={entradaAmount}
              onChange={(e) => setEntradaAmount(e.target.value)}
              className="flex-1"
            />
            <Input
              type="date"
              value={entradaDate}
              onChange={(e) => setEntradaDate(e.target.value)}
              className="w-[150px]"
            />
            <Button size="sm" onClick={handleAddEntrada}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Parcelas */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Parcelas</label>
        {parcelas.map((p) => (
          <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <button onClick={() => togglePaid(p)} className="shrink-0">
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${p.paid ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                {p.paid && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
            <span className="text-xs text-muted-foreground w-6">#{p.installment_number}</span>
            <span className={`flex-1 ${p.paid ? "line-through text-muted-foreground" : ""}`}>
              {formatCurrency(p.amount)}
            </span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(p.due_date)}
            </span>
            <Badge variant={p.paid ? "default" : "outline"} className="text-xs">
              {p.paid ? "Pago" : "Pendente"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePayment(p.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Valor da parcela (R$)"
            value={parcelaAmount}
            onChange={(e) => setParcelaAmount(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={handleAddParcela} className="gap-1">
            <Plus className="w-4 h-4" /> Parcela
          </Button>
        </div>
        {parcelas.length === 0 && !entrada && (
          <p className="text-xs text-muted-foreground">Adicione uma entrada primeiro, depois as parcelas.</p>
        )}
        {(entrada || parcelas.length > 0) && (
          <p className="text-xs text-muted-foreground">
            Próxima parcela: {formatDate(getNextDate())}
          </p>
        )}
      </div>

      {/* Total */}
      {payments.length > 0 && (
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</span>
        </div>
      )}
    </div>
  );
};

export default LeadPayments;
