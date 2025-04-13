import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import { DotSquare, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/maintenance/work-orders")(
  {
    component: WorkOrdersBoard,
  }
);

function WorkOrdersBoard() {
  const { user, activeProperty } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(
    null
  );
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Use the maintenance hook
  const {
    getAll: getAllMaintenance,
    update: updateMaintenance,
    getCategories,
  } = useMaintenance();

  // Fetch maintenance requests with filters
  const {
    data: maintenanceData,
    isLoading,
    error,
  } = getAllMaintenance({
    propertyId: activeProperty?.id,
  });

  // Get categories
  const { data: categories } = getCategories();

  // Handle drag and drop to change status
  const handleDragStart = (e: React.DragEvent, workOrderId: string) => {
    e.dataTransfer.setData("workOrderId", workOrderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const workOrderId = e.dataTransfer.getData("workOrderId");
    if (workOrderId) {
      try {
        await updateMaintenance.mutateAsync({
          id: workOrderId,
          status: newStatus,
        });
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    }
  };

  // Group work orders by status
  const groupWorkOrdersByStatus = () => {
    if (!maintenanceData?.requests) return {};

    const grouped: Record<string, any[]> = {
      pending: [],
      assigned: [],
      completed: [],
      canceled: [],
    };

    maintenanceData.requests.forEach((order) => {
      if (order.status === "open") {
        grouped.pending.push(order);
      } else if (order.status === "in_progress") {
        grouped.assigned.push(order);
      } else if (order.status === "completed") {
        grouped.completed.push(order);
      } else if (order.status === "canceled" || order.status === "cancelled") {
        grouped.canceled.push(order);
      }
    });

    return grouped;
  };

  const groupedWorkOrders = groupWorkOrdersByStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading work orders: {error.message}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-semibold">Board</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full py-2 pl-10 pr-4 border rounded-md bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-primary text-white"
            onClick={() => setShowNewOrderModal(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full p-4 space-x-4 min-w-max">
          {/* Pending Column */}
          <div className="flex flex-col w-72 h-full">
            <div className="mb-2 font-medium">Pending</div>
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "open")}
            >
              {groupedWorkOrders.pending?.length > 0 ? (
                <div className="space-y-3">
                  {groupedWorkOrders.pending.map((workOrder) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedWorkOrder(workOrder.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  No pending work orders
                </div>
              )}
            </div>
          </div>

          {/* Assigned Column */}
          <div className="flex flex-col w-72 h-full">
            <div className="mb-2 font-medium">Assigned</div>
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "in_progress")}
            >
              {groupedWorkOrders.assigned?.length > 0 ? (
                <div className="space-y-3">
                  {groupedWorkOrders.assigned.map((workOrder) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedWorkOrder(workOrder.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  No assigned work orders
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="flex flex-col w-72 h-full">
            <div className="mb-2 font-medium">Completed</div>
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "completed")}
            >
              {groupedWorkOrders.completed?.length > 0 ? (
                <div className="space-y-3">
                  {groupedWorkOrders.completed.map((workOrder) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedWorkOrder(workOrder.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  No completed work orders
                </div>
              )}
            </div>
          </div>

          {/* Canceled Column */}
          <div className="flex flex-col w-72 h-full">
            <div className="mb-2 font-medium">Canceled</div>
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "canceled")}
            >
              {groupedWorkOrders.canceled?.length > 0 ? (
                <div className="space-y-3">
                  {groupedWorkOrders.canceled.map((workOrder) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedWorkOrder(workOrder.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  No canceled work orders
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Order Detail Modal */}
      {selectedWorkOrder && (
        <WorkOrderDetailModal
          workOrderId={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
        />
      )}

      {/* New Work Order Modal */}
      {showNewOrderModal && (
        <NewWorkOrderModal
          onClose={() => setShowNewOrderModal(false)}
          categories={categories || []}
          propertyId={activeProperty?.id}
        />
      )}
    </div>
  );
}

// Work Order Card Component
const WorkOrderCard = ({
  workOrder,
  onDragStart,
  onClick,
}: {
  workOrder: any;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}) => {
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return (
          <div className="px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-medium">
            High
          </div>
        );
      case "urgent":
        return (
          <div className="px-3 py-1 bg-rose-500 text-white rounded-md text-xs font-medium">
            Urgent
          </div>
        );
      case "normal":
        return (
          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
            Normal
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
            Normal
          </div>
        );
    }
  };

  // Handle image overflow display
  const renderImagePreview = (images: string[] | null | undefined) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="flex mt-2 space-x-1">
        {images.slice(0, 2).map((img, index) => (
          <div
            key={index}
            className="w-16 h-16 rounded bg-muted/20 overflow-hidden"
          >
            <img
              src={img}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {images.length > 2 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            +{images.length - 2} more
          </div>
        )}
      </div>
    );
  };

  // Get category code (E-1935, P-833, etc.)
  const getCategoryCode = () => {
    const category = workOrder.category || "electricity";
    const id = workOrder.id || Math.floor(Math.random() * 1000).toString();

    switch (category.toLowerCase()) {
      case "electricity":
        return `E-${id.substring(0, 4)}`;
      case "plumbing":
        return `P-${id.substring(0, 3)}`;
      case "hvac":
        return `H-${id.substring(0, 3)}`;
      default:
        return `E-${id.substring(0, 4)}`;
    }
  };

  // Get type (Electricity, Plumbing, HVAC, etc.)
  const getType = () => {
    const category = workOrder.category || "electricity";

    switch (category.toLowerCase()) {
      case "electricity":
        return "Electricity";
      case "plumbing":
        return "Plumbing";
      case "hvac":
        return "HVAC";
      default:
        return "Electricity";
    }
  };

  return (
    <div
      className="border rounded-md bg-white shadow-sm cursor-pointer overflow-hidden"
      draggable
      onDragStart={(e) => onDragStart(e, workOrder.id)}
      onClick={onClick}
    >
      <div className="p-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex">
            <DotSquare className="h-4 w-4 text-muted-foreground mr-2" />
            <div>
              <div className="text-sm font-medium">{getCategoryCode()}</div>
              <div className="text-xs text-muted-foreground">{getType()}</div>
            </div>
          </div>
          {getPriorityBadge(workOrder.priority || "normal")}
        </div>
      </div>

      {workOrder.assignee && (
        <div className="px-3 py-2 flex items-center border-b">
          <div className="text-xs">Assigned to</div>
          <div className="flex items-center ml-2">
            <div className="w-5 h-5 rounded-full bg-muted/20 overflow-hidden mr-1">
              {workOrder.assignee.image ? (
                <img
                  src={workOrder.assignee.image}
                  alt={workOrder.assignee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">
                  {workOrder.assignee.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-xs font-medium">{workOrder.assignee.name}</div>
          </div>
        </div>
      )}

      <div className="px-3 py-2">
        <div className="flex justify-between items-start">
          <div className="text-xs text-muted-foreground mb-1">Location</div>
          <div className="text-xs font-medium">
            Unit {workOrder.unit?.name || "Unknown"}
          </div>
        </div>

        <p className="text-sm mt-3 line-clamp-4">
          {workOrder.description || "No description provided."}
        </p>

        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Reported by</div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-muted/20 overflow-hidden mr-1">
              {workOrder.tenant?.image ? (
                <img
                  src={workOrder.tenant.image}
                  alt={workOrder.tenant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">
                  {workOrder.tenant?.name?.charAt(0) || "T"}
                </div>
              )}
            </div>
            <div className="text-xs font-medium">
              {workOrder.tenant?.name || "Unknown Tenant"}
            </div>
          </div>
        </div>

        {renderImagePreview(workOrder.images)}
      </div>
    </div>
  );
};

// Work Order Detail Modal Component
const WorkOrderDetailModal = ({
  workOrderId,
  onClose,
}: {
  workOrderId: string;
  onClose: () => void;
}) => {
  const { getById, update, resolve } = useMaintenance();
  const { data: workOrder, isLoading } = getById(workOrderId);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await update.mutateAsync({
        id: workOrderId,
        status: newStatus,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  if (isLoading || !workOrder) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 w-full max-w-md">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">
              {workOrder.title || "Work Order Details"}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Description
                  </label>
                  <p className="text-sm">{workOrder.description}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Priority
                  </label>
                  <p className="text-sm capitalize">{workOrder.priority}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Status
                  </label>
                  <p className="text-sm capitalize">{workOrder.status}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Reported On
                  </label>
                  <p className="text-sm">
                    {new Date(workOrder.reportedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Location & Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Property
                  </label>
                  <p className="text-sm">
                    {workOrder.unit?.property?.name || "Unknown"}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Unit</label>
                  <p className="text-sm">{workOrder.unit?.name || "Unknown"}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Tenant
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                      {workOrder.tenant?.name?.charAt(0) || "T"}
                    </div>
                    <span className="text-sm">
                      {workOrder.tenant?.name || "Unknown"}
                    </span>
                  </div>
                </div>

                {workOrder.assignee && (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Assigned To
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                        {workOrder.assignee.name.charAt(0)}
                      </div>
                      <span className="text-sm">{workOrder.assignee.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {workOrder.status === "open" && (
                <>
                  <Button onClick={() => handleStatusChange("in_progress")}>
                    Assign Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("canceled")}
                  >
                    Cancel Order
                  </Button>
                </>
              )}

              {workOrder.status === "in_progress" && (
                <>
                  <Button onClick={() => handleStatusChange("completed")}>
                    Mark as Completed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("open")}
                  >
                    Move Back to Pending
                  </Button>
                </>
              )}

              {workOrder.status === "completed" && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("in_progress")}
                >
                  Reopen Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// New Work Order Modal Component
const NewWorkOrderModal = ({
  onClose,
  categories,
  propertyId,
}: {
  onClose: () => void;
  categories: any[];
  propertyId?: string;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [unitId, setUnitId] = useState("");
  const [category, setCategory] = useState("electricity");

  const { create } = useMaintenance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        title,
        description,
        priority,
        unitId,
        category,
        propertyId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create work order:", error);
    }
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
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="electricity">Electricity</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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
                <option value="unit671">Unit 671</option>
                <option value="unit588">Unit 588</option>
                <option value="unit714">Unit 714</option>
                <option value="unit202">Unit 202</option>
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
export default WorkOrdersBoard;
