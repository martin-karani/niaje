import { useProperty } from "@/api/trpc-hooks";
import { PropertyNotFound } from "@/components/not-found/property-not-found";
import { Button } from "@/components/ui/button";
import { PropertyFormModal } from "@/features/properties/components/property-form";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/properties/$propertyId")({
  component: PropertyDetail,
  notFoundComponent: PropertyNotFound,
});

// Mock property units data
const PROPERTY_UNITS = [
  {
    id: "unit-1",
    number: "101",
    type: "1 bedroom",
    size: "750 sqft",
    rent: 1200,
    status: "leased",
    tenant: {
      id: "tenant-1",
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1 (555) 123-4567",
      leaseEnd: "2024-01-15",
    },
  },
  {
    id: "unit-2",
    number: "102",
    type: "2 bedroom",
    size: "950 sqft",
    rent: 1600,
    status: "vacant",
    tenant: null,
  },
  {
    id: "unit-3",
    number: "103",
    type: "1 bedroom",
    size: "780 sqft",
    rent: 1250,
    status: "leased",
    tenant: {
      id: "tenant-2",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      phone: "+1 (555) 987-6543",
      leaseEnd: "2023-12-31",
    },
  },
  {
    id: "unit-4",
    number: "201",
    type: "2 bedroom",
    size: "1050 sqft",
    rent: 1800,
    status: "leased",
    tenant: {
      id: "tenant-3",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      phone: "+1 (555) 234-5678",
      leaseEnd: "2024-03-15",
    },
  },
  {
    id: "unit-5",
    number: "202",
    type: "3 bedroom",
    size: "1350 sqft",
    rent: 2400,
    status: "upcoming",
    tenant: {
      id: "tenant-4",
      name: "Sarah Miller",
      email: "sarah.miller@example.com",
      phone: "+1 (555) 876-5432",
      leaseEnd: "2024-06-30",
      moveInDate: "2023-07-01",
    },
  },
  {
    id: "unit-6",
    number: "203",
    type: "1 bedroom",
    size: "760 sqft",
    rent: 1230,
    status: "vacant",
    tenant: null,
  },
];

// Mock maintenance requests
const MAINTENANCE_REQUESTS = [
  {
    id: "req-1",
    unit: "101",
    issue: "Leaking faucet in kitchen",
    status: "pending",
    date: "2023-06-15",
    priority: "normal",
  },
  {
    id: "req-2",
    unit: "201",
    issue: "AC not cooling properly",
    status: "in-progress",
    date: "2023-06-12",
    priority: "high",
  },
  {
    id: "req-3",
    unit: "103",
    issue: "Broken window lock",
    status: "completed",
    date: "2023-06-10",
    priority: "high",
  },
];

function PropertyDetail() {
  const { params } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { property, isLoading, error } = useProperty(params.propertyId);

  const [activeTab, setActiveTab] = useState("units"); // "units", "maintenance", "finances", "settings"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>(
    {}
  );

  const isLandlord = user?.role === "landlord" || user?.role === "admin";

  // Toggle unit expansion
  const toggleUnitExpansion = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  // Get summary counts
  const unitStats = {
    total: PROPERTY_UNITS.length,
    leased: PROPERTY_UNITS.filter((u) => u.status === "leased").length,
    vacant: PROPERTY_UNITS.filter((u) => u.status === "vacant").length,
    upcoming: PROPERTY_UNITS.filter((u) => u.status === "upcoming").length,
  };

  const maintenanceStats = {
    total: MAINTENANCE_REQUESTS.length,
    pending: MAINTENANCE_REQUESTS.filter((r) => r.status === "pending").length,
    inProgress: MAINTENANCE_REQUESTS.filter((r) => r.status === "in-progress")
      .length,
    completed: MAINTENANCE_REQUESTS.filter((r) => r.status === "completed")
      .length,
  };

  // Calculate occupancy rate
  const occupancyRate = Math.round((unitStats.leased / unitStats.total) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="mt-4">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Error loading property details.
          </p>
          <Button onClick={() => navigate({ to: "/properties" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  // Using mock property data if property is not available
  const propertyData = property || {
    id: params.propertyId,
    name: "Sobha Garden",
    address: "123 Main Street, Cityville, State 12345",
    type: "Residential",
    description:
      "Modern residential complex with top-notch amenities and convenient location.",
    owner: {
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 111-2222",
    },
    caretaker: {
      name: "Alice Brown",
      email: "alice.brown@example.com",
      phone: "+1 (555) 333-4444",
    },
    agent: {
      name: "Michael Davis",
      email: "michael.davis@example.com",
      phone: "+1 (555) 555-6666",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/properties" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{propertyData.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {propertyData.address}
            </p>
          </div>
        </div>

        {isLandlord && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Property Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Units</h3>
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div className="flex justify-between mt-4">
            <Stat label="Total" value={unitStats.total} />
            <Stat label="Leased" value={unitStats.leased} />
            <Stat label="Vacant" value={unitStats.vacant} />
          </div>
          <div className="mt-3">
            <div className="text-sm flex justify-between mb-1">
              <span>Occupancy Rate</span>
              <span className="font-medium">{occupancyRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Maintenance</h3>
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div className="flex justify-between mt-4">
            <Stat label="Total" value={maintenanceStats.total} />
            <Stat label="Pending" value={maintenanceStats.pending} />
            <Stat label="In Progress" value={maintenanceStats.inProgress} />
          </div>
          <div className="mt-4 text-sm">
            <Button variant="ghost" size="sm" className="px-0 text-primary">
              View All Maintenance Requests
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Monthly Revenue</h3>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">$10,480</p>
            <p className="text-sm text-muted-foreground">
              From {unitStats.leased} leased units
            </p>
          </div>
          <div className="mt-4 text-sm">
            <Button variant="ghost" size="sm" className="px-0 text-primary">
              View Financial Details
            </Button>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex flex-wrap -mb-px">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "units"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("units")}
              >
                Units
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "maintenance"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("maintenance")}
              >
                Maintenance
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "finances"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("finances")}
              >
                Finances
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "settings"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Units Tab */}
          {activeTab === "units" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Property Units</h2>
                {isLandlord && (
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {PROPERTY_UNITS.map((unit) => (
                  <div
                    key={unit.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 ${
                        expandedUnits[unit.id] ? "bg-muted/50" : ""
                      }`}
                      onClick={() => toggleUnitExpansion(unit.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {expandedUnits[unit.id] ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">Unit {unit.number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {unit.type} - {unit.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${unit.rent}/month</p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              unit.status === "leased"
                                ? "bg-emerald-100 text-emerald-700"
                                : unit.status === "vacant"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {unit.status.charAt(0).toUpperCase() +
                              unit.status.slice(1)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // This would open unit settings/menu
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedUnits[unit.id] && (
                      <div className="p-4 border-t bg-card">
                        {unit.tenant ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                Tenant Information
                              </h4>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Lease
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {unit.tenant.name}
                                </p>
                                <div className="flex text-sm text-muted-foreground gap-3 mt-1">
                                  <span className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {unit.tenant.email}
                                  </span>
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {unit.tenant.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Lease Ends
                                </p>
                                <p className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {new Date(
                                    unit.tenant.leaseEnd
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {unit.tenant.moveInDate && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Move In Date
                                  </p>
                                  <p className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    {new Date(
                                      unit.tenant.moveInDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <Button variant="outline" size="sm">
                                <Wrench className="h-4 w-4 mr-1" />
                                Maintenance
                              </Button>
                              <Button size="sm">
                                <User className="h-4 w-4 mr-1" />
                                Tenant Details
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <User className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-2 font-medium">
                              No Tenant Assigned
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              This unit is currently vacant
                            </p>
                            <div className="mt-4">
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Tenant
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Maintenance Requests</h2>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Unit
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Issue
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {MAINTENANCE_REQUESTS.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">Unit {request.unit}</td>
                        <td className="py-3 px-4">{request.issue}</td>
                        <td className="py-3 px-4">
                          {new Date(request.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : request.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {request.status
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {MAINTENANCE_REQUESTS.length === 0 && (
                <div className="text-center py-12 border rounded-lg">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No maintenance requests
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    All systems are running smoothly.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Finances Tab */}
          {activeTab === "finances" && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Financial Overview</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold mt-1">$10,480</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-2xl font-bold mt-1">$2,850</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className="text-2xl font-bold mt-1">$7,630</p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-3">Revenue Breakdown</h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Rent</span>
                      <span className="text-sm font-medium">
                        $8,750 (83.5%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: "83.5%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Parking</span>
                      <span className="text-sm font-medium">$950 (9.1%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: "9.1%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Utilities</span>
                      <span className="text-sm font-medium">$780 (7.4%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: "7.4%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    View Detailed Report
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Property Settings</h2>

              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-3">General Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Property Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={propertyData.name}
                      readOnly={!isLandlord}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Property Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={propertyData.type}
                      disabled={!isLandlord}
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed Use">Mixed Use</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted-foreground mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={propertyData.address}
                      readOnly={!isLandlord}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      defaultValue={propertyData.description}
                      readOnly={!isLandlord}
                    />
                  </div>
                </div>

                {isLandlord && (
                  <div className="mt-4 flex justify-end">
                    <Button size="sm">Save Changes</Button>
                  </div>
                )}
              </div>

              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-3">Associated Staff</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {propertyData.caretaker?.name ||
                            "No Caretaker Assigned"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Caretaker
                        </p>
                      </div>
                    </div>
                    {isLandlord && (
                      <Button variant="outline" size="sm">
                        {propertyData.caretaker ? "Change" : "Assign"}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {propertyData.agent?.name || "No Agent Assigned"}
                        </p>
                        <p className="text-sm text-muted-foreground">Agent</p>
                      </div>
                    </div>
                    {isLandlord && (
                      <Button variant="outline" size="sm">
                        {propertyData.agent ? "Change" : "Assign"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {isLandlord && (
                <div className="bg-card border rounded-lg p-4 border-destructive/30">
                  <h3 className="font-medium text-destructive mb-3">
                    Danger Zone
                  </h3>

                  <div className="flex items-center justify-between p-3 border border-destructive/30 rounded-md">
                    <div>
                      <p className="font-medium">Delete Property</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this property and all related data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Property
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-3">Property Owner</h3>

            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{propertyData.owner?.name}</p>
                <p className="text-sm text-muted-foreground">Owner</p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`mailto:${propertyData.owner?.email}`}
                className="flex items-center text-sm hover:text-primary"
              >
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {propertyData.owner?.email}
              </a>

              <a
                href={`tel:${propertyData.owner?.phone}`}
                className="flex items-center text-sm hover:text-primary"
              >
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {propertyData.owner?.phone}
              </a>
            </div>
          </div>

          {propertyData.caretaker && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium mb-3">Caretaker</h3>

              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{propertyData.caretaker.name}</p>
                  <p className="text-sm text-muted-foreground">
                    On-site Manager
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={`mailto:${propertyData.caretaker.email}`}
                  className="flex items-center text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {propertyData.caretaker.email}
                </a>

                <a
                  href={`tel:${propertyData.caretaker.phone}`}
                  className="flex items-center text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {propertyData.caretaker.phone}
                </a>
              </div>
            </div>
          )}

          {propertyData.agent && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium mb-3">Agent</h3>

              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{propertyData.agent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Property Marketer
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={`mailto:${propertyData.agent.email}`}
                  className="flex items-center text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {propertyData.agent.email}
                </a>

                <a
                  href={`tel:${propertyData.agent.phone}`}
                  className="flex items-center text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {propertyData.agent.phone}
                </a>
              </div>
            </div>
          )}

          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-3">Quick Actions</h3>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Tenants
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance Requests
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Lease Documents
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Property Modal */}
      <PropertyFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={propertyData}
        onSuccess={() => {
          // This would typically trigger a refetch of the property data
        }}
      />
    </div>
  );
}

// Helper Component
const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default PropertyDetail;
