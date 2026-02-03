-- Tokenomics Configuration Table
CREATE TABLE public.tokenomics_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_supply BIGINT NOT NULL DEFAULT 300000000,
  phase1_budget BIGINT NOT NULL DEFAULT 200000000,
  phase2_budget BIGINT NOT NULL DEFAULT 100000000,
  phase1_days INTEGER NOT NULL DEFAULT 1095,
  phase2_days INTEGER NOT NULL DEFAULT 730,
  base_views_per_token INTEGER NOT NULL DEFAULT 10,
  min_read_time_seconds INTEGER NOT NULL DEFAULT 30,
  heartbeat_interval_seconds INTEGER NOT NULL DEFAULT 10,
  difficulty_increase_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  phase_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Token Balances (separate from wallet for mining tokens)
CREATE TABLE public.token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_earned DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_valid_views BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading Sessions (active tracking)
CREATE TABLE public.reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  fingerprint TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  heartbeat_count INTEGER NOT NULL DEFAULT 0,
  total_active_seconds INTEGER NOT NULL DEFAULT 0,
  is_tab_visible BOOLEAN NOT NULL DEFAULT true,
  is_valid BOOLEAN DEFAULT NULL,
  invalidation_reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Valid Views (confirmed after validation)
CREATE TABLE public.valid_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.reading_sessions(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  fingerprint TEXT NOT NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens_earned DECIMAL(20,8) DEFAULT 0,
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, fingerprint, post_id, view_date)
);

-- Daily Settlements (token distribution records)
CREATE TABLE public.daily_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date DATE NOT NULL UNIQUE,
  total_valid_views BIGINT NOT NULL DEFAULT 0,
  total_tokens_distributed DECIMAL(20,8) NOT NULL DEFAULT 0,
  tokens_per_view DECIMAL(20,8) NOT NULL DEFAULT 0,
  daily_budget DECIMAL(20,8) NOT NULL DEFAULT 0,
  phase INTEGER NOT NULL DEFAULT 1,
  unique_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Token Ledger (immutable transaction log)
CREATE TABLE public.token_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mining_reward', 'withdrawal', 'transfer', 'bonus', 'penalty')),
  amount DECIMAL(20,8) NOT NULL,
  balance_after DECIMAL(20,8) NOT NULL,
  settlement_id uuid REFERENCES public.daily_settlements(id),
  reference_id uuid,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suspicious Activity Log
CREATE TABLE public.suspicious_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  fingerprint TEXT,
  user_id uuid,
  activity_type TEXT NOT NULL,
  details JSONB,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blocked IPs/Fingerprints
CREATE TABLE public.blocked_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ip', 'fingerprint', 'user')),
  entity_value TEXT NOT NULL,
  reason TEXT,
  blocked_by uuid,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_value)
);

-- Daily Emission Stats (for explorer)
CREATE TABLE public.emission_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_tokens_issued DECIMAL(20,8) NOT NULL DEFAULT 0,
  cumulative_tokens_issued DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_valid_views BIGINT NOT NULL DEFAULT 0,
  unique_readers INTEGER NOT NULL DEFAULT 0,
  average_read_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tokenomics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valid_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tokenomics config: public read, admin write
CREATE POLICY "Anyone can read tokenomics config" ON public.tokenomics_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage tokenomics" ON public.tokenomics_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Token balances
CREATE POLICY "Users can view own balance" ON public.token_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all balances" ON public.token_balances FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Reading sessions: users can see own, admins all
CREATE POLICY "Users view own sessions" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all sessions" ON public.reading_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow session inserts" ON public.reading_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow session updates" ON public.reading_sessions FOR UPDATE USING (true);

-- Valid views
CREATE POLICY "Users view own valid views" ON public.valid_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all valid views" ON public.valid_views FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow valid view inserts" ON public.valid_views FOR INSERT WITH CHECK (true);

-- Daily settlements: public read
CREATE POLICY "Anyone can view settlements" ON public.daily_settlements FOR SELECT USING (true);
CREATE POLICY "System can insert settlements" ON public.daily_settlements FOR INSERT WITH CHECK (true);

-- Token ledger
CREATE POLICY "Users view own ledger" ON public.token_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all ledger" ON public.token_ledger FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert ledger" ON public.token_ledger FOR INSERT WITH CHECK (true);

-- Suspicious activity: admin only
CREATE POLICY "Admins manage suspicious activity" ON public.suspicious_activity FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Blocked entities: admin only
CREATE POLICY "Admins manage blocked entities" ON public.blocked_entities FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Emission stats: public read
CREATE POLICY "Anyone can view emission stats" ON public.emission_stats FOR SELECT USING (true);
CREATE POLICY "System can insert emission stats" ON public.emission_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update emission stats" ON public.emission_stats FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX idx_reading_sessions_user ON public.reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_post ON public.reading_sessions(post_id);
CREATE INDEX idx_reading_sessions_ip ON public.reading_sessions(ip_address);
CREATE INDEX idx_reading_sessions_created ON public.reading_sessions(created_at);
CREATE INDEX idx_valid_views_user ON public.valid_views(user_id);
CREATE INDEX idx_valid_views_date ON public.valid_views(view_date);
CREATE INDEX idx_valid_views_settled ON public.valid_views(settled);
CREATE INDEX idx_token_ledger_user ON public.token_ledger(user_id);
CREATE INDEX idx_blocked_entities_value ON public.blocked_entities(entity_value);

-- Function to create token balance for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_token_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.token_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new user token balance
CREATE TRIGGER on_auth_user_created_token_balance
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_token_balance();

-- Insert default tokenomics config
INSERT INTO public.tokenomics_config (
  total_supply,
  phase1_budget,
  phase2_budget,
  phase1_days,
  phase2_days,
  base_views_per_token,
  min_read_time_seconds,
  heartbeat_interval_seconds,
  difficulty_increase_percent
) VALUES (
  300000000,
  200000000,
  100000000,
  1095,
  730,
  10,
  30,
  10,
  20.00
);