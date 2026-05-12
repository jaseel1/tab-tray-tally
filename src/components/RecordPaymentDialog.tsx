import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Smartphone, Banknote, CreditCard, ArrowLeft, Split } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PendingOrderInfo {
  id: string; // serverId (uuid)
  order_number: string;
  total_amount: number;
  amount_paid: number;
  order_type?: string;
  table_number?: number;
  table_label?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accountId: string;
  order: PendingOrderInfo | null;
  onSuccess?: () => void;
}

type MethodKey = "upi" | "cash" | "card";

const METHODS: { key: MethodKey; label: string; Icon: typeof Smartphone; accent: string }[] = [
  { key: "upi", label: "UPI", Icon: Smartphone, accent: "text-info border-info/40 hover:bg-info/10" },
  { key: "cash", label: "Cash", Icon: Banknote, accent: "text-success border-success/40 hover:bg-success/10" },
  { key: "card", label: "Card", Icon: CreditCard, accent: "text-warning border-warning/40 hover:bg-warning/10" },
];

function orderTypeLabel(t?: string) {
  if (!t) return "";
  if (t === "dine_in") return "Dine-in";
  if (t === "parcel") return "Parcel";
  if (t === "takeaway") return "Takeaway";
  return t;
}

export function RecordPaymentDialog({ open, onOpenChange, accountId, order, onSuccess }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"quick" | "split">("quick");
  const [quickMethod, setQuickMethod] = useState<MethodKey | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({ cash: "", upi: "", card: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("quick");
      setQuickMethod(null);
      setAmounts({ cash: "", upi: "", card: "" });
    }
  }, [open]);

  const remaining = useMemo(() => {
    if (!order) return 0;
    return Math.max(order.total_amount - order.amount_paid, 0);
  }, [order]);

  const entered = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [amounts]
  );
  const overpay = entered - remaining;

  const fillRemaining = (key: string) => {
    const others = Object.entries(amounts)
      .filter(([k]) => k !== key)
      .reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
    const left = Math.max(remaining - others, 0);
    setAmounts((a) => ({ ...a, [key]: left.toFixed(2) }));
  };

  const submitPayments = async (payments: { method: string; amount: number }[]) => {
    if (!order) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("record_order_payment", {
        p_account_id: accountId,
        p_order_id: order.id,
        p_payments: payments,
      });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.message || "Failed to record payment");
      toast({
        title: res.payment_status === "paid" ? "Payment complete" : "Partial payment recorded",
        description: res.payment_status === "paid"
          ? `Bill ${order.order_number} fully paid.`
          : `₹${res.remaining?.toFixed?.(2) ?? "0.00"} remaining on ${order.order_number}.`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not record payment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const submitQuick = () => {
    if (!quickMethod || remaining <= 0) return;
    submitPayments([{ method: quickMethod, amount: remaining }]);
  };

  const submitSplit = () => {
    if (entered <= 0) {
      toast({ title: "Enter amount", description: "Add an amount to at least one method.", variant: "destructive" });
      return;
    }
    if (overpay > 0.01) {
      toast({ title: "Amount exceeds bill", description: `Reduce by ₹${overpay.toFixed(2)}`, variant: "destructive" });
      return;
    }
    const payments = METHODS
      .map((m) => ({ method: m.key, amount: parseFloat(amounts[m.key]) || 0 }))
      .filter((p) => p.amount > 0);
    submitPayments(payments);
  };

  const subtitleParts = order
    ? [
        `Bill #${order.order_number}`,
        orderTypeLabel(order.order_type),
        order.order_type === "dine_in"
          ? (order.table_label || (order.table_number ? `Table ${order.table_number}` : ""))
          : "",
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>{subtitleParts.join(" · ")}</DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                <p className="font-bold text-sm">₹{order.total_amount.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Paid</p>
                <p className="font-bold text-sm">₹{order.amount_paid.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-warning/15 p-2">
                <p className="text-[10px] uppercase text-warning">Due</p>
                <p className="font-bold text-sm">₹{remaining.toFixed(2)}</p>
              </div>
            </div>

            {mode === "quick" && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Payment method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((m) => {
                      const active = quickMethod === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setQuickMethod(m.key)}
                          className={cn(
                            "rounded-xl border-2 py-3 flex flex-col items-center gap-1 transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : `border-border ${m.accent}`
                          )}
                        >
                          <m.Icon size={22} />
                          <span className="text-xs font-semibold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={submitQuick}
                  disabled={saving || !quickMethod || remaining <= 0}
                  className="w-full rounded-xl h-12 text-base"
                >
                  {saving
                    ? "Saving..."
                    : quickMethod
                      ? `Mark ₹${remaining.toFixed(2)} paid via ${METHODS.find((x) => x.key === quickMethod)!.label}`
                      : "Select a method"}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("split")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                >
                  <Split size={12} /> Split across methods
                </button>

                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {mode === "split" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Back to single payment
                </button>

                <div className="space-y-3">
                  {METHODS.map((m) => (
                    <div key={m.key}>
                      <Label className="text-xs text-muted-foreground">{m.label}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={amounts[m.key]}
                          onChange={(e) => setAmounts((a) => ({ ...a, [m.key]: e.target.value }))}
                          className="rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fillRemaining(m.key)}
                          className="rounded-xl shrink-0"
                        >
                          Due
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">This payment</span>
                  <span className={`font-bold ${overpay > 0.01 ? "text-destructive" : "text-foreground"}`}>
                    ₹{entered.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={submitSplit} disabled={saving || entered <= 0} className="rounded-xl">
                    {saving ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
