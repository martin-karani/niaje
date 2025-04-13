import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeases } from "@/hooks/use-leases";
import { useMaintenance } from "@/hooks/use-maintenance";
import { usePayments } from "@/hooks/use-payments";
import { useTenants } from "@/hooks/use-tenants";
import { useUnits } from "@/hooks/use-units";

import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building,
  CalendarDays,
  ChevronDown,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async () => ({
    crumb: [
      {
        label: "Home",
        path: "/dashboard",
        hideOnMobile: false,
      },
    ],
  }),
  component: Dashboard,
});

const OCCUPANCY_COLORS = ["#4f46e5", "#e4e4e7"];
const MAINTENANCE_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

function Dashboard() {
  const { user, activeProperty } = useAuth();

  // Get unit stats to replace property data
  const { getStats: getUnitStats } = useUnits();
  const { data: unitStats, status: unitStatsStatus } = getUnitStats(
    activeProperty?.id
  );

  const { getStats: getLeaseStats } = useLeases();
  const { data: leaseStats, status: leaseStatsStatus } = getLeaseStats(
    activeProperty?.id || ""
  );

  // Use payments for transactions instead of leases
  const { transactions } = usePayments();
  const { data: recentTransactionsData, status: transactionsStatus } =
    transactions.getAll({
      limit: 10,
      page: 1,
      propertyId: activeProperty?.id,
    });

  const { getStats: getMaintenanceStats } = useMaintenance();
  const { data: maintenanceStats, status: maintenanceStatsStatus } =
    getMaintenanceStats(activeProperty?.id || "");

  const { getExpiringLeases } = useLeases();
  const { data: upcomingEvents, status: expiringLeasesStatus } =
    getExpiringLeases(7);

  const { getStats: getTenantStats } = useTenants();
  const { status: tenantStatsStatus } = getTenantStats(
    activeProperty?.id || ""
  );

  // Show loading state if any data is still loading
  const isLoading =
    leaseStatsStatus === "pending" ||
    transactionsStatus === "pending" ||
    maintenanceStatsStatus === "pending" ||
    tenantStatsStatus === "pending" ||
    expiringLeasesStatus === "pending" ||
    unitStatsStatus === "pending";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Stats data based on real data
  const statsData = {
    rentReceived: {
      amount: `$${Math.floor(
        leaseStats?.totalMonthlyRent || 0
      ).toLocaleString()}`,
      change: "15.8%", // You might want to calculate this based on historical data
      isUp: false,
      details: `${leaseStats?.activeLeases || 0} active leases`,
      value: `$${Math.floor(
        (leaseStats?.totalMonthlyRent || 0) * 1.2
      ).toLocaleString()}`,
    },
    upcomingPayments: {
      amount: `$${Math.floor(
        (leaseStats?.totalMonthlyRent || 0) * 0.4
      ).toLocaleString()}`,
      change: "15.8%",
      isUp: true,
      details: `${leaseStats?.expiringNext30Days || 0} expiring soon`,
    },
    rentOverdue: {
      amount: "$1,450.00", // This could be calculated based on actual overdue payments
      change: "15.8%",
      isUp: false,
      details: "5 Overdue", // This should come from the API
    },
    totalExpense: {
      amount: `$${Math.floor(
        maintenanceStats?.totalMaintenanceCost || 0
      ).toLocaleString()}`,
      change: "15.8%",
      isUp: true,
      details: `${
        (maintenanceStats?.openRequests || 0) +
        (maintenanceStats?.inProgressRequests || 0)
      } pending`,
    },
  };

  // Create maintenance data from real stats
  const maintenanceData = [
    { name: "Pending", value: maintenanceStats?.openRequests || 0 },
    { name: "In Progress", value: maintenanceStats?.inProgressRequests || 0 },
    { name: "Completed", value: maintenanceStats?.completedRequests || 0 },
  ];

  // Create occupancy data based on unit stats
  const occupancyData = [
    { name: "Occupied", value: unitStats?.occupiedUnits || 0 },
    { name: "Vacant", value: unitStats?.vacantUnits || 0 },
  ];

  // Generate dashboard stats
  const dashboardStats = {
    totalProperties: activeProperty ? 1 : 0,
    totalUnits: unitStats?.totalUnits || 0,
    occupancyRate: unitStats?.occupancyRate || 0,
    pendingRequests: maintenanceStats?.openRequests || 0,
    overdueMaintenance: maintenanceStats?.inProgressRequests || 0,
    totalRevenue: `$${Math.floor(
      leaseStats?.totalMonthlyRent || 0
    ).toLocaleString()}`,
    expensesThisMonth: `$${Math.floor(
      (maintenanceStats?.totalMaintenanceCost || 0) / 12
    ).toLocaleString()}`,
  };

  // Format transactions for display - using transactions instead of leases
  const formattedTransactions = (
    recentTransactionsData?.transactions || []
  ).map((transaction) => {
    const lease = transaction.lease || {};
    const tenant = lease.tenant || { name: "Unknown Tenant" };
    const unit = lease.unit || { name: "Unknown Unit" };

    return {
      id: transaction.id?.substring(0, 4) || "N/A",
      customer: {
        name: tenant.name,
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
      unit: unit.name,
      amount: transaction.amount || 0,
      partiallyPaid: "$0.00",
    };
  });

  // Get role-specific greeting
  const getRoleBasedGreeting = () => {
    switch (user?.role) {
      case "landlord":
        return "Track your properties, income, and tenant activity from one central dashboard.";
      case "caretaker":
        return "Monitor maintenance requests, tenant needs, and property status.";
      case "agent":
        return "Manage listings, tenant applications, and lease agreements all in one place.";
      default:
        return "Welcome to your property management dashboard.";
    }
  };

  // Determine which tabs to show based on role
  const canViewFinancials = user?.role === "landlord" || user?.role === "admin";

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Partially Paid":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Revenue data - This could also come from the API
  const revenueData = [
    { month: "Jan", amount: 20000 },
    { month: "Feb", amount: 35000 },
    { month: "Mar", amount: 15000 },
    { month: "Apr", amount: 20000 },
    { month: "May", amount: 15000 },
    { month: "Jun", amount: 35000 },
    { month: "Jul", amount: 20000 },
  ];

  // Stat Card Component
  const StatCard = ({
    title,
    amount,
    change,
    isUp,
    details,
    value,
  }: {
    title: string;
    amount: string;
    change: string;
    isUp: boolean;
    details: string;
    value?: string;
  }) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">{getRoleBasedGreeting()}</p>
        </div>
        <Button variant="outline">
          <CalendarDays className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Button>
      </div>

      {/* Summary Cards */}
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

      {/* Total Revenue */}
      <Card>
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <div>
            <CardTitle>Total Revenue</CardTitle>
            <span className="text-sm text-muted-foreground">Last 1 Year</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 text-sm">
            <span className="text-muted-foreground">Rental Income:</span>
            <span className="font-medium">{dashboardStats.totalRevenue}</span>
            <span className="text-muted-foreground ml-3">Expenses:</span>
            <span className="font-medium">
              {dashboardStats.expensesThisMonth}
            </span>
          </div>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={revenueData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Property Valuation and Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Valuation */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-start pb-2">
            <div>
              <CardTitle>Property Valuation</CardTitle>
              <span className="text-sm text-muted-foreground">
                {activeProperty?.name || "N/A"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </CardHeader>
          <CardContent className="h-[225px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { year: 0, value: 1.5 },
                  { year: 1, value: 1.8 },
                  { year: 2, value: 2.3 },
                  { year: 3, value: 2.5 },
                  { year: 4, value: 3.0 },
                  { year: 5, value: 3.4 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `${value}.0`}
                  domain={[0, 4]}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `$${value.toFixed(1)}M`,
                    "Property value",
                  ]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Units */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-start pb-2">
            <CardTitle>Property Units</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-[225px] w-full flex items-center justify-center">
              <div className="relative">
                <div className="text-7xl font-bold text-center">
                  {dashboardStats.totalUnits}
                </div>
                <div className="text-sm text-center mt-2">Units</div>
                <div className="absolute -top-10 -right-10">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset={
                          283 * (1 - dashboardStats.occupancyRate / 100)
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between mt-8 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-rose-400 rounded-full mr-2"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                    <span>Vacant</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Partially Paid</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedTransactions
                      .slice(0, 5)
                      .map((transaction, index) => (
                        <TableRow key={index}>
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
                          <TableCell>{transaction.unit}</TableCell>
                          <TableCell>{transaction.partiallyPaid}</TableCell>
                          <TableCell className="text-right">
                            ${Number(transaction.amount).toFixed(2)}
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
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Status */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-1" /> Last 30 days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Compliance ({dashboardStats.pendingRequests})
                  </span>
                  <span className="text-sm font-medium">Maintenance</span>
                  <span className="text-sm font-medium">Task</span>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">
                        Household Fix-It Contractor
                      </div>
                      <div className="text-sm text-muted-foreground">
                        15 Main Street - 2F
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs">
                      Approved
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">House plumbing</div>
                      <div className="text-sm text-muted-foreground">
                        15 Main Street - 2F
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                      In progress
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">
                        Household Fix-It Contractor
                      </div>
                      <div className="text-sm text-muted-foreground">
                        15 Main Street - 2F
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs">
                      In Review
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={maintenanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {maintenanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            MAINTENANCE_COLORS[
                              index % MAINTENANCE_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={(value, entry, index) => (
                        <span
                          style={{
                            color:
                              MAINTENANCE_COLORS[
                                index % MAINTENANCE_COLORS.length
                              ],
                          }}
                        >
                          {value}: {maintenanceData[index].value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  View calendar <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents?.slice(0, 3).map((event, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">
                          {event.tenant?.name || "Lease Expiring"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.unit?.name || "Unknown Unit"}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        Expires {new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!upcomingEvents || upcomingEvents.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No upcoming events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  <FileText className="h-4 w-4 mr-1" />
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-t">
                <div className="space-y-4">
                  {formattedTransactions
                    .slice(0, 3)
                    .map((transaction, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {transaction.customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {transaction.customer.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${Number(transaction.amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.date}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.role === "landlord" && (
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Wrench className="h-4 w-4 mr-2" />
                Create Maintenance Request
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
