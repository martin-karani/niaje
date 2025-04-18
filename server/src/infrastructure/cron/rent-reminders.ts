import { paymentEntity } from "@/domains/billing/entities/payment.entity";
import { communicationsService } from "@/domains/communications/services/communications.service";
import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { db } from "@/infrastructure/database";
import { emailService } from "@/infrastructure/email/email.service";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { and, eq, isNotNull } from "drizzle-orm";

/**
 * Processes rent reminders for:
 * 1. Coming due soon (7 days and 3 days before due date)
 * 2. Due today
 * 3. Overdue (3 days, 7 days, and 14 days after due date)
 */
export async function processRentReminders() {
  console.log("Processing rent reminders...");

  // Get current date
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  try {
    // 1. Process upcoming rent reminders (7 days and 3 days before)
    await processUpcomingRentReminders(today);

    // 2. Process due today reminders
    await processDueTodayReminders(startOfToday, endOfToday);

    // 3. Process overdue reminders
    await processOverdueReminders(today);

    console.log("Rent reminder processing completed successfully");
  } catch (error) {
    console.error("Error processing rent reminders:", error);
  }
}

/**
 * Process reminders for rent coming due soon
 */
async function processUpcomingRentReminders(today: Date) {
  // Define reminder periods (days before rent is due)
  const reminderDays = [7, 3];

  for (const days of reminderDays) {
    // Calculate target date (rent due in X days)
    const targetDate = addDays(today, days);
    const targetDay = targetDate.getDate();

    // Find active leases with payment day matching the target date
    const leases = await db.query.leaseEntity.findMany({
      where: and(
        eq(leaseEntity.status, "active"),
        eq(leaseEntity.paymentDay, targetDay)
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

    console.log(`Found ${leases.length} leases with rent due in ${days} days`);

    // Process each lease
    for (const lease of leases) {
      // Skip if payment has already been made for this period
      const alreadyPaid = await checkIfPaymentMade(lease.id, targetDate);
      if (alreadyPaid) continue;

      // Iterate through all tenants on the lease
      for (const assignment of lease.tenantAssignments) {
        const tenant = assignment.tenant;

        // Only send notifications to primary tenants if desired
        // if (!assignment.isPrimary) continue;

        // Format due date for display
        const dueDate = format(targetDate, "MMMM d, yyyy");

        // Create notification record
        await communicationsService.createCommunication({
          organizationId: lease.organizationId,
          type: "notification",
          channel: "system_generated",
          subject: `Rent Due in ${days} Days`,
          body: `Your rent payment of ${lease.rentAmount} is due on ${dueDate} for ${lease.unit.property.name} - ${lease.unit.name}.`,
          recipientTenantId: tenant.id,
          relatedLeaseId: lease.id,
          relatedPropertyId: lease.propertyId,
          relatedUnitId: lease.unitId,
        });

        // Send email if tenant has email address
        if (tenant.email) {
          await emailService.sendRentDueReminder(
            tenant.email,
            `${tenant.firstName} ${tenant.lastName}`,
            lease.unit.property.name,
            lease.unit.name,
            dueDate,
            Number(lease.rentAmount),
            "KES" // Default currency, can be made configurable
          );
        }
      }
    }
  }
}

/**
 * Process reminders for rent due today
 */
async function processDueTodayReminders(startOfToday: Date, endOfToday: Date) {
  // Get current day of month
  const currentDay = startOfToday.getDate();

  // Find active leases with payment day matching today
  const leases = await db.query.leaseEntity.findMany({
    where: and(
      eq(leaseEntity.status, "active"),
      eq(leaseEntity.paymentDay, currentDay)
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

  console.log(`Found ${leases.length} leases with rent due today`);

  // Process each lease
  for (const lease of leases) {
    // Skip if payment has already been made for this period
    const alreadyPaid = await checkIfPaymentMade(lease.id, startOfToday);
    if (alreadyPaid) continue;

    // Iterate through all tenants on the lease
    for (const assignment of lease.tenantAssignments) {
      const tenant = assignment.tenant;

      // Format due date for display
      const dueDate = format(startOfToday, "MMMM d, yyyy");

      // Create notification record
      await communicationsService.createCommunication({
        organizationId: lease.organizationId,
        type: "notification",
        channel: "system_generated",
        subject: "Rent Due Today",
        body: `Your rent payment of ${lease.rentAmount} is due today for ${lease.unit.property.name} - ${lease.unit.name}.`,
        recipientTenantId: tenant.id,
        relatedLeaseId: lease.id,
        relatedPropertyId: lease.propertyId,
        relatedUnitId: lease.unitId,
      });

      // Send email if tenant has email address
      if (tenant.email) {
        await emailService.sendRentDueReminder(
          tenant.email,
          `${tenant.firstName} ${tenant.lastName}`,
          lease.unit.property.name,
          lease.unit.name,
          dueDate,
          Number(lease.rentAmount),
          "KES" // Default currency, can be made configurable
        );
      }
    }
  }
}

/**
 * Process reminders for overdue rent
 */
async function processOverdueReminders(today: Date) {
  // Define overdue periods (days after rent was due)
  const overdueDays = [3, 7, 14];

  for (const days of overdueDays) {
    // Calculate target date (rent was due X days ago)
    const targetDate = addDays(today, -days);
    const targetDay = targetDate.getDate();

    // Find active leases with payment day matching the target date
    const leases = await db.query.leaseEntity.findMany({
      where: and(
        eq(leaseEntity.status, "active"),
        eq(leaseEntity.paymentDay, targetDay)
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
      `Found ${leases.length} leases with rent overdue by ${days} days`
    );

    // Process each lease
    for (const lease of leases) {
      // Skip if payment has already been made for this period
      const alreadyPaid = await checkIfPaymentMade(lease.id, targetDate);
      if (alreadyPaid) continue;

      // Calculate late fee if applicable
      let lateFeeAmount = 0;
      if (lease.lateFeeType === "fixed" && lease.lateFeeAmount) {
        lateFeeAmount = Number(lease.lateFeeAmount);
      } else if (lease.lateFeeType === "percentage" && lease.lateFeeAmount) {
        // Calculate percentage of rent
        const percentage = Number(lease.lateFeeAmount);
        lateFeeAmount = Number(lease.rentAmount) * (percentage / 100);

        // Cap at max amount if specified
        if (
          lease.lateFeeMaxAmount &&
          lateFeeAmount > Number(lease.lateFeeMaxAmount)
        ) {
          lateFeeAmount = Number(lease.lateFeeMaxAmount);
        }
      }

      // Iterate through all tenants on the lease
      for (const assignment of lease.tenantAssignments) {
        const tenant = assignment.tenant;

        // Only send to primary tenants for overdue notices
        if (!assignment.isPrimary) continue;

        // Format due date for display
        const dueDate = format(targetDate, "MMMM d, yyyy");

        // Create notification with appropriate message based on days overdue
        let subject = `Rent Overdue - ${days} Days Late`;
        let body = `Your rent payment of ${lease.rentAmount} for ${lease.unit.property.name} - ${lease.unit.name} was due on ${dueDate} and is now ${days} days overdue.`;

        // Add late fee message if applicable
        if (lateFeeAmount > 0) {
          body += ` A late fee of ${lateFeeAmount} has been applied.`;
        }

        await communicationsService.createCommunication({
          organizationId: lease.organizationId,
          type: "notification",
          channel: "system_generated",
          subject,
          body,
          recipientTenantId: tenant.id,
          relatedLeaseId: lease.id,
          relatedPropertyId: lease.propertyId,
          relatedUnitId: lease.unitId,
        });

        // Send email if tenant has email address
        if (tenant.email) {
          await emailService.sendEmail({
            to: tenant.email,
            subject,
            html: `
              <p>Hello ${tenant.firstName},</p>
              <p>${body}</p>
              <p>Please make your payment as soon as possible to avoid further late fees.</p>
              <p>If you have already made your payment, please disregard this notice.</p>
            `,
          });
        }
      }

      // Also notify property managers for significantly overdue rent (14+ days)
      if (days >= 14) {
        // Notify property manager or caretaker (implementation would depend on your system design)
        // This could involve notifying the caretaker assigned to the property
        if (lease.unit.property.caretakerId) {
          // Get caretaker
          const caretaker = await db.query.userEntity.findFirst({
            where: eq(userEntity.id, lease.unit.property.caretakerId),
          });

          if (caretaker && caretaker.email) {
            // Get tenant names
            const tenantNames = lease.tenantAssignments
              .map((a) => `${a.tenant.firstName} ${a.tenant.lastName}`)
              .join(", ");

            await emailService.sendEmail({
              to: caretaker.email,
              subject: `URGENT: Rent Overdue for Unit ${lease.unit.name}`,
              html: `
                <p>Hello ${caretaker.name},</p>
                <p>This is to notify you that the rent for ${lease.unit.property.name} - ${lease.unit.name} is now ${days} days overdue.</p>
                <p>Tenant(s): ${tenantNames}</p>
                <p>Amount Due: ${lease.rentAmount}</p>
                <p>Due Date: ${format(targetDate, "MMMM d, yyyy")}</p>
                <p>Please follow up with the tenant(s) regarding this overdue payment.</p>
              `,
            });
          }
        }
      }
    }
  }
}

/**
 * Check if a rent payment has already been made for the given lease and period
 */
async function checkIfPaymentMade(
  leaseId: string,
  dueDate: Date
): Promise<boolean> {
  // Calculate month and year of due date
  const dueMonth = dueDate.getMonth();
  const dueYear = dueDate.getFullYear();

  // Find rent payments for this lease in the current month
  const payments = await db.query.paymentEntity.findMany({
    where: and(
      eq(paymentEntity.leaseId, leaseId),
      eq(paymentEntity.type, "rent"),
      eq(paymentEntity.status, "successful"),
      isNotNull(paymentEntity.paidDate)
    ),
  });

  // Check if any payment was made for the current month
  return payments.some((payment) => {
    if (!payment.paidDate) return false;

    const paidDate = new Date(payment.paidDate);
    return (
      paidDate.getMonth() === dueMonth && paidDate.getFullYear() === dueYear
    );
  });
}

// Run the script if called directly
if (require.main === module) {
  processRentReminders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { processRentReminders };
