// src/services/organization.service.ts
import { db } from "@/db";
import { member, organization, properties } from "@/db/schema";
import { addMonths } from "date-fns";
import { eq } from "drizzle-orm";

export class OrganizationService {
  /**
   * Create a new organization (Agent business)
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    agentOwnerId: string;
    timezone?: string;
    currency?: string;
    // Other org fields
  }) {
    // Create the organization
    const result = await db
      .insert(organization)
      .values({
        ...data,
        trialStatus: "active",
        trialStartedAt: new Date(),
        trialExpiresAt: addMonths(new Date(), 1), // 1 month trial
        subscriptionStatus: "trialing",
        maxProperties: 5, // Trial limits
        maxUsers: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newOrg = result[0];

    // Create the owner membership
    await db.insert(member).values({
      organizationId: newOrg.id,
      userId: data.agentOwnerId,
      role: "agent_owner",
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return newOrg;
  }

  /**
   * Get organization details with statistics
   */
  async getOrganizationDetails(organizationId: string) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      with: {
        agentOwner: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Get counts
    const propertyCount = await db.query.properties
      .findMany({
        where: eq(properties.organizationId, organizationId),
      })
      .then((props) => props.length);

    const memberCount = await db.query.member
      .findMany({
        where: eq(member.organizationId, organizationId),
      })
      .then((members) => members.length);

    // Get distinct property owners
    const props = await db.query.properties.findMany({
      where: eq(properties.organizationId, organizationId),
      columns: { ownerId: true },
    });

    const uniqueOwnerIds = [...new Set(props.map((p) => p.ownerId))];
    const ownerCount = uniqueOwnerIds.length;

    // Get distinct caretakers
    const propsWithCaretakers = await db.query.properties.findMany({
      where: eq(properties.organizationId, organizationId),
      columns: { caretakerId: true },
    });

    const uniqueCaretakerIds = [
      ...new Set(
        propsWithCaretakers
          .filter((p) => p.caretakerId !== null)
          .map((p) => p.caretakerId)
      ),
    ];
    const caretakerCount = uniqueCaretakerIds.length;

    return {
      ...org,
      stats: {
        propertiesCount: propertyCount,
        staffCount: memberCount,
        ownersCount: ownerCount,
        caretakersCount: caretakerCount,
        usagePercentage: {
          properties: Math.round((propertyCount / org.maxProperties) * 100),
          staff: Math.round((memberCount / org.maxUsers) * 100),
        },
      },
    };
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    organizationId: string,
    data: Partial<{
      name: string;
      timezone: string;
      currency: string;
      dateFormat: string;
      address: string;
      logo: string;
      // Other updatable fields
    }>
  ) {
    const result = await db
      .update(organization)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organization.id, organizationId))
      .returning();

    return result[0];
  }
}

export const organizationService = new OrganizationService();
