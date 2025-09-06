import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, Filter } from "lucide-react";
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
    <div className="space-y-4">
      {/* Compact Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="dateRange">Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'daily' && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          )}

          {reportType === 'weekly' && (
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-40"
            />
          )}

          {reportType === 'monthly' && (
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="2020"
                max="2030"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-20"
              />
            </div>
          )}

          {reportType === 'yearly' && (
            <Input
              type="number"
              min="2020"
              max="2030"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-20"
            />
          )}

          {reportType === 'dateRange' && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground self-center">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
              />
            </div>
          )}

          <Button onClick={handleGeneratePDF} size="sm" className="ml-auto">
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </Card>

      {/* Compact KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Revenue</div>
          <div className="text-lg font-bold">₹{reportData.totals.totalRevenue.toFixed(0)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Orders</div>
          <div className="text-lg font-bold">{reportData.totals.totalOrders}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Cash</div>
          <div className="text-lg font-bold text-green-600">₹{reportData.totals.cashTotal.toFixed(0)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">UPI</div>
          <div className="text-lg font-bold text-blue-600">₹{reportData.totals.upiTotal.toFixed(0)}</div>
        </Card>
      </div>

      {/* Charts and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Payment Split</h3>
          <div className="h-48">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie 
                    data={reportData.paymentMethodData} 
                    dataKey="value" 
                    nameKey="method"
                    innerRadius={50}
                    fill="var(--color-cash)"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>

        {/* Daily Breakdown Table */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-medium mb-3">
            {reportType === 'daily' ? 'Daily Summary' : 'Daily Breakdown'}
          </h3>
          {reportType === 'daily' ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">{reportData.totals.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span className="font-medium text-green-600">₹{reportData.totals.cashTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>UPI Sales:</span>
                <span className="font-medium text-blue-600">₹{reportData.totals.upiTotal.toFixed(2)}</span>
              </div>
              {reportData.totals.cardTotal > 0 && (
                <div className="flex justify-between">
                  <span>Card Sales:</span>
                  <span className="font-medium text-purple-600">₹{reportData.totals.cardTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total Revenue:</span>
                <span className="font-bold">₹{reportData.totals.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left">
                    <th className="py-2">Date</th>
                    <th className="py-2 text-right">Orders</th>
                    <th className="py-2 text-right">Cash</th>
                    <th className="py-2 text-right">UPI</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyBreakdown.map((day, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-1.5">{day.date}</td>
                      <td className="py-1.5 text-right">{day.orders}</td>
                      <td className="py-1.5 text-right text-green-600">₹{day.cash.toFixed(0)}</td>
                      <td className="py-1.5 text-right text-blue-600">₹{day.upi.toFixed(0)}</td>
                      <td className="py-1.5 text-right font-medium">₹{day.total.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default ReportsSection;