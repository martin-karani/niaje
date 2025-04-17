import { utilityBillEntity } from "@/domains/billing/entities/utility-bill.entity";
import { communicationsService } from "@/domains/communications/services/communications.service";
import { emailService } from "@/domains/communications/services/email.service";
import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { db } from "@/infrastructure/database";
import { addDays, addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { and, eq, isNotNull } from "drizzle-orm";

/**
 * Generate monthly utility bills and send notifications
 * This task should run on the 1st of each month
 */
export async function processUtilityBills() {
  console.log("Processing utility bills...");

  try {
    // 1. Generate new utility bills for the current month
    await generateMonthlyUtilityBills();

    // 2. Send notifications for bills coming due
    await sendUtilityBillReminders();

    // 3. Process overdue utility bills
    await processOverdueUtilityBills();

    console.log("Utility bill processing completed successfully");
  } catch (error) {
    console.error("Error processing utility bills:", error);
  }
}

/**
 * Generate monthly utility bills for all units with "tenant_pays_landlord" billing type
 */
async function generateMonthlyUtilityBills() {
  // Get current date
  const today = new Date();

  // Set billing period as previous month
  const billingPeriodStart = startOfMonth(addMonths(today, -1));
  const billingPeriodEnd = endOfMonth(addMonths(today, -1));

  // Set due date as 15 days from now
  const dueDate = addDays(today, 15);

  console.log(
    `Generating utility bills for period: ${format(billingPeriodStart, "MMM yyyy")}`
  );

  // Get all active leases
  const leases = await db.query.leaseEntity.findMany({
    where: eq(leaseEntity.status, "active"),
    with: {
      unit: {
        with: { property: true },
      },
      tenantAssignments: {
        with: { tenant: true },
      },
    },
  });

  console.log(`Found ${leases.length} active leases to process`);

  // Keep track of bills created
  const billsCreated = {
    water: 0,
    electricity: 0,
    gas: 0,
    internet: 0,
    trash: 0,
  };

  // Process each lease
  for (const lease of leases) {
    // Check if the tenant should be billed directly for utilities
    // We'll process different utility types separately

    // 1. Water bills
    if (
      lease.waterBillingType === "tenant_pays_landlord_fixed" ||
      lease.waterBillingType === "tenant_pays_landlord_metered"
    ) {
      const amount = lease.waterFixedAmount || 2000; // Default amount if not specified
      await createUtilityBill(
        lease,
        "water",
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate
      );
      billsCreated.water++;
    }

    // 2. Electricity bills
    if (
      lease.electricityBillingType === "tenant_pays_landlord_fixed" ||
      lease.electricityBillingType === "tenant_pays_landlord_metered"
    ) {
      const amount = lease.electricityFixedAmount || 3000; // Default amount if not specified
      await createUtilityBill(
        lease,
        "electricity",
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate
      );
      billsCreated.electricity++;
    }

    // 3. Gas bills
    if (
      lease.gasBillingType === "tenant_pays_landlord_fixed" ||
      lease.gasBillingType === "tenant_pays_landlord_metered"
    ) {
      const amount = lease.gasFixedAmount || 1500; // Default amount if not specified
      await createUtilityBill(
        lease,
        "gas",
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate
      );
      billsCreated.gas++;
    }

    // 4. Internet bills
    if (
      lease.internetBillingType === "tenant_pays_landlord_fixed" ||
      lease.internetBillingType === "tenant_pays_landlord_metered"
    ) {
      const amount = lease.internetFixedAmount || 2500; // Default amount if not specified
      await createUtilityBill(
        lease,
        "internet",
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate
      );
      billsCreated.internet++;
    }

    // 5. Trash bills
    if (
      lease.trashBillingType === "tenant_pays_landlord_fixed" ||
      lease.trashBillingType === "tenant_pays_landlord_metered"
    ) {
      const amount = lease.trashFixedAmount || 500; // Default amount if not specified
      await createUtilityBill(
        lease,
        "trash",
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate
      );
      billsCreated.trash++;
    }
  }

  console.log(`Generated utility bills: ${JSON.stringify(billsCreated)}`);
}

/**
 * Create a utility bill for a lease
 */
async function createUtilityBill(
  lease: any,
  utilityType: string,
  amount: number,
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  dueDate: Date
) {
  // Find primary tenant for the lease
  const primaryTenantAssignment = lease.tenantAssignments.find(
    (a: any) => a.isPrimary
  );

  const tenantId = primaryTenantAssignment
    ? primaryTenantAssignment.tenant.id
    : null;

  // Check if bill already exists for this period and utility type
  const existingBill = await db.query.utilityBillEntity.findFirst({
    where: and(
      eq(utilityBillEntity.leaseId, lease.id),
      eq(utilityBillEntity.utilityType, utilityType as any),
      eq(utilityBillEntity.billingPeriodStart, billingPeriodStart),
      eq(utilityBillEntity.billingPeriodEnd, billingPeriodEnd)
    ),
  });

  if (existingBill) {
    console.log(
      `Bill already exists for lease ${lease.id}, utility ${utilityType}, period ${format(billingPeriodStart, "MMM yyyy")}`
    );
    return;
  }

  // Create the utility bill
  const newBill = await db
    .insert(utilityBillEntity)
    .values({
      organizationId: lease.organizationId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      leaseId: lease.id,
      tenantId,
      utilityType: utilityType as any,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
      amount,
      status: "due",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!newBill.length) {
    console.error(
      `Failed to create utility bill for lease ${lease.id}, utility ${utilityType}`
    );
    return;
  }

  // Send notification to tenant
  if (tenantId) {
    const tenant = primaryTenantAssignment.tenant;
    const formattedAmount = amount.toFixed(2);
    const formattedDueDate = format(dueDate, "MMMM d, yyyy");
    const utilityTypeFormatted =
      utilityType.charAt(0).toUpperCase() + utilityType.slice(1);

    // Create notification
    await communicationsService.createCommunication({
      organizationId: lease.organizationId,
      type: "notification",
      channel: "system_generated",
      subject: `New ${utilityTypeFormatted} Bill Generated`,
      body: `Your ${utilityType} bill of ${formattedAmount} for ${format(billingPeriodStart, "MMMM yyyy")} has been generated. Due date: ${formattedDueDate}.`,
      recipientTenantId: tenantId,
      relatedLeaseId: lease.id,
      relatedPropertyId: lease.propertyId,
      relatedUnitId: lease.unitId,
    });

    // Send email if tenant has email address
    if (tenant.email) {
      await emailService.sendEmail({
        to: tenant.email,
        subject: `New ${utilityTypeFormatted} Bill for ${lease.unit.property.name} - ${lease.unit.name}`,
        html: `
          <p>Hello ${tenant.firstName},</p>
          <p>Your ${utilityType} bill for ${format(billingPeriodStart, "MMMM yyyy")} has been generated.</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Property:</strong> ${lease.unit.property.name} - ${lease.unit.name}</p>
          <p>Please make your payment before the due date to avoid late fees.</p>
        `,
      });
    }
  }
}

/**
 * Send reminders for utility bills coming due
 */
async function sendUtilityBillReminders() {
  // Get current date
  const today = new Date();

  // Define reminder periods (days before bill is due)
  const reminderDays = [7, 3];

  for (const days of reminderDays) {
    // Calculate target date (bill due in X days)
    const targetDate = addDays(today, days);

    // Find bills due on the target date
    const bills = await db.query.utilityBillEntity.findMany({
      where: and(
        eq(utilityBillEntity.status, "due"),
        eq(utilityBillEntity.dueDate, targetDate)
      ),
      with: {
        unit: {
          with: { property: true },
        },
        tenant: true,
      },
    });

    console.log(`Found ${bills.length} utility bills due in ${days} days`);

    // Process each bill
    for (const bill of bills) {
      if (!bill.tenant) continue;

      const formattedAmount = Number(bill.amount).toFixed(2);
      const formattedDueDate = format(bill.dueDate, "MMMM d, yyyy");
      const utilityType =
        bill.utilityType.charAt(0).toUpperCase() + bill.utilityType.slice(1);

      // Create notification
      await communicationsService.createCommunication({
        organizationId: bill.organizationId,
        type: "notification",
        channel: "system_generated",
        subject: `${utilityType} Bill Due in ${days} Days`,
        body: `Your ${bill.utilityType} bill of ${formattedAmount} is due in ${days} days on ${formattedDueDate}.`,
        recipientTenantId: bill.tenant.id,
        relatedLeaseId: bill.leaseId,
        relatedPropertyId: bill.propertyId,
        relatedUnitId: bill.unitId,
      });

      // Send email if tenant has email address
      if (bill.tenant.email) {
        await emailService.sendEmail({
          to: bill.tenant.email,
          subject: `${utilityType} Bill Due in ${days} Days`,
          html: `
            <p>Hello ${bill.tenant.firstName},</p>
            <p>This is a reminder that your ${bill.utilityType} bill of ${formattedAmount} is due in ${days} days on ${formattedDueDate}.</p>
            <p><strong>Property:</strong> ${bill.unit.property.name} - ${bill.unit.name}</p>
            <p><strong>Billing Period:</strong> ${format(bill.billingPeriodStart, "MMMM d")} - ${format(bill.billingPeriodEnd, "MMMM d, yyyy")}</p>
            <p>Please make your payment before the due date to avoid late fees.</p>
          `,
        });
      }
    }
  }
}

/**
 * Process overdue utility bills
 */
async function processOverdueUtilityBills() {
  // Get current date
  const today = new Date();

  // Find bills that are due but not paid
  const overdueBills = await db.query.utilityBillEntity.findMany({
    where: and(
      eq(utilityBillEntity.status, "due"),
      isNotNull(utilityBillEntity.dueDate)
    ),
    with: {
      unit: {
        with: { property: true },
      },
      tenant: true,
      lease: true,
    },
  });

  // Filter to only include bills with due dates in the past
  const actuallyOverdueBills = overdueBills.filter(
    (bill) => bill.dueDate && new Date(bill.dueDate) < today
  );

  console.log(`Found ${actuallyOverdueBills.length} overdue utility bills`);

  // Process each overdue bill
  for (const bill of actuallyOverdueBills) {
    if (!bill.tenant) continue;

    // Calculate days overdue
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(bill.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Only send reminders at specific intervals (3, 7, 14, 30 days)
    if (![3, 7, 14, 30].includes(daysOverdue)) continue;

    // Update bill status to overdue if not already
    if (bill.status !== "overdue") {
      await db
        .update(utilityBillEntity)
        .set({
          status: "overdue",
          updatedAt: new Date(),
        })
        .where(eq(utilityBillEntity.id, bill.id));
    }

    const formattedAmount = Number(bill.amount).toFixed(2);
    const formattedDueDate = format(new Date(bill.dueDate), "MMMM d, yyyy");
    const utilityType =
      bill.utilityType.charAt(0).toUpperCase() + bill.utilityType.slice(1);

    // Create notification
    await communicationsService.createCommunication({
      organizationId: bill.organizationId,
      type: "notification",
      channel: "system_generated",
      subject: `Overdue ${utilityType} Bill - ${daysOverdue} Days Past Due`,
      body: `Your ${bill.utilityType} bill of ${formattedAmount} was due on ${formattedDueDate} and is now ${daysOverdue} days overdue.`,
      recipientTenantId: bill.tenant.id,
      relatedLeaseId: bill.leaseId,
      relatedPropertyId: bill.propertyId,
      relatedUnitId: bill.unitId,
    });

    // Send email if tenant has email address
    if (bill.tenant.email) {
      await emailService.sendEmail({
        to: bill.tenant.email,
        subject: `OVERDUE: ${utilityType} Bill - ${daysOverdue} Days Past Due`,
        html: `
          <p>Hello ${bill.tenant.firstName},</p>
          <p>Your ${bill.utilityType} bill of ${formattedAmount} was due on ${formattedDueDate} and is now <strong>${daysOverdue} days overdue</strong>.</p>
          <p><strong>Property:</strong> ${bill.unit.property.name} - ${bill.unit.name}</p>
          <p><strong>Billing Period:</strong> ${format(new Date(bill.billingPeriodStart), "MMMM d")} - ${format(new Date(bill.billingPeriodEnd), "MMMM d, yyyy")}</p>
          <p>Please make your payment as soon as possible to avoid additional late fees or service interruption.</p>
        `,
      });
    }

    // For significantly overdue bills (30+ days), notify property manager as well
    if (daysOverdue >= 30 && bill.unit.property.caretakerId) {
      // Get caretaker
      const caretaker = await db.query.userEntity.findFirst({
        where: eq(userEntity.id, bill.unit.property.caretakerId),
      });

      if (caretaker && caretaker.email) {
        await emailService.sendEmail({
          to: caretaker.email,
          subject: `URGENT: Utility Bill 30+ Days Overdue for Unit ${bill.unit.name}`,
          html: `
            <p>Hello ${caretaker.name},</p>
            <p>This is to notify you that the ${bill.utilityType} bill for ${bill.unit.property.name} - ${bill.unit.name} is now ${daysOverdue} days overdue.</p>
            <p><strong>Tenant:</strong> ${bill.tenant.firstName} ${bill.tenant.lastName}</p>
            <p><strong>Amount Due:</strong> ${formattedAmount}</p>
            <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            <p>Please follow up with the tenant regarding this overdue payment.</p>
          `,
        });
      }
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  processUtilityBills()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { processUtilityBills };
