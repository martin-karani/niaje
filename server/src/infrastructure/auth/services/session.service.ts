// src/infrastructure/auth/services/session.service.ts

import {
  sessionEntity,
  type NewSession,
  type Session,
} from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(data: Omit<NewSession, "token">): Promise<string> {
    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");

    // Create session
    await db.insert(sessionEntity).values({
      userId: data.userId,
      expiresAt: data.expiresAt,
      token,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      data: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return token;
  }

  /**
   * Get session by token
   */
  async getSessionByToken(token: string): Promise<Session & { user: any }> {
    const session = await db.query.sessionEntity.findFirst({
      where: eq(sessionEntity.token, token),
      with: {
        user: true,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(token);
      throw new NotFoundError("Session has expired");
    }

    return session;
  }

  /**
   * Delete session
   */
  async deleteSession(token: string): Promise<void> {
    await db.delete(sessionEntity).where(eq(sessionEntity.token, token));
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessionEntity).where(eq(sessionEntity.userId, userId));
  }

  /**
   * Update session data
   */
  async updateSessionData(token: string, data: any): Promise<Session> {
    const session = await db.query.sessionEntity.findFirst({
      where: eq(sessionEntity.token, token),
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    // Merge existing data with new data
    const updatedData = {
      ...(session.data || {}),
      ...data,
    };

    const [updatedSession] = await db
      .update(sessionEntity)
      .set({
        data: updatedData,
        updatedAt: new Date(),
      })
      .where(eq(sessionEntity.token, token))
      .returning();

    return updatedSession;
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    token: string,
    expiresInMs: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<Session> {
    const [updatedSession] = await db
      .update(sessionEntity)
      .set({
        expiresAt: new Date(Date.now() + expiresInMs),
        updatedAt: new Date(),
      })
      .where(eq(sessionEntity.token, token))
      .returning();

    if (!updatedSession) {
      throw new NotFoundError("Session not found");
    }

    return updatedSession;
  }

  /**
   * Set active organization for session
   */
  async setActiveOrganization(
    token: string,
    organizationId: string
  ): Promise<Session> {
    return this.updateSessionData(token, {
      activeOrganizationId: organizationId,
    });
  }

  /**
   * Set active team for session
   */
  async setActiveTeam(token: string, teamId: string | null): Promise<Session> {
    return this.updateSessionData(token, { activeTeamId: teamId });
  }

  /**
   * Clear sessions older than the specified time
   */
  async clearExpiredSessions(): Promise<number> {
    const result = await db
      .delete(sessionEntity)
      .where(eq(sessionEntity.expiresAt, new Date()))
      .returning();

    return result.length;
  }
}

export const sessionService = new SessionService();
