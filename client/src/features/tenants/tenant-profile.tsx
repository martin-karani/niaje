import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/auth-provider";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Edit,
  FileText,
  Home,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";

interface TenantProfileProps {
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    propertyName: string;
    unit: string;
    dateOfBirth: string;
    moveInDate: string;
    leaseEnd: string;
    status?: "active" | "pending" | "past";
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
      dateOfBirth?: string;
    };
  };
  recentTransactions?: {
    id: string;
    date: string;
    status: string;
    unit: string;
    memo: string;
    amount: number;
  }[];
}

export function TenantProfile({
  tenant,
  recentTransactions = [],
}: TenantProfileProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Format date string for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Determine if user can edit tenant information
  const canEditTenant = user?.role === "landlord" || user?.role === "agent";

  // Determine if user can add financial transactions
  const canManageFinances =
    user?.role === "landlord" || user?.role === "caretaker";

  // Use provided transactions or empty array if none provided
  const transactions = recentTransactions.length > 0 ? recentTransactions : [];

  // Helper to get CSS classes for transaction status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-800";
      case "Partially Paid":
        return "bg-blue-100 text-blue-800";
      case "Processing":
      case "Pending":
        return "bg-amber-100 text-amber-800";
      case "Failed":
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src="/api/placeholder/64/64" alt={tenant.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {tenant.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{tenant.name}</h1>
              <Badge
                variant="outline"
                className="ml-2 capitalize bg-green-50 text-green-700 border-green-200"
              >
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center mt-1">
              <Home className="h-4 w-4 mr-1" />
              {tenant.address}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-2 sm:mt-0">
          {canEditTenant && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit tenant
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download report
          </Button>
          {canManageFinances && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6 border-b w-full justify-start rounded-none bg-transparent h-auto p-0 border-border">
          <TabsTrigger
            value="profile"
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="leases"
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
          >
            Leases
          </TabsTrigger>
          <TabsTrigger
            value="request"
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
          >
            Request
            <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
              1+
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content area - 2/3 width */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        First Name:
                      </label>
                      <div className="font-medium">Jacob</div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Last Name:
                      </label>
                      <div className="font-medium">Jones</div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Date of birth:
                      </label>
                      <div className="font-medium">
                        {formatDate(tenant.dateOfBirth)} |{" "}
                        {calculateAge(tenant.dateOfBirth)} y.o
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Additional phone:
                      </label>
                      <div className="font-medium flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        01524-789631
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Email:
                      </label>
                      <div className="font-medium flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        hello741@gmail.com
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Current Property:
                      </label>
                      <div className="font-medium flex items-center">
                        <Home className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {tenant.propertyName}, Unit {tenant.unit}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <div className="flex">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="border-b">
                        <div className="grid grid-cols-6 py-3 px-4 text-sm font-medium text-muted-foreground bg-muted/50">
                          <div>Date</div>
                          <div>Status</div>
                          <div>Unit</div>
                          <div>Memo</div>
                          <div className="text-right">Amount</div>
                          <div className="text-right">Action</div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {transactions.length > 0 ? (
                          transactions.map((transaction, index) => (
                            <div
                              key={`${transaction.id}-${index}`}
                              className="grid grid-cols-6 py-3 px-4 hover:bg-muted/50 transition-colors text-sm"
                            >
                              <div>{transaction.date}</div>
                              <div>
                                <Badge
                                  className={`font-normal ${getStatusBadgeVariant(
                                    transaction.status
                                  )}`}
                                >
                                  {transaction.status}
                                </Badge>
                              </div>
                              <div>{transaction.unit}</div>
                              <div>{transaction.memo}</div>
                              <div className="text-right font-medium">
                                ${transaction.amount.toFixed(2)}
                              </div>
                              <div className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            No transaction history available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Emergency contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Name:
                    </label>
                    <div className="font-medium flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {tenant.emergencyContact?.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Relationship:
                    </label>
                    <div className="font-medium">
                      {tenant.emergencyContact?.relationship}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Mobile:
                    </label>
                    <div className="font-medium flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {tenant.emergencyContact?.phone}
                    </div>
                  </div>

                  {tenant.emergencyContact?.dateOfBirth && (
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Date of birth:
                      </label>
                      <div className="font-medium flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {formatDate(tenant.emergencyContact.dateOfBirth)} |{" "}
                        {calculateAge(tenant.emergencyContact.dateOfBirth)} y.o
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Email:
                    </label>
                    <div className="font-medium flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {tenant.emergencyContact?.email}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {canManageFinances && (
                <div className="space-y-4">
                  <StatCard
                    title="Payment Due"
                    amount="$16,254"
                    icon={<ArrowDown className="h-4 w-4 mr-2" />}
                    buttonText="Receive"
                  />

                  <StatCard
                    title="Security Money"
                    amount="$420"
                    icon={<ArrowUp className="h-4 w-4 mr-2" />}
                    buttonText="Return"
                  />

                  <StatCard
                    title="Credits Balance"
                    amount="$1,540"
                    icon={<FileText className="h-4 w-4 mr-2" />}
                    buttonText="Apply"
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leases" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Lease Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Current Lease</div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Property
                      </div>
                      <div>
                        {tenant.propertyName}, Unit {tenant.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Start Date
                      </div>
                      <div>{formatDate(tenant.moveInDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        End Date
                      </div>
                      <div>{formatDate(tenant.leaseEnd)}</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Past lease example */}
                <div className="border rounded-lg p-4 opacity-70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Previous Lease</div>
                    <Badge variant="outline">Expired</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Property
                      </div>
                      <div>{tenant.propertyName}, Unit 205</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Start Date
                      </div>
                      <div>01/05/2023</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        End Date
                      </div>
                      <div>30/04/2024</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Leaking faucet in kitchen</div>
                    <Badge className="bg-amber-100 text-amber-800">
                      Pending
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    The kitchen sink faucet has been leaking steadily for the
                    past two days. Water is pooling underneath the sink cabinet.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Reported On
                      </div>
                      <div>05/06/2024</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Priority
                      </div>
                      <div>Medium</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Unit</div>
                      <div>Unit {tenant.unit}</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      Air conditioner not cooling
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      In Progress
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    The air conditioner in the living room is running but not
                    cooling effectively. Room temperature stays above 80°F even
                    when set to 72°F.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Reported On
                      </div>
                      <div>01/06/2024</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Priority
                      </div>
                      <div>High</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Unit</div>
                      <div>Unit {tenant.unit}</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  buttonText: string;
}

// Stat Card Component for financial information
function StatCard({ title, amount, icon, buttonText }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="text-lg font-medium mb-1">{title}</div>
          <div className="text-2xl font-bold mb-3">{amount}</div>
          <Button variant="outline" className="w-full justify-start">
            {icon}
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
