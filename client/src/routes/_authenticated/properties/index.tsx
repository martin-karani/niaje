// src/routes/_authenticated/properties/index.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeases } from "@/hooks/use-leases";
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { Property } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpDown,
  Building,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Edit,
  Eye,
  Grid,
  Home,
  List,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/properties/")({
  loader: async () => ({
    crumb: [
      {
        label: "Properties",
        path: "/properties",
        hideOnMobile: false,
      },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { properties, activeProperty, setActiveProperty, isLoading, error } =
    useProperties();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter properties based on search term
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.address &&
        property.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle sorting for table view
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort properties for table view
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // Handle different field types
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "address":
        comparison = (a.address || "").localeCompare(b.address || "");
        break;
      case "units":
        comparison = (a.units?.length || 0) - (b.units?.length || 0);
        break;
      case "occupancy":
        comparison =
          (a.stats?.occupancyRate || 0) - (b.stats?.occupancyRate || 0);
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    // Reverse for descending
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Handle setting active property
  const handleSetActive = (property: Property) => {
    setActiveProperty(property);
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
      <div className="text-center text-red-500 p-4">
        Error loading properties: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Switcher */}
          <div className="bg-muted rounded-md p-1 flex">
            <Button
              variant={viewType === "grid" ? "default" : "ghost"}
              size="sm"
              className="px-2 h-8"
              onClick={() => setViewType("grid")}
            >
              <Grid className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewType === "table" ? "default" : "ghost"}
              size="sm"
              className="px-2 h-8"
              onClick={() => setViewType("table")}
            >
              <List className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>

          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Active property highlight */}
      {activeProperty && (
        <div className="border rounded-lg p-4 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{activeProperty.name}</h2>
                <p className="text-muted-foreground">
                  {activeProperty.address}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <PropertyStat
              title="Residents"
              value="1810"
              icon={<Users className="h-4 w-4" />}
            />
            <PropertyStat
              title="Units"
              value="1032"
              icon={<Home className="h-4 w-4" />}
            />
            <PropertyStat
              title="Vacant"
              value="134"
              icon={<Building className="h-4 w-4" />}
            />
            <PropertyStat
              title="Upcoming"
              value="73"
              icon={<Clock className="h-4 w-4" />}
            />
            <PropertyStat
              title="Leased"
              value="87%"
              icon={<CheckCircle className="h-4 w-4" />}
            />
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isActive={activeProperty?.id === property.id}
              onSetActive={handleSetActive}
            />
          ))}
        </div>
      ) : (
        // Table View
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Property
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("address")}
                >
                  <div className="flex items-center">
                    Address
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("units")}
                >
                  <div className="flex items-center">
                    Units
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("occupancy")}
                >
                  <div className="flex items-center">
                    Occupancy
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Residents</TableHead>
                <TableHead>Upcoming</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.length > 0 ? (
                sortedProperties.map((property) => {
                  const isActive = activeProperty?.id === property.id;
                  return (
                    <TableRow
                      key={property.id}
                      className={
                        isActive
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : ""
                      }
                    >
                      <TableCell>
                        {isActive ? (
                          <div className="bg-primary/20 p-1 rounded-full">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSetActive(property)}
                          >
                            <Building className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {property.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {property.address || "No address"}
                      </TableCell>
                      <TableCell>
                        {property.units?.length ||
                          property.stats?.totalUnits ||
                          0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${property.stats?.occupancyRate || 0}%`,
                              }}
                            />
                          </div>
                          <span>{property.stats?.occupancyRate || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.stats?.totalResidents || 0}
                      </TableCell>
                      <TableCell>
                        {property.stats?.upcomingPercentage || 0}%
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isActive && (
                              <DropdownMenuItem
                                onClick={() => handleSetActive(property)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                <span>Set Active</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Property</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No properties found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No properties found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Add your first property to get started"}
          </p>
          <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      )}

      {/* Add property dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Enter the details of your new property
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Property Name
              </label>
              <input
                id="name"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Sunset Apartments"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <input
                id="address"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., 123 Main St, City, State"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Property Type
              </label>
              <select
                id="type"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="apartment">Apartment Building</option>
                <option value="house">Single Family Home</option>
                <option value="condo">Condominium</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Property card component for grid view
function PropertyCard({
  property,
  isActive,
  onSetActive,
}: {
  property: Property;
  isActive: boolean;
  onSetActive: (property: Property) => void;
}) {
  // Get property stats
  const { getStats: getUnitStats } = useUnits();
  const { data: unitStats } = getUnitStats(property.id);

  const { getStats: getLeaseStats } = useLeases();
  const { data: leaseStats } = getLeaseStats(property.id || "");

  const occupancyRate = unitStats?.occupancyRate || 0;
  const totalUnits = unitStats?.totalUnits || 0;
  const vacantUnits = unitStats?.vacantUnits || 0;

  return (
    <Card
      className={`overflow-hidden transition-all ${
        isActive ? "border-primary ring-1 ring-primary/20" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{property.name}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{property.address}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Units</p>
            <p className="text-lg font-medium">{totalUnits}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vacant</p>
            <p className="text-lg font-medium">{vacantUnits}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Occupancy</p>
            <p className="text-lg font-medium">{occupancyRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenants</p>
            <p className="text-lg font-medium">
              {leaseStats?.activeLeases || 0}
            </p>
          </div>
        </div>

        {/* Progress bar for occupancy */}
        <div className="w-full bg-muted rounded-full h-2.5 mb-2">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${occupancyRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Leased by {occupancyRate.toFixed(0)}%
        </p>
      </CardContent>
      <CardFooter className="bg-muted/10 pt-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {property.plan || "Standard Plan"}
            </span>
          </div>
          <Button
            variant={isActive ? "secondary" : "default"}
            size="sm"
            onClick={() => onSetActive(property)}
          >
            {isActive ? "Current" : "Select"}
            {!isActive && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Stats component for the active property
function PropertyStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default PropertiesPage;
