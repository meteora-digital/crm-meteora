
-- Drop restrictive owner-only policies
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

-- Create team-wide policies (all authenticated users can access all leads)
CREATE POLICY "Authenticated users can view leads"
ON public.leads FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete leads"
ON public.leads FOR DELETE TO authenticated
USING (true);

-- Drop restrictive owner-only policies on payments
DROP POLICY IF EXISTS "Users can view own lead payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Users can insert own lead payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Users can update own lead payments" ON public.lead_payments;
DROP POLICY IF EXISTS "Users can delete own lead payments" ON public.lead_payments;

-- Create team-wide policies for payments
CREATE POLICY "Authenticated users can view payments"
ON public.lead_payments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payments"
ON public.lead_payments FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
ON public.lead_payments FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payments"
ON public.lead_payments FOR DELETE TO authenticated
USING (true);
