-- Módulo de Acompanhamento do Vendedor
-- Migrações executadas em 19/02/2026

-- 1. Novos Roles e Coluna de Região
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'VENDEDOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'REGIONAL_ADMIN';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS region text;

-- 2. Tabela de Solicitações de Serviço
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'PENDENTE',
  requester_id uuid NOT NULL REFERENCES public.users(id),
  requester_email text NOT NULL,
  requester_region text,
  accepted_by uuid REFERENCES public.users(id),
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para Solicitações
DROP POLICY IF EXISTS "sr_select_own" ON public.service_requests;
CREATE POLICY "sr_select_own" ON public.service_requests
  FOR SELECT USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "sr_select_staff" ON public.service_requests;
CREATE POLICY "sr_select_staff" ON public.service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (
        role IN ('ADMIN', 'CONTRIBUTOR') 
        OR (role = 'REGIONAL_ADMIN' AND region = service_requests.requester_region)
      )
    )
  );

DROP POLICY IF EXISTS "sr_insert" ON public.service_requests;
CREATE POLICY "sr_insert" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sr_update_staff" ON public.service_requests;
CREATE POLICY "sr_update_staff" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'CONTRIBUTOR'))
  );

DROP POLICY IF EXISTS "sr_update_own" ON public.service_requests;
CREATE POLICY "sr_update_own" ON public.service_requests
  FOR UPDATE USING (requester_id = auth.uid());

-- 3. Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'SERVICE_REQUEST',
  title text NOT NULL,
  message text,
  service_request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  target_role text,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_auth" ON public.notifications;
CREATE POLICY "notif_select_auth" ON public.notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notif_insert_auth" ON public.notifications;
CREATE POLICY "notif_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notif_update_auth" ON public.notifications;
CREATE POLICY "notif_update_auth" ON public.notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 4. Restrição de Demandas Técnicas para Vendedores
DROP POLICY IF EXISTS "demands_select_authenticated" ON public.technical_demands;
CREATE POLICY "demands_select_staff" ON public.technical_demands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'CONTRIBUTOR'))
  );
