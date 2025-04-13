import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUnits } from "@/hooks/use-units";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building,
  Download,
  Filter,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
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
  const { activeProperty } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Use the units hook
  const units = useUnits();

  // Fetch units for the active property
  const { data: unitsData, isLoading: unitsLoading } = units.getAll(
    activeProperty ? { propertyId: activeProperty.id } : undefined
  );

  // Fetch stats for the active property
  const { data: statsData, isLoading: statsLoading } = units.getStats(
    activeProperty?.id
  );

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

  if (unitsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allUnits = unitsData?.units || [];

  // Filter units based on search term and filter
  const filteredUnits = allUnits.filter((unit) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.type?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesFilter =
      !statusFilter ||
      (statusFilter === "leased" && unit.status === "occupied") ||
      (statusFilter === "vacant" && unit.status === "vacant") ||
      (statusFilter === "upcoming" && unit.status === "reserved");

    return matchesSearch && matchesFilter;
  });

  // Use stats from the hook
  const stats = statsData || {
    totalUnits: 0,
    vacantUnits: 0,
    occupiedUnits: 0,
    reservedUnits: 0,
    maintenanceUnits: 0,
    unavailableUnits: 0,
    occupancyRate: 0,
    averageRent: 0,
  };

  // Calculate additional stats
  const upcomingPercentage =
    stats.totalUnits > 0 ? (stats.reservedUnits / stats.totalUnits) * 100 : 0;

  // Handler for adding a new unit
  const handleAddUnit = () => {
    // Navigate to add unit form or open modal
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-card border rounded-lg p-6">
        <div className="grid grid-cols-4 gap-4">
          <StatItem label="Occupied" value={stats.occupiedUnits} />
          <StatItem label="Units" value={stats.totalUnits} />
          <StatItem label="Vacant" value={stats.vacantUnits} />
          <StatItem label="Upcoming" value={stats.reservedUnits} />

          <div className="col-span-4 mt-2">
            <div className="flex items-center text-sm">
              <span className="mr-2">
                Occupied {stats.occupancyRate?.toFixed(1)}%
              </span>
              <span className="ml-auto">
                {upcomingPercentage.toFixed(1)}% Upcoming
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${stats.occupancyRate}%` }}
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
          <Button onClick={handleAddUnit}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Property header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{activeProperty.name}</h2>
          <span className="text-sm text-muted-foreground">
            {stats.totalUnits} Units
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
          <Button className="mt-4" onClick={handleAddUnit}>
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
  // Map status from API to UI status
  const mapStatus = (status) => {
    switch (status) {
      case "occupied":
        return "leased";
      case "vacant":
        return "vacant";
      case "reserved":
        return "upcoming";
      default:
        return status;
    }
  };

  const uiStatus = mapStatus(unit.status);

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

  // Extract data from the unit object
  const {
    name: unitNumber = "",
    type: location = "",
    bedrooms = 0,
    rent: rentAmount = 0,
    size: area = 0,
    activeLeases = [],
  } = unit;

  // Get tenant info from active lease if available
  const activeLease =
    activeLeases && activeLeases.length > 0 ? activeLeases[0] : null;
  const tenant = activeLease
    ? {
        name: activeLease.tenantName || "Tenant",
        image: null,
      }
    : null;

  return (
    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer">
      <div className="relative">
        {getStatusBadge(uiStatus)}
        <div className="h-48 bg-muted">
          <img
            src={unit.images?.[0] || "/api/placeholder/800/600"}
            alt={`Unit ${unitNumber}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-3 right-3 bg-white/90 rounded-md px-3 py-1">
          <div className="text-sm font-medium">Unit {unitNumber}</div>
          <div className="text-xs text-muted-foreground">
            {bedrooms} bedroom{bedrooms !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm">{location}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expiry</div>
            <div className="text-sm">
              {activeLease?.endDate
                ? new Date(activeLease.endDate).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Area</div>
            <div className="text-sm">{area} sqft</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-sm">${rentAmount?.toLocaleString()}/m</div>
          </div>
        </div>

        {uiStatus !== "vacant" && tenant && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Leased by</div>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={tenant.image || ""} alt={tenant.name} />
                <AvatarFallback>{tenant.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{tenant.name}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Units;
