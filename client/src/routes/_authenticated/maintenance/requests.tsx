import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import { CirclePlus, Filter, Plus, Search, User, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/maintenance/requests")({
  component: MaintenanceRequests,
});

function MaintenanceRequests() {
  const { user, activeProperty } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Fetch maintenance requests using the hook
  const {
    getAll,
    create: createRequest,
    update: updateRequest,
  } = useMaintenance();

  // Fetch requests
  const {
    data: maintenanceData,
    isLoading,
    error,
  } = getAll({
    propertyId: activeProperty?.id,
  });

  // Handle request creation
  const handleCreateRequest = async (requestData: any) => {
    try {
      await createRequest.mutateAsync({
        ...requestData,
        propertyId: activeProperty?.id,
      });
      setShowNewRequestModal(false);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  // Handle pushing a request to the queue (creating a work order)
  const handlePushToQueue = async () => {
    if (!selectedRequest) return;
    try {
      await updateRequest.mutateAsync({
        id: selectedRequest.id,
        status: "processed",
      });
      setSelectedRequest(null);
    } catch (error) {
      console.error("Failed to push request to queue:", error);
    }
  };

  // Handle declining a request
  const handleDecline = async () => {
    if (!selectedRequest) return;
    try {
      await updateRequest.mutateAsync({
        id: selectedRequest.id,
        status: "declined",
      });
      setSelectedRequest(null);
    } catch (error) {
      console.error("Failed to decline request:", error);
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
    <div className="flex h-screen overflow-hidden">
      {/* Requests List */}
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-semibold">Requests</h1>
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
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex px-4 py-2 text-muted-foreground text-sm font-medium border-b">
          <div className="w-36">Requested by</div>
          <div className="w-36">Date created</div>
          <div className="flex-1">Description</div>
          <div className="w-24 text-right">Status</div>
        </div>

        <div className="flex-1 overflow-auto">
          {requests.length > 0 ? (
            requests.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                isSelected={selectedRequest?.id === request.id}
                onClick={() => setSelectedRequest(request)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <CirclePlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No requests found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search or filters."
                  : "There are no maintenance requests yet."}
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowNewRequestModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Request Detail */}
      <div className="w-1/3 flex flex-col overflow-hidden bg-muted/10">
        {selectedRequest ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold">Request</h2>
                <div className="ml-2 px-3 py-1 rounded-md bg-green-500 text-white text-sm">
                  New
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground border rounded-md px-3"
                onClick={() => setSelectedRequest(null)}
              >
                Close <X className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 border-b text-sm text-muted-foreground">
              <p>January 22, 2023</p>
              <p>10:00 AM</p>
            </div>

            <div className="p-4 border-b">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-muted/20 mr-2 overflow-hidden">
                  {selectedRequest.tenant?.image ? (
                    <img
                      src={selectedRequest.tenant.image}
                      alt={selectedRequest.tenant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedRequest.tenant?.name || "Unknown Tenant"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unit {selectedRequest.unit?.name || "Unknown"}
                  </p>
                </div>
              </div>

              <p className="mb-4">{selectedRequest.description}</p>
            </div>

            {/* Evidence section with images */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Evidence
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {selectedRequest.images && selectedRequest.images.length > 0
                  ? selectedRequest.images.map((img: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-square bg-muted/20 rounded-md overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  : Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-muted/20 rounded-md"
                        />
                      ))}
              </div>
            </div>

            <div className="mt-auto p-4 space-y-3">
              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                onClick={handlePushToQueue}
              >
                Push to queue
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDecline}
              >
                Decline
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-muted-foreground">
              Select a request to view details
            </p>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSubmit={handleCreateRequest}
        />
      )}
    </div>
  );
}

// Request Item Component
const RequestItem = ({ request, isSelected, onClick }: any) => {
  // Format date to match the design
  const formatDate = (date: string) => {
    const d = new Date(date);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month = monthNames[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return {
      date: `${month} ${day}`,
      time: `${formattedHours}:${minutes} ${ampm}`,
    };
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return (
          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
            New
          </div>
        );
      case "processed":
        return (
          <div className="px-3 py-1 bg-cyan-500 text-white rounded-md text-xs font-medium">
            Processed
          </div>
        );
      case "declined":
        return (
          <div className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-medium">
            Declined
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
            New
          </div>
        );
    }
  };

  const formattedDate = formatDate(request.reportedAt || request.createdAt);

  // Truncate description
  const truncateDescription = (text: string, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <div
      className={`flex px-4 py-4 hover:bg-muted/10 cursor-pointer border-b transition-colors ${
        isSelected ? "bg-muted/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="w-36 flex items-center">
        <div className="w-8 h-8 rounded-full bg-muted/20 mr-2 overflow-hidden">
          {request.tenant?.image ? (
            <img
              src={request.tenant.image}
              alt={request.tenant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {request.tenant?.name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            Unit {request.unit?.name || "Unknown"}
          </p>
        </div>
      </div>

      <div className="w-36">
        <p className="text-sm">{formattedDate.date}</p>
        <p className="text-xs text-muted-foreground">{formattedDate.time}</p>
      </div>

      <div className="flex-1 text-sm">
        {truncateDescription(request.description)}
      </div>

      <div className="w-24 flex justify-end">
        {getStatusBadge(request.status)}
      </div>
    </div>
  );
};

// New Request Modal Component
const NewRequestModal = ({ onClose, onSubmit }: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [unitId, setUnitId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      unitId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Create New Maintenance Request
          </h2>
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
                <option value="urgent">Urgent</option>
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
                <option value="unit1">Unit 101</option>
                <option value="unit2">Unit 102</option>
                <option value="unit3">Unit 103</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Request</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default MaintenanceRequests;
