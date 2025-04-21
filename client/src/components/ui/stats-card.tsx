import {
  Badge,
  Card,
  Group,
  RingProgress,
  Text,
  ThemeIcon,
} from "@mantine/core";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  change?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  progress?: {
    value: number;
    color?: string;
    size?: number;
    thickness?: number;
    label?: string;
  };
  loading?: boolean;
  onClick?: () => void;
  height?: string | number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  change,
  progress,
  loading = false,
  onClick,
  height,
  className,
}: StatsCardProps) {
  return (
    <Card
      withBorder
      p="lg"
      radius="md"
      className={`stat-card ${className || ""}`}
      style={{
        height,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <Group position="apart" mb={progress ? "xs" : 0} noWrap>
        <div>
          <Text color="dimmed" size="xs" tt="uppercase" fw={700}>
            {title}
          </Text>

          <Group spacing="xs" noWrap mt={4}>
            <Text fw={700} size="xl">
              {loading ? "—" : value}
            </Text>

            {change && (
              <Badge
                color={change.positive ? "green" : "red"}
                size="sm"
                variant="light"
              >
                {change.positive ? "↑" : "↓"} {Math.abs(change.value)}%
                {change.label && ` ${change.label}`}
              </Badge>
            )}
          </Group>

          {subtitle && (
            <Text size="xs" color="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </div>

        {icon && !progress && (
          <ThemeIcon color={color} variant="light" radius="md" size="xl">
            {icon}
          </ThemeIcon>
        )}

        {progress && (
          <RingProgress
            size={progress.size || 80}
            roundCaps
            thickness={progress.thickness || 8}
            sections={[
              { value: progress.value, color: progress.color || color },
            ]}
            label={
              progress.label ? (
                <Text color="dimmed" weight={700} align="center" size="xs">
                  {progress.label}
                </Text>
              ) : (
                <Text
                  color={progress.color || color}
                  weight={700}
                  align="center"
                  size="xl"
                >
                  {progress.value}%
                </Text>
              )
            }
          />
        )}
      </Group>
    </Card>
  );
}
