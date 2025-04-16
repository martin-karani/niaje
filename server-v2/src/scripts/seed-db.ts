import { db } from "@/db";
import {
  leases,
  leaseTenants,
  member,
  organization,
  properties,
  tenants,
  units,
  user,
} from "@/db/schema";
import { createId } from "@/db/utils";
import { hashPassword } from "@/utils/auth.utils";
import { addMonths } from "date-fns";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Create admin user
    const adminPassword = await hashPassword("admin123");

    const adminUser = await db
      .insert(user)
      .values({
        id: createId(),
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: adminPassword,
        role: "admin",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Admin user created: ${adminUser[0].email}`);

    // Create agent user
    const agentPassword = await hashPassword("agent123");

    const agentUser = await db
      .insert(user)
      .values({
        id: createId(),
        name: "Agent Demo",
        email: "agent@example.com",
        passwordHash: agentPassword,
        role: "agent_owner",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Agent user created: ${agentUser[0].email}`);

    // Create organization for agent
    const org = await db
      .insert(organization)
      .values({
        id: createId(),
        name: "Demo Property Management",
        slug: "demo-property-management",
        agentOwnerId: agentUser[0].id,
        trialStatus: "active",
        trialStartedAt: new Date(),
        trialExpiresAt: addMonths(new Date(), 1),
        subscriptionStatus: "trialing",
        maxProperties: 10,
        maxUsers: 5,
        timezone: "UTC",
        currency: "USD",
        dateFormat: "MM/DD/YYYY",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Organization created: ${org[0].name}`);

    // Add agent as member
    await db.insert(member).values({
      id: createId(),
      organizationId: org[0].id,
      userId: agentUser[0].id,
      role: "agent_owner",
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create property owner user
    const ownerPassword = await hashPassword("owner123");

    const ownerUser = await db
      .insert(user)
      .values({
        id: createId(),
        name: "Property Owner",
        email: "owner@example.com",
        passwordHash: ownerPassword,
        role: "property_owner",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Owner user created: ${ownerUser[0].email}`);

    // Create caretaker user
    const caretakerPassword = await hashPassword("caretaker123");

    const caretakerUser = await db
      .insert(user)
      .values({
        id: createId(),
        name: "John Caretaker",
        email: "caretaker@example.com",
        passwordHash: caretakerPassword,
        role: "caretaker",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Caretaker user created: ${caretakerUser[0].email}`);

    // Create a property
    const property = await db
      .insert(properties)
      .values({
        id: createId(),
        organizationId: org[0].id,
        ownerId: ownerUser[0].id,
        caretakerId: caretakerUser[0].id,
        name: "Sunset Apartments",
        addressLine1: "123 Main Street",
        city: "Anytown",
        state: "CA",
        postalCode: "12345",
        country: "USA",
        type: "residential",
        status: "active",
        description: "A beautiful apartment complex near downtown",
        numberOfUnits: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Property created: ${property[0].name}`);

    // Create units
    const unit1 = await db
      .insert(units)
      .values({
        id: createId(),
        propertyId: property[0].id,
        organizationId: org[0].id,
        name: "Unit 101",
        type: "1br",
        status: "vacant",
        bedrooms: 1,
        bathrooms: 1,
        sizeSqFt: 750,
        marketRent: 1200,
        depositAmount: 1200,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const unit2 = await db
      .insert(units)
      .values({
        id: createId(),
        propertyId: property[0].id,
        organizationId: org[0].id,
        name: "Unit 102",
        type: "2br",
        status: "occupied",
        bedrooms: 2,
        bathrooms: 1.5,
        sizeSqFt: 950,
        marketRent: 1500,
        currentRent: 1500,
        depositAmount: 1500,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Units created: ${unit1[0].name}, ${unit2[0].name}`);

    // Create tenant
    const tenant = await db
      .insert(tenants)
      .values({
        id: createId(),
        organizationId: org[0].id,
        firstName: "Jane",
        lastName: "Tenant",
        email: "tenant@example.com",
        phone: "555-123-4567",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Tenant created: ${tenant[0].firstName} ${tenant[0].lastName}`);

    // Create lease for Unit 102
    const lease = await db
      .insert(leases)
      .values({
        id: createId(),
        organizationId: org[0].id,
        unitId: unit2[0].id,
        propertyId: property[0].id,
        status: "active",
        startDate: new Date(),
        endDate: addMonths(new Date(), 12),
        rentAmount: 1500,
        depositAmount: 1500,
        paymentDay: 1,
        createdBy: agentUser[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Lease created for ${unit2[0].name}`);

    // Add tenant to lease
    await db.insert(leaseTenants).values({
      id: createId(),
      leaseId: lease[0].id,
      tenantId: tenant[0].id,
      isPrimary: true,
      createdAt: new Date(),
    });

    console.log(`Tenant added to lease`);

    // Create tenant user for portal access
    const tenantPassword = await hashPassword("tenant123");

    const tenantUser = await db
      .insert(user)
      .values({
        id: createId(),
        name: `${tenant[0].firstName} ${tenant[0].lastName}`,
        email: tenant[0].email,
        passwordHash: tenantPassword,
        role: "tenant_user",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Link tenant record to user
    await db
      .update(tenants)
      .set({ userId: tenantUser[0].id })
      .where(eq(tenants.id, tenant[0].id));

    console.log(
      `Tenant user created for portal access: ${tenantUser[0].email}`
    );

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Database seeding failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
