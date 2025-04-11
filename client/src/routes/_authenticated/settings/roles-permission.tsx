import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Lock, MoreHorizontal, User, UserCog } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/settings/roles-permission"
)({
  loader: () => {
    return {
      crumb: [
        {
          label: "Dashboard",
          path: "/dashboard",
          hideOnMobile: true,
        },
        {
          label: "Settings",
          path: "/settings",
          hideOnMobile: true,
        },
        {
          label: "Roles & permissions",
          path: "/settings/roles-permissions",
          hideOnMobile: false,
        },
      ],
    };
  },
  component: TeamManagementPage,
});

// Mock team members data
const TEAM_MEMBERS = [
  {
    id: "1",
    name: "Surány Izabella",
    phone: "(229) 555-0109",
    role: "Administrator",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "2",
    name: "Nagy Tímea",
    phone: "(209) 555-0104",
    role: "Team member",
    status: "inactive",
    image: "/api/placeholder/100/100",
  },
  {
    id: "3",
    name: "Gáspár Gréta",
    phone: "(201) 555-0124",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "4",
    name: "Vincze Nikole",
    phone: "(217) 555-0119",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "5",
    name: "Soós Annamária",
    phone: "(208) 555-0112",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "6",
    name: "Szekeres Dalma",
    phone: "(603) 555-0123",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "7",
    name: "Varga Boglárka",
    phone: "(480) 555-0103",
    role: "Team member",
    status: "inactive",
    image: "/api/placeholder/100/100",
  },
  {
    id: "8",
    name: "Sipos Veronik",
    phone: "(270) 555-0117",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "9",
    name: "Veres Panna",
    phone: "(684) 555-0102",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "10",
    name: "Pásztor Kíra",
    phone: "(405) 555-0128",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
  {
    id: "11",
    name: "Török Melinda",
    phone: "(702) 555-0122",
    role: "Team member",
    status: "active",
    image: "/api/placeholder/100/100",
  },
];

function TeamManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-semibold">Team management</h1>
      </div>

      <div className="border-b mb-4">
        <Tabs defaultValue="roles">
          <TabsList className="w-full justify-start">
            <TabsTrigger
              value="roles"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none"
            >
              Roles & permissions
            </TabsTrigger>
            <TabsTrigger
              value="property"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none"
            >
              Property permissions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="w-full max-w-sm relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
        <Button>
          <User className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {TEAM_MEMBERS.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

// Team Member Card Component
const TeamMemberCard = ({ member }) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 relative">
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit member</DropdownMenuItem>
              <DropdownMenuItem>View activity</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={member.image} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-lg">{member.name}</h3>
          <p className="text-muted-foreground text-sm">{member.phone}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center text-sm">
            {member.role === "Administrator" ? (
              <UserCog className="h-4 w-4 mr-1 text-amber-500" />
            ) : (
              <User className="h-4 w-4 mr-1 text-blue-500" />
            )}
            {member.role}
          </div>
          <Badge
            className={`ml-2 ${
              member.status === "active"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
            }`}
          >
            {member.status === "active" ? "Active" : "In Active"}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Lock className="h-4 w-4 mr-2" />
            Permissions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Clock className="h-4 w-4 mr-2" />
            Time Schedule
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TeamManagementPage;
