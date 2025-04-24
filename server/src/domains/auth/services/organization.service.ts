import {
  memberEntity,
  organizationEntity,
  type Organization,
} from "@/domains/organizations/entities/organization.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import emailService from "@/infrastructure/email/email.service";
import { TRIAL_DAYS } from "@/shared/constants/subscription-plans";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { addDays } from "date-fns";
import { and, eq } from "drizzle-orm";

export class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    slug?: string;
    userId: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    logo?: string;
    address?: string;
  }): Promise<{ organization: Organization; member: any }> {
    // Validate user exists
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate slug if not provided
    const slug = data.slug
      ? this.normalizeSlug(data.slug)
      : this.generateSlug(data.name);

    // Check if slug is available
    const existingOrg = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (existingOrg) {
      throw new ValidationError("Organization identifier already taken");
    }

    // Calculate trial expiration date
    const trialExpiresAt = addDays(new Date(), TRIAL_DAYS);

    // Create organization
    const [organization] = await db
      .insert(organizationEntity)
      .values({
        name: data.name,
        slug,
        agentOwnerId: data.userId,
        trialStatus: "active",
        trialStartedAt: new Date(),
        trialExpiresAt,
        subscriptionStatus: "trialing",
        maxProperties: 5, // Trial limits
        maxUsers: 3,
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
        dateFormat: data.dateFormat || "MM/dd/yyyy",
        logo: data.logo,
        address: data.address,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add user as an owner member
    const [member] = await db
      .insert(memberEntity)
      .values({
        organizationId: organization.id,
        userId: data.userId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send welcome email
    try {
      await emailService.sendTrialWelcomeEmail(
        user.email,
        user.name || user.email,
        organization.name,
        organization.trialExpiresAt
      );
    } catch (error) {
      console.error("Error sending welcome email:", error);
      // Continue anyway - non-critical error
    }

    return { organization, member };
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, id),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  /**
   * Get organizations where user is a member
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const members = await db.query.memberEntity.findMany({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.status, "active")
      ),
      with: {
        organization: true,
      },
    });

    return members.map((member) => member.organization);
  }

  /**
   * Check if user is a member of organization
   */
  async isUserMemberOfOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId),
        eq(memberEntity.status, "active")
      ),
    });

    return !!member;
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Add random suffix to prevent collisions
    const randomSuffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `${slug}-${randomSuffix}`;
  }

  /**
   * Normalize slug
   */
  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const organizationService = new OrganizationService();
