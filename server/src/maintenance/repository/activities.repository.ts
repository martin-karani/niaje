import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { ActivityWithRelations } from "../types";

export class ActivitiesRepository {
  /**
   * Find activities with filtering by date range and grouping
   */
  async findActivities(
    filters?: ActivityFilterDto
  ): Promise<Record<string, ActivityWithRelations[]>> {
    const now = new Date();

    // Calculate date ranges
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Get all activities within last week
    const allActivities = await db.query.activities.findMany({
      where: gte(activities.createdAt, lastWeekStart),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        unit: {
          with: {
            property: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // Group activities
    const grouped: Record<string, ActivityWithRelations[]> = {
      today: [],
      yesterday: [],
      lastWeek: [],
    };

    allActivities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);

      if (activityDate >= today) {
        grouped.today.push(activity);
      } else if (activityDate >= yesterday && activityDate < today) {
        grouped.yesterday.push(activity);
      } else {
        grouped.lastWeek.push(activity);
      }
    });

    return grouped;
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
import { Activity, NewActivity } from "@/db/schema/activities";

// Export a singleton instance
export const activitiesRepository = new ActivitiesRepository();
