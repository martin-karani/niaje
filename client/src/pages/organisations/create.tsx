import {
  Box,
  Button,
  Card,
  Container,
  FileInput,
  Grid,
  Group,
  List,
  Paper,
  Select,
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
  IconCircleCheck,
  IconCurrencyDollar,
  IconDeviceFloppy,
  IconPhoto,
  IconWorld,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

const OrganizationCreate = () => {
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
      logo: null,
      address: "",
    },
    validate: {
      name: (value) =>
        value.length < 2
          ? "Organization name must be at least 2 characters"
          : null,
      slug: (value) => {
        if (!value) return null; // Optional
        if (value.length < 2) return "Identifier must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value))
          return "Can only contain lowercase letters, numbers, and hyphens";
        return null;
      },
    },
  });

  // List of common timezones
  const timezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "London, Edinburgh" },
    { value: "Europe/Paris", label: "Paris, Berlin, Rome" },
    { value: "Asia/Tokyo", label: "Tokyo, Osaka" },
    { value: "Asia/Shanghai", label: "Shanghai, Beijing" },
    { value: "Australia/Sydney", label: "Sydney, Melbourne" },
  ];

  // List of currencies
  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "CAD", label: "Canadian Dollar (C$)" },
    { value: "AUD", label: "Australian Dollar (A$)" },
    { value: "JPY", label: "Japanese Yen (¥)" },
    { value: "CNY", label: "Chinese Yuan (¥)" },
    { value: "INR", label: "Indian Rupee (₹)" },
  ];

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const organization = await createOrganization({
        name: values.name,
        slug: values.slug || undefined,
        timezone: values.timezone,
        currency: values.currency,
        logo: values.logo || undefined,
        address: values.address || undefined,
      });

      notifications.show({
        title: "Success",
        message: `${values.name} has been created successfully!`,
        color: "green",
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create organization",
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

                <Select
                  label="Timezone"
                  placeholder="Select your timezone"
                  data={timezones}
                  searchable
                  clearable={false}
                  icon={<IconWorld size={16} />}
                  {...form.getInputProps("timezone")}
                />

                <Select
                  label="Currency"
                  placeholder="Select your default currency"
                  data={currencies}
                  searchable
                  clearable={false}
                  icon={<IconCurrencyDollar size={16} />}
                  {...form.getInputProps("currency")}
                />

                <TextInput
                  label="Address"
                  placeholder="Your company's address"
                  {...form.getInputProps("address")}
                />

                <FileInput
                  label="Logo"
                  placeholder="Upload your company logo"
                  accept="image/png,image/jpeg,image/svg+xml"
                  icon={<IconPhoto size={16} />}
                  description="Recommended size: 300x300px, max 2MB"
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
              <ThemeIcon
                size={60}
                radius={30}
                mb="lg"
                variant="light"
                color="blue"
              >
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
                    <IconCircleCheck size={16} />
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
};

export default OrganizationCreate;
