import { Router } from "express";
import { checkSessionController, loginController, logoutController, registerController, verifyEmailController } from "../controllers/authController.js";
const router = Router();
router.post("/register", registerController);
router.get("/verify-email", verifyEmailController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", checkSessionController);
export default router;
