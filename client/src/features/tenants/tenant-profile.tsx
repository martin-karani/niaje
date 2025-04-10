// src/components/tenants/tenant-profile.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Home, Plus, User } from "lucide-react";
import { useState } from "react";

interface TenantProfileProps {
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    propertyName: string;
    unit: string;
    dateOfBirth: string;
    moveInDate: string;
    leaseEnd: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
    };
  };
}

export function TenantProfile({ tenant }: TenantProfileProps) {
  const [activeTab, setActiveTab] = useState("profile");

  // Format date string for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{tenant.name}</h1>
            <p className="text-muted-foreground flex items-center text-sm">
              <Home className="h-4 w-4 mr-1" />
              {tenant.address}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download report
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Invoice
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <div className="flex -mb-px">
          <TabButton
            label="Profile"
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            label="Leases"
            isActive={activeTab === "leases"}
            onClick={() => setActiveTab("leases")}
          />
          <TabButton
            label="Request"
            isActive={activeTab === "request"}
            onClick={() => setActiveTab("request")}
            badge="1+"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content area - 2/3 width */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Personal Information</h2>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    First Name:
                  </label>
                  <div className="font-medium">Jacob</div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Last Name:
                  </label>
                  <div className="font-medium">Jones</div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Date of birth:
                  </label>
                  <div className="font-medium">Dec 21, 1993 | 30 y.o</div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Additional phone 1:
                  </label>
                  <div className="font-medium">01524-789631</div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Additional Email 1:
                  </label>
                  <div className="font-medium">hello741@gmail.com</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>

              <div className="flex flex-wrap gap-2 mb-4">
                <TabButton
                  label="View all"
                  isActive={true}
                  variant="secondary"
                  small
                />
                <TabButton
                  label="Paid"
                  isActive={false}
                  variant="secondary"
                  small
                />
                <TabButton
                  label="Partially Paid"
                  isActive={false}
                  variant="secondary"
                  small
                />
                <TabButton
                  label="Processing"
                  isActive={false}
                  variant="secondary"
                  small
                />
                <TabButton
                  label="Overdue"
                  isActive={false}
                  variant="secondary"
                  small
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        Customer
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        ID
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        Date
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        Status
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        Unit Number
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-sm">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Mock transactions data */}
                    {[
                      {
                        id: "3066",
                        date: "N/A",
                        status: "Overdue",
                        unit: "3517 W. Gray St",
                      },
                      {
                        id: "3066",
                        date: "05/07/2024",
                        status: "Partially Paid",
                        unit: "4517 Washington",
                      },
                      {
                        id: "3066",
                        date: "28/06/2024",
                        status: "Processing",
                        unit: "4140 Parker Rd",
                      },
                      {
                        id: "3066",
                        date: "20/06/2024",
                        status: "Paid",
                        unit: "8502 Preston Rd",
                      },
                      {
                        id: "3066",
                        date: "N/A",
                        status: "Overdue",
                        unit: "2464 Royal Ln",
                      },
                      {
                        id: "3066",
                        date: "12/06/2024",
                        status: "Partially Paid",
                        unit: "2715 Ash Dr. San",
                      },
                      {
                        id: "3066",
                        date: "N/A",
                        status: "Processing",
                        unit: "2972 Westheimer",
                      },
                    ].map((transaction, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span>Leslie Alexander</span>
                          </div>
                        </td>
                        <td className="py-3">{transaction.id}</td>
                        <td className="py-3">{transaction.date}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              transaction.status === "Paid"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "Overdue"
                                ? "bg-red-100 text-red-800"
                                : transaction.status === "Partially Paid"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3">{transaction.unit}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 15 15"
                                fill="none"
                              >
                                <path
                                  d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                                  fill="currentColor"
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 15 15"
                                fill="none"
                              >
                                <path
                                  d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3 5.5C3 5.22386 3.22386 5 3.5 5H11.5C11.7761 5 12 5.22386 12 5.5C12 5.77614 11.7761 6 11.5 6H3.5C3.22386 6 3 5.77614 3 5.5ZM3 7.5C3 7.22386 3.22386 7 3.5 7H7.5C7.77614 7 8 7.22386 8 7.5C8 7.77614 7.77614 8 7.5 8H3.5C3.22386 8 3 7.77614 3 7.5ZM3 9.5C3 9.22386 3.22386 9 3.5 9H7.5C7.77614 9 8 9.22386 8 9.5C8 9.77614 7.77614 10 7.5 10H3.5C3.22386 10 3 9.77614 3 9.5ZM3 11.5C3 11.2239 3.22386 11 3.5 11H7.5C7.77614 11 8 11.2239 8 11.5C8 11.7761 7.77614 12 7.5 12H3.5C3.22386 12 3 11.7761 3 11.5ZM9.05 7.5C9.05 7.74853 9.25147 7.95 9.5 7.95C9.74853 7.95 9.95 7.74853 9.95 7.5C9.95 7.25147 9.74853 7.05 9.5 7.05C9.25147 7.05 9.05 7.25147 9.05 7.5ZM10.5 7.95C10.2515 7.95 10.05 7.74853 10.05 7.5C10.05 7.25147 10.2515 7.05 10.5 7.05C10.7485 7.05 10.95 7.25147 10.95 7.5C10.95 7.74853 10.7485 7.95 10.5 7.95ZM11.05 7.5C11.05 7.74853 11.2515 7.95 11.5 7.95C11.7485 7.95 11.95 7.74853 11.95 7.5C11.95 7.25147 11.7485 7.05 11.5 7.05C11.2515 7.05 11.05 7.25147 11.05 7.5ZM9.5 9.95C9.25147 9.95 9.05 9.74853 9.05 9.5C9.05 9.25147 9.25147 9.05 9.5 9.05C9.74853 9.05 9.95 9.25147 9.95 9.5C9.95 9.74853 9.74853 9.95 9.5 9.95ZM10.05 9.5C10.05 9.74853 10.2515 9.95 10.5 9.95C10.7485 9.95 10.95 9.74853 10.95 9.5C10.95 9.25147 10.7485 9.05 10.5 9.05C10.2515 9.05 10.05 9.25147 10.05 9.5ZM11.5 9.95C11.2515 9.95 11.05 9.74853 11.05 9.5C11.05 9.25147 11.2515 9.05 11.5 9.05C11.7485 9.05 11.95 9.25147 11.95 9.5C11.95 9.74853 11.7485 9.95 11.5 9.95ZM9.05 11.5C9.05 11.7485 9.25147 11.95 9.5 11.95C9.74853 11.95 9.95 11.7485 9.95 11.5C9.95 11.2515 9.74853 11.05 9.5 11.05C9.25147 11.05 9.05 11.2515 9.05 11.5ZM10.5 11.95C10.2515 11.95 10.05 11.7485 10.05 11.5C10.05 11.2515 10.2515 11.05 10.5 11.05C10.7485 11.05 10.95 11.2515 10.95 11.5C10.95 11.7485 10.7485 11.95 10.5 11.95ZM11.05 11.5C11.05 11.7485 11.2515 11.95 11.5 11.95C11.7485 11.95 11.95 11.7485 11.95 11.5C11.95 11.2515 11.7485 11.05 11.5 11.05C11.2515 11.05 11.05 11.2515 11.05 11.5Z"
                                  fill="currentColor"
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Emergency contact</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Relationship:
                </label>
                <div className="font-medium">Wife</div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Mobile:
                </label>
                <div className="font-medium">01524-789631</div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Date of birth:
                </label>
                <div className="font-medium">Dec 21, 1993 | 30 y.o</div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Email:
                </label>
                <div className="font-medium">hello741@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium">Payment Due</div>
              <div className="text-2xl font-bold">$16,254</div>
            </div>
            <Button variant="outline" className="w-full justify-start">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                className="mr-2"
              >
                <path
                  d="M14.4999 1.5C14.4999 1.22386 14.2761 1 13.9999 1C13.7238 1 13.4999 1.22386 13.4999 1.5V13.5C13.4999 13.7761 13.7238 14 13.9999 14C14.2761 14 14.4999 13.7761 14.4999 13.5V1.5ZM7.79296 4.79292C8.01349 4.57239 8.36692 4.57239 8.58745 4.79292L11.0874 7.29292C11.308 7.51345 11.308 7.86688 11.0874 8.08741L8.58745 10.5874C8.36692 10.8079 8.01349 10.8079 7.79296 10.5874C7.57243 10.3669 7.57243 10.0134 7.79296 9.79292L9.08586 8.50002H1.5C1.22386 8.50002 1 8.27616 1 8.00002C1 7.72388 1.22386 7.50002 1.5 7.50002H9.08586L7.79296 6.20712C7.57243 5.98659 7.57243 5.63316 7.79296 5.41263L7.79296 4.79292Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              Receive
            </Button>

            <div className="text-lg font-medium mt-6">Security Money</div>
            <div className="text-2xl font-bold">$420</div>
            <Button variant="outline" className="w-full justify-start">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                className="mr-2"
              >
                <path
                  d="M1.5 1C1.22386 1 1 1.22386 1 1.5C1 1.77614 1.22386 2 1.5 2H13.5C13.7761 2 14 1.77614 14 1.5C14 1.22386 13.7761 1 13.5 1H1.5ZM7.5 4C7.77614 4 8 3.77614 8 3.5C8 3.22386 7.77614 3 7.5 3C7.22386 3 7 3.22386 7 3.5C7 3.77614 7.22386 4 7.5 4ZM8 5.5C8 5.77614 7.77614 6 7.5 6C7.22386 6 7 5.77614 7 5.5C7 5.22386 7.22386 5 7.5 5C7.77614 5 8 5.22386 8 5.5ZM7.5 8C7.77614 8 8 7.77614 8 7.5C8 7.22386 7.77614 7 7.5 7C7.22386 7 7 7.22386 7 7.5C7 7.77614 7.22386 8 7.5 8ZM8 9.5C8 9.77614 7.77614 10 7.5 10C7.22386 10 7 9.77614 7 9.5C7 9.22386 7.22386 9 7.5 9C7.77614 9 8 9.22386 8 9.5ZM7.5 12C7.77614 12 8 11.7761 8 11.5C8 11.2239 7.77614 11 7.5 11C7.22386 11 7 11.2239 7 11.5C7 11.7761 7.22386 12 7.5 12ZM8 13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5C7 13.2239 7.22386 13 7.5 13C7.77614 13 8 13.2239 8 13.5ZM11.5 4C11.7761 4 12 3.77614 12 3.5C12 3.22386 11.7761 3 11.5 3C11.2239 3 11 3.22386 11 3.5C11 3.77614 11.2239 4 11.5 4ZM12 5.5C12 5.77614 11.7761 6 11.5 6C11.2239 6 11 5.77614 11 5.5C11 5.22386 11.2239 5 11.5 5C11.7761 5 12 5.22386 12 5.5ZM11.5 8C11.7761 8 12 7.77614 12 7.5C12 7.22386 11.7761 7 11.5 7C11.2239 7 11 7.22386 11 7.5C11 7.77614 11.2239 8 11.5 8ZM12 9.5C12 9.77614 11.7761 10 11.5 10C11.2239 10 11 9.77614 11 9.5C11 9.22386 11.2239 9 11.5 9C11.7761 9 12 9.22386 12 9.5ZM11.5 12C11.7761 12 12 11.7761 12 11.5C12 11.2239 11.7761 11 11.5 11C11.2239 11 11 11.2239 11 11.5C11 11.7761 11.2239 12 11.5 12ZM3.5 4C3.77614 4 4 3.77614 4 3.5C4 3.22386 3.77614 3 3.5 3C3.22386 3 3 3.22386 3 3.5C3 3.77614 3.22386 4 3.5 4ZM4 5.5C4 5.77614 3.77614 6 3.5 6C3.22386 6 3 5.77614 3 5.5C3 5.22386 3.22386 5 3.5 5C3.77614 5 4 5.22386 4 5.5ZM3.5 8C3.77614 8 4 7.77614 4 7.5C4 7.22386 3.77614 7 3.5 7C3.22386 7 3 7.22386 3 7.5C3 7.77614 3.22386 8 3.5 8ZM4 9.5C4 9.77614 3.77614 10 3.5 10C3.22386 10 3 9.77614 3 9.5C3 9.22386 3.22386 9 3.5 9C3.77614 9 4 9.22386 4 9.5ZM3.5 12C3.77614 12 4 11.7761 4 11.5C4 11.2239 3.77614 11 3.5 11C3.22386 11 3 11.2239 3 11.5C3 11.7761 3.22386 12 3.5 12Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              Return
            </Button>

            <div className="text-lg font-medium mt-6">Credits Balance</div>
            <div className="text-2xl font-bold">$1,540</div>
            <Button variant="outline" className="w-full justify-start">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                className="mr-2"
              >
                <path
                  d="M2.14921 3.99996H12.8505C13.9217 3.99996 14.7984 4.92737 14.7984 6.06089C14.7984 6.46447 14.7984 7.50493 14.7984 7.99996H0.200684V6.06089C0.200684 4.92737 1.07733 3.99996 2.14921 3.99996ZM14.7984 9.00001H0.200684V10.9391C0.200684 12.0726 1.07733 13 2.14921 13H12.8505C13.9224 13 14.7984 12.0726 14.7984 10.9391V9.00001ZM2.49987 6.74997C2.49987 6.33575 2.83565 5.99997 3.24987 5.99997H4.24987C4.66409 5.99997 4.99987 6.33575 4.99987 6.74997C4.99987 7.16418 4.66409 7.49997 4.24987 7.49997H3.24987C2.83565 7.49997 2.49987 7.16418 2.49987 6.74997ZM2.49987 11.25C2.49987 10.8358 2.83565 10.5 3.24987 10.5H4.24987C4.66409 10.5 4.99987 10.8358 4.99987 11.25C4.99987 11.6642 4.66409 12 4.24987 12H3.24987C2.83565 12 2.49987 11.6642 2.49987 11.25Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
  variant?: "default" | "secondary";
  small?: boolean;
}

const TabButton = ({
  label,
  isActive,
  onClick,
  badge,
  variant = "default",
  small = false,
}: TabButtonProps) => (
  <button
    className={cn(
      small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
      variant === "secondary" ? "rounded-md" : "",
      "font-medium transition-colors relative",
      isActive
        ? variant === "default"
          ? "border-b-2 border-primary text-primary"
          : "bg-muted text-foreground"
        : variant === "default"
        ? "text-muted-foreground hover:text-foreground"
        : "text-muted-foreground hover:bg-muted/50"
    )}
    onClick={onClick}
  >
    {label}
    {badge && (
      <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
        {badge}
      </span>
    )}
  </button>
);
