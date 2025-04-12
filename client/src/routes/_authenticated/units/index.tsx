import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useProperties } from "@/hooks/use-trpc";
import { createFileRoute } from "@tanstack/react-router";
import { Building, Download, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/units/")({
  loader: () => {
    return {
      crumb: [
        {
          label: "Dashboard",
          path: "/dashboard",
          hideOnMobile: true,
        },
        {
          label: "Units",
          path: "/units",
          hideOnMobile: false,
        },
      ],
    };
  },
  component: Units,
});

function Units() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Get properties and their units using the tRPC hooks
  const { getAll: getProperties, isLoading: propertiesLoading } =
    useProperties();
  const { data: properties = [] } = getProperties();

  // We'll need to choose which property to display
  const [activePropertyId, setActivePropertyId] = useState<string | null>(
    properties && properties.length > 0 ? properties[0]?.id : null
  );

  // We're assuming each property has units data embedded
  // If not, there would be another API call to get units by propertyId
  const activeProperty =
    properties.find((prop) => prop.id === activePropertyId) || properties[0];

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!activeProperty) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Building className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No properties found</h3>
        <p className="text-muted-foreground">Add a property to manage units</p>
        <Button className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>
    );
  }

  // Filter units based on search term and filter
  const filteredUnits = (activeProperty.units || []).filter((unit) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      unit.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesFilter =
      !statusFilter ||
      (statusFilter === "leased" && unit.status === "leased") ||
      (statusFilter === "vacant" && unit.status === "vacant") ||
      (statusFilter === "upcoming" && unit.status === "upcoming");

    return matchesSearch && matchesFilter;
  });

  // Calculate property statistics
  const stats = {
    residents: activeProperty.stats?.totalResidents || 0,
    totalUnits: activeProperty.units?.length || 0,
    vacant:
      activeProperty.units?.filter((u) => u.status === "vacant").length || 0,
    upcoming:
      activeProperty.units?.filter((u) => u.status === "upcoming").length || 0,
    leased:
      activeProperty.units?.filter((u) => u.status === "leased").length || 0,
    leasedPercentage: activeProperty.stats?.occupancyRate || 0,
    upcomingPercentage: activeProperty.stats?.upcomingPercentage || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-card border rounded-lg p-6">
        <div className="grid grid-cols-4 gap-4">
          <StatItem label="Residents" value={stats.residents} />
          <StatItem label="Units" value={stats.totalUnits} />
          <StatItem label="Vacant" value={stats.vacant} />
          <StatItem label="Upcoming" value={stats.upcoming} />

          <div className="col-span-4 mt-2">
            <div className="flex items-center text-sm">
              <span className="mr-2">Leased by {stats.leasedPercentage}%</span>
              <span className="ml-auto">
                {stats.upcomingPercentage}% Upcoming
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${stats.leasedPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search units..."
            className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "leased" ? "default" : "outline"}
            onClick={() =>
              setStatusFilter(statusFilter === "leased" ? null : "leased")
            }
            className={statusFilter === "leased" ? "bg-green-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Leased
          </Button>
          <Button
            variant={statusFilter === "vacant" ? "default" : "outline"}
            onClick={() =>
              setStatusFilter(statusFilter === "vacant" ? null : "vacant")
            }
            className={statusFilter === "vacant" ? "bg-rose-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Vacant
          </Button>
          <Button
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            onClick={() =>
              setStatusFilter(statusFilter === "upcoming" ? null : "upcoming")
            }
            className={statusFilter === "upcoming" ? "bg-amber-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Upcoming
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Property selector (if multiple properties) */}
      {properties.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {properties.map((property) => (
            <Button
              key={property.id}
              variant={property.id === activePropertyId ? "default" : "outline"}
              onClick={() => setActivePropertyId(property.id)}
              className="whitespace-nowrap"
            >
              {property.name}
            </Button>
          ))}
        </div>
      )}

      {/* Property header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{activeProperty.name}</h2>
          <span className="text-sm text-muted-foreground">
            {activeProperty.units?.length || 0} Units
          </span>
        </div>
      </div>

      {/* Units grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnits.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>

      {/* Empty state */}
      {filteredUnits.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <Building className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No units found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter
              ? "Try adjusting your search or filters"
              : "No units have been added yet"}
          </p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>
      )}
    </div>
  );
}

// Stat Item Component
const StatItem = ({ label, value }) => (
  <div className="text-center">
    <div className="text-3xl font-bold">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);

// Unit Card Component
const UnitCard = ({ unit }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "leased":
        return (
          <Badge className="absolute top-3 left-3 bg-green-500">Leased</Badge>
        );
      case "upcoming":
        return (
          <Badge className="absolute top-3 left-3 bg-amber-500">Upcoming</Badge>
        );
      case "vacant":
        return (
          <Badge className="absolute top-3 left-3 bg-rose-500">Vacant</Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer">
      <div className="relative">
        {getStatusBadge(unit.status)}
        <div className="h-48 bg-muted">
          <img
            src={unit.image || "/api/placeholder/800/600"}
            alt={`Unit ${unit.unitNumber}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-3 right-3 bg-white/90 rounded-md px-3 py-1">
          <div className="text-sm font-medium">Unit {unit.unitNumber}</div>
          <div className="text-xs text-muted-foreground">
            {unit.bedrooms} bedroom{unit.bedrooms !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm">{unit.location}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expiry</div>
            <div className="text-sm">
              {unit.lease?.endDate
                ? new Date(unit.lease.endDate).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Area</div>
            <div className="text-sm">{unit.area}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-sm">
              ${unit.rentAmount?.toLocaleString()}/m
            </div>
          </div>
        </div>

        {unit.status !== "vacant" && unit.tenant && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Leased by</div>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage
                  src={unit.tenant.image || ""}
                  alt={unit.tenant.name}
                />
                <AvatarFallback>
                  {unit.tenant.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{unit.tenant.name}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Units;
