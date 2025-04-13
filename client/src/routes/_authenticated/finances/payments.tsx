import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/providers/auth-provider";
import { RouterInputs } from "@/utils/trpc";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Edit,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/finances/payments")({
  component: Payments,
});

function Payments() {
  const { user, activeProperty } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Use the payments hook to fetch transaction data
  const payments = usePayments();

  // Define transaction filters
  const transactionFilters: RouterInputs["payments"]["getAllTransactions"] = {
    propertyId: activeProperty?.id,
    // Apply status filter based on activeTab
    status:
      activeTab === "unpaid"
        ? "pending"
        : activeTab === "paid"
        ? "completed"
        : undefined,
    // You could add additional filters based on selectedVendor, selectedUnit, etc.
    limit: 20,
  };

  // Fetch transactions based on filters
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = payments.transactions.getAll(transactionFilters);

  // Calculate summary statistics based on transactions data
  const calculateStats = () => {
    if (!transactionsData?.transactions) {
      return {
        rentReceived: {
          amount: "$0.00",
          change: "0%",
          isUp: false,
          details: "Due this month",
          value: "$0.00",
        },
        upcomingPayments: {
          amount: "$0.00",
          change: "0%",
          isUp: false,
          details: "0 this month",
        },
        rentOverdue: {
          amount: "$0.00",
          change: "0%",
          isUp: false,
          details: "0 Overdue",
        },
        totalExpense: {
          amount: "$0.00",
          change: "0%",
          isUp: false,
          details: "0 works",
        },
      };
    }

    // Extract data from transactions
    const transactions = transactionsData.transactions;

    // Calculate totals for different types of transactions
    const paidRent = transactions
      .filter((tx) => tx.status === "completed" && tx.type === "rent")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const upcomingPayments = transactions
      .filter((tx) => tx.status === "pending" && tx.type === "rent")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const overdueRent = transactions
      .filter((tx) => tx.status === "failed" && tx.type === "rent")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = transactions
      .filter((tx) => tx.type === "fee" || tx.type === "utility")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Count transactions for details
    const pendingCount = transactions.filter(
      (tx) => tx.status === "pending"
    ).length;
    const overdueCount = transactions.filter(
      (tx) => tx.status === "failed"
    ).length;
    const expensesCount = transactions.filter(
      (tx) => tx.type === "fee" || tx.type === "utility"
    ).length;

    // In a real app, you'd calculate the change percentage by comparing to previous period
    // For now, we'll use placeholder values
    const changePlaceholder = "15.8%";

    return {
      rentReceived: {
        amount: `$${paidRent.toLocaleString()}`,
        change: changePlaceholder,
        isUp: true,
        details: "Due this month",
        value: `$${(paidRent * 1.2).toLocaleString()}`,
      },
      upcomingPayments: {
        amount: `$${upcomingPayments.toLocaleString()}`,
        change: changePlaceholder,
        isUp: true,
        details: `${pendingCount} this month`,
      },
      rentOverdue: {
        amount: `$${overdueRent.toLocaleString()}`,
        change: changePlaceholder,
        isUp: false,
        details: `${overdueCount} Overdue`,
      },
      totalExpense: {
        amount: `$${totalExpenses.toLocaleString()}`,
        change: changePlaceholder,
        isUp: false,
        details: `${expensesCount} works`,
      },
    };
  };

  // Compute stats
  const statsData = calculateStats();

  // Filter transactions based on additional client-side filters
  const filteredTransactions = transactionsData?.transactions
    ? transactionsData.transactions
        .filter((transaction) => {
          // Apply vendor filter if selected
          if (selectedVendor && transaction.paymentMethod !== selectedVendor) {
            return false;
          }

          // Apply unit filter if selected
          if (selectedUnit && transaction.lease?.unit?.name !== selectedUnit) {
            return false;
          }

          // Apply status filter if selected
          if (selectedStatus) {
            const statusMap: Record<string, string> = {
              paid: "completed",
              partially: "partially_paid",
              overdue: "failed",
              processing: "pending",
            };

            if (transaction.status !== statusMap[selectedStatus]) {
              return false;
            }
          }

          return true;
        })
        .map((transaction) => ({
          id: transaction.id?.substring(0, 4) || "N/A",
          customer: {
            name: transaction.lease?.tenant?.name || "Unknown",
            image: null,
          },
          date: transaction.paymentDate
            ? new Date(transaction.paymentDate).toLocaleDateString()
            : "N/A",
          status:
            transaction.status === "completed"
              ? "Paid"
              : transaction.status === "pending"
              ? "Processing"
              : transaction.status === "failed"
              ? "Overdue"
              : "Partially Paid",
          memo: transaction.notes || transaction.type || "Transaction",
          amount: Number(transaction.amount),
        }))
    : [];

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-800";
      case "Partially Paid":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-amber-100 text-amber-800";
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Extract unique units and vendors for filters
  const units = Array.from(
    new Set(
      transactionsData?.transactions
        ?.map((tx) => tx.lease?.unit?.name)
        .filter(Boolean) || []
    )
  );

  const vendors = Array.from(
    new Set(
      transactionsData?.transactions
        ?.map((tx) => tx.paymentMethod)
        .filter(Boolean) || []
    )
  );

  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await payments.transactions.delete({ id: transactionId });
      // Refresh the transactions list
      payments.transactions.getAll(transactionFilters);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex">
            Customise
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Rent received"
          amount={statsData.rentReceived.amount}
          change={statsData.rentReceived.change}
          isUp={statsData.rentReceived.isUp}
          details={statsData.rentReceived.details}
          value={statsData.rentReceived.value}
        />
        <StatCard
          title="Upcoming payments"
          amount={statsData.upcomingPayments.amount}
          change={statsData.upcomingPayments.change}
          isUp={statsData.upcomingPayments.isUp}
          details={statsData.upcomingPayments.details}
        />
        <StatCard
          title="Rent overdue"
          amount={statsData.rentOverdue.amount}
          change={statsData.rentOverdue.change}
          isUp={statsData.rentOverdue.isUp}
          details={statsData.rentOverdue.details}
        />
        <StatCard
          title="Total expense"
          amount={statsData.totalExpense.amount}
          change={statsData.totalExpense.change}
          isUp={statsData.totalExpense.isUp}
          details={statsData.totalExpense.details}
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
          <h2 className="font-medium text-lg flex items-center">
            Recent Transactions
          </h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <FileText className="h-4 w-4 mr-2" />
              Record bill
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger
                value="all"
                className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                All bills
              </TabsTrigger>
              <TabsTrigger
                value="unpaid"
                className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                Unpaid Bill
              </TabsTrigger>
              <TabsTrigger
                value="paid"
                className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                Paid Bill
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b">
          <div className="flex flex-wrap gap-2">
            <div className="w-full sm:w-auto">
              <Select
                value={selectedVendor?.toString()}
                onValueChange={setSelectedVendor}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor, index) => (
                    <SelectItem key={index} value={vendor}>
                      {vendor === "credit_card"
                        ? "Credit Card"
                        : vendor === "bank_transfer"
                        ? "Bank Transfer"
                        : vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={selectedUnit?.toString()}
                onValueChange={setSelectedUnit}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {units.map((unit, index) => (
                    <SelectItem key={index} value={unit as string}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={selectedStatus?.toString()}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially">Partially Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingTransactions && (
          <div className="flex justify-center items-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        )}

        {/* Error state */}
        {transactionsError && (
          <div className="p-8 text-center text-destructive border border-destructive/20 rounded-lg m-4">
            <p>Failed to load transactions: {transactionsError.message}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => payments.transactions.getAll(transactionFilters)}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Transactions Table */}
        {!isLoadingTransactions && !transactionsError && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input type="checkbox" className="h-4 w-4" />
                  </TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Memo</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <input type="checkbox" className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {transaction.customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{transaction.customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.memo}</TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No transactions found
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeTab !== "all"
                          ? `No ${
                              activeTab === "unpaid" ? "unpaid" : "paid"
                            } transactions found`
                          : "No transactions available"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  amount: string;
  change: string;
  isUp: boolean;
  details: string;
  value?: string;
}

const StatCard = ({
  title,
  amount,
  change,
  isUp,
  details,
  value,
}: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            <div
              className={`flex items-center px-1.5 py-0.5 rounded text-xs ${
                isUp ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {isUp ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {change}
            </div>
          </div>
          <div className="text-2xl font-semibold">{amount}</div>
          <div className="text-sm text-muted-foreground mt-auto flex justify-between items-center">
            {details}
            {value && (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Payments;
