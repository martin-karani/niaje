import {
  Avatar,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBuildingSkyscraper, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

export default function OrganizationSelect() {
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
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
  const handleOrganizationSelect = async (organizationId: string) => {
    try {
      setSelectedId(organizationId);
      setSelectLoading(true);
      await setOrganization(organizationId);

      // Redirect to dashboard after selection
      navigate("/dashboard");
    } catch (error: any) {
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
      <Container size={600} my={40}>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl" p="xl">
            <Loader size="lg" />
            <Text>Loading your organizations...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // No organizations - show create option
  if (organizations.length === 0) {
    return (
      <Container size={600} my={40}>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl">
            <Title order={2}>Welcome, {user?.name}</Title>
            <Text>You don't have any organizations yet.</Text>
            <Button
              component={Link}
              to="/organizations/create"
              leftSection={<IconPlus size={16} />}
              size="md"
            >
              Create Organization
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Organization selection UI
  return (
    <Container size={800} my={40}>
      <Paper p="xl" radius="md" withBorder>
        <Stack spacing="xl">
          <Title order={2} ta="center">
            Select an Organization
          </Title>
          <Text c="dimmed" ta="center">
            Choose which organization you'd like to access
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {organizations.map((org) => (
              <Card
                key={org.id}
                p="lg"
                radius="md"
                withBorder
                className="stat-card"
                style={{
                  cursor: "pointer",
                  opacity: selectLoading && selectedId !== org.id ? 0.7 : 1,
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
                      <Text size="xs" c="dimmed">
                        {org.subscriptionPlan} Plan
                      </Text>
                    )}
                  </div>
                  {selectLoading && selectedId === org.id && (
                    <Loader size="sm" />
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <Button
            component={Link}
            to="/organizations/create"
            variant="subtle"
            leftSection={<IconPlus size={16} />}
            fullWidth
            disabled={selectLoading}
          >
            Create New Organization
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
