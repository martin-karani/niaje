import { createId } from "@/db/utils";
import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import { propertiesRepository } from "@/properties/repositories/properties.repository";
import { CreateUnitDto, UnitFilterDto, UpdateUnitDto } from "../dto/units.dto";
import { unitsRepository } from "../repositories/units.repository";
import { Unit, UnitStats, UnitWithRelations } from "../types";

export class UnitsService {
  /**
   * Get units with optional filtering
   */
  async getUnits(
    filters: UnitFilterDto,
    userId: string,
    userRole: string
  ): Promise<{ units: UnitWithRelations[]; total: number; pages: number }> {
    // If propertyId is provided, ensure user has access
    if (filters.propertyId) {
      await this.ensurePropertyAccess(filters.propertyId, userId, userRole);
    }

    const units = await unitsRepository.findAll(filters);
    const total = await unitsRepository.countUnits(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { units, total, pages };
  }

  /**
   * Get a unit by ID
   */
  async getUnitById(
    unitId: string,
    userId: string,
    userRole: string
  ): Promise<UnitWithRelations> {
    const unit = await unitsRepository.findById(unitId);

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    // Verify user has access to the property this unit belongs to
    await this.ensurePropertyAccess(unit.propertyId, userId, userRole);

    return unit;
  }

  /**
   * Create a new unit
   */
  async createUnit(
    unitData: CreateUnitDto,
    userId: string,
    userRole: string
  ): Promise<Unit> {
    // Verify user has access to manage this property
    await this.ensurePropertyAccess(
      unitData.propertyId,
      userId,
      userRole,
      true
    );

    // Verify that property exists
    const property = await propertiesRepository.findById(unitData.propertyId);
    if (!property) {
      throw new NotFoundError("Property not found");
    }

    return unitsRepository.create({
      ...unitData,
      id: createId(), // This will be handled by the database, but adding for clarity
    });
  }

  /**
   * Update a unit
   */
  async updateUnit(
    unitId: string,
    unitData: UpdateUnitDto,
    userId: string,
    userRole: string
  ): Promise<Unit> {
    // Check if unit exists
    const unit = await unitsRepository.findById(unitId);
    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    // Verify user has access to manage this property
    await this.ensurePropertyAccess(unit.propertyId, userId, userRole, true);

    // If changing property ID, check that user has access to the new property as well
    if (unitData.propertyId && unitData.propertyId !== unit.propertyId) {
      await this.ensurePropertyAccess(
        unitData.propertyId,
        userId,
        userRole,
        true
      );

      // Also verify that the new property exists
      const newProperty = await propertiesRepository.findById(
        unitData.propertyId
      );
      if (!newProperty) {
        throw new NotFoundError("New property not found");
      }
    }

    return unitsRepository.update(unitId, unitData);
  }

  /**
   * Delete a unit
   */
  async deleteUnit(
    unitId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check if unit exists
    const unit = await unitsRepository.findById(unitId);
    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    // Verify user has access to manage this property
    await this.ensurePropertyAccess(unit.propertyId, userId, userRole, true);

    try {
      await unitsRepository.delete(unitId);
    } catch (error: any) {
      if (error.message === "Cannot delete unit with active leases") {
        throw new ConflictError(
          "Cannot delete unit with active leases. Please terminate all leases for this unit first."
        );
      }
      throw error;
    }
  }

  /**
   * Update unit status
   */
  async updateUnitStatus(
    unitId: string,
    status: string,
    userId: string,
    userRole: string
  ): Promise<Unit> {
    // Check if unit exists
    const unit = await unitsRepository.findById(unitId);
    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    // Verify user has access to manage this property
    await this.ensurePropertyAccess(unit.propertyId, userId, userRole, true);

    // Check if current status is "occupied" and trying to change to something else
    // This should only be allowed through lease termination
    if (unit.status === "occupied" && status !== "occupied") {
      // Check if there are active leases
      const hasActiveLeases = await this.unitHasActiveLeases(unitId);
      if (hasActiveLeases) {
        throw new ConflictError(
          "Cannot change status of an occupied unit with active leases. Please terminate leases first."
        );
      }
    }

    return unitsRepository.updateStatus(unitId, status);
  }

  /**
   * Get unit statistics
   */
  async getUnitStats(
    propertyId: string | undefined,
    userId: string,
    userRole: string
  ): Promise<UnitStats> {
    // If propertyId is provided, ensure user has access
    if (propertyId) {
      await this.ensurePropertyAccess(propertyId, userId, userRole);
    }

    return unitsRepository.getUnitStats(propertyId);
  }

  /**
   * Find vacant units in a property
   */
  async getVacantUnits(
    propertyId: string,
    userId: string,
    userRole: string
  ): Promise<Unit[]> {
    // Verify user has access to this property
    await this.ensurePropertyAccess(propertyId, userId, userRole);

    return unitsRepository.findVacantUnits(propertyId);
  }

  /**
   * Helper method to check if user has access to a property
   */
  private async ensurePropertyAccess(
    propertyId: string,
    userId: string,
    userRole: string,
    requireManagePermission = false
  ): Promise<void> {
    // Admins have access to all properties
    if (userRole === "ADMIN") {
      return;
    }

    // For landlords, check if they own the property
    if (userRole === "LANDLORD") {
      const property = await propertiesRepository.findByIdAndOwner(
        propertyId,
        userId
      );
      if (!property) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }
      return;
    }

    // For caretakers, check if they are assigned to the property
    if (userRole === "CARETAKER") {
      const property = await propertiesRepository.findById(propertyId);
      if (!property || property.caretakerId !== userId) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }

      // If manage permission is required, caretakers should have it for units
      return;
    }

    // For agents, check if they are assigned to the property
    if (userRole === "AGENT") {
      const property = await propertiesRepository.findById(propertyId);
      if (!property || property.agentId !== userId) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }

      // If manage permission is required and role is AGENT, throw error
      // Agents typically can view but not manage units
      if (requireManagePermission) {
        throw new PermissionError(
          "Agents do not have permission to manage units"
        );
      }
      return;
    }

    // Default case - no access
    throw new PermissionError(
      "You do not have permission to access this property"
    );
  }

  /**
   * Helper method to check if a unit has active leases
   */
  private async unitHasActiveLeases(unitId: string): Promise<boolean> {
    const unit = await unitsRepository.findById(unitId, true);
    return unit?.activeLeases && unit.activeLeases.length > 0;
  }
}

// Export a singleton instance
export const unitsService = new UnitsService();
