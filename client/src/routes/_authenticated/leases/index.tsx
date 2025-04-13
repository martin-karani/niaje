import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLeases } from "@/hooks/use-leases";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
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

function LeaseManagement() {
  const { user, activeProperty } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLease, setSelectedLease] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Items per page

  // Use hooks to fetch data
  const {
    getAll: getAllLeases,
    getById,
    getStats,
    create,
    update,
    terminate,
    renew,
  } = useLeases();

  // Fetch leases with filters and pagination
  const {
    data: leasesData,
    isLoading: isLoadingLeases,
    error: leasesError,
  } = getAllLeases({
    propertyId: activeProperty?.id,
    status: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
    page: currentPage,
    limit: pageSize,
  });

  // Get lease statistics
  const { data: leaseStats, isLoading: isLoadingStats } = getStats(
    activeProperty?.id || ""
  );

  // Fetch details for the selected lease
  const { data: selectedLeaseDetails, isLoading: isLoadingDetails } = getById(
    selectedLease || "",
    true, // Include transactions
    { enabled: !!selectedLease } // Only run the query if there's a selected lease
  );

  // Calculate time remaining/overdue
  const getTimeStatus = (endDate: string | Date) => {
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

  // Handle loading state
  if (isLoadingLeases || isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <p className="ml-4">Loading lease data...</p>
      </div>
    );
  }

  // Handle error state
  if (leasesError) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        <h3 className="font-bold">Error loading leases</h3>
        <p>{leasesError.message}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Use the fetched data
  const leases = leasesData?.leases || [];
  const totalLeases = leasesData?.total || 0;
  const totalPages = leasesData?.pages || 1;
  const statsData = leaseStats || {
    totalLeases: 0,
    activeLeases: 0,
    expiringNext30Days: 0,
    leasesByStatus: [],
    averageRent: 0,
    totalMonthlyRent: 0,
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // The query will automatically refetch with the new page
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
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
          value={statsData.activeLeases}
          icon={<Check className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Expiring Soon"
          value={statsData.expiringNext30Days}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Late Payments"
          value={0} // This would need additional data
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        />
        <StatCard
          title="Total Monthly Revenue"
          value={`$${Math.floor(statsData.totalMonthlyRent).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex flex-wrap -mb-px">
          <TabButton
            label="Active"
            isActive={activeTab === "active"}
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1); // Reset pagination when changing tabs
            }}
          />
          <TabButton
            label="Upcoming"
            isActive={activeTab === "upcoming"}
            onClick={() => {
              setActiveTab("upcoming");
              setCurrentPage(1);
            }}
          />
          <TabButton
            label="Expired"
            isActive={activeTab === "expired"}
            onClick={() => {
              setActiveTab("expired");
              setCurrentPage(1);
            }}
          />
          <TabButton
            label="All Leases"
            isActive={activeTab === "all"}
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Lease Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lease List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {leases.length > 0 ? (
              <>
                <div className="space-y-4">
                  {leases.map((lease) => (
                    <LeaseCard
                      key={lease.id}
                      lease={{
                        id: lease.id,
                        tenantName: lease.tenant?.name || "Unknown",
                        tenantId: lease.tenant?.id || "",
                        propertyName: lease.unit?.property?.name || "Unknown",
                        unitNumber: lease.unit?.name || "Unknown",
                        startDate: lease.startDate,
                        endDate: lease.endDate,
                        rentAmount: Number(lease.rentAmount),
                        status: lease.status,
                        renewalStatus: "not-started", // This could come from the API if available
                        paymentStatus:
                          lease.status === "active" ? "paid" : "not-started", // Simplification
                        securityDeposit: Number(lease.depositAmount),
                        lastPaymentDate: new Date(), // This could come from transactions
                      }}
                      isSelected={selectedLease === lease.id}
                      onClick={() =>
                        setSelectedLease(
                          lease.id === selectedLease ? null : lease.id
                        )
                      }
                      timeStatus={getTimeStatus(lease.endDate)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              handlePageChange(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum = i + 1;

                            // Show first page, last page, current page, and pages around current
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 &&
                                pageNum <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    isActive={currentPage === pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            // Show ellipsis for skipped pages
                            if (pageNum === 2 && currentPage > 3) {
                              return (
                                <PaginationEllipsis key="ellipsis-start" />
                              );
                            }

                            if (
                              pageNum === totalPages - 1 &&
                              currentPage < totalPages - 2
                            ) {
                              return <PaginationEllipsis key="ellipsis-end" />;
                            }

                            return null;
                          }
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              handlePageChange(
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
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
          {selectedLease && selectedLeaseDetails ? (
            isLoadingDetails ? (
              <div className="flex items-center justify-center h-64 border rounded-lg">
                <LoadingSpinner size="md" />
                <p className="ml-2">Loading details...</p>
              </div>
            ) : (
              <LeaseDetails
                lease={{
                  id: selectedLeaseDetails.id,
                  tenantName: selectedLeaseDetails.tenant?.name || "Unknown",
                  tenantId: selectedLeaseDetails.tenant?.id || "",
                  propertyName:
                    selectedLeaseDetails.unit?.property?.name || "Unknown",
                  unitNumber: selectedLeaseDetails.unit?.name || "Unknown",
                  startDate: selectedLeaseDetails.startDate,
                  endDate: selectedLeaseDetails.endDate,
                  rentAmount: Number(selectedLeaseDetails.rentAmount),
                  status: selectedLeaseDetails.status,
                  renewalStatus: "not-started", // May need API data
                  paymentStatus:
                    selectedLeaseDetails.status === "active"
                      ? "paid"
                      : "not-started", // Simplification
                  securityDeposit: Number(selectedLeaseDetails.depositAmount),
                  lastPaymentDate:
                    selectedLeaseDetails.transactions &&
                    selectedLeaseDetails.transactions.length > 0
                      ? selectedLeaseDetails.transactions[0].paymentDate
                      : null,
                }}
                documents={[]} // Would need a document hook for this
              />
            )
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
  const { transactions } = usePayments();

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
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

              <Link to={`/tenants/${lease.tenantId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Tenant Profile
                </Button>
              </Link>
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

            {documents && documents.length > 0 ? (
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
        {activeDetailTab === "payments" && <PaymentsTab lease={lease} />}
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

// Payment Tab Component with real transaction data
const PaymentsTab = ({ lease }) => {
  const { transactions } = usePayments();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch transactions for this lease with pagination
  const {
    data: transactionsData,
    isLoading,
    error,
  } = transactions.getAll({
    leaseId: lease.id,
    page: page,
    limit: pageSize,
  });

  // Calculate the total rent paid
  const totalPaid = transactionsData?.transactions
    ? transactionsData.transactions
        .filter((tx) => tx.status === "completed" && tx.type === "rent")
        .reduce((sum, tx) => sum + Number(tx.amount), 0)
    : 0;

  // Calculate average payment date
  const getPaidDates = () => {
    if (!transactionsData?.transactions) return "N/A";

    const paidDates = transactionsData.transactions
      .filter((tx) => tx.status === "completed" && tx.type === "rent")
      .map((tx) => new Date(tx.paymentDate).getDate());

    if (paidDates.length === 0) return "N/A";

    const avgDay = Math.round(
      paidDates.reduce((sum, day) => sum + day, 0) / paidDates.length
    );
    return `${avgDay}${getDaySuffix(avgDay)} of month`;
  };

  // Get day suffix (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Count late payments
  const countLatePayments = () => {
    if (!transactionsData?.transactions) return 0;

    return transactionsData.transactions
      .filter(
        (tx) => tx.status === "completed" && tx.type === "rent" && tx.dueDate
      )
      .filter((tx) => new Date(tx.paymentDate) > new Date(tx.dueDate)).length;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Get current month data
  const getCurrentMonthData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (!transactionsData?.transactions) return null;

    // Find the transaction for the current month
    const currentMonthTransaction = transactionsData.transactions.find((tx) => {
      const txDate = new Date(tx.paymentDate);
      return (
        tx.type === "rent" &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    if (currentMonthTransaction) {
      return {
        amount: Number(currentMonthTransaction.amount),
        status: currentMonthTransaction.status,
        date: currentMonthTransaction.paymentDate,
      };
    }

    // If no transaction found for current month, return pending status
    return {
      amount: Number(lease.rentAmount),
      status: "pending",
      date: null,
    };
  };

  const currentMonthData = getCurrentMonthData();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-3">Loading payment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading payment history: {error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
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
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              $
              {currentMonthData?.amount.toLocaleString() ||
                lease.rentAmount.toLocaleString()}
            </p>
            <p
              className={`text-xs ${
                currentMonthData?.status === "completed"
                  ? "text-emerald-600"
                  : currentMonthData?.status === "failed"
                  ? "text-red-600"
                  : currentMonthData?.status === "pending"
                  ? "text-amber-600"
                  : ""
              }`}
            >
              {currentMonthData?.status === "completed"
                ? "Paid"
                : currentMonthData?.status === "failed"
                ? "Failed"
                : currentMonthData?.status === "pending"
                ? "Due"
                : "Not Started"}
            </p>
          </div>
        </div>

        <div className="p-3">
          <p className="text-sm text-muted-foreground mb-2">Payment Timeline</p>
          <div className="space-y-3">
            {transactionsData?.transactions &&
            transactionsData.transactions.length > 0 ? (
              transactionsData.transactions.map((transaction) => (
                <PaymentItem
                  key={transaction.id}
                  month={new Date(transaction.paymentDate).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )}
                  amount={Number(transaction.amount)}
                  status={
                    transaction.status === "completed"
                      ? "paid"
                      : transaction.status
                  }
                  date={transaction.paymentDate}
                />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No payment history available
              </div>
            )}
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
            <span>${totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average Payment Date</span>
            <span>{getPaidDates()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Late Payments</span>
            <span>{countLatePayments()}</span>
          </div>
        </div>
      </div>

      {/* Pagination for transactions */}
      {transactionsData && transactionsData.total > pageSize && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
              </PaginationItem>

              {Array.from(
                {
                  length: Math.min(
                    5,
                    Math.ceil(transactionsData.total / pageSize)
                  ),
                },
                (_, i) => {
                  const pageNum = i + 1;
                  const maxPage = Math.ceil(transactionsData.total / pageSize);

                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === maxPage ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Show ellipsis for skipped pages
                  if (pageNum === 2 && page > 3) {
                    return <PaginationEllipsis key="ellipsis-start" />;
                  }

                  if (pageNum === maxPage - 1 && page < maxPage - 2) {
                    return <PaginationEllipsis key="ellipsis-end" />;
                  }

                  return null;
                }
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        Math.ceil(transactionsData.total / pageSize),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    page === Math.ceil(transactionsData.total / pageSize)
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
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
