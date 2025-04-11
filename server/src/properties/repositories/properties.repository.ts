import { db } from "@/db";
import { properties as propertiesTable } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { CreatePropertyDto, UpdatePropertyDto } from "../dto/properties.dto";
import { Property, PropertyWithRelations } from "../types";

export class PropertiesRepository {
  /**
   * Find all properties with optional relations
   */
  async findAll(options?: {
    withRelations?: boolean;
    ownerId?: string;
  }): Promise<PropertyWithRelations[]> {
    let query = db.query.properties;

    if (options?.ownerId) {
      return query.findMany({
        where: eq(propertiesTable.ownerId, options.ownerId),
        with: options?.withRelations
          ? {
              caretaker: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              agent: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            }
          : undefined,
        orderBy: [sql`created_at desc`],
      });
    }

    return query.findMany({
      with: options?.withRelations
        ? {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            caretaker: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            agent: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          }
        : undefined,
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find properties for a caretaker
   */
  async findForCaretaker(
    caretakerId: string
  ): Promise<PropertyWithRelations[]> {
    return db.query.properties.findMany({
      where: eq(propertiesTable.caretakerId, caretakerId),
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find properties for an agent
   */
  async findForAgent(agentId: string): Promise<PropertyWithRelations[]> {
    return db.query.properties.findMany({
      where: eq(propertiesTable.agentId, agentId),
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        caretaker: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find a property by ID with relations
   */
  async findById(
    id: string,
    options?: { withRelations?: boolean }
  ): Promise<PropertyWithRelations | null> {
    return db.query.properties.findFirst({
      where: eq(propertiesTable.id, id),
      with: options?.withRelations
        ? {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            caretaker: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            agent: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          }
        : undefined,
    });
  }

  /**
   * Check if a property exists and belongs to a specific owner
   */
  async findByIdAndOwner(
    id: string,
    ownerId: string
  ): Promise<Property | null> {
    return db.query.properties.findFirst({
      where: and(
        eq(propertiesTable.id, id),
        eq(propertiesTable.ownerId, ownerId)
      ),
    });
  }

  /**
   * Create a new property
   */
  async create(
    propertyData: CreatePropertyDto & { ownerId: string }
  ): Promise<Property> {
    const [property] = await db
      .insert(propertiesTable)
      .values({
        ...propertyData,
        updatedAt: new Date(),
      })
      .returning();

    return property;
  }

  /**
   * Update a property
   */
  async update(
    id: string,
    propertyData: Partial<UpdatePropertyDto>
  ): Promise<Property> {
    const [property] = await db
      .update(propertiesTable)
      .set({
        ...propertyData,
        updatedAt: new Date(),
      })
      .where(eq(propertiesTable.id, id))
      .returning();

    return property;
  }

  /**
   * Delete a property
   */
  async delete(id: string): Promise<void> {
    await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
  }
}

// Export a singleton instance
export const propertiesRepository = new PropertiesRepository();
