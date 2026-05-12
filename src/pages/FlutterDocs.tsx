import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { EndpointCard } from "@/components/docs/EndpointCard";

const SUPABASE_URL = "https://insljgsbzkwvfhoujcrj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2xqZ3Niemt3dmZob3VqY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjM4MjQsImV4cCI6MjA5NDEzOTgyNH0.oSZWdgDqk84c_kATtP4qvwpp7tY-0jhWmZCs9bIHkYE";

const sections = [
  { id: "getting-started", label: "1. Getting Started" },
  { id: "auth", label: "2. Authentication" },
  { id: "settings", label: "3. Settings & Account" },
  { id: "menu", label: "4. Menu Management" },
  { id: "orders", label: "5. Orders (Takeaway)" },
  { id: "tables", label: "6. Dine-in Tables" },
  { id: "viewers", label: "7. Viewer Accounts" },
  { id: "digital-menu", label: "8. Digital Menu / QR" },
  { id: "analytics", label: "9. Analytics" },
  { id: "realtime", label: "10. Realtime" },
  { id: "errors", label: "11. Error Handling" },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20 mb-12">
    <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2 mb-4">{title}</h2>
    {children}
  </section>
);

const FlutterDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold">Flutter API Documentation</h1>
              <p className="text-xs text-muted-foreground">Restaurant POS — Shared Supabase Backend</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Contents</div>
            <nav className="flex flex-col gap-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          {/* Intro */}
          <div className="mb-8">
            <p className="text-muted-foreground">
              This guide documents every backend endpoint available to a Flutter Restaurant POS app.
              All endpoints are PostgreSQL functions exposed via Supabase RPC. The same backend powers
              the web POS, the public digital menu, and the Flutter mobile app — all data is fully
              compatible across clients.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Super Admin endpoints are intentionally excluded from this documentation.
            </p>
          </div>

          {/* 1. Getting Started */}
          <Section id="getting-started" title="1. Getting Started">
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-2">Project credentials</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Supabase URL:</span> <code className="font-mono text-xs">{SUPABASE_URL}</code></div>
                <div><span className="text-muted-foreground">Anon (publishable) key:</span></div>
                <CodeBlock code={SUPABASE_ANON_KEY} language="text" />
              </div>
            </Card>

            <h3 className="font-semibold mb-2">Add dependencies</h3>
            <CodeBlock language="yaml" code={`# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.0
  shared_preferences: ^2.2.0
  qr_flutter: ^4.1.0`} />

            <h3 className="font-semibold mt-4 mb-2">Initialize Supabase</h3>
            <CodeBlock code={`// lib/main.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: '${SUPABASE_URL}',
    anonKey: 'PASTE_ANON_KEY_HERE',
  );
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;`} />

            <p className="text-sm text-muted-foreground mt-3">
              All endpoints below are called using <code className="font-mono">supabase.rpc('function_name', params: {`{...}`})</code>.
              Every response is a JSON object with <code className="font-mono">success: bool</code> and either <code className="font-mono">data</code> or <code className="font-mono">message</code>.
            </p>
          </Section>

          {/* 2. Auth */}
          <Section id="auth" title="2. Authentication">
            <p className="text-sm text-muted-foreground mb-3">
              The app uses a custom mobile + PIN login (not Supabase Auth). One endpoint handles both
              <strong> Owner </strong> (full POS access) and <strong> Viewer </strong> (read-only POS staff)
              logins. Owners use any PIN length; viewer PINs are 8 digits.
            </p>

            <EndpointCard
              name="pos_login"
              role="Public"
              purpose="Login as an Owner or a read-only Viewer using mobile + PIN."
              params={[
                { name: "p_mobile_number", type: "text", required: true },
                { name: "p_pin", type: "text", required: true },
              ]}
              returns={`{
  "success": true,
  "role": "owner" | "viewer",
  "account_id": "uuid",
  "viewer_id": "uuid",          // only when role = viewer
  "restaurant_name": "string",
  "mobile_number": "string",
  "license_valid_until": "YYYY-MM-DD",
  "days_remaining": 123
}`}
              dart={`final res = await supabase.rpc('pos_login', params: {
  'p_mobile_number': mobile,
  'p_pin': pin,
});

if (res['success'] == true) {
  final role = res['role'] as String;            // 'owner' | 'viewer'
  final accountId = res['account_id'] as String;
  // persist with shared_preferences
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('account_id', accountId);
  await prefs.setString('role', role);
} else {
  throw Exception(res['message']);
}`}
            />

            <Card className="p-4 mt-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-1">Role gating in your UI</h3>
              <p className="text-sm text-muted-foreground">
                Viewers must NOT see write actions: editing menu, releasing tables, generating bills,
                changing settings. Always read the saved <code className="font-mono">role</code> from
                <code className="font-mono"> SharedPreferences</code> and hide write controls when
                <code className="font-mono"> role == 'viewer'</code>.
              </p>
            </Card>
          </Section>

          {/* 3. Settings */}
          <Section id="settings" title="3. Settings & Account">
            <EndpointCard
              name="get_pos_settings"
              role="Owner + Viewer"
              purpose="Restaurant info, tax rate, GST mode, privacy mode, table count."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('get_pos_settings',
    params: {'p_account_id': accountId});
final settings = res['data'];`}
            />

            <EndpointCard
              name="upsert_pos_settings"
              role="Owner"
              purpose="Update restaurant settings (insert or update)."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_restaurant_name", type: "text", required: true },
                { name: "p_address", type: "text" },
                { name: "p_phone", type: "text" },
                { name: "p_email", type: "text" },
                { name: "p_fssai_number", type: "text" },
                { name: "p_tax_rate", type: "numeric", description: "e.g. 5 for 5%" },
                { name: "p_gst_inclusive", type: "boolean" },
                { name: "p_privacy_mode", type: "boolean" },
              ]}
              dart={`await supabase.rpc('upsert_pos_settings', params: {
  'p_account_id': accountId,
  'p_restaurant_name': 'My Cafe',
  'p_tax_rate': 5,
  'p_gst_inclusive': false,
});`}
            />

            <EndpointCard
              name="get_account_full_details"
              role="Owner + Viewer"
              purpose="One-shot fetch: account, settings, subscription, telemetry, digital menu, theme."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('get_account_full_details',
    params: {'p_account_id': accountId});
final account = res['data']['account'];
final settings = res['data']['settings'];`}
            />
          </Section>

          {/* 4. Menu */}
          <Section id="menu" title="4. Menu Management">
            <Card className="p-4 mb-4 bg-muted/30">
              <p className="text-sm">
                <strong>No auto-save.</strong> Edit menu items locally in the app, then save explicitly
                via <code className="font-mono">upsert_menu_item</code> when the user taps "Save Menu".
              </p>
            </Card>

            <EndpointCard
              name="get_account_menu"
              role="Owner + Viewer"
              purpose="Fetch all menu items + categories for an account."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              returns={`{
  "success": true,
  "data": {
    "menu_items": [
      { "id": "uuid", "name": "Tea", "price": 20, "category": "Drinks", "image": "url" }
    ],
    "categories": ["Drinks", "Snacks"]
  }
}`}
              dart={`final res = await supabase.rpc('get_account_menu',
    params: {'p_account_id': accountId});
final items = (res['data']['menu_items'] as List).cast<Map<String, dynamic>>();`}
            />

            <EndpointCard
              name="list_menu_items"
              role="Owner + Viewer"
              purpose="Plain list of menu items (no categories)."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('list_menu_items',
    params: {'p_account_id': accountId});`}
            />

            <EndpointCard
              name="upsert_menu_item"
              role="Owner"
              purpose="Create (omit p_item_id) or update an existing menu item."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_name", type: "text", required: true },
                { name: "p_price", type: "numeric", required: true },
                { name: "p_category", type: "text", required: true },
                { name: "p_item_id", type: "uuid", description: "Pass to update; omit to create" },
                { name: "p_image", type: "text", description: "Optional image URL" },
              ]}
              dart={`await supabase.rpc('upsert_menu_item', params: {
  'p_account_id': accountId,
  'p_name': 'Masala Chai',
  'p_price': 25,
  'p_category': 'Drinks',
  // 'p_item_id': existingId,   // include when editing
});`}
            />

            <EndpointCard
              name="delete_menu_item"
              role="Owner"
              purpose="Permanently delete a menu item."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_item_id", type: "uuid", required: true },
              ]}
              dart={`await supabase.rpc('delete_menu_item', params: {
  'p_account_id': accountId,
  'p_item_id': itemId,
});`}
            />

            <EndpointCard
              name="get_categories"
              role="Owner + Viewer"
              purpose="List all category names for the account."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('get_categories',
    params: {'p_account_id': accountId});
final categories = (res['data'] as List).cast<String>();`}
            />

            <EndpointCard
              name="upsert_categories"
              role="Owner"
              purpose="Replace the full category list (atomic delete + insert)."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_categories", type: "text[]", required: true },
              ]}
              dart={`await supabase.rpc('upsert_categories', params: {
  'p_account_id': accountId,
  'p_categories': ['Drinks', 'Snacks', 'Mains'],
});`}
            />
          </Section>

          {/* 5. Orders */}
          <Section id="orders" title="5. Orders (Takeaway / Parcel)">
            <p className="text-sm text-muted-foreground mb-3">
              Use these endpoints for non-dine-in orders. For dine-in see the Tables section.
            </p>

            <EndpointCard
              name="create_order"
              role="Owner + Viewer"
              purpose="Create a takeaway/parcel order. Auto-updates telemetry."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_order_number", type: "text", required: true, description: "e.g. ORD-1700000001" },
                { name: "p_total_amount", type: "numeric", required: true },
                { name: "p_payment_method", type: "text", required: true, description: "cash | card | upi" },
                { name: "p_items", type: "json[]", required: true, description: "[{name,quantity,price,total}]" },
                { name: "p_order_type", type: "text", description: "takeaway (default) | parcel" },
                { name: "p_table_number", type: "int", description: "Optional" },
              ]}
              dart={`final orderNumber = 'ORD-\${DateTime.now().millisecondsSinceEpoch ~/ 1000}';

await supabase.rpc('create_order', params: {
  'p_account_id': accountId,
  'p_order_number': orderNumber,
  'p_total_amount': 105.0,
  'p_payment_method': 'upi',
  'p_items': [
    {'name': 'Tea', 'quantity': 2, 'price': 20, 'total': 40},
    {'name': 'Samosa', 'quantity': 5, 'price': 13, 'total': 65},
  ],
  'p_order_type': 'takeaway',
});`}
            />

            <EndpointCard
              name="get_account_orders"
              role="Owner + Viewer"
              purpose="Paginated order history with line items."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_limit", type: "int", description: "default 100" },
                { name: "p_offset", type: "int", description: "default 0" },
              ]}
              dart={`final res = await supabase.rpc('get_account_orders', params: {
  'p_account_id': accountId,
  'p_limit': 50,
  'p_offset': 0,
});
final orders = res['data']['orders'] as List;`}
            />

            <EndpointCard
              name="can_edit_order"
              role="Owner"
              purpose="Check whether an order is still within the edit window (controlled by Super Admin)."
              params={[
                { name: "p_order_id", type: "uuid", required: true },
                { name: "p_account_id", type: "uuid", required: true },
              ]}
              returns={`{
  "success": true,
  "can_edit": true,
  "minutes_remaining": 18
}`}
              dart={`final res = await supabase.rpc('can_edit_order', params: {
  'p_order_id': orderId,
  'p_account_id': accountId,
});
if (res['can_edit'] == true) { /* show edit UI */ }`}
            />

            <EndpointCard
              name="update_order_payment_method"
              role="Owner"
              purpose="Update payment method on an existing order, if still editable."
              params={[
                { name: "p_order_id", type: "uuid", required: true },
                { name: "p_payment_method", type: "text", required: true },
                { name: "p_account_id", type: "uuid", required: true },
              ]}
              dart={`await supabase.rpc('update_order_payment_method', params: {
  'p_order_id': orderId,
  'p_payment_method': 'cash',
  'p_account_id': accountId,
});`}
            />
          </Section>

          {/* 6. Tables */}
          <Section id="tables" title="6. Dine-in Tables">
            <Card className="p-4 mb-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2">Table state machine</h3>
              <pre className="text-xs font-mono text-muted-foreground">{`free  ──(add first item)──▶  occupied
occupied  ──(generate bill)──▶  billed
billed   ──(payment recorded)──▶  free   (auto via generate_table_bill)
billed   ──(release / discard)──▶ free   (via close_table_session)`}</pre>
            </Card>

            <EndpointCard
              name="list_pos_tables"
              role="Owner + Viewer"
              purpose="All tables for an account with their current open session (cart) if any."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              returns={`{
  "success": true,
  "data": {
    "table_count": 6,
    "tables": [
      {
        "id": "uuid",
        "table_number": 1,
        "label": "Table 1",
        "status": "free | occupied | billed",
        "current_session_id": "uuid | null",
        "session": {
          "id": "uuid",
          "items": [...],
          "subtotal": 0,
          "tax": 0,
          "total": 0,
          "status": "open | billed",
          "bill_number": "ORD-...",
          "opened_at": "ts",
          "billed_at": "ts | null"
        }
      }
    ]
  }
}`}
              dart={`final res = await supabase.rpc('list_pos_tables',
    params: {'p_account_id': accountId});
final tables = res['data']['tables'] as List;`}
            />

            <EndpointCard
              name="upsert_table_session"
              role="Owner + Viewer"
              purpose="Create or update the open session (cart) for a table. Auto-flips table to 'occupied'."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_table_id", type: "uuid", required: true },
                { name: "p_items", type: "jsonb", required: true },
                { name: "p_subtotal", type: "numeric", required: true },
                { name: "p_tax", type: "numeric", required: true },
                { name: "p_total", type: "numeric", required: true },
              ]}
              dart={`await supabase.rpc('upsert_table_session', params: {
  'p_account_id': accountId,
  'p_table_id': tableId,
  'p_items': cartItems,    // List<Map>
  'p_subtotal': subtotal,
  'p_tax': tax,
  'p_total': total,
});`}
            />

            <EndpointCard
              name="generate_table_bill"
              role="Owner"
              purpose="Generate the bill for a table session. Creates a pos_orders row, marks session and table as 'billed'."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_session_id", type: "uuid", required: true },
                { name: "p_payment_method", type: "text", required: true, description: "cash | card | upi" },
              ]}
              returns={`{ "success": true, "order_id": "uuid", "order_number": "ORD-..." }`}
              dart={`final res = await supabase.rpc('generate_table_bill', params: {
  'p_account_id': accountId,
  'p_session_id': sessionId,
  'p_payment_method': 'cash',
});
final orderNumber = res['order_number'];`}
            />

            <EndpointCard
              name="close_table_session"
              role="Owner"
              purpose="Release a table. Works for both 'occupied' (discard cart) and 'billed' (discard unpaid bill) statuses."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_session_id", type: "uuid", required: true },
              ]}
              dart={`await supabase.rpc('close_table_session', params: {
  'p_account_id': accountId,
  'p_session_id': sessionId,
});`}
            />
          </Section>

          {/* 7. Viewers */}
          <Section id="viewers" title="7. Viewer Accounts (read-only staff)">
            <p className="text-sm text-muted-foreground mb-3">
              Viewers are POS staff with mobile + 8-digit PIN. They can take orders and view data,
              but never edit menu, settings, or release tables.
            </p>

            <EndpointCard
              name="list_pos_viewers"
              role="Owner"
              purpose="List all staff viewers for the account."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('list_pos_viewers',
    params: {'p_account_id': accountId});`}
            />

            <EndpointCard
              name="create_pos_viewer"
              role="Owner"
              purpose="Add a new viewer (staff) account."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_mobile_number", type: "text", required: true },
                { name: "p_pin", type: "text", required: true, description: "8 digits" },
              ]}
              dart={`await supabase.rpc('create_pos_viewer', params: {
  'p_account_id': accountId,
  'p_mobile_number': '9876543210',
  'p_pin': '12345678',
});`}
            />

            <EndpointCard
              name="toggle_pos_viewer_status"
              role="Owner"
              purpose="Enable/disable a viewer account."
              params={[{ name: "p_viewer_id", type: "uuid", required: true }]}
              dart={`await supabase.rpc('toggle_pos_viewer_status',
    params: {'p_viewer_id': viewerId});`}
            />

            <EndpointCard
              name="get_viewer_count"
              role="Owner"
              purpose="Count of active viewers."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('get_viewer_count',
    params: {'p_account_id': accountId});
final count = res['count'] as int;`}
            />
          </Section>

          {/* 8. Digital Menu */}
          <Section id="digital-menu" title="8. Digital Menu / QR">
            <EndpointCard
              name="get_digital_menu_settings"
              role="Owner + Viewer"
              purpose="Public URL slug, active theme, and all available themes."
              params={[{ name: "p_account_id", type: "uuid", required: true }]}
              dart={`final res = await supabase.rpc('get_digital_menu_settings',
    params: {'p_account_id': accountId});
final slug = res['data']['digital_menu']['public_url_slug'];
final publicUrl = 'https://tab-tray-tally.lovable.app/menu/\$slug';`}
            />

            <EndpointCard
              name="initialize_digital_menu"
              role="Owner"
              purpose="One-time setup of the public digital menu (creates slug + default theme)."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_restaurant_name", type: "text", required: true },
              ]}
              dart={`await supabase.rpc('initialize_digital_menu', params: {
  'p_account_id': accountId,
  'p_restaurant_name': 'My Cafe',
});`}
            />

            <EndpointCard
              name="update_menu_theme"
              role="Owner"
              purpose="Switch active theme for the digital menu."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_theme_name", type: "text", required: true, description: "modern | classic | minimal | vibrant ..." },
                { name: "p_custom_colors", type: "jsonb", description: "Optional overrides" },
              ]}
              dart={`await supabase.rpc('update_menu_theme', params: {
  'p_account_id': accountId,
  'p_theme_name': 'modern',
  'p_custom_colors': {'primary': '#ff6600'},
});`}
            />

            <h3 className="font-semibold mt-6 mb-2">Generate QR code in Flutter</h3>
            <CodeBlock code={`import 'package:qr_flutter/qr_flutter.dart';

QrImageView(
  data: 'https://tab-tray-tally.lovable.app/menu/\$slug',
  version: QrVersions.auto,
  size: 240,
);`} />

            <EndpointCard
              name="get_public_menu"
              role="Public"
              purpose="Read a public digital menu by slug (no auth)."
              params={[{ name: "p_slug", type: "text", required: true }]}
              dart={`final res = await supabase.rpc('get_public_menu',
    params: {'p_slug': 'my-cafe'});
final items = res['data']['menu_items'];`}
            />
          </Section>

          {/* 9. Analytics */}
          <Section id="analytics" title="9. Analytics">
            <EndpointCard
              name="get_account_analytics"
              role="Owner"
              purpose="Summary, daily revenue, and top items for the last N days."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_days", type: "int", description: "default 30" },
              ]}
              returns={`{
  "success": true,
  "data": {
    "summary": { "total_orders": 0, "total_revenue": 0, "average_order_value": 0, "unique_items_sold": 0 },
    "daily_revenue": [{ "date": "2026-05-01", "revenue": 0, "orders": 0 }],
    "top_items":     [{ "item_name": "Tea", "quantity_sold": 0, "revenue": 0 }]
  }
}`}
              dart={`final res = await supabase.rpc('get_account_analytics', params: {
  'p_account_id': accountId,
  'p_days': 30,
});`}
            />

            <EndpointCard
              name="get_item_sales"
              role="Owner"
              purpose="Per-item sales over the last N days."
              params={[
                { name: "p_account_id", type: "uuid", required: true },
                { name: "p_days", type: "int", description: "default 30" },
              ]}
              dart={`final res = await supabase.rpc('get_item_sales', params: {
  'p_account_id': accountId,
  'p_days': 7,
});`}
            />
          </Section>

          {/* 10. Realtime */}
          <Section id="realtime" title="10. Realtime (optional)">
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe to live updates so two devices stay in sync (e.g. owner sees a viewer's
              cart updates in real time).
            </p>
            <CodeBlock code={`final channel = supabase
  .channel('table_sessions_\$accountId')
  .onPostgresChanges(
    event: PostgresChangeEvent.all,
    schema: 'public',
    table: 'pos_table_sessions',
    filter: PostgresChangeFilter(
      type: PostgresChangeFilterType.eq,
      column: 'pos_account_id',
      value: accountId,
    ),
    callback: (payload) {
      // refetch list_pos_tables() and update UI
    },
  )
  .subscribe();

// Don't forget to dispose:
// await supabase.removeChannel(channel);`} />
          </Section>

          {/* 11. Errors */}
          <Section id="errors" title="11. Error Handling">
            <p className="text-sm text-muted-foreground mb-3">
              Every RPC returns a JSON object with <code className="font-mono">success</code>. Use a
              shared helper to unwrap:
            </p>
            <CodeBlock code={`Future<Map<String, dynamic>> callRpc(
  String name,
  Map<String, dynamic> params,
) async {
  try {
    final res = await supabase.rpc(name, params: params);
    final map = (res as Map).cast<String, dynamic>();
    if (map['success'] != true) {
      throw Exception(map['message'] ?? 'Request failed');
    }
    return map;
  } on PostgrestException catch (e) {
    throw Exception('Server error: \${e.message}');
  }
}`} />
            <p className="text-sm text-muted-foreground mt-3">
              Common error messages you should handle in UI:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
              <li><code className="font-mono">Invalid credentials or account disabled</code> — bad login</li>
              <li><code className="font-mono">License expired or not found</code> — block access, prompt user to contact admin</li>
              <li><code className="font-mono">Session not found</code> / <code className="font-mono">Session already billed</code> — refetch tables</li>
              <li><code className="font-mono">Edit time window has expired</code> — hide edit UI</li>
              <li><code className="font-mono">Mobile number already exists</code> — viewer creation conflict</li>
            </ul>
          </Section>

          <div className="text-xs text-muted-foreground border-t border-border pt-4 mt-12">
            Backend: Supabase (Postgres + RPC). All endpoints documented here are stable and shared
            with the web POS app. Schema changes will be coordinated with the Flutter team.
          </div>
        </main>
      </div>
    </div>
  );
};

export default FlutterDocs;
