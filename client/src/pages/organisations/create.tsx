import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconBuildingSkyscraper,
  IconCheck,
  IconCircleCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

export default function OrganizationCreate() {
  const navigate = useNavigate();
  const { user, createOrganization } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const form = useForm({
    initialValues: {
      name: "",
      slug: "",
      timezone: "UTC",
      currency: "USD",
      logo: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Agency name must be at least 2 characters" : null,
      slug: (value) => {
        if (!value) return null; // Optional
        if (value.length < 2) return "Identifier must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value))
          return "Can only contain lowercase letters, numbers, and hyphens";
        return null;
      },
    },
  });

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    try {
      const organization = await createOrganization({
        name: values.name,
        slug: values.slug || undefined,
        timezone: values.timezone,
        currency: values.currency,
        logo: values.logo || undefined,
      });

      notifications.show({
        title: "Success",
        message: `${values.name} has been created successfully!`,
        color: "green",
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create agency",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Feature benefits list
  const benefits = [
    "Manage unlimited properties and units",
    "Track tenant information and leases",
    "Process maintenance requests efficiently",
    "Generate financial reports and insights",
    "Team-based access control for your staff",
    "Document storage and management",
    "Communication tools with tenants and owners",
  ];

  return (
    <Container size={1100} my={40}>
      <Paper p="xl" radius="md" withBorder>
        <Grid gutter={50}>
          {/* Left side - Form */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={2} mb="xl">
              Create Your Agency
            </Title>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack spacing="md">
                <TextInput
                  required
                  label="Agency Name"
                  placeholder="Enter your property management company name"
                  description="This will be visible to your clients and team members"
                  {...form.getInputProps("name")}
                />

                <TextInput
                  label="Agency Identifier"
                  placeholder="e.g. acme-properties"
                  description="Used for your account URL (optional, we'll generate one if left blank)"
                  {...form.getInputProps("slug")}
                />

                <TextInput
                  label="Logo URL"
                  placeholder="https://example.com/logo.png"
                  description="Enter a URL to your company logo (optional)"
                  {...form.getInputProps("logo")}
                />

                <Group position="right" mt="xl">
                  <Button
                    type="submit"
                    leftSection={<IconDeviceFloppy size={16} />}
                    loading={isLoading}
                    size="md"
                  >
                    Create Agency
                  </Button>
                </Group>
              </Stack>
            </form>
          </Grid.Col>

          {/* Right side - Benefits */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder radius="md" p="xl" style={{ height: "100%" }}>
              <ThemeIcon size={60} radius={30} mb="lg">
                <IconBuildingSkyscraper size={30} />
              </ThemeIcon>

              <Title order={3} mb="md">
                Take Control of Your Property Management Business
              </Title>

              <Text color="dimmed" mb="xl">
                Set up your agency in minutes and unlock powerful tools
                specifically designed for property management companies.
              </Text>

              <List
                spacing="sm"
                size="md"
                center
                icon={
                  <ThemeIcon color="teal" size={24} radius="xl">
                    <IconCircleCheck size={16} />
                  </ThemeIcon>
                }
              >
                {benefits.map((benefit, index) => (
                  <List.Item key={index}>{benefit}</List.Item>
                ))}
              </List>

              <Box mt="xl">
                <Group position="apart" mb="xs">
                  <Text weight={700}>Free 14-day trial</Text>
                  <ThemeIcon variant="light" radius="xl" size="md" color="teal">
                    <IconCheck size={16} />
                  </ThemeIcon>
                </Group>
                <Text size="sm" color="dimmed">
                  Get started with all premium features included in your trial.
                  No credit card required.
                </Text>
              </Box>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}
