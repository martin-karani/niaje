import { communicationsService } from "@domains/communications/services/communications.service";
import { emailService } from "@domains/communications/services/email.service";
import { leaseEntity } from "@domains/leases/entities/lease.entity";
import { db } from "@infrastructure/database";
import { addDays, format } from "date-fns";
import { and, eq } from "drizzle-orm";

export async function processRentReminders() {
  console.log("Processing rent due reminders...");

  // Get current date
  const today = new Date();

  // Define reminder periods (days before rent is due)
  const reminderDays = [7, 3, 1]; // Remind 7 days, 3 days, and 1 day before rent is due

  try {
    for (const days of reminderDays) {
      // Calculate the target date (when rent will be due)
      const targetDate = addDays(today, days);

      // Find active leases with rent due on the target date
      const leases = await db.query.leaseEntity.findMany({
        where: and(
          eq(leaseEntity.status, "active")
          // This logic depends on how you store the next payment date
          // Assuming you have a nextPaymentDate field or calculate it based on paymentDay
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

      console.log(
        `Found ${leases.length} leases with rent due in ${days} days`
      );

      // Process each lease
      for (const lease of leases) {
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
          subject: `Rent Due Reminder - Due in ${days} days`,
          body: `Your rent payment of ${lease.rentAmount} is due in ${days} days for ${lease.unit.property.name} - ${lease.unit.name}.`,
          recipientTenantId: primaryTenant.id,
          relatedLeaseId: lease.id,
          relatedPropertyId: lease.propertyId,
        });

        // Send email if tenant has email address
        if (primaryTenant.email) {
          await emailService.sendRentDueReminder(
            primaryTenant.email,
            `${primaryTenant.firstName} ${primaryTenant.lastName}`,
            lease.unit.property.name,
            lease.unit.name,
            format(targetDate, "MMMM d, yyyy"),
            Number(lease.rentAmount),
            "KES" // Or get currency from organization settings
          );
        }
      }
    }

    console.log("Rent reminder processing completed successfully");
  } catch (error) {
    console.error("Error processing rent reminders:", error);
  }
}
