// src/middleware/team-access.middleware.ts
import { db } from "@/db";
import { member, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";

export async function teamAccessMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Skip if no authenticated user
    if (!req.user) {
      return next();
    }
    
    // Extract property ID from request
    const propertyId = 
      req.params.propertyId || 
      req.body.propertyId ||
      req.query.propertyId as string;
      
    if (!propertyId) {
      return next();
    }
    
    // Skip for admin or agent owner roles who have global access
    if (req.user.role === 'admin' || req.user.role === 'agent_owner') {
      return next();
    }
    
    // For agent_staff, check if they're in the team responsible for this property
    if (req.user.role === 'agent_staff') {
      // Get the user's team membership
      const userMembership = await db.query.member.findFirst({
        where: eq(member.userId, req.user.id),
        columns: {
          teamId: true
        }
      });
      
      if (!userMembership?.teamId) {
        // User not assigned to a team, can't access this property
        return res.status(403).json({
          error: "Access Denied",
          message: "You don't have permission to access this property"
        });
      }
      
      // Get property metadata to check team assignment
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, propertyId)
      });
      
      if (!property) {
        return res.status(404).json({
          error: "Not Found",
          message: "Property not found"
        });
      }
      
      // Check if property is assigned to user's team
      const propertyMetadata = property.metadata as any;
      if (!propertyMetadata?.teamId || propertyMetadata.teamId !== userMembership.teamId) {
        return res.status(403).json({
          error: "Access Denied",
          message: "This property is managed by a different team"
        });
      }
    }
    
    // Access granted
    next();
  } catch (error) {
    console.error("Team access middleware error:", error);
    next(error);
  }
}