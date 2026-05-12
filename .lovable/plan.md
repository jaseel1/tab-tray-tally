## Rebrand to BiscuitPOS

Apply the BiscuitPOS name and logo across the app, and add "Powered by BiscuitPOS.com" to printed bills.

### Assets

Copy uploaded files into the project:
- `user-uploads://logo.png` → `src/assets/biscuitpos-logo.png` (primary, dark text on white — for light backgrounds: login screens, headers)
- `user-uploads://logo_white.png` → `src/assets/biscuitpos-logo-dark.png` (alt naming reflecting use on dark backgrounds; same dark-text variant — keep both for flexibility)
- `user-uploads://logo_light.png` → `src/assets/biscuitpos-logo-light.png` (faded variant, for receipt footer watermark)
- Also copy primary logo to `public/biscuitpos-logo.png` for use as favicon and OG image.

### Text rebrand

- `index.html`: title → `BiscuitPOS — Restaurant Billing & POS`; description and OG title/description updated; `<link rel="icon" href="/biscuitpos-logo.png">`; OG image → `/biscuitpos-logo.png`.
- `src/pages/Index.tsx` line 1003: replace `<h1>Restaurant POS</h1>` with the BiscuitPOS logo image (height ~36px) followed by the existing tagline.
- `src/components/POSLoginScreen.tsx`: replace the `Smartphone` circle (lines 53–55) with the BiscuitPOS logo; change "POS Login" → "Sign in to BiscuitPOS".
- `src/components/AdminLoginScreen.tsx`: keep the red Shield (admin context); add a small BiscuitPOS logo above the title and update "Back to POS Login" → "Back to BiscuitPOS Login".

### Receipt "Powered by BiscuitPOS.com"

- `src/components/ReceiptPreview.tsx` (around line 167–170 footer): add `<p className="mt-2 text-[10px]">Powered by BiscuitPOS.com</p>` under the existing thank-you lines.
- `src/lib/pdf.ts` `generateReceiptPDF` (around line 165–169): after "Please visit again", add another centered line at smaller font size (`setFontSize(7)`) with text `Powered by BiscuitPOS.com`. Apply the same change to the 80mm variant if present (search for the same footer block).

### Out of scope

- Reports/Daily/Monthly PDFs keep the user's restaurant name as header (unchanged).
- No package.json name change, no docs/* rebrand, no SuperAdminDashboard wording change.
- Database/schema unchanged.

### Files

- `src/assets/biscuitpos-logo.png`, `src/assets/biscuitpos-logo-light.png`, `public/biscuitpos-logo.png` (new)
- `index.html`
- `src/pages/Index.tsx`
- `src/components/POSLoginScreen.tsx`
- `src/components/AdminLoginScreen.tsx`
- `src/components/ReceiptPreview.tsx`
- `src/lib/pdf.ts`
