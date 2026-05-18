## Change Super Admin Password

Update the Super Admin password to `12345678##` by rewriting the stored hash in the `admin_users` table.

### How it works
The `admin_login` function hashes the input password using `hash_password(password)` (SHA-256 of `password || 'salt'`) and compares it to `admin_users.password_hash`. So we just need to overwrite `password_hash` for the admin row using the same hashing function.

### Steps
1. Run a data update (via the insert/update tool) that sets:
   ```sql
   UPDATE public.admin_users
   SET password_hash = public.hash_password('12345678##')
   WHERE username = 'admin';
   ```
   (If you use a different admin username, I'll target that one instead.)
2. Verify by logging in at the Super Admin screen with the new password.

### Questions before I run it
- Which admin username should I update? (default assumption: `admin`)
- Confirm the new password is exactly `12345678##` (10 chars, two `#` at the end).

### Note
Storing this password in chat is not ideal — after it works, consider changing it again to something only you know.