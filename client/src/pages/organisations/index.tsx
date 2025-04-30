import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBuildingSkyscraper,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

const OrganizationSelection = () => {
  const {
    user,
    organizations,
    isLoading,
    error,
    fetchOrganizations,
    setOrganization,
    isInitialized,
  } = useAuthStore();

  const navigate = useNavigate();
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only proceed if auth is initialized
    if (!isInitialized) return;

    // If user isn't authenticated, redirect to login
    if (!user && !isLoading) {
      navigate("/auth/sign-in");
      return;
    }

    // Get organizations if not already loaded and not currently loading
    if (
      user &&
      organizations.length === 0 &&
      !isLoading &&
      !hasFetchedRef.current
    ) {
      hasFetchedRef.current = true;
      (async () => {
        try {
          await fetchOrganizations();
        } catch (error) {
          console.error("Error fetching organizations:", error);
        }
      })();
    }
  }, [user, isLoading]);

  // Separate effect for auto-selecting a single organization
  useEffect(() => {
    if (!isLoading && organizations.length === 1 && user && !selectLoading) {
      handleOrganizationSelect(organizations[0].id);
    }
  }, [organizations, isLoading, user]);

  // Handle organization selection
  const handleOrganizationSelect = async (organizationId) => {
    if (selectLoading) return; // Prevent multiple calls

    try {
      setSelectedId(organizationId);
      setSelectLoading(true);
      await setOrganization(organizationId);

      // Redirect to dashboard after selection
      navigate("/dashboard");

      // Show success notification
      notifications.show({
        title: "Organization Selected",
        message: "You are now working in this organization",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to select organization",
        color: "red",
      });
      setSelectLoading(false);
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <Container size="lg" my={40} className="org-selection-container">
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl" p="xl">
            <Loader size="lg" />
            <Text>Loading your organizations...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // When user has no organizations - show marketing content
  if (organizations.length === 0) {
    return (
      <Container size="lg" my={40} className="org-selection-container">
        <Paper p="xl" radius="md" withBorder>
          <Stack spacing="xl">
            <Box
              className="empty-state"
              py="xl"
              style={{ textAlign: "center" }}
            >
              <ThemeIcon size={80} radius={40} mb={20} mx="auto" color="blue">
                <IconBuildingSkyscraper size={40} />
              </ThemeIcon>
              <Title order={2} mb="md">
                Welcome to PropManage Pro
              </Title>
              <Text size="lg" color="dimmed" mb="xl" maw={600} mx="auto">
                You don't have any organizations yet. Create your first agency
                to start managing properties more efficiently, or wait to be
                invited to an existing organization.
              </Text>
              <Button
                component={Link}
                to="/organizations/create"
                leftSection={<IconPlus size={16} />}
                size="lg"
                mb="xl"
              >
                Create Your Agency
              </Button>
            </Box>

            {/* Rest of the marketing content remains the same */}
            {/* ... */}
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Organization selection UI for users with existing organizations
  return (
    <Container size="lg" my={40} className="org-selection-container">
      <Paper p="xl" radius="md" withBorder>
        <Stack spacing="xl">
          <Title order={2} ta="center">
            Select Your Agency
          </Title>
          <Text c="dimmed" ta="center" mb="lg">
            Choose which agency you'd like to manage
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {organizations.map((org) => (
              <Card
                key={org.id}
                p="lg"
                radius="md"
                withBorder
                style={{
                  opacity: selectLoading && selectedId !== org.id ? 0.7 : 1,
                  cursor: selectLoading ? "default" : "pointer",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
                  },
                }}
                onClick={() =>
                  !selectLoading && handleOrganizationSelect(org.id)
                }
              >
                <Group>
                  <Avatar src={org.logo} size="lg" radius="md" color="blue">
                    {!org.logo && org.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text fw={700} size="lg">
                      {org.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      @{org.slug}
                    </Text>
                    {org.subscriptionPlan && (
                      <Badge color="blue" variant="light" size="sm">
                        {org.subscriptionPlan} Plan
                      </Badge>
                    )}
                  </div>
                  {selectLoading && selectedId === org.id && (
                    <Loader size="sm" />
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <Divider my="md" />

          <Group position="center">
            <Button
              component={Link}
              to="/organizations/create"
              variant="outline"
              leftSection={<IconPlus size={16} />}
              fullWidth
              disabled={selectLoading}
            >
              Create New Agency
            </Button>
          </Group>

          <Text size="sm" color="dimmed" ta="center">
            Need to manage multiple property management agencies? Create
            additional organizations to keep your business units separate and
            organized.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
};

export default OrganizationSelection;
