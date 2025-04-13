import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useActivities } from "@/hooks/use-activities";
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

  // Get activities data from our hook
  const { getAll, clearActivity, clearAllActivities } = useActivities();
  const { data: activitiesData, isLoading, error } = getAll();

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

  // Filter activities based on search term
  const filterActivities = (activities: any[]) => {
    if (!searchTerm) return activities;
    return activities.filter(
      (activity) =>
        activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.unit?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle clearing a specific activity
  const handleClearActivity = (activityId: string) => {
    clearActivity.mutate({ activityId });
  };

  // Handle clearing all activities
  const handleClearAll = () => {
    clearAllActivities.mutate();
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

  // Organize activities by timestamp (today, yesterday, lastWeek)
  const groupedActivities = activitiesData || {};

  // Apply search filter to all groups
  const filteredGroups = {
    today: filterActivities(groupedActivities.today || []),
    yesterday: filterActivities(groupedActivities.yesterday || []),
    lastWeek: filterActivities(groupedActivities.lastWeek || []),
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
            disabled={clearAllActivities.isPending}
          >
            {clearAllActivities.isPending ? "Clearing..." : "Clear all"}
          </Button>
        </div>
      </div>

      {/* Today's Activities */}
      {filteredGroups.today.length > 0 && (
        <>
          <div className="py-2 px-4 bg-muted/10">
            <h2 className="text-sm font-medium">Today</h2>
          </div>

          {filteredGroups.today.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onClear={() => handleClearActivity(activity.id)}
              isPending={clearActivity.isPending}
              renderStatusBadge={renderStatusBadge}
            />
          ))}
        </>
      )}

      {/* Yesterday's Activities */}
      {filteredGroups.yesterday.length > 0 && (
        <>
          <div className="py-2 px-4 bg-muted/10">
            <h2 className="text-sm font-medium">Yesterday</h2>
          </div>

          {filteredGroups.yesterday.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onClear={() => handleClearActivity(activity.id)}
              isPending={clearActivity.isPending}
              renderStatusBadge={renderStatusBadge}
            />
          ))}
        </>
      )}

      {/* Last Week's Activities */}
      {filteredGroups.lastWeek.length > 0 && (
        <>
          <div className="py-2 px-4 bg-muted/10">
            <h2 className="text-sm font-medium">Last week</h2>
          </div>

          {filteredGroups.lastWeek.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onClear={() => handleClearActivity(activity.id)}
              isPending={clearActivity.isPending}
              renderStatusBadge={renderStatusBadge}
            />
          ))}
        </>
      )}

      {/* Show empty state if no activities */}
      {!filteredGroups.today.length &&
        !filteredGroups.yesterday.length &&
        !filteredGroups.lastWeek.length && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg text-muted-foreground">No activities found</p>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        )}
    </div>
  );
}

// Activity Row Component
const ActivityRow = ({
  activity,
  onClear,
  isPending,
  renderStatusBadge = (status: string) => null,
}: {
  activity: any;
  onClear: () => void;
  isPending: boolean;
  renderStatusBadge?: (status: string) => React.ReactNode;
}) => {
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center py-4 px-4 border-b hover:bg-muted/5 transition-colors">
      <div className="w-5 h-5 flex-shrink-0 mr-3">•</div>

      {/* Unit information */}
      <div className="flex flex-shrink-0 mr-4">
        <div className="w-8 h-8 rounded bg-muted/20 overflow-hidden mr-1">
          {activity.unit?.image ? (
            <img
              src={activity.unit.image}
              alt={`Unit ${activity.unit.name || "Unknown"}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              {activity.unit?.name?.substring(0, 1) || "U"}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            Unit {activity.unit?.name || "Unknown"}
          </div>
          <div className="text-xs text-muted-foreground">
            {activity.unit?.property?.name || "Unknown Property"}
          </div>
        </div>
      </div>

      {/* Activity category */}
      <div className="flex-shrink-0 w-20 mr-4">
        <div className="text-sm">{activity.entityType || "Activity"}</div>
        <div className="text-xs text-muted-foreground">
          {activity.entityId?.substring(0, 6) || "Unknown"}
        </div>
      </div>

      {/* User information */}
      <div className="flex-shrink-0 w-32 mr-4">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-muted/20 overflow-hidden mr-1">
            {activity.user?.image ? (
              <img
                src={activity.user.image}
                alt={activity.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {activity.user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm">
              {activity.user?.name || "Unknown User"}
            </div>
            <div className="text-xs text-muted-foreground">
              {activity.user?.role || "User"}
            </div>
          </div>
        </div>
      </div>

      {/* Activity description and status */}
      <div className="flex-1 flex items-center">
        <div className="mr-2 text-sm">
          {activity.action || "Unknown action"}
        </div>
        {activity.newStatus && renderStatusBadge(activity.newStatus)}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right text-sm mr-4">
        {new Date(activity.createdAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        })}
        <div className="text-xs text-muted-foreground">
          {formatTime(activity.createdAt)}
        </div>
      </div>

      {/* Clear button */}
      <Button
        variant="ghost"
        className="flex-shrink-0 h-8 px-3 rounded-full border"
        onClick={onClear}
        disabled={isPending}
      >
        {isPending ? "Clearing..." : "Clear"}
      </Button>
    </div>
  );
};

export default ActivityLog;
