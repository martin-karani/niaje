import {
  memberEntity,
  organizationEntity,
} from "@/domains/organizations/entities";
import { db } from "@/infrastructure/database";
import { EmailService } from "@/infrastructure/email/email.service";
import { addDays, differenceInDays, isBefore } from "date-fns";
import { and, eq, gte, lt, lte } from "drizzle-orm";

export class TrialService {
  constructor(private emailService: EmailService) {}

  /**
   * Check if an organization is on an active trial
   */
  async isInTrial(organizationId: string): Promise<boolean> {
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) return false;

    return (
      org.trialStatus === "active" &&
      org.trialExpiresAt &&
      isBefore(new Date(), new Date(org.trialExpiresAt))
    );
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(organizationId: string): Promise<number> {
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org || org.trialStatus !== "active" || !org.trialExpiresAt) {
      return 0;
    }

    const now = new Date();
    const expiresAt = new Date(org.trialExpiresAt);

    if (isBefore(expiresAt, now)) {
      return 0;
    }

    return differenceInDays(expiresAt, now);
  }

  /**
   * Process expired trials
   * This should be run on a schedule (e.g., daily cron job)
   */
  async processExpiredTrials(): Promise<void> {
    const now = new Date();

    // Find expired trials
    const expiredTrials = await db.query.organizationEntity.findMany({
      where: and(
        eq(organizationEntity.trialStatus, "active"),
        lt(organizationEntity.trialExpiresAt, now)
      ),
    });

    for (const org of expiredTrials) {
      // Update organization status
      await db
        .update(organizationEntity)
        .set({
          trialStatus: "expired",
          updatedAt: now,
        })
        .where(eq(organizationEntity.id, org.id));

      // Find the organization owner
      const orgOwner = await db.query.memberEntity.findFirst({
        where: and(
          eq(memberEntity.organizationId, org.id),
          eq(memberEntity.role, "owner")
        ),
        with: {
          user: true,
        },
      });

      // Send expiration email
      if (orgOwner && orgOwner.user) {
        this.emailService.sendTrialExpiredEmail(
          orgOwner.user.email,
          orgOwner.user.name,
          org.name
        );
      }
    }

    // Find trials expiring in 7 days and 3 days to send reminder emails
    [7, 3].forEach(async (daysLeft) => {
      const targetDate = addDays(now, daysLeft);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const expiringTrials = await db.query.organizationEntity.findMany({
        where: and(
          eq(organizationEntity.trialStatus, "active"),
          gte(organizationEntity.trialExpiresAt, startOfDay),
          lte(organizationEntity.trialExpiresAt, endOfDay)
        ),
      });

      for (const org of expiringTrials) {
        // Find the organization owner
        const orgOwner = await db.query.memberEntity.findFirst({
          where: and(
            eq(memberEntity.organizationId, org.id),
            eq(memberEntity.role, "owner")
          ),
          with: {
            user: true,
          },
        });

        // Send expiration warning email
        if (orgOwner && orgOwner.user) {
          this.emailService.sendTrialExpiringEmail(
            orgOwner.user.email,
            orgOwner.user.name,
            org.name,
            daysLeft
          );
        }
      }
    });
  }

  /**
   * Start a trial for an organization
   * @param organizationId The organization ID
   * @param trialDays Number of days for the trial (defaults to 14)
   */
  async startTrial(
    organizationId: string,
    trialDays: number = 14
  ): Promise<void> {
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    // Calculate trial expiration date
    const expiresAt = addDays(new Date(), trialDays);

    // Update organization with trial details
    await db
      .update(organizationEntity)
      .set({
        trialStatus: "active",
        trialExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, org.id));

    // Find the organization owner
    const orgOwner = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.organizationId, org.id),
        eq(memberEntity.role, "owner")
      ),
      with: {
        user: true,
      },
    });

    // Send welcome email with trial info
    if (orgOwner && orgOwner.user) {
      this.emailService.sendTrialStartedEmail(
        orgOwner.user.email,
        orgOwner.user.name,
        org.name,
        trialDays
      );
    }
  }
}

// Create and export singleton instance
export const trialService = new TrialService(new EmailService());
