export const statusLabels: Record<string, string> = {
  mql: "MQL",
  sql: "SQL",
  oportunidade: "Oportunidade",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const statusColors: Record<string, string> = {
  mql: "bg-blue/20 text-blue-light",
  sql: "bg-purple/20 text-purple-light",
  oportunidade: "bg-secondary/20 text-secondary",
  ganho: "bg-lime/30 text-lime",
  perdido: "bg-destructive/20 text-destructive",
};

export const kanbanStatuses = ["mql", "sql", "oportunidade", "ganho"] as const;
