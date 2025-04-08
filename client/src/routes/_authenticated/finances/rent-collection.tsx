// client/src/routes/_authenticated/finances/rent-collection.tsx
import { useProperties } from "@/api/trpc-hooks";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Filter,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
  "/_authenticated/finances/rent-collection"
)({
  component: RentCollection,
});

// Mock rent collection data
const RENT_DATA = [
  {
    id: "pay-1",
    tenantId: "tenant-1",
    tenantName: "James Wilson",
    property: "Sobha Garden",
    unit: "101",
    amount: 1200,
    dueDate: "2023-06-01",
    status: "paid",
    paymentDate: "2023-06-01",
    paymentMethod: "bank_transfer",
    lateFee: 0,
  },
  {
    id: "pay-2",
    tenantId: "tenant-2",
    tenantName: "Emily Davis",
    property: "Sobha Garden",
    unit: "103",
    amount: 1250,
    dueDate: "2023-06-01",
    status: "paid",
    paymentDate: "2023-05-30",
    paymentMethod: "credit_card",
    lateFee: 0,
  },
  {
    id: "pay-3",
    tenantId: "tenant-3",
    tenantName: "Robert Johnson",
    property: "Sobha Garden",
    unit: "201",
    amount: 1800,
    dueDate: "2023-06-01",
    status: "late",
    paymentDate: null,
    paymentMethod: null,
    lateFee: 90,
  },
  {
    id: "pay-4",
    tenantId: "tenant-4",
    tenantName: "Sarah Miller",
    property: "Sobha Garden",
    unit: "202",
    amount: 2400,
    dueDate: "2023-07-01",
    status: "upcoming",
    paymentDate: null,
    paymentMethod: null,
    lateFee: 0,
  },
  {
    id: "pay-5",
    tenantId: "tenant-5",
    tenantName: "Michael Brown",
    property: "Crown Tower",
    unit: "304",
    amount: 1650,
    dueDate: "2023-06-01",
    status: "pending",
    paymentDate: null,
    paymentMethod: null,
    lateFee: 0,
  },
  {
    id: "pay-6",
    tenantId: "tenant-6",
    tenantName: "Jennifer White",
    property: "Crown Tower",
    unit: "402",
    amount: 1550,
    dueDate: "2023-06-01",
    status: "paid",
    paymentDate: "2023-05-28",
    paymentMethod: "bank_transfer",
    lateFee: 0,
  },
];

function RentCollection() {
  const { properties = [], isLoading: propertiesLoading } = useProperties();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Filtered and sorted payments
  const filteredPayments = RENT_DATA.filter((payment) => {
    // Status filter
    if (statusFilter && payment.status !== statusFilter) return false;

    // Property filter
    if (propertyFilter && payment.property !== propertyFilter) return false;

    // Month filter (YYYY-MM format)
    const paymentMonth = payment.dueDate.slice(0, 7);
    if (selectedMonth && paymentMonth !== selectedMonth) return false;

    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.tenantName.toLowerCase().includes(searchLower) ||
        payment.unit.toLowerCase().includes(searchLower) ||
        payment.property.toLowerCase().includes(searchLower)
      );
    }

    return true;
  }).sort((a, b) => {
    // Sorting logic
    if (sortBy === "dueDate") {
      return sortOrder === "asc"
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    } else if (sortBy === "amount") {
      return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortBy === "tenant") {
      return sortOrder === "asc"
        ? a.tenantName.localeCompare(b.tenantName)
        : b.tenantName.localeCompare(a.tenantName);
    } else if (sortBy === "status") {
      return sortOrder === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  // Calculate summary statistics
  const summarizePayments = () => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const collected = filteredPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = filteredPayments
      .filter((p) => p.status === "pending" || p.status === "late")
      .reduce((sum, p) => sum + p.amount, 0);
    const upcoming = filteredPayments
      .filter((p) => p.status === "upcoming")
      .reduce((sum, p) => sum + p.amount, 0);
    const lateFees = filteredPayments.reduce((sum, p) => sum + p.lateFee, 0);

    return { total, collected, pending, upcoming, lateFees };
  };

  const summary = summarizePayments();

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Format date string for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Get month name from YYYY-MM format
  const getMonthName = (dateString: string) => {
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Handle record payment click
  const handleRecordPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setShowRecordPaymentModal(true);
  };

  // Mock record payment function
  const recordPayment = (paymentId: string, amount: number, method: string) => {
    console.log(`Recording payment: ${paymentId}, $${amount}, ${method}`);
    setShowRecordPaymentModal(false);
    setSelectedPayment(null);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case "late":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Late
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            Upcoming
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Rent Collection</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowRecordPaymentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Filters and Month Selection */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search tenants or units..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const date = new Date(selectedMonth);
              date.setMonth(date.getMonth() - 1);
              setSelectedMonth(date.toISOString().slice(0, 7));
            }}
          >
            <Calendar className="h-4 w-4 rotate-90" />
          </Button>
          <div className="font-medium">{getMonthName(selectedMonth)}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const date = new Date(selectedMonth);
              date.setMonth(date.getMonth() + 1);
              setSelectedMonth(date.toISOString().slice(0, 7));
            }}
          >
            <Calendar className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <RentSummaryCard
          title="Total Rent"
          value={`$${summary.total.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <RentSummaryCard
          title="Collected"
          value={`$${summary.collected.toLocaleString()}`}
          percentage={
            summary.total > 0
              ? Math.round((summary.collected / summary.total) * 100)
              : 0
          }
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <RentSummaryCard
          title="Pending/Late"
          value={`$${summary.pending.toLocaleString()}`}
          percentage={
            summary.total > 0
              ? Math.round((summary.pending / summary.total) * 100)
              : 0
          }
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        />
        <RentSummaryCard
          title="Upcoming"
          value={`$${summary.upcoming.toLocaleString()}`}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <RentSummaryCard
          title="Late Fees"
          value={`$${summary.lateFees.toLocaleString()}`}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      {/* Collection Progress */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Collection Progress</h2>
          <div className="text-sm text-muted-foreground">
            {summary.total > 0
              ? `${Math.round(
                  (summary.collected / summary.total) * 100
                )}% collected`
              : "No payments due"}
          </div>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{
              width: `${
                summary.total > 0
                  ? (summary.collected / summary.total) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      {/* Rent Payments Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort("tenant")}
                  >
                    Tenant
                    {sortBy === "tenant" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Property/Unit
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortBy === "amount" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort("dueDate")}
                  >
                    Due Date
                    {sortBy === "dueDate" && (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {sortBy === "status" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{payment.tenantName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{payment.property}</div>
                    <div className="text-sm text-muted-foreground">
                      Unit {payment.unit}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ${payment.amount.toLocaleString()}
                    {payment.lateFee > 0 && (
                      <div className="text-sm text-red-600">
                        + ${payment.lateFee} late fee
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div>{formatDate(payment.dueDate)}</div>
                    {payment.status === "paid" && (
                      <div className="text-sm text-muted-foreground">
                        Paid on: {formatDate(payment.paymentDate)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {(payment.status === "pending" ||
                        payment.status === "late") && (
                        <Button
                          size="sm"
                          onClick={() => handleRecordPayment(payment.id)}
                        >
                          Record Payment
                        </Button>
                      )}
                      {payment.status === "upcoming" && (
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Remind
                        </Button>
                      )}
                      {payment.status === "paid" && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No rent payments found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search or filters"
                        : "No rent payments for this period"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <RecordPaymentModal
          payment={
            selectedPayment
              ? RENT_DATA.find((p) => p.id === selectedPayment)
              : null
          }
          onClose={() => {
            setShowRecordPaymentModal(false);
            setSelectedPayment(null);
          }}
          onSubmit={recordPayment}
        />
      )}
    </div>
  );
}

// Summary Card Component
const RentSummaryCard = ({ title, value, percentage = null, icon }) => (
  <div className="bg-card border rounded-lg p-4">
    <div className="flex justify-between items-start mb-2">
      {icon}
      {percentage !== null && (
        <div className="text-sm font-medium">{percentage}%</div>
      )}
    </div>
    <div className="mt-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

// Record Payment Modal Component
const RecordPaymentModal = ({ payment, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(
    payment ? payment.amount + payment.lateFee : 0
  );
  const [method, setMethod] = useState("bank_transfer");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(payment?.id, amount, method);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Record Payment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span>×</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {payment && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tenant:</span>
                <span className="text-sm font-medium">
                  {payment.tenantName}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-muted-foreground">
                  Property/Unit:
                </span>
                <span className="text-sm">
                  {payment.property} - Unit {payment.unit}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-muted-foreground">Due Date:</span>
                <span className="text-sm">
                  {new Date(payment.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium">Payment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                step="0.01"
                min="0"
                required
              />
            </div>
            {payment && payment.lateFee > 0 && (
              <p className="text-sm text-muted-foreground">
                Includes ${payment.lateFee} late fee
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentCollection;
