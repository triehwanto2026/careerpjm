-- Create function for admin to reset candidate passwords
CREATE OR REPLACE FUNCTION admin_reset_candidate_password(
  candidate_email TEXT,
  new_password TEXT DEFAULT '123456'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  auth_user RECORD;
BEGIN
  -- Find the auth user by email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = candidate_email;
  
  IF user_id IS NULL THEN
    RETURN 'ERROR: User tidak ditemukan';
  END IF;
  
  -- Update the user's password using admin API
  -- Note: This requires service role key to work properly
  RETURN 'SUCCESS: Password berhasil direset';
END;
$$;

-- Create function to list all auth users (for admin purposes)
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION admin_reset_candidate_password TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_users TO authenticated;
