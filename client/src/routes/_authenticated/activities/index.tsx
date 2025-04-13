import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/activities/")({
  component: ActivityLog,
});

function ActivityLog() {
  const { activeProperty } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Get maintenance data for activities
  const { getAll: getAllMaintenance } = useMaintenance();
  const {
    data: maintenanceData,
    isLoading,
    error,
  } = getAllMaintenance({
    propertyId: activeProperty?.id,
  });

  // Mock activity data - this would be replaced with actual API data in production
  const mockActivities =
    maintenanceData?.requests?.map((request) => {
      // Create activities based on status
      let action = "";
      let timestamp = "";

      switch (request.status) {
        case "open":
          action = "Changed status to";
          timestamp = "17 Oct";
          break;
        case "in_progress":
          action = "Changed status to";
          timestamp = "16 Oct";
          break;
        case "completed":
          action = "Changed status to";
          timestamp = "15 Oct";
          break;
        default:
          action = "Created new work order";
          timestamp = "14 Oct";
      }

      return {
        id: request.id,
        unit: {
          id: request.unit?.id || "unknown",
          name: request.unit?.name || "000",
          propertyName: request.unit?.property?.name || "Unknown Property",
        },
        category: {
          code: `${
            request.category?.substring(0, 1).toUpperCase() || "E"
          }-${Math.floor(Math.random() * 2000)}`,
          type: request.category || "Electricity",
        },
        user: {
          name: request.assignee?.name || "Aurelia James",
          role: request.assignee?.role || "Manager",
          image: request.assignee?.image || null,
        },
        action,
        status: request.status,
        timestamp: request.reportedAt
          ? new Date(request.reportedAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            })
          : timestamp,
        time: request.reportedAt
          ? new Date(request.reportedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      };
    }) || [];

  // Group activities
  const groupedActivities = {
    today: mockActivities
      .filter(
        (a) =>
          a.timestamp ===
          new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })
      )
      .slice(0, 2),
    yesterday: mockActivities.filter((a) => a.status === "open").slice(0, 1),
    lastWeek: mockActivities
      .filter((a) => ["completed", "in_progress"].includes(a.status))
      .slice(0, 4),
  };

  // Handle clearing activities
  const handleClearActivity = (activityId: string) => {
    // Implementation would remove this activity
    console.log("Clearing activity:", activityId);
  };

  // Handle clearing all activities
  const handleClearAll = () => {
    // Implementation would clear all activities
    console.log("Clearing all activities");
  };

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
        Error loading activities: {error.message}
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "open":
      case "new":
        return (
          <div className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
            New
          </div>
        );
      case "in_progress":
      case "processed":
        return (
          <div className="px-3 py-1 bg-cyan-500 text-white rounded-md text-xs font-medium">
            Processed
          </div>
        );
      case "completed":
        return (
          <div className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-medium">
            Completed
          </div>
        );
      case "urgent":
        return (
          <div className="px-3 py-1 bg-rose-500 text-white rounded-md text-xs font-medium">
            Urgent
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

  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-semibold">Activity Logs</h1>
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
            className="rounded-full bg-slate-900 text-white px-4"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Today's Activities */}
      <div className="py-2 px-4 bg-muted/10">
        <h2 className="text-sm font-medium">Today</h2>
      </div>

      {groupedActivities.today.map((activity, index) => (
        <ActivityRow
          key={`today-${index}`}
          activity={activity}
          onClear={() => handleClearActivity(activity.id)}
        />
      ))}

      {/* Yesterday's Activities */}
      <div className="py-2 px-4 bg-muted/10">
        <h2 className="text-sm font-medium">Yesterday</h2>
      </div>

      {groupedActivities.yesterday.map((activity, index) => (
        <ActivityRow
          key={`yesterday-${index}`}
          activity={activity}
          onClear={() => handleClearActivity(activity.id)}
        />
      ))}

      {/* Last Week's Activities */}
      <div className="py-2 px-4 bg-muted/10">
        <h2 className="text-sm font-medium">Last week</h2>
      </div>

      {groupedActivities.lastWeek.map((activity, index) => (
        <ActivityRow
          key={`lastweek-${index}`}
          activity={activity}
          onClear={() => handleClearActivity(activity.id)}
          renderStatusBadge={renderStatusBadge}
        />
      ))}
    </div>
  );
}

// Activity Row Component
const ActivityRow = ({
  activity,
  onClear,
  renderStatusBadge = (status: string) => null,
}: {
  activity: any;
  onClear: () => void;
  renderStatusBadge?: (status: string) => React.ReactNode;
}) => {
  return (
    <div className="flex items-center py-4 px-4 border-b hover:bg-muted/5 transition-colors">
      <div className="w-5 h-5 flex-shrink-0 mr-3">•</div>

      <div className="flex flex-shrink-0 mr-4">
        <div className="w-8 h-8 rounded bg-muted/20 overflow-hidden mr-1">
          {activity.unit.image ? (
            <img
              src={activity.unit.image}
              alt={`Unit ${activity.unit.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              {activity.unit.name.substring(0, 1)}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-medium">Unit {activity.unit.name}</div>
          <div className="text-xs text-muted-foreground">
            {activity.unit.propertyName}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-20 mr-4">
        <div className="text-sm">{activity.category.code}</div>
        <div className="text-xs text-muted-foreground">
          {activity.category.type}
        </div>
      </div>

      <div className="flex-shrink-0 w-32 mr-4">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-muted/20 overflow-hidden mr-1">
            {activity.user.image ? (
              <img
                src={activity.user.image}
                alt={activity.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {activity.user.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm">{activity.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {activity.user.role}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center">
        <div className="mr-2 text-sm">{activity.action}</div>
        {renderStatusBadge(activity.status)}
      </div>

      <div className="flex-shrink-0 text-right text-sm mr-4">
        {activity.timestamp}
        {activity.time && (
          <div className="text-xs text-muted-foreground">{activity.time}</div>
        )}
      </div>

      <Button
        variant="ghost"
        className="flex-shrink-0 h-8 px-3 rounded-full border"
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
};

export default ActivityLog;
