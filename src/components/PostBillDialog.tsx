import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Printer, X } from "lucide-react";
import { Order, RestaurantSettings } from "@/lib/pdf";
import { printReceipt } from "@/lib/print";

interface PostBillDialogProps {
  open: boolean;
  order: Order | null;
  settings: RestaurantSettings;
  onClose: () => void;
  onRecordPayment: (order: Order) => void;
}

export function PostBillDialog({ open, order, settings, onClose, onRecordPayment }: PostBillDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bill printed</DialogTitle>
          <DialogDescription>
            Order #{order.id} — ₹{order.total.toFixed(2)}. Hand the bill to the customer, then choose:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <Button
            onClick={() => onRecordPayment(order)}
            className="w-full h-12 text-base font-semibold"
          >
            <CreditCard className="mr-2" size={18} />
            Record Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => printReceipt(order, settings)}
            className="w-full"
          >
            <Printer className="mr-2" size={16} />
            Reprint
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            <X className="mr-2" size={16} />
            Skip — pay later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
