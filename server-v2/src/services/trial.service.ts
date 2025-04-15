// src/services/trial.service.ts
import { db } from "@/db";
import { member, organization } from "@/db/schema";
import { addDays, differenceInDays, isBefore } from "date-fns";
import { and, eq, gte, lt, lte } from "drizzle-orm";
import { emailService } from "./email.service";

export class TrialService {
  /**
   * Check if an organization is on an active trial
   */
  async isInTrial(organizationId: string): Promise<boolean> {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
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
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
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
   */
  async processExpiredTrials(): Promise<void> {
    const now = new Date();

    // Find expired trials
    const expiredTrials = await db.query.organization.findMany({
      where: and(
        eq(organization.trialStatus, "active"),
        lt(organization.trialExpiresAt, now)
      ),
    });

    for (const org of expiredTrials) {
      // Update organization status
      await db
        .update(organization)
        .set({
          trialStatus: "expired",
          updatedAt: now,
        })
        .where(eq(organization.id, org.id));

      // Find the organization owner
      const orgOwner = await db.query.member.findFirst({
        where: and(eq(member.organizationId, org.id), eq(member.role, "owner")),
        with: {
          user: true,
        },
      });

      // Send expiration email
      if (orgOwner && orgOwner.user) {
        emailService.sendTrialExpiredEmail(
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

      const expiringTrials = await db.query.organization.findMany({
        where: and(
          eq(organization.trialStatus, "active"),
          gte(organization.trialExpiresAt, startOfDay),
          lte(organization.trialExpiresAt, endOfDay)
        ),
      });

      for (const org of expiringTrials) {
        // Find the organization owner
        const orgOwner = await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, org.id),
            eq(member.role, "owner")
          ),
          with: {
            user: true,
          },
        });

        // Send expiration warning email
        if (orgOwner && orgOwner.user) {
          emailService.sendTrialExpiringEmail(
            orgOwner.user.email,
            orgOwner.user.name,
            org.name,
            daysLeft
          );
        }
      }
    });
  }
}

export const trialService = new TrialService();
