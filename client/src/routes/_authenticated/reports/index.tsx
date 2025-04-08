// client/src/routes/reports/index.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart,
  Building,
  Clock,
  Download,
  FileText,
  Filter,
  Mail,
  PieChart,
  Printer,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: FinancialReports,
});

// Mock report types
const REPORT_TYPES = [
  {
    id: "income-statement",
    name: "Income Statement",
    description: "Revenue, expenses, and profit for a specific period",
    icon: <BarChart className="w-8 h-8 text-primary" />,
    period: "Monthly",
  },
  {
    id: "cash-flow",
    name: "Cash Flow Statement",
    description: "Track incoming and outgoing cash flow",
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    period: "Monthly",
  },
  {
    id: "rent-roll",
    name: "Rent Roll Report",
    description: "Overview of all rental units and their status",
    icon: <Building className="w-8 h-8 text-primary" />,
    period: "Current",
  },
  {
    id: "expense-breakdown",
    name: "Expense Breakdown",
    description: "Detailed breakdown of expenses by category",
    icon: <PieChart className="w-8 h-8 text-primary" />,
    period: "Monthly",
  },
  {
    id: "outstanding-balances",
    name: "Outstanding Balances",
    description: "List of all outstanding tenant balances",
    icon: <Clock className="w-8 h-8 text-primary" />,
    period: "Current",
  },
  {
    id: "tax-summary",
    name: "Tax Summary",
    description: "Income and expenses formatted for tax reporting",
    icon: <FileText className="w-8 h-8 text-primary" />,
    period: "Annual",
  },
];

// Mock saved reports
const SAVED_REPORTS = [
  {
    id: "report-1",
    name: "June 2023 Income Statement",
    type: "Income Statement",
    date: "2023-06-30",
    format: "PDF",
  },
  {
    id: "report-2",
    name: "Q2 2023 Cash Flow",
    type: "Cash Flow Statement",
    date: "2023-06-30",
    format: "Excel",
  },
  {
    id: "report-3",
    name: "May 2023 Expense Breakdown",
    type: "Expense Breakdown",
    date: "2023-05-31",
    format: "PDF",
  },
  {
    id: "report-4",
    name: "Current Rent Roll (June 2023)",
    type: "Rent Roll Report",
    date: "2023-06-15",
    format: "PDF",
  },
  {
    id: "report-5",
    name: "Outstanding Balances (June 15)",
    type: "Outstanding Balances",
    date: "2023-06-15",
    format: "Excel",
  },
];

function FinancialReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("generate"); // "generate" or "saved"

  // Check if user has access to financial reports
  const hasAccess = user?.role === "landlord" || user?.role === "admin";

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          You don't have permission to view or generate reports. Please contact
          the property owner for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Financial Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex flex-wrap -mb-px">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "generate"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("generate")}
          >
            Generate Reports
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "saved"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("saved")}
          >
            Saved Reports
          </button>
        </div>
      </div>

      {/* Generate Reports Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Report Options</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Report Type
                  </label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">Select a report type</option>
                    {REPORT_TYPES.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full p-2 border rounded-md"
                        placeholder="Start Date"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full p-2 border rounded-md"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Properties
                  </label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="all">All Properties</option>
                    <option value="property-1">Sobha Garden</option>
                    <option value="property-2">Crown Tower</option>
                    <option value="property-3">Business Center</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Format
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        className="mr-2"
                        defaultChecked
                      />
                      <span>PDF</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        className="mr-2"
                      />
                      <span>Excel</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        className="mr-2"
                      />
                      <span>CSV</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Additional Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Include charts and graphs</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Include transaction details</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Save report for future reference</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., June 2023 Income Statement"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <Button variant="outline">Preview Report</Button>
              <Button>Generate Report</Button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === "saved" && (
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">Saved Reports</h2>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="py-1 pl-8 pr-4 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Report Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Format
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {SAVED_REPORTS.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">{report.name}</td>
                    <td className="py-3 px-4">{report.type}</td>
                    <td className="py-3 px-4">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.format === "PDF"
                            ? "bg-blue-100 text-blue-700"
                            : report.format === "Excel"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {report.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Report Card Component
const ReportCard = ({ report }) => (
  <div className="bg-card border rounded-lg hover:shadow-md transition-shadow group cursor-pointer p-6">
    <div className="mb-4">{report.icon}</div>
    <h3 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">
      {report.name}
    </h3>
    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
    <div className="flex justify-between items-center">
      <span className="text-xs px-2 py-1 bg-muted rounded-full">
        {report.period}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="group-hover:opacity-100 opacity-0 transition-opacity"
      >
        Generate <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default FinancialReports;
