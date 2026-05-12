import { generateReceiptPDF, Order, RestaurantSettings } from "@/lib/pdf";

/**
 * Generate the receipt PDF and open it in a new tab with the print dialog
 * triggered automatically. Falls back to download if the popup is blocked.
 */
export function printReceipt(order: Order, settings: RestaurantSettings) {
  try {
    const pdf = generateReceiptPDF(order, settings);
    // jsPDF supports autoPrint() — embeds a JS action that triggers print on open
    (pdf as any).autoPrint?.();
    const blobUrl = pdf.output("bloburl");
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      // popup blocked — fallback to download
      pdf.save(`receipt-${order.id}.pdf`);
    }
  } catch (err) {
    console.error("printReceipt failed", err);
  }
}
