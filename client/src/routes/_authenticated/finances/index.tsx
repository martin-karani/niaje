// client/src/routes/finances/index.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  DollarSign,
  DownloadCloud,
  FileText,
  Filter,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/finances/")({
  component: FinancialDashboard,
});

// Mock financial data
const MONTHLY_REVENUE = [
  { month: "Jan", amount: 185600 },
  { month: "Feb", amount: 192400 },
  { month: "Mar", amount: 210800 },
  { month: "Apr", amount: 208500 },
  { month: "May", amount: 215700 },
  { month: "Jun", amount: 223600 },
];

const EXPENSE_BREAKDOWN = [
  { category: "Maintenance", amount: 31840, percentage: 38 },
  { category: "Utilities", amount: 15200, percentage: 18 },
  { category: "Insurance", amount: 12600, percentage: 15 },
  { category: "Property Tax", amount: 18400, percentage: 22 },
  { category: "Others", amount: 5800, percentage: 7 },
];

const RECENT_TRANSACTIONS = [
  {
    id: "T-8745",
    date: "2023-06-12",
    description: "Rent payment - Unit 213B",
    amount: 2340,
    type: "income",
  },
  {
    id: "T-8744",
    date: "2023-06-11",
    description: "Plumbing repair - Unit 304",
    amount: 450,
    type: "expense",
  },
  {
    id: "T-8743",
    date: "2023-06-10",
    description: "Rent payment - Unit 107",
    amount: 2450,
    type: "income",
  },
  {
    id: "T-8742",
    date: "2023-06-09",
    description: "HVAC maintenance - Unit 214",
    amount: 780,
    type: "expense",
  },
  {
    id: "T-8741",
    date: "2023-06-09",
    description: "Rent payment - Unit 543",
    amount: 1850,
    type: "income",
  },
  {
    id: "T-8740",
    date: "2023-06-08",
    description: "Insurance premium",
    amount: 4200,
    type: "expense",
  },
  {
    id: "T-8739",
    date: "2023-06-07",
    description: "Rent payment - Unit 312",
    amount: 1950,
    type: "income",
  },
];

function FinancialDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("month"); // "month", "quarter", "year"

  // Check if user has access to financial data
  const hasAccess = user?.role === "landlord" || user?.role === "admin";

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          You don't have permission to view financial information. Please
          contact the property owner for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Financial Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Select Date Range
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Time period filter */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={dateRange === "month" ? "default" : "outline"}
          onClick={() => setDateRange("month")}
          size="sm"
        >
          Month
        </Button>
        <Button
          variant={dateRange === "quarter" ? "default" : "outline"}
          onClick={() => setDateRange("quarter")}
          size="sm"
        >
          Quarter
        </Button>
        <Button
          variant={dateRange === "year" ? "default" : "outline"}
          onClick={() => setDateRange("year")}
          size="sm"
        >
          Year
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          title="Total Revenue"
          value="$223,600"
          trend="+5.2%"
          trendDirection="up"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <FinancialCard
          title="Total Expenses"
          value="$83,840"
          trend="+3.1%"
          trendDirection="up"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <FinancialCard
          title="Net Income"
          value="$139,760"
          trend="+6.5%"
          trendDirection="up"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <FinancialCard
          title="Outstanding"
          value="$16,485"
          trend="-2.3%"
          trendDirection="down"
          icon={<CreditCard className="h-5 w-5" />}
          alert
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Revenue Overview</h2>
            <Button variant="ghost" size="sm">
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="p-4">
            {/* This would typically contain a real chart library like Recharts */}
            <div className="h-64 flex items-end space-x-2">
              {MONTHLY_REVENUE.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary rounded-t-sm"
                    style={{
                      height: `${(item.amount / 225000) * 100}%`,
                      opacity: item.month === "Jun" ? 1 : 0.7,
                    }}
                  ></div>
                  <div className="mt-2 text-sm font-medium">{item.month}</div>
                  <div className="text-xs text-muted-foreground">
                    ${(item.amount / 1000).toFixed(1)}k
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Expense Breakdown</h2>
          </div>
          <div className="p-4">
            <div className="mb-6 flex justify-center">
              <div className="relative w-32 h-32">
                <PieChart className="w-full h-full text-muted-foreground" />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-xl font-bold">$83,840</div>
                  <div className="text-xs text-muted-foreground">
                    Total Expenses
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {EXPENSE_BREAKDOWN.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Transactions</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Transaction ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Description
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {RECENT_TRANSACTIONS.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-sm">
                    {transaction.id}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{transaction.description}</td>
                  <td
                    className={`py-3 px-4 text-right font-medium ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}$
                    {transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const FinancialCard = ({
  title,
  value,
  trend,
  trendDirection,
  icon,
  alert = false,
}) => (
  <div
    className={`bg-card rounded-lg border shadow-sm p-6 ${
      alert ? "border-destructive/30" : ""
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <div
        className={`p-2 rounded-md ${
          alert ? "bg-destructive/10" : "bg-primary/10"
        }`}
      >
        {icon}
      </div>
      <div
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          trendDirection === "up"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }`}
      >
        {trend}
      </div>
    </div>
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    <p className={`text-2xl font-bold mt-1 ${alert ? "text-destructive" : ""}`}>
      {value}
    </p>
  </div>
);

export default FinancialDashboard;
