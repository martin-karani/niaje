import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmail } from "../../services/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setVerifying(false);
        setError("No verification token provided");
        return;
      }

      try {
        setVerifying(true);
        const result = await verifyEmail(token);

        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.message || "Verification failed");
        }
      } catch (err: any) {
        setError(err.message || "Verification failed");
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token]);

  // If no token is provided, show error
  if (!token && !verifying) {
    return (
      <Container size="xs" my={40}>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl">
            <Title order={3}>Email Verification Failed</Title>
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Invalid Link"
              color="red"
              mb="md"
            >
              The verification link is invalid or has expired. Please request a
              new verification link.
            </Alert>
            <Button component={Link} to="/auth/sign-in" variant="outline">
              Back to Sign In
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // If verification is in progress
  if (verifying) {
    return (
      <Container size="xs" my={40}>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl">
            <Title order={3}>Verifying Your Email</Title>
            <Text>Please wait while we verify your email address...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // If verification was successful
  if (success) {
    return (
      <Container size="xs" my={40}>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="xl">
            <Title order={3}>Email Verified Successfully</Title>
            <Alert
              icon={<IconCheck size="1rem" />}
              title="Success"
              color="green"
              mb="md"
            >
              Your email has been successfully verified. You can now sign in to
              your account.
            </Alert>
            <Button component={Link} to="/auth/sign-in">
              Sign In
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // If verification failed
  return (
    <Container size="xs" my={40}>
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" spacing="xl">
          <Title order={3}>Email Verification Failed</Title>
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Error"
            color="red"
            mb="md"
          >
            {error ||
              "An error occurred during email verification. Please try again or request a new verification link."}
          </Alert>
          <Button component={Link} to="/auth/sign-in" variant="outline">
            Back to Sign In
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
