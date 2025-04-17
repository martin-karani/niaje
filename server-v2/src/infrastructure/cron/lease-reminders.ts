import { communicationsService } from "@/domains/communications/services/communications.service";
import { emailService } from "@/domains/communications/services/email.service";
import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { db } from "@/infrastructure/database";
import { addDays, differenceInDays, format } from "date-fns";
import { and, eq, lte } from "drizzle-orm";

export async function processLeaseReminders() {
  console.log("Processing lease expiry reminders...");

  // Get current date
  const today = new Date();

  // Define reminder periods (days before lease expires)
  const reminderDays = [60, 30, 14, 7]; // Remind 60, 30, 14, and 7 days before expiry

  try {
    for (const days of reminderDays) {
      // Calculate the target date (leases expiring in X days)
      const targetDate = addDays(today, days);

      // Find active leases ending around the target date (within 1 day margin)
      const leases = await db.query.leaseEntity.findMany({
        where: and(
          eq(leaseEntity.status, "active"),
          lte(leaseEntity.endDate, addDays(targetDate, 1)),
          gte(leaseEntity.endDate, addDays(targetDate, -1))
        ),
        with: {
          unit: {
            with: { property: true },
          },
          tenantAssignments: {
            with: { tenant: true },
          },
        },
      });

      console.log(`Found ${leases.length} leases expiring in ${days} days`);

      // Process each lease
      for (const lease of leases) {
        // Iterate through all tenants on the lease
        for (const assignment of lease.tenantAssignments) {
          const tenant = assignment.tenant;

          // Calculate exact days until expiry
          const daysUntilExpiry = differenceInDays(lease.endDate, today);

          // Create notification record
          await communicationsService.createCommunication({
            organizationId: lease.organizationId,
            type: "notification",
            channel: "system_generated",
            subject: `Lease Expiring - ${daysUntilExpiry} days remaining`,
            body: `Your lease for ${lease.unit.property.name} - ${lease.unit.name} is expiring on ${format(lease.endDate, "MMMM d, yyyy")}. Please contact property management to discuss renewal options.`,
            recipientTenantId: tenant.id,
            relatedLeaseId: lease.id,
            relatedPropertyId: lease.propertyId,
            relatedUnitId: lease.unitId,
          });

          // Send email if tenant has email address
          if (tenant.email) {
            await emailService.sendLeaseExpiryReminder(
              tenant.email,
              `${tenant.firstName} ${tenant.lastName}`,
              lease.unit.property.name,
              lease.unit.name,
              format(lease.endDate, "MMMM d, yyyy"),
              daysUntilExpiry
            );
          }
        }

        // Send notification to property manager as well
        // TODO: Implement notification to property manager
      }
    }

    console.log("Lease reminder processing completed successfully");
  } catch (error) {
    console.error("Error processing lease reminders:", error);
  }
}
