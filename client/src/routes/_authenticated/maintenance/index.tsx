import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/maintenance/")({
  component: WorkOrders,
});

function WorkOrders() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Use the tRPC hooks to fetch maintenance requests
  const { getAll, isLoading, error } = useMaintenance();

  // Filter parameters based on the active tab
  const filterParams = {
    status: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
  };

  // Fetch maintenance requests with filter
  const { data: maintenanceData = [] } = getAll(filterParams);

  // Filter maintenance requests based on active tab
  const filteredOrders = maintenanceData;

  // Handler for when a work order is clicked
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">
          Error loading maintenance requests: {error.message}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Filter by Date
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left panel - Work Order List */}
        <div className="w-full lg:w-2/3 pr-0 lg:pr-4">
          <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search work orders..."
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

          {/* Tab Navigation */}
          <div className="border-b mb-4">
            <div className="flex flex-wrap -mb-px">
              {["pending", "assigned", "in-progress", "completed", "all"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Work Order Cards */}
          <div className="space-y-4 overflow-auto max-h-[calc(100vh-280px)]">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <WorkOrderCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrder?.id === order.id}
                  onClick={() => handleOrderClick(order)}
                />
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  No work orders found
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {activeTab === "pending"
                    ? "There are no pending work orders at the moment."
                    : activeTab === "assigned"
                    ? "There are no assigned work orders at the moment."
                    : activeTab === "in-progress"
                    ? "There are no work orders in progress at the moment."
                    : activeTab === "completed"
                    ? "There are no completed work orders at the moment."
                    : "There are no work orders at the moment."}
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Work Order
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Work Order Details */}
        <div className="hidden lg:block w-1/3 border-l pl-4">
          {selectedOrder ? (
            <WorkOrderDetail
              order={selectedOrder}
              onStatusChange={(newStatus) => {
                // Here you would call the API to update the status
                // Then refetch the orders or update the local state
                setSelectedOrder({
                  ...selectedOrder,
                  status: newStatus,
                });
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a work order</h3>
              <p className="text-muted-foreground mt-2">
                Click on a work order to view its details and take action.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile work order detail modal */}
      {selectedOrder && (
        <div className="lg:hidden fixed inset-0 bg-background z-50 overflow-auto">
          <div className="p-4">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedOrder(null)}
            >
              &larr; Back to list
            </Button>
            <WorkOrderDetail
              order={selectedOrder}
              onStatusChange={(newStatus) => {
                // Same as above
                setSelectedOrder({
                  ...selectedOrder,
                  status: newStatus,
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Work Order Card Component
const WorkOrderCard = ({ order, isSelected, onClick }) => {
  const getPriorityStyle = (priority) => {
    const styles = {
      high: "bg-destructive/10 text-destructive",
      medium: "bg-amber-100 text-amber-700",
      normal: "bg-emerald-100 text-emerald-700",
      low: "bg-blue-100 text-blue-700",
    };
    return styles[priority] || styles.normal;
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{order.id}</span>
          <span className="text-sm text-muted-foreground">{order.type}</span>
        </div>
        <div
          className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(
            order.priority
          )}`}
        >
          {order.priority?.charAt(0).toUpperCase() + order.priority?.slice(1) ||
            "Normal"}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-sm mb-1">Location</h3>
        <p className="text-sm">{order.location || "Unknown location"}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm line-clamp-2">{order.description}</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
            {order.reportedBy?.name?.charAt(0) || "?"}
          </div>
          <span className="text-xs text-muted-foreground">
            Reported by {order.reportedBy?.name || "Unknown"}
          </span>
        </div>

        {order.images && order.images.length > 0 && (
          <div className="flex -space-x-1">
            {order.images.slice(0, 2).map((img, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded-md bg-muted border"
              ></div>
            ))}
            {order.images.length > 2 && (
              <div className="w-6 h-6 rounded-md bg-muted border flex items-center justify-center text-xs">
                +{order.images.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Work Order Detail Component
const WorkOrderDetail = ({ order, onStatusChange }) => {
  const getStatusLabel = (statusValue) => {
    const labels = {
      pending: "Pending",
      assigned: "Assigned",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[statusValue] || "Unknown Status";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Work Order Details</h2>
          <p className="text-sm text-muted-foreground">
            {getStatusLabel(order.status)}
          </p>
        </div>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6 flex-1 overflow-auto">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">ID</h3>
          <p className="font-mono">{order.id}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Type
          </h3>
          <p>{order.type}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Location
          </h3>
          <p>{order.location}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Description
          </h3>
          <p className="text-sm">{order.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Reported By
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              {order.reportedBy?.name.charAt(0) || "?"}
            </div>
            <span>{order.reportedBy?.name || "Unknown"}</span>
          </div>
        </div>

        {order.images && order.images.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Images
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {order.images.map((img, index) => (
                <div
                  key={index}
                  className="aspect-square bg-muted rounded-md"
                ></div>
              ))}
            </div>
          </div>
        )}

        {order.assignedTo && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Assigned To
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                {order.assignedTo.name.charAt(0)}
              </div>
              <span>{order.assignedTo.name}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {(order.status === "pending" || !order.status) && (
          <>
            <Button
              className="w-full"
              onClick={() => onStatusChange("assigned")}
            >
              Assign Technician
            </Button>
            <Button variant="outline" className="w-full">
              Schedule for Later
            </Button>
          </>
        )}

        {order.status === "assigned" && (
          <>
            <Button
              className="w-full"
              onClick={() => onStatusChange("in-progress")}
            >
              Mark In Progress
            </Button>
            <Button variant="outline" className="w-full">
              Reassign
            </Button>
          </>
        )}

        {order.status === "in-progress" && (
          <>
            <Button
              className="w-full"
              onClick={() => onStatusChange("completed")}
            >
              Mark as Complete
            </Button>
            <Button variant="outline" className="w-full">
              Request Materials
            </Button>
          </>
        )}

        {order.status === "completed" && (
          <>
            <Button variant="outline" className="w-full">
              View Report
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => onStatusChange("pending")}
            >
              Reopen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkOrders;
