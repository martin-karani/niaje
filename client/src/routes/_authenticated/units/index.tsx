import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

// Mock data for the current selected property
const SELECTED_PROPERTY = {
  id: "crown-tower",
  name: "CROWN TOWER",
  totalUnits: 60,
  units: [
    {
      id: "unit-1",
      unitNumber: "213B",
      bedrooms: 2,
      location: "Unit 671",
      expiry: "31.01.2024",
      area: "1280 sqft",
      price: "$2,340/m",
      status: "leased",
      image: "/api/placeholder/800/600",
      leasedBy: {
        name: "Aurelia James",
        avatar: null,
      },
    },
    {
      id: "unit-2",
      unitNumber: "213B",
      bedrooms: 2,
      location: "Unit 647",
      expiry: "31.01.2023",
      area: "1100 sqft",
      price: "$2,150/m",
      status: "upcoming",
      image: "/api/placeholder/800/600",
      leasedBy: {
        name: "Cora Richards",
        avatar: null,
      },
    },
    {
      id: "unit-3",
      unitNumber: "213B",
      bedrooms: 1,
      location: "Unit 164",
      expiry: "",
      area: "980 sqft",
      price: "$1,300/m",
      status: "vacant",
      image: "/api/placeholder/800/600",
      leasedBy: {
        name: "Jessica Simpsons",
        avatar: null,
      },
    },
    {
      id: "unit-4",
      unitNumber: "213B",
      bedrooms: 0,
      location: "Unit 745",
      expiry: "",
      area: "1050 sqft",
      price: "$2,100/m",
      status: "vacant",
      image: "/api/placeholder/800/600",
      type: "Residental",
    },
    {
      id: "unit-5",
      unitNumber: "213B",
      bedrooms: 0,
      location: "Unit 165",
      expiry: "15.04.2024",
      area: "1200 sqft",
      price: "$2,400/m",
      status: "leased",
      image: "/api/placeholder/800/600",
      type: "Residental",
      leasedBy: {
        name: "Michael Brown",
        avatar: null,
      },
    },
    {
      id: "unit-6",
      unitNumber: "213B",
      bedrooms: 0,
      location: "Unit 912",
      expiry: "10.05.2024",
      area: "950 sqft",
      price: "$1,900/m",
      status: "leased",
      image: "/api/placeholder/800/600",
      type: "Residental",
      leasedBy: {
        name: "David Wilson",
        avatar: null,
      },
    },
  ],
};

// Calculate property statistics
const calculateStats = () => {
  const units = SELECTED_PROPERTY.units;
  const totalUnits = SELECTED_PROPERTY.totalUnits;

  let leased = 0;
  let vacant = 0;
  let upcoming = 0;

  units.forEach((unit) => {
    if (unit.status === "leased") leased++;
    if (unit.status === "vacant") vacant++;
    if (unit.status === "upcoming") upcoming++;
  });

  // For realistic numbers based on the image
  const residents = 1810;
  const leasedPercentage = 87;
  const upcomingPercentage = 11;

  return {
    residents,
    totalUnits,
    vacant,
    upcoming,
    leased,
    leasedPercentage,
    upcomingPercentage,
  };
};

function Units() {
  const stats = calculateStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  // Filter units based on search term and filter
  const filteredUnits = SELECTED_PROPERTY.units.filter((unit) => {
    // Search term filter
    const matchesSearch =
      unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesFilter =
      !filter ||
      (filter === "leased" && unit.status === "leased") ||
      (filter === "vacant" && unit.status === "vacant") ||
      (filter === "upcoming" && unit.status === "upcoming");

    return matchesSearch && matchesFilter;
  });

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
            variant={filter ? "default" : "outline"}
            onClick={() => setFilter(filter ? null : "leased")}
            className={filter === "leased" ? "bg-green-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Leased
          </Button>
          <Button
            variant={filter ? "default" : "outline"}
            onClick={() => setFilter(filter ? null : "vacant")}
            className={filter === "vacant" ? "bg-rose-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Vacant
          </Button>
          <Button
            variant={filter ? "default" : "outline"}
            onClick={() => setFilter(filter ? null : "upcoming")}
            className={filter === "upcoming" ? "bg-amber-500" : ""}
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

      {/* Property header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{SELECTED_PROPERTY.name}</h2>
          <span className="text-sm text-muted-foreground">
            {SELECTED_PROPERTY.totalUnits} Units
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
            {searchTerm || filter
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
            src={unit.image}
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
            <div className="text-sm">{unit.expiry || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Area</div>
            <div className="text-sm">{unit.area}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-sm">{unit.price}</div>
          </div>
        </div>

        {unit.status !== "vacant" && unit.leasedBy && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Leased by</div>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage
                  src={unit.leasedBy?.avatar || ""}
                  alt={unit.leasedBy?.name}
                />
                <AvatarFallback>
                  {unit.leasedBy?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{unit.leasedBy?.name}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Units;
