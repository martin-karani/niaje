import { GraphQLContext } from "@infrastructure/graphql/context/types";
import { AuthorizationError } from "@shared/errors/authorization.error";
import {
  FinancialReportDto,
  MaintenanceReportDto,
  TenantReportDto,
} from "../dto/reports.dto";
import { reportsService } from "../services/reports.service";

/**
 * Helper function to check reporting permissions
 */
function checkReportPermissions(
  context: GraphQLContext,
  requiredFeature: "basic" | "advanced" = "basic"
): { organizationId: string } {
  const { user, organization, permissions, features } = context;

  if (!user || !organization) {
    throw new AuthorizationError("Authentication required");
  }

  const { id: organizationId } = organization;

  // For basic reporting, require property view permissions
  if (requiredFeature === "basic" && !permissions.canViewProperties) {
    throw new AuthorizationError("You don't have permission to view reports");
  }

  // For advanced reporting, check subscription feature and permissions
  if (requiredFeature === "advanced") {
    if (!features.advancedReporting) {
      throw new AuthorizationError(
        "Advanced reporting requires an upgraded subscription plan"
      );
    }

    if (!permissions.canViewProperties) {
      throw new AuthorizationError(
        "You don't have permission to view advanced reports"
      );
    }
  }

  return { organizationId };
}

export const reportsResolvers = {
  Query: {
    // Financial reports
    financialReport: async (
      _: any,
      { startDate, endDate, propertyId }: FinancialReportDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkReportPermissions(context, "basic");

      // Parse date strings to Date objects
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      return reportsService.generateFinancialSummary(
        organizationId,
        parsedStartDate,
        parsedEndDate,
        propertyId
      );
    },

    // Maintenance reports
    maintenanceReport: async (
      _: any,
      { startDate, endDate, propertyId }: MaintenanceReportDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkReportPermissions(context, "basic");

      // Parse date strings to Date objects
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      return reportsService.generateMaintenanceReport(
        organizationId,
        parsedStartDate,
        parsedEndDate,
        propertyId
      );
    },

    // Tenant reports
    tenantReport: async (
      _: any,
      { propertyId }: TenantReportDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkReportPermissions(context, "advanced");

      return reportsService.generateTenantReport(organizationId, propertyId);
    },
  },
};
