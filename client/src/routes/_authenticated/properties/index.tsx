import { trpc } from "@/api/trpc";
import { PropertyNotFound } from "@/components/not-found/property-not-found";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Building,
  ChevronDown,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/properties/")({
  component: Properties,
  notFoundComponent: PropertyNotFound,
});

function Properties() {
  const { user } = useAuth();
  const { data: propertiesData, isLoading } = trpc.properties.getAll.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Sample property categories for the examples
  const categories = [
    { id: "all", name: "All Properties" },
    { id: "residential", name: "Residential" },
    { id: "commercial", name: "Commercial" },
    { id: "business", name: "Business Center" },
  ];

  // Filter and search properties
  const filteredProperties = propertiesData?.filter((property) => {
    // Skip filtering if "all" is selected
    const typeMatch =
      activeFilter === "all" ||
      property.type.toLowerCase().includes(activeFilter.toLowerCase());

    // Search in name and address
    const searchMatch =
      !searchTerm ||
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  // Group properties by type
  const groupedProperties = filteredProperties?.reduce((acc, property) => {
    const type = property.type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(property);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading properties...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
        {user?.role === "landlord" && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search properties..."
            className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Properties Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Properties"
          value={propertiesData?.length || 0}
        />
        <SummaryCard label="Units" value="1032" />
        <SummaryCard label="Vacant" value="134" />
        <SummaryCard label="Upcoming" value="73" />
      </div>

      {/* Properties Occupancy */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-medium">Leased by 87%</div>
          <div className="text-sm text-muted-foreground">11% Upcoming</div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2"
            style={{ width: "87%" }}
          ></div>
        </div>
      </div>

      {/* Property Categories */}
      {groupedProperties && Object.keys(groupedProperties).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedProperties).map(([type, properties]) => (
            <div key={type} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {type}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {properties.length} Properties
                  </span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No properties found</h3>
          <p className="mt-2 text-muted-foreground">
            {user?.role === "landlord"
              ? "Add your first property to get started."
              : "No properties are currently assigned to you."}
          </p>
          {user?.role === "landlord" && (
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
const SummaryCard = ({ label, value }) => (
  <div className="bg-card rounded-lg border p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const PropertyCard = ({ property }) => {
  // Generate status text and colors based on property data
  const getStatusStyle = () => {
    const statuses = {
      leased: {
        text: "Leased",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
      },
      vacant: {
        text: "Vacant",
        bgColor: "bg-rose-100",
        textColor: "text-rose-700",
      },
      upcoming: {
        text: "Upcoming",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
      },
    };

    // This is a placeholder. In a real app, you would determine this based on property data
    const status =
      property.status ||
      (Math.random() > 0.3
        ? "leased"
        : Math.random() > 0.5
        ? "vacant"
        : "upcoming");
    return statuses[status];
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="relative h-48 bg-muted">
        {/* This would be the property image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Building className="h-16 w-16 text-muted-foreground" />
        </div>
        <div
          className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${statusStyle.bgColor} ${statusStyle.textColor}`}
        >
          {statusStyle.text}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{property.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{property.address}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p>{property.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Units</p>
            <p>{Math.floor(Math.random() * 80) + 20}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm">
            View Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Properties;
