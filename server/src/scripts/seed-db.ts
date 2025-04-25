import { db } from "@/infrastructure/database";
import * as authUtils from "@/shared/utils/auth.utils";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as process from "process";

// Import entity schemas from domains
import {
  expenseEntity,
  paymentEntity,
  utilityBillEntity,
} from "@/domains/billing/entities";
import { communicationEntity } from "@/domains/communications/entities";
import { documentEntity } from "@/domains/documents/entities";
import { inspectionEntity } from "@/domains/inspections/entities";
import { leaseEntity } from "@/domains/leases/entities";
import { maintenanceRequestsEntity } from "@/domains/maintenance/entities";
import {
  invitationEntity,
  memberEntity,
  organizationEntity,
  teamEntity,
  teamPropertyEntity,
} from "@/domains/organizations/entities";
import { propertyEntity, unitEntity } from "@/domains/properties/entities";
import { tenantEntity } from "@/domains/tenants/entities";
import { leaseTenantsEntity } from "@/domains/tenants/entities/lease-tenant.entity";
import {
  accountEntity,
  sessionEntity,
  userEntity,
  verificationEntity,
} from "@/domains/users/entities";

// Create ID generator function
const createId = () => nanoid(12);

/**
 * Seed database with realistic test data
 */
async function seedDatabase(resetFirst: boolean = false) {
  console.log(
    `Starting database ${resetFirst ? "reset and " : ""}seeding process...`
  );

  // Connect to the database
  console.log("Connected to database");

  // Reset database if requested
  if (resetFirst) {
    console.log("Resetting database...");

    try {
      // Delete records from all tables in reverse order of dependencies
      // Note: Order matters for foreign key constraints
      await db.delete(communicationEntity);
      await db.delete(documentEntity);
      await db.delete(utilityBillEntity);
      await db.delete(paymentEntity);
      await db.delete(expenseEntity);
      await db.delete(maintenanceRequestsEntity);
      await db.delete(inspectionEntity);
      await db.delete(leaseTenantsEntity);
      await db.delete(leaseEntity);
      await db.delete(tenantEntity);
      await db.delete(teamPropertyEntity);
      await db.delete(unitEntity);
      await db.delete(propertyEntity);
      await db.delete(memberEntity);
      await db.delete(teamEntity);
      await db.delete(invitationEntity);
      await db.delete(organizationEntity);
      await db.delete(verificationEntity);
      await db.delete(sessionEntity);
      await db.delete(accountEntity);
      await db.delete(userEntity);

      console.log("Database reset complete");
    } catch (error) {
      console.warn("Error during database reset:", error);
      console.log("Continuing with seeding...");
    }
  }

  // Step 1: Create admin user and regular users
  console.log("Step 1: Creating users...");

  // Check if admin user already exists to avoid duplicates
  const existingAdmin = await db.query.userEntity.findFirst({
    where: eq(userEntity.email, "admin@propertysystem.com"),
  });

  // Create admin user first (needed for other relationships)
  let adminUserId;

  if (!existingAdmin) {
    const adminPasswordHash = await authUtils.hashPassword("admin123");
    adminUserId = createId();

    await db.insert(userEntity).values({
      id: adminUserId,
      name: "System Admin",
      email: "admin@propertysystem.com",
      passwordHash: adminPasswordHash,
      phone: "+1234567890",
      role: "admin",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created admin user");
  } else {
    adminUserId = existingAdmin.id;
    console.log("Admin user already exists, using existing account");
  }

  // Create regular users
  const userRoles = [
    "agent_owner",
    "agent_staff",
    "property_owner",
    "caretaker",
    "tenant_user",
  ];
  const userIds = [];

  for (let i = 0; i < 30; i++) {
    const role = userRoles[i % userRoles.length];
    const userId = createId();
    userIds.push({ id: userId, role });

    await db.insert(userEntity).values({
      id: userId,
      name: await generateFullName(),
      email: `user${i}@example.com`,
      passwordHash: await authUtils.hashPassword("password123"),
      phone: await generatePhoneNumber(),
      isActive: true,
      emailVerified: true,
      city: await generateCity(),
      country: "Kenya",
      bio: "User bio goes here.",
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${userIds.length} users`);

  // Filter users by role
  const agentOwnerUsers = userIds.filter((u) => u.role === "agent_owner");
  const agentStaffUsers = userIds.filter((u) => u.role === "agent_staff");
  const propertyOwnerUsers = userIds.filter((u) => u.role === "property_owner");
  const caretakerUsers = userIds.filter((u) => u.role === "caretaker");
  const tenantUsers = userIds.filter((u) => u.role === "tenant_user");

  // Step 2: Create organizations with valid agent owners
  console.log("Step 2: Creating organizations...");

  const orgIds = [];
  const orgNames = [
    "Skyline Properties",
    "Metro Estates",
    "Urban Realty",
    "City Homes",
    "Royal Residences",
  ];

  for (let i = 0; i < 5; i++) {
    const orgId = createId();
    orgIds.push(orgId);
    const ownerUser = agentOwnerUsers[i % agentOwnerUsers.length] || {
      id: adminUserId,
    };

    await db.insert(organizationEntity).values({
      id: orgId,
      name: orgNames[i],
      slug: `org-${i + 1}`,
      agentOwnerId: ownerUser.id,
      trialStatus: "active",
      trialStartedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionStatus: "trialing",
      subscriptionPlan: "basic",
      customerId: `cust_${Date.now()}_${i}`,
      maxProperties: 5 + i * 5,
      maxUsers: 3 + i * 2,
      timezone: "Africa/Nairobi",
      currency: "KES",
      dateFormat: "YYYY-MM-DD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create owner membership
    await db.insert(memberEntity).values({
      id: createId(),
      organizationId: orgId,
      userId: ownerUser.id,
      role: "agent_owner",
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${orgIds.length} organizations`);

  // Step 3: Create teams
  console.log("Step 3: Creating teams...");

  const teamIds = [];
  const teamNames = [
    "Sales Team",
    "Maintenance Team",
    "Leasing Team",
    "Property Management Team",
    "Residential Team",
    "Commercial Team",
    "North Region",
    "South Region",
    "East Region",
    "West Region",
  ];

  for (let i = 0; i < 10; i++) {
    const teamId = createId();
    teamIds.push(teamId);
    const orgId = orgIds[i % orgIds.length];

    await db.insert(teamEntity).values({
      id: teamId,
      name: teamNames[i % teamNames.length],
      organizationId: orgId,
      description: `Team responsible for ${teamNames[i % teamNames.length].toLowerCase()} activities`,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${teamIds.length} teams`);

  // Step 4: Create members
  console.log("Step 4: Creating organization members...");

  // Assign staff members to organizations and teams
  for (let i = 0; i < Math.min(agentStaffUsers.length, 20); i++) {
    const staffUser = agentStaffUsers[i];
    const orgId = orgIds[i % orgIds.length];
    const teamId = teamIds[i % teamIds.length];

    // Check if membership already exists
    const existingMembership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.organizationId, orgId),
        eq(memberEntity.userId, staffUser.id)
      ),
    });

    if (!existingMembership) {
      await db.insert(memberEntity).values({
        id: createId(),
        organizationId: orgId,
        userId: staffUser.id,
        teamId: teamId,
        role: "agent_staff",
        status: "active",
        joinedAt: new Date(Date.now() - i * 86400000),
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(),
      });
    }
  }

  console.log("Created team members");

  // Step 5: Create properties
  console.log("Step 5: Creating properties...");

  const propertyIds = [];
  const propertyNames = [
    "Sunshine Apartments",
    "Green Meadows Estate",
    "Riverside Villas",
    "Mountain View Towers",
    "Lakeside Heights",
    "Urban Oasis",
    "Harmony Gardens",
    "City Center Plaza",
    "Parkview Residences",
    "Blue Ocean Towers",
    "Horizon Point",
    "Meadowlark Homes",
    "Evergreen Terrace",
    "Willow Creek Apartments",
    "Pinecrest Residences",
    "Maple Court",
    "Cedar Grove",
    "Oakwood Terrace",
    "Royal Palm Apartments",
    "Serene Valley Homes",
    "Golden Sands Villas",
    "Silver Lake Residences",
    "Diamond Heights",
    "Emerald Gardens",
    "Ruby Towers",
  ];

  for (let i = 0; i < 25; i++) {
    const propertyId = createId();
    propertyIds.push(propertyId);
    const orgId = orgIds[i % orgIds.length];
    const owner = propertyOwnerUsers[i % propertyOwnerUsers.length] || {
      id: adminUserId,
    };
    const caretaker = caretakerUsers[i % caretakerUsers.length] || {
      id: adminUserId,
    };

    await db.insert(propertyEntity).values({
      id: propertyId,
      name: propertyNames[i % propertyNames.length],
      organizationId: orgId,
      ownerId: owner.id,
      caretakerId: caretaker.id,
      addressLine1: `${i + 1} ${await generateStreetAddress()}`,
      city: await generateCity(),
      state: await generateState(),
      postalCode: await generatePostcode(),
      country: await generateCountry(),
      type: ["residential", "commercial", "mixed_use"][
        Math.floor(Math.random() * 3)
      ],
      status: ["active", "inactive", "under_construction"][
        Math.floor(Math.random() * 3)
      ],
      description:
        "Property description here. This is a nice property in a good location.",
      yearBuilt: 1990 + Math.floor(Math.random() * 33),
      numberOfUnits: 4 + Math.floor(Math.random() * 46),
      images: JSON.stringify([
        "property1.jpg",
        "property2.jpg",
        "property3.jpg",
      ]),
      amenities: JSON.stringify([
        "Swimming Pool",
        "Gym",
        "Security",
        "Parking",
        "Garden",
      ]),
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });

    // Assign some properties to teams
    if (i % 3 === 0 && teamIds.length > 0) {
      const teamId = teamIds[i % teamIds.length];
      await db.insert(teamPropertyEntity).values({
        id: createId(),
        teamId: teamId,
        propertyId: propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`Created ${propertyIds.length} properties`);

  // Step 6: Create units
  console.log("Step 6: Creating units...");

  const unitIds = [];
  const unitTypes = [
    "studio",
    "one_br",
    "two_br",
    "three_br",
    "four_br_plus",
    "penthouse",
    "commercial_office",
  ];
  const unitStatuses = [
    "vacant",
    "occupied",
    "notice_given",
    "under_maintenance",
  ];

  for (let i = 0; i < 100; i++) {
    const unitId = createId();
    unitIds.push(unitId);
    const propertyId = propertyIds[i % propertyIds.length];

    // Get property to reference its organization
    const property = await db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, propertyId),
    });

    if (!property) continue;

    await db.insert(unitEntity).values({
      id: unitId,
      propertyId: propertyId,
      organizationId: property.organizationId,
      name: `Unit ${101 + i}`,
      type: unitTypes[Math.floor(Math.random() * unitTypes.length)],
      status: unitStatuses[Math.floor(Math.random() * unitStatuses.length)],
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      sizeSqFt: 500 + Math.floor(Math.random() * 2500),
      floor: Math.floor(Math.random() * 20) + 1,
      marketRent: 30000 + Math.floor(Math.random() * 170000),
      currentRent: 30000 + Math.floor(Math.random() * 170000),
      depositAmount: 30000 + Math.floor(Math.random() * 170000),
      features: JSON.stringify([
        "Balcony",
        "Air Conditioning",
        "Hardwood Floors",
        "Washer/Dryer",
      ]),
      images: JSON.stringify(["unit1.jpg", "unit2.jpg", "unit3.jpg"]),
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${unitIds.length} units`);

  // Step 7: Create tenants
  console.log("Step 7: Creating tenants...");

  const tenantIds = [];

  for (let i = 0; i < 70; i++) {
    const tenantId = createId();
    tenantIds.push(tenantId);
    const orgId = orgIds[i % orgIds.length];
    // Assign tenant_user if available, otherwise leave null
    const tenantUser = i < tenantUsers.length ? tenantUsers[i] : null;

    await db.insert(tenantEntity).values({
      id: tenantId,
      organizationId: orgId,
      userId: tenantUser?.id || null,
      firstName: await generateFirstName(),
      lastName: await generateLastName(),
      email: `tenant${i}@example.com`,
      phone: await generatePhoneNumber(),
      status: ["active", "prospect", "past"][Math.floor(Math.random() * 3)],
      dateOfBirth: new Date(
        1970 + Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
      occupation: await generateJobTitle(),
      income: 30000 + Math.floor(Math.random() * 470000),
      emergencyContactName: await generateFullName(),
      emergencyContactRelation: [
        "Spouse",
        "Parent",
        "Sibling",
        "Friend",
        "Child",
      ][Math.floor(Math.random() * 5)],
      emergencyContactPhone: await generatePhoneNumber(),
      emergencyContactEmail: `emergency${i}@example.com`,
      notes: "Tenant notes go here.",
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${tenantIds.length} tenants`);

  // Step 8: Create leases
  console.log("Step 8: Creating leases...");

  const leaseIds = [];

  for (let i = 0; i < 50; i++) {
    const leaseId = createId();
    leaseIds.push(leaseId);
    const unitId = unitIds[i % unitIds.length];

    // Get unit to reference its organization and property
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, unitId),
      with: {
        property: true,
      },
    });

    if (!unit) continue;

    const staffUser = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };

    const startDate = new Date(
      Date.now() - Math.floor(Math.random() * 365) * 86400000
    );
    const endDate = new Date(startDate.getTime() + 365 * 86400000); // 1 year lease

    await db.insert(leaseEntity).values({
      id: leaseId,
      organizationId: unit.organizationId,
      unitId: unitId,
      propertyId: unit.propertyId,
      status: ["active", "draft", "expired", "terminated"][
        Math.floor(Math.random() * 4)
      ],
      startDate,
      endDate,
      rentAmount: 30000 + Math.floor(Math.random() * 170000),
      depositAmount: 30000 + Math.floor(Math.random() * 170000),
      paymentDay: Math.floor(Math.random() * 10) + 1,
      paymentFrequency: "monthly",
      gracePeriodDays: Math.floor(Math.random() * 10),
      lateFeeType: ["fixed", "percentage", "no_fee"][
        Math.floor(Math.random() * 3)
      ],
      lateFeeAmount: 1000 + Math.floor(Math.random() * 4000),
      petsAllowed: Math.random() > 0.5,
      smokingAllowed: Math.random() > 0.7,
      createdBy: staffUser.id,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${leaseIds.length} leases`);

  // Step 9: Create lease-tenant assignments
  console.log("Step 9: Creating lease-tenant assignments...");

  const leaseTenantsCreated = [];

  for (let i = 0; i < Math.min(60, leaseIds.length * 2); i++) {
    const leaseId = leaseIds[i % leaseIds.length];
    const tenantId = tenantIds[i % tenantIds.length];

    // Check if assignment already exists
    const existingAssignment = await db.query.leaseTenantsEntity.findFirst({
      where: and(
        eq(leaseTenantsEntity.leaseId, leaseId),
        eq(leaseTenantsEntity.tenantId, tenantId)
      ),
    });

    if (!existingAssignment) {
      const leaseTenantId = createId();
      leaseTenantsCreated.push(leaseTenantId);

      await db.insert(leaseTenantsEntity).values({
        id: leaseTenantId,
        leaseId: leaseId,
        tenantId: tenantId,
        isPrimary: Math.random() > 0.3, // 70% chance of being primary
        createdAt: new Date(Date.now() - i * 86400000),
      });
    }
  }

  console.log(`Created ${leaseTenantsCreated.length} lease-tenant assignments`);

  // Step 10: Create maintenance requests
  console.log("Step 10: Creating maintenance requests...");

  const maintenanceIds = [];
  const maintenanceCategories = [
    "plumbing",
    "electrical",
    "hvac",
    "appliances",
    "structural",
    "pest_control",
    "other",
  ];
  const maintenancePriorities = ["low", "medium", "high", "urgent"];
  const maintenanceStatuses = [
    "reported",
    "scheduled",
    "in_progress",
    "completed",
  ];
  const maintenanceTitles = [
    "Leaking Faucet",
    "Broken AC",
    "Electrical Outlet Not Working",
    "Clogged Drain",
    "Broken Window",
    "Door Lock Issue",
    "Pest Infestation",
    "Water Heater Problem",
    "Toilet Not Flushing",
    "Refrigerator Not Cooling",
    "Oven Not Working",
    "Stove Burner Issue",
  ];

  for (let i = 0; i < 40; i++) {
    const maintenanceId = createId();
    maintenanceIds.push(maintenanceId);

    const propertyId = propertyIds[i % propertyIds.length];

    // Get property to reference its organization
    const property = await db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, propertyId),
    });

    if (!property) continue;

    // Get a unit from this property if possible
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.propertyId, propertyId),
    });

    const reporter = tenantUsers[i % tenantUsers.length] ||
      agentStaffUsers[i % agentStaffUsers.length] || { id: adminUserId };
    const assignee = caretakerUsers[i % caretakerUsers.length] ||
      agentStaffUsers[i % agentStaffUsers.length] || { id: adminUserId };

    await db.insert(maintenanceRequestsEntity).values({
      id: maintenanceId,
      organizationId: property.organizationId,
      propertyId: propertyId,
      unitId: unit?.id || null,
      status:
        maintenanceStatuses[
          Math.floor(Math.random() * maintenanceStatuses.length)
        ],
      priority:
        maintenancePriorities[
          Math.floor(Math.random() * maintenancePriorities.length)
        ],
      category:
        maintenanceCategories[
          Math.floor(Math.random() * maintenanceCategories.length)
        ],
      title:
        maintenanceTitles[Math.floor(Math.random() * maintenanceTitles.length)],
      description: "Detailed description of the maintenance issue goes here.",
      permissionToEnter: Math.random() > 0.3,
      preferredAvailability: [
        "Mornings Only",
        "Afternoons Only",
        "Evenings Only",
        "Weekdays Only",
        "Weekends Only",
        "Anytime",
      ][Math.floor(Math.random() * 6)],
      reportedBy: reporter.id,
      assignedTo: assignee.id,
      scheduledDate: new Date(
        Date.now() + Math.floor(Math.random() * 30 - 15) * 86400000
      ),
      completedDate:
        Math.random() > 0.6
          ? new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000)
          : null,
      estimatedCost: 1000 + Math.floor(Math.random() * 49000),
      actualCost: 1000 + Math.floor(Math.random() * 49000),
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${maintenanceIds.length} maintenance requests`);

  // Step 11: Create payments
  console.log("Step 11: Creating payments...");

  const paymentIds = [];
  const paymentTypes = [
    "rent",
    "deposit",
    "utility",
    "late_fee",
    "other_income",
  ];
  const paymentMethods = [
    "mpesa",
    "bank_transfer",
    "cash",
    "credit_card",
    "online_portal",
  ];

  for (let i = 0; i < 100; i++) {
    const paymentId = createId();
    paymentIds.push(paymentId);

    // Get a lease
    const leaseId = leaseIds[i % leaseIds.length];
    const lease = await db.query.leaseEntity.findFirst({
      where: eq(leaseEntity.id, leaseId),
      with: {
        unit: true,
      },
    });

    if (!lease) continue;

    // Get the property
    const property = await db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, lease.propertyId),
    });

    if (!property) continue;

    // Get a tenant for this lease
    const leaseTenant = await db.query.leaseTenantsEntity.findFirst({
      where: eq(leaseTenantsEntity.leaseId, leaseId),
    });

    const staffUser = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };

    await db.insert(paymentEntity).values({
      id: paymentId,
      organizationId: lease.organizationId,
      propertyId: property.id,
      unitId: lease.unitId,
      leaseId: leaseId,
      tenantId: leaseTenant?.tenantId || null,
      type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
      status: Math.random() > 0.1 ? "successful" : "pending", // 90% success rate
      method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      amount: 5000 + Math.floor(Math.random() * 195000),
      currency: "KES",
      transactionDate: new Date(
        Date.now() - Math.floor(Math.random() * 365) * 86400000
      ),
      dueDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000),
      description: "Payment description goes here",
      referenceId: `REF${Date.now()}-${i}`,
      recordedBy: staffUser.id,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${paymentIds.length} payments`);

  // Step 12: Create expenses
  console.log("Step 12: Creating expenses...");

  const expenseIds = [];
  const expenseCategories = [
    "maintenance_repair",
    "utilities",
    "property_tax",
    "insurance",
    "management_fee",
    "advertising",
    "supplies",
    "capital_improvement",
    "other",
  ];

  for (let i = 0; i < 50; i++) {
    const expenseId = createId();
    expenseIds.push(expenseId);

    const orgId = orgIds[i % orgIds.length];

    // Get property and unit for some expenses
    const propertyId = i % 3 === 0 ? propertyIds[i % propertyIds.length] : null;
    let unitId = null;

    if (propertyId) {
      // Get a unit for this property if available
      const unit = await db.query.unitEntity.findFirst({
        where: eq(unitEntity.propertyId, propertyId),
      });

      if (unit) {
        unitId = unit.id;
      }
    }

    const staffUser = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };

    // Sometimes link to a payment
    let paymentId = null;
    if (i % 4 === 0 && paymentIds.length > 0) {
      paymentId = paymentIds[i % paymentIds.length];
    }

    await db.insert(expenseEntity).values({
      id: expenseId,
      organizationId: orgId,
      propertyId: propertyId,
      unitId: unitId,
      category:
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
      amount: 1000 + Math.floor(Math.random() * 99000),
      expenseDate: new Date(
        Date.now() - Math.floor(Math.random() * 365) * 86400000
      ),
      description: "Expense description goes here",
      vendor: [
        "ABC Repairs",
        "XYZ Maintenance",
        "City Utilities",
        "Tax Office",
        "Insurance Co.",
      ][Math.floor(Math.random() * 5)],
      paymentId: paymentId,
      recordedBy: staffUser.id,
      notes: "Expense notes go here",
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${expenseIds.length} expenses`);

  // Step 13: Create utility bills
  console.log("Step 13: Creating utility bills...");

  const utilityBillIds = [];
  const utilityTypes = [
    "water",
    "electricity",
    "gas",
    "internet",
    "trash",
    "sewer",
    "other",
  ];

  for (let i = 0; i < 60; i++) {
    const utilityBillId = createId();
    utilityBillIds.push(utilityBillId);

    // Get a unit with its property
    const unitId = unitIds[i % unitIds.length];
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, unitId),
      with: {
        property: true,
      },
    });

    if (!unit) continue;

    // Get a lease for this unit if available
    const lease = await db.query.leaseEntity.findFirst({
      where: eq(leaseEntity.unitId, unitId),
    });

    // Get a tenant for this lease if available
    let tenantId = null;
    if (lease) {
      const leaseTenant = await db.query.leaseTenantsEntity.findFirst({
        where: eq(leaseTenantsEntity.leaseId, lease.id),
      });

      if (leaseTenant) {
        tenantId = leaseTenant.tenantId;
      }
    }

    // Sometimes link to a payment
    let paymentId = null;
    if (i % 3 === 0 && paymentIds.length > 0) {
      paymentId = paymentIds[i % paymentIds.length];
    }

    const billingPeriodStart = new Date(
      Date.now() - Math.floor(Math.random() * 180) * 86400000
    );
    const billingPeriodEnd = new Date(
      billingPeriodStart.getTime() + 30 * 86400000
    ); // 30 days
    const dueDate = new Date(billingPeriodEnd.getTime() + 15 * 86400000); // 15 days after period end

    await db.insert(utilityBillEntity).values({
      id: utilityBillId,
      organizationId: unit.organizationId,
      propertyId: unit.propertyId,
      unitId: unitId,
      leaseId: lease?.id || null,
      tenantId: tenantId,
      utilityType:
        utilityTypes[Math.floor(Math.random() * utilityTypes.length)],
      billingPeriodStart: billingPeriodStart,
      billingPeriodEnd: billingPeriodEnd,
      dueDate: dueDate,
      amount: 500 + Math.floor(Math.random() * 9500),
      status: ["due", "paid", "overdue", "canceled"][
        Math.floor(Math.random() * 4)
      ],
      meterReadingStart: Math.floor(Math.random() * 10000),
      meterReadingEnd: Math.floor(Math.random() * 10000) + 100,
      consumption: Math.floor(Math.random() * 100) + 10,
      rate: Math.floor(Math.random() * 50) + 10,
      paymentId: paymentId,
      notes: "Utility bill notes go here",
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${utilityBillIds.length} utility bills`);

  // Step 14: Create communications
  console.log("Step 14: Creating communications...");

  const communicationIds = [];
  const communicationTypes = ["email", "notification", "sms", "in_app_message"];
  const communicationChannels = [
    "system_generated",
    "user_sent",
    "tenant_portal",
  ];
  const communicationSubjects = [
    "Rent Payment Confirmation",
    "Maintenance Request Update",
    "Lease Renewal Notice",
    "Important Property Announcement",
    "Welcome to Your New Home",
    "Utility Bill Available",
    "Upcoming Maintenance Visit",
    "Late Payment Reminder",
  ];

  for (let i = 0; i < 70; i++) {
    const communicationId = createId();
    communicationIds.push(communicationId);

    const orgId = orgIds[i % orgIds.length];
    const sender = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };

    // For recipient, alternate between tenant and user
    let recipientUserId = null;
    let recipientTenantId = null;
    if (i % 2 === 0 && tenantUsers.length > 0) {
      recipientUserId = tenantUsers[i % tenantUsers.length].id;
    } else if (tenantIds.length > 0) {
      recipientTenantId = tenantIds[i % tenantIds.length];
    }

    // Only set related entities on some communications
    let relatedPropertyId =
      i % 3 === 0 ? propertyIds[i % propertyIds.length] : null;
    let relatedLeaseId = i % 4 === 0 ? leaseIds[i % leaseIds.length] : null;
    let relatedMaintenanceId =
      i % 5 === 0 ? maintenanceIds[i % maintenanceIds.length] : null;

    await db.insert(communicationEntity).values({
      id: communicationId,
      organizationId: orgId,
      type: communicationTypes[
        Math.floor(Math.random() * communicationTypes.length)
      ],
      channel:
        communicationChannels[
          Math.floor(Math.random() * communicationChannels.length)
        ],
      status: ["sent", "delivered", "read", "failed"][
        Math.floor(Math.random() * 4)
      ],
      senderUserId: sender.id,
      recipientUserId: recipientUserId,
      recipientTenantId: recipientTenantId,
      subject:
        communicationSubjects[
          Math.floor(Math.random() * communicationSubjects.length)
        ],
      body: "Communication body text goes here. This would contain the main message content.",
      relatedPropertyId: relatedPropertyId,
      relatedLeaseId: relatedLeaseId,
      relatedMaintenanceId: relatedMaintenanceId,
      isRead: Math.random() > 0.5,
      sentAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000),
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${communicationIds.length} communications`);

  // Step 15: Create documents
  console.log("Step 15: Creating documents...");

  const documentIds = [];
  const documentTypes = [
    "lease_agreement",
    "tenant_id",
    "property_photo",
    "unit_photo",
    "inspection_report",
    "maintenance_invoice",
    "other",
  ];
  const fileNames = [
    "lease_agreement.pdf",
    "tenant_id_card.jpg",
    "property_photo.jpg",
    "inspection_report.pdf",
    "payment_receipt.pdf",
    "maintenance_invoice.pdf",
    "utility_bill.pdf",
    "eviction_notice.pdf",
    "property_deed.pdf",
  ];
  const mimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  for (let i = 0; i < 40; i++) {
    const documentId = createId();
    documentIds.push(documentId);

    const orgId = orgIds[i % orgIds.length];
    const uploader = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };
    const docType =
      documentTypes[Math.floor(Math.random() * documentTypes.length)];

    // Only set some related entities, based on document type
    let relatedPropertyId = null;
    let relatedUnitId = null;
    let relatedLeaseId = null;
    let relatedTenantId = null;
    let relatedInspectionId = null;

    // Determine related entities based on document type
    if (docType === "property_photo" && propertyIds.length > 0) {
      relatedPropertyId = propertyIds[i % propertyIds.length];
    } else if (docType === "unit_photo" && unitIds.length > 0) {
      relatedUnitId = unitIds[i % unitIds.length];

      // Get the property for this unit
      if (relatedUnitId) {
        const unit = await db.query.unitEntity.findFirst({
          where: eq(unitEntity.id, relatedUnitId),
        });
        if (unit) {
          relatedPropertyId = unit.propertyId;
        }
      }
    } else if (docType === "lease_agreement" && leaseIds.length > 0) {
      relatedLeaseId = leaseIds[i % leaseIds.length];

      // Get the unit and property for this lease
      if (relatedLeaseId) {
        const lease = await db.query.leaseEntity.findFirst({
          where: eq(leaseEntity.id, relatedLeaseId),
        });
        if (lease) {
          relatedUnitId = lease.unitId;
          relatedPropertyId = lease.propertyId;
        }
      }
    } else if (docType === "tenant_id" && tenantIds.length > 0) {
      relatedTenantId = tenantIds[i % tenantIds.length];
    }

    const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const uniqueId = createId();

    await db.insert(documentEntity).values({
      id: documentId,
      organizationId: orgId,
      fileName: fileName,
      fileType: docType,
      mimeType: mimeTypes[Math.floor(Math.random() * mimeTypes.length)],
      fileSize: 10000 + Math.floor(Math.random() * 4990000),
      storageProvider: "local",
      storagePath: `documents/${uniqueId}/${fileName}`,
      url: `/uploads/documents/${uniqueId}/${fileName}`,
      description: "Document description goes here",
      uploadedBy: uploader.id,
      relatedPropertyId: relatedPropertyId,
      relatedUnitId: relatedUnitId,
      relatedLeaseId: relatedLeaseId,
      relatedTenantId: relatedTenantId,
      relatedInspectionId: relatedInspectionId,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${documentIds.length} documents`);

  // Step 16: Create inspections
  console.log("Step 16: Creating inspections...");

  const inspectionIds = [];
  const inspectionTypes = [
    "move_in",
    "move_out",
    "periodic",
    "drive_by",
    "safety",
    "other",
  ];
  const inspectionStatuses = [
    "scheduled",
    "completed",
    "canceled",
    "pending_report",
  ];

  for (let i = 0; i < 30; i++) {
    const inspectionId = createId();
    inspectionIds.push(inspectionId);

    // Get a property
    const propertyId = propertyIds[i % propertyIds.length];
    const property = await db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, propertyId),
    });

    if (!property) continue;

    // Get a unit for this property if available
    let unitId = null;
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.propertyId, propertyId),
    });

    if (unit) {
      unitId = unit.id;
    }

    // Get a lease for this unit if available
    let leaseId = null;
    if (unitId) {
      const lease = await db.query.leaseEntity.findFirst({
        where: eq(leaseEntity.unitId, unitId),
      });

      if (lease) {
        leaseId = lease.id;
      }
    }

    const inspector = agentStaffUsers[i % agentStaffUsers.length] || {
      id: adminUserId,
    };
    const scheduledDate = new Date(
      Date.now() + Math.floor(Math.random() * 30 - 15) * 86400000
    );
    const status =
      inspectionStatuses[Math.floor(Math.random() * inspectionStatuses.length)];
    const completedDate =
      status === "completed"
        ? new Date(scheduledDate.getTime() + 1 * 86400000)
        : null;

    await db.insert(inspectionEntity).values({
      id: inspectionId,
      organizationId: property.organizationId,
      propertyId: propertyId,
      unitId: unitId,
      leaseId: leaseId,
      type: inspectionTypes[Math.floor(Math.random() * inspectionTypes.length)],
      status: status,
      scheduledDate: scheduledDate,
      completedDate: completedDate,
      inspectorId: inspector.id,
      summary: "Inspection summary goes here",
      conditionRating: Math.floor(Math.random() * 5) + 1,
      notes: "Detailed inspection notes go here",
      findings: JSON.stringify([
        {
          area: "Kitchen",
          item: "Sink",
          condition: "Good",
          notes: "Working properly",
        },
        {
          area: "Bathroom",
          item: "Shower",
          condition: "Fair",
          notes: "Some lime scale",
        },
        {
          area: "Living Room",
          item: "Carpet",
          condition: "Good",
          notes: "Clean",
        },
      ]),
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${inspectionIds.length} inspections`);

  // Step 17: Create invitations
  console.log("Step 17: Creating invitations...");

  const invitationIds = [];

  for (let i = 0; i < 15; i++) {
    const invitationId = createId();
    invitationIds.push(invitationId);

    const orgId = orgIds[i % orgIds.length];
    const inviterUser = agentOwnerUsers[i % agentOwnerUsers.length] || {
      id: adminUserId,
    };

    await db.insert(invitationEntity).values({
      id: invitationId,
      organizationId: orgId,
      email: `invite${i}@example.com`,
      role: ["agent_staff", "property_owner", "caretaker"][
        Math.floor(Math.random() * 3)
      ],
      status: ["pending", "accepted", "expired", "revoked"][
        Math.floor(Math.random() * 4)
      ],
      token: createId(),
      expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
      inviterId: inviterUser.id,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    });
  }

  console.log(`Created ${invitationIds.length} invitations`);

  // Step 18: Create sessions and accounts (for completeness)
  console.log("Step 18: Creating sessions and accounts...");

  // Create a few sessions
  for (let i = 0; i < 10; i++) {
    const userId = userIds[i % userIds.length].id;

    await db.insert(sessionEntity).values({
      id: createId(),
      userId: userId,
      expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
      token: createId(),
      ipAddress: "127.0.0.1",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      createdAt: new Date(),
      updatedAt: new Date(),
      data: JSON.stringify({ lastActivity: new Date().toISOString() }),
    });
  }

  // Create a few accounts (auth providers)
  for (let i = 0; i < 5; i++) {
    const userId = userIds[i % userIds.length].id;

    await db.insert(accountEntity).values({
      id: createId(),
      userId: userId,
      providerId: ["google", "github", "password"][
        Math.floor(Math.random() * 3)
      ],
      accountId: `account_${Date.now()}_${i}`,
      accessToken: createId(),
      refreshToken: createId(),
      accessTokenExpiresAt: new Date(Date.now() + 7 * 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Create a few verification tokens
  for (let i = 0; i < 5; i++) {
    await db.insert(verificationEntity).values({
      id: createId(),
      identifier: ["email", "password-reset"][Math.floor(Math.random() * 2)],
      value: createId(),
      expiresAt: new Date(Date.now() + 24 * 3600000), // 24 hours
      userId: userIds[i % userIds.length].id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log("Created sessions, accounts, and verification tokens");

  console.log("Database seeding completed successfully!");
}

// Helper functions for data generation
async function generateCompanyName() {
  const prefixes = [
    "Skyline",
    "Metro",
    "Urban",
    "City",
    "Royal",
    "Golden",
    "Premier",
    "Elite",
    "Sunrise",
    "Capital",
  ];
  const suffixes = [
    "Properties",
    "Estates",
    "Realty",
    "Homes",
    "Housing",
    "Management",
    "Living",
    "Residences",
    "Dwellings",
  ];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

async function generateStreetAddress() {
  const streets = [
    "Main Street",
    "Park Avenue",
    "Oak Road",
    "Maple Lane",
    "Broadway",
    "Sunset Boulevard",
    "River Road",
    "Mountain View",
    "Lake Drive",
    "Forest Lane",
  ];
  return `${streets[Math.floor(Math.random() * streets.length)]}`;
}

async function generateCity() {
  const cities = [
    "Nairobi",
    "Mombasa",
    "Nakuru",
    "Kisumu",
    "Eldoret",
    "Thika",
    "Kitale",
    "Malindi",
    "Machakos",
    "Nyeri",
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

async function generateState() {
  const states = [
    "Nairobi",
    "Coast",
    "Rift Valley",
    "Western",
    "Eastern",
    "Central",
    "Nyanza",
    "North Eastern",
  ];
  return states[Math.floor(Math.random() * states.length)];
}

async function generatePostcode() {
  return `${Math.floor(Math.random() * 90000) + 10000}`;
}

async function generateCountry() {
  return "Kenya";
}

async function generateFirstName() {
  const firstNames = [
    "James",
    "John",
    "Mary",
    "Patricia",
    "Robert",
    "Michael",
    "Linda",
    "Elizabeth",
    "William",
    "David",
    "Sarah",
    "Karen",
    "Nancy",
    "Susan",
    "Joseph",
    "Charles",
    "Thomas",
    "Daniel",
    "Matthew",
    "Anthony",
    "Faith",
    "Hope",
    "Grace",
    "Joy",
  ];
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

async function generateLastName() {
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Wanjiku",
    "Kamau",
    "Ochieng",
    "Mutua",
    "Omondi",
    "Kimani",
  ];
  return lastNames[Math.floor(Math.random() * lastNames.length)];
}

async function generateFullName() {
  return `${await generateFirstName()} ${await generateLastName()}`;
}

async function generateEmail() {
  const domains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "example.com",
  ];
  const firstName = await generateFirstName();
  const lastName = await generateLastName();
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

async function generatePhoneNumber() {
  return `+254 ${Math.floor(Math.random() * 100) + 700} ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 1000)}`;
}

async function generateJobTitle() {
  const jobTitles = [
    "Teacher",
    "Engineer",
    "Doctor",
    "Lawyer",
    "Accountant",
    "Nurse",
    "Developer",
    "Manager",
    "Designer",
    "Consultant",
    "Analyst",
    "Technician",
    "Salesperson",
    "Executive",
    "Business Owner",
  ];
  return jobTitles[Math.floor(Math.random() * jobTitles.length)];
}

// Parse command line arguments
const resetFirst = process.argv.includes("--reset");

// Run the seed function if main
if (require.main === module) {
  seedDatabase(resetFirst)
    .then(() => {
      console.log("Database seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding database:", error);
      process.exit(1);
    });
}

export { seedDatabase };
