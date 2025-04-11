import { TRPCError } from "@trpc/server";
import {
  AssignPermissionDto,
  RevokePermissionDto,
} from "../dto/permissions.dto";
import {
  permissionsRepository,
  PermissionsRepository,
} from "../repositories/permissions.repository";

// Helper function (can be moved to a utils file)
const getDefaultPermissionsForRole = (role: string) => {
  switch (role) {
    case "caretaker":
      return {
        canManageTenants: true,
        canManageLeases: false,
        canCollectPayments: true,
        canViewFinancials: false,
        canManageMaintenance: true,
        canManageProperties: false,
      };
    case "agent":
      return {
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
    case "readonly":
      return {
        canManageTenants: false,
        canManageLeases: false,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
    default:
      return {
        canManageTenants: false,
        canManageLeases: false,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
  }
};

export class PermissionsService {
  constructor(
    private repository: PermissionsRepository = permissionsRepository
  ) {}

  /**
   * Get all permissions for a specific user, including implicit owner permissions.
   */
  async getUserPermissions(
    userId: string,
    userRole: string,
    userName: string | null
  ) {
    // Get explicit permissions
    const explicitPermissions = await this.repository.findByUserId(userId);

    // Format explicit permissions
    const formattedPermissions = explicitPermissions.map((permission) => ({
      ...permission,
      propertyName: permission.property?.name ?? "N/A", // Handle potential null property
      grantedByName: permission.grantedByUser?.name ?? "N/A", // Handle potential null grantor
    }));

    // If user is a landlord, add "owner" permissions for their properties
    let ownerPermissions: any[] = [];
    if (userRole === "LANDLORD") {
      const ownedProperties = await this.repository.findOwnedProperties(userId);
      ownerPermissions = ownedProperties.map((property) => ({
        id: `owner-${property.id}`, // Unique identifier
        userId: userId,
        propertyId: property.id,
        propertyName: property.name,
        role: "owner",
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: true,
        canViewFinancials: true,
        canManageMaintenance: true,
        canManageProperties: true,
        grantedBy: userId,
        grantedByName: userName || "Self",
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }));
    }

    return [...formattedPermissions, ...ownerPermissions];
  }

  /**
   * Get permissions for a specific property.
   * Assumes ownership/access check is done via middleware before calling this service method.
   */
  async getPropertyPermissions(propertyId: string) {
    const permissions = await this.repository.findByPropertyId(propertyId);

    // Format the response
    return permissions.map((permission) => ({
      ...permission,
      userName: permission.user?.name ?? "N/A",
      userEmail: permission.user?.email ?? "N/A",
      userRole: permission.role, // The role assigned in the permission context
      grantedByName: permission.grantedByUser?.name ?? "N/A",
    }));
  }

  /**
   * Assign or update permission for a user on a property.
   * Assumes ownership check (granter === owner) is done via middleware.
   */
  async assignPermission(input: AssignPermissionDto, granterId: string) {
    // Verify the user to assign exists
    const userToAssign = await this.repository.findUserById(input.userId);
    if (!userToAssign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User to assign permission not found",
      });
    }

    // Business logic checks (e.g., cannot assign owner role, cannot assign admin, etc.)
    // ...

    // Determine permissions to set
    let permissionsToSet;
    if (input.role === "custom" && input.customPermissions) {
      permissionsToSet = {
        ...getDefaultPermissionsForRole(""),
        ...input.customPermissions,
      };
    } else if (input.role !== "custom") {
      permissionsToSet = getDefaultPermissionsForRole(input.role);
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Custom role requires customPermissions.",
      });
    }

    // Check if permission already exists
    const existingPermission = await this.repository.findOne(
      input.userId,
      input.propertyId
    );

    if (existingPermission) {
      // Update existing permission
      return this.repository.update(existingPermission.id, {
        role: input.role,
        ...permissionsToSet,
      });
    } else {
      // Create new permission
      return this.repository.create({
        // id: createId(), // Handled by DB default
        userId: input.userId,
        propertyId: input.propertyId,
        role: input.role,
        ...permissionsToSet,
        grantedBy: granterId,
        // Set defaults for boolean fields explicitly if schema doesn't
        canManageTenants: permissionsToSet.canManageTenants ?? false,
        canManageLeases: permissionsToSet.canManageLeases ?? false,
        canCollectPayments: permissionsToSet.canCollectPayments ?? false,
        canViewFinancials: permissionsToSet.canViewFinancials ?? false,
        canManageMaintenance: permissionsToSet.canManageMaintenance ?? false,
        canManageProperties: permissionsToSet.canManageProperties ?? false,
      });
    }
  }

  /**
   * Revoke permission for a user on a property.
   * Assumes ownership check is done via middleware.
   */
  async revokePermission(input: RevokePermissionDto, revokerId: string) {
    // Optional: Add check to ensure revoker is the original granter or current owner if needed
    // const permission = await this.repository.findOne(input.userId, input.propertyId);
    // if (!permission) throw new TRPCError({ code: "NOT_FOUND", message: "Permission not found." });
    // if (permission.grantedBy !== revokerId && /* logic to check if revoker is current owner */) {
    //    throw new TRPCError({ code: "FORBIDDEN", message: "You did not grant this permission." });
    // }

    const result = await this.repository.delete(input.userId, input.propertyId);
    if (result.count === 0) {
      // Could be that the permission never existed
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Permission not found for this user and property.",
      });
    }
    return { success: true };
  }

  /**
   * Get users suitable for assignment.
   * Assumes check for landlord role is done via middleware.
   */
  async getAssignableUsers() {
    return this.repository.findAssignableUsers();
  }
}

// Export a singleton instance
export const permissionsService = new PermissionsService();
