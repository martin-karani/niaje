import { Router } from "express";
import * as authController from "../controller/auth.controller";

/**
 * Create and configure auth routes
 */
const router = Router();

// All other auth routes go through the auth handler
router.all("/*splat", authController.handleAuthRequest);

export const authRoutes = router;
