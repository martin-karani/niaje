import { tenantEntity } from "@/domains/tenants/entities/tenant.entity";
import { db } from "@/infrastructure/database";
import emailService from "@/infrastructure/email/email.service";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { ValidationError } from "@/shared/errors/validation.error";
import {
  generateTemporaryPassword,
  hashPassword,
} from "@/shared/utils/auth.utils";
import { and, eq, isNotNull } from "drizzle-orm";
import {
  memberEntity,
  NewUser,
  User,
  userEntity,
} from "../entities/user.entity";

export class UserService {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return db.query.userEntity.findMany({
      orderBy: (users, { asc }) => [asc(users.name)],
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, id),
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, email),
    });

    if (!user) {
      throw new NotFoundError(`User with email ${email} not found`);
    }

    return user;
  }

  /**
   * Create a new user
   */
  async createUser(
    data: Omit<NewUser, "passwordHash"> & { password: string }
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.getUserByEmail(data.email);
    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const result = await db
      .insert(userEntity)
      .values({
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone,
        image: data.image,
        address: data.address,
        city: data.city,
        country: data.country,
        bio: data.bio,
        isActive: data.isActive ?? true,
        emailVerified: data.emailVerified ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update a user
   */
  async updateUser(
    id: string,
    data: Partial<Omit<NewUser, "passwordHash">>
  ): Promise<User> {
    // Verify user exists
    await this.getUserById(id);

    // Check if updating email and it already exists
    if (data.email) {
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError("Email already in use");
      }
    }

    // Update user
    const result = await db
      .update(userEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    // Verify user exists
    await this.getUserById(id);

    // Delete the user (let the DB handle cascading deletes)
    await db.delete(userEntity).where(eq(userEntity.id, id));
  }

  /**
   * Create tenant user for portal access
   */
  async createTenantUser(data: {
    email: string;
    name: string;
    phone?: string | null;
    tenantId: string;
    password?: string;
    sendCredentials?: boolean;
  }): Promise<User> {
    // Check if tenant exists
    const tenant = await db.query.tenantEntity.findFirst({
      where: eq(tenantEntity.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Check if email already exists
    let existingUser = await this.getUserByEmail(data.email);

    let password = data.password;

    // If user exists but with a different role, we need to handle it
    if (existingUser) {
      // If tenant is already linked to a user, check if it's the same user
      if (tenant.userId && tenant.userId !== existingUser.id) {
        throw new ValidationError(
          "Tenant is already linked to a different user"
        );
      }

      // Update existing user if needed
      if (existingUser.role !== "tenant_user") {
        existingUser = await this.updateUser(existingUser.id, {
          role: "tenant_user",
          phone: data.phone || existingUser.phone,
          name: data.name || existingUser.name,
        });
      }

      // Link tenant to user if not already linked
      if (!tenant.userId) {
        await db
          .update(tenantEntity)
          .set({
            userId: existingUser.id,
            updatedAt: new Date(),
          })
          .where(eq(tenantEntity.id, data.tenantId));
      }

      return existingUser;
    }

    // Generate password if not provided
    if (!password) {
      password = generateTemporaryPassword(10);
    }

    // Create new user
    const user = await this.createUser({
      name: data.name,
      email: data.email,
      password,
      role: "tenant_user",
      phone: data.phone,
      isActive: true,
      emailVerified: true, // Auto-verify tenant users
    });

    // Link tenant to user
    await db
      .update(tenantEntity)
      .set({
        userId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(tenantEntity.id, data.tenantId));

    // Send credentials email if requested
    if (data.sendCredentials !== false) {
      await emailService.sendTenantPortalCredentials(
        data.email,
        data.name,
        password
      );
    }

    return user;
  }

  /**
   * Get tenants with user accounts for organization
   */
  async getTenantUsersByOrganization(organizationId: string) {
    return db.query.tenantEntity.findMany({
      where: and(
        eq(tenantEntity.organizationId, organizationId),
        // Only get tenants with user accounts
        isNotNull(tenantEntity.userId)
      ),
      with: {
        userAccount: true,
      },
    });
  }

  /**
   * Get organizations for a user
   */
  async getUserOrganizations(userId: string) {
    const members = await db.query.memberEntity.findMany({
      where: eq(memberEntity.userId, userId),
      with: {
        organization: true,
      },
    });

    return members.map((member) => member.organization);
  }
}

export const userService = new UserService();
