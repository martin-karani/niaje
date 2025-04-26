import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  Menu,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBuilding,
  IconBuildingSkyscraper,
  IconChevronRight,
  IconClock,
  IconDots,
  IconEdit,
  IconFilter,
  IconHome,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUser,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../components/common/page-header";
import { useAuthStore } from "../../state/auth-store";

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
    status: "active",
    owner: "Alpha Investments LLC",
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
    status: "active",
    owner: "Beta Commercial Holdings",
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
    status: "active",
    owner: "Gamma Properties Inc",
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
    status: "active",
    owner: "Delta Retail Management",
  },
  {
    id: "5",
    name: "Park View Apartments",
    address: "222 Park Ave, Miami, FL",
    units: 40,
    occupancyRate: 90,
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "residential",
    status: "active",
    owner: "Epsilon Housing Corp",
  },
  {
    id: "6",
    name: "Tech Hub Offices",
    address: "333 Innovation Way, Austin, TX",
    units: 16,
    occupancyRate: 75,
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "commercial",
    status: "active",
    owner: "Zeta Workspace Solutions",
  },
  {
    id: "7",
    name: "Harborview Townhomes",
    address: "444 Seaside Dr, Seattle, WA",
    units: 18,
    occupancyRate: 97,
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "residential",
    status: "under_construction",
    owner: "Theta Developments",
  },
  {
    id: "8",
    name: "Gourmet District",
    address: "555 Foodie St, Portland, OR",
    units: 10,
    occupancyRate: 80,
    image:
      "https://images.unsplash.com/photo-1577979749830-f1d742b96791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    type: "commercial",
    status: "active",
    owner: "Iota Restaurant Group",
  },
];

const PropertiesList = () => {
  const { user, organization } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalProperties, setTotalProperties] = useState(0);
  const [viewType, setViewType] = useState("grid");

  // Fetch data (simulated)
  useEffect(() => {
    const timer = setTimeout(() => {
      setProperties(sampleProperties);
      setFilteredProperties(sampleProperties);
      setTotalProperties(sampleProperties.length);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Apply filters and search
  useEffect(() => {
    let results = [...properties];

    // Apply search
    if (searchQuery) {
      results = results.filter(
        (property) =>
          property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      results = results.filter((property) => property.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter((property) => property.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "units") {
      results.sort((a, b) => b.units - a.units);
    } else if (sortBy === "occupancy") {
      results.sort((a, b) => b.occupancyRate - a.occupancyRate);
    }

    setFilteredProperties(results);
    setTotalProperties(results.length);
  }, [properties, searchQuery, typeFilter, statusFilter, sortBy]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProperties.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(totalProperties / itemsPerPage);

  const PropertyCard = ({ property }) => (
    <Card
      withBorder
      shadow="sm"
      p="md"
      radius="md"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Card.Section>
        <Image src={property.image} height={180} alt={property.name} />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text fw={700} lineClamp={1}>
          {property.name}
        </Text>
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              to={`/properties/${property.id}`}
              icon={<IconChevronRight size={14} />}
            >
              View Details
            </Menu.Item>
            <Menu.Item
              component={Link}
              to={`/properties/${property.id}/edit`}
              icon={<IconEdit size={14} />}
            >
              Edit Property
            </Menu.Item>
            <Menu.Item
              component={Link}
              to={`/properties/${property.id}/units`}
              icon={<IconBuilding size={14} />}
            >
              Manage Units
            </Menu.Item>
            <Menu.Item
              component={Link}
              to={`/properties/${property.id}/tenants`}
              icon={<IconUsers size={14} />}
            >
              View Tenants
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" icon={<IconTrash size={14} />}>
              Delete Property
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Group spacing={8} mt={5}>
        <Badge color={property.type === "residential" ? "blue" : "green"}>
          {property.type === "residential" ? "Residential" : "Commercial"}
        </Badge>
        <Badge
          color={
            property.status === "active"
              ? "green"
              : property.status === "under_construction"
              ? "yellow"
              : "gray"
          }
        >
          {property.status === "active"
            ? "Active"
            : property.status === "under_construction"
            ? "Under Construction"
            : "Inactive"}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" mt="xs" lineClamp={2}>
        <Group spacing={5}>
          <IconMapPin size={14} />
          <span>{property.address}</span>
        </Group>
      </Text>

      <Text size="sm" color="dimmed" mt={5}>
        <Group spacing={5}>
          <IconUser size={14} />
          <span>Owner: {property.owner}</span>
        </Group>
      </Text>

      <Group position="apart" mt="md">
        <Text size="sm">
          <b>{property.units}</b> Units
        </Text>
        <Badge
          variant="outline"
          color={
            property.occupancyRate > 90
              ? "green"
              : property.occupancyRate > 80
              ? "blue"
              : "yellow"
          }
        >
          {property.occupancyRate}% Occupied
        </Badge>
      </Group>

      <Button
        component={Link}
        to={`/properties/${property.id}`}
        variant="light"
        color="blue"
        fullWidth
        mt="md"
        style={{ marginTop: "auto" }}
      >
        View Property
      </Button>
    </Card>
  );

  const PropertyRow = ({ property }) => (
    <Card withBorder p="sm" radius="md" mb="sm">
      <Group position="apart" noWrap>
        <Group noWrap spacing="md">
          <Image
            src={property.image}
            width={120}
            height={80}
            radius="md"
            alt={property.name}
          />
          <div>
            <Text fw={700}>{property.name}</Text>
            <Text
              size="sm"
              color="dimmed"
              style={{ display: "flex", alignItems: "center" }}
            >
              <IconMapPin size={14} style={{ marginRight: 5 }} />
              {property.address}
            </Text>
            <Group spacing={8} mt={5}>
              <Badge
                size="sm"
                color={property.type === "residential" ? "blue" : "green"}
              >
                {property.type === "residential" ? "Residential" : "Commercial"}
              </Badge>
              <Badge
                size="sm"
                color={property.status === "active" ? "green" : "yellow"}
              >
                {property.status === "active" ? "Active" : "Under Construction"}
              </Badge>
              <Text size="xs" fw={500}>
                {property.units} Units
              </Text>
              <Text size="xs" fw={500}>
                {property.occupancyRate}% Occupied
              </Text>
            </Group>
          </div>
        </Group>

        <Group spacing="xs">
          <Button
            component={Link}
            to={`/properties/${property.id}`}
            variant="light"
            compact
          >
            View
          </Button>
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                to={`/properties/${property.id}/edit`}
                icon={<IconEdit size={14} />}
              >
                Edit Property
              </Menu.Item>
              <Menu.Item
                component={Link}
                to={`/properties/${property.id}/units`}
                icon={<IconBuilding size={14} />}
              >
                Manage Units
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" icon={<IconTrash size={14} />}>
                Delete Property
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Card>
  );

  return (
    <Container size="lg" mt="md">
      <PageHeader
        title="Properties"
        subtitle={`Manage your ${organization?.name || ""} property portfolio`}
        actions={
          <Button
            component={Link}
            to="/properties/create"
            leftSection={<IconPlus size={16} />}
          >
            Add Property
          </Button>
        }
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Properties" },
        ]}
      />

      {/* Filters */}
      <Paper withBorder p="md" radius="md" mb="xl">
        <Group position="apart" mb="md">
          <TextInput
            placeholder="Search properties..."
            icon={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flexGrow: 1 }}
          />

          <Group spacing="xs">
            <Select
              placeholder="Property Type"
              icon={<IconFilter size={16} />}
              data={[
                { value: "all", label: "All Types" },
                { value: "residential", label: "Residential" },
                { value: "commercial", label: "Commercial" },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 150 }}
            />

            <Select
              placeholder="Status"
              icon={<IconFilter size={16} />}
              data={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "under_construction", label: "Under Construction" },
                { value: "inactive", label: "Inactive" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            />

            <Select
              placeholder="Sort By"
              data={[
                { value: "name", label: "Name" },
                { value: "units", label: "Unit Count" },
                { value: "occupancy", label: "Occupancy Rate" },
              ]}
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 140 }}
            />

            <Tabs value={viewType} onChange={setViewType} radius="xs">
              <Tabs.List>
                <Tabs.Tab
                  value="grid"
                  icon={<IconBuildingSkyscraper size={16} />}
                />
                <Tabs.Tab value="list" icon={<IconBuilding size={16} />} />
              </Tabs.List>
            </Tabs>
          </Group>
        </Group>

        <Group position="apart">
          <Text size="sm" color="dimmed">
            Showing {currentItems.length} of {totalProperties} properties
          </Text>

          <Group spacing={5}>
            <Text size="sm" color="dimmed">
              Quick filters:
            </Text>
            <Button
              compact
              variant="light"
              size="xs"
              leftSection={<IconHome size={14} />}
              onClick={() => setTypeFilter("residential")}
            >
              Residential
            </Button>
            <Button
              compact
              variant="light"
              size="xs"
              leftSection={<IconBuildingSkyscraper size={14} />}
              onClick={() => setTypeFilter("commercial")}
            >
              Commercial
            </Button>
            <Button
              compact
              variant="light"
              size="xs"
              leftSection={<IconUserCheck size={14} />}
              onClick={() => {
                setStatusFilter("active");
                setSortBy("occupancy");
              }}
            >
              Highest Occupancy
            </Button>
            <Button
              compact
              variant="light"
              size="xs"
              leftSection={<IconClock size={14} />}
              onClick={() => setStatusFilter("under_construction")}
            >
              Under Construction
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Property List */}
      {isLoading ? (
        viewType === "grid" ? (
          <Grid>
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                  <Skeleton height={350} radius="md" />
                </Grid.Col>
              ))}
          </Grid>
        ) : (
          <Stack>
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} height={100} radius="md" />
              ))}
          </Stack>
        )
      ) : currentItems.length > 0 ? (
        viewType === "grid" ? (
          <Grid>
            {currentItems.map((property) => (
              <Grid.Col key={property.id} span={{ base: 12, sm: 6, md: 4 }}>
                <PropertyCard property={property} />
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Stack>
            {currentItems.map((property) => (
              <PropertyRow key={property.id} property={property} />
            ))}
          </Stack>
        )
      ) : (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" spacing="md">
            <ThemeIcon size={60} radius={100} color="blue" variant="light">
              <IconBuildingSkyscraper size={30} />
            </ThemeIcon>
            <Text ta="center" fw={500} fz="lg">
              No properties found
            </Text>
            <Text ta="center" c="dimmed" maw={500}>
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Start by adding properties to your portfolio to track units, tenants, and income."}
            </Text>
            {!searchQuery && typeFilter === "all" && statusFilter === "all" && (
              <Button
                component={Link}
                to="/properties/create"
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                Add Your First Property
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Group position="right" mt="xl">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
            withEdges
          />
        </Group>
      )}
    </Container>
  );
};

export default PropertiesList;
