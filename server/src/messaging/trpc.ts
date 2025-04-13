import { router } from "@/trpc/core";
import { protectedProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  messageFilterDto,
  messageIdDto,
  messageTemplateDto,
  sendMessageDto,
  templateIdDto,
} from "./dto/messaging.dto";
import { messagingService } from "./services/messaging.service";

export const messagingRouter = router({
  // Get all messages with filtering and pagination
  getAll: protectedProcedure
    .input(messageFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        return await messagingService.getMessages(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),

  // Get message by ID
  getById: protectedProcedure
    .input(messageIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return await messagingService.getMessageById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch message",
        });
      }
    }),

  // Send a new message
  send: protectedProcedure
    .input(sendMessageDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await messagingService.sendMessage(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Error sending message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Delete a message
  delete: protectedProcedure
    .input(messageIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await messagingService.deleteMessage(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error deleting message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete message",
        });
      }
    }),

  // Get all message templates
  getTemplates: protectedProcedure
    .input(
      z
        .object({
          propertyId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        return await messagingService.getTemplates(
          ctx.user.id,
          input?.propertyId
        );
      } catch (error: any) {
        console.error("Error fetching templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch templates",
        });
      }
    }),

  // Get template by ID
  getTemplateById: protectedProcedure
    .input(templateIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return await messagingService.getTemplateById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch template",
        });
      }
    }),

  // Create a new template
  createTemplate: protectedProcedure
    .input(messageTemplateDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await messagingService.createTemplate(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  // Update a template
  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        template: messageTemplateDto,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await messagingService.updateTemplate(
          input.id,
          input.template,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Error updating template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  // Delete a template
  deleteTemplate: protectedProcedure
    .input(templateIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await messagingService.deleteTemplate(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error deleting template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),
});
