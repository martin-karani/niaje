import { Avatar, Group, Menu, Text, UnstyledButton, rem } from "@mantine/core";
import {
  IconChevronDown,
  IconLogout,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../state/auth-store";

export default function UserMenu() {
  const [opened, setOpened] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect happens in the auth service
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Navigate to profile
  const navigateToProfile = () => {
    navigate("/settings/profile");
    setOpened(false);
  };

  // Navigate to settings
  const navigateToSettings = () => {
    navigate("/settings");
    setOpened(false);
  };

  return (
    <Menu
      width={200}
      position="bottom-end"
      opened={opened}
      onChange={setOpened}
    >
      <Menu.Target>
        <UnstyledButton>
          <Group gap={7}>
            <Avatar
              src={user.image}
              alt={user.name}
              radius="xl"
              size="sm"
              color="primary"
            >
              {getInitials(user.name)}
            </Avatar>
            <Text fw={500} size="sm" mr={3}>
              {user.name}
            </Text>
            <IconChevronDown
              style={{ width: rem(12), height: rem(12) }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <IconUser
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={navigateToProfile}
        >
          My Profile
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconSettings
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={navigateToSettings}
        >
          Settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={
            <IconLogout
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={handleLogout}
        >
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
