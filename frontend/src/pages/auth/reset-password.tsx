import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { resetPassword } from "../../services/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form validation
  const form = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },

    validate: {
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(token, values.password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // If token is missing, show error
  if (!token) {
    return (
      <Stack>
        <Title order={3} ta="center" mt="md" mb="xl">
          Invalid Reset Link
        </Title>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Missing token"
          color="red"
          mb="md"
        >
          The password reset link is invalid or has expired. Please request a
          new password reset link.
        </Alert>

        <Button
          component={Link}
          to="/auth/forgot-password"
          variant="outline"
          fullWidth
        >
          Request new reset link
        </Button>
      </Stack>
    );
  }

  // If form was submitted successfully, show success message
  if (submitted) {
    return (
      <Stack>
        <Title order={3} ta="center" mt="md" mb="xl">
          Password Reset Successful
        </Title>

        <Alert
          icon={<IconCheck size="1rem" />}
          title="Password updated"
          color="green"
          mb="md"
        >
          Your password has been successfully reset. You can now log in with
          your new password.
        </Alert>

        <Button component={Link} to="/auth/sign-in" fullWidth>
          Go to login
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Title order={3} ta="center" mt="md" mb="xl">
        Reset your password
      </Title>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Stack>
        <PasswordInput
          required
          label="New Password"
          placeholder="Enter your new password"
          {...form.getInputProps("password")}
        />

        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Confirm your new password"
          {...form.getInputProps("confirmPassword")}
        />

        <Button fullWidth mt="xl" type="submit" loading={isLoading}>
          Reset password
        </Button>

        <Text size="sm" ta="center" mt="md">
          <Anchor component={Link} to="/auth/sign-in" size="sm">
            Back to login
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
