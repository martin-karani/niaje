import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { Activity, ActivityWithRelations } from "../types";

export class ActivitiesRepository {
  /**
   * Find activities with filtering by date range and grouping
   */
  async findActivities(
    filters?: ActivityFilterDto
  ): Promise<Record<string, ActivityWithRelations[]>> {
    try {
      const now = new Date();

      // Calculate date ranges
      const today = new Date(now.setHours(0, 0, 0, 0));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Initialize the grouped structure
      const grouped: Record<string, ActivityWithRelations[]> = {
        today: [],
        yesterday: [],
        lastWeek: [],
      };

      // Get all activities within last week - use simpler query first
      const allActivities = await db.query.activities.findMany({
        where: gte(activities.createdAt, lastWeekStart),
        orderBy: [{ createdAt: "desc" }],
      });

      // Fetch related data separately to avoid join issues
      for (const activity of allActivities) {
        const activityWithRelations: ActivityWithRelations = {
          ...activity,
          user: undefined,
          unit: undefined,
        };

        // Only try to fetch user data if userId exists
        if (activity.userId) {
          try {
            const user = await db.query.users.findFirst({
              where: eq(db.users.id, activity.userId),
              columns: {
                id: true,
                name: true,
                role: true,
                image: true,
              },
            });
            if (user) {
              activityWithRelations.user = user;
            }
          } catch (err) {
            console.warn(
              `Failed to fetch user for activity ${activity.id}:`,
              err
            );
          }
        }

        // Only try to fetch unit data if unitId exists
        if (activity.unitId) {
          try {
            const unit = await db.query.units.findFirst({
              where: eq(db.units.id, activity.unitId),
              with: {
                property: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            });
            if (unit) {
              activityWithRelations.unit = unit;
            }
          } catch (err) {
            console.warn(
              `Failed to fetch unit for activity ${activity.id}:`,
              err
            );
          }
        }

        // Group activities by date
        const activityDate = new Date(activity.createdAt);
        if (activityDate >= today) {
          grouped.today.push(activityWithRelations);
        } else if (activityDate >= yesterday && activityDate < today) {
          grouped.yesterday.push(activityWithRelations);
        } else {
          grouped.lastWeek.push(activityWithRelations);
        }
      }

      return grouped;
    } catch (error) {
      console.error("Error in findActivities:", error);
      // Return empty groups rather than throwing error
      return {
        today: [],
        yesterday: [],
        lastWeek: [],
      };
    }
  }

  /**
   * Record a new activity
   */
  async recordActivity(activityData: NewActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();

    return activity;
  }

  /**
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  /**
   * Delete all activities for a user
   */
  async deleteAllActivities(userId: string): Promise<void> {
    await db.delete(activities).where(eq(activities.userId, userId));
  }
}

// Define Activity Filter DTO type
export interface ActivityFilterDto {
  userId?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Import these types from your schema
import { NewActivity } from "@/db/schema/activities";

// Export a singleton instance
export const activitiesRepository = new ActivitiesRepository();
