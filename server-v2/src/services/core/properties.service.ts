// src/services/core/properties.service.ts
import { db } from "@/db";
import { properties, units } from "@/db/schema";
import { eq } from "drizzle-orm";

export class PropertiesService {
  /**
   * Get all properties for an organization
   */
  async getPropertiesByOrganization(organizationId: string) {
    return db.query.properties.findMany({
      where: eq(properties.organizationId, organizationId),
      with: {
        propertyOwner: true,
        propertyCaretaker: true,
        units: true,
      },
    });
  }

  /**
   * Get a specific property by ID
   */
  async getPropertyById(id: string) {
    return db.query.properties.findFirst({
      where: eq(properties.id, id),
      with: {
        propertyOwner: true,
        propertyCaretaker: true,
        units: true,
        maintenanceRequests: true,
      },
    });
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: string) {
    return db.query.properties.findMany({
      where: eq(properties.ownerId, ownerId),
      with: {
        managingOrganization: true,
        propertyCaretaker: true,
        units: true,
      },
    });
  }

  /**
   * Get properties by caretaker
   */
  async getPropertiesByCaretaker(caretakerId: string) {
    return db.query.properties.findMany({
      where: eq(properties.caretakerId, caretakerId),
      with: {
        managingOrganization: true,
        propertyOwner: true,
        units: true,
      },
    });
  }

  /**
   * Create a new property
   */
  async createProperty(data: {
    organizationId: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    type: string;
    description?: string;
    yearBuilt?: number;
    ownerId: string;
    caretakerId?: string;
    images?: string[];
    amenities?: string[];
    notes?: string;
  }) {
    const result = await db
      .insert(properties)
      .values({
        ...data,
        status: "active",
        images: data.images ? JSON.stringify(data.images) : null,
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update a property
   */
  async updateProperty(
    id: string,
    data: Partial<{
      name: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      description: string;
      status: string;
      yearBuilt: number;
      ownerId: string;
      caretakerId: string;
      images: string[];
      amenities: string[];
      notes: string;
    }>
  ) {
    // Process arrays for storage
    if (data.images) {
      data.images = JSON.stringify(data.images) as any;
    }
    if (data.amenities) {
      data.amenities = JSON.stringify(data.amenities) as any;
    }

    const result = await db
      .update(properties)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a property
   */
  async deleteProperty(id: string) {
    await db.delete(properties).where(eq(properties.id, id));
    return true;
  }

  /**
   * Get units for a property
   */
  async getUnitsByProperty(propertyId: string) {
    return db.query.units.findMany({
      where: eq(units.propertyId, propertyId),
    });
  }

  /**
   * Get a specific unit by ID
   */
  async getUnitById(id: string) {
    return db.query.units.findFirst({
      where: eq(units.id, id),
      with: {
        property: true,
        leases: {
          where: eq(leases.status, "active"),
        },
      },
    });
  }

  /**
   * Create a new unit
   */
  async createUnit(data: {
    propertyId: string;
    name: string;
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqFt?: number;
    floor?: number;
    marketRent?: number;
    depositAmount?: number;
    features?: string[];
    images?: string[];
    notes?: string;
  }) {
    // Get property to reference its organization
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, data.propertyId),
      columns: {
        organizationId: true,
      },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    const result = await db
      .insert(units)
      .values({
        ...data,
        organizationId: property.organizationId,
        status: "vacant",
        features: data.features ? JSON.stringify(data.features) : null,
        images: data.images ? JSON.stringify(data.images) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update a unit
   */
  async updateUnit(
    id: string,
    data: Partial<{
      name: string;
      type: string;
      status: string;
      bedrooms: number;
      bathrooms: number;
      sizeSqFt: number;
      floor: number;
      marketRent: number;
      currentRent: number;
      depositAmount: number;
      features: string[];
      images: string[];
      notes: string;
    }>
  ) {
    // Process arrays for storage
    if (data.features) {
      data.features = JSON.stringify(data.features) as any;
    }
    if (data.images) {
      data.images = JSON.stringify(data.images) as any;
    }

    const result = await db
      .update(units)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a unit
   */
  async deleteUnit(id: string) {
    await db.delete(units).where(eq(units.id, id));
    return true;
  }
}

export const propertiesService = new PropertiesService();
