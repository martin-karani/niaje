import { Button } from "@/components/ui/button";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/providers/auth-provider";
import { RouterInputs } from "@/utils/trpc";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Building,
  DollarSign,
  Download,
  Edit,
  FileText,
  Loader2,
  PieChart,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/finances/expenses")({
  component: ExpenseManagement,
});

// Define expense categories (ideally this should come from the backend as well)
const EXPENSE_CATEGORIES = [
  {
    id: "maintenance",
    name: "Maintenance & Repairs",
    color: "text-emerald-600",
  },
  { id: "utilities", name: "Utilities", color: "text-blue-600" },
  { id: "insurance", name: "Insurance", color: "text-purple-600" },
  { id: "property_tax", name: "Property Tax", color: "text-red-600" },
  { id: "management", name: "Management Fees", color: "text-amber-600" },
  {
    id: "advertising",
    name: "Advertising & Marketing",
    color: "text-indigo-600",
  },
  { id: "legal", name: "Legal & Professional Fees", color: "text-pink-600" },
  { id: "supplies", name: "Supplies", color: "text-gray-600" },
  { id: "other", name: "Other Expenses", color: "text-teal-600" },
];

// Map transaction types/categories to our expense categories
const mapTransactionToCategory = (transaction: any): string => {
  // This is a simplified mapping function
  // In practice, you would need to define a proper mapping strategy based on
  // how your transactions are categorized on the backend

  // If there's a category field in the transaction, use that
  if (transaction.category) {
    // Map category to one of our expense categories
    const categoryMapping: Record<string, string> = {
      water: "utilities",
      electricity: "utilities",
      gas: "utilities",
      internet: "utilities",
      repairs: "maintenance",
      legal: "legal",
      marketing: "advertising",
      tax: "property_tax",
      management: "management",
      supplies: "supplies",
      insurance: "insurance",
      // Add more mappings as needed
    };

    return categoryMapping[transaction.category.toLowerCase()] || "other";
  }

  // If there's no category, try to infer from type or notes
  if (transaction.notes) {
    const notes = transaction.notes.toLowerCase();
    if (
      notes.includes("repair") ||
      notes.includes("maintenance") ||
      notes.includes("fix")
    ) {
      return "maintenance";
    }
    if (
      notes.includes("utility") ||
      notes.includes("water") ||
      notes.includes("electric")
    ) {
      return "utilities";
    }
    // Add more inferences as needed
  }

  // Default to "other" if we can't determine a category
  return "other";
};

function ExpenseManagement() {
  const { activeProperty } = useAuth();

  // Use payments hook to fetch transaction data
  const payments = usePayments();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(
    activeProperty?.id || null
  );
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
      .toISOString()
      .slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  // Prepare filters for transaction query
  const transactionFilters: RouterInputs["payments"]["getAllTransactions"] = {
    propertyId: propertyFilter,
    // Transactions for expenses are typically outgoing payments
    // Adjust this filter based on your actual data model
    type: "fee", // This could also be 'refund' or other types that represent expenses
    dateFrom: new Date(dateRange.start),
    dateTo: new Date(dateRange.end),
    limit: 100, // Adjust based on your needs
  };

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = payments.transactions.getAll(transactionFilters);

  // Transform transactions to expense format
  const transformTransactionsToExpenses = (transactions: any[]) => {
    return (
      transactions?.map((transaction) => ({
        id: transaction.id,
        date: transaction.paymentDate
          ? new Date(transaction.paymentDate).toISOString().slice(0, 10)
          : "",
        category: mapTransactionToCategory(transaction),
        description: transaction.notes || "Expense",
        amount: Math.abs(Number(transaction.amount)), // Ensure positive for expense display
        property:
          transaction.lease?.unit?.property?.name || activeProperty?.name || "",
        unit: transaction.lease?.unit?.name || "",
        paymentMethod: transaction.paymentMethod || "bank_transfer",
        receipt: !!transaction.receiptUrl,
        recurring: false, // Ideally this would come from the transaction data
        vendorName: transaction.paymentMethod || "Unknown",
        createdBy: transaction.recorder?.name || "System",
      })) || []
    );
  };

  // Get expenses from transformed transactions
  const allExpenses = transactionsData?.transactions
    ? transformTransactionsToExpenses(transactionsData.transactions)
    : [];

  // Client-side filtering (for filters not handled by the backend)
  const filteredExpenses = allExpenses
    .filter((expense) => {
      // Category filter
      if (categoryFilter && expense.category !== categoryFilter) return false;

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.description.toLowerCase().includes(searchLower) ||
          (expense.property &&
            expense.property.toLowerCase().includes(searchLower)) ||
          (expense.vendorName &&
            expense.vendorName.toLowerCase().includes(searchLower)) ||
          (expense.unit && expense.unit.toLowerCase().includes(searchLower))
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sorting logic
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortBy === "category") {
        return sortOrder === "asc"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      } else if (sortBy === "description") {
        return sortOrder === "asc"
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      return 0;
    });

  // Calculate summary statistics
  const summarizeExpenses = () => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = EXPENSE_CATEGORIES.map((category) => {
      const expenses = filteredExpenses.filter(
        (e) => e.category === category.id
      );
      const amount = expenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

      return {
        ...category,
        amount,
        percentage,
        count: expenses.length,
      };
    })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Group by property (if we have property info)
    const byProperty = activeProperty
      ? [
          {
            id: activeProperty.id,
            name: activeProperty.name,
            amount: total,
            percentage: 100,
            count: filteredExpenses.length,
          },
        ]
      : [];

    // Calculate recurring vs one-time (assuming all are one-time for now)
    const recurring = filteredExpenses
      .filter((e) => e.recurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const oneTime = total - recurring;

    return { total, byCategory, byProperty, recurring, oneTime };
  };

  const summary = summarizeExpenses();

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Format date string for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get category name from ID
  const getCategoryName = (categoryId: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get category color from ID
  const getCategoryColor = (categoryId: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
    return category ? category.color : "text-gray-600";
  };

  // Handle edit expense click
  const handleEditExpense = (expenseId: string) => {
    setSelectedExpense(expenseId);
    setShowAddExpenseModal(true);
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await payments.transactions.delete({ id: expenseId });
      // Refresh data after delete
      payments.transactions.getAll(transactionFilters);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // Handle create expense
  const handleCreateExpense = async (expenseData: any) => {
    try {
      // Transform expense data to transaction format
      const transactionData = {
        leaseId: expenseData.leaseId || "", // This might need to be handled differently
        amount: expenseData.amount,
        type: "fee", // Adjust based on your data model
        category: expenseData.category,
        paymentMethod: expenseData.paymentMethod,
        paymentDate: new Date(expenseData.date),
        notes: expenseData.description,
        status: "completed",
      };

      await payments.transactions.create(transactionData);
      setShowAddExpenseModal(false);

      // Refresh data after create
      payments.transactions.getAll(transactionFilters);
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  // Handle update expense
  const handleUpdateExpense = async (expenseId: string, expenseData: any) => {
    try {
      // Transform expense data to transaction format
      const transactionData = {
        id: expenseId,
        amount: expenseData.amount,
        category: expenseData.category,
        paymentMethod: expenseData.paymentMethod,
        paymentDate: new Date(expenseData.date),
        notes: expenseData.description,
        status: "completed",
      };

      await payments.transactions.update(transactionData);
      setShowAddExpenseModal(false);
      setSelectedExpense(null);

      // Refresh data after update
      payments.transactions.getAll(transactionFilters);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Expense Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddExpenseModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters and Date Range */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="h-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={categoryFilter || ""}
              onChange={(e) =>
                setCategoryFilter(e.target.value === "" ? null : e.target.value)
              }
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">
                ${summary.total.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recurring</span>
              <span>
                ${summary.recurring.toLocaleString()} (
                {Math.round((summary.recurring / summary.total) * 100) || 0}%)
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">One-time</span>
              <span>
                ${summary.oneTime.toLocaleString()} (
                {Math.round((summary.oneTime / summary.total) * 100) || 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Top Categories
          </h3>
          <div className="space-y-2">
            {summary.byCategory.slice(0, 3).map((category) => (
              <div
                key={category.id}
                className="flex justify-between items-center"
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${category.color.replace(
                      "text-",
                      "bg-"
                    )} mr-2`}
                  ></div>
                  <span className="text-sm">{category.name}</span>
                </div>
                <div className="text-sm font-medium">
                  ${category.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Top Properties
          </h3>
          <div className="space-y-2">
            {summary.byProperty.slice(0, 3).map((property) => (
              <div
                key={property.id}
                className="flex justify-between items-center"
              >
                <span className="text-sm">{property.name}</span>
                <div className="text-sm font-medium">
                  ${property.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="font-medium text-lg">Expense List</h2>
        <div className="border rounded-md overflow-hidden flex">
          <button
            className={`px-3 py-1 ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "bg-card"
            }`}
            onClick={() => setViewMode("table")}
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            className={`px-3 py-1 ${
              viewMode === "chart"
                ? "bg-primary text-primary-foreground"
                : "bg-card"
            }`}
            onClick={() => setViewMode("chart")}
          >
            <PieChart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingTransactions && (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading expenses...</span>
        </div>
      )}

      {/* Error state */}
      {transactionsError && (
        <div className="p-8 text-center text-destructive border border-destructive/20 rounded-lg">
          <p>Failed to load expenses: {transactionsError.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => payments.transactions.getAll(transactionFilters)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && !isLoadingTransactions && !transactionsError && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <button
                      className="flex items-center gap-1"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      {sortBy === "date" && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <button
                      className="flex items-center gap-1"
                      onClick={() => handleSort("category")}
                    >
                      Category
                      {sortBy === "category" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <button
                      className="flex items-center gap-1"
                      onClick={() => handleSort("description")}
                    >
                      Description
                      {sortBy === "description" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
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
                      {sortBy === "amount" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      {formatDate(expense.date)}
                      {expense.recurring && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          Recurring
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full ${getCategoryColor(
                            expense.category
                          ).replace("text-", "bg-")} mr-2`}
                        ></span>
                        {getCategoryName(expense.category)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {expense.description}
                        <div className="text-xs text-muted-foreground mt-1">
                          Vendor: {expense.vendorName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {expense.property && (
                        <div>
                          {expense.property}
                          {expense.unit && (
                            <span className="text-muted-foreground ml-1">
                              - Unit {expense.unit}
                            </span>
                          )}
                        </div>
                      )}
                      {!expense.property && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      ${expense.amount.toLocaleString()}
                      <div className="text-xs text-muted-foreground mt-1">
                        {expense.paymentMethod === "credit_card"
                          ? "Credit Card"
                          : "Bank Transfer"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {expense.receipt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditExpense(expense.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && !isLoadingTransactions && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium">No expenses found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || categoryFilter
                          ? "Try adjusting your search or filters"
                          : "No expenses for this period"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === "chart" && !isLoadingTransactions && !transactionsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-4">Expense Breakdown by Category</h3>
            <div className="flex justify-center mb-6">
              {/* This would be a real chart in a production app */}
              <div className="w-48 h-48 rounded-full border-8 border-primary relative">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold">
                    ${summary.total.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Total Expenses
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {summary.byCategory.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${category.color.replace(
                        "text-",
                        "bg-"
                      )} mr-2`}
                    ></div>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      ${category.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({category.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-4">Monthly Expense Trend</h3>
            <div className="h-64">
              {/* This would be a real chart in a production app */}
              <div className="h-full flex items-end space-x-2">
                {Array.from({ length: 6 }).map((_, index) => {
                  const height = 30 + Math.random() * 70;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-primary rounded-t-sm"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="mt-2 text-xs">
                        {new Date(
                          new Date().setMonth(new Date().getMonth() - 5 + index)
                        ).toLocaleString("default", { month: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showAddExpenseModal && (
        <ExpenseFormModal
          expense={
            selectedExpense
              ? filteredExpenses.find((e) => e.id === selectedExpense)
              : null
          }
          categories={EXPENSE_CATEGORIES}
          properties={activeProperty ? [activeProperty] : []}
          onClose={() => {
            setShowAddExpenseModal(false);
            setSelectedExpense(null);
          }}
          onSubmit={(formData) => {
            if (selectedExpense) {
              handleUpdateExpense(selectedExpense, formData);
            } else {
              handleCreateExpense(formData);
            }
          }}
        />
      )}
    </div>
  );
}

// Expense Form Modal Component
const ExpenseFormModal = ({
  expense,
  categories,
  properties,
  onClose,
  onSubmit,
}) => {
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    date: expense ? expense.date : new Date().toISOString().slice(0, 10),
    category: expense ? expense.category : "maintenance",
    description: expense ? expense.description : "",
    amount: expense ? expense.amount : "",
    property: expense ? expense.property : "",
    unit: expense ? expense.unit : "",
    paymentMethod: expense ? expense.paymentMethod : "credit_card",
    vendorName: expense ? expense.vendorName : "",
    recurring: expense ? expense.recurring : false,
    receipt: null,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">
            {isEditing ? "Edit Expense" : "Add New Expense"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span>×</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  $
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Property (Optional)
              </label>
              <select
                name="property"
                value={formData.property || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.name}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Unit (Optional)
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit || ""}
                onChange={handleChange}
                placeholder="e.g., 101"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Vendor Name</label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Receipt</label>
              <div className="mt-2">
                <input
                  type="file"
                  name="receipt"
                  accept="image/*,.pdf"
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                id="recurring"
                name="recurring"
                checked={formData.recurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurring: e.target.checked,
                  }))
                }
                className="h-4 w-4 mr-2"
              />
              <label htmlFor="recurring" className="text-sm">
                This is a recurring expense
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseManagement;
