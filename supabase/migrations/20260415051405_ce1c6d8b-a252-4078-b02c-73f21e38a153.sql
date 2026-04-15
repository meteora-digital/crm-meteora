
-- Drop existing overly permissive policies on leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

-- Create owner-scoped policies for leads
CREATE POLICY "Users can view own leads"
ON public.leads FOR SELECT TO authenticated
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert own leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own leads"
ON public.leads FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete own leads"
ON public.leads FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Drop existing overly permissive policies on lead_payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.lead_payments;

-- Create a security definer function to check lead ownership
CREATE OR REPLACE FUNCTION public.is_lead_owner(_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id
      AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
$$;

-- Create owner-scoped policies for lead_payments
CREATE POLICY "Users can view own lead payments"
ON public.lead_payments FOR SELECT TO authenticated
USING (public.is_lead_owner(lead_id));

CREATE POLICY "Users can insert own lead payments"
ON public.lead_payments FOR INSERT TO authenticated
WITH CHECK (public.is_lead_owner(lead_id));

CREATE POLICY "Users can update own lead payments"
ON public.lead_payments FOR UPDATE TO authenticated
USING (public.is_lead_owner(lead_id));

CREATE POLICY "Users can delete own lead payments"
ON public.lead_payments FOR DELETE TO authenticated
USING (public.is_lead_owner(lead_id));
