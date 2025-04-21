import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ReactNode } from "react";
import { Link } from "react-router";

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  backButton?: {
    label: string;
    href: string;
  };
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  backButton,
}: PageHeaderProps) {
  return (
    <Box mb="lg">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs mb="md" separator="→">
          {breadcrumbs.map((item, index) => (
            <Anchor
              key={index}
              component={item.href ? Link : "span"}
              to={item.href}
              size="sm"
              color={index === breadcrumbs.length - 1 ? "primary" : "dimmed"}
              underline={item.href ? "hover" : false}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>
      )}

      <Group position="apart" align="flex-start">
        <Stack spacing={4}>
          {backButton && (
            <Button
              component={Link}
              to={backButton.href}
              variant="subtle"
              compact
              mb="xs"
              size="xs"
              styles={{ root: { padding: 0 } }}
            >
              ← {backButton.label}
            </Button>
          )}
          <Title order={2}>{title}</Title>
          {subtitle && (
            <Text color="dimmed" size="sm">
              {subtitle}
            </Text>
          )}
        </Stack>

        {actions && <Group>{actions}</Group>}
      </Group>
    </Box>
  );
}
