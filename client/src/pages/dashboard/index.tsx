import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  List,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBuildingSkyscraper,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCurrencyDollar,
  IconFileDescription,
  IconHome,
  IconPlus,
  IconTools,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatsCard } from "../../components/ui/stats-card";
import { useAuthStore } from "../../state/auth-store";

// Mock data - would be replaced with real API data
const occupancyData = [
  { name: "Jan", occupancy: 82 },
  { name: "Feb", occupancy: 85 },
  { name: "Mar", occupancy: 90 },
  { name: "Apr", occupancy: 88 },
  { name: "May", occupancy: 92 },
  { name: "Jun", occupancy: 95 },
  { name: "Jul", occupancy: 94 },
  { name: "Aug", occupancy: 90 },
  { name: "Sep", occupancy: 88 },
  { name: "Oct", occupancy: 85 },
  { name: "Nov", occupancy: 82 },
  { name: "Dec", occupancy: 80 },
];

const incomeData = [
  { name: "Jan", income: 15000, expenses: 5000 },
  { name: "Feb", income: 15500, expenses: 5200 },
  { name: "Mar", income: 16000, expenses: 5100 },
  { name: "Apr", income: 16200, expenses: 5300 },
  { name: "May", income: 16500, expenses: 5400 },
  { name: "Jun", income: 16800, expenses: 5500 },
  { name: "Jul", income: 17000, expenses: 5600 },
  { name: "Aug", income: 17200, expenses: 5700 },
  { name: "Sep", income: 17500, expenses: 5800 },
  { name: "Oct", income: 17800, expenses: 5900 },
  { name: "Nov", income: 18000, expenses: 6000 },
  { name: "Dec", income: 18500, expenses: 6100 },
];

const maintenanceData = [
  { name: "Plumbing", value: 25 },
  { name: "Electrical", value: 15 },
  { name: "HVAC", value: 20 },
  { name: "Appliances", value: 18 },
  { name: "Structural", value: 5 },
  { name: "Other", value: 17 },
];

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

// Sample properties - would be fetched from API
const sampleProperties = [
  {
    id: "1",
    name: "Sunset Apartments",
    address: "123 Main St, New York, NY",
    units: 24,
    occupancyRate: 92,
    image:
      "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "residential",
  },
  {
    id: "2",
    name: "Heritage Office Tower",
    address: "456 Business Ave, Chicago, IL",
    units: 12,
    occupancyRate: 85,
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "commercial",
  },
  {
    id: "3",
    name: "Riverside Condos",
    address: "789 River Rd, Boston, MA",
    units: 36,
    occupancyRate: 95,
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "residential",
  },
  {
    id: "4",
    name: "Downtown Retail Plaza",
    address: "101 Market St, San Francisco, CA",
    units: 8,
    occupancyRate: 88,
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "commercial",
  },
];

// Recent tasks/items that need attention
const maintenanceRequests = [
  {
    id: 1,
    title: "Water leak in bathroom",
    status: "pending",
    unit: "Apt 101",
    priority: "high",
    property: "Sunset Apartments",
  },
  {
    id: 2,
    title: "AC not working",
    status: "in_progress",
    unit: "Apt 205",
    priority: "medium",
    property: "Riverside Condos",
  },
  {
    id: 3,
    title: "Light fixture broken",
    status: "scheduled",
    unit: "Apt 302",
    priority: "low",
    property: "Sunset Apartments",
  },
  {
    id: 4,
    title: "Fridge not cooling",
    status: "pending",
    unit: "Apt 104",
    priority: "high",
    property: "Riverside Condos",
  },
];

const upcomingLeases = [
  {
    id: 1,
    tenant: "John Smith",
    unit: "Apt 101",
    endDate: "2025-05-15",
    status: "active",
    property: "Sunset Apartments",
  },
  {
    id: 2,
    tenant: "Mary Johnson",
    unit: "Apt 205",
    endDate: "2025-06-01",
    status: "active",
    property: "Riverside Condos",
  },
  {
    id: 3,
    tenant: "Robert Davis",
    unit: "Apt 302",
    endDate: "2025-06-15",
    status: "renewal_pending",
    property: "Sunset Apartments",
  },
];

const Dashboard = () => {
  const { user, organization, team } = useAuthStore();
  const [timeRange, setTimeRange] = useState("1year");
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupancyRate: 0,
    activeLeases: 0,
  });

  // Simulate fetching data
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setProperties(sampleProperties);
      setStats({
        totalProperties: sampleProperties.length,
        totalUnits: sampleProperties.reduce((acc, curr) => acc + curr.units, 0),
        occupancyRate: 92,
        activeLeases: 24,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return (
          <ThemeIcon color="orange" size={24} radius="xl">
            <IconClock size={16} />
          </ThemeIcon>
        );
      case "in_progress":
        return (
          <ThemeIcon color="blue" size={24} radius="xl">
            <IconAlertTriangle size={16} />
          </ThemeIcon>
        );
      case "scheduled":
      case "active":
      case "completed":
        return (
          <ThemeIcon color="teal" size={24} radius="xl">
            <IconCheck size={16} />
          </ThemeIcon>
        );
      default:
        return (
          <ThemeIcon color="gray" size={24} radius="xl">
            <IconCheck size={16} />
          </ThemeIcon>
        );
    }
  };

  const PropertyCard = ({ property }) => (
    <Card
      withBorder
      p="md"
      radius="md"
      shadow="sm"
      component={Link}
      to={`/properties/${property.id}`}
      style={{
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Card.Section>
        <Image src={property.image} height={160} alt={property.name} />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text fw={700}>{property.name}</Text>
        <Badge color={property.type === "residential" ? "blue" : "green"}>
          {property.type === "residential" ? "Residential" : "Commercial"}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" mb="md">
        {property.address}
      </Text>

      <Group position="apart">
        <Text size="sm">
          <b>{property.units}</b> Units
        </Text>
        <Text size="sm">
          Occupancy: <b>{property.occupancyRate}%</b>
        </Text>
      </Group>

      <Button
        variant="light"
        fullWidth
        mt="md"
        rightSection={<IconChevronRight size={14} />}
      >
        View Property
      </Button>
    </Card>
  );

  return (
    <Container size="lg" mt="md">
      <Group position="apart" mb="lg">
        <div>
          <Title order={2} mb={5}>
            Dashboard
          </Title>
          <Text c="dimmed">Welcome back, {user?.name}!</Text>
        </div>

        <Select
          value={timeRange}
          onChange={(value) => setTimeRange(value || "1year")}
          data={[
            { value: "30days", label: "Last 30 Days" },
            { value: "90days", label: "Last 90 Days" },
            { value: "1year", label: "Last 12 Months" },
            { value: "ytd", label: "Year to Date" },
          ]}
          w={200}
        />
      </Group>

      {/* Stats cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
        {isLoading ? (
          <>
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
          </>
        ) : (
          <>
            <StatsCard
              title="Properties"
              value={stats.totalProperties.toString()}
              subtitle="Managed by your agency"
              icon={<IconHome size={24} />}
              color="blue"
              onClick={() => navigator.navigate("/properties")}
            />

            <StatsCard
              title="Occupancy Rate"
              value={`${stats.occupancyRate}%`}
              subtitle={`${stats.totalUnits} total units`}
              icon={<IconBuildingSkyscraper size={24} />}
              color="green"
              progress={{
                value: stats.occupancyRate,
                color: "green",
                size: 60,
              }}
            />

            <StatsCard
              title="Active Leases"
              value={stats.activeLeases.toString()}
              subtitle="15 pending applications"
              icon={<IconFileDescription size={24} />}
              color="violet"
            />

            <StatsCard
              title="Monthly Income"
              value="$45,750"
              subtitle="+5% from last month"
              icon={<IconCurrencyDollar size={24} />}
              color="cyan"
              change={{
                value: 5,
                positive: true,
                label: "vs last month",
              }}
            />
          </>
        )}
      </SimpleGrid>

      {/* Properties section */}
      <Paper withBorder p="md" radius="md" mb="xl">
        <Group position="apart" mb="md">
          <Title order={4}>Your Properties</Title>
          <Button
            component={Link}
            to="/properties"
            variant="subtle"
            rightSection={<IconChevronRight size={16} />}
          >
            View All Properties
          </Button>
        </Group>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Skeleton height={300} radius="md" />
            <Skeleton height={300} radius="md" />
            <Skeleton height={300} radius="md" />
            <Skeleton height={300} radius="md" />
          </SimpleGrid>
        ) : properties.length > 0 ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </SimpleGrid>

            <Button
              component={Link}
              to="/properties/create"
              mt="lg"
              leftSection={<IconPlus size={16} />}
              variant="outline"
              fullWidth
            >
              Add New Property
            </Button>
          </>
        ) : (
          <Stack align="center" py="xl" spacing="md">
            <ThemeIcon size={60} radius={100} color="blue" variant="light">
              <IconBuildingSkyscraper size={30} />
            </ThemeIcon>
            <Text ta="center" fw={500} fz="lg">
              No properties yet
            </Text>
            <Text ta="center" c="dimmed" maw={400}>
              Start by adding properties to your portfolio to track units,
              tenants, and income.
            </Text>
            <Button
              component={Link}
              to="/properties/create"
              leftSection={<IconPlus size={16} />}
            >
              Add Your First Property
            </Button>
          </Stack>
        )}
      </Paper>

      {/* Charts and activity tabs */}
      <Grid>
        {/* Charts section */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Tabs defaultValue="income">
            <Tabs.List mb="md">
              <Tabs.Tab value="income">Income & Expenses</Tabs.Tab>
              <Tabs.Tab value="occupancy">Occupancy Trends</Tabs.Tab>
              <Tabs.Tab value="maintenance">Maintenance Analysis</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="income">
              <Paper withBorder p="md" radius="md" h={400}>
                <Title order={5} mb="md">
                  Income vs Expenses (Annual)
                </Title>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#339af0" name="Income" />
                    <Bar dataKey="expenses" fill="#fa5252" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="occupancy">
              <Paper withBorder p="md" radius="md" h={400}>
                <Title order={5} mb="md">
                  Occupancy Rate Trend
                </Title>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#339af0"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="maintenance">
              <Paper withBorder p="md" radius="md" h={400}>
                <Title order={5} mb="md">
                  Maintenance Requests by Category
                </Title>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={maintenanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {maintenanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        {/* Activity and attention needed section */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Tabs defaultValue="maintenance">
            <Tabs.List mb="md">
              <Tabs.Tab value="maintenance" icon={<IconTools size={14} />}>
                Maintenance
              </Tabs.Tab>
              <Tabs.Tab value="leases" icon={<IconFileDescription size={14} />}>
                Leases
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="maintenance">
              <Paper
                withBorder
                p="md"
                radius="md"
                h={400}
                style={{ overflow: "auto" }}
              >
                <Group position="apart" mb="xs">
                  <Title order={5}>Recent Maintenance</Title>
                  <Badge color="blue">{maintenanceRequests.length} New</Badge>
                </Group>

                <List spacing="md" size="sm" mb="xs">
                  {maintenanceRequests.map((request) => (
                    <List.Item
                      key={request.id}
                      icon={getStatusIcon(request.status)}
                    >
                      <Box>
                        <Group position="apart">
                          <Text size="sm" fw={500}>
                            {request.title}
                          </Text>
                          <Badge
                            color={
                              request.priority === "high"
                                ? "red"
                                : request.priority === "medium"
                                ? "yellow"
                                : "green"
                            }
                            size="xs"
                          >
                            {request.priority}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed">
                          {request.property} • {request.unit}
                        </Text>
                      </Box>
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link}
                  to="/maintenance"
                  variant="light"
                  fullWidth
                  mt="md"
                >
                  View All Maintenance Requests
                </Button>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="leases">
              <Paper
                withBorder
                p="md"
                radius="md"
                h={400}
                style={{ overflow: "auto" }}
              >
                <Group position="apart" mb="xs">
                  <Title order={5}>Upcoming Lease Expirations</Title>
                  <Badge color="red">3 Soon</Badge>
                </Group>

                <List spacing="md" size="sm">
                  {upcomingLeases.map((lease) => (
                    <List.Item key={lease.id}>
                      <Box>
                        <Group position="apart">
                          <Text size="sm" fw={500}>
                            {lease.tenant}
                          </Text>
                          <Badge
                            color={
                              lease.status === "active" ? "green" : "orange"
                            }
                            size="xs"
                          >
                            {lease.status === "active"
                              ? "Active"
                              : "Renewal Pending"}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed">
                          {lease.property} • {lease.unit} • Expires:{" "}
                          {new Date(lease.endDate).toLocaleDateString()}
                        </Text>
                      </Box>
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link}
                  to="/leases"
                  variant="light"
                  fullWidth
                  mt="md"
                >
                  View All Leases
                </Button>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Dashboard;
