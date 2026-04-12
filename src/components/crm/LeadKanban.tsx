import { useState } from "react";
import { kanbanStatuses, statusLabels, statusColors } from "./statusConfig";
import { Users, DollarSign, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EditLeadDialog from "./EditLeadDialog";

interface LeadKanbanProps {
  leads: any[];
  loading: boolean;
  onRefresh: () => void;
}

const LeadKanban = ({ leads, loading, onRefresh }: LeadKanbanProps) => {
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kanbanStatuses.map((s) => (
          <div key={s} className="rounded-xl border border-border bg-card/40 p-4 min-h-[300px] animate-pulse" />
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleDrop = async (targetStatus: string) => {
    setDragOverStatus(null);
    if (!draggedId) return;

    const lead = leads.find((l) => l.id === draggedId);
    if (!lead || lead.status === targetStatus) {
      setDraggedId(null);
      return;
    }

    const { error } = await supabase
      .from("leads")
      .update({ status: targetStatus as any })
      .eq("id", draggedId);

    setDraggedId(null);
    if (error) {
      toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
    } else {
      onRefresh();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kanbanStatuses.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status);
          const totalRevenue = columnLeads.reduce(
            (sum, l) => sum + (parseFloat(l.revenue_potential) || 0),
            0
          );
          const isOver = dragOverStatus === status;

          return (
            <div
              key={status}
              className={`rounded-xl border bg-card/40 backdrop-blur-sm flex flex-col transition-colors ${isOver ? "border-primary bg-primary/5" : "border-border"}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(status);
              }}
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[status]}`}>
                    {statusLabels[status]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-lime text-sm font-semibold">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                  <Users className="w-3 h-3" />
                  {columnLeads.length} leads
                </div>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
                {columnLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead</p>
                )}
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedId(lead.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverStatus(null); }}
                    className={`rounded-lg border border-border bg-background/60 p-3 space-y-1.5 cursor-grab active:cursor-grabbing transition-opacity ${draggedId === lead.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate flex-1">{lead.name}</p>
                      <button
                        onClick={() => setEditLead(lead)}
                        className="ml-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                    {lead.company && (
                      <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                    )}
                    <p className="text-xs font-semibold text-lime">
                      {formatCurrency(parseFloat(lead.revenue_potential) || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <EditLeadDialog
        lead={editLead}
        open={!!editLead}
        onOpenChange={(open) => { if (!open) setEditLead(null); }}
        onSaved={onRefresh}
      />
    </>
  );
};

export default LeadKanban;
