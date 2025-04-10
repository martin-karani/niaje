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
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Edit,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/finances/payments")({
  component: Payments,
});

// Mock transaction data
const RECENT_TRANSACTIONS = [
  {
    id: "3066",
    customer: {
      name: "Kathryn Murphy",
      image: null,
    },
    date: "N/A",
    status: "Overdue",
    memo: "Annual property insurance",
    amount: 450.0,
  },
  {
    id: "3066",
    customer: {
      name: "Jacob Jones",
      image: null,
    },
    date: "05/07/2024",
    status: "Partially Paid",
    memo: "Dryway - rehab unit",
    amount: 350.0,
  },
  {
    id: "3066",
    customer: {
      name: "Eleanor Pena",
      image: null,
    },
    date: "28/06/2024",
    status: "Processing",
    memo: "Monthly retainer fee",
    amount: 400.0,
  },
  {
    id: "3066",
    customer: {
      name: "Leslie Alexander",
      image: null,
    },
    date: "20/06/2024",
    status: "Paid",
    memo: "Taxes",
    amount: 340.0,
  },
  {
    id: "3066",
    customer: {
      name: "Eleanor Pena",
      image: null,
    },
    date: "N/A",
    status: "Overdue",
    memo: "Reseal driveway",
    amount: 500.0,
  },
  {
    id: "3066",
    customer: {
      name: "Kristin Watson",
      image: null,
    },
    date: "12/06/2024",
    status: "Partially Paid",
    memo: "Desk for new reception",
    amount: 480.0,
  },
  {
    id: "3066",
    customer: {
      name: "Leslie Alexander",
      image: null,
    },
    date: "N/A",
    status: "Processing",
    memo: "Eviction fees / consult",
    amount: 350.0,
  },
  {
    id: "3066",
    customer: {
      name: "Arlene McCoy",
      image: null,
    },
    date: "15/05/2024",
    status: "Paid",
    memo: "Insurance",
    amount: 400.0,
  },
  {
    id: "3066",
    customer: {
      name: "Leslie Alexander",
      image: null,
    },
    date: "N/A",
    status: "Overdue",
    memo: "Retainer fee",
    amount: 350.0,
  },
  {
    id: "3066",
    customer: {
      name: "Robert Fox",
      image: null,
    },
    date: "28/05/2024",
    status: "Partially Paid",
    memo: "Carpet cleaning",
    amount: 450.0,
  },
];

function Payments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Filter transactions based on active tab
  const filteredTransactions = RECENT_TRANSACTIONS.filter((transaction) => {
    if (activeTab === "unpaid") {
      return (
        transaction.status === "Overdue" || transaction.status === "Processing"
      );
    } else if (activeTab === "paid") {
      return (
        transaction.status === "Paid" || transaction.status === "Partially Paid"
      );
    }
    return true;
  });

  // Stats data
  const statsData = {
    rentReceived: {
      amount: "$1,450.00",
      change: "15.8%",
      isUp: false,
      details: "Due this month",
      value: "$6,000",
    },
    upcomingPayments: {
      amount: "$2,450.00",
      change: "15.8%",
      isUp: true,
      details: "2 this month",
    },
    rentOverdue: {
      amount: "$1,450.00",
      change: "15.8%",
      isUp: false,
      details: "5 Overdue",
    },
    totalExpense: {
      amount: "$2,450.00",
      change: "15.8%",
      isUp: true,
      details: "31 works",
    },
  };

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
            Add Property
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
                  <SelectItem value="vendor1">Vendor 1</SelectItem>
                  <SelectItem value="vendor2">Vendor 2</SelectItem>
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
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
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

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <input type="checkbox" className="h-4 w-4" />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction, index) => (
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
