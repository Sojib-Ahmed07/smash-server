import { Router } from "express";
import { registerController, verifyEmailController } from "../controllers/authController.js";
const router = Router();
router.post("/register", registerController);
router.get("/verify-email", verifyEmailController);
export default router;
