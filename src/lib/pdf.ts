import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
  status: string;
}

export interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
}

// Generate receipt PDF for 58mm thermal printer
export const generateReceiptPDF = (
  order: Order,
  settings: RestaurantSettings
) => {
  // Create a narrow PDF for 58mm width (roughly 2.3 inches)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 200] // 58mm width, 200mm max height
  });

  let yPos = 10;
  const pageWidth = 58;
  const margin = 3;

  // Set font
  pdf.setFont('courier', 'normal');
  
  // Header
  pdf.setFontSize(12);
  pdf.text(settings.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  
  pdf.setFontSize(8);
  if (settings.address) {
    const addressLines = pdf.splitTextToSize(settings.address, pageWidth - 2 * margin);
    addressLines.forEach((line: string) => {
      pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
      yPos += 3;
    });
  }
  
  if (settings.phone) {
    pdf.text(settings.phone, pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;
  }
  
  // Divider
  yPos += 2;
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;
  
  // Order details
  pdf.setFontSize(8);
  pdf.text(`Order #${order.id}`, margin, yPos);
  yPos += 3;
  pdf.text(new Date(order.timestamp).toLocaleString(), margin, yPos);
  yPos += 3;
  pdf.text(`Payment: ${order.paymentMethod.toUpperCase()}`, margin, yPos);
  yPos += 5;
  
  // Items
  order.items.forEach((item) => {
    const itemLine = `${item.quantity}x ${item.name}`;
    const price = `₹${(item.price * item.quantity).toFixed(2)}`;
    
    // Split long item names
    const lines = pdf.splitTextToSize(itemLine, pageWidth - margin - 15);
    lines.forEach((line: string, index: number) => {
      pdf.text(line, margin, yPos);
      if (index === 0) {
        pdf.text(price, pageWidth - margin, yPos, { align: 'right' });
      }
      yPos += 3;
    });
  });
  
  // Divider
  yPos += 2;
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;
  
  // Total
  const subtotal = order.total / (1 + settings.taxRate / 100);
  const tax = order.total - subtotal;
  
  pdf.text('Subtotal:', margin, yPos);
  pdf.text(`₹${subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 3;
  
  if (settings.taxRate > 0) {
    pdf.text(`Tax (${settings.taxRate}%):`, margin, yPos);
    pdf.text(`₹${tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 3;
  }
  
  pdf.setFontSize(10);
  pdf.text('TOTAL:', margin, yPos);
  pdf.text(`₹${order.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Footer
  pdf.setFontSize(8);
  pdf.text('Thank you for your visit!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;
  pdf.text('Please visit again', pageWidth / 2, yPos, { align: 'center' });
  
  return pdf;
};

// Generate daily sales report PDF
export const generateDailySalesPDF = (
  orders: Order[],
  date: Date,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Filter orders for the specific date
  const dayOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === date.toDateString();
  });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Daily Sales Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(date.toDateString(), pageWidth / 2, 40, { align: 'center' });
  
  // Summary stats
  const totalRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = dayOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  pdf.setFontSize(11);
  pdf.text(`Total Orders: ${totalOrders}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  pdf.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 20, 80);
  
  // Payment method breakdown
  const paymentBreakdown = dayOrders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);
  
  let yPos = 100;
  pdf.text('Payment Method Breakdown:', 20, yPos);
  yPos += 10;
  
  Object.entries(paymentBreakdown).forEach(([method, total]) => {
    pdf.text(`${method.toUpperCase()}: ₹${total.toFixed(2)}`, 30, yPos);
    yPos += 10;
  });
  
  // Orders table
  if (dayOrders.length > 0) {
    yPos += 10;
    
    const tableData = dayOrders.map(order => [
      order.id,
      new Date(order.timestamp).toLocaleTimeString(),
      order.items.length.toString(),
      order.paymentMethod.toUpperCase(),
      `₹${order.total.toFixed(2)}`
    ]);
    
    (pdf as any).autoTable({
      head: [['Order ID', 'Time', 'Items', 'Payment', 'Total']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  return pdf;
};

// Generate monthly sales report PDF
export const generateMonthlySalesPDF = (
  orders: Order[],
  month: number,
  year: number,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Filter orders for the specific month
  const monthOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.getMonth() === month && orderDate.getFullYear() === year;
  });
  
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Monthly Sales Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`${monthName} ${year}`, pageWidth / 2, 40, { align: 'center' });
  
  // Summary stats
  const totalRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = monthOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  pdf.setFontSize(11);
  pdf.text(`Total Orders: ${totalOrders}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  pdf.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 20, 80);
  
  // Daily breakdown
  const dailyBreakdown: Record<string, { orders: number; revenue: number }> = {};
  
  monthOrders.forEach(order => {
    const day = new Date(order.timestamp).getDate().toString();
    if (!dailyBreakdown[day]) {
      dailyBreakdown[day] = { orders: 0, revenue: 0 };
    }
    dailyBreakdown[day].orders += 1;
    dailyBreakdown[day].revenue += order.total;
  });
  
  // Daily breakdown table
  if (Object.keys(dailyBreakdown).length > 0) {
    const tableData = Object.entries(dailyBreakdown)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, data]) => [
        `${day}/${month + 1}/${year}`,
        data.orders.toString(),
        `₹${data.revenue.toFixed(2)}`
      ]);
    
    (pdf as any).autoTable({
      head: [['Date', 'Orders', 'Revenue']],
      body: tableData,
      startY: 100,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  return pdf;
};