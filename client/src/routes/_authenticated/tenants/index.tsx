import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building,
  ChevronDown,
  Filter,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tenants/")({
  component: Tenants,
});

// Mock tenant data based on Image 1
const TENANTS_DATA = [
  {
    id: "tenant-1",
    name: "Kathryn Murphy",
    rentFrom: "Jan 2025",
    location: "Corona, Michigan",
    phone: "(702) 555-0122",
    email: "hanson@gmail.com",
  },
  {
    id: "tenant-2",
    name: "Eleanor Pena",
    rentFrom: "Nov 2024",
    location: "Coppell, Virginia",
    phone: "(629) 555-0129",
    email: "georgia@gmail.com",
  },
  {
    id: "tenant-3",
    name: "Jacob Jones",
    rentFrom: "Sep 2024",
    location: "Syracuse, Connecticut",
    phone: "(405) 555-0128",
    email: "tanya.hill@gmail.com",
  },
  {
    id: "tenant-4",
    name: "Leslie Alexander",
    rentFrom: "Jun 2024",
    location: "Lansing, Illinois",
    phone: "(505) 555-0125",
    email: "dolores@gmail.com",
  },
  {
    id: "tenant-5",
    name: "Jacob Jones",
    rentFrom: "Apr 2024",
    location: "Great Falls, Maryland",
    phone: "(208) 555-0112",
    email: "debbie@gmail.com",
  },
  {
    id: "tenant-6",
    name: "Kathryn Murphy",
    rentFrom: "Feb 2024",
    location: "Pasadena, Oklahoma",
    phone: "(808) 555-0111",
    email: "lawson@gmail.com",
  },
  {
    id: "tenant-7",
    name: "Leslie Alexander",
    rentFrom: "Dec 2023",
    location: "Lansing, Illinois",
    phone: "(406) 555-0120",
    email: "felicia@gmail.com",
  },
  {
    id: "tenant-8",
    name: "Eleanor Pena",
    rentFrom: "Oct 2023",
    location: "Lafayette, California",
    phone: "(480) 555-0103",
    email: "roberts@gmail.com",
  },
];

function Tenants() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter tenants based on search term and status filter
  const filteredTenants = TENANTS_DATA.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.location.toLowerCase().includes(searchTerm.toLowerCase());

    // For demo purposes, we're not implementing actual status filtering
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add tenants
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter Tenants</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Tenants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active Tenants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("past")}>
                  Past Tenants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>
                  Upcoming Move-ins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  A-Z <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>A-Z</DropdownMenuItem>
                <DropdownMenuItem>Z-A</DropdownMenuItem>
                <DropdownMenuItem>Newest</DropdownMenuItem>
                <DropdownMenuItem>Oldest</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              All rentals <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              Tenant States <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {tenant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-center">{tenant.name}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Rent from {tenant.rentFrom}
                    </p>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                        <DropdownMenuItem>View Lease</DropdownMenuItem>
                        <DropdownMenuItem>Send Notice</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Archive Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{tenant.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    to={`/tenants/${tenant.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tenants found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? "No tenants match your search criteria"
              : "You haven't added any tenants yet"}
          </p>
          {user?.role !== "caretaker" && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default Tenants;
