## Update Flutter Developer Documents for BiscuitPOS Rebrand

### Problem
The three Flutter developer documents still reference the old project name ("Restaurant POS System") and the old Supabase backend URL (`hrogkcqnpjqnjstxdaxo.supabase.co`). After the recent BiscuitPOS rebrand and backend migration, these docs need updating so Flutter developers connect to the correct backend.

### Scope of Changes

1. **Update branding** — Replace "Restaurant POS System" with "BiscuitPOS" throughout all three docs.
2. **Update Supabase credentials** — Replace the old URL and anon key with the current Lovable Cloud backend:
   - URL: `https://insljgsbzkwvfhoujcrj.supabase.co`
   - Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2xqZ3Niemt3dmZob3VqY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjM4MjQsImV4cCI6MjA5NDEzOTgyNH0.oSZWdgDqk84c_kATtP4qvwpp7tY-0jhWmZCs9bIHkYE`
3. **Update project references** — Replace old project ID references (e.g., Supabase Project ID) with the current one.
4. **Update published URL reference** — Point to `https://biscuitpos.lovable.app` where applicable.

### Files to Modify
- `docs/mobile/FLUTTER_DEVELOPER_GUIDE.md`
- `docs/mobile/FLUTTER_QUICK_REFERENCE.md`
- `docs/mobile/flutter-integration.md`

### Out of Scope
- No code changes to the app itself.
- No changes to RPC function signatures or API behavior (backend schema compatibility is preserved per project memory).