-- Allow system to insert token balances
CREATE POLICY "System can insert token balances" 
ON public.token_balances 
FOR INSERT 
WITH CHECK (true);

-- Allow system to update token balances
CREATE POLICY "System can update token balances" 
ON public.token_balances 
FOR UPDATE 
USING (true);

-- Insert token balances for existing users
INSERT INTO public.token_balances (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;