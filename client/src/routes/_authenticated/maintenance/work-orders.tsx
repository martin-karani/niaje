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
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/maintenance/work-orders")({
  component: WorkOrders,
});

function WorkOrders() {
  const { user, activeProperty } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Build filter parameters based on the active tab and search term
  const filterParams = {
    propertyId: activeProperty?.id, // Filter by active property
    status: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
  };

  // Use the maintenance hook to fetch data
  const maintenance = useMaintenance();
  const {
    data: maintenanceData,
    isLoading,
    error,
  } = maintenance.getAll(filterParams);

  // Get categories for new request form
  const { data: categories } = maintenance.getCategories();

  // Reset selected order when filter changes
  useEffect(() => {
    setSelectedOrder(null);
  }, [activeTab, searchTerm, activeProperty?.id]);

  // Handler for when a work order is clicked
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  // Handler for changing status of a maintenance request
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await maintenance.update.mutateAsync({
        id: requestId,
        status: newStatus,
      });

      // If the selected order was updated, update it in state
      if (selectedOrder?.id === requestId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Handler for assigning a request to a user
  const handleAssignRequest = async (requestId, assigneeId, notes) => {
    try {
      const updatedRequest = await maintenance.assign.mutateAsync({
        id: requestId,
        assignedTo: assigneeId,
        notes,
      });

      // If the selected order was updated, update it in state
      if (selectedOrder?.id === requestId) {
        setSelectedOrder(updatedRequest);
      }
    } catch (error) {
      console.error("Failed to assign request:", error);
    }
  };

  // Handler for resolving a request
  const handleResolveRequest = async (requestId, resolution, cost, notes) => {
    try {
      const updatedRequest = await maintenance.resolve.mutateAsync({
        id: requestId,
        resolution,
        cost,
        notes,
      });

      // If the selected order was updated, update it in state
      if (selectedOrder?.id === requestId) {
        setSelectedOrder(updatedRequest);
      }
    } catch (error) {
      console.error("Failed to resolve request:", error);
    }
  };

  // Handler for adding a comment
  const handleAddComment = async (requestId, content, isPrivate = false) => {
    try {
      await maintenance.addComment.mutateAsync({
        requestId,
        content,
        isPrivate,
      });

      // Refresh the selected order to include the new comment
      if (selectedOrder?.id === requestId) {
        const updatedRequest = await maintenance.getById.refetch({
          id: requestId,
        });
        setSelectedOrder(updatedRequest.data);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Handler for creating a new request
  const handleCreateRequest = async (requestData) => {
    try {
      await maintenance.create.mutateAsync({
        ...requestData,
        propertyId: activeProperty?.id,
      });
      setShowNewRequestModal(false);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
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

  // Get requests from the data
  const requests = maintenanceData?.requests || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Filter by Date
          </Button>
          <Button onClick={() => setShowNewRequestModal(true)}>
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
              {["open", "in_progress", "completed", "all"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "in_progress" ? "In Progress" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Work Order Cards */}
          <div className="space-y-4 overflow-auto max-h-[calc(100vh-280px)]">
            {requests.length > 0 ? (
              requests.map((request) => (
                <WorkOrderCard
                  key={request.id}
                  order={request}
                  isSelected={selectedOrder?.id === request.id}
                  onClick={() => handleOrderClick(request)}
                />
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  No work orders found
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {activeTab === "open"
                    ? "There are no open work orders at the moment."
                    : activeTab === "in_progress"
                    ? "There are no work orders in progress at the moment."
                    : activeTab === "completed"
                    ? "There are no completed work orders at the moment."
                    : "There are no work orders at the moment."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowNewRequestModal(true)}
                >
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
              onStatusChange={handleStatusChange}
              onAssign={handleAssignRequest}
              onResolve={handleResolveRequest}
              onAddComment={handleAddComment}
              currentUser={user}
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
              onStatusChange={handleStatusChange}
              onAssign={handleAssignRequest}
              onResolve={handleResolveRequest}
              onAddComment={handleAddComment}
              currentUser={user}
            />
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSubmit={handleCreateRequest}
          categories={categories || []}
          propertyId={activeProperty?.id}
        />
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

  // Format the location display
  const getLocationDisplay = (order) => {
    if (order.unit) {
      return `${order.unit.property?.name || "Unknown Property"} - ${
        order.unit.name
      }`;
    }
    return "Unknown location";
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
          <span className="font-mono text-sm font-medium">
            {order.id.substring(0, 8)}
          </span>
          <span className="text-sm text-muted-foreground">{order.title}</span>
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
        <p className="text-sm">{getLocationDisplay(order)}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm line-clamp-2">{order.description}</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
            {order.tenant?.name?.charAt(0) || "?"}
          </div>
          <span className="text-xs text-muted-foreground">
            Reported by {order.tenant?.name || "Unknown"}
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
const WorkOrderDetail = ({
  order,
  onStatusChange,
  onAssign,
  onResolve,
  onAddComment,
  currentUser,
}) => {
  const [comment, setComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolutionCost, setResolutionCost] = useState("");

  const getStatusLabel = (statusValue) => {
    const labels = {
      open: "Open",
      in_progress: "In Progress",
      completed: "Completed",
      closed: "Closed",
      cancelled: "Cancelled",
    };
    return labels[statusValue] || "Unknown Status";
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      onAddComment(order.id, comment, isPrivate);
      setComment("");
    }
  };

  const handleResolve = () => {
    if (resolution.trim()) {
      onResolve(
        order.id,
        resolution,
        resolutionCost ? Number(resolutionCost) : undefined
      );
      setResolution("");
      setResolutionCost("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{order.title}</h2>
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
            Unit
          </h3>
          <p>{order.unit?.name || "Not assigned"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Property
          </h3>
          <p>{order.unit?.property?.name || "Not assigned"}</p>
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
              {order.tenant?.name?.charAt(0) || "?"}
            </div>
            <div>
              <span>{order.tenant?.name || "Unknown"}</span>
              {order.tenant?.email && (
                <p className="text-xs text-muted-foreground">
                  {order.tenant.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {order.assignee && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Assigned To
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                {order.assignee.name.charAt(0)}
              </div>
              <div>
                <span>{order.assignee.name}</span>
                {order.assignee.email && (
                  <p className="text-xs text-muted-foreground">
                    {order.assignee.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {order.resolvedAt && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Resolved On
            </h3>
            <p>{new Date(order.resolvedAt).toLocaleDateString()}</p>
          </div>
        )}

        {order.cost !== null && order.cost !== undefined && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Cost
            </h3>
            <p>${order.cost.toFixed(2)}</p>
          </div>
        )}

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

        {/* Comments section */}
        {order.comments && order.comments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Comments
            </h3>
            <div className="space-y-3">
              {order.comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                        {comment.user?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">
                        {comment.user?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.isPrivate && (
                        <span className="ml-2 px-1 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add comment form */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Add Comment
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            placeholder="Enter your comment..."
          ></textarea>
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private comment (only visible to staff)
            </label>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!comment.trim()}
            >
              Add Comment
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {order.status === "open" && (
          <>
            <Button
              className="w-full"
              onClick={() => onStatusChange(order.id, "in_progress")}
            >
              Mark In Progress
            </Button>
            <Button variant="outline" className="w-full">
              Assign Technician
            </Button>
          </>
        )}

        {order.status === "in_progress" && (
          <>
            <div>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                placeholder="Enter resolution details..."
              ></textarea>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={resolutionCost}
                  onChange={(e) => setResolutionCost(e.target.value)}
                  placeholder="Cost ($)"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  onClick={handleResolve}
                  disabled={!resolution.trim()}
                  className="whitespace-nowrap"
                >
                  Mark Completed
                </Button>
              </div>
            </div>
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
              onClick={() => onStatusChange(order.id, "open")}
            >
              Reopen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// New Request Modal Component
const NewRequestModal = ({ onClose, onSubmit, categories, propertyId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [unitId, setUnitId] = useState("");
  const [category, setCategory] = useState("");

  // TODO: Add unit selection for property

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      unitId,
      category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Work Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Brief title for the issue"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Detailed description of the issue"
                rows={4}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Unit <span className="text-destructive">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select a unit</option>
                {/* TODO: Fetch and display units for the selected property */}
                <option value="unit1">Unit 101</option>
                <option value="unit2">Unit 102</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Work Order</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
