import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { and, eq } from "drizzle-orm";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "../dto/organization.dto";
import {
  NewOrganization,
  Organization,
  memberEntity,
  organizationEntity,
} from "../entities/organization.entity";

export class OrganizationsService {
  /**
   * Get all organizations a user is a member of
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await db.query.memberEntity.findMany({
      where: eq(memberEntity.userId, userId),
      with: {
        organization: true,
      },
    });

    return memberships.map((membership) => membership.organization);
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, id),
      with: {
        agentOwner: true,
      },
    });

    if (!organization) {
      throw new NotFoundError(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
      with: {
        agentOwner: true,
      },
    });

    if (!organization) {
      throw new NotFoundError(`Organization with slug '${slug}' not found`);
    }

    return organization;
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    data: CreateOrganizationDto & { userId: string }
  ): Promise<Organization> {
    // Generate slug if not provided
    const slug = data.slug || this.generateSlug(data.name);

    // Check if slug already exists
    const existingOrg = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (existingOrg) {
      throw new ValidationError(
        `Organization with slug '${slug}' already exists`
      );
    }

    // Create organization
    const organizationData: NewOrganization = {
      name: data.name,
      slug,
      agentOwnerId: data.userId,
      timezone: data.timezone || "UTC",
      currency: data.currency || "USD",
      dateFormat: data.dateFormat || "YYYY-MM-DD",
      logo: data.logo || null,
      address: data.address || null,
      metadata: data.metadata || null,
      trialStatus: "not_started",
      subscriptionStatus: "none",
      maxProperties: 5, // Default limits
      maxUsers: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await db.transaction(async (tx) => {
      // Insert organization
      const [organization] = await tx
        .insert(organizationEntity)
        .values(organizationData)
        .returning();

      // Add user as owner
      await tx.insert(memberEntity).values({
        organizationId: organization.id,
        userId: data.userId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return organization;
    });
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    id: string,
    data: UpdateOrganizationDto
  ): Promise<Organization> {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Check if slug exists (if updating slug)
    if (data.slug) {
      const existingOrg = await db.query.organizationEntity.findFirst({
        where: and(
          eq(organizationEntity.slug, data.slug),
          eq(organizationEntity.id, id, true) // Not the current organization
        ),
      });

      if (existingOrg) {
        throw new ValidationError(
          `Organization with slug '${data.slug}' already exists`
        );
      }
    }

    // Update organization
    const [updatedOrg] = await db
      .update(organizationEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, id))
      .returning();

    return updatedOrg;
  }

  /**
   * Delete an organization
   */
  async deleteOrganization(id: string): Promise<void> {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Delete organization (cascade will delete memberships, teams, etc.)
    await db.delete(organizationEntity).where(eq(organizationEntity.id, id));
  }

  /**
   * Check if user is a member of an organization
   */
  async isUserMemberOfOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const membership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    return !!membership;
  }

  /**
   * Get user role in organization
   */
  async getUserOrganizationRole(
    userId: string,
    organizationId: string
  ): Promise<string | null> {
    const membership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    return membership ? membership.role : null;
  }

  /**
   * Update organization subscription
   */
  async updateOrganizationSubscription(
    id: string,
    subscriptionStatus: string,
    subscriptionPlan: string | null,
    maxProperties: number,
    maxUsers: number
  ): Promise<Organization> {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Update organization
    const [updatedOrg] = await db
      .update(organizationEntity)
      .set({
        subscriptionStatus,
        subscriptionPlan,
        maxProperties,
        maxUsers,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, id))
      .returning();

    return updatedOrg;
  }

  /**
   * Update organization trial
   */
  async updateOrganizationTrial(
    id: string,
    trialStatus: string,
    trialStartedAt: Date | null,
    trialExpiresAt: Date | null
  ): Promise<Organization> {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Update organization
    const [updatedOrg] = await db
      .update(organizationEntity)
      .set({
        trialStatus,
        trialStartedAt,
        trialExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, id))
      .returning();

    return updatedOrg;
  }

  /**
   * Generate a slug from organization name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-") // Replace spaces and non-word characters with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
  }
}

// Export singleton instance
export const organizationsService = new OrganizationsService();
