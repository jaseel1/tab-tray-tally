import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PendingOrderInfo {
  id: string; // serverId (uuid)
  order_number: string;
  total_amount: number;
  amount_paid: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accountId: string;
  order: PendingOrderInfo | null;
  onSuccess?: () => void;
}

const METHODS: { key: "cash" | "upi" | "card"; label: string; tone: string }[] = [
  { key: "cash", label: "Cash", tone: "bg-success/10 text-success" },
  { key: "upi", label: "UPI", tone: "bg-info/10 text-info" },
  { key: "card", label: "Card", tone: "bg-warning/10 text-warning" },
];

export function RecordPaymentDialog({ open, onOpenChange, accountId, order, onSuccess }: Props) {
  const { toast } = useToast();
  const [amounts, setAmounts] = useState<Record<string, string>>({ cash: "", upi: "", card: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setAmounts({ cash: "", upi: "", card: "" });
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

  const submit = async () => {
    if (!order) return;
    if (entered <= 0) {
      toast({ title: "Enter amount", description: "Add an amount to at least one method.", variant: "destructive" });
      return;
    }
    if (overpay > 0.01) {
      toast({ title: "Amount exceeds bill", description: `Reduce by ₹${overpay.toFixed(2)}`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payments = METHODS
        .map((m) => ({ method: m.key, amount: parseFloat(amounts[m.key]) || 0 }))
        .filter((p) => p.amount > 0);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {order ? `Bill #${order.order_number}` : ""}
          </DialogDescription>
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
              <Button onClick={submit} disabled={saving || entered <= 0} className="rounded-xl">
                {saving ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
