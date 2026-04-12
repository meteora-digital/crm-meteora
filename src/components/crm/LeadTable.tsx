import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusLabels, statusColors } from "./statusConfig";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import EditLeadDialog from "./EditLeadDialog";

interface LeadTableProps {
  leads: any[];
  loading: boolean;
  onRefresh: () => void;
}

const LeadTable = ({ leads, loading, onRefresh }: LeadTableProps) => {
  const [editLead, setEditLead] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">Nenhum lead encontrado</p>
        <p className="text-sm mt-1">Adicione ou importe leads para começar</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Potencial</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-border">
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{lead.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{lead.company || "—"}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[lead.status] || ""}`}>
                    {statusLabels[lead.status] || lead.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-lime">
                    {parseFloat(lead.revenue_potential || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(lead.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => setEditLead(lead)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

export default LeadTable;
