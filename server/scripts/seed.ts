import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
// Import all schema definitions to make sure we get all tables
import * as bcryptjs from "bcryptjs";
import * as schema from "../src/db/schema";
import { createId } from "../src/db/utils";

dotenv.config();

// Helper function for date manipulation
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const {
  users,
  accounts,
  leases,
  maintenanceRequests,
  maintenanceCategories,
  maintenanceComments,
  workOrders,
  properties,
  units,
  tenants,
  transactions,
  utilityBills,
  documents,
  userPermissions,
  activities,
  notifications,
  messages,
  messageRecipients,
  messageTemplates,
} = schema;

// Helper for creating users
async function createUserWithAccount(userData: {
  email: string;
  passwordPlainText: string;
  name: string;
  role: "LANDLORD" | "CARETAKER" | "AGENT" | "ADMIN";
  emailVerified?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}): Promise<any> {
  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, userData.email),
    });

    let user;

    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(schema.users)
        .set({
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          emailVerified: userData.emailVerified ?? false,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.email, userData.email))
        .returning();

      user = updatedUser;
      console.log(`Updated existing user: ${user.email}`);
    } else {
      // Create new user
      const [newUser] = await db
        .insert(schema.users)
        .values({
          id: createId(),
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: userData.emailVerified ?? false,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          isActive: true,
          updatedAt: new Date(),
        })
        .returning();

      user = newUser;
      console.log(`Created new user: ${user.email}`);
    }

    // Hash the password for the Account model
    const hashedPassword = await bcryptjs.hash(userData.passwordPlainText, 10);

    // Find existing account
    const existingAccount = await db.query.accounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(
          eq(accounts.providerId, "emailpassword"),
          eq(accounts.userId, user.id)
        ),
    });

    if (existingAccount) {
      // Update existing account
      await db
        .update(schema.accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, existingAccount.id));

      console.log(`Updated existing account for: ${user.email}`);
    } else {
      // Create new account
      await db.insert(accounts).values({
        id: createId(),
        userId: user.id,
        providerId: "emailpassword",
        accountId: user.id,
        password: hashedPassword,
        updatedAt: new Date(),
      });

      console.log(`Created new account for: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error(`Error creating/updating user ${userData.email}:`, error);
    throw error;
  }
}

// Function to create a property with units
async function createPropertyWithUnits(propertyData: {
  name: string;
  address: string;
  type: string;
  description: string;
  ownerId: string;
  caretakerId?: string;
  agentId?: string;
  units: {
    name: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    size: number;
    rent: number;
    depositAmount: number;
    status: string;
    features?: any;
  }[];
}): Promise<any> {
  try {
    // Check if property exists
    const existingProperty = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.name, propertyData.name),
    });

    let property;

    if (existingProperty) {
      // Update existing property
      const [updatedProperty] = await db
        .update(schema.properties)
        .set({
          address: propertyData.address,
          type: propertyData.type,
          description: propertyData.description,
          ownerId: propertyData.ownerId,
          caretakerId: propertyData.caretakerId || null,
          agentId: propertyData.agentId || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.properties.id, existingProperty.id))
        .returning();

      property = updatedProperty;
      console.log(`Updated property: ${property.name}`);
    } else {
      // Create new property
      const [newProperty] = await db
        .insert(schema.properties)
        .values({
          id: createId(),
          name: propertyData.name,
          address: propertyData.address,
          type: propertyData.type,
          description: propertyData.description,
          ownerId: propertyData.ownerId,
          caretakerId: propertyData.caretakerId || null,
          agentId: propertyData.agentId || null,
          updatedAt: new Date(),
        })
        .returning();

      property = newProperty;
      console.log(`Created property: ${property.name}`);
    }

    // Create units for this property
    for (const unitData of propertyData.units) {
      // Check if unit exists
      const existingUnit = await db.query.units.findFirst({
        where: (units, { and, eq }) =>
          and(eq(units.propertyId, property.id), eq(units.name, unitData.name)),
      });

      if (existingUnit) {
        // Update existing unit
        const [updatedUnit] = await db
          .update(schema.units)
          .set({
            type: unitData.type,
            bedrooms: unitData.bedrooms,
            bathrooms: unitData.bathrooms,
            size: unitData.size,
            rent: unitData.rent,
            depositAmount: unitData.depositAmount,
            status: unitData.status,
            features: unitData.features || null,
            updatedAt: new Date(),
          })
          .where(eq(schema.units.id, existingUnit.id))
          .returning();

        console.log(`Updated unit: ${updatedUnit.name}`);
      } else {
        // Create new unit
        const [newUnit] = await db
          .insert(schema.units)
          .values({
            id: createId(),
            propertyId: property.id,
            name: unitData.name,
            type: unitData.type,
            bedrooms: unitData.bedrooms,
            bathrooms: unitData.bathrooms,
            size: unitData.size,
            rent: unitData.rent,
            depositAmount: unitData.depositAmount,
            status: unitData.status,
            features: unitData.features || null,
            updatedAt: new Date(),
          })
          .returning();

        console.log(`Created unit: ${newUnit.name} in ${property.name}`);
      }
    }

    return property;
  } catch (error) {
    console.error(
      `Error creating/updating property ${propertyData.name}:`,
      error
    );
    throw error; // Re-throw as property creation is essential
  }
}

// Function to create a tenant
async function createTenant(tenantData: {
  name: string;
  email: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dateOfBirth?: Date;
  status?: string;
  documents?: any;
}): Promise<any> {
  try {
    // Check if tenant exists
    const existingTenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.email, tenantData.email),
    });

    let tenant;

    if (existingTenant) {
      // Update existing tenant
      const [updatedTenant] = await db
        .update(schema.tenants)
        .set({
          name: tenantData.name,
          phone: tenantData.phone || null,
          emergencyContactName: tenantData.emergencyContactName || null,
          emergencyContactPhone: tenantData.emergencyContactPhone || null,
          dateOfBirth: tenantData.dateOfBirth || null,
          status: tenantData.status || "active",
          documents: tenantData.documents || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.tenants.id, existingTenant.id))
        .returning();

      tenant = updatedTenant;
      console.log(`Updated tenant: ${tenant.name}`);
    } else {
      // Create new tenant
      const [newTenant] = await db
        .insert(schema.tenants)
        .values({
          id: createId(),
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone || null,
          emergencyContactName: tenantData.emergencyContactName || null,
          emergencyContactPhone: tenantData.emergencyContactPhone || null,
          dateOfBirth: tenantData.dateOfBirth || null,
          status: tenantData.status || "active",
          documents: tenantData.documents || null,
          updatedAt: new Date(),
        })
        .returning();

      tenant = newTenant;
      console.log(`Created tenant: ${tenant.name}`);
    }

    return tenant;
  } catch (error) {
    console.error(`Error creating/updating tenant ${tenantData.email}:`, error);
    throw error;
  }
}

// Function to create a lease
async function createLease(leaseData: {
  unitId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  depositAmount: number;
  status?: string;
  paymentDay?: number;
  paymentFrequency?: string;
  includesWater?: boolean;
  includesElectricity?: boolean;
  includesGas?: boolean;
  includesInternet?: boolean;
  createdBy?: string;
  notes?: string;
}): Promise<any> {
  try {
    // First check if unit is available
    const unit = await db.query.units.findFirst({
      where: (units, { eq }) => eq(units.id, leaseData.unitId),
    });

    if (!unit) {
      throw new Error(`Unit with ID ${leaseData.unitId} not found`);
    }

    // For active leases, make sure the unit is not already occupied
    if (leaseData.status === "active" && unit.status === "occupied") {
      // Check if there's an active lease for this unit
      const activeLeases = await db.query.leases.findMany({
        where: (leases, { and, eq }) =>
          and(eq(leases.unitId, leaseData.unitId), eq(leases.status, "active")),
      });

      if (activeLeases.length > 0) {
        console.log(
          `Unit ${unit.name} is already occupied with an active lease. Skipping new lease creation.`
        );
        return null;
      }
    }

    // Check if tenant exists
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, leaseData.tenantId),
    });

    if (!tenant) {
      throw new Error(`Tenant with ID ${leaseData.tenantId} not found`);
    }

    // Create the lease
    const [lease] = await db
      .insert(schema.leases)
      .values({
        id: createId(),
        unitId: leaseData.unitId,
        tenantId: leaseData.tenantId,
        startDate: leaseData.startDate,
        endDate: leaseData.endDate,
        rentAmount: leaseData.rentAmount,
        depositAmount: leaseData.depositAmount,
        status: leaseData.status || "active",
        paymentDay: leaseData.paymentDay || 1,
        paymentFrequency: leaseData.paymentFrequency || "monthly",
        includesWater: leaseData.includesWater || false,
        includesElectricity: leaseData.includesElectricity || false,
        includesGas: leaseData.includesGas || false,
        includesInternet: leaseData.includesInternet || false,
        createdBy: leaseData.createdBy || null,
        notes: leaseData.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created lease for ${tenant.name} in unit ${unit.name}`);

    // If lease is active, update unit status to occupied
    if (lease.status === "active") {
      await db
        .update(schema.units)
        .set({
          status: "occupied",
          updatedAt: new Date(),
        })
        .where(eq(schema.units.id, leaseData.unitId));

      console.log(`Updated unit ${unit.name} status to occupied`);
    }

    return lease;
  } catch (error) {
    console.error(
      `Error creating lease for tenant ${leaseData.tenantId} in unit ${leaseData.unitId}:`,
      error
    );
    throw error; // Re-throw as lease creation is important
  }
}

// Function to create a maintenance request
async function createMaintenanceRequest(requestData: {
  unitId: string;
  tenantId?: string;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  reportedAt?: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  cost?: number;
  images?: any;
  notes?: string;
}): Promise<any> {
  try {
    // Create the maintenance request
    const [request] = await db
      .insert(schema.maintenanceRequests)
      .values({
        id: createId(),
        unitId: requestData.unitId,
        tenantId: requestData.tenantId || null,
        title: requestData.title,
        description: requestData.description,
        priority: requestData.priority || "medium",
        status: requestData.status || "open",
        reportedAt: requestData.reportedAt || new Date(),
        assignedTo: requestData.assignedTo || null,
        resolvedAt: requestData.resolvedAt || null,
        cost: requestData.cost || null,
        images: requestData.images || null,
        notes: requestData.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created maintenance request: ${request.title}`);
    return request;
  } catch (error) {
    console.error(
      `Error creating maintenance request "${requestData.title}":`,
      error
    );
    return null;
  }
}

// Function to create maintenance comment
async function createMaintenanceComment(commentData: {
  requestId: string;
  userId: string;
  content: string;
  isPrivate?: boolean;
}): Promise<any> {
  try {
    const [comment] = await db
      .insert(schema.maintenanceComments)
      .values({
        id: createId(),
        requestId: commentData.requestId,
        userId: commentData.userId,
        content: commentData.content,
        isPrivate: commentData.isPrivate || false,
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `Created maintenance comment for request ${commentData.requestId}`
    );
    return comment;
  } catch (error) {
    console.error(
      `Error creating maintenance comment for request ${commentData.requestId}:`,
      error
    );
    return null;
  }
}

// Function to create an activity
async function createActivity(activityData: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  unitId?: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: any;
}): Promise<any> {
  try {
    const [activity] = await db
      .insert(schema.activities)
      .values({
        id: createId(),
        userId: activityData.userId,
        action: activityData.action,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        unitId: activityData.unitId || null,
        previousStatus: activityData.previousStatus || null,
        newStatus: activityData.newStatus || null,
        metadata: activityData.metadata || null,
        createdAt: new Date(),
      })
      .returning();

    console.log(
      `Created activity record for ${activityData.action} on ${activityData.entityType}`
    );
    return activity;
  } catch (error) {
    console.error("Error creating activity record:", error);
    return null;
  }
}

// Function to create a work order
async function createWorkOrder(workOrderData: {
  requestId?: string;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  unitId: string;
  tenantId?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedToPhone?: string;
  assignedToEmail?: string;
  reportedAt?: Date;
  resolvedAt?: Date;
  category?: string;
  cost?: number;
  images?: any;
  notes?: string;
}): Promise<any> {
  try {
    const [workOrder] = await db
      .insert(schema.workOrders)
      .values({
        id: createId(),
        requestId: workOrderData.requestId || null,
        title: workOrderData.title,
        description: workOrderData.description,
        priority: workOrderData.priority || "normal",
        status: workOrderData.status || "pending",
        unitId: workOrderData.unitId,
        tenantId: workOrderData.tenantId || null,
        assignedTo: workOrderData.assignedTo || null,
        assignedToName: workOrderData.assignedToName || null,
        assignedToPhone: workOrderData.assignedToPhone || null,
        assignedToEmail: workOrderData.assignedToEmail || null,
        reportedAt: workOrderData.reportedAt || new Date(),
        resolvedAt: workOrderData.resolvedAt || null,
        category: workOrderData.category || null,
        cost: workOrderData.cost || null,
        images: workOrderData.images || null,
        notes: workOrderData.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created work order: ${workOrder.title}`);

    // If this work order is linked to a maintenance request, update the request
    if (workOrderData.requestId) {
      await db
        .update(schema.maintenanceRequests)
        .set({
          workOrderId: workOrder.id,
          status: "processed", // Mark as processed since it's now a work order
          updatedAt: new Date(),
        })
        .where(eq(schema.maintenanceRequests.id, workOrderData.requestId));

      console.log(
        `Updated maintenance request ${workOrderData.requestId} with work order ID`
      );
    }

    return workOrder;
  } catch (error) {
    console.error(`Error creating work order "${workOrderData.title}":`, error);
    return null;
  }
}

// Function to create transaction
async function createTransaction(transactionData: {
  leaseId: string;
  utilityBillId?: string;
  amount: number;
  type: string;
  category?: string;
  status?: string;
  paymentMethod?: string;
  paymentDate: Date;
  dueDate?: Date;
  recordedBy?: string;
  notes?: string;
}): Promise<any> {
  try {
    // Let's be defensive and log what we're trying to insert
    console.log("Creating transaction with data:", {
      leaseId: transactionData.leaseId,
      amount: transactionData.amount,
      type: transactionData.type,
    });

    // Using schema.transactions to ensure we're using the correct reference
    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        id: createId(),
        leaseId: transactionData.leaseId,
        utilityBillId: transactionData.utilityBillId || null,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category || null,
        status: transactionData.status || "completed",
        paymentMethod: transactionData.paymentMethod || "bank_transfer",
        paymentDate: transactionData.paymentDate,
        dueDate: transactionData.dueDate || null,
        recordedBy: transactionData.recordedBy || null,
        notes: transactionData.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `Created ${transactionData.type} transaction of ${transactionData.amount}`
    );
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    console.log("Available schema tables:", Object.keys(schema));
    // Let's not fail the entire seeding process for one transaction
    return null;
  }
}

// Function to create utility bill
async function createUtilityBill(billData: {
  leaseId: string;
  utilityType: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  tenantResponsibilityPercent?: number;
  tenantAmount: number;
  landlordAmount?: number;
  isPaid?: boolean;
  paidDate?: Date;
  notes?: string;
}): Promise<any> {
  try {
    const [bill] = await db
      .insert(schema.utilityBills)
      .values({
        id: createId(),
        leaseId: billData.leaseId,
        utilityType: billData.utilityType,
        billDate: billData.billDate,
        dueDate: billData.dueDate,
        amount: billData.amount,
        tenantResponsibilityPercent:
          billData.tenantResponsibilityPercent || 100,
        tenantAmount: billData.tenantAmount,
        landlordAmount: billData.landlordAmount || 0,
        isPaid: billData.isPaid || false,
        paidDate: billData.paidDate || null,
        notes: billData.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created ${billData.utilityType} bill of ${billData.amount}`);
    return bill;
  } catch (error) {
    console.error(`Error creating ${billData.utilityType} bill:`, error);
    return null;
  }
}

// Function to create a document
async function createDocument(documentData: {
  name: string;
  type: string;
  url: string;
  relatedId?: string;
  relatedType?: string;
  uploadedBy?: string;
}): Promise<any> {
  try {
    const [document] = await db
      .insert(schema.documents)
      .values({
        id: createId(),
        name: documentData.name,
        type: documentData.type,
        url: documentData.url,
        relatedId: documentData.relatedId || null,
        relatedType: documentData.relatedType || null,
        uploadedBy: documentData.uploadedBy || null,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created document: ${document.name}`);
    return document;
  } catch (error) {
    console.error(`Error creating document "${documentData.name}":`, error);
    return null;
  }
}

// Function to create user permission
async function createUserPermission(permissionData: {
  userId: string;
  propertyId: string;
  role: string;
  canManageTenants?: boolean;
  canManageLeases?: boolean;
  canCollectPayments?: boolean;
  canViewFinancials?: boolean;
  canManageMaintenance?: boolean;
  canManageProperties?: boolean;
  grantedBy: string;
}): Promise<any> {
  try {
    // Check if permission already exists
    const existingPermission = await db.query.userPermissions.findFirst({
      where: (userPermissions, { and, eq }) =>
        and(
          eq(userPermissions.userId, permissionData.userId),
          eq(userPermissions.propertyId, permissionData.propertyId)
        ),
    });

    if (existingPermission) {
      // Update permission
      const [updatedPermission] = await db
        .update(schema.userPermissions)
        .set({
          role: permissionData.role,
          canManageTenants: permissionData.canManageTenants || false,
          canManageLeases: permissionData.canManageLeases || false,
          canCollectPayments: permissionData.canCollectPayments || false,
          canViewFinancials: permissionData.canViewFinancials || false,
          canManageMaintenance: permissionData.canManageMaintenance || false,
          canManageProperties: permissionData.canManageProperties || false,
          updatedAt: new Date(),
        })
        .where(eq(schema.userPermissions.id, existingPermission.id))
        .returning();

      console.log(
        `Updated permission for user on property ${permissionData.propertyId}`
      );
      return updatedPermission;
    } else {
      // Create new permission
      const [newPermission] = await db
        .insert(schema.userPermissions)
        .values({
          id: createId(),
          userId: permissionData.userId,
          propertyId: permissionData.propertyId,
          role: permissionData.role,
          canManageTenants: permissionData.canManageTenants || false,
          canManageLeases: permissionData.canManageLeases || false,
          canCollectPayments: permissionData.canCollectPayments || false,
          canViewFinancials: permissionData.canViewFinancials || false,
          canManageMaintenance: permissionData.canManageMaintenance || false,
          canManageProperties: permissionData.canManageProperties || false,
          grantedBy: permissionData.grantedBy,
          updatedAt: new Date(),
        })
        .returning();

      console.log(
        `Created permission for user on property ${permissionData.propertyId}`
      );
      return newPermission;
    }
  } catch (error) {
    console.error(
      `Error creating/updating permission for user ${permissionData.userId} on property ${permissionData.propertyId}:`,
      error
    );
    return null;
  }
}

// Function to create maintenance categories
async function createMaintenanceCategory(categoryData: {
  name: string;
  description?: string;
  isCommon?: boolean;
}): Promise<any> {
  try {
    // Check if category exists
    const existingCategory = await db.query.maintenanceCategories.findFirst({
      where: (categories, { eq }) => eq(categories.name, categoryData.name),
    });

    if (existingCategory) {
      // Update category
      const [updatedCategory] = await db
        .update(maintenanceCategories)
        .set({
          description: categoryData.description || null,
          isCommon:
            categoryData.isCommon !== undefined ? categoryData.isCommon : true,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceCategories.id, existingCategory.id))
        .returning();

      console.log(`Updated maintenance category: ${updatedCategory.name}`);
      return updatedCategory;
    } else {
      // Create new category
      const [newCategory] = await db
        .insert(maintenanceCategories)
        .values({
          id: createId(),
          name: categoryData.name,
          description: categoryData.description || null,
          isCommon:
            categoryData.isCommon !== undefined ? categoryData.isCommon : true,
          updatedAt: new Date(),
        })
        .returning();

      console.log(`Created maintenance category: ${newCategory.name}`);
      return newCategory;
    }
  } catch (error) {
    console.error(
      `Error creating/updating maintenance category ${categoryData.name}:`,
      error
    );
    return null;
  }
}

// Function to create a notification
async function createNotification(notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  relatedType?: string;
  isRead?: boolean;
}): Promise<any> {
  try {
    const [notification] = await db
      .insert(schema.notifications)
      .values({
        id: createId(),
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        relatedId: notificationData.relatedId || null,
        relatedType: notificationData.relatedType || null,
        isRead: notificationData.isRead || false,
        createdAt: new Date(),
      })
      .returning();

    console.log(
      `Created notification: ${notification.title} for user ${notificationData.userId}`
    );
    return notification;
  } catch (error) {
    console.error(
      `Error creating notification "${notificationData.title}":`,
      error
    );
    return null;
  }
}

// Function to create a message
async function createMessage(messageData: {
  propertyId?: string;
  senderId: string;
  type: "sms" | "email";
  subject?: string;
  content: string;
  status: "sent" | "failed" | "pending";
  recipientIds: string[];
}): Promise<any> {
  try {
    // Create the message record
    const [message] = await db
      .insert(schema.messages)
      .values({
        id: createId(),
        propertyId: messageData.propertyId || null,
        senderId: messageData.senderId,
        type: messageData.type,
        subject: messageData.subject || null,
        content: messageData.content,
        status: messageData.status,
        recipientCount: messageData.recipientIds.length.toString(),
        metadata: null, // Optional metadata
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create message recipients
    if (messageData.recipientIds.length > 0) {
      for (const tenantId of messageData.recipientIds) {
        await db.insert(schema.messageRecipients).values({
          id: createId(),
          messageId: message.id,
          tenantId: tenantId,
          deliveryStatus:
            messageData.status === "sent" ? "delivered" : messageData.status,
          errorMessage:
            messageData.status === "failed"
              ? "Simulated failure for testing"
              : null,
          deliveredAt: messageData.status === "sent" ? new Date() : null,
          createdAt: new Date(),
        });
      }
    }

    console.log(
      `Created ${messageData.type} message with ${messageData.recipientIds.length} recipients`
    );
    return message;
  } catch (error) {
    console.error(`Error creating message:`, error);
    return null;
  }
}

// Function to create a message template
async function createMessageTemplate(templateData: {
  name: string;
  type: "sms" | "email";
  subject?: string;
  content: string;
  createdBy: string;
  isGlobal?: boolean;
  propertyId?: string;
}): Promise<any> {
  try {
    const [template] = await db
      .insert(schema.messageTemplates)
      .values({
        id: createId(),
        name: templateData.name,
        type: templateData.type,
        subject: templateData.subject || null,
        content: templateData.content,
        createdBy: templateData.createdBy,
        isGlobal: templateData.isGlobal ? "true" : "false",
        propertyId: templateData.propertyId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created message template: ${template.name}`);
    return template;
  } catch (error) {
    console.error(
      `Error creating message template "${templateData.name}":`,
      error
    );
    return null;
  }
}

// Main seeding function
async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Create users of different roles
    console.log("Creating users...");

    // Admin users
    const admin1 = await createUserWithAccount({
      email: "admin@property.com",
      passwordPlainText: "admin123",
      name: "Admin User",
      role: "ADMIN",
      emailVerified: true,
    });

    const admin2 = await createUserWithAccount({
      email: "sarah.admin@property.com",
      passwordPlainText: "admin456",
      name: "Sarah Johnson",
      role: "ADMIN",
      emailVerified: true,
      phone: "+1987654321",
    });

    // Landlords
    const landlord1 = await createUserWithAccount({
      email: "landlord@property.com",
      passwordPlainText: "landlord123",
      name: "John Smith",
      role: "LANDLORD",
      phone: "+1234567890",
      address: "123 Owner St",
      city: "New York",
      country: "USA",
      emailVerified: true,
    });

    const landlord2 = await createUserWithAccount({
      email: "michael.landlord@property.com",
      passwordPlainText: "landlord456",
      name: "Michael Chen",
      role: "LANDLORD",
      phone: "+1345678901",
      address: "456 Property Ave",
      city: "San Francisco",
      country: "USA",
      emailVerified: true,
    });

    const landlord3 = await createUserWithAccount({
      email: "olivia.landlord@property.com",
      passwordPlainText: "landlord789",
      name: "Olivia Martinez",
      role: "LANDLORD",
      phone: "+1456789012",
      address: "789 Rental Blvd",
      city: "Chicago",
      country: "USA",
      emailVerified: true,
    });

    // Caretakers
    const caretaker1 = await createUserWithAccount({
      email: "caretaker@property.com",
      passwordPlainText: "caretaker123",
      name: "Mary Johnson",
      role: "CARETAKER",
      phone: "+9876543210",
      address: "456 Manager Ave",
      city: "Chicago",
      country: "USA",
      emailVerified: true,
    });

    const caretaker2 = await createUserWithAccount({
      email: "david.caretaker@property.com",
      passwordPlainText: "caretaker456",
      name: "David Wilson",
      role: "CARETAKER",
      phone: "+8765432109",
      address: "567 Maintenance St",
      city: "Boston",
      country: "USA",
      emailVerified: true,
    });

    const caretaker3 = await createUserWithAccount({
      email: "jessica.caretaker@property.com",
      passwordPlainText: "caretaker789",
      name: "Jessica Brown",
      role: "CARETAKER",
      phone: "+7654321098",
      address: "678 Building Rd",
      city: "Miami",
      country: "USA",
      emailVerified: true,
    });

    // Agents
    const agent1 = await createUserWithAccount({
      email: "agent@property.com",
      passwordPlainText: "agent123",
      name: "Robert Davis",
      role: "AGENT",
      phone: "+1122334455",
      address: "789 Agent Blvd",
      city: "Los Angeles",
      country: "USA",
      emailVerified: true,
    });

    const agent2 = await createUserWithAccount({
      email: "amanda.agent@property.com",
      passwordPlainText: "agent456",
      name: "Amanda Lee",
      role: "AGENT",
      phone: "+2233445566",
      address: "890 Realtor Ave",
      city: "Dallas",
      country: "USA",
      emailVerified: true,
    });

    const agent3 = await createUserWithAccount({
      email: "jason.agent@property.com",
      passwordPlainText: "agent789",
      name: "Jason Taylor",
      role: "AGENT",
      phone: "+3344556677",
      address: "901 Broker St",
      city: "Seattle",
      country: "USA",
      emailVerified: true,
    });

    console.log("Users created successfully");

    // Create maintenance categories
    console.log("Creating maintenance categories...");

    await createMaintenanceCategory({
      name: "Plumbing",
      description:
        "Issues related to water systems, pipes, drains, and fixtures",
      isCommon: true,
    });

    await createMaintenanceCategory({
      name: "Electrical",
      description:
        "Issues with electrical systems, outlets, lighting, and wiring",
      isCommon: true,
    });

    await createMaintenanceCategory({
      name: "HVAC",
      description: "Heating, ventilation, and air conditioning problems",
      isCommon: true,
    });

    await createMaintenanceCategory({
      name: "Appliances",
      description: "Issues with refrigerators, stoves, dishwashers, etc.",
      isCommon: true,
    });

    await createMaintenanceCategory({
      name: "Structural",
      description: "Issues with building structure, walls, ceilings, floors",
      isCommon: true,
    });

    await createMaintenanceCategory({
      name: "Pest Control",
      description: "Issues with insects, rodents, and other pests",
      isCommon: true,
    });

    console.log("Maintenance categories created successfully");

    // Create properties with units
    console.log("Creating properties and units...");

    // Property 1: Luxury Apartment Complex
    const property1 = await createPropertyWithUnits({
      name: "Luxury Apartment Complex",
      address: "123 Main St, New York, NY",
      type: "Apartment",
      description: "A beautiful apartment complex with 20 units",
      ownerId: landlord1.id,
      caretakerId: caretaker1.id,
      agentId: agent1.id,
      units: [
        {
          name: "101",
          type: "one_br",
          bedrooms: 1,
          bathrooms: 1,
          size: 750,
          rent: 1500,
          depositAmount: 1500,
          status: "vacant",
          features: { parking: true, balcony: true, pets_allowed: false },
        },
        {
          name: "102",
          type: "studio",
          bedrooms: 0,
          bathrooms: 1,
          size: 500,
          rent: 1200,
          depositAmount: 1200,
          status: "vacant",
          features: { parking: false, balcony: false, pets_allowed: true },
        },
        {
          name: "103",
          type: "two_br",
          bedrooms: 2,
          bathrooms: 2,
          size: 1000,
          rent: 2000,
          depositAmount: 2000,
          status: "vacant",
          features: { parking: true, balcony: true, pets_allowed: true },
        },
        {
          name: "201",
          type: "one_br",
          bedrooms: 1,
          bathrooms: 1,
          size: 750,
          rent: 1600,
          depositAmount: 1600,
          status: "vacant",
          features: { parking: true, balcony: true, pets_allowed: false },
        },
        {
          name: "202",
          type: "two_br",
          bedrooms: 2,
          bathrooms: 2,
          size: 1100,
          rent: 2100,
          depositAmount: 2100,
          status: "maintenance",
          features: { parking: true, balcony: true, pets_allowed: true },
        },
      ],
    });

    // Property 2: Riverside Homes
    const property2 = await createPropertyWithUnits({
      name: "Riverside Homes",
      address: "456 River Rd, San Francisco, CA",
      type: "House",
      description: "Beautiful houses by the river",
      ownerId: landlord2.id,
      caretakerId: caretaker2.id,
      agentId: agent2.id,
      units: [
        {
          name: "House A",
          type: "3BR House",
          bedrooms: 3,
          bathrooms: 2.5,
          size: 1800,
          rent: 3500,
          depositAmount: 3500,
          status: "vacant",
          features: { garden: true, garage: true, pets_allowed: true },
        },
        {
          name: "House B",
          type: "4BR House",
          bedrooms: 4,
          bathrooms: 3,
          size: 2200,
          rent: 4000,
          depositAmount: 4000,
          status: "vacant",
          features: { garden: true, garage: true, pets_allowed: true },
        },
        {
          name: "House C",
          type: "2BR House",
          bedrooms: 2,
          bathrooms: 1,
          size: 1500,
          rent: 2800,
          depositAmount: 2800,
          status: "vacant",
          features: { garden: true, garage: false, pets_allowed: true },
        },
      ],
    });

    // Property 3: Downtown Lofts
    const property3 = await createPropertyWithUnits({
      name: "Downtown Lofts",
      address: "789 Business Ave, Chicago, IL",
      type: "Apartment",
      description: "Modern loft apartments in downtown",
      ownerId: landlord3.id,
      caretakerId: caretaker3.id,
      agentId: agent3.id,
      units: [
        {
          name: "Loft 1A",
          type: "Studio Loft",
          bedrooms: 0,
          bathrooms: 1,
          size: 650,
          rent: 1700,
          depositAmount: 1700,
          status: "vacant",
          features: { parking: true, high_ceiling: true, pets_allowed: false },
        },
        {
          name: "Loft 1B",
          type: "1BR Loft",
          bedrooms: 1,
          bathrooms: 1,
          size: 850,
          rent: 2000,
          depositAmount: 2000,
          status: "vacant",
          features: { parking: true, high_ceiling: true, pets_allowed: false },
        },
        {
          name: "Loft 2A",
          type: "2BR Loft",
          bedrooms: 2,
          bathrooms: 2,
          size: 1200,
          rent: 2500,
          depositAmount: 2500,
          status: "vacant",
          features: { parking: true, high_ceiling: true, pets_allowed: true },
        },
        {
          name: "Loft 2B",
          type: "2BR Loft",
          bedrooms: 2,
          bathrooms: 2,
          size: 1250,
          rent: 2600,
          depositAmount: 2600,
          status: "vacant",
          features: { parking: true, high_ceiling: true, pets_allowed: true },
        },
      ],
    });

    console.log("Properties and units created successfully");

    // Create tenants
    console.log("Creating tenants...");

    const tenant1 = await createTenant({
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "+12223334444",
      emergencyContactName: "Bob Johnson",
      emergencyContactPhone: "+12223335555",
      dateOfBirth: new Date("1990-05-15"),
      status: "active",
    });

    const tenant2 = await createTenant({
      name: "Bob Williams",
      email: "bob@example.com",
      phone: "+13334445555",
      emergencyContactName: "Jane Williams",
      emergencyContactPhone: "+13334446666",
      dateOfBirth: new Date("1985-08-22"),
      status: "active",
    });

    const tenant3 = await createTenant({
      name: "Charlie Brown",
      email: "charlie@example.com",
      phone: "+14445556666",
      emergencyContactName: "Lucy Brown",
      emergencyContactPhone: "+14445557777",
      dateOfBirth: new Date("1992-02-10"),
      status: "active",
    });

    const tenant4 = await createTenant({
      name: "Diana Miller",
      email: "diana@example.com",
      phone: "+15556667777",
      emergencyContactName: "George Miller",
      emergencyContactPhone: "+15556668888",
      dateOfBirth: new Date("1988-11-30"),
      status: "past",
    });

    const tenant5 = await createTenant({
      name: "Edward Davis",
      email: "edward@example.com",
      phone: "+16667778888",
      emergencyContactName: "Martha Davis",
      emergencyContactPhone: "+16667779999",
      dateOfBirth: new Date("1978-07-20"),
      status: "active",
    });

    const tenant6 = await createTenant({
      name: "Fiona Clark",
      email: "fiona@example.com",
      phone: "+17778889999",
      emergencyContactName: "Henry Clark",
      emergencyContactPhone: "+17778880000",
      dateOfBirth: new Date("1995-03-25"),
      status: "active",
    });

    console.log("Tenants created successfully");

    // Create leases
    console.log("Creating leases...");

    // Active leases
    const today = new Date();

    // Get units for the properties
    const property1Units = await db.query.units.findMany({
      where: (units, { eq }) => eq(units.propertyId, property1.id),
    });

    const property2Units = await db.query.units.findMany({
      where: (units, { eq }) => eq(units.propertyId, property2.id),
    });

    const property3Units = await db.query.units.findMany({
      where: (units, { eq }) => eq(units.propertyId, property3.id),
    });

    // Unit 101 - Alice Johnson
    const lease1 = await createLease({
      unitId: property1Units[0].id, // Unit 101
      tenantId: tenant1.id,
      startDate: addDays(today, -90), // 3 months ago
      endDate: addDays(today, 275), // 9 months from now
      rentAmount: property1Units[0].rent,
      depositAmount: property1Units[0].depositAmount,
      status: "active",
      paymentDay: 1,
      createdBy: agent1.id,
      notes: "Tenant prefers email communication",
    });

    // Unit 103 - Bob Williams
    const lease2 = await createLease({
      unitId: property1Units[2].id, // Unit 103
      tenantId: tenant2.id,
      startDate: addDays(today, -60), // 2 months ago
      endDate: addDays(today, 305), // 10 months from now
      rentAmount: property1Units[2].rent,
      depositAmount: property1Units[2].depositAmount,
      status: "active",
      paymentDay: 5,
      includesInternet: true,
      createdBy: agent1.id,
    });

    // House A - Charlie Brown
    const lease3 = await createLease({
      unitId: property2Units[0].id, // House A
      tenantId: tenant3.id,
      startDate: addDays(today, -180), // 6 months ago
      endDate: addDays(today, 185), // 6 months from now
      rentAmount: property2Units[0].rent,
      depositAmount: property2Units[0].depositAmount,
      status: "active",
      paymentDay: 1,
      includesWater: true,
      createdBy: agent2.id,
    });

    // Previous lease - Loft 1A - Diana Miller
    const lease4 = await createLease({
      unitId: property3Units[0].id, // Loft 1A
      tenantId: tenant4.id,
      startDate: addDays(today, -365), // 1 year ago
      endDate: addDays(today, -30), // 30 days ago
      rentAmount: property3Units[0].rent * 0.9, // Slightly lower than current
      depositAmount: property3Units[0].depositAmount * 0.9,
      status: "expired",
      paymentDay: 1,
      createdBy: agent3.id,
    });

    // Current lease - Loft 1A - Edward Davis (replaced Diana)
    const lease5 = await createLease({
      unitId: property3Units[0].id, // Loft 1A
      tenantId: tenant5.id,
      startDate: addDays(today, -25), // 25 days ago
      endDate: addDays(today, 340), // 340 days from now
      rentAmount: property3Units[0].rent,
      depositAmount: property3Units[0].depositAmount,
      status: "active",
      paymentDay: 1,
      createdBy: agent3.id,
    });

    // Loft 1B - Fiona Clark
    const lease6 = await createLease({
      unitId: property3Units[1].id, // Loft 1B
      tenantId: tenant6.id,
      startDate: addDays(today, -45), // 45 days ago
      endDate: addDays(today, 320), // 320 days from now
      rentAmount: property3Units[1].rent,
      depositAmount: property3Units[1].depositAmount,
      status: "active",
      paymentDay: 1,
      includesInternet: true,
      includesWater: true,
      createdBy: agent3.id,
    });

    console.log("Leases created successfully");

    // Create transactions
    console.log("Creating transactions...");

    // Helper to create payment dates
    const getPastPaymentDates = (
      startDate: Date,
      numMonths: number
    ): Date[] => {
      const dates = [];
      for (let i = 0; i < numMonths; i++) {
        dates.push(addDays(addMonths(startDate, i), 0));
      }
      return dates;
    };

    // Lease 1 transactions (Alice)
    if (lease1) {
      try {
        const lease1PaymentDates = getPastPaymentDates(lease1.startDate, 3);

        // Security deposit
        await createTransaction({
          leaseId: lease1.id,
          amount: lease1.depositAmount,
          type: "deposit",
          paymentDate: addDays(lease1.startDate, -5), // 5 days before move-in
          paymentMethod: "bank_transfer",
          recordedBy: agent1.id,
          notes: "Security deposit for unit 101",
        });

        // Monthly rent payments
        for (const date of lease1PaymentDates) {
          await createTransaction({
            leaseId: lease1.id,
            amount: lease1.rentAmount,
            type: "rent",
            paymentDate: date,
            paymentMethod: "bank_transfer",
            recordedBy: caretaker1.id,
          });
        }

        // Create activity record for payment
        await createActivity({
          userId: caretaker1.id,
          action: "collected_payment",
          entityType: "lease",
          entityId: lease1.id,
          unitId: property1Units[0].id,
          metadata: { amount: lease1.rentAmount, type: "rent" },
        });
      } catch (error) {
        console.error("Error creating transactions for lease 1:", error);
      }
    }

    // Lease 2 transactions (Bob)
    if (lease2) {
      const lease2PaymentDates = getPastPaymentDates(lease2.startDate, 2);

      // Security deposit
      await createTransaction({
        leaseId: lease2.id,
        amount: lease2.depositAmount,
        type: "deposit",
        paymentDate: addDays(lease2.startDate, -3), // 3 days before move-in
        paymentMethod: "bank_transfer",
        recordedBy: agent1.id,
        notes: "Security deposit for unit 103",
      });

      // Monthly rent payments
      for (const date of lease2PaymentDates) {
        await createTransaction({
          leaseId: lease2.id,
          amount: lease2.rentAmount,
          type: "rent",
          paymentDate: date,
          paymentMethod: "bank_transfer",
          recordedBy: caretaker1.id,
        });
      }

      // Pending payment for upcoming rent
      await createTransaction({
        leaseId: lease2.id,
        amount: lease2.rentAmount,
        type: "rent",
        status: "pending",
        paymentDate: addMonths(lease2.startDate, 2), // Next month
        dueDate: addMonths(lease2.startDate, 2),
        recordedBy: agent1.id,
      });
    }

    // Lease 3 transactions (Charlie)
    if (lease3) {
      const lease3PaymentDates = getPastPaymentDates(lease3.startDate, 6);

      // Security deposit
      await createTransaction({
        leaseId: lease3.id,
        amount: lease3.depositAmount,
        type: "deposit",
        paymentDate: addDays(lease3.startDate, -7), // 7 days before move-in
        paymentMethod: "bank_transfer",
        recordedBy: agent2.id,
        notes: "Security deposit for House A",
      });

      // Monthly rent payments
      for (const date of lease3PaymentDates) {
        await createTransaction({
          leaseId: lease3.id,
          amount: lease3.rentAmount,
          type: "rent",
          paymentDate: date,
          paymentMethod: "bank_transfer",
          recordedBy: caretaker2.id,
        });
      }
    }

    console.log("Transactions created successfully");

    // Create utility bills
    console.log("Creating utility bills...");

    if (lease1) {
      // Electricity bill (tenant pays)
      await createUtilityBill({
        leaseId: lease1.id,
        utilityType: "electricity",
        billDate: addDays(lease1.startDate, 15),
        dueDate: addDays(lease1.startDate, 30),
        amount: 85.75,
        tenantAmount: 85.75,
        isPaid: true,
        paidDate: addDays(lease1.startDate, 28),
      });

      // Water bill (tenant pays)
      await createUtilityBill({
        leaseId: lease1.id,
        utilityType: "water",
        billDate: addDays(lease1.startDate, 20),
        dueDate: addDays(lease1.startDate, 35),
        amount: 45.3,
        tenantAmount: 45.3,
        isPaid: true,
        paidDate: addDays(lease1.startDate, 33),
      });

      // Gas bill (tenant pays)
      await createUtilityBill({
        leaseId: lease1.id,
        utilityType: "gas",
        billDate: addDays(lease1.startDate, 25),
        dueDate: addDays(lease1.startDate, 40),
        amount: 35.25,
        tenantAmount: 35.25,
        isPaid: true,
        paidDate: addDays(lease1.startDate, 38),
      });

      // Upcoming electricity bill (not yet paid)
      await createUtilityBill({
        leaseId: lease1.id,
        utilityType: "electricity",
        billDate: addDays(today, -5),
        dueDate: addDays(today, 10),
        amount: 92.4,
        tenantAmount: 92.4,
        isPaid: false,
      });
    }

    // Lease 6 utility bills (Fiona - has some bills included)
    if (lease6) {
      // Electricity bill (tenant pays)
      await createUtilityBill({
        leaseId: lease6.id,
        utilityType: "electricity",
        billDate: addDays(lease6.startDate, 20),
        dueDate: addDays(lease6.startDate, 35),
        amount: 78.5,
        tenantAmount: 78.5,
        isPaid: true,
        paidDate: addDays(lease6.startDate, 30),
      });

      // Water bill (landlord pays - included in rent)
      await createUtilityBill({
        leaseId: lease6.id,
        utilityType: "water",
        billDate: addDays(lease6.startDate, 25),
        dueDate: addDays(lease6.startDate, 40),
        amount: 52.8,
        tenantResponsibilityPercent: 0,
        tenantAmount: 0,
        landlordAmount: 52.8,
        isPaid: true,
        paidDate: addDays(lease6.startDate, 38),
        notes: "Covered by landlord per lease agreement",
      });

      // Internet bill (landlord pays - included in rent)
      await createUtilityBill({
        leaseId: lease6.id,
        utilityType: "internet",
        billDate: addDays(lease6.startDate, 15),
        dueDate: addDays(lease6.startDate, 30),
        amount: 65.0,
        tenantResponsibilityPercent: 0,
        tenantAmount: 0,
        landlordAmount: 65.0,
        isPaid: true,
        paidDate: addDays(lease6.startDate, 25),
        notes: "Covered by landlord per lease agreement",
      });
    }

    console.log("Utility bills created successfully");

    // Create maintenance requests
    console.log("Creating maintenance requests...");

    // Property 1, Unit 101 - Active tenant maintenance request
    if (lease1) {
      const maintenanceReq1 = await createMaintenanceRequest({
        unitId: lease1.unitId,
        tenantId: lease1.tenantId,
        title: "Leaking bathroom faucet",
        description:
          "The bathroom sink faucet is leaking water and creating a puddle under the sink. It's been happening for 2 days now.",
        priority: "medium",
        status: "in_progress",
        reportedAt: addDays(today, -5),
        assignedTo: caretaker1.id,
      });

      if (maintenanceReq1) {
        // Create activity for maintenance request creation
        await createActivity({
          userId: tenant1.id,
          action: "created_request",
          entityType: "maintenance_request",
          entityId: maintenanceReq1.id,
          unitId: lease1.unitId,
        });

        // Create activity for status change
        await createActivity({
          userId: caretaker1.id,
          action: "changed_status",
          entityType: "maintenance_request",
          entityId: maintenanceReq1.id,
          unitId: lease1.unitId,
          previousStatus: "open",
          newStatus: "in_progress",
        });

        // Add comments to the maintenance request
        await createMaintenanceComment({
          requestId: maintenanceReq1.id,
          userId: caretaker1.id,
          content:
            "I'll take a look at this tomorrow morning. Please make sure the area under the sink is accessible.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq1.id,
          userId: tenant1.id,
          content:
            "Thank you, I've cleared the area under the sink for access.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq1.id,
          userId: caretaker1.id,
          content:
            "Checked the issue. Need to order a replacement part. Should be fixed within 2 days.",
          isPrivate: false,
        });

        // Create a work order from this maintenance request
        await createWorkOrder({
          requestId: maintenanceReq1.id,
          title: "Repair leaking bathroom faucet",
          description:
            "Replace faucet gaskets and potentially the entire faucet if necessary.",
          priority: "normal",
          status: "in_progress",
          unitId: lease1.unitId,
          tenantId: lease1.tenantId,
          assignedTo: caretaker1.id,
          reportedAt: maintenanceReq1.reportedAt,
          category: "Plumbing",
        });
      }
    }

    // Property 1, Unit 103 - Another tenant maintenance request
    if (lease2) {
      const maintenanceReq2 = await createMaintenanceRequest({
        unitId: lease2.unitId,
        tenantId: lease2.tenantId,
        title: "Heating not working properly",
        description:
          "The heating system in the living room isn't working correctly. The bedroom heater is fine, but the living room is very cold.",
        priority: "high",
        status: "open",
        reportedAt: addDays(today, -1),
      });

      if (maintenanceReq2) {
        // Create activity for maintenance request creation
        await createActivity({
          userId: tenant2.id,
          action: "created_request",
          entityType: "maintenance_request",
          entityId: maintenanceReq2.id,
          unitId: lease2.unitId,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq2.id,
          userId: agent1.id,
          content:
            "I've notified the caretaker about this issue. Someone will be assigned to look at it soon.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq2.id,
          userId: landlord1.id,
          content:
            "We should prioritize this since temperatures are dropping this week.",
          isPrivate: true, // Only visible to staff
        });
      }
    }

    // Property 2, House A - Completed maintenance request
    if (lease3) {
      const maintenanceReq3 = await createMaintenanceRequest({
        unitId: lease3.unitId,
        tenantId: lease3.tenantId,
        title: "Garage door opener not working",
        description:
          "The automatic garage door opener has stopped working. I've tried changing the batteries in the remote, but it still doesn't work.",
        priority: "medium",
        status: "completed",
        reportedAt: addDays(today, -15),
        assignedTo: caretaker2.id,
        resolvedAt: addDays(today, -12),
        cost: 85.5,
      });

      if (maintenanceReq3) {
        // Create activity records
        await createActivity({
          userId: tenant3.id,
          action: "created_request",
          entityType: "maintenance_request",
          entityId: maintenanceReq3.id,
          unitId: lease3.unitId,
        });

        await createActivity({
          userId: caretaker2.id,
          action: "changed_status",
          entityType: "maintenance_request",
          entityId: maintenanceReq3.id,
          unitId: lease3.unitId,
          previousStatus: "open",
          newStatus: "completed",
        });

        await createMaintenanceComment({
          requestId: maintenanceReq3.id,
          userId: caretaker2.id,
          content: "I'll check this out tomorrow.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq3.id,
          userId: caretaker2.id,
          content: "Replacing the motor unit. The old one has burnt out.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq3.id,
          userId: caretaker2.id,
          content:
            "Repair completed. New opener installed and tested. Works fine now.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq3.id,
          userId: tenant3.id,
          content: "Thank you! It's working perfectly now.",
          isPrivate: false,
        });

        // Create a completed work order for this request
        await createWorkOrder({
          requestId: maintenanceReq3.id,
          title: "Replace garage door opener",
          description: "Replace failed garage door opener motor unit",
          priority: "normal",
          status: "completed",
          unitId: lease3.unitId,
          tenantId: lease3.tenantId,
          assignedTo: caretaker2.id,
          reportedAt: maintenanceReq3.reportedAt,
          resolvedAt: maintenanceReq3.resolvedAt,
          category: "Electrical",
          cost: 85.5,
        });
      }
    }

    // Property 3, Loft 1A - Emergency request (current tenant)
    if (lease5) {
      const maintenanceReq4 = await createMaintenanceRequest({
        unitId: lease5.unitId,
        tenantId: lease5.tenantId,
        title: "Water leak from ceiling",
        description:
          "There's water leaking from the ceiling in the bathroom. It looks like it's coming from the unit above. The leak is quite significant.",
        priority: "emergency",
        status: "in_progress",
        reportedAt: addDays(today, -1),
        assignedTo: caretaker3.id,
      });

      if (maintenanceReq4) {
        // Create activity records
        await createActivity({
          userId: tenant5.id,
          action: "created_request",
          entityType: "maintenance_request",
          entityId: maintenanceReq4.id,
          unitId: lease5.unitId,
        });

        await createActivity({
          userId: caretaker3.id,
          action: "changed_status",
          entityType: "maintenance_request",
          entityId: maintenanceReq4.id,
          unitId: lease5.unitId,
          previousStatus: "open",
          newStatus: "in_progress",
        });

        await createMaintenanceComment({
          requestId: maintenanceReq4.id,
          userId: caretaker3.id,
          content: "This is urgent. I'm on my way to check it now.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq4.id,
          userId: caretaker3.id,
          content:
            "I've shut off the water to the unit above. The leak has stopped. Will need to open the ceiling to assess the damage and make repairs.",
          isPrivate: false,
        });

        await createMaintenanceComment({
          requestId: maintenanceReq4.id,
          userId: landlord3.id,
          content: "Approved emergency repairs. Get a plumber in right away.",
          isPrivate: true,
        });

        // Create work order for this emergency
        await createWorkOrder({
          requestId: maintenanceReq4.id,
          title: "Emergency water leak repair",
          description:
            "Repair water pipe leak from ceiling in bathroom. Check for damage and repair drywall.",
          priority: "urgent",
          status: "in_progress",
          unitId: lease5.unitId,
          tenantId: lease5.tenantId,
          assignedTo: caretaker3.id,
          reportedAt: maintenanceReq4.reportedAt,
          category: "Plumbing",
        });
      }
    }

    console.log("Maintenance requests and work orders created successfully");

    // Create documents
    console.log("Creating documents...");

    // Lease agreements
    if (lease1) {
      await createDocument({
        name: `Lease Agreement - ${tenant1.name}`,
        type: "lease",
        url: `/documents/leases/lease_${lease1.id}.pdf`,
        relatedId: lease1.id,
        relatedType: "lease",
        uploadedBy: agent1.id,
      });
    }

    if (lease3) {
      await createDocument({
        name: `Lease Agreement - ${tenant3.name}`,
        type: "lease",
        url: `/documents/leases/lease_${lease3.id}.pdf`,
        relatedId: lease3.id,
        relatedType: "lease",
        uploadedBy: agent2.id,
      });
    }

    if (lease5) {
      await createDocument({
        name: `Lease Agreement - ${tenant5.name}`,
        type: "lease",
        url: `/documents/leases/lease_${lease5.id}.pdf`,
        relatedId: lease5.id,
        relatedType: "lease",
        uploadedBy: agent3.id,
      });
    }

    // Property documents
    await createDocument({
      name: "Luxury Apartment Complex - Property Deed",
      type: "property_deed",
      url: `/documents/properties/deed_${property1.id}.pdf`,
      relatedId: property1.id,
      relatedType: "property",
      uploadedBy: landlord1.id,
    });

    await createDocument({
      name: "Riverside Homes - Insurance Certificate",
      type: "insurance",
      url: `/documents/properties/insurance_${property2.id}.pdf`,
      relatedId: property2.id,
      relatedType: "property",
      uploadedBy: landlord2.id,
    });

    // Maintenance request documents
    const maintenanceReq3 = await db.query.maintenanceRequests.findFirst({
      where: (req, { and, eq }) =>
        and(
          eq(req.title, "Garage door opener not working"),
          eq(req.status, "completed")
        ),
    });

    if (maintenanceReq3) {
      await createDocument({
        name: "Garage Door Repair Invoice",
        type: "invoice",
        url: `/documents/maintenance/invoice_${maintenanceReq3.id}.pdf`,
        relatedId: maintenanceReq3.id,
        relatedType: "maintenance",
        uploadedBy: caretaker2.id,
      });

      await createDocument({
        name: "Garage Door Warranty",
        type: "warranty",
        url: `/documents/maintenance/warranty_${maintenanceReq3.id}.pdf`,
        relatedId: maintenanceReq3.id,
        relatedType: "maintenance",
        uploadedBy: caretaker2.id,
      });
    }

    // Tenant documents
    await createDocument({
      name: `${tenant1.name} - ID Verification`,
      type: "id_verification",
      url: `/documents/tenants/id_${tenant1.id}.pdf`,
      relatedId: tenant1.id,
      relatedType: "tenant",
      uploadedBy: agent1.id,
    });

    // Payment receipts
    const recentTransaction = await db.query.transactions.findFirst({
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
      limit: 1,
    });

    if (recentTransaction) {
      await createDocument({
        name: `Payment Receipt - ${
          new Date(recentTransaction.paymentDate).toISOString().split("T")[0]
        }`,
        type: "receipt",
        url: `/documents/payments/receipt_${recentTransaction.id}.pdf`,
        relatedId: recentTransaction.id,
        relatedType: "transaction",
        uploadedBy: recentTransaction.recordedBy || admin1.id,
      });
    }

    console.log("Documents created successfully");

    // Create permissions
    console.log("Creating user permissions...");

    // Add custom permissions for caretakers
    if (property1) {
      await createUserPermission({
        userId: caretaker1.id,
        propertyId: property1.id,
        role: "caretaker",
        canManageTenants: true,
        canCollectPayments: true,
        canManageMaintenance: true,
        grantedBy: landlord1.id,
      });
    }

    if (property2) {
      await createUserPermission({
        userId: caretaker2.id,
        propertyId: property2.id,
        role: "caretaker",
        canManageTenants: true,
        canCollectPayments: true,
        canManageMaintenance: true,
        grantedBy: landlord2.id,
      });
    }

    // Add custom permissions for agents
    if (property3) {
      await createUserPermission({
        userId: agent1.id,
        propertyId: property3.id,
        role: "agent",
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: false,
        canViewFinancials: true,
        grantedBy: landlord3.id,
      });
    }

    if (property2) {
      await createUserPermission({
        userId: agent2.id,
        propertyId: property2.id,
        role: "agent",
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: true,
        canViewFinancials: true,
        grantedBy: landlord2.id,
      });
    }

    // Add cross-property permissions (landlord granting view access to another landlord)
    await createUserPermission({
      userId: landlord2.id,
      propertyId: property1.id,
      role: "custom",
      canManageTenants: false,
      canManageLeases: false,
      canCollectPayments: false,
      canViewFinancials: true,
      canManageMaintenance: false,
      canManageProperties: false,
      grantedBy: landlord1.id,
    });

    console.log("User permissions created successfully");

    // Create notifications
    console.log("Creating notifications...");

    // Notifications for landlord1
    if (lease1) {
      // Rent payment notification
      await createNotification({
        userId: landlord1.id,
        title: "Rent Payment Received",
        message: `Rent payment of $${lease1.rentAmount} received from ${tenant1.name} for Unit 101`,
        type: "payment_received",
        relatedId: lease1.id,
        relatedType: "lease",
        isRead: true,
      });

      // Upcoming lease expiration
      await createNotification({
        userId: landlord1.id,
        title: "Lease Expiring Soon",
        message: `The lease with ${
          tenant1.name
        } for Unit 101 will expire in 3 months on ${
          lease1.endDate.toISOString().split("T")[0]
        }`,
        type: "lease",
        relatedId: lease1.id,
        relatedType: "lease",
        isRead: false,
      });
    }

    // Notifications for tenant2
    if (lease2) {
      await createNotification({
        userId: tenant2.id,
        title: "Rent Payment Confirmation",
        message: `Your rent payment of $${lease2.rentAmount} for Unit 103 has been processed successfully`,
        type: "payment_received",
        relatedId: lease2.id,
        relatedType: "lease",
        isRead: true,
      });

      // Rent due reminder
      await createNotification({
        userId: tenant2.id,
        title: "Rent Payment Due Soon",
        message: `Your monthly rent of $${lease2.rentAmount} for Unit 103 is due in 5 days`,
        type: "payment_due",
        relatedId: lease2.id,
        relatedType: "lease",
        isRead: false,
      });
    }

    // Maintenance notifications for caretaker1
    const maintenanceReq1 = await db.query.maintenanceRequests.findFirst({
      where: (req, { and, eq }) =>
        and(
          eq(req.title, "Leaking bathroom faucet"),
          eq(req.status, "in_progress")
        ),
    });

    if (maintenanceReq1) {
      await createNotification({
        userId: caretaker1.id,
        title: "Maintenance Request Assigned",
        message:
          "You have been assigned to fix a leaking bathroom faucet in Unit 101",
        type: "maintenance",
        relatedId: maintenanceReq1.id,
        relatedType: "maintenance",
        isRead: true,
      });

      // Also notify landlord
      await createNotification({
        userId: landlord1.id,
        title: "New Maintenance Request",
        message:
          "A maintenance request for a leaking bathroom faucet has been submitted for Unit 101",
        type: "maintenance",
        relatedId: maintenanceReq1.id,
        relatedType: "maintenance",
        isRead: false,
      });
    }

    // Utility bill notification for tenant5
    const utilityBill = await db.query.utilityBills.findFirst({
      where: (bill, { and, eq }) =>
        and(eq(bill.leaseId, lease5?.id || ""), eq(bill.isPaid, false)),
    });

    if (utilityBill && lease5) {
      await createNotification({
        userId: tenant5.id,
        title: "Utility Bill Due",
        message: `Your ${utilityBill.utilityType} bill of $${
          utilityBill.tenantAmount
        } is due on ${
          new Date(utilityBill.dueDate).toISOString().split("T")[0]
        }`,
        type: "utility_bill",
        relatedId: utilityBill.id,
        relatedType: "utility_bill",
        isRead: false,
      });
    }

    // System notifications for admin
    await createNotification({
      userId: admin1.id,
      title: "New User Registration",
      message:
        "A new landlord has registered on the platform and requires approval",
      type: "system",
      isRead: false,
    });

    await createNotification({
      userId: admin1.id,
      title: "System Maintenance",
      message: "Scheduled system maintenance will occur tonight at 2:00 AM UTC",
      type: "system",
      isRead: true,
    });

    // Multiple maintenance notifications for caretaker2
    if (property2) {
      await createNotification({
        userId: caretaker2.id,
        title: "Maintenance Request Updated",
        message: "The garage door opener repair has been marked as completed",
        type: "maintenance",
        isRead: true,
      });

      await createNotification({
        userId: caretaker2.id,
        title: "New Comment on Maintenance Request",
        message: "Tenant has added a comment to the garage door repair request",
        type: "maintenance",
        isRead: false,
      });

      await createNotification({
        userId: caretaker2.id,
        title: "Scheduled Maintenance Due",
        message:
          "Quarterly HVAC maintenance check is due for all units in Riverside Homes",
        type: "maintenance",
        relatedId: property2.id,
        relatedType: "property",
        isRead: false,
      });
    }

    console.log("Notifications created successfully");

    // Create message templates
    console.log("Creating message templates...");

    // Common email templates
    await createMessageTemplate({
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to your new home!",
      content: `Dear {{tenant_name}},

Welcome to {{property_name}}! We're excited to have you as our tenant.

Here are a few important details to help you get settled:
- Your rent payment is due on the {{payment_day}} of each month
- For maintenance requests, please use our online portal or call {{caretaker_phone}}
- Office hours are Monday-Friday, 9:00 AM - 5:00 PM

If you have any questions, feel free to reach out.

Best regards,
{{property_management}}`,
      createdBy: admin1.id,
      isGlobal: true,
    });

    await createMessageTemplate({
      name: "Rent Reminder",
      type: "email",
      subject: "Rent Payment Reminder",
      content: `Dear {{tenant_name}},

This is a friendly reminder that your rent payment of is due on {{due_date}}.

To avoid late fees, please ensure your payment is made on time.

Thank you,
{{property_management}}`,
      createdBy: admin1.id,
      isGlobal: true,
    });

    // Property-specific templates
    await createMessageTemplate({
      name: "Maintenance Scheduled",
      type: "email",
      subject: "Maintenance Visit Scheduled",
      content: `Dear {{tenant_name}},

We have scheduled a maintenance visit for your reported issue:
"{{maintenance_title}}"

The maintenance team will visit on {{scheduled_date}} between {{start_time}} and {{end_time}}.

Please ensure someone is available to provide access or make arrangements with the building caretaker.

Best regards,
{{property_management}}`,
      createdBy: landlord1.id,
      isGlobal: false,
      propertyId: property1.id,
    });

    // SMS templates
    await createMessageTemplate({
      name: "Rent Due SMS",
      type: "sms",
      content:
        "{{property_name}} reminder: Your rent of ${{rent_amount}} is due on {{due_date}}. Thank you.",
      createdBy: admin1.id,
      isGlobal: true,
    });

    await createMessageTemplate({
      name: "Maintenance SMS",
      type: "sms",
      content:
        "{{property_name}}: Maintenance scheduled for {{scheduled_date}} between {{start_time}}-{{end_time}}. Reply Y to confirm or call to reschedule.",
      createdBy: admin1.id,
      isGlobal: true,
    });

    console.log("Message templates created successfully");

    // Create messages
    console.log("Creating messages...");

    // Email to Alice about maintenance
    if (tenant1 && maintenanceReq1 && property1) {
      await createMessage({
        propertyId: property1.id,
        senderId: caretaker1.id,
        type: "email",
        subject: "Scheduled Maintenance for Leaking Faucet",
        content: `Dear Alice,

I've scheduled a time to fix your leaking bathroom faucet tomorrow between 10:00 AM and 12:00 PM.

Please let me know if this time works for you.

Best regards,
Mary Johnson
Caretaker, Luxury Apartment Complex`,
        status: "sent",
        recipientIds: [tenant1.id],
      });
    }

    // Rent reminder to Bob
    if (tenant2 && property1) {
      await createMessage({
        propertyId: property1.id,
        senderId: landlord1.id,
        type: "email",
        subject: "Rent Payment Reminder",
        content: `Dear Bob,

This is a friendly reminder that your rent payment of $2,000 is due on the 5th of this month.

Please ensure your payment is made on time to avoid late fees.

Thank you,
John Smith
Landlord, Luxury Apartment Complex`,
        status: "sent",
        recipientIds: [tenant2.id],
      });
    }

    // SMS to Charlie about utilities
    if (tenant3 && property2) {
      await createMessage({
        propertyId: property2.id,
        senderId: agent2.id,
        type: "sms",
        content:
          "Riverside Homes: Water service will be temporarily suspended on June 15th from 9AM-12PM for essential maintenance. Sorry for any inconvenience.",
        status: "sent",
        recipientIds: [tenant3.id],
      });
    }

    // Bulk email to all current tenants
    if (tenant1 && tenant2 && tenant3 && tenant5) {
      await createMessage({
        senderId: admin1.id,
        type: "email",
        subject: "Important: System Maintenance Notice",
        content: `Dear Tenant,

Our property management portal will be undergoing scheduled maintenance this weekend.

The system will be unavailable from Saturday 10:00 PM until Sunday 2:00 AM.

We apologize for any inconvenience this may cause.

Best regards,
Property Management Team`,
        status: "sent",
        recipientIds: [tenant1.id, tenant2.id, tenant3.id, tenant5.id],
      });
    }

    console.log("Messages created successfully");
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

// Call the main seeding function if script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error during seeding:", error);
      process.exit(1);
    });
} else {
  // Export for programmatic usage
  module.exports = { seedDatabase };
}
