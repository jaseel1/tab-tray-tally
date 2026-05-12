## Fix Payment Split Pie Chart

### Problem
In `src/components/ReportsSection.tsx`, the Payment Split pie renders all slices in the same color and shows no labels/legend, making it impossible to tell Cash vs UPI vs Card apart.

Root causes:
- `<Pie>` uses a single `fill="var(--color-cash)"` for every slice. Recharts needs one `<Cell>` per slice (each with its own color) to color them differently.
- The data items use `method` ("Cash", "UPI", "Card") as `nameKey`, but `chartConfig` keys are lowercase (`cash`, `upi`, `card`), so the tooltip can't resolve a color/label.
- No legend is rendered, so users can't map slice color to method.

### Changes (src/components/ReportsSection.tsx)

1. **Normalize data keys** in `paymentMethodData` (around line 108):
   - Use lowercase `method` keys (`'cash' | 'upi' | 'card'`) and a separate `label` field for display.
   - Drop the inline `color` field (we'll source colors from `chartConfig`).

2. **Render colored cells** in the `<Pie>` (around lines 319–325):
   - Map `reportData.paymentMethodData` to `<Cell key={method} fill={chartConfig[method].color} />`.
   - Remove the misleading `fill="var(--color-cash)"` default.

3. **Add a legend** below the pie:
   - Import `Legend` from recharts and render `<Legend />` inside `<PieChart>`, OR render a small custom legend row (color swatch + label + amount + %) underneath the chart for clarity on small viewports.

4. **Tooltip fix**: Because `nameKey` will now be the lowercase method, `ChartTooltipContent` will correctly resolve labels from `chartConfig`. Keep `hideLabel` as-is.

### Out of Scope
- No backend or data changes; the totals computation is already correct.
- No changes to the Daily Breakdown table or other charts.
