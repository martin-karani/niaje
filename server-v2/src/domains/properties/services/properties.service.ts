import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { eq } from "drizzle-orm";
import {
  NewProperty,
  Property,
  propertyEntity,
} from "../entities/property.entity";
import { NewUnit, Unit, unitEntity } from "../entities/unit.entity";

export class PropertiesService {
  async getPropertiesByOrganization(
    organizationId: string
  ): Promise<Property[]> {
    return db.query.propertyEntity.findMany({
      where: eq(propertyEntity.organizationId, organizationId),
      with: {
        owner: true,
        caretaker: true,
      },
    });
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return db.query.propertyEntity.findMany({
      where: eq(propertyEntity.ownerId, ownerId),
      with: {
        organization: true,
        caretaker: true,
      },
    });
  }

  async getPropertiesByCaretaker(caretakerId: string): Promise<Property[]> {
    return db.query.propertyEntity.findMany({
      where: eq(propertyEntity.caretakerId, caretakerId),
      with: {
        organization: true,
        owner: true,
      },
    });
  }

  async getPropertyById(id: string): Promise<Property> {
    const property = await db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, id),
      with: {
        owner: true,
        caretaker: true,
      },
    });

    if (!property) {
      throw new NotFoundError(`Property with ID ${id} not found`);
    }

    return property;
  }

  async createProperty(
    data: Omit<NewProperty, "createdAt" | "updatedAt" | "status">
  ): Promise<Property> {
    const result = await db
      .insert(propertyEntity)
      .values({
        ...data,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async updateProperty(
    id: string,
    data: Partial<NewProperty>
  ): Promise<Property> {
    // Check if property exists
    await this.getPropertyById(id);

    const result = await db
      .update(propertyEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(propertyEntity.id, id))
      .returning();

    return result[0];
  }

  async deleteProperty(id: string): Promise<void> {
    // Check if property exists
    await this.getPropertyById(id);

    await db.delete(propertyEntity).where(eq(propertyEntity.id, id));
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    return db.query.unitEntity.findMany({
      where: eq(unitEntity.propertyId, propertyId),
    });
  }

  async getUnitById(id: string): Promise<Unit> {
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, id),
      with: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} not found`);
    }

    return unit;
  }

  async createUnit(
    data: Omit<NewUnit, "createdAt" | "updatedAt" | "status">
  ): Promise<Unit> {
    // Get property to reference its organization
    const property = await this.getPropertyById(data.propertyId);

    const result = await db
      .insert(unitEntity)
      .values({
        ...data,
        organizationId: property.organizationId,
        status: "vacant",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update property unit count
    await db
      .update(propertyEntity)
      .set({
        numberOfUnits: db.raw("number_of_units + 1"),
        updatedAt: new Date(),
      })
      .where(eq(propertyEntity.id, data.propertyId));

    return result[0];
  }

  async updateUnit(id: string, data: Partial<NewUnit>): Promise<Unit> {
    // Check if unit exists
    await this.getUnitById(id);

    const result = await db
      .update(unitEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(unitEntity.id, id))
      .returning();

    return result[0];
  }

  async deleteUnit(id: string): Promise<void> {
    // Check if unit exists
    const unit = await this.getUnitById(id);

    await db.delete(unitEntity).where(eq(unitEntity.id, id));

    // Update property unit count
    await db
      .update(propertyEntity)
      .set({
        numberOfUnits: db.raw("GREATEST(number_of_units - 1, 0)"),
        updatedAt: new Date(),
      })
      .where(eq(propertyEntity.id, unit.propertyId));
  }

  async hasReachedPropertyLimit(
    organizationId: string,
    maxProperties: number
  ): Promise<boolean> {
    const count = await db.query.propertyEntity
      .findMany({
        where: eq(propertyEntity.organizationId, organizationId),
      })
      .then((properties) => properties.length);

    return count >= maxProperties;
  }
}

export const propertiesService = new PropertiesService();
