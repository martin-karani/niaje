import { db } from "@/db";
import { accounts, properties, users } from "@/db/schema";
import { UserProfile, UserStats, UserWithProperties } from "@/users/types";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import {
  UpdateProfileDto,
  UpdateUserDto,
  UserFilterDto,
} from "../dto/users.dto";

export class UsersRepository {
  /**
   * Find all users with optional filtering
   */
  async findAll(filters?: UserFilterDto): Promise<UserProfile[]> {
    let query = db.query.users;

    // Build query conditions based on filters
    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Fetch users with filtering and pagination
    const result = await query.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [sql`created_at desc`],
      limit,
      offset,
    });

    return result;
  }

  /**
   * Count users with optional filtering
   */
  async countUsers(
    filters?: Omit<UserFilterDto, "page" | "limit">
  ): Promise<number> {
    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a user by ID with optional related properties
   */
  async findById(
    id: string,
    includeProperties = false
  ): Promise<UserWithProperties | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) return null;

    // If we don't need properties, return early
    if (!includeProperties) return user;

    // Fetch owned properties
    const ownedProperties = await db.query.properties.findMany({
      where: eq(properties.ownerId, id),
      columns: {
        id: true,
        name: true,
        address: true,
        type: true,
      },
    });

    // Fetch properties where user is caretaker
    const managedProperties = await db.query.properties.findMany({
      where: eq(properties.caretakerId, id),
      columns: {
        id: true,
        name: true,
        address: true,
        type: true,
      },
    });

    // Fetch properties where user is agent
    const representedProperties = await db.query.properties.findMany({
      where: eq(properties.agentId, id),
      columns: {
        id: true,
        name: true,
        address: true,
        type: true,
      },
    });

    // Combine everything into a single object
    return {
      ...user,
      ownedProperties,
      managedProperties,
      representedProperties,
    };
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    userData: Partial<UpdateUserDto>
  ): Promise<UserProfile> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = userData;

    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  /**
   * Update user profile (self-update with limited fields)
   */
  async updateProfile(
    id: string,
    profileData: UpdateProfileDto
  ): Promise<UserProfile> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  /**
   * Set user active status
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<UserProfile> {
    const [updatedUser] = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  /**
   * Update user password - handled by better-auth, but we'll keep
   * this method as a reference for integrating with it
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.providerId, "emailpassword")
        )
      );
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    // Get total users count
    const [totalResult] = await db.select({ count: count() }).from(users);

    // Get active users count
    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    // Get users by role
    const roleCountsResult = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);

    // Get recently created users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`created_at >= ${thirtyDaysAgo}`);

    return {
      totalUsers: totalResult.count,
      activeUsers: activeResult.count,
      usersByRole: roleCountsResult.map((r) => ({
        role: r.role,
        count: Number(r.count),
      })),
      recentlyCreated: recentResult.count,
    };
  }

  /**
   * Delete a user - should be used with caution
   */
  async delete(id: string): Promise<void> {
    // Check if user is referenced in properties
    const propertiesOwned = await db.query.properties.findFirst({
      where: eq(properties.ownerId, id),
    });

    if (propertiesOwned) {
      throw new Error("Cannot delete user who owns properties");
    }

    // Better-auth will handle the cascading deletes for accounts, sessions, etc.
    await db.delete(users).where(eq(users.id, id));
  }
}

// Export a singleton instance
export const usersRepository = new UsersRepository();
