import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Menu,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAdjustments,
  IconBuilding,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconClock,
  IconCurrencyDollar,
  IconDots,
  IconEdit,
  IconExternalLink,
  IconFileText,
  IconHome,
  IconMapPin,
  IconPhone,
  IconPlus,
  IconTools,
  IconTrash,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../../components/common/page-header";
import { useAuthStore } from "../../state/auth-store";

// Mock data for a single property - would be fetched from API
const propertyData = {
  id: "1",
  name: "Sunset Apartments",
  addressLine1: "123 Main Street",
  addressLine2: "Unit A",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "USA",
  type: "residential",
  status: "active",
  description:
    "A modern apartment complex with 24 units located in the heart of the city. Features include a rooftop garden, community room, and secure parking. The building was renovated in 2020 with all new appliances and finishes.",
  yearBuilt: 1995,
  lastRenovated: 2020,
  totalUnits: 24,
  occupiedUnits: 22,
  occupancyRate: 92,
  images: [
    "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  ],
  amenities: [
    "Rooftop Garden",
    "Community Room",
    "Secure Parking",
    "Elevator",
    "In-unit Laundry",
    "Fitness Center",
    "Package Receiving",
    "Pet Friendly",
  ],
  owner: {
    id: "o1",
    name: "Alpha Investments LLC",
    email: "contact@alphainvestments.com",
    phone: "(415) 555-1234",
  },
  caretaker: {
    id: "c1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(415) 555-5678",
  },
  financials: {
    monthlyRevenue: 48000,
    monthlyExpenses: 18000,
    netIncome: 30000,
    annualReturn: 8.5,
  },
};

// Mock units for the property
const units = [
  {
    id: "u1",
    name: "101",
    type: "one_br",
    status: "occupied",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    rent: 2000,
    tenant: "Alice Johnson",
    leaseEnd: "2025-08-15",
  },
  {
    id: "u2",
    name: "102",
    type: "two_br",
    status: "occupied",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    rent: 2500,
    tenant: "Bob Williams",
    leaseEnd: "2025-07-01",
  },
  {
    id: "u3",
    name: "103",
    type: "studio",
    status: "vacant",
    bedrooms: 0,
    bathrooms: 1,
    sqft: 450,
    rent: 1500,
    tenant: null,
    leaseEnd: null,
  },
  {
    id: "u4",
    name: "104",
    type: "one_br",
    status: "occupied",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    rent: 2000,
    tenant: "Carol Martinez",
    leaseEnd: "2025-09-30",
  },
  {
    id: "u5",
    name: "105",
    type: "three_br",
    status: "occupied",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    rent: 3500,
    tenant: "David Garcia",
    leaseEnd: "2025-06-30",
  },
  {
    id: "u6",
    name: "106",
    type: "two_br",
    status: "vacant",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 950,
    rent: 2700,
    tenant: null,
    leaseEnd: null,
  },
];

// Mock maintenance requests
const maintenanceRequests = [
  {
    id: "m1",
    title: "Leaking faucet in kitchen",
    unit: "102",
    status: "pending",
    priority: "medium",
    reportedDate: "2025-04-15",
    description: "The kitchen sink faucet is leaking when turned on.",
    tenant: "Bob Williams",
  },
  {
    id: "m2",
    title: "Broken light fixture in bathroom",
    unit: "105",
    status: "in_progress",
    priority: "low",
    reportedDate: "2025-04-18",
    description: "The bathroom ceiling light fixture is not working.",
    tenant: "David Garcia",
  },
  {
    id: "m3",
    title: "HVAC not cooling properly",
    unit: "101",
    status: "scheduled",
    priority: "high",
    reportedDate: "2025-04-20",
    description: "The AC is running but not cooling the apartment effectively.",
    tenant: "Alice Johnson",
  },
];

const PropertyDetail = () => {
  const { id } = useParams();
  const { user, organization } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");

  // Fetch property data
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setProperty(propertyData);
      setPropertyUnits(units);
      setMaintenance(maintenanceRequests);
      setMainImage(propertyData.images[0]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  // Render status badge based on unit status
  const renderUnitStatusBadge = (status) => {
    switch (status) {
      case "occupied":
        return <Badge color="green">Occupied</Badge>;
      case "vacant":
        return <Badge color="red">Vacant</Badge>;
      case "maintenance":
        return <Badge color="yellow">Maintenance</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const renderMaintenanceStatusBadge = (status, priority) => {
    let color;
    let label;

    switch (status) {
      case "pending":
        color = "orange";
        label = "Pending";
        break;
      case "in_progress":
        color = "blue";
        label = "In Progress";
        break;
      case "scheduled":
        color = "grape";
        label = "Scheduled";
        break;
      case "completed":
        color = "green";
        label = "Completed";
        break;
      default:
        color = "gray";
        label = status;
    }

    let priorityColor;
    switch (priority) {
      case "high":
        priorityColor = "red";
        break;
      case "medium":
        priorityColor = "yellow";
        break;
      case "low":
        priorityColor = "green";
        break;
      default:
        priorityColor = "blue";
    }

    return (
      <Group spacing={8}>
        <Badge color={color}>{label}</Badge>
        <Badge color={priorityColor} variant="outline">
          {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
        </Badge>
      </Group>
    );
  };

  if (isLoading) {
    return (
      <Container size="lg" mt="md">
        <Skeleton height={60} radius="md" mb="xl" />
        <Grid gutter="md">
          <Grid.Col sm={12} md={8}>
            <Skeleton height={400} radius="md" mb="md" />
          </Grid.Col>
          <Grid.Col sm={12} md={4}>
            <Skeleton height={400} radius="md" mb="md" />
          </Grid.Col>
        </Grid>
        <Skeleton height={120} radius="md" mt="xl" />
        <Skeleton height={200} radius="md" mt="xl" />
      </Container>
    );
  }

  if (!property) {
    return (
      <Container size="lg" mt="md">
        <Paper withBorder p="xl" radius="md">
          <Text align="center" size="xl" weight={700} color="red">
            Property not found
          </Text>
          <Button
            component={Link}
            to="/properties"
            variant="outline"
            mt="md"
            mx="auto"
            display="block"
          >
            Back to Properties
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" mt="md">
      <PageHeader
        title={property.name}
        subtitle={`${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`}
        actions={
          <Group>
            <Button
              component={Link}
              to={`/properties/${property.id}/edit`}
              variant="outline"
              leftSection={<IconEdit size={16} />}
            >
              Edit Property
            </Button>
            <Menu>
              <Menu.Target>
                <Button variant="filled" leftSection={<IconPlus size={16} />}>
                  Add
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  to={`/properties/${property.id}/units/create`}
                  icon={<IconHome size={16} />}
                >
                  Add Unit
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to={`/maintenance/create?propertyId=${property.id}`}
                  icon={<IconTools size={16} />}
                >
                  Add Maintenance Request
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to={`/leases/create?propertyId=${property.id}`}
                  icon={<IconFileText size={16} />}
                >
                  Add Lease
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Menu>
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  to={`/reports/property/${property.id}`}
                  icon={<IconChartBar size={16} />}
                >
                  View Reports
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to={`/properties/${property.id}/assign-staff`}
                  icon={<IconUsers size={16} />}
                >
                  Assign Staff
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" icon={<IconTrash size={16} />}>
                  Delete Property
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        }
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Properties", href: "/properties" },
          { title: property.name },
        ]}
      />

      <Tabs value={activeTab} onChange={setActiveTab} mt="xl">
        <Tabs.List>
          <Tabs.Tab value="overview" icon={<IconHome size={14} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="units" icon={<IconBuilding size={14} />}>
            Units
          </Tabs.Tab>
          <Tabs.Tab value="maintenance" icon={<IconTools size={14} />}>
            Maintenance
          </Tabs.Tab>
          <Tabs.Tab value="financials" icon={<IconCurrencyDollar size={14} />}>
            Financials
          </Tabs.Tab>
          <Tabs.Tab value="documents" icon={<IconFileText size={14} />}>
            Documents
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Grid gutter="md">
            <Grid.Col sm={12} md={8}>
              <Paper withBorder p="md" radius="md">
                <Box mb="md">
                  <Image
                    src={mainImage}
                    height={400}
                    alt={property.name}
                    radius="md"
                  />
                </Box>
                <Group spacing="xs" mb="md">
                  {property.images.map((img, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={img}
                      sx={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: "4px",
                        cursor: "pointer",
                        border:
                          img === mainImage
                            ? "2px solid #339af0"
                            : "1px solid #e9ecef",
                      }}
                      onClick={() => setMainImage(img)}
                    />
                  ))}
                </Group>

                <Group position="apart" mb="md">
                  <div>
                    <Title order={3}>{property.name}</Title>
                    <Text
                      color="dimmed"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <IconMapPin size={16} style={{ marginRight: 5 }} />
                      {property.addressLine1}, {property.city}, {property.state}{" "}
                      {property.postalCode}
                    </Text>
                  </div>
                  <Group>
                    <Badge
                      color={property.type === "residential" ? "blue" : "green"}
                      size="lg"
                    >
                      {property.type === "residential"
                        ? "Residential"
                        : "Commercial"}
                    </Badge>
                    <Badge
                      color={property.status === "active" ? "green" : "yellow"}
                      size="lg"
                    >
                      {property.status === "active"
                        ? "Active"
                        : "Under Construction"}
                    </Badge>
                  </Group>
                </Group>

                <Paper withBorder p="md" radius="md" mb="md">
                  <Title order={4} mb="sm">
                    Property Details
                  </Title>
                  <Text mb="md">{property.description}</Text>

                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                    <Box>
                      <Text size="sm" color="dimmed">
                        Year Built
                      </Text>
                      <Group spacing={5}>
                        <IconCalendar size={16} />
                        <Text fw={500}>{property.yearBuilt}</Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" color="dimmed">
                        Last Renovated
                      </Text>
                      <Group spacing={5}>
                        <IconCalendar size={16} />
                        <Text fw={500}>{property.lastRenovated}</Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" color="dimmed">
                        Total Units
                      </Text>
                      <Group spacing={5}>
                        <IconBuilding size={16} />
                        <Text fw={500}>{property.totalUnits}</Text>
                      </Group>
                    </Box>
                  </SimpleGrid>
                </Paper>

                <Paper withBorder p="md" radius="md" mb="md">
                  <Title order={4} mb="sm">
                    Amenities
                  </Title>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                    {property.amenities.map((amenity, index) => (
                      <Group key={index} spacing={5}>
                        <ThemeIcon color="green" radius="xl" size="sm">
                          <IconCheck size={12} />
                        </ThemeIcon>
                        <Text size="sm">{amenity}</Text>
                      </Group>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Paper>
            </Grid.Col>

            <Grid.Col sm={12} md={4}>
              <Paper withBorder p="md" radius="md" mb="md">
                <Title order={4} mb="md">
                  Occupancy & Units
                </Title>
                <Text fz="xl" fw={700} ta="center">
                  {property.occupancyRate}%
                </Text>
                <Progress
                  value={property.occupancyRate}
                  size="xl"
                  color={
                    property.occupancyRate > 90
                      ? "green"
                      : property.occupancyRate > 80
                      ? "blue"
                      : "yellow"
                  }
                  radius="xl"
                  mb="md"
                />
                <Group position="apart">
                  <Text>Occupied Units</Text>
                  <Text fw={500}>
                    {property.occupiedUnits} / {property.totalUnits}
                  </Text>
                </Group>
                <Divider my="sm" />
                <Button
                  component={Link}
                  to={`/properties/${property.id}/units`}
                  variant="light"
                  fullWidth
                  leftSection={<IconBuilding size={16} />}
                >
                  Manage Units
                </Button>
              </Paper>

              <Paper withBorder p="md" radius="md" mb="md">
                <Title order={4} mb="md">
                  Property Contacts
                </Title>

                <Card withBorder mb="md">
                  <Group position="apart">
                    <Text fw={700}>Owner</Text>
                    <Badge>Primary</Badge>
                  </Group>
                  <Group mt="xs" noWrap align="flex-start">
                    <Avatar radius="xl" color="blue" src={null}>
                      {property.owner.name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text>{property.owner.name}</Text>
                      <Text size="xs" color="dimmed">
                        {property.owner.email}
                      </Text>
                      <Group mt={5} spacing={5}>
                        <IconPhone size={14} />
                        <Text size="xs">{property.owner.phone}</Text>
                      </Group>
                    </div>
                  </Group>
                </Card>

                <Card withBorder>
                  <Group position="apart">
                    <Text fw={700}>Caretaker</Text>
                    <Badge>On-Site</Badge>
                  </Group>
                  <Group mt="xs" noWrap align="flex-start">
                    <Avatar radius="xl" color="green" src={null}>
                      {property.caretaker.name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text>{property.caretaker.name}</Text>
                      <Text size="xs" color="dimmed">
                        {property.caretaker.email}
                      </Text>
                      <Group mt={5} spacing={5}>
                        <IconPhone size={14} />
                        <Text size="xs">{property.caretaker.phone}</Text>
                      </Group>
                    </div>
                  </Group>
                </Card>
              </Paper>

              <Paper withBorder p="md" radius="md" mb="md">
                <Title order={4} mb="md">
                  Quick Actions
                </Title>
                <SimpleGrid cols={1} spacing="sm">
                  <Button
                    component={Link}
                    to={`/properties/${property.id}/units/create`}
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                  >
                    Add Unit
                  </Button>
                  <Button
                    component={Link}
                    to={`/maintenance/create?propertyId=${property.id}`}
                    variant="light"
                    leftSection={<IconTools size={16} />}
                  >
                    Create Maintenance Request
                  </Button>
                  <Button
                    component={Link}
                    to={`/properties/${property.id}/assign-caretaker`}
                    variant="light"
                    leftSection={<IconUser size={16} />}
                  >
                    Assign Caretaker
                  </Button>
                </SimpleGrid>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="units" pt="md">
          <Group position="apart" mb="md">
            <Title order={3}>Units ({propertyUnits.length})</Title>
            <Button
              component={Link}
              to={`/properties/${property.id}/units/create`}
              leftSection={<IconPlus size={16} />}
            >
              Add Unit
            </Button>
          </Group>

          <Grid>
            {propertyUnits.map((unit) => (
              <Grid.Col key={unit.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder radius="md" p="md">
                  <Group position="apart" mb="xs">
                    <Text fw={700} size="lg">
                      Unit {unit.name}
                    </Text>
                    {renderUnitStatusBadge(unit.status)}
                  </Group>

                  <Group position="apart" mb="md">
                    <Text size="sm">
                      {unit.bedrooms > 0 ? `${unit.bedrooms} BR` : "Studio"} /{" "}
                      {unit.bathrooms} BA
                    </Text>
                    <Text size="sm">{unit.sqft} sq ft</Text>
                  </Group>

                  <Group position="apart" mb="md">
                    <Text size="sm" color="dimmed">
                      Monthly Rent
                    </Text>
                    <Text fw={700}>${unit.rent.toLocaleString()}</Text>
                  </Group>

                  {unit.tenant ? (
                    <Box mb="md">
                      <Text size="sm" color="dimmed">
                        Current Tenant
                      </Text>
                      <Group spacing={5}>
                        <IconUser size={16} />
                        <Text size="sm">{unit.tenant}</Text>
                      </Group>
                      <Group spacing={5} mt={5}>
                        <IconCalendar size={16} />
                        <Text size="sm">
                          Lease ends:{" "}
                          {new Date(unit.leaseEnd).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Box>
                  ) : (
                    <Box mb="md">
                      <Text size="sm" color="dimmed">
                        Status
                      </Text>
                      <Badge color="red" variant="light">
                        Vacant
                      </Badge>
                    </Box>
                  )}

                  <Button
                    component={Link}
                    to={`/properties/${property.id}/units/${unit.id}`}
                    variant="light"
                    fullWidth
                  >
                    View Unit
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="md">
          <Group position="apart" mb="md">
            <Title order={3}>Maintenance Requests</Title>
            <Button
              component={Link}
              to={`/maintenance/create?propertyId=${property.id}`}
              leftSection={<IconPlus size={16} />}
            >
              Create Request
            </Button>
          </Group>

          {maintenance.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {maintenance.map((request) => (
                <Card key={request.id} withBorder radius="md" p="md">
                  <Group position="apart" mb="xs">
                    <Text fw={700}>{request.title}</Text>
                    <ThemeIcon
                      color={
                        request.status === "pending"
                          ? "orange"
                          : request.status === "in_progress"
                          ? "blue"
                          : request.status === "scheduled"
                          ? "grape"
                          : "green"
                      }
                      radius="xl"
                    >
                      {request.status === "pending" ? (
                        <IconClock size={18} />
                      ) : request.status === "in_progress" ? (
                        <IconAdjustments size={18} />
                      ) : request.status === "scheduled" ? (
                        <IconCalendar size={18} />
                      ) : (
                        <IconCheck size={18} />
                      )}
                    </ThemeIcon>
                  </Group>

                  <Group position="apart" mb="md">
                    <Text size="sm">Unit {request.unit}</Text>
                    <Text size="sm">
                      Reported:{" "}
                      {new Date(request.reportedDate).toLocaleDateString()}
                    </Text>
                  </Group>

                  <Text size="sm" color="dimmed" mb="md" lineClamp={2}>
                    {request.description}
                  </Text>

                  {renderMaintenanceStatusBadge(
                    request.status,
                    request.priority
                  )}

                  <Group position="apart" mt="md">
                    <Text size="sm">Tenant: {request.tenant}</Text>
                    <Button
                      component={Link}
                      to={`/maintenance/${request.id}`}
                      variant="subtle"
                      compact
                      rightSection={<IconExternalLink size={14} />}
                    >
                      View Details
                    </Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Paper withBorder p="md" radius="md">
              <Text align="center">
                No maintenance requests found for this property.
              </Text>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="financials" pt="md">
          <Paper withBorder p="md" radius="md" mb="xl">
            <Group position="apart" mb="md">
              <Title order={3}>Financial Overview</Title>
              <Button
                component={Link}
                to={`/reports/financial?propertyId=${property.id}`}
                variant="subtle"
                rightSection={<IconExternalLink size={14} />}
              >
                View Detailed Reports
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <Card withBorder p="md" radius="md">
                <Text size="sm" color="dimmed">
                  Monthly Revenue
                </Text>
                <Text fw={700} size="xl" color="green">
                  ${property.financials.monthlyRevenue.toLocaleString()}
                </Text>
              </Card>

              <Card withBorder p="md" radius="md">
                <Text size="sm" color="dimmed">
                  Monthly Expenses
                </Text>
                <Text fw={700} size="xl" color="red">
                  ${property.financials.monthlyExpenses.toLocaleString()}
                </Text>
              </Card>

              <Card withBorder p="md" radius="md">
                <Text size="sm" color="dimmed">
                  Net Income
                </Text>
                <Text fw={700} size="xl" color="blue">
                  ${property.financials.netIncome.toLocaleString()}
                </Text>
              </Card>

              <Card withBorder p="md" radius="md">
                <Text size="sm" color="dimmed">
                  Annual Return
                </Text>
                <Text
                  fw={700}
                  size="xl"
                  color={
                    property.financials.annualReturn > 7 ? "green" : "yellow"
                  }
                >
                  {property.financials.annualReturn}%
                </Text>
              </Card>
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="documents" pt="md">
          <Paper withBorder p="md" radius="md">
            <Group position="apart" mb="md">
              <Title order={3}>Property Documents</Title>
              <Button leftSection={<IconPlus size={16} />}>
                Upload Documents
              </Button>
            </Group>

            <Text>No documents have been uploaded for this property yet.</Text>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default PropertyDetail;
