import {
  Badge,
  Box,
  Card,
  Grid,
  Group,
  List,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBuildingSkyscraper,
  IconCheck,
  IconClock,
  IconCurrencyDollar,
  IconHome,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
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
import { useAuthStore } from "../../state/auth-store";

// Mock data for the dashboard
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

const maintenanceRequests = [
  {
    id: 1,
    title: "Water leak in bathroom",
    status: "pending",
    unit: "Apt 101",
    priority: "high",
  },
  {
    id: 2,
    title: "AC not working",
    status: "in progress",
    unit: "Apt 205",
    priority: "medium",
  },
  {
    id: 3,
    title: "Light fixture broken",
    status: "scheduled",
    unit: "Apt 302",
    priority: "low",
  },
  {
    id: 4,
    title: "Fridge not cooling",
    status: "pending",
    unit: "Apt 104",
    priority: "high",
  },
];

const upcomingLeases = [
  {
    id: 1,
    tenant: "John Smith",
    unit: "Apt 101",
    endDate: "2025-05-15",
    status: "active",
  },
  {
    id: 2,
    tenant: "Mary Johnson",
    unit: "Apt 205",
    endDate: "2025-06-01",
    status: "active",
  },
  {
    id: 3,
    tenant: "Robert Davis",
    unit: "Apt 302",
    endDate: "2025-06-15",
    status: "renewal pending",
  },
];

// Dashboard stats card component
function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder p="lg" radius="md">
      <Group>
        <ThemeIcon size="xl" color={color} variant="light" radius="md">
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" color="dimmed">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          {description && (
            <Text size="xs" color="dimmed">
              {description}
            </Text>
          )}
        </div>
      </Group>
    </Card>
  );
}

export default function Dashboard() {
  const { user, organization } = useAuthStore();
  const [timeRange, setTimeRange] = useState("1year");

  return (
    <Stack spacing="lg">
      <Group position="apart">
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
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <StatCard
          title="Properties"
          value="24"
          description="+2 in the last month"
          icon={<IconHome size={24} />}
          color="blue"
        />

        <StatCard
          title="Occupancy Rate"
          value="92%"
          description="152 out of 165 units"
          icon={<IconBuildingSkyscraper size={24} />}
          color="green"
        />

        <StatCard
          title="Active Tenants"
          value="172"
          description="15 pending applications"
          icon={<IconUsers size={24} />}
          color="violet"
        />

        <StatCard
          title="Monthly Income"
          value="$45,750"
          description="+5% from last month"
          icon={<IconCurrencyDollar size={24} />}
          color="cyan"
        />
      </SimpleGrid>

      {/* Charts row */}
      <Grid>
        {/* Occupancy trend */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              Occupancy Rate Trend
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[70, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="var(--mantine-color-primary-6)"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Income vs expenses */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              Income vs Expenses
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="income" fill="var(--mantine-color-primary-6)" />
                <Bar dataKey="expenses" fill="var(--mantine-color-red-6)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Bottom row */}
      <Grid>
        {/* Maintenance requests distribution */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">
              Maintenance Categories
            </Title>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={maintenanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
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
        </Grid.Col>

        {/* Maintenance requests */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Group position="apart" mb="xs">
              <Title order={4}>Recent Maintenance</Title>
              <Badge color="blue">4 New</Badge>
            </Group>

            <List spacing="xs" size="sm" center>
              {maintenanceRequests.map((request) => (
                <List.Item
                  key={request.id}
                  icon={
                    request.status === "pending" ? (
                      <ThemeIcon color="orange" size={24} radius="xl">
                        <IconClock size={16} />
                      </ThemeIcon>
                    ) : request.status === "in progress" ? (
                      <ThemeIcon color="blue" size={24} radius="xl">
                        <IconAlertTriangle size={16} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon color="teal" size={24} radius="xl">
                        <IconCheck size={16} />
                      </ThemeIcon>
                    )
                  }
                >
                  <Box>
                    <Text size="sm" fw={500}>
                      {request.title}
                    </Text>
                    <Text size="xs" color="dimmed">
                      {request.unit} • Priority: {request.priority}
                    </Text>
                  </Box>
                </List.Item>
              ))}
            </List>
          </Paper>
        </Grid.Col>

        {/* Upcoming lease expirations */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Group position="apart" mb="xs">
              <Title order={4}>Upcoming Lease Expirations</Title>
              <Badge color="red">3 Soon</Badge>
            </Group>

            <List spacing="xs" size="sm" center>
              {upcomingLeases.map((lease) => (
                <List.Item key={lease.id}>
                  <Box>
                    <Group position="apart">
                      <Text size="sm" fw={500}>
                        {lease.tenant}
                      </Text>
                      <Badge
                        color={lease.status === "active" ? "green" : "orange"}
                        size="sm"
                      >
                        {lease.status}
                      </Badge>
                    </Group>
                    <Text size="xs" color="dimmed">
                      {lease.unit} • Expires:{" "}
                      {new Date(lease.endDate).toLocaleDateString()}
                    </Text>
                  </Box>
                </List.Item>
              ))}
            </List>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
