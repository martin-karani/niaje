// src/cron/lease-reminders.ts
import { db } from "@/db";
import { leases } from "@/db/schema";
import { communicationsService } from "@/services/features/communications.service";
import { emailService } from "@/services/system/email.service";
import { addDays, format } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

export async function processLeaseReminders() {
  console.log("Processing lease expiry reminders...");

  // Get current date
  const today = new Date();

  // Define reminder periods
  const reminderDays = [90, 60, 30, 14, 7]; // Days before expiry to send reminders

  try {
    for (const days of reminderDays) {
      // Calculate the target date
      const targetDate = addDays(today, days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Find leases expiring on target date
      const expiringLeases = await db.query.leases.findMany({
        where: and(
          eq(leases.status, "active"),
          gte(leases.endDate, startOfDay),
          lte(leases.endDate, endOfDay)
        ),
        with: {
          unit: {
            with: {
              property: true,
            },
          },
          tenantAssignments: {
            with: {
              tenant: true,
            },
          },
        },
      });

      console.log(
        `Found ${expiringLeases.length} leases expiring in ${days} days`
      );

      // Process each lease
      for (const lease of expiringLeases) {
        // Get primary tenant
        const primaryTenant = lease.tenantAssignments.find(
          (ta) => ta.isPrimary
        )?.tenant;

        if (!primaryTenant) continue;

        // Create notification record
        await communicationsService.createCommunication({
          organizationId: lease.organizationId,
          type: "notification",
          channel: "system_generated",
          subject: `Lease Expiry Reminder - ${days} days remaining`,
          body: `Your lease for ${lease.unit.property.name} - ${lease.unit.name} will expire on ${format(lease.endDate, "MMMM d, yyyy")}. Please contact property management to discuss renewal options.`,
          recipientTenantId: primaryTenant.id,
          relatedLeaseId: lease.id,
          relatedPropertyId: lease.propertyId,
          relatedUnitId: lease.unitId,
        });

        // Send email to tenant if they have an email address
        if (primaryTenant.email) {
          await emailService.sendLeaseExpiryReminder(
            primaryTenant.email,
            `${primaryTenant.firstName} ${primaryTenant.lastName}`,
            lease.unit.property.name,
            lease.unit.name,
            format(lease.endDate, "MMMM d, yyyy"),
            days
          );
        }
      }
    }

    console.log("Lease expiry reminder processing completed successfully");
  } catch (error) {
    console.error("Error processing lease expiry reminders:", error);
  }
}
