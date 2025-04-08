// client/src/routes/leases/index.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Home,
  Plus,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/leases/")({
  component: LeaseManagement,
});

// Mock lease data
const LEASES = [
  {
    id: "lease-1",
    tenantName: "James Wilson",
    tenantId: "tenant-1",
    propertyName: "Sobha Garden",
    unitNumber: "101",
    startDate: "2023-01-15",
    endDate: "2024-01-15",
    rentAmount: 1200,
    status: "active",
    renewalStatus: "pending",
    paymentStatus: "paid",
    securityDeposit: 1200,
    lastPaymentDate: "2023-06-01",
  },
  {
    id: "lease-2",
    tenantName: "Emily Davis",
    tenantId: "tenant-2",
    propertyName: "Sobha Garden",
    unitNumber: "103",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    rentAmount: 1250,
    status: "active",
    renewalStatus: "not-started",
    paymentStatus: "paid",
    securityDeposit: 1250,
    lastPaymentDate: "2023-06-01",
  },
  {
    id: "lease-3",
    tenantName: "Robert Johnson",
    tenantId: "tenant-3",
    propertyName: "Sobha Garden",
    unitNumber: "201",
    startDate: "2023-03-15",
    endDate: "2024-03-15",
    rentAmount: 1800,
    status: "active",
    renewalStatus: "not-started",
    paymentStatus: "late",
    securityDeposit: 1800,
    lastPaymentDate: "2023-05-05",
  },
  {
    id: "lease-4",
    tenantName: "Sarah Miller",
    tenantId: "tenant-4",
    propertyName: "Sobha Garden",
    unitNumber: "202",
    startDate: "2023-07-01",
    endDate: "2024-06-30",
    rentAmount: 2400,
    status: "upcoming",
    renewalStatus: "not-started",
    paymentStatus: "not-started",
    securityDeposit: 2400,
    lastPaymentDate: null,
  },
  {
    id: "lease-5",
    tenantName: "Michael Brown",
    tenantId: "tenant-5",
    propertyName: "Crown Tower",
    unitNumber: "304",
    startDate: "2022-08-01",
    endDate: "2023-07-31",
    rentAmount: 1650,
    status: "expiring-soon",
    renewalStatus: "in-progress",
    paymentStatus: "paid",
    securityDeposit: 1650,
    lastPaymentDate: "2023-06-02",
  },
  {
    id: "lease-6",
    tenantName: "Jennifer White",
    tenantId: "tenant-6",
    propertyName: "Crown Tower",
    unitNumber: "402",
    startDate: "2022-05-15",
    endDate: "2023-05-14",
    rentAmount: 1550,
    status: "expired",
    renewalStatus: "not-renewed",
    paymentStatus: "paid",
    securityDeposit: 1550,
    lastPaymentDate: "2023-05-01",
  },
];

// Mock lease documents
const LEASE_DOCUMENTS = [
  {
    id: "doc-1",
    leaseId: "lease-1",
    name: "Lease Agreement - James Wilson",
    type: "agreement",
    uploadDate: "2023-01-10",
    size: "2.4 MB",
  },
  {
    id: "doc-2",
    leaseId: "lease-1",
    name: "Security Deposit Receipt",
    type: "receipt",
    uploadDate: "2023-01-15",
    size: "1.1 MB",
  },
  {
    id: "doc-3",
    leaseId: "lease-2",
    name: "Lease Agreement - Emily Davis",
    type: "agreement",
    uploadDate: "2022-12-22",
    size: "2.3 MB",
  },
  {
    id: "doc-4",
    leaseId: "lease-3",
    name: "Lease Agreement - Robert Johnson",
    type: "agreement",
    uploadDate: "2023-03-10",
    size: "2.5 MB",
  },
  {
    id: "doc-5",
    leaseId: "lease-4",
    name: "Lease Agreement - Sarah Miller",
    type: "agreement",
    uploadDate: "2023-06-15",
    size: "2.6 MB",
  },
];

function LeaseManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active"); // "active", "upcoming", "expired", "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLease, setSelectedLease] = useState<string | null>(null);

  // Filter leases based on the active tab and search term
  const filteredLeases = LEASES.filter((lease) => {
    // Filter by tab
    if (
      activeTab === "active" &&
      lease.status !== "active" &&
      lease.status !== "expiring-soon"
    )
      return false;
    if (activeTab === "upcoming" && lease.status !== "upcoming") return false;
    if (activeTab === "expired" && lease.status !== "expired") return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        lease.tenantName.toLowerCase().includes(searchLower) ||
        lease.propertyName.toLowerCase().includes(searchLower) ||
        lease.unitNumber.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Get lease by ID
  const getLeaseById = (leaseId: string) => {
    return LEASES.find((lease) => lease.id === leaseId);
  };

  // Get documents for a lease
  const getLeaseDocuments = (leaseId: string) => {
    return LEASE_DOCUMENTS.filter((doc) => doc.leaseId === leaseId);
  };

  // Calculate time remaining/overdue
  const getTimeStatus = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Expired ${Math.abs(diffDays)} days ago`,
        status: "expired",
      };
    } else if (diffDays <= 30) {
      return { text: `Expires in ${diffDays} days`, status: "expiring-soon" };
    } else {
      return { text: `${diffDays} days remaining`, status: "active" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lease Management</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Lease
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search leases..."
            className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Lease Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Active Leases"
          value={
            LEASES.filter(
              (l) => l.status === "active" || l.status === "expiring-soon"
            ).length
          }
          icon={<Check className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Expiring Soon"
          value={LEASES.filter((l) => l.status === "expiring-soon").length}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Late Payments"
          value={LEASES.filter((l) => l.paymentStatus === "late").length}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        />
        <StatCard
          title="Total Monthly Revenue"
          value={`$${LEASES.filter(
            (l) => l.status === "active" || l.status === "expiring-soon"
          )
            .reduce((sum, lease) => sum + lease.rentAmount, 0)
            .toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex flex-wrap -mb-px">
          <TabButton
            label="Active"
            isActive={activeTab === "active"}
            onClick={() => setActiveTab("active")}
          />
          <TabButton
            label="Upcoming"
            isActive={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
          />
          <TabButton
            label="Expired"
            isActive={activeTab === "expired"}
            onClick={() => setActiveTab("expired")}
          />
          <TabButton
            label="All Leases"
            isActive={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
        </div>
      </div>

      {/* Lease Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lease List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredLeases.length > 0 ? (
              filteredLeases.map((lease) => (
                <LeaseCard
                  key={lease.id}
                  lease={lease}
                  isSelected={selectedLease === lease.id}
                  onClick={() =>
                    setSelectedLease(
                      lease.id === selectedLease ? null : lease.id
                    )
                  }
                  timeStatus={getTimeStatus(lease.endDate)}
                />
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No leases found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search or filters."
                    : activeTab === "active"
                    ? "There are no active leases at the moment."
                    : activeTab === "upcoming"
                    ? "There are no upcoming leases at the moment."
                    : activeTab === "expired"
                    ? "There are no expired leases at the moment."
                    : "No leases have been created yet."}
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Lease
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Lease Details */}
        <div className="lg:block">
          {selectedLease ? (
            <LeaseDetails
              lease={getLeaseById(selectedLease)!}
              documents={getLeaseDocuments(selectedLease)}
            />
          ) : (
            <div className="border rounded-lg p-6 text-center h-full flex flex-col items-center justify-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Lease Details</h3>
              <p className="text-muted-foreground mt-2">
                Select a lease to view more details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-card rounded-lg border p-4">
    <div className="flex justify-between items-center mb-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

// Tab Button Component
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

// Lease Card Component
const LeaseCard = ({ lease, isSelected, onClick, timeStatus }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "expiring-soon":
        return "bg-amber-100 text-amber-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "late":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
        isSelected ? "border-primary bg-muted/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">{lease.tenantName}</h3>
          <p className="text-sm text-muted-foreground">
            {lease.propertyName} - Unit {lease.unitNumber}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium mb-1 ${getStatusStyles(
              lease.status
            )}`}
          >
            {lease.status === "active"
              ? "Active"
              : lease.status === "expiring-soon"
              ? "Expiring Soon"
              : lease.status === "expired"
              ? "Expired"
              : "Upcoming"}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusStyles(
              lease.paymentStatus
            )}`}
          >
            {lease.paymentStatus === "paid"
              ? "Paid"
              : lease.paymentStatus === "late"
              ? "Late Payment"
              : lease.paymentStatus === "pending"
              ? "Payment Due"
              : "Not Started"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Lease Period</p>
          <p className="text-sm font-medium">
            {new Date(lease.startDate).toLocaleDateString()} -{" "}
            {new Date(lease.endDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Monthly Rent</p>
          <p className="text-sm font-medium">
            ${lease.rentAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">Time Remaining</p>
          <p
            className={`text-sm ${
              timeStatus.status === "expired"
                ? "text-red-600"
                : timeStatus.status === "expiring-soon"
                ? "text-amber-600"
                : ""
            }`}
          >
            {timeStatus.text}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          View Details
          <ChevronDown
            className={`h-4 w-4 ml-1 transition-transform ${
              isSelected ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>
    </div>
  );
};

// Lease Details Component
const LeaseDetails = ({ lease, documents }) => {
  const [activeDetailTab, setActiveDetailTab] = useState("overview"); // "overview", "documents", "payments"

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-lg h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium">Lease Details</h3>
      </div>

      {/* Detail Tabs */}
      <div className="border-b">
        <div className="flex -mb-px">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeDetailTab === "overview"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveDetailTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeDetailTab === "documents"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveDetailTab("documents")}
          >
            Documents
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeDetailTab === "payments"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveDetailTab("payments")}
          >
            Payments
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Overview Tab */}
        {activeDetailTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Tenant Information
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{lease.tenantName}</p>
                  <p className="text-sm text-muted-foreground">
                    Primary Tenant
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Tenant Profile
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Lease Terms
              </h4>
              <div className="space-y-3">
                <DetailItem
                  label="Property"
                  value={`${lease.propertyName} - Unit ${lease.unitNumber}`}
                  icon={<Home className="h-4 w-4" />}
                />
                <DetailItem
                  label="Lease Start"
                  value={formatDate(lease.startDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailItem
                  label="Lease End"
                  value={formatDate(lease.endDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailItem
                  label="Monthly Rent"
                  value={`$${lease.rentAmount.toLocaleString()}`}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <DetailItem
                  label="Security Deposit"
                  value={`$${lease.securityDeposit.toLocaleString()}`}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <DetailItem
                  label="Last Payment"
                  value={formatDate(lease.lastPaymentDate)}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Renewal Status
              </h4>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">
                  {lease.renewalStatus === "pending"
                    ? "Renewal Pending"
                    : lease.renewalStatus === "in-progress"
                    ? "Renewal In Progress"
                    : lease.renewalStatus === "not-renewed"
                    ? "Not Renewed"
                    : "Not Started"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lease.renewalStatus === "pending"
                    ? "Awaiting tenant response for lease renewal."
                    : lease.renewalStatus === "in-progress"
                    ? "Renewal process has started."
                    : lease.renewalStatus === "not-renewed"
                    ? "Tenant has declined to renew the lease."
                    : "Renewal process has not been initiated yet."}
                </p>
              </div>

              {lease.status !== "expired" &&
                lease.renewalStatus !== "not-renewed" && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Initiate Renewal
                    </Button>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeDetailTab === "documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Lease Documents</h4>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.uploadDate)} - {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-2 font-medium">No documents found</h3>
                <p className="text-sm text-muted-foreground">
                  Upload lease documents for easy access and management
                </p>
                <Button size="sm" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeDetailTab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Payment History</h4>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted/50 p-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium">Current Month</p>
                  <p className="text-xs text-muted-foreground">June 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ${lease.rentAmount.toLocaleString()}
                  </p>
                  <p
                    className={`text-xs ${
                      lease.paymentStatus === "paid"
                        ? "text-emerald-600"
                        : lease.paymentStatus === "late"
                        ? "text-red-600"
                        : lease.paymentStatus === "pending"
                        ? "text-amber-600"
                        : ""
                    }`}
                  >
                    {lease.paymentStatus === "paid"
                      ? "Paid"
                      : lease.paymentStatus === "late"
                      ? "Late"
                      : lease.paymentStatus === "pending"
                      ? "Due"
                      : "Not Started"}
                  </p>
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Timeline
                </p>
                <div className="space-y-3">
                  <PaymentItem
                    month="Jun 2023"
                    amount={lease.rentAmount}
                    status={lease.paymentStatus}
                    date={lease.lastPaymentDate}
                  />
                  <PaymentItem
                    month="May 2023"
                    amount={lease.rentAmount}
                    status="paid"
                    date="2023-05-01"
                  />
                  <PaymentItem
                    month="Apr 2023"
                    amount={lease.rentAmount}
                    status="paid"
                    date="2023-04-02"
                  />
                  <PaymentItem
                    month="Mar 2023"
                    amount={lease.rentAmount}
                    status="late"
                    date="2023-03-10"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-md p-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Payment Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Payments Made</span>
                  <span>$4,800</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average Payment Date</span>
                  <span>3rd of month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Late Payments</span>
                  <span>1</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-between gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View Full Lease
          </Button>
          <Button size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

// Detail Item Component
const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center text-sm text-muted-foreground">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </div>
    <div className="font-medium text-sm">{value}</div>
  </div>
);

// Payment Item Component
const PaymentItem = ({ month, amount, status, date }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-emerald-600";
      case "late":
        return "text-red-600";
      case "pending":
        return "text-amber-600";
      default:
        return "";
    }
  };

  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            status === "paid"
              ? "bg-emerald-500"
              : status === "late"
              ? "bg-red-500"
              : status === "pending"
              ? "bg-amber-500"
              : "bg-muted"
          }`}
        ></div>
        <span>{month}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={getStatusColor(status)}>
          {status === "paid"
            ? "Paid"
            : status === "late"
            ? "Late"
            : status === "pending"
            ? "Due"
            : "Not Started"}
        </span>
        <span>${amount.toLocaleString()}</span>
        <span className="text-muted-foreground">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </span>
      </div>
    </div>
  );
};

export default LeaseManagement;
