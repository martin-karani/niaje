import { Button } from "@/components/ui/button";
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

// Mock data for work orders
const MOCK_WORK_ORDERS = [
  {
    id: "E-1935",
    type: "Electricity",
    priority: "high",
    location: "Unit 671",
    description:
      "The lights in the hallway leading to my apartment are not working properly. It has become quite dark and inconvenient to navigate through the area at night.",
    reportedBy: {
      id: "aurelia-james",
      name: "Aurelia James",
      image: null,
    },
    images: ["/path/to/image1.jpg", "/path/to/image2.jpg"],
    status: "pending",
    createdAt: "2023-12-22T10:00:00Z",
  },
  {
    id: "H-933",
    type: "HVAC",
    priority: "normal",
    location: "Unit 598",
    description:
      "There is a persistent mold issue in the bathroom ceiling due to poor ventilation. It would be highly appreciated if the maintenance team could address this issue as soon as possible.",
    reportedBy: {
      id: "amanda-taylor",
      name: "Amanda Taylor",
      image: null,
    },
    images: [
      "/path/to/image3.jpg",
      "/path/to/image4.jpg",
      "/path/to/image5.jpg",
    ],
    status: "assigned",
    assignedTo: {
      id: "ricardo-emmerson",
      name: "Ricardo Emmerson",
      image: null,
    },
  },
  {
    id: "H-482",
    type: "HVAC",
    priority: "normal",
    location: "Unit 1073",
    description:
      "The air conditioning unit in my apartment is not cooling properly. Despite adjusting the temperature settings, the air coming out is not as cold as it should be.",
    reportedBy: {
      id: "sasha-turner",
      name: "Sasha Turner",
      image: null,
    },
    status: "in-progress",
  },
  {
    id: "E-1935",
    type: "Electricity",
    priority: "normal",
    location: "Unit 202",
    description:
      "The bedroom door seems to be sticking and difficult to open and close.",
    reportedBy: {
      id: "hugh-manship",
      name: "Hugh Manship",
      image: null,
    },
    status: "pending",
  },
  {
    id: "H-452",
    type: "HVAC",
    priority: "high",
    location: "Unit 714",
    description:
      "The light fixture in the living room has stopped working despite changing the bulb. Requesting a maintenance technician to inspect and potentially replace the fixture.",
    reportedBy: {
      id: "hugh-manship",
      name: "Hugh Manship",
      image: null,
    },
    status: "assigned",
    assignedTo: {
      id: "alistair-dunlap",
      name: "Alistair Dunlap",
      image: null,
    },
  },
];

function WorkOrders() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Filter work orders based on the active tab
  const filteredOrders = MOCK_WORK_ORDERS.filter((order) => {
    if (activeTab === "pending") return order.status === "pending";
    if (activeTab === "assigned") return order.status === "assigned";
    if (activeTab === "in-progress") return order.status === "in-progress";
    return true; // "all" tab
  });

  // Handler for when a work order is clicked
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

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
              {["pending", "assigned", "in-progress", "completed"].map(
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
                    : "There are no completed work orders at the moment."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Work Order Details */}
        <div className="hidden lg:block w-1/3 border-l pl-4">
          {selectedOrder ? (
            <WorkOrderDetail order={selectedOrder} />
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
            <WorkOrderDetail order={selectedOrder} />
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
          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-sm mb-1">Location</h3>
        <p className="text-sm">{order.location}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm line-clamp-2">{order.description}</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
            {order.reportedBy.name.charAt(0)}
          </div>
          <span className="text-xs text-muted-foreground">
            Reported by {order.reportedBy.name}
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
const WorkOrderDetail = ({ order }) => {
  const [status, setStatus] = useState(order.status);

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
            {getStatusLabel(status)}
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
              {order.reportedBy.name.charAt(0)}
            </div>
            <span>{order.reportedBy.name}</span>
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
        {(status === "pending" || !status) && (
          <>
            <Button className="w-full">Assign Technician</Button>
            <Button variant="outline" className="w-full">
              Schedule for Later
            </Button>
          </>
        )}

        {status === "assigned" && (
          <>
            <Button className="w-full" onClick={() => setStatus("in-progress")}>
              Mark In Progress
            </Button>
            <Button variant="outline" className="w-full">
              Reassign
            </Button>
          </>
        )}

        {status === "in-progress" && (
          <>
            <Button className="w-full" onClick={() => setStatus("completed")}>
              Mark as Complete
            </Button>
            <Button variant="outline" className="w-full">
              Request Materials
            </Button>
          </>
        )}

        {status === "completed" && (
          <>
            <Button variant="outline" className="w-full">
              View Report
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground">
              Reopen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkOrders;
