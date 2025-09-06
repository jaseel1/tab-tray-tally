import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FileText, Calendar } from "lucide-react";
import { Order, RestaurantSettings } from "@/lib/pdf";
import { 
  generateWeeklySalesPDF, 
  generateYearlySalesPDF, 
  generatePaymentMethodPDF, 
  generateItemWisePDF 
} from "@/lib/pdf";

interface ReportsSectionProps {
  orders: Order[];
  settings: RestaurantSettings;
  generateDailyReport: (date?: Date) => void;
  generateMonthlyReport: (month?: number, year?: number) => void;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({
  orders,
  settings,
  generateDailyReport,
  generateMonthlyReport
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment method data
  const paymentMethodData = orders.reduce((acc, order) => {
    const method = order.paymentMethod;
    const existing = acc.find(item => item.method === method);
    if (existing) {
      existing.value += order.total;
    } else {
      acc.push({ method, value: order.total });
    }
    return acc;
  }, [] as { method: string; value: number }[]);

  const paymentMethodConfig = {
    cash: { label: "Cash", color: "hsl(var(--primary))" },
    card: { label: "Card", color: "hsl(var(--secondary))" },
    upi: { label: "UPI", color: "hsl(var(--accent))" }
  };

  // Daily sales data (last 7 days)
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.toDateString() === date.toDateString();
    });
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0)
    };
  }).reverse();

  const dailySalesConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" }
  };

  // Statistics calculations
  const today = new Date();
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= weekStart && orderDate <= today;
  });
  const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= monthStart && orderDate <= today;
  });
  const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= yearStart && orderDate <= today;
  });
  const yearRevenue = yearOrders.reduce((sum, order) => sum + order.total, 0);

  const handleWeeklyReport = () => {
    const weekDate = new Date(selectedWeek);
    const pdf = generateWeeklySalesPDF(orders, weekDate, settings);
    pdf.save(`weekly-sales-${selectedWeek}.pdf`);
  };

  const handleYearlyReport = () => {
    const pdf = generateYearlySalesPDF(orders, selectedYear, settings);
    pdf.save(`yearly-sales-${selectedYear}.pdf`);
  };

  const handlePaymentMethodReport = () => {
    const startDate = new Date(reportStartDate);
    const endDate = new Date(reportEndDate);
    const pdf = generatePaymentMethodPDF(orders, startDate, endDate, settings);
    pdf.save(`payment-method-report-${reportStartDate}-to-${reportEndDate}.pdf`);
  };

  const handleItemWiseReport = () => {
    const startDate = new Date(reportStartDate);
    const endDate = new Date(reportEndDate);
    const pdf = generateItemWisePDF(orders, startDate, endDate, settings);
    pdf.save(`item-wise-report-${reportStartDate}-to-${reportEndDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="font-medium text-sm text-muted-foreground">Today</h4>
          <p className="text-2xl font-bold">₹{todayRevenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{todayOrders.length} orders</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium text-sm text-muted-foreground">This Week</h4>
          <p className="text-2xl font-bold">₹{weekRevenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{weekOrders.length} orders</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium text-sm text-muted-foreground">This Month</h4>
          <p className="text-2xl font-bold">₹{monthRevenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{monthOrders.length} orders</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium text-sm text-muted-foreground">This Year</h4>
          <p className="text-2xl font-bold">₹{yearRevenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{yearOrders.length} orders</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="h-64">
            <ChartContainer config={paymentMethodConfig}>
              <PieChart>
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie 
                  data={paymentMethodData} 
                  dataKey="value" 
                  nameKey="method"
                  innerRadius={60}
                />
              </PieChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Sales (Last 7 Days)</h3>
          <div className="h-64">
            <ChartContainer config={dailySalesConfig}>
              <BarChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>

      {/* PDF Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Reports</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="daily-date">Select Date</Label>
              <Input
                id="daily-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => generateDailyReport(new Date(selectedDate))} 
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Daily PDF
            </Button>
          </div>
        </Card>

        {/* Weekly Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Reports</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weekly-date">Select Week Starting Date</Label>
              <Input
                id="weekly-date"
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              />
            </div>
            <Button onClick={handleWeeklyReport} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Generate Weekly PDF
            </Button>
          </div>
        </Card>

        {/* Monthly Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Reports</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="monthly-month">Month</Label>
                <Input
                  id="monthly-month"
                  type="number"
                  min="1"
                  max="12"
                  value={selectedMonth + 1}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value) - 1)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-year">Year</Label>
                <Input
                  id="monthly-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                />
              </div>
            </div>
            <Button 
              onClick={() => generateMonthlyReport(selectedMonth, selectedYear)} 
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Monthly PDF
            </Button>
          </div>
        </Card>

        {/* Yearly Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Yearly Reports</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="yearly-year">Select Year</Label>
              <Input
                id="yearly-year"
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
            <Button onClick={handleYearlyReport} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Generate Yearly PDF
            </Button>
          </div>
        </Card>

        {/* Payment Method Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method Report</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-start">Start Date</Label>
              <Input
                id="payment-start"
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payment-end">End Date</Label>
              <Input
                id="payment-end"
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handlePaymentMethodReport} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Generate Payment PDF
            </Button>
          </div>
        </Card>

        {/* Item-wise Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Item-wise Report</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-start">Start Date</Label>
              <Input
                id="item-start"
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="item-end">End Date</Label>
              <Input
                id="item-end"
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleItemWiseReport} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Generate Item-wise PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSection;