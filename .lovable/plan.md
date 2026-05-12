## Goal

Add an in-app **Flutter API Documentation** page that documents the existing Supabase backend so a Flutter developer can build a Restaurant POS app using the same database/RPCs. Excludes all Super Admin endpoints.

## Route & access

- New route: `/flutter-docs` (public, no auth required — it's developer reference, contains only the publishable anon key and RPC names already callable from any client).
- Add a small "Flutter API Docs" link in the existing app sidebar/footer (owner view only) so it's discoverable but unobtrusive.

## Page structure

Single long-scroll page with sticky left-side table of contents. Sections:

1. **Getting Started**
   - Supabase project URL + anon key (already public, read from `src/integrations/supabase/client.ts`)
   - `pubspec.yaml` deps: `supabase_flutter`, `shared_preferences`, `qr_flutter`
   - `Supabase.initialize(...)` snippet in `main.dart`

2. **Authentication** (custom RPC, not Supabase Auth)
   - `pos_login(p_mobile_number, p_pin)` — owner + viewer login, returns role/account_id/license info
   - Session storage pattern with `shared_preferences`
   - License-expired handling
   - Viewer vs Owner role gating (viewer = read-only)

3. **Settings & Account**
   - `get_pos_settings`, `upsert_pos_settings`
   - `get_account_full_details`

4. **Menu Management**
   - `get_account_menu`, `list_menu_items`
   - `upsert_menu_item`, `delete_menu_item`
   - `get_categories`, `upsert_categories`
   - Note: explicit Save Menu (no auto-save) per project rule

5. **Orders (Takeaway / Parcel)**
   - `create_order` (with `order_type`, `table_number`)
   - `get_account_orders`, `get_orders`
   - `update_order_payment_method` + `can_edit_order` (time-limited edits)

6. **Dine-in Tables**
   - `list_pos_tables`
   - `upsert_table_session` (cart auto-save while ordering)
   - `generate_table_bill` (Cash/Card/UPI → marks billed + creates order + auto-frees table)
   - `close_table_session` (Release table; works for `occupied` and `billed`)
   - State machine diagram: `free → occupied → billed → free`

7. **Viewer Accounts (read-only staff)**
   - `list_pos_viewers`, `create_pos_viewer`, `toggle_pos_viewer_status`, `get_viewer_count`
   - PIN format: 8 digits

8. **Digital Menu (public QR)**
   - `get_digital_menu_settings`, `initialize_digital_menu`, `update_menu_theme`
   - Public URL pattern + QR code generation in Flutter (`qr_flutter`)

9. **Analytics & Telemetry**
   - `get_account_analytics`, `get_item_sales`
   - `update_pos_telemetry` (auto-called by `create_order`)

10. **Realtime (optional)**
    - Subscribing to `pos_table_sessions` / `pos_orders` for live updates

11. **Error Handling Patterns**
    - All RPCs return `{ success: bool, message?: string, data?: ... }`
    - Standard Dart helper to unwrap

## Per-endpoint format

Each RPC documented as a card with:
- Name + one-line purpose
- Parameters table (name, type, required)
- Returns shape (JSON)
- Dart/Flutter example using `Supabase.instance.client.rpc(...)`
- Role: Owner | Viewer (read-only) | Public

## Excluded (per request)

All Super Admin endpoints: `admin_login`, `get_admin_settings`, `upsert_admin_setting`, `get_pos_accounts`, `search_pos_accounts`, `create_pos_account`, `toggle_pos_account_status`, `update_pos_table_count` (admin-only), admin order edit override, etc.

## Files

- `src/pages/FlutterDocs.tsx` — new page, all sections inline as readable React components.
- `src/components/docs/EndpointCard.tsx` — reusable endpoint block (params, returns, Dart snippet with copy button).
- `src/components/docs/CodeBlock.tsx` — syntax-highlighted code block with copy-to-clipboard (Dart + Yaml + JSON). Use existing dependencies — no new highlighter library; simple `<pre>` with monospace + a copy button is fine.
- `src/App.tsx` — register `/flutter-docs` route.
- Add a small "Flutter API Docs" link inside the existing settings/header area for owners.

## Out of scope

- No backend / DB / RPC changes.
- No PDF or Markdown export (pure in-app page as requested).
- No interactive "try it" playground.
