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
  IconCurrencyDollar,
  IconPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
  } = useAuthStore();
  const navigate = useNavigate();
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    console.log("OrganizationSelection", {
      user,
      organizations,
      isLoading,
      error,
    });

    // If user isn't authenticated, redirect to login
    if (!user) {
      navigate("/auth/sign-in");
      return;
    }

    // Get organizations if not already loaded
    if (organizations.length === 0 && !isLoading) {
      fetchOrganizations();
    }

    // If user has only one organization, select it automatically
    if (organizations.length === 1 && !isLoading) {
      handleOrganizationSelect(organizations[0].id);
    }
  }, [user, organizations, isLoading, navigate, fetchOrganizations]);

  // Handle organization selection
  const handleOrganizationSelect = async (organizationId) => {
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
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to select organization",
        color: "red",
      });
    } finally {
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
              <ThemeIcon size={80} radius={40} mb={20} mx="auto">
                <IconBuildingSkyscraper size={40} />
              </ThemeIcon>
              <Title order={2} mb="md">
                Welcome to PropManage Pro
              </Title>
              <Text size="lg" color="dimmed" mb="xl" maw={600} mx="auto">
                Create your first agency to start managing properties more
                efficiently. Our platform helps property management companies
                streamline their operations and grow their business.
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

            <Divider
              label="Why choose PropManage Pro?"
              labelPosition="center"
            />

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt="md">
              {[
                {
                  icon: <IconBuildingSkyscraper size={32} />,
                  title: "Manage Your Properties",
                  description:
                    "Streamline management across your entire property portfolio with powerful tools designed specifically for property managers.",
                },
                {
                  icon: <IconUsers size={32} />,
                  title: "Tenant Satisfaction",
                  description:
                    "Improve tenant experiences with efficient maintenance requests and communication tools that keep your clients happy.",
                },
                {
                  icon: <IconCurrencyDollar size={32} />,
                  title: "Increase Revenue",
                  description:
                    "Track payments, manage finances, and identify opportunities to increase your property management revenue.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  shadow="md"
                  radius="md"
                  p="xl"
                  className="feature-card"
                >
                  <ThemeIcon
                    size={50}
                    radius={50}
                    mb="md"
                    variant="light"
                    color="blue"
                  >
                    {feature.icon}
                  </ThemeIcon>
                  <Text fw={600} size="lg" mb="xs">
                    {feature.title}
                  </Text>
                  <Text size="sm" color="dimmed">
                    {feature.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>

            <Card p="lg" radius="md" withBorder mt="lg">
              <Group position="apart">
                <div>
                  <Text fw={700}>Free 14-day trial</Text>
                  <Text size="sm" color="dimmed">
                    Get started with all premium features
                  </Text>
                </div>
                <ThemeIcon variant="light" radius="xl" size="xl" color="teal">
                  <IconCheck size={20} />
                </ThemeIcon>
              </Group>
            </Card>
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
                  cursor: "pointer",
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
                    {!org.logo && <IconBuildingSkyscraper size={24} />}
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
