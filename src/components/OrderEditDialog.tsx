import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_number: string;
    payment_method: string;
    total_amount: number;
  } | null;
  accountId: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

const paymentMethods = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "Card", label: "Card", icon: CreditCard },
];

export function OrderEditDialog({
  open,
  onOpenChange,
  order,
  accountId,
  isAdmin = false,
  onSuccess,
}: OrderEditDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    order?.payment_method || "Cash"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!order) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("update_order_payment_method", {
        p_order_id: order.id,
        p_payment_method: selectedPaymentMethod,
        p_account_id: accountId,
        p_is_admin: isAdmin,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast.success("Payment method updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to update payment method");
      }
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      toast.error(error.message || "Failed to update payment method");
    } finally {
      setIsLoading(false);
    }
  };

  // Update selected payment method when order changes
  if (order && selectedPaymentMethod !== order.payment_method && !open) {
    setSelectedPaymentMethod(order.payment_method);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.order_number}</DialogTitle>
          <DialogDescription>
            Change the payment method for this order.
            {order && (
              <span className="block mt-1 font-medium">
                Total: ₹{order.total_amount.toFixed(2)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">
            Payment Method
          </Label>
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={setSelectedPaymentMethod}
            className="grid grid-cols-3 gap-3"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.value}>
                  <RadioGroupItem
                    value={method.value}
                    id={method.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={method.value}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                  >
                    <Icon className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
