import {
  Alert,
  Anchor,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { requestPasswordReset } from "../../services/auth";

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form validation
  const form = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(values.email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Password reset request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // If form was submitted successfully, show success message
  if (submitted) {
    return (
      <Stack>
        <Title order={3} ta="center" mt="md" mb="xl">
          Check your email
        </Title>

        <Alert
          icon={<IconCheck size="1rem" />}
          title="Recovery email sent"
          color="green"
          mb="md"
        >
          We've sent a password recovery link to your email address. Please
          check your inbox.
        </Alert>

        <Text size="sm" ta="center" mt="md">
          <Anchor component={Link} to="/auth/sign-in" size="sm">
            Back to login
          </Anchor>
        </Text>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Title order={3} ta="center" mt="md" mb="xl">
        Forgot your password?
      </Title>

      <Text size="sm" ta="center" mb="lg">
        Enter your email address and we'll send you a link to reset your
        password.
      </Text>

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
        <TextInput
          required
          label="Email"
          placeholder="hello@example.com"
          {...form.getInputProps("email")}
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
