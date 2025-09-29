-- Fix security vulnerabilities by implementing proper role-based access control

-- 1. Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents circular dependency)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create secure function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'moderator' THEN 2 
      WHEN 'user' THEN 3 
    END 
  LIMIT 1;
$$;

-- 6. Fix existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_gallery_images_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_post_views(post_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_user_id UUID;
  earning_amount DECIMAL(15,2) := 0.10;
BEGIN
  UPDATE public.posts 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = post_id AND status = 'approved'
  RETURNING user_id INTO post_user_id;
  
  IF post_user_id IS NOT NULL THEN
    UPDATE public.wallet 
    SET balance = balance + earning_amount,
        total_earned = total_earned + earning_amount,
        updated_at = now()
    WHERE user_id = post_user_id;
    
    INSERT INTO public.transactions (user_id, wallet_id, type, amount, description)
    SELECT post_user_id, w.id, 'earning', earning_amount, 'View earnings for post'
    FROM public.wallet w
    WHERE w.user_id = post_user_id;
  END IF;
END;
$$;

-- 7. Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Drop old policies on profiles table and create secure ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new secure policies using the has_role function
CREATE POLICY "Secure: Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Secure: Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Secure: Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Secure: Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secure: Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Fix wallet policies for enhanced security
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallet;

CREATE POLICY "Secure: Users can view own wallet"
ON public.wallet
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can update own wallet"
ON public.wallet
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Admins can view all wallets"
ON public.wallet
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Migrate existing admin user (if any) to new role system
-- This will safely migrate any existing users with 'admin' role in profiles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM public.profiles 
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role 
FROM public.profiles 
WHERE role = 'user' OR role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;