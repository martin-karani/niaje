import { createId } from "@/db/utils";
import { NotFoundError, PermissionError } from "@/errors";
import { CreatePropertyDto, UpdatePropertyDto } from "../dto/properties.dto";
import { propertiesRepository } from "../repositories/properties.repository";
import { Property, PropertyWithRelations } from "../types";

export class PropertiesService {
  /**
   * Get properties based on user role and ID
   */
  async getPropertiesForUser(
    userId: string,
    userRole: string
  ): Promise<PropertyWithRelations[]> {
    // Admin can see all properties
    if (userRole === "ADMIN") {
      return propertiesRepository.findAll({ withRelations: true });
    }

    // Landlords see properties they own
    if (userRole === "LANDLORD") {
      return propertiesRepository.findAll({
        withRelations: true,
        ownerId: userId,
      });
    }

    // Caretakers see properties they manage
    if (userRole === "CARETAKER") {
      return propertiesRepository.findForCaretaker(userId);
    }

    // Agents see properties they represent
    if (userRole === "AGENT") {
      return propertiesRepository.findForAgent(userId);
    }

    // Default case
    return [];
  }

  /**
   * Get a property by ID if user has access
   */
  async getPropertyById(
    propertyId: string,
    userId: string,
    userRole: string
  ): Promise<PropertyWithRelations> {
    let property: PropertyWithRelations | null;

    // Admin can see any property
    if (userRole === "ADMIN") {
      property = await propertiesRepository.findById(propertyId, {
        withRelations: true,
      });
    } else if (userRole === "LANDLORD") {
      // Landlords can see their own properties
      property = await propertiesRepository.findByIdAndOwner(
        propertyId,
        userId
      );
    } else {
      // Caretakers and agents can see properties they're assigned to
      property = await propertiesRepository.findById(propertyId, {
        withRelations: true,
      });

      if (
        property &&
        !(
          (userRole === "CARETAKER" && property.caretakerId === userId) ||
          (userRole === "AGENT" && property.agentId === userId)
        )
      ) {
        property = null;
      }
    }

    if (!property) {
      throw new NotFoundError(
        "Property not found or you do not have permission to view it"
      );
    }

    return property;
  }

  /**
   * Create a new property
   */
  async createProperty(
    propertyData: CreatePropertyDto,
    ownerId: string
  ): Promise<Property> {
    const property = await propertiesRepository.create({
      ...propertyData,
      ownerId,
      id: createId(),
    });

    return property;
  }

  /**
   * Update a property
   */
  async updateProperty(
    propertyId: string,
    propertyData: UpdatePropertyDto,
    userId: string,
    userRole: string
  ): Promise<Property> {
    // Check if property exists and user has permission
    const property = await propertiesRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Only owners and admins can update properties
    if (userRole !== "ADMIN" && property.ownerId !== userId) {
      throw new PermissionError(
        "You do not have permission to update this property"
      );
    }

    // Remove id from the update data
    const { id, ...updateData } = propertyData;

    return propertiesRepository.update(propertyId, updateData);
  }

  /**
   * Delete a property
   */
  async deleteProperty(
    propertyId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check if property exists and user has permission
    const property = await propertiesRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Only owners and admins can delete properties
    if (userRole !== "ADMIN" && property.ownerId !== userId) {
      throw new PermissionError(
        "You do not have permission to delete this property"
      );
    }

    await propertiesRepository.delete(propertyId);
  }
}

// Export a singleton instance
export const propertiesService = new PropertiesService();
