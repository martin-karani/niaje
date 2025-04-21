import {
  AppShell,
  Burger,
  Group,
  Skeleton,
  Text,
  UnstyledButton,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "../../state/auth-store";
import Sidebar from "../navigation/side-bar";
import UserMenu from "../navigation/user-menu";

export default function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, organization, team, isLoading } = useAuthStore();
  const [organizationMenuOpened, setOrganizationMenuOpened] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <Skeleton height={50} mb="xl" />
        <Skeleton height={20} mb="lg" />
        <Skeleton height={20} mb="lg" />
        <Skeleton height={20} mb="lg" />
      </div>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            {organization && (
              <UnstyledButton
                onClick={() => setOrganizationMenuOpened((o) => !o)}
                className="organization-switcher"
                py={8}
              >
                <Group gap={5}>
                  <Text fw={500} size="sm">
                    {organization.name}
                  </Text>
                  <IconChevronDown
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                </Group>
              </UnstyledButton>
            )}
          </Group>
          <Group>
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
