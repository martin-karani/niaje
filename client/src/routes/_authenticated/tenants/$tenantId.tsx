// client/src/routes/tenants/$tenantId.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  Clipboard,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Home,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Send,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  component: TenantDetail,
});

// Mock tenant data
const MOCK_TENANT = {
  id: "tenant-1",
  name: "James Wilson",
  email: "james.wilson@example.com",
  phone: "+1 (555) 123-4567",
  altPhone: "+1 (555) 987-6543",
  emergencyContact: {
    name: "Sarah Wilson",
    relationship: "Spouse",
    phone: "+1 (555) 234-5678",
  },
  address: "Sobha Garden, Unit 101",
  moveInDate: "2023-01-15",
  leaseEnd: "2024-01-15",
  rentAmount: 1200,
  securityDeposit: 1200,
  paymentStatus: "paid",
  balance: 0,
  lastPaymentDate: "2023-06-01",
  leaseId: "lease-1",
  occupants: 2,
  pets: 1,
  vehicles: [
    {
      make: "Honda",
      model: "Civic",
      year: 2020,
      color: "Blue",
      licensePlate: "ABC123",
    },
  ],
  notes: "Prefers email communication. Works night shifts.",
  documents: [
    { id: "doc-1", name: "Lease Agreement", date: "2023-01-10", type: "lease" },
    {
      id: "doc-2",
      name: "Security Deposit Receipt",
      date: "2023-01-15",
      type: "financial",
    },
    {
      id: "doc-3",
      name: "Pet Policy Agreement",
      date: "2023-01-15",
      type: "agreement",
    },
  ],
  maintenanceRequests: [
    {
      id: "req-1",
      date: "2023-03-10",
      issue: "Leaking faucet in kitchen",
      status: "completed",
    },
    {
      id: "req-2",
      date: "2023-05-20",
      issue: "Bathroom vent not working",
      status: "in-progress",
    },
  ],
  paymentHistory: [
    {
      id: "pay-1",
      date: "2023-06-01",
      amount: 1200,
      type: "rent",
      status: "completed",
    },
    {
      id: "pay-2",
      date: "2023-05-02",
      amount: 1200,
      type: "rent",
      status: "completed",
    },
    {
      id: "pay-3",
      date: "2023-04-01",
      amount: 1200,
      type: "rent",
      status: "completed",
    },
    {
      id: "pay-4",
      date: "2023-03-03",
      amount: 1200,
      type: "rent",
      status: "completed",
      late: true,
    },
    {
      id: "pay-5",
      date: "2023-02-01",
      amount: 1200,
      type: "rent",
      status: "completed",
    },
    {
      id: "pay-6",
      date: "2023-01-15",
      amount: 1200,
      type: "security_deposit",
      status: "completed",
    },
  ],
};

function TenantDetail() {
  const { params } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "payments", "maintenance", "documents", "communications"
  const [isEditing, setIsEditing] = useState(false);

  // In a real app, we would fetch the tenant data with a tRPC query
  // const { data: tenant, isLoading, error } = useTenant(params.tenantId);
  const tenant = MOCK_TENANT;

  // Calculate time to lease end
  const calculateLeaseStatus = () => {
    const today = new Date();
    const leaseEnd = new Date(tenant.leaseEnd);
    const diffTime = leaseEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: "Lease expired",
        status: "expired",
        days: Math.abs(diffDays),
      };
    } else if (diffDays <= 30) {
      return { text: "Lease ending soon", status: "warning", days: diffDays };
    } else {
      return { text: "Lease active", status: "active", days: diffDays };
    }
  };

  const leaseStatus = calculateLeaseStatus();

  // Handle contact actions
  const handleEmail = () => {
    window.location.href = `mailto:${tenant.email}`;
  };

  const handleCall = () => {
    window.location.href = `tel:${tenant.phone}`;
  };

  const handleMessage = () => {
    // Open messaging interface
    console.log("Open messaging interface");
  };

  return (
    <div className="space-y-6">
      {/* Back button and top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/tenants" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <Home className="h-4 w-4 mr-1" />
              {tenant.address}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMessage}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Send Notice
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Tenant profile */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium">{tenant.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Tenant since{" "}
                  {new Date(tenant.moveInDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <ContactItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={tenant.email}
                onClick={handleEmail}
              />
              <ContactItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={tenant.phone}
                onClick={handleCall}
              />
              {tenant.altPhone && (
                <ContactItem
                  icon={<Phone className="h-4 w-4" />}
                  label="Alternative Phone"
                  value={tenant.altPhone}
                />
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Emergency Contact</h3>
              <p className="text-sm font-medium">
                {tenant.emergencyContact.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenant.emergencyContact.relationship}
              </p>
              <a
                href={`tel:${tenant.emergencyContact.phone}`}
                className="text-sm text-primary hover:underline flex items-center mt-1"
              >
                <Phone className="h-3 w-3 mr-1" />
                {tenant.emergencyContact.phone}
              </a>
            </div>
          </div>

          {/* Lease Information */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Lease Information</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2 -mr-2">
                <FileText className="h-4 w-4 mr-1" />
                View Lease
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease Start</span>
                <span>{new Date(tenant.moveInDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease End</span>
                <span>{new Date(tenant.leaseEnd).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent Amount</span>
                <span>${tenant.rentAmount.toLocaleString()}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span>${tenant.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupants</span>
                <span>{tenant.occupants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pets</span>
                <span>{tenant.pets}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <div
                className={`p-2 rounded-md ${
                  leaseStatus.status === "active"
                    ? "bg-emerald-100"
                    : leaseStatus.status === "warning"
                    ? "bg-amber-100"
                    : "bg-red-100"
                }`}
              >
                <div className="flex items-center">
                  {leaseStatus.status === "active" ? (
                    <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  ) : leaseStatus.status === "warning" ? (
                    <Clock className="h-4 w-4 text-amber-600 mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      leaseStatus.status === "active"
                        ? "text-emerald-600"
                        : leaseStatus.status === "warning"
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {leaseStatus.text}
                  </span>
                </div>
                <p className="text-xs mt-1 ml-6">
                  {leaseStatus.status === "active"
                    ? `${leaseStatus.days} days remaining`
                    : leaseStatus.status === "warning"
                    ? `Expires in ${leaseStatus.days} days`
                    : `Expired ${leaseStatus.days} days ago`}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-3">Registered Vehicles</h3>

            {tenant.vehicles.length > 0 ? (
              <div className="space-y-3">
                {tenant.vehicles.map((vehicle, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <p className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Color: {vehicle.color}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      License: {vehicle.licensePlate}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No vehicles registered
              </p>
            )}

            <Button variant="ghost" size="sm" className="mt-3 w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicles
            </Button>
          </div>

          {/* Notes */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Notes</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2 -mr-2">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm">{tenant.notes || "No notes available."}</p>
          </div>
        </div>

        {/* Main content - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm text-muted-foreground">
                  Payment Status
                </h3>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : tenant.paymentStatus === "late"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {tenant.paymentStatus === "paid"
                    ? "Paid"
                    : tenant.paymentStatus === "late"
                    ? "Late"
                    : "Pending"}
                </div>
              </div>
              <p className="text-2xl font-bold">
                $
                {tenant.balance === 0
                  ? "0.00"
                  : tenant.balance.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenant.balance === 0
                  ? "No outstanding balance"
                  : "Current balance"}
              </p>
              <p className="text-sm mt-2">
                Last payment:{" "}
                {new Date(tenant.lastPaymentDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-sm text-muted-foreground mb-2">
                Maintenance
              </h3>
              <p className="text-2xl font-bold">
                {tenant.maintenanceRequests.length}
              </p>
              <p className="text-sm text-muted-foreground">Total requests</p>
              <div className="flex justify-between mt-2 text-sm">
                <span>
                  {
                    tenant.maintenanceRequests.filter(
                      (r) => r.status === "completed"
                    ).length
                  }{" "}
                  completed
                </span>
                <span>
                  {
                    tenant.maintenanceRequests.filter(
                      (r) => r.status !== "completed"
                    ).length
                  }{" "}
                  open
                </span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-sm text-muted-foreground mb-2">Documents</h3>
              <p className="text-2xl font-bold">{tenant.documents.length}</p>
              <p className="text-sm text-muted-foreground">Stored documents</p>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2 h-8">
                <FileText className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex flex-wrap -mb-px">
              <TabButton
                label="Overview"
                isActive={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <TabButton
                label="Payments"
                isActive={activeTab === "payments"}
                onClick={() => setActiveTab("payments")}
              />
              <TabButton
                label="Maintenance"
                isActive={activeTab === "maintenance"}
                onClick={() => setActiveTab("maintenance")}
              />
              <TabButton
                label="Documents"
                isActive={activeTab === "documents"}
                onClick={() => setActiveTab("documents")}
              />
              <TabButton
                label="Communications"
                isActive={activeTab === "communications"}
                onClick={() => setActiveTab("communications")}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-card border rounded-lg">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-4">
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-medium mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <ActionCard
                        icon={<DollarSign className="h-5 w-5" />}
                        title="Record Payment"
                        onClick={() => setActiveTab("payments")}
                      />
                      <ActionCard
                        icon={<Wrench className="h-5 w-5" />}
                        title="Maintenance Request"
                        onClick={() => setActiveTab("maintenance")}
                      />
                      <ActionCard
                        icon={<FileText className="h-5 w-5" />}
                        title="Upload Document"
                        onClick={() => setActiveTab("documents")}
                      />
                      <ActionCard
                        icon={<Bell className="h-5 w-5" />}
                        title="Send Notice"
                      />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="font-medium mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      <ActivityItem
                        icon={<DollarSign className="h-4 w-4" />}
                        title="Rent Payment Received"
                        description="Monthly rent payment for June 2023"
                        date="June 1, 2023"
                      />
                      <ActivityItem
                        icon={<Wrench className="h-4 w-4" />}
                        title="Maintenance Request"
                        description="Bathroom vent not working"
                        date="May 20, 2023"
                        status="in-progress"
                      />
                      <ActivityItem
                        icon={<FileText className="h-4 w-4" />}
                        title="Document Updated"
                        description="Unit inspection report uploaded"
                        date="May 15, 2023"
                      />
                      <ActivityItem
                        icon={<MessageSquare className="h-4 w-4" />}
                        title="Message Sent"
                        description="Reminder about community event"
                        date="May 10, 2023"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3">
                      View All Activity
                    </Button>
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <h3 className="font-medium mb-3">Upcoming Events</h3>
                    <div className="space-y-3">
                      <EventItem
                        title="Lease Renewal Discussion"
                        date="July 15, 2023"
                        daysAway={37}
                      />
                      <EventItem
                        title="Quarterly Unit Inspection"
                        date="June 28, 2023"
                        daysAway={20}
                      />
                      <EventItem
                        title="Pest Control Service"
                        date="June 15, 2023"
                        daysAway={7}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Payment History</h3>
                  <Button size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tenant.paymentHistory.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {payment.type === "rent"
                              ? "Monthly Rent"
                              : payment.type === "security_deposit"
                              ? "Security Deposit"
                              : "Payment"}
                          </td>
                          <td className="py-3 px-4">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === "completed"
                                  ? payment.late
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                  : payment.status === "pending"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {payment.status === "completed"
                                ? payment.late
                                  ? "Late"
                                  : "Paid"
                                : payment.status === "pending"
                                ? "Pending"
                                : "Failed"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              View Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 border rounded-md bg-muted/50">
                  <h4 className="font-medium mb-2">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Paid</p>
                      <p className="font-medium">
                        $
                        {tenant.paymentHistory
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Late Payments</p>
                      <p className="font-medium">
                        {tenant.paymentHistory.filter((p) => p.late).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Security Deposit</p>
                      <p className="font-medium">
                        ${tenant.securityDeposit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Balance</p>
                      <p className="font-medium">
                        ${tenant.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Maintenance Requests</h3>
                  <Button size="sm">
                    <Wrench className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>

                <div className="space-y-4">
                  {tenant.maintenanceRequests.length > 0 ? (
                    tenant.maintenanceRequests.map((request) => (
                      <div key={request.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{request.issue}</h4>
                            <p className="text-sm text-muted-foreground">
                              Reported on{" "}
                              {new Date(request.date).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : request.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {request.status === "completed"
                              ? "Completed"
                              : request.status === "in-progress"
                              ? "In Progress"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-2 font-medium">
                        No maintenance requests
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        There are no maintenance requests from this tenant.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Tenant Documents</h3>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                <div className="space-y-4">
                  {tenant.documents.length > 0 ? (
                    tenant.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex justify-between items-center border rounded-md p-3"
                      >
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 mr-3 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.date).toLocaleDateString()} -{" "}
                              {doc.type.charAt(0).toUpperCase() +
                                doc.type.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mr-1"
                          >
                            <Clipboard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-2 font-medium">No documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        There are no documents for this tenant.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Communications Tab */}
            {activeTab === "communications" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Communication History</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                {/* Messages would go here */}
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 font-medium">No message history</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a conversation with this tenant.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const TabButton = ({ label, isActive, onClick }) => (
  <button
    className={`px-4 py-2 font-medium text-sm ${
      isActive
        ? "border-b-2 border-primary text-primary"
        : "text-muted-foreground hover:text-foreground"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const ContactItem = ({ icon, label, value, onClick = null }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center text-sm text-muted-foreground">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </div>
    {onClick ? (
      <button
        onClick={onClick}
        className="font-medium text-sm text-primary hover:underline"
      >
        {value}
      </button>
    ) : (
      <div className="font-medium text-sm">{value}</div>
    )}
  </div>
);

const ActionCard = ({ icon, title, onClick = null }) => (
  <button
    className="flex flex-col items-center justify-center p-4 border rounded-md hover:border-primary hover:bg-muted/50 transition-colors"
    onClick={onClick}
  >
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
      {icon}
    </div>
    <span className="text-sm font-medium">{title}</span>
  </button>
);

const ActivityItem = ({ icon, title, description, date, status = null }) => (
  <div className="flex items-start gap-3 p-3 border rounded-md">
    <div className="mt-1 bg-muted rounded-full p-2">{icon}</div>
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "in-progress"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {status === "completed"
                ? "Completed"
                : status === "in-progress"
                ? "In Progress"
                : "Pending"}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

const EventItem = ({ title, date, daysAway }) => (
  <div className="flex items-center justify-between p-3 border rounded-md">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
    <div className="text-right">
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          daysAway <= 7
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {daysAway} {daysAway === 1 ? "day" : "days"} away
      </span>
    </div>
  </div>
);

export default TenantDetail;
