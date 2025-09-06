import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { FileText, Download } from "lucide-react";
import { Order, RestaurantSettings } from "@/lib/pdf";
import { 
  generateDailySalesPDF,
  generateMonthlySalesPDF,
  generateWeeklySalesPDF, 
  generateYearlySalesPDF, 
  generatePaymentMethodPDF, 
  generateItemWisePDF 
} from "@/lib/pdf";

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'dateRange';

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
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const reportData = useMemo(() => {
    let filteredOrders: Order[] = [];
    let title = '';

    switch (reportType) {
      case 'daily': {
        const targetDate = new Date(selectedDate);
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate.toDateString() === targetDate.toDateString();
        });
        title = `Daily Report - ${targetDate.toLocaleDateString()}`;
        break;
      }
      case 'weekly': {
        const weekStart = new Date(selectedWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        title = `Weekly Report - ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`;
        break;
      }
      case 'monthly': {
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate.getMonth() + 1 === selectedMonth && orderDate.getFullYear() === selectedYear;
        });
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        title = `Monthly Report - ${monthName}`;
        break;
      }
      case 'yearly': {
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate.getFullYear() === selectedYear;
        });
        title = `Yearly Report - ${selectedYear}`;
        break;
      }
      case 'dateRange': {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate >= start && orderDate <= end;
        });
        title = `Date Range Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
        break;
      }
    }

    // Calculate totals by payment method
    const totals = filteredOrders.reduce((acc, order) => {
      acc.totalRevenue += order.total;
      acc.totalOrders += 1;
      if (order.paymentMethod === 'cash') acc.cashTotal += order.total;
      if (order.paymentMethod === 'upi') acc.upiTotal += order.total;
      if (order.paymentMethod === 'card') acc.cardTotal += order.total;
      return acc;
    }, { totalRevenue: 0, totalOrders: 0, cashTotal: 0, upiTotal: 0, cardTotal: 0 });

    // Prepare chart data
    const paymentMethodData = [
      { method: 'Cash', value: totals.cashTotal, color: 'hsl(var(--primary))' },
      { method: 'UPI', value: totals.upiTotal, color: 'hsl(var(--chart-2))' },
      { method: 'Card', value: totals.cardTotal, color: 'hsl(var(--chart-3))' }
    ].filter(item => item.value > 0);

    // Daily breakdown for non-daily reports
    let dailyBreakdown: Array<{
      date: string;
      orders: number;
      cash: number;
      upi: number;
      card: number;
      total: number;
    }> = [];

    if (reportType !== 'daily') {
      const dateMap = new Map<string, { orders: number; cash: number; upi: number; card: number; total: number }>();
      
      filteredOrders.forEach(order => {
        const dateKey = new Date(order.timestamp).toLocaleDateString();
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { orders: 0, cash: 0, upi: 0, card: 0, total: 0 });
        }
        const dayData = dateMap.get(dateKey)!;
        dayData.orders += 1;
        dayData.total += order.total;
        if (order.paymentMethod === 'cash') dayData.cash += order.total;
        if (order.paymentMethod === 'upi') dayData.upi += order.total;
        if (order.paymentMethod === 'card') dayData.card += order.total;
      });

      dailyBreakdown = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return { 
      title, 
      totals, 
      paymentMethodData, 
      dailyBreakdown,
      filteredOrders 
    };
  }, [orders, reportType, selectedDate, selectedWeek, selectedMonth, selectedYear, startDate, endDate]);

  const handleGeneratePDF = () => {
    switch (reportType) {
      case 'daily':
        generateDailyReport(new Date(selectedDate));
        break;
      case 'weekly': {
        const weekDate = new Date(selectedWeek);
        const pdf = generateWeeklySalesPDF(orders, weekDate, settings);
        pdf.save(`weekly-sales-${selectedWeek}.pdf`);
        break;
      }
      case 'monthly':
        generateMonthlyReport(selectedMonth - 1, selectedYear);
        break;
      case 'yearly': {
        const pdf = generateYearlySalesPDF(orders, selectedYear, settings);
        pdf.save(`yearly-sales-${selectedYear}.pdf`);
        break;
      }
      case 'dateRange': {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const pdf = generatePaymentMethodPDF(orders, start, end, settings);
        pdf.save(`date-range-report-${startDate}-to-${endDate}.pdf`);
        break;
      }
    }
  };

  const chartConfig = {
    cash: { label: "Cash", color: "hsl(var(--primary))" },
    upi: { label: "UPI", color: "hsl(var(--chart-2))" },
    card: { label: "Card", color: "hsl(var(--chart-3))" }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="dateRange">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'daily' && (
            <div className="flex-1 space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex-1 space-y-2">
              <Label>Week Start Date</Label>
              <Input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div className="flex-1 space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="2020"
                  max="2030"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                />
              </div>
            </>
          )}

          {reportType === 'yearly' && (
            <div className="flex-1 space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                min="2020"
                max="2030"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
          )}

          {reportType === 'dateRange' && (
            <>
              <div className="flex-1 space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <Button onClick={handleGeneratePDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold">₹{reportData.totals.totalRevenue.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Orders</div>
          <div className="text-2xl font-bold">{reportData.totals.totalOrders}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Cash Sales</div>
          <div className="text-2xl font-bold">₹{reportData.totals.cashTotal.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">UPI Sales</div>
          <div className="text-2xl font-bold">₹{reportData.totals.upiTotal.toFixed(2)}</div>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie 
                    data={reportData.paymentMethodData} 
                    dataKey="value" 
                    nameKey="method"
                    innerRadius={60}
                    fill="var(--color-cash)"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>

        {/* Daily Breakdown Chart (for non-daily reports) */}
        {reportType !== 'daily' && reportData.dailyBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
            <div className="h-64">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cash" stackId="payment" fill="var(--color-cash)" />
                    <Bar dataKey="upi" stackId="payment" fill="var(--color-upi)" />
                    <Bar dataKey="card" stackId="payment" fill="var(--color-card)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Data Table */}
      {reportType !== 'daily' && reportData.dailyBreakdown.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Sales Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Orders</th>
                  <th className="text-right py-2">Cash</th>
                  <th className="text-right py-2">UPI</th>
                  <th className="text-right py-2">Card</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.dailyBreakdown.map((day, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2">{day.date}</td>
                    <td className="text-right py-2">{day.orders}</td>
                    <td className="text-right py-2">₹{day.cash.toFixed(2)}</td>
                    <td className="text-right py-2">₹{day.upi.toFixed(2)}</td>
                    <td className="text-right py-2">₹{day.card.toFixed(2)}</td>
                    <td className="text-right py-2 font-medium">₹{day.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
export default ReportsSection;