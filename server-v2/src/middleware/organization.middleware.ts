// src/middleware/organization.middleware.ts
import { db } from "@/db";
import { member, organization, properties, tenants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware to resolve and attach organization context 
 * based on user role and access
 */
export async function organizationMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Skip for auth routes
    if (req.path.startsWith('/api/auth')) {
      return next();
    }

    // Skip if no authenticated user
    if (!req.user) {
      return next();
    }

    // Extract organization ID from the request
    const organizationId = 
      req.params.organizationId ||
      req.body.organizationId ||
      req.query.organizationId as string;

    if (!organizationId) {
      return next();
    }

    // Check access based on user role
    const user = req.user;

    switch (user.role) {
      case 'agent_owner':
      case 'agent_staff':
        // Check if user is a member of this organization
        const membership = await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, organizationId),
            eq(member.userId, user.id)
          )
        });

        if (membership) {
          req.activeOrganization = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId)
          });
          
          // Also attach team context if available
          if (membership.teamId) {
            const userTeam = await db.query.team.findFirst({
              where: eq(team.id, membership.teamId)
            });
            if (userTeam) {
              req.activeTeam = userTeam;
            }
          }
        }
        break;

      case 'property_owner':
        // Check if user owns properties managed by this organization
        const ownerProperties = await db.query.properties.findFirst({
          where: and(
            eq(properties.organizationId, organizationId),
            eq(properties.ownerId, user.id)
          )
        });

        if (ownerProperties) {
          req.activeOrganization = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId)
          });
        }
        break;

      case 'caretaker':
        // Check if user is assigned as caretaker to any properties in this org
        const caretakerProperties = await db.query.properties.findFirst({
          where: and(
            eq(properties.organizationId, organizationId),
            eq(properties.caretakerId, user.id)
          )
        });

        if (caretakerProperties) {
          req.activeOrganization = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId)
          });
        }
        break;
        
      case 'tenant_user':
        // Check if user is a tenant in this organization
        const tenant = await db.query.tenants.findFirst({
          where: and(
            eq(tenants.organizationId, organizationId),
            eq(tenants.userId, user.id)
          )
        });
        
        if (tenant) {
          req.activeOrganization = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId)
          });
          // Also attach tenant info for convenience
          req.activeTenant = tenant;
        }
        break;
    }

    next();
  } catch (error) {
    console.error("Organization middleware error:", error);
    next();
  }
}