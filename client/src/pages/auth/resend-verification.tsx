import { Alert, Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck, IconMail } from "@tabler/icons-react";
import { useState } from "react";
import { resendVerificationEmail } from "../../services/auth";

export default function ResendVerificationEmailModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await resendVerificationEmail(values.email);

      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.message || "Failed to resend verification email");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Resend Verification Email"
      centered
    >
      {success ? (
        <Alert
          icon={<IconCheck size="1rem" />}
          title="Email Sent"
          color="green"
          mb="md"
        >
          If your email is registered and not already verified, a new
          verification email has been sent. Please check your inbox and spam
          folder.
        </Alert>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Text size="sm" mb="md">
            Enter your email address and we'll send you a new verification link.
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

          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            icon={<IconMail size="1rem" />}
            {...form.getInputProps("email")}
            mb="md"
          />

          <Group position="right" mt="md">
            <Button variant="subtle" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Resend Verification Email
            </Button>
          </Group>
        </form>
      )}
    </Modal>
  );
}
