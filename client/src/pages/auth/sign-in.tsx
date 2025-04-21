import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    clearError();

    try {
      await login(values.email, values.password);
      // Redirect to dashboard will happen automatically after successful login
    } catch (err) {
      // Error is already set in auth store
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Title order={3} ta="center" mt="md" mb="xl">
        Welcome back!
      </Title>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Authentication Error"
          color="red"
          mb="md"
          withCloseButton
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      <Stack>
        <TextInput
          required
          label="Email"
          placeholder="hello@example.com"
          {...form.getInputProps("email")}
        />

        <PasswordInput
          required
          label="Password"
          placeholder="Your password"
          {...form.getInputProps("password")}
        />

        <Group justify="space-between">
          <Checkbox
            label="Remember me"
            {...form.getInputProps("rememberMe", { type: "checkbox" })}
          />
          <Anchor component={Link} to="/auth/forgot-password" size="sm">
            Forgot password?
          </Anchor>
        </Group>

        <Button fullWidth mt="xl" type="submit" loading={isLoading}>
          Sign in
        </Button>

        <Divider label="Or" labelPosition="center" my="lg" />

        <Text c="dimmed" size="sm" ta="center">
          Don't have an account yet?{" "}
          <Anchor component={Link} to="/auth/sign-up" size="sm">
            Create account
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
