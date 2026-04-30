-- Tabela de tags por lead (many-to-many simples via texto)
CREATE TABLE public.lead_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lead_id, tag)
);

CREATE INDEX idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag ON public.lead_tags(tag);

ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead tags"
  ON public.lead_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lead tags"
  ON public.lead_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead tags"
  ON public.lead_tags FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete lead tags"
  ON public.lead_tags FOR DELETE TO authenticated USING (true);
