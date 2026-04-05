
-- Function to auto-link a customer record to an auth user by matching email
-- Called from the client when a user logs in and their customer record isn't linked yet
CREATE OR REPLACE FUNCTION public.link_customer_by_email()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
  _customer_id uuid;
BEGIN
  -- Get the current user's email
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  IF _user_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try to link unlinked customer with matching email
  UPDATE public.customers
  SET auth_user_id = auth.uid()
  WHERE auth_user_id IS NULL
    AND lower(email) = lower(_user_email)
  RETURNING id INTO _customer_id;

  RETURN _customer_id;
END;
$$;
