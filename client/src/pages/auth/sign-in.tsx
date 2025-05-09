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
import { Link, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";
import ResendVerificationEmailModal from "./resend-verification";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError, organization, organizations } =
    useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Extract message from location state (if redirected from another page)
  const message = location.state?.message;

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

      // If we have exactly one organization, we'll be redirected to the dashboard
      // automatically by the organization-select page
      navigate("/auth/organizations");
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

      {message && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Information"
          color="blue"
          mb="md"
          withCloseButton
          onClose={() =>
            navigate(location.pathname, { replace: true, state: {} })
          }
        >
          {message}
        </Alert>
      )}

      {/* <Error message error={error} onClose={clearError} /> */}

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

        <Text c="dimmed" size="sm" ta="center">
          Didn't receive verification email?{" "}
          <Anchor onClick={() => setVerificationModalOpen(true)} size="sm">
            Resend email
          </Anchor>
        </Text>
      </Stack>

      <ResendVerificationEmailModal
        opened={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
      />
    </form>
  );
}
