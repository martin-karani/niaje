// src/routes/_authenticated/properties/table.tsx
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProperties } from "@/hooks/use-properties";
import { Property } from "@/providers/auth-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Building,
  Check,
  ChevronDown,
  Edit,
  Eye,
  Grid,
  List,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/properties/table")({
  loader: async () => ({
    crumb: [
      {
        label: "Properties",
        path: "/properties",
        hideOnMobile: false,
      },
      {
        label: "Table View",
        path: "/properties/table",
        hideOnMobile: false,
      },
    ],
  }),
  component: PropertiesTableView,
});

function PropertiesTableView() {
  const { properties, activeProperty, setActiveProperty, isLoading, error } =
    useProperties();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Handle sorting
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

  // Filter and sort properties
  const filteredAndSortedProperties = [...properties]
    .filter(
      (property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.address &&
          property.address.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
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
          comparison =
            (a.units?.totalResidents || 0) - (b.units?.totalResidents || 0);
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/properties/">
                  <Button variant="outline" size="icon">
                    <Grid className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" disabled>
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Table View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Table View */}
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
            {filteredAndSortedProperties.length > 0 ? (
              filteredAndSortedProperties.map((property) => {
                const isActive = activeProperty?.id === property.id;
                return (
                  <TableRow
                    key={property.id}
                    className={
                      isActive ? "bg-primary/5 border-l-4 border-l-primary" : ""
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
                    <TableCell>{property.stats?.totalResidents || 0}</TableCell>
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

      {/* Empty state */}
      {filteredAndSortedProperties.length === 0 && (
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

export default PropertiesTableView;
