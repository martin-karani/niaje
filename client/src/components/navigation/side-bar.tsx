import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
  rem,
} from "@mantine/core";
import {
  IconBuilding,
  IconBuildingSkyscraper,
  IconChartBar,
  IconChevronRight,
  IconCreditCard,
  IconFileDescription,
  IconHome,
  IconSettings,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useAuthStore } from "../../state/auth-store";

// Define link data structure
interface NavLinkData {
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  links?: { label: string; path: string }[];
}

// Create navigation links based on user permissions
function getNavLinks(isAdmin: boolean, isOwner: boolean): NavLinkData[] {
  const links: NavLinkData[] = [
    {
      label: "Dashboard",
      icon: (
        <IconHome style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      ),
      path: "/dashboard",
    },
    {
      label: "Properties",
      icon: (
        <IconBuilding
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
        />
      ),
      path: "/properties",
      permission: "canViewProperties",
      links: [
        { label: "All Properties", path: "/properties" },
        { label: "Units", path: "/properties/units" },
      ],
    },
    {
      label: "Tenants",
      icon: (
        <IconUsers style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      ),
      path: "/tenants",
      permission: "canViewTenants",
      links: [
        { label: "All Tenants", path: "/tenants" },
        { label: "Prospects", path: "/tenants/prospects" },
      ],
    },
    {
      label: "Leases",
      icon: (
        <IconFileDescription
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
        />
      ),
      path: "/leases",
      permission: "canViewLeases",
    },
    {
      label: "Maintenance",
      icon: (
        <IconTool style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      ),
      path: "/maintenance",
      permission: "canViewMaintenance",
      links: [
        { label: "Requests", path: "/maintenance" },
        { label: "Schedule", path: "/maintenance/schedule" },
      ],
    },
    {
      label: "Billing",
      icon: (
        <IconCreditCard
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
        />
      ),
      path: "/billing",
      links: [
        { label: "Payments", path: "/billing/payments" },
        { label: "Expenses", path: "/billing/expenses" },
        { label: "Utility Bills", path: "/billing/utilities" },
      ],
    },
    {
      label: "Reports",
      icon: (
        <IconChartBar
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
        />
      ),
      path: "/reports",
      links: [
        { label: "Financial", path: "/reports/financial" },
        { label: "Occupancy", path: "/reports/occupancy" },
        { label: "Maintenance", path: "/reports/maintenance" },
      ],
    },
  ];

  // Add admin-specific links
  if (isAdmin || isOwner) {
    links.push({
      label: "Organization",
      icon: (
        <IconBuildingSkyscraper
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
        />
      ),
      path: "/organization",
      links: [
        { label: "Team Members", path: "/organization/members" },
        { label: "Teams", path: "/organization/teams" },
        { label: "Subscription", path: "/organization/subscription" },
      ],
    });
  }

  // Always add settings at the end
  links.push({
    label: "Settings",
    icon: (
      <IconSettings style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
    ),
    path: "/settings",
  });

  return links;
}

// NavLink component for sidebar
function NavItem({ item }: { item: NavLinkData }) {
  const { pathname } = useLocation();
  const [opened, setOpened] = useState(pathname.includes(item.path));
  const hasLinks = Array.isArray(item.links) && item.links.length > 0;
  const isActive =
    pathname === item.path || pathname.startsWith(item.path + "/");

  return (
    <Box mb={8}>
      {hasLinks ? (
        <UnstyledButton
          onClick={() => setOpened((o) => !o)}
          className={`nav-link ${isActive ? "active" : ""}`}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            color: "inherit",
            textDecoration: "none",
            backgroundColor: isActive
              ? "var(--mantine-color-primary-light)"
              : "transparent",
          }}
        >
          <Group justify="space-between">
            <Group>
              <ThemeIcon
                variant={isActive ? "filled" : "light"}
                color={isActive ? "primary" : "gray"}
                size="md"
              >
                {item.icon}
              </ThemeIcon>
              <Text fw={500}>{item.label}</Text>
            </Group>
            <IconChevronRight
              style={{
                width: rem(16),
                height: rem(16),
                transform: opened ? "rotate(90deg)" : "none",
                transition: "transform 200ms ease",
              }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      ) : (
        <NavLink
          to={item.path}
          className={`nav-link ${isActive ? "active" : ""}`}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            color: "inherit",
            textDecoration: "none",
            backgroundColor: isActive
              ? "var(--mantine-color-primary-light)"
              : "transparent",
          }}
        >
          <Group justify="space-between">
            <Group>
              <ThemeIcon
                variant={isActive ? "filled" : "light"}
                color={isActive ? "primary" : "gray"}
                size="md"
              >
                {item.icon}
              </ThemeIcon>
              <Text fw={500}>{item.label}</Text>
            </Group>
          </Group>
        </NavLink>
      )}

      {hasLinks && (
        <Collapse in={opened}>
          <Box pl={36} mt={6}>
            {item.links!.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                style={({ isActive }) => ({
                  display: "block",
                  padding: "6px 0",
                  marginBottom: "4px",
                  textDecoration: "none",
                  color: isActive
                    ? "var(--mantine-color-primary-6)"
                    : "inherit",
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export default function Sidebar() {
  const { user, organization } = useAuthStore();

  if (!user || !organization) return null;

  const isAdmin = user.role === "admin";
  const isOwner = user.role === "agent_owner" && !!organization.id;

  const navLinks = getNavLinks(isAdmin, Boolean(isOwner));

  return (
    <Box>
      <Box className="sidebar-header" mb="lg">
        <Text size="xs" c="dimmed" mb={4}>
          NAVIGATION
        </Text>
      </Box>

      <Box className="sidebar-links">
        {navLinks.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </Box>
    </Box>
  );
}
