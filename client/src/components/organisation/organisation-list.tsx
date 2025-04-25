// src/components/organization/OrganizationList.tsx
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Group,
  Menu,
  Modal,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDots, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import React, { useState } from "react";

const OrganizationList: React.FC = () => {
  const {
    organizations,
    createOrganization,
    deleteOrganization,
    updateOrganization,
    setActiveOrganization,
    activeOrganization,
  } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const createForm = useForm({
    initialValues: {
      name: "",
      slug: "",
      logo: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Name must be at least 2 characters" : null,
      slug: (value) => {
        if (value.trim().length < 2)
          return "Slug must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value))
          return "Slug can only contain lowercase letters, numbers, and hyphens";
        return null;
      },
    },
  });

  const editForm = useForm({
    initialValues: {
      id: "",
      name: "",
      slug: "",
      logo: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Name must be at least 2 characters" : null,
      slug: (value) => {
        if (value.trim().length < 2)
          return "Slug must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value))
          return "Slug can only contain lowercase letters, numbers, and hyphens";
        return null;
      },
    },
  });

  const handleCreateSubmit = async (values: typeof createForm.values) => {
    try {
      await createOrganization(
        values.name,
        values.slug,
        values.logo || undefined
      );
      setIsCreateModalOpen(false);
      createForm.reset();
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  const handleEditSubmit = async (values: typeof editForm.values) => {
    try {
      await updateOrganization({
        id: values.id,
        name: values.name,
        slug: values.slug,
        logo: values.logo,
      });
      setIsEditModalOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error("Error updating organization:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;

    try {
      await deleteOrganization(selectedOrg.id);
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  };

  const openEditModal = (org: any) => {
    setSelectedOrg(org);
    editForm.setValues({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (org: any) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const handleSetActive = async (orgId: string) => {
    try {
      await setActiveOrganization(orgId);
    } catch (error) {
      console.error("Error setting active organization:", error);
    }
  };

  return (
    <>
      <Group position="apart" mb="md">
        <Text size="xl" weight={700}>
          Organizations
        </Text>
        <Button
          leftIcon={<IconPlus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Organization
        </Button>
      </Group>

      {organizations.length === 0 ? (
        <Card p="xl" withBorder>
          <Text align="center" color="dimmed">
            You don't have any organizations yet. Create one to get started.
          </Text>
        </Card>
      ) : (
        organizations.map((org) => (
          <Card
            key={org.id}
            p="md"
            withBorder
            mb="sm"
            sx={(theme) => ({
              backgroundColor:
                activeOrganization?.id === org.id
                  ? theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0]
                  : undefined,
              cursor: "pointer",
              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[1],
              },
            })}
            onClick={() => handleSetActive(org.id)}
          >
            <Group position="apart">
              <Group>
                <Avatar src={org.logo} radius="xl" size="md" color="blue">
                  {org.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <div>
                  <Text weight={600}>{org.name}</Text>
                  <Text size="sm" color="dimmed">
                    @{org.slug}
                  </Text>
                </div>
              </Group>

              <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon>
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    icon={<IconEdit size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(org);
                    }}
                  >
                    Edit organization
                  </Menu.Item>
                  <Menu.Item
                    icon={<IconTrash size={16} />}
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(org);
                    }}
                  >
                    Delete organization
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            {activeOrganization?.id === org.id && (
              <Text size="xs" mt="xs" color="dimmed">
                Active organization
              </Text>
            )}
          </Card>
        ))
      )}

      {/* Create Organization Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Organization"
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <TextInput
            required
            label="Organization Name"
            placeholder="My Property Management"
            {...createForm.getInputProps("name")}
            mb="md"
          />

          <TextInput
            required
            label="Organization Slug"
            placeholder="my-property-management"
            description="Used for URLs and API identifiers"
            {...createForm.getInputProps("slug")}
            mb="md"
          />

          <TextInput
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            description="Optional: Enter a URL for your organization logo"
            {...createForm.getInputProps("logo")}
            mb="xl"
          />

          <Group position="right">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Organization</Button>
          </Group>
        </form>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organization"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <TextInput
            required
            label="Organization Name"
            {...editForm.getInputProps("name")}
            mb="md"
          />

          <TextInput
            required
            label="Organization Slug"
            description="Used for URLs and API identifiers"
            {...editForm.getInputProps("slug")}
            mb="md"
          />

          <TextInput
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            description="Optional: Enter a URL for your organization logo"
            {...editForm.getInputProps("logo")}
            mb="xl"
          />

          <Group position="right">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </Group>
        </form>
      </Modal>

      {/* Delete Organization Modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Organization"
      >
        <Text mb="lg">
          Are you sure you want to delete <strong>{selectedOrg?.name}</strong>?
          This action cannot be undone.
        </Text>

        <Text color="red" mb="xl" size="sm">
          All data associated with this organization, including properties,
          tenants, leases, and financial records will be permanently deleted.
        </Text>

        <Group position="right">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Delete Organization
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default OrganizationList;

// src/components/organization/OrganizationSwitcher.tsx
import { Divider } from "@mantine/core";
import { IconChevronDown, IconSettings } from "@tabler/icons-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrganizationSwitcher: React.FC = () => {
  const { organizations, activeOrganization, setActiveOrganization } =
    useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOrganizationSelect = async (orgId: string) => {
    try {
      await setActiveOrganization(orgId);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error switching organization:", error);
    }
  };

  if (!activeOrganization) {
    return (
      <Button
        variant="light"
        leftIcon={<IconPlus size={16} />}
        onClick={() => navigate("/organizations/new")}
      >
        Create Organization
      </Button>
    );
  }

  return (
    <Menu
      opened={isMenuOpen}
      onChange={setIsMenuOpen}
      width={250}
      position="bottom-start"
    >
      <Menu.Target>
        <Button
          variant="subtle"
          rightIcon={<IconChevronDown size={16} />}
          sx={(theme) => ({
            padding: theme.spacing.xs,
            borderRadius: theme.radius.md,
            "&:hover": {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
            },
          })}
        >
          <Group spacing="xs">
            <Avatar
              src={activeOrganization.logo}
              radius="xl"
              size="sm"
              color="blue"
            >
              {activeOrganization.name.substring(0, 2).toUpperCase()}
            </Avatar>
            <Text weight={600} size="sm">
              {activeOrganization.name}
            </Text>
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Your Organizations</Menu.Label>

        {organizations.map((org) => (
          <Menu.Item
            key={org.id}
            onClick={() => handleOrganizationSelect(org.id)}
            sx={(theme) => ({
              backgroundColor:
                activeOrganization.id === org.id
                  ? theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0]
                  : undefined,
            })}
          >
            <Group>
              <Avatar src={org.logo} radius="xl" size="sm" color="blue">
                {org.name.substring(0, 2).toUpperCase()}
              </Avatar>
              <Text size="sm">{org.name}</Text>
            </Group>
          </Menu.Item>
        ))}

        <Divider my="xs" />

        <Menu.Item
          icon={<IconPlus size={16} />}
          onClick={() => navigate("/organizations/new")}
        >
          Create Organization
        </Menu.Item>

        <Menu.Item
          icon={<IconSettings size={16} />}
          onClick={() => navigate("/settings/organization")}
        >
          Organization Settings
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default OrganizationSwitcher;

// src/components/organization/TeamManagement.tsx
import { Alert, Badge, Table } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { PermissionGuard } from "../../auth/components/PermissionGuard";

const TeamManagement: React.FC = () => {
  const { teams, activeOrganization, createTeam, updateTeam, removeTeam } =
    useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const createForm = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2
          ? "Team name must be at least 2 characters"
          : null,
    },
  });

  const editForm = useForm({
    initialValues: {
      id: "",
      name: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2
          ? "Team name must be at least 2 characters"
          : null,
    },
  });

  const handleCreateSubmit = async (values: typeof createForm.values) => {
    try {
      await createTeam(values.name);
      setIsCreateModalOpen(false);
      createForm.reset();
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleEditSubmit = async (values: typeof editForm.values) => {
    try {
      await updateTeam(values.id, { name: values.name });
      setIsEditModalOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;

    try {
      await removeTeam(selectedTeam.id);
      setIsDeleteModalOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const openEditModal = (team: any) => {
    setSelectedTeam(team);
    editForm.setValues({
      id: team.id,
      name: team.name,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (team: any) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  if (!activeOrganization) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="No Active Organization"
        color="yellow"
      >
        Please select or create an organization to manage teams.
      </Alert>
    );
  }

  return (
    <PermissionGuard
      permissions={{ team: ["create", "update", "delete"] }}
      fallback={
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Access Restricted"
          color="red"
        >
          You don't have permission to manage teams.
        </Alert>
      }
    >
      <Card p="md" withBorder>
        <Group position="apart" mb="md">
          <Text size="xl" weight={700}>
            Teams
          </Text>
          <Button
            leftIcon={<IconPlus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Team
          </Button>
        </Group>

        {teams.length === 0 ? (
          <Text align="center" color="dimmed" my="xl">
            No teams created yet. Create your first team to organize your
            members.
          </Text>
        ) : (
          <Table striped>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Members</th>
                <th>Properties</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <Text weight={500}>{team.name}</Text>
                  </td>
                  <td>
                    <Badge>
                      {/* Member count would come from your API */}0
                    </Badge>
                  </td>
                  <td>
                    <Badge>
                      {/* Property count would come from your API */}0
                    </Badge>
                  </td>
                  <td>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon>
                          <IconDots size={18} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          icon={<IconEdit size={16} />}
                          onClick={() => openEditModal(team)}
                        >
                          Edit team
                        </Menu.Item>
                        <Menu.Item
                          icon={<IconTrash size={16} />}
                          color="red"
                          onClick={() => openDeleteModal(team)}
                        >
                          Delete team
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create Team Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Team"
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <TextInput
            required
            label="Team Name"
            placeholder="e.g. Residential Properties"
            description="Enter a descriptive name for your team"
            {...createForm.getInputProps("name")}
            mb="xl"
          />

          <Group position="right">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Team</Button>
          </Group>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Team"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <TextInput
            required
            label="Team Name"
            {...editForm.getInputProps("name")}
            mb="xl"
          />

          <Group position="right">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </Group>
        </form>
      </Modal>

      {/* Delete Team Modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Team"
      >
        <Text mb="lg">
          Are you sure you want to delete the team{" "}
          <strong>{selectedTeam?.name}</strong>?
        </Text>

        <Text color="dimmed" mb="md" size="sm">
          Team members will not be removed from the organization, but they will
          lose access to resources associated with this team.
        </Text>

        <Group position="right">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Delete Team
          </Button>
        </Group>
      </Modal>
    </PermissionGuard>
  );
};

export default TeamManagement;

// src/components/organization/MemberManagement.tsx
import { MultiSelect, Select } from "@mantine/core";
import { IconMail } from "@tabler/icons-react";
import { useAuth } from "../../state/auth-proc";

const MemberManagement: React.FC = () => {
  const {
    activeOrganization,
    inviteMember,
    updateMemberRole,
    removeMember,
    teams,
  } = useAuth();

  // In a real app, you would fetch this from the API
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const inviteForm = useForm({
    initialValues: {
      email: "",
      role: "agent",
      teamIds: [] as string[],
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      role: (value) => (!value ? "Role is required" : null),
    },
  });

  const changeRoleForm = useForm({
    initialValues: {
      id: "",
      role: "",
    },
    validate: {
      role: (value) => (!value ? "Role is required" : null),
    },
  });

  const handleInviteSubmit = async (values: typeof inviteForm.values) => {
    try {
      await inviteMember(
        values.email,
        values.role,
        values.teamIds.length > 0 ? values.teamIds[0] : undefined
      );
      setIsInviteModalOpen(false);
      inviteForm.reset();

      // In a real app, you would fetch the updated invitation list
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  };

  const handleChangeRoleSubmit = async (
    values: typeof changeRoleForm.values
  ) => {
    try {
      await updateMemberRole(values.id, values.role);
      setIsChangeRoleModalOpen(false);
      setSelectedMember(null);

      // In a real app, you would fetch the updated member list
    } catch (error) {
      console.error("Error changing role:", error);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!selectedMember) return;

    try {
      await removeMember(selectedMember.id);
      setIsRemoveModalOpen(false);
      setSelectedMember(null);

      // In a real app, you would fetch the updated member list
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const openChangeRoleModal = (member: any) => {
    setSelectedMember(member);
    changeRoleForm.setValues({
      id: member.id,
      role: member.role,
    });
    setIsChangeRoleModalOpen(true);
  };

  const openRemoveModal = (member: any) => {
    setSelectedMember(member);
    setIsRemoveModalOpen(true);
  };

  // Mock data for demonstration
  useEffect(() => {
    if (activeOrganization) {
      // In a real app, this would be fetched from the API
      setMembers([
        {
          id: "1",
          userId: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "owner",
          teamIds: [],
        },
        {
          id: "2",
          userId: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "manager",
          teamIds: ["1"],
        },
        {
          id: "3",
          userId: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          role: "agent",
          teamIds: ["1", "2"],
        },
      ]);

      setInvitations([
        {
          id: "1",
          email: "pending@example.com",
          role: "agent",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [activeOrganization]);

  const getRoleBadge = (role: string) => {
    let color = "";
    switch (role) {
      case "owner":
        color = "blue";
        break;
      case "manager":
        color = "green";
        break;
      case "agent":
        color = "yellow";
        break;
      case "propertyOwner":
        color = "cyan";
        break;
      case "caretaker":
        color = "orange";
        break;
      case "tenant":
        color = "grape";
        break;
      default:
        color = "gray";
    }

    return (
      <Badge color={color} variant="filled">
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (!activeOrganization) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="No Active Organization"
        color="yellow"
      >
        Please select or create an organization to manage members.
      </Alert>
    );
  }

  return (
    <PermissionGuard
      permissions={{ member: ["create", "update", "delete"] }}
      fallback={
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Access Restricted"
          color="red"
        >
          You don't have permission to manage organization members.
        </Alert>
      }
    >
      <Card p="md" withBorder>
        <Group position="apart" mb="md">
          <Text size="xl" weight={700}>
            Members
          </Text>
          <Button
            leftIcon={<IconPlus size={16} />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        </Group>

        {members.length === 0 ? (
          <Text align="center" color="dimmed" my="xl">
            No members in this organization yet.
          </Text>
        ) : (
          <Table striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Teams</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <Group spacing="sm">
                      <Avatar radius="xl" size="sm" color="blue">
                        {member.name?.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Text weight={500}>{member.name}</Text>
                    </Group>
                  </td>
                  <td>{member.email}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>
                    {member.teamIds.length === 0 ? (
                      <Text size="sm" color="dimmed">
                        No teams
                      </Text>
                    ) : (
                      <Group spacing="xs">
                        {member.teamIds.map((teamId: string) => {
                          const team = teams.find((t) => t.id === teamId);
                          return team ? (
                            <Badge key={teamId} size="sm">
                              {team.name}
                            </Badge>
                          ) : null;
                        })}
                      </Group>
                    )}
                  </td>
                  <td>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon>
                          <IconDots size={18} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openChangeRoleModal(member)}>
                          Change role
                        </Menu.Item>
                        {member.role !== "owner" && (
                          <Menu.Item
                            icon={<IconTrash size={16} />}
                            color="red"
                            onClick={() => openRemoveModal(member)}
                          >
                            Remove member
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card p="md" withBorder mt="md">
          <Text size="lg" weight={700} mb="md">
            Pending Invitations
          </Text>

          <Table striped>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Sent</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>{invitation.email}</td>
                  <td>{getRoleBadge(invitation.role)}</td>
                  <td>
                    <Badge color="gray">
                      {invitation.status.charAt(0).toUpperCase() +
                        invitation.status.slice(1)}
                    </Badge>
                  </td>
                  <td>{new Date(invitation.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Group spacing="xs">
                      <ActionIcon color="blue" title="Resend invitation">
                        <IconMail size={18} />
                      </ActionIcon>
                      <ActionIcon color="red" title="Cancel invitation">
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        opened={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member"
      >
        <form onSubmit={inviteForm.onSubmit(handleInviteSubmit)}>
          <TextInput
            required
            label="Email"
            placeholder="email@example.com"
            {...inviteForm.getInputProps("email")}
            mb="md"
          />

          <Select
            required
            label="Role"
            data={[
              { value: "manager", label: "Manager" },
              { value: "agent", label: "Agent" },
              { value: "propertyOwner", label: "Property Owner" },
              { value: "caretaker", label: "Caretaker" },
              { value: "tenant", label: "Tenant" },
            ]}
            {...inviteForm.getInputProps("role")}
            mb="md"
          />

          {teams.length > 0 && (
            <MultiSelect
              label="Assign to Teams"
              data={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
              placeholder="Select teams"
              {...inviteForm.getInputProps("teamIds")}
              mb="xl"
            />
          )}

          <Group position="right">
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Send Invitation</Button>
          </Group>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        opened={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        title="Change Member Role"
      >
        <form onSubmit={changeRoleForm.onSubmit(handleChangeRoleSubmit)}>
          <Text mb="md">
            Changing role for <strong>{selectedMember?.name}</strong> (
            {selectedMember?.email})
          </Text>

          <Select
            required
            label="New Role"
            data={[
              { value: "owner", label: "Owner" },
              { value: "manager", label: "Manager" },
              { value: "agent", label: "Agent" },
              { value: "propertyOwner", label: "Property Owner" },
              { value: "caretaker", label: "Caretaker" },
              { value: "tenant", label: "Tenant" },
            ]}
            {...changeRoleForm.getInputProps("role")}
            mb="xl"
          />

          <Group position="right">
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Change Role</Button>
          </Group>
        </form>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        opened={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        title="Remove Member"
      >
        <Text mb="lg">
          Are you sure you want to remove{" "}
          <strong>{selectedMember?.name}</strong> ({selectedMember?.email}) from
          this organization?
        </Text>

        <Group position="right">
          <Button variant="outline" onClick={() => setIsRemoveModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleRemoveConfirm}>
            Remove Member
          </Button>
        </Group>
      </Modal>
    </PermissionGuard>
  );
};

export default MemberManagement;
