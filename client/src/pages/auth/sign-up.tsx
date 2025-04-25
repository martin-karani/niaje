import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
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
import { signUp } from "../../services/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },

    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
      agreeToTerms: (value) =>
        value ? null : "You must agree to the terms and conditions",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        passwordConfirm: values.confirmPassword,
      });

      // Redirect to login page after successful registration
      navigate("/auth/sign-in", {
        state: {
          message: "Account created successfully! Please sign in.",
        },
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Title order={3} ta="center" mt="md" mb="xl">
        Create your account
      </Title>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Registration Error"
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
          label="Name"
          placeholder="John Doe"
          {...form.getInputProps("name")}
        />

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

        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Confirm your password"
          {...form.getInputProps("confirmPassword")}
        />

        <Checkbox
          label={
            <Text size="sm">
              I agree to the{" "}
              <Anchor href="#" target="_blank" size="sm">
                terms and conditions
              </Anchor>
            </Text>
          }
          {...form.getInputProps("agreeToTerms", { type: "checkbox" })}
        />

        <Button fullWidth mt="xl" type="submit" loading={isLoading}>
          Create account
        </Button>

        <Divider label="Or" labelPosition="center" my="lg" />

        <Text c="dimmed" size="sm" ta="center">
          Already have an account?{" "}
          <Anchor component={Link} to="/auth/sign-in" size="sm">
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
