import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";

interface ImportLeadsDialogProps {
  userId: string;
  onSuccess: () => void;
}

const ImportLeadsDialog = ({ userId, onSuccess }: ImportLeadsDialogProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });
    return rows;
  };

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_ROWS = 500;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length > MAX_ROWS) {
        toast({ title: `Limite de ${MAX_ROWS} linhas excedido`, description: `O arquivo contém ${rows.length} linhas.`, variant: "destructive" });
        setFileName("");
        return;
      }
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);

      const truncate = (val: string | null | undefined, max: number) => val ? val.slice(0, max) : null;

      const leadsToInsert = rows
        .filter((r) => r.name || r.nome)
        .map((r) => ({
          name: truncate(r.name || r.nome || "Sem nome", 255)!,
          email: truncate(r.email || r["e-mail"], 255),
          phone: truncate(r.phone || r.telefone || r.tel, 50),
          company: truncate(r.company || r.empresa, 255),
          notes: truncate(r.notes || r.observacao || r.obs, 1000),
          source: "import" as any,
          status: "mql" as any,
          created_by: userId,
        }));

      if (leadsToInsert.length === 0) {
        toast({ title: "Nenhum lead válido encontrado no arquivo", variant: "destructive" });
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("leads").insert(leadsToInsert);

      if (error) {
        console.error("Erro na importação:", error.message);
        toast({ title: "Erro na importação", description: "Tente novamente mais tarde.", variant: "destructive" });
      } else {
        toast({ title: `${leadsToInsert.length} leads importados com sucesso` });
        onSuccess();
      }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <DialogContent className="bg-card border-border max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display">Importar Leads</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Envie um arquivo CSV com as colunas: <strong>name</strong> (ou nome), email, phone (ou telefone), company (ou empresa), notes (ou obs).
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
        >
          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-foreground">
              <FileSpreadsheet className="w-5 h-5 text-lime" />
              <span>{fileName}</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clique para selecionar CSV</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />

        {preview.length > 0 && (
          <div className="text-xs space-y-1">
            <p className="text-muted-foreground">Preview ({preview.length} primeiros):</p>
            <div className="bg-background/50 rounded-lg p-3 overflow-x-auto">
              {preview.map((row, i) => (
                <div key={i} className="text-foreground/70">
                  {Object.values(row).join(" · ")}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!fileName || importing}
          className="w-full gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {importing ? "Importando..." : "Confirmar Importação"}
        </Button>
      </div>
    </DialogContent>
  );
};

export default ImportLeadsDialog;
