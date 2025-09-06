import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import { generateReceiptPDF, Order, RestaurantSettings } from "@/lib/pdf";

interface ReceiptPreviewProps {
  order: Order;
  settings: RestaurantSettings;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptPreview({ order, settings, isOpen, onClose }: ReceiptPreviewProps) {
  const subtotal = order.total / (1 + settings.taxRate / 100);
  const tax = order.total - subtotal;

  const handlePrint = () => {
    // Add printing class to body for print-specific styles
    document.body.classList.add('printing-receipt');
    
    // Create a temporary div with receipt content for printing
    const printDiv = document.createElement('div');
    printDiv.innerHTML = document.querySelector('.receipt-content')?.innerHTML || '';
    printDiv.className = 'receipt-58mm';
    
    document.body.appendChild(printDiv);
    
    // Print
    window.print();
    
    // Cleanup
    document.body.removeChild(printDiv);
    document.body.classList.remove('printing-receipt');
  };

  const handleDownloadPDF = () => {
    const pdf = generateReceiptPDF(order, settings);
    pdf.save(`receipt-${order.id}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
        </DialogHeader>
        
        <Card className="bg-white border-2 border-dashed border-muted">
          <CardContent className="p-4 receipt-content">
            <div className="text-center space-y-1 mb-4">
              <h3 className="font-bold text-lg text-foreground">{settings.name}</h3>
              {settings.address && (
                <p className="text-sm text-muted-foreground leading-tight">
                  {settings.address}
                </p>
              )}
              {settings.phone && (
                <p className="text-sm text-muted-foreground">{settings.phone}</p>
              )}
            </div>
            
            <div className="border-t border-dashed border-muted pt-3 mb-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order #{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(order.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="uppercase">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.quantity}x {item.name}</div>
                    <div className="text-muted-foreground text-xs">
                      ₹{item.price} each
                    </div>
                  </div>
                  <div className="font-medium">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-dashed border-muted pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {settings.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({settings.taxRate}%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-dashed border-muted pt-2">
                <span>TOTAL:</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              <p>Thank you for your visit!</p>
              <p>Please visit again</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2" size={16} />
            Print Receipt
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
            <Download className="mr-2" size={16} />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}