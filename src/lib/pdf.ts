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

// Generate weekly sales report PDF
export const generateWeeklySalesPDF = (
  orders: Order[],
  weekStartDate: Date,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Calculate week end date
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  
  // Filter orders for the specific week
  const weekOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= weekStartDate && orderDate <= weekEndDate;
  });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Weekly Sales Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`${weekStartDate.toDateString()} - ${weekEndDate.toDateString()}`, pageWidth / 2, 40, { align: 'center' });
  
  // Summary stats
  const totalRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = weekOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  pdf.setFontSize(11);
  pdf.text(`Total Orders: ${totalOrders}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  pdf.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 20, 80);
  
  // Daily breakdown for the week
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(weekStartDate);
    currentDay.setDate(weekStartDate.getDate() + i);
    
    const dayOrders = weekOrders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.toDateString() === currentDay.toDateString();
    });
    
    const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
    
    dailyData.push([
      currentDay.toDateString(),
      dayOrders.length.toString(),
      `₹${dayRevenue.toFixed(2)}`
    ]);
  }
  
  if (dailyData.length > 0) {
    (pdf as any).autoTable({
      head: [['Date', 'Orders', 'Revenue']],
      body: dailyData,
      startY: 100,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  return pdf;
};

// Generate yearly sales report PDF
export const generateYearlySalesPDF = (
  orders: Order[],
  year: number,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Filter orders for the specific year
  const yearOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.getFullYear() === year;
  });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Yearly Sales Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Year ${year}`, pageWidth / 2, 40, { align: 'center' });
  
  // Summary stats
  const totalRevenue = yearOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = yearOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  pdf.setFontSize(11);
  pdf.text(`Total Orders: ${totalOrders}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  pdf.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 20, 80);
  
  // Monthly breakdown
  const monthlyData = [];
  for (let month = 0; month < 12; month++) {
    const monthOrders = yearOrders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.getMonth() === month;
    });
    
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    
    monthlyData.push([
      monthName,
      monthOrders.length.toString(),
      `₹${monthRevenue.toFixed(2)}`
    ]);
  }
  
  (pdf as any).autoTable({
    head: [['Month', 'Orders', 'Revenue']],
    body: monthlyData,
    startY: 100,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  return pdf;
};

// Generate payment method report PDF
export const generatePaymentMethodPDF = (
  orders: Order[],
  startDate: Date,
  endDate: Date,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Filter orders for the date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Payment Method Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`${startDate.toDateString()} - ${endDate.toDateString()}`, pageWidth / 2, 40, { align: 'center' });
  
  // Payment method breakdown
  const paymentBreakdown = filteredOrders.reduce((acc, order) => {
    const method = order.paymentMethod.toUpperCase();
    if (!acc[method]) {
      acc[method] = { orders: 0, revenue: 0 };
    }
    acc[method].orders += 1;
    acc[method].revenue += order.total;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);
  
  // Summary
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  
  pdf.setFontSize(11);
  pdf.text(`Total Orders: ${totalOrders}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  
  // Payment method table
  const tableData = Object.entries(paymentBreakdown).map(([method, data]) => [
    method,
    data.orders.toString(),
    `₹${data.revenue.toFixed(2)}`,
    `${((data.revenue / totalRevenue) * 100).toFixed(1)}%`
  ]);
  
  (pdf as any).autoTable({
    head: [['Payment Method', 'Orders', 'Revenue', 'Percentage']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  return pdf;
};

// Generate item-wise report PDF
export const generateItemWisePDF = (
  orders: Order[],
  startDate: Date,
  endDate: Date,
  settings: RestaurantSettings
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Filter orders for the date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  // Header
  pdf.setFontSize(20);
  pdf.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Item-wise Sales Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`${startDate.toDateString()} - ${endDate.toDateString()}`, pageWidth / 2, 40, { align: 'center' });
  
  // Item breakdown
  const itemBreakdown = filteredOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.name]) {
        acc[item.name] = { quantity: 0, revenue: 0 };
      }
      acc[item.name].quantity += item.quantity;
      acc[item.name].revenue += item.quantity * item.price;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);
  
  // Summary
  const totalItems = Object.values(itemBreakdown).reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = Object.values(itemBreakdown).reduce((sum, item) => sum + item.revenue, 0);
  
  pdf.setFontSize(11);
  pdf.text(`Total Items Sold: ${totalItems}`, 20, 60);
  pdf.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 20, 70);
  
  // Item table
  const tableData = Object.entries(itemBreakdown)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .map(([itemName, data]) => [
      itemName,
      data.quantity.toString(),
      `₹${data.revenue.toFixed(2)}`,
      `${((data.revenue / totalRevenue) * 100).toFixed(1)}%`
    ]);
  
  (pdf as any).autoTable({
    head: [['Item Name', 'Quantity Sold', 'Revenue', 'Percentage']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  return pdf;
};