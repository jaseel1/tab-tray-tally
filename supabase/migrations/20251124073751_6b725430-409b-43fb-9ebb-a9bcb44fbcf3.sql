-- Reset admin password to 12345678
UPDATE public.admin_users 
SET password_hash = public.hash_password('12345678'), 
    updated_at = now()
WHERE username = 'admin';