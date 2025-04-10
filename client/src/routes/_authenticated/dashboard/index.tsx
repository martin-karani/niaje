// src/routes/_authenticated/dashboard/index.tsx
import { trpc } from "@/api/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
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

  // Mock data for dashboard stats
  const dashboardStats = {
    totalProperties: propertiesData?.length || 0,
    totalTenants: 37,
    occupancyRate: 87,
    pendingRequests: 23,
    overdueMaintenance: 14,
    totalRevenue: "$223,600",
    expensesThisMonth: "$83,840",
  };

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      type: "new_tenant",
      description: "Leslie Alexander signed a lease for Unit 1073",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "maintenance",
      description: "Bathroom vent repair completed by Ricardo Emmerson",
      time: "Yesterday",
    },
    {
      id: 3,
      type: "payment",
      description: "Rent payment of $1,650 received from Michael Brown",
      time: "2 days ago",
    },
    {
      id: 4,
      type: "lease",
      description: "Lease renewal reminder sent to Jennifer White",
      time: "3 days ago",
    },
  ];

  // Upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Property Viewing",
      property: "Crown Tower, Unit 402",
      date: "Today, 3:00 PM",
    },
    {
      id: 2,
      title: "Lease Signing",
      property: "Sobha Garden, Unit 202",
      date: "Tomorrow, 11:00 AM",
    },
    {
      id: 3,
      title: "Maintenance Visit",
      property: "Sobha Garden, Unit 201",
      date: "Jun 18, 9:30 AM",
    },
  ];

  // Get role-specific greeting
  const getRoleBasedGreeting = () => {
    switch (user?.role) {
      case "landlord":
        return "Track your properties, income, and tenant activity from one central dashboard.";
      case "caretaker":
        return "Monitor maintenance requests, tenant needs, and property status.";
      case "agent":
        return "Manage listings, tenant applications, and lease agreements all in one place.";
      default:
        return "Welcome to your property management dashboard.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">{getRoleBasedGreeting()}</p>
        </div>
        <Button variant="outline" className="self-start">
          <CalendarDays className="w-4 h-4 mr-2" />
          June 16, 2025
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Properties
            </CardTitle>
            <Building className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalProperties}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {dashboardStats.occupancyRate}% occupancy rate
            </div>
            {user?.role === "landlord" && (
              <div className="mt-4">
                <Link
                  to="/properties"
                  className="text-xs text-primary flex items-center"
                >
                  View all properties
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tenants
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalTenants}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              4 new in the last month
            </div>
            <div className="mt-4">
              <Link
                to="/tenants"
                className="text-xs text-primary flex items-center"
              >
                View all tenants
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance
            </CardTitle>
            <Wrench className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.pendingRequests}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {dashboardStats.overdueMaintenance} need immediate attention
            </div>
            <div className="mt-4">
              <Link
                to="/maintenance"
                className="text-xs text-primary flex items-center"
              >
                View requests
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalRevenue}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {dashboardStats.expensesThisMonth} in expenses
            </div>
            {(user?.role === "landlord" || user?.role === "caretaker") && (
              <div className="mt-4">
                <Link
                  to="/finances"
                  className="text-xs text-primary flex items-center"
                >
                  View finances
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Progress Bar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">
              Occupancy Overview
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Currently at {dashboardStats.occupancyRate}% occupancy rate
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2.5 mb-2">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${dashboardStats.occupancyRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <div>Total units: 1,810</div>
            <div>Occupied: 1,576</div>
            <div>Vacant: 234</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-muted rounded-full p-1.5">
                    {activity.type === "new_tenant" ? (
                      <Users className="h-4 w-4 text-blue-500" />
                    ) : activity.type === "maintenance" ? (
                      <Wrench className="h-4 w-4 text-amber-500" />
                    ) : activity.type === "payment" ? (
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View calendar <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.property}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {event.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards - Role-specific */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === "landlord" && (
          <>
            <ActionCard
              title="Add Property"
              description="List a new property in your portfolio"
              icon={<Building className="h-5 w-5" />}
              link="/properties"
            />
            <ActionCard
              title="Financial Reports"
              description="View income and expense reports"
              icon={<PieChart className="h-5 w-5" />}
              link="/reports"
            />
          </>
        )}

        {user?.role === "agent" && (
          <ActionCard
            title="Add Tenant"
            description="Register a new tenant for a property"
            icon={<Users className="h-5 w-5" />}
            link="/tenants"
          />
        )}

        <ActionCard
          title="Create Maintenance Request"
          description="Create a new maintenance ticket"
          icon={<Wrench className="h-5 w-5" />}
          link="/maintenance"
        />

        <ActionCard
          title="View Calendar"
          description="Schedule appointments and events"
          icon={<CalendarDays className="h-5 w-5" />}
          link="/calendar"
        />
      </div>
    </div>
  );
}

// Helper component for action cards
function ActionCard({ title, description, icon, link }) {
  return (
    <Link to={link}>
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default Dashboard;
