import { trpc } from "@/api/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building,
  CalendarDays,
  Clock,
  PieChart,
  Users,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: propertiesData, isLoading: propertiesLoading } =
    trpc.properties.getAll.useQuery();

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <CalendarDays className="w-4 h-4 mr-2" />
            This Month
          </Button>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PropertyCard
          title="Properties"
          value={propertiesData?.length || 0}
          icon={<Building className="w-8 h-8 text-primary" />}
        />
        <PropertyCard
          title="Tenants"
          value={1810}
          icon={<Users className="w-8 h-8 text-primary" />}
        />
        <PropertyCard
          title="Work Orders"
          value={64}
          icon={<Wrench className="w-8 h-8 text-primary" />}
        />
        <PropertyCard
          title="Notifications"
          value={12}
          icon={<AlertTriangle className="w-8 h-8 text-primary" />}
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinancialCard title="Rent" value="$223,600" />
        <FinancialCard title="Additional Services" value="$24,840" />
        <FinancialCard title="Maintenance" value="$31,840" />
        <FinancialCard title="Debt" value="$16,485" status="overdue" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Recent Properties</h2>
          </div>
          <div className="p-4">
            {propertiesData && propertiesData.length > 0 ? (
              <div className="space-y-4">
                {propertiesData.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{property.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No properties found. Add your first property to get started.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Recent Activities</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <ActivityItem
                title="New tenant registered"
                time="2 hours ago"
                icon={<Users className="w-5 h-5" />}
              />
              <ActivityItem
                title="Maintenance request resolved"
                time="Yesterday"
                icon={<Wrench className="w-5 h-5" />}
              />
              <ActivityItem
                title="Rent payment received"
                time="2 days ago"
                icon={<PieChart className="w-5 h-5" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium">Pending Tasks</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <TaskItem
                title="Review maintenance request"
                description="Unit 104 - Water leak in bathroom"
                priority="high"
              />
              <TaskItem
                title="Approve new tenant application"
                description="Unit 203 - John Smith"
                priority="medium"
              />
              <TaskItem
                title="Schedule property inspection"
                description="Sobha Garden - Annual inspection due"
                priority="normal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const PropertyCard = ({ title, value, icon }) => (
  <div className="bg-card rounded-lg border shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

const FinancialCard = ({ title, value, status }) => (
  <div className="bg-card rounded-lg border shadow-sm p-6">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p
      className={`text-2xl font-bold mt-1 ${
        status === "overdue" ? "text-destructive" : ""
      }`}
    >
      {value}
      {status === "overdue" && (
        <span className="ml-2 text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full">
          Overdue
        </span>
      )}
    </p>
  </div>
);

const ActivityItem = ({ title, time, icon }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-0.5 bg-muted rounded-full p-2">{icon}</div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {time}
      </p>
    </div>
  </div>
);

const TaskItem = ({ title, description, priority }) => {
  const priorityStyles = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-amber-100 text-amber-700",
    normal: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="flex items-start space-x-3 p-3 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`px-2 py-1 text-xs rounded-full ${priorityStyles[priority]}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </div>
    </div>
  );
};

export default Dashboard;
