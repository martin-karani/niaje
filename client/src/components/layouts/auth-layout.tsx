import { Container, Group, Paper, Text, Title } from "@mantine/core";
import { Outlet } from "react-router";

// Simple Auth layout for login, registration, and password reset screens
export default function AuthLayout() {
  return (
    <Container size={520} my={40}>
      <Group justify="center" mb="xl">
        {/* Replace with your logo */}
        <Title order={2} ta="center" mb="lg">
          Property Management System
        </Title>
      </Group>

      <Paper radius="md" p="xl" withBorder>
        <Outlet />
      </Paper>

      <Text c="dimmed" size="sm" ta="center" mt={20}>
        © {new Date().getFullYear()} Property Management System
      </Text>
    </Container>
  );
}
